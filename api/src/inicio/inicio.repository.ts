import type {
  FilaAvesPorRaza,
  FilaHoraPico,
  FilaMejorPonedora,
  FilaProduccionDia,
  FilaResumenInicio
} from './inicio.types';


export interface InicioRepository {
  resumen(criaderoId: string, ahoraIso: string): Promise<FilaResumenInicio | null>;
  mejorPonedora(criaderoId: string): Promise<FilaMejorPonedora | null>;
  horaPico(criaderoId: string): Promise<FilaHoraPico | null>;
  produccionSemana(criaderoId: string, ahoraIso: string): Promise<FilaProduccionDia[]>;
  avesPorRaza(criaderoId: string): Promise<FilaAvesPorRaza[]>;
}


// SQL de DashboardRepository.js de V1 con criadero_id en cada consulta, subconsulta y JOIN, y un solo
// instante `?` (ahoraIso) en lugar de 'now'. Parametros posicionales repitiendo el bind. Una llamada a D1
// por metodo (sin db.batch, sin bucles): el numero de llamadas no depende de los datos.

const SQL_RESUMEN = `
  SELECT
    a.activas, a.vendidas, a.fallecidas,
    a.sanas, a.tratamiento, a.enfermas,
    f.ingresos, f.egresos,
    jj.total, jj.ocupadas,
    h.hoy, h.mes, h.promedio
  FROM
    (SELECT
       COALESCE(SUM(CASE WHEN estado='ACTIVA'    THEN 1 ELSE 0 END), 0) AS activas,
       COALESCE(SUM(CASE WHEN estado='VENDIDA'   THEN 1 ELSE 0 END), 0) AS vendidas,
       COALESCE(SUM(CASE WHEN estado='FALLECIDA' THEN 1 ELSE 0 END), 0) AS fallecidas,
       COALESCE(SUM(CASE WHEN estado='ACTIVA' AND estado_salud='SANA'           THEN 1 ELSE 0 END), 0) AS sanas,
       COALESCE(SUM(CASE WHEN estado='ACTIVA' AND estado_salud='EN_TRATAMIENTO' THEN 1 ELSE 0 END), 0) AS tratamiento,
       COALESCE(SUM(CASE WHEN estado='ACTIVA' AND estado_salud='ENFERMA'        THEN 1 ELSE 0 END), 0) AS enfermas
     FROM aves WHERE criadero_id = ?) a,
    (SELECT
       COALESCE(SUM(CASE WHEN tipo='INGRESO' THEN valor ELSE 0 END), 0) AS ingresos,
       COALESCE(SUM(CASE WHEN tipo='EGRESO'  THEN valor ELSE 0 END), 0) AS egresos
     FROM movimientos_financieros
     WHERE criadero_id = ? AND strftime('%Y-%m', fecha) = strftime('%Y-%m', ?)) f,
    (SELECT
       COUNT(*) AS total,
       COALESCE(SUM(CASE WHEN EXISTS (SELECT 1 FROM aves x
                                      WHERE x.criadero_id = j.criadero_id
                                        AND x.jaula_actual_id = j.id AND x.estado = 'ACTIVA')
                         THEN 1 ELSE 0 END), 0) AS ocupadas
     FROM jaulas j WHERE j.criadero_id = ? AND j.activa = 1) jj,
    (SELECT
       COUNT(CASE WHEN date(fecha) = date(?) THEN 1 END) AS hoy,
       COUNT(CASE WHEN strftime('%Y-%m', fecha) = strftime('%Y-%m', ?) THEN 1 END) AS mes,
       ROUND(COUNT(CASE WHEN fecha >= date(?, '-6 day') THEN 1 END) / 7.0, 2) AS promedio
     FROM huevos WHERE criadero_id = ?) h`;

const SQL_MEJOR_PONEDORA = `
  SELECT a.codigo, COUNT(h.id) AS cantidad
  FROM huevos h
  INNER JOIN aves a ON a.id = h.ave_id AND a.criadero_id = h.criadero_id
  WHERE h.criadero_id = ?
  GROUP BY a.id, a.codigo
  ORDER BY cantidad DESC, a.codigo ASC
  LIMIT 1`;

const SQL_HORA_PICO = `
  SELECT strftime('%H', fecha) AS hora, COUNT(*) AS cantidad
  FROM huevos
  WHERE criadero_id = ?
  GROUP BY strftime('%H', fecha)
  ORDER BY cantidad DESC, hora DESC
  LIMIT 1`;

const SQL_PRODUCCION_SEMANA = `
  SELECT
    CASE strftime('%w', fecha)
      WHEN '0' THEN 'Domingo' WHEN '1' THEN 'Lunes' WHEN '2' THEN 'Martes'
      WHEN '3' THEN 'Miércoles' WHEN '4' THEN 'Jueves' WHEN '5' THEN 'Viernes'
      WHEN '6' THEN 'Sábado'
    END AS dia,
    COUNT(*) AS cantidad
  FROM huevos
  WHERE criadero_id = ? AND fecha >= date(?, '-6 day')
  GROUP BY strftime('%w', fecha)
  ORDER BY strftime('%w', fecha)`;

const SQL_AVES_POR_RAZA = `
  SELECT
    COALESCE(NULLIF(TRIM(raza), ''), 'Sin raza') AS raza,
    COUNT(*) AS cantidad,
    ROUND(COUNT(*) * 100.0 / NULLIF((SELECT COUNT(*) FROM aves WHERE criadero_id = ? AND estado = 'ACTIVA'), 0), 2) AS porcentaje
  FROM aves
  WHERE criadero_id = ? AND estado = 'ACTIVA'
  GROUP BY COALESCE(NULLIF(TRIM(raza), ''), 'Sin raza')
  ORDER BY cantidad DESC, raza ASC`;


export class D1InicioRepository implements InicioRepository {

  constructor(private db: D1Database) {}

  async resumen(criaderoId: string, ahoraIso: string): Promise<FilaResumenInicio | null> {
    return await this.db
      .prepare(SQL_RESUMEN)
      .bind(criaderoId, criaderoId, ahoraIso, criaderoId, ahoraIso, ahoraIso, ahoraIso, criaderoId)
      .first<FilaResumenInicio>();
  }

  async mejorPonedora(criaderoId: string): Promise<FilaMejorPonedora | null> {
    return await this.db.prepare(SQL_MEJOR_PONEDORA).bind(criaderoId).first<FilaMejorPonedora>();
  }

  async horaPico(criaderoId: string): Promise<FilaHoraPico | null> {
    return await this.db.prepare(SQL_HORA_PICO).bind(criaderoId).first<FilaHoraPico>();
  }

  async produccionSemana(criaderoId: string, ahoraIso: string): Promise<FilaProduccionDia[]> {
    const r = await this.db.prepare(SQL_PRODUCCION_SEMANA).bind(criaderoId, ahoraIso).all<FilaProduccionDia>();
    return r.results ?? [];
  }

  async avesPorRaza(criaderoId: string): Promise<FilaAvesPorRaza[]> {
    const r = await this.db.prepare(SQL_AVES_POR_RAZA).bind(criaderoId, criaderoId).all<FilaAvesPorRaza>();
    return r.results ?? [];
  }

}
