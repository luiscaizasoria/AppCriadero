/**
 * Repositorio de Huevos. SQL con prepared statements. Los agregados replican el SQL de V1
 * (UTC, comparacion de cadenas, sin zona del criadero); `date('now')` se sustituye por el
 * parametro `ahora` (ISO UTC) que calcula el servicio, equivalente en produccion.
 */

import type {
  HuevoAve,
  ProduccionAve,
  ProduccionDia,
  ProduccionHora,
  ProduccionJaula,
  RankingPonedora,
  RegistrarHuevoInput,
  ResumenProduccion,
  TotalProduccion,
} from './huevos.types';

export interface HuevosRepository {
  existeAve(criaderoId: string, aveId: string): Promise<boolean>;
  existeJaula(criaderoId: string, jaulaId: string): Promise<boolean>;
  /** Inserta huevo + ave_historial en un batch y devuelve el codigo generado. */
  registrarHuevo(criaderoId: string, input: RegistrarHuevoInput): Promise<string>;
  siguienteCodigo(criaderoId: string): Promise<string>;
  listarPorAve(criaderoId: string, aveId: string): Promise<HuevoAve[]>;
  resumen(criaderoId: string, ahora: string): Promise<ResumenProduccion>;
  ranking(criaderoId: string): Promise<RankingPonedora[]>;
  porDia(criaderoId: string, ahora: string): Promise<ProduccionDia[]>;
  porDiaHistorico(criaderoId: string): Promise<ProduccionDia[]>;
  porHora(criaderoId: string): Promise<ProduccionHora[]>;
  porJaula(criaderoId: string): Promise<ProduccionJaula[]>;
  porAve(criaderoId: string): Promise<ProduccionAve[]>;
  total(criaderoId: string, ahora: string): Promise<TotalProduccion>;
}

const NOMBRE_DIA = `
  CASE strftime('%w', fecha)
    WHEN '0' THEN 'Domingo' WHEN '1' THEN 'Lunes' WHEN '2' THEN 'Martes'
    WHEN '3' THEN 'Miércoles' WHEN '4' THEN 'Jueves' WHEN '5' THEN 'Viernes'
    WHEN '6' THEN 'Sábado' END
`;

export class D1HuevosRepository implements HuevosRepository {
  constructor(private db: D1Database) {}

  async existeAve(criaderoId: string, aveId: string): Promise<boolean> {
    const fila = await this.db
      .prepare('SELECT id FROM aves WHERE id = ? AND criadero_id = ?')
      .bind(aveId, criaderoId)
      .first<{ id: string }>();

    return fila !== null;
  }

  async existeJaula(criaderoId: string, jaulaId: string): Promise<boolean> {
    const fila = await this.db
      .prepare('SELECT id FROM jaulas WHERE id = ? AND criadero_id = ?')
      .bind(jaulaId, criaderoId)
      .first<{ id: string }>();

    return fila !== null;
  }

  async registrarHuevo(criaderoId: string, input: RegistrarHuevoInput): Promise<string> {
    await this.db.batch([
      // Codigo = 'H' + COUNT(*)+1 del criadero, resuelto en el propio INSERT.
      this.db
        .prepare(`
          INSERT INTO huevos (id, criadero_id, codigo, ave_id, jaula_id, fecha, estado, observacion)
          SELECT ?, ?, 'H' || printf('%06d', COUNT(*) + 1), ?, ?, ?, 'REGISTRADO', ?
          FROM huevos
          WHERE criadero_id = ?
        `)
        .bind(
          input.huevoId, criaderoId, input.aveId, input.jaulaId, input.fecha,
          input.observacion, criaderoId
        ),
      // Lee codigo, fecha y jaula de la fila recien insertada.
      this.db
        .prepare(`
          INSERT INTO ave_historial (id, criadero_id, ave_id, jaula_id, tipo_evento, fecha, detalle)
          SELECT ?, criadero_id, ave_id, jaula_id, 'POSTURA_HUEVO', fecha, 'Registró huevo ' || codigo
          FROM huevos
          WHERE id = ?
        `)
        .bind(input.historialId, input.huevoId),
    ]);

    const fila = await this.db
      .prepare('SELECT codigo FROM huevos WHERE id = ?')
      .bind(input.huevoId)
      .first<{ codigo: string }>();

    return fila!.codigo;
  }

  async siguienteCodigo(criaderoId: string): Promise<string> {
    const fila = await this.db
      .prepare(`
        SELECT 'H' || printf('%06d', COUNT(*) + 1) AS codigo
        FROM huevos
        WHERE criadero_id = ?
      `)
      .bind(criaderoId)
      .first<{ codigo: string }>();

    return fila!.codigo;
  }

  async listarPorAve(criaderoId: string, aveId: string): Promise<HuevoAve[]> {
    const resultado = await this.db
      .prepare(`
        SELECT h.id, h.codigo, h.fecha, h.estado, h.observacion, j.codigo AS jaula_codigo
        FROM huevos h
        LEFT JOIN jaulas j ON j.id = h.jaula_id
        WHERE h.ave_id = ? AND h.criadero_id = ?
        ORDER BY h.fecha DESC, h.rowid DESC
      `)
      .bind(aveId, criaderoId)
      .all<Omit<HuevoAve, 'jaulaCodigo'> & { jaula_codigo: string | null }>();

    return resultado.results.map(({ jaula_codigo, ...resto }) => ({
      ...resto,
      jaulaCodigo: jaula_codigo,
    }));
  }

  async resumen(criaderoId: string, ahora: string): Promise<ResumenProduccion> {
    const fila = await this.db
      .prepare(`
        SELECT
          COUNT(CASE WHEN date(fecha) = date(?) THEN 1 END) AS hoy,
          COUNT(CASE WHEN fecha >= date(?, '-6 day') THEN 1 END) AS semana,
          COUNT(CASE WHEN strftime('%Y-%m', fecha) = strftime('%Y-%m', ?) THEN 1 END) AS mes
        FROM huevos
        WHERE criadero_id = ?
      `)
      .bind(ahora, ahora, ahora, criaderoId)
      .first<{ hoy: number; semana: number; mes: number }>();

    return {
      hoy: Number(fila?.hoy || 0),
      semana: Number(fila?.semana || 0),
      mes: Number(fila?.mes || 0),
    };
  }

  async ranking(criaderoId: string): Promise<RankingPonedora[]> {
    const resultado = await this.db
      .prepare(`
        SELECT a.id, a.codigo, a.raza, COUNT(h.id) AS cantidad
        FROM huevos h
        INNER JOIN aves a ON a.id = h.ave_id
        WHERE h.criadero_id = ?
        GROUP BY a.id, a.codigo, a.raza
        ORDER BY cantidad DESC
        LIMIT 10
      `)
      .bind(criaderoId)
      .all<RankingPonedora>();

    return resultado.results;
  }

  async porDia(criaderoId: string, ahora: string): Promise<ProduccionDia[]> {
    const resultado = await this.db
      .prepare(`
        SELECT ${NOMBRE_DIA} AS dia, COUNT(*) AS cantidad
        FROM huevos
        WHERE criadero_id = ? AND fecha >= date(?, '-6 day')
        GROUP BY strftime('%w', fecha)
        ORDER BY strftime('%w', fecha)
      `)
      .bind(criaderoId, ahora)
      .all<ProduccionDia>();

    return resultado.results;
  }

  async porDiaHistorico(criaderoId: string): Promise<ProduccionDia[]> {
    const resultado = await this.db
      .prepare(`
        SELECT ${NOMBRE_DIA} AS dia, COUNT(*) AS cantidad
        FROM huevos
        WHERE criadero_id = ?
        GROUP BY strftime('%w', fecha)
        ORDER BY cantidad DESC
      `)
      .bind(criaderoId)
      .all<ProduccionDia>();

    return resultado.results;
  }

  async porHora(criaderoId: string): Promise<ProduccionHora[]> {
    const resultado = await this.db
      .prepare(`
        SELECT strftime('%H', fecha) AS hora, COUNT(*) AS cantidad
        FROM huevos
        WHERE criadero_id = ?
        GROUP BY strftime('%H', fecha)
        ORDER BY cantidad DESC
      `)
      .bind(criaderoId)
      .all<ProduccionHora>();

    return resultado.results;
  }

  async porJaula(criaderoId: string): Promise<ProduccionJaula[]> {
    const resultado = await this.db
      .prepare(`
        SELECT j.id, j.codigo, COUNT(h.id) AS cantidad
        FROM huevos h
        INNER JOIN jaulas j ON j.id = h.jaula_id
        WHERE h.criadero_id = ?
        GROUP BY j.id, j.codigo
        ORDER BY cantidad DESC
      `)
      .bind(criaderoId)
      .all<ProduccionJaula>();

    return resultado.results;
  }

  async porAve(criaderoId: string): Promise<ProduccionAve[]> {
    const resultado = await this.db
      .prepare(`
        SELECT a.id, a.codigo, COUNT(h.id) AS cantidad
        FROM huevos h
        INNER JOIN aves a ON a.id = h.ave_id
        WHERE h.criadero_id = ?
        GROUP BY a.id, a.codigo
        ORDER BY cantidad DESC
        LIMIT 20
      `)
      .bind(criaderoId)
      .all<ProduccionAve>();

    return resultado.results;
  }

  async total(criaderoId: string, ahora: string): Promise<TotalProduccion> {
    const fila = await this.db
      .prepare(`
        SELECT COUNT(*) AS total,
          SUM(CASE WHEN date(fecha) = date(?) THEN 1 ELSE 0 END) AS hoy,
          SUM(CASE WHEN strftime('%Y-%m', fecha) = strftime('%Y-%m', ?) THEN 1 ELSE 0 END) AS mes
        FROM huevos
        WHERE criadero_id = ?
      `)
      .bind(ahora, ahora, criaderoId)
      .first<TotalProduccion>();

    return { total: fila!.total, hoy: fila!.hoy, mes: fila!.mes };
  }
}
