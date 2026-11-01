/**
 * Repository de Aves (SQL con prepared statements). Sin logica de negocio:
 * el servicio decide ids, fechas y textos; aqui solo se ejecuta el SQL de V1
 * (las operaciones con varios efectos van en un db.batch atomico).
 */

import { v7 as uuidv7 } from 'uuid';
import type {
  ActualizarAveInput,
  AveBajaListado,
  AveCandidataPadre,
  AveDetalle,
  AveFila,
  AveListado,
  AveParaAsignar,
  AveParentesco,
  AvePorJaula,
  CambiarJaulaInput,
  ContextoEvolucion,
  CrearAveInput,
  EstadoBajaAve,
  EventoAveInput,
  EvolucionInput,
  FinalizarTratamientoInput,
  HistorialAve,
} from './aves.types';

export interface JaulaBasica {
  id: string;
  codigo: string;
  activa: number;
}

export interface AveRepository {
  listarActivas(criaderoId: string): Promise<AveListado[]>;
  listarBajas(criaderoId: string, estado: EstadoBajaAve): Promise<AveBajaListado[]>;
  listarPorJaula(criaderoId: string, jaulaId: string): Promise<AvePorJaula[]>;
  listarParaAsignarJaula(criaderoId: string, jaulaId: string): Promise<AveParaAsignar[]>;
  /** Activas; con excluirAveId quita esa ave y todos sus descendientes (cualquier estado). */
  listarCandidatasPadres(criaderoId: string, excluirAveId: string | null): Promise<AveCandidataPadre[]>;
  /** codigoLimpio ya viene con trim y mayusculas; compara UPPER(TRIM(codigo)). */
  existeCodigo(criaderoId: string, codigoLimpio: string, excluirAveId: string | null): Promise<boolean>;
  obtenerPorId(criaderoId: string, aveId: string): Promise<AveDetalle | null>;
  obtenerFila(criaderoId: string, aveId: string): Promise<AveFila | null>;
  obtenerParentesco(criaderoId: string, aveId: string): Promise<AveParentesco | null>;
  /** UNA consulta de recorrido: ids de todos los descendientes del ave (sin incluirla). */
  obtenerIdsDescendientes(criaderoId: string, aveId: string): Promise<string[]>;
  obtenerJaula(criaderoId: string, jaulaId: string): Promise<JaulaBasica | null>;
  /** Puede lanzar el error UNIQUE de SQLite si el codigo ya existe en el criadero. */
  crear(criaderoId: string, input: CrearAveInput): Promise<void>;
  /** Puede lanzar el error UNIQUE de SQLite si el codigo ya existe en el criadero. */
  actualizar(criaderoId: string, input: ActualizarAveInput): Promise<void>;
  cambiarJaula(criaderoId: string, input: CambiarJaulaInput): Promise<void>;
  listarHistorial(criaderoId: string, aveId: string): Promise<HistorialAve[]>;
  insertarEvento(criaderoId: string, input: EventoAveInput): Promise<void>;
  obtenerContextoEvolucion(criaderoId: string, aveId: string): Promise<ContextoEvolucion | null>;
  registrarEvolucion(criaderoId: string, input: EvolucionInput): Promise<void>;
  finalizarTratamiento(criaderoId: string, input: FinalizarTratamientoInput): Promise<void>;
}

const COLUMNAS_LISTADO = `
  a.id,
  a.codigo,
  a.origen,
  a.fecha_nacimiento AS fechaNacimiento,
  a.edad_meses_compra AS edadMesesCompra,
  a.fecha_ingreso AS fechaIngreso,
  a.criadero_origen AS criaderoOrigen,
  a.metodo_envio AS metodoEnvio,
  a.raza,
  a.sexo,
  a.peso_gramos AS pesoGramos,
  a.altura_cm AS alturaCm,
  a.largo_cm AS largoCm,
  a.caracteristicas,
  a.foto_r2_key AS fotoUri,
  a.padre_id AS padreId,
  a.madre_id AS madreId,
  a.jaula_actual_id AS jaulaActualId,
  a.estado,
  a.estado_salud AS estadoSalud,
  a.fecha_creacion AS fechaCreacion,
  j.codigo AS jaulaCodigo,
  j.nombre AS jaulaNombre,
  p.codigo AS padreCodigo,
  m.codigo AS madreCodigo
`;

const JOINS_LISTADO = `
  LEFT JOIN jaulas j ON j.id = a.jaula_actual_id
  LEFT JOIN aves p ON p.id = a.padre_id
  LEFT JOIN aves m ON m.id = a.madre_id
`;

const COLUMNAS_FILA = `
  id,
  codigo,
  origen,
  fecha_nacimiento AS fechaNacimiento,
  edad_meses_compra AS edadMesesCompra,
  fecha_ingreso AS fechaIngreso,
  criadero_origen AS criaderoOrigen,
  metodo_envio AS metodoEnvio,
  raza,
  sexo,
  peso_gramos AS pesoGramos,
  altura_cm AS alturaCm,
  largo_cm AS largoCm,
  caracteristicas,
  foto_r2_key AS fotoUri,
  padre_id AS padreId,
  madre_id AS madreId,
  jaula_actual_id AS jaulaActualId,
  estado,
  fecha_creacion AS fechaCreacion
`;

const DESCENDIENTES_CTE = `
  WITH RECURSIVE descendientes(id) AS (
    SELECT id FROM aves
    WHERE criadero_id = ? AND (padre_id = ? OR madre_id = ?)
    UNION
    SELECT a.id FROM aves a
    INNER JOIN descendientes d ON a.padre_id = d.id OR a.madre_id = d.id
    WHERE a.criadero_id = ?
  )
`;

export class D1AveRepository implements AveRepository {
  constructor(private db: D1Database) {}

  async listarActivas(criaderoId: string): Promise<AveListado[]> {
    const result = await this.db
      .prepare(`
        SELECT ${COLUMNAS_LISTADO}
        FROM aves a
        ${JOINS_LISTADO}
        WHERE a.criadero_id = ? AND a.estado = 'ACTIVA'
        ORDER BY a.codigo
      `)
      .bind(criaderoId)
      .all<AveListado>();

    return result.results;
  }

  async listarBajas(criaderoId: string, estado: EstadoBajaAve): Promise<AveBajaListado[]> {
    // V1 hace INNER JOIN con bajas_ave (modulo de bajas, aun sin tabla en D1):
    // hasta entonces se listan las aves por estado, la mas reciente primero.
    const result = await this.db
      .prepare(`
        SELECT ${COLUMNAS_LISTADO}
        FROM aves a
        ${JOINS_LISTADO}
        WHERE a.criadero_id = ? AND a.estado = ?
        ORDER BY a.fecha_actualizacion DESC, a.codigo
      `)
      .bind(criaderoId, estado)
      .all<AveListado>();

    return result.results.map((fila) => {
      const { criaderoOrigen, metodoEnvio, fechaCreacion, ...resto } = fila;
      void criaderoOrigen;
      void metodoEnvio;
      void fechaCreacion;
      return resto;
    });
  }

  async listarPorJaula(criaderoId: string, jaulaId: string): Promise<AvePorJaula[]> {
    const result = await this.db
      .prepare(`
        SELECT
          a.id,
          a.codigo,
          a.origen,
          a.fecha_nacimiento AS fechaNacimiento,
          a.raza,
          a.caracteristicas,
          a.foto_r2_key AS fotoUri,
          a.jaula_actual_id AS jaulaActualId,
          a.estado
        FROM aves a
        WHERE a.criadero_id = ? AND a.estado = 'ACTIVA' AND a.jaula_actual_id = ?
        ORDER BY a.codigo
      `)
      .bind(criaderoId, jaulaId)
      .all<AvePorJaula>();

    return result.results;
  }

  async listarParaAsignarJaula(criaderoId: string, jaulaId: string): Promise<AveParaAsignar[]> {
    const result = await this.db
      .prepare(`
        SELECT
          a.id,
          a.codigo,
          a.raza,
          a.foto_r2_key AS fotoUri,
          a.jaula_actual_id AS jaulaActualId,
          j.codigo AS jaulaCodigo
        FROM aves a
        LEFT JOIN jaulas j ON j.id = a.jaula_actual_id
        WHERE a.criadero_id = ?
          AND a.estado = 'ACTIVA'
          AND (a.jaula_actual_id IS NULL OR a.jaula_actual_id <> ?)
        ORDER BY a.codigo
      `)
      .bind(criaderoId, jaulaId)
      .all<AveParaAsignar>();

    return result.results;
  }

  async listarCandidatasPadres(
    criaderoId: string,
    excluirAveId: string | null
  ): Promise<AveCandidataPadre[]> {
    if (!excluirAveId) {
      const result = await this.db
        .prepare(`
          SELECT id, codigo, raza, sexo
          FROM aves
          WHERE criadero_id = ? AND estado = 'ACTIVA'
          ORDER BY codigo
        `)
        .bind(criaderoId)
        .all<AveCandidataPadre>();

      return result.results;
    }

    const result = await this.db
      .prepare(`
        ${DESCENDIENTES_CTE}
        SELECT id, codigo, raza, sexo
        FROM aves
        WHERE criadero_id = ?
          AND estado = 'ACTIVA'
          AND id <> ?
          AND id NOT IN (SELECT id FROM descendientes)
        ORDER BY codigo
      `)
      .bind(criaderoId, excluirAveId, excluirAveId, criaderoId, criaderoId, excluirAveId)
      .all<AveCandidataPadre>();

    return result.results;
  }

  async existeCodigo(
    criaderoId: string,
    codigoLimpio: string,
    excluirAveId: string | null
  ): Promise<boolean> {
    const fila = excluirAveId
      ? await this.db
          .prepare(`
            SELECT id FROM aves
            WHERE criadero_id = ? AND UPPER(TRIM(codigo)) = ? AND id <> ?
            LIMIT 1
          `)
          .bind(criaderoId, codigoLimpio, excluirAveId)
          .first<{ id: string }>()
      : await this.db
          .prepare(`
            SELECT id FROM aves
            WHERE criadero_id = ? AND UPPER(TRIM(codigo)) = ?
            LIMIT 1
          `)
          .bind(criaderoId, codigoLimpio)
          .first<{ id: string }>();

    return !!fila;
  }

  async obtenerPorId(criaderoId: string, aveId: string): Promise<AveDetalle | null> {
    const fila = await this.db
      .prepare(`
        SELECT
          ${COLUMNAS_LISTADO},
          a.fecha_actualizacion AS fechaActualizacion,
          a.fecha_ultimo_control_salud AS fechaUltimoControlSalud
        FROM aves a
        ${JOINS_LISTADO}
        WHERE a.id = ? AND a.criadero_id = ?
      `)
      .bind(aveId, criaderoId)
      .first<AveDetalle>();

    return fila ?? null;
  }

  async obtenerFila(criaderoId: string, aveId: string): Promise<AveFila | null> {
    const fila = await this.db
      .prepare(`SELECT ${COLUMNAS_FILA} FROM aves WHERE id = ? AND criadero_id = ?`)
      .bind(aveId, criaderoId)
      .first<AveFila>();

    return fila ?? null;
  }

  async obtenerParentesco(criaderoId: string, aveId: string): Promise<AveParentesco | null> {
    const fila = await this.db
      .prepare('SELECT id, codigo, sexo FROM aves WHERE id = ? AND criadero_id = ?')
      .bind(aveId, criaderoId)
      .first<AveParentesco>();

    return fila ?? null;
  }

  async obtenerIdsDescendientes(criaderoId: string, aveId: string): Promise<string[]> {
    const result = await this.db
      .prepare(`
        ${DESCENDIENTES_CTE}
        SELECT id FROM descendientes WHERE id <> ?
      `)
      .bind(criaderoId, aveId, aveId, criaderoId, aveId)
      .all<{ id: string }>();

    return result.results.map((fila) => fila.id);
  }

  async obtenerJaula(criaderoId: string, jaulaId: string): Promise<JaulaBasica | null> {
    const fila = await this.db
      .prepare('SELECT id, codigo, activa FROM jaulas WHERE id = ? AND criadero_id = ?')
      .bind(jaulaId, criaderoId)
      .first<JaulaBasica>();

    return fila ?? null;
  }

  async crear(criaderoId: string, input: CrearAveInput): Promise<void> {
    const d = input.datos;

    const sentencias = [
      this.db
        .prepare(`
          INSERT INTO aves
            (id, criadero_id, codigo, origen, fecha_nacimiento, edad_meses_compra,
             fecha_ingreso, criadero_origen, metodo_envio, raza, sexo, peso_gramos,
             altura_cm, largo_cm, caracteristicas, foto_r2_key, padre_id, madre_id,
             jaula_actual_id, estado)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'ACTIVA')
        `)
        .bind(
          input.id, criaderoId, d.codigo, d.origen, d.fechaNacimiento, d.edadMesesCompra,
          d.fechaIngreso, d.criaderoOrigen, d.metodoEnvio, d.raza, d.sexo, d.pesoGramos,
          d.alturaCm, d.largoCm, d.caracteristicas, d.fotoUri, d.padreId, d.madreId,
          input.jaulaId
        ),
      this.db
        .prepare(`
          INSERT INTO ave_evolucion
            (id, criadero_id, ave_id, fecha, foto_r2_key, peso_gramos, altura_cm,
             largo_cm, caracteristicas, observacion)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'Registro inicial')
        `)
        .bind(
          input.evolucionId, criaderoId, input.id, input.fecha, d.fotoUri,
          d.pesoGramos, d.alturaCm, d.largoCm, d.caracteristicas
        ),
      this.db
        .prepare(`
          INSERT INTO ave_historial
            (id, criadero_id, ave_id, jaula_id, tipo_evento, fecha, detalle)
          VALUES (?, ?, ?, ?, 'ALTA', ?, ?)
        `)
        .bind(input.historialId, criaderoId, input.id, input.jaulaId, input.fecha, input.detalleAlta),
    ];

    if (input.jaulaId && input.jaulaHistorialId && input.detalleJaula) {
      sentencias.push(
        this.db
          .prepare(`
            INSERT INTO jaula_historial
              (id, criadero_id, jaula_id, ave_id, tipo_evento, fecha, detalle)
            VALUES (?, ?, ?, ?, 'INGRESO_AVE', ?, ?)
          `)
          .bind(
            input.jaulaHistorialId, criaderoId, input.jaulaId, input.id,
            input.fecha, input.detalleJaula
          )
      );
    }

    await this.db.batch(sentencias);
  }

  async actualizar(criaderoId: string, input: ActualizarAveInput): Promise<void> {
    const d = input.datos;

    await this.db.batch([
      this.db
        .prepare(`
          UPDATE aves
          SET
            codigo = ?,
            origen = ?,
            fecha_nacimiento = ?,
            edad_meses_compra = ?,
            fecha_ingreso = ?,
            criadero_origen = ?,
            metodo_envio = ?,
            raza = ?,
            sexo = ?,
            peso_gramos = ?,
            altura_cm = ?,
            largo_cm = ?,
            caracteristicas = ?,
            foto_r2_key = ?,
            padre_id = ?,
            madre_id = ?,
            fecha_actualizacion = CURRENT_TIMESTAMP
          WHERE id = ? AND criadero_id = ? AND estado = 'ACTIVA'
        `)
        .bind(
          d.codigo, d.origen, d.fechaNacimiento, d.edadMesesCompra, d.fechaIngreso,
          d.criaderoOrigen, d.metodoEnvio, d.raza, d.sexo, d.pesoGramos, d.alturaCm,
          d.largoCm, d.caracteristicas, d.fotoUri, d.padreId, d.madreId,
          input.aveId, criaderoId
        ),
      this.db
        .prepare(`
          INSERT INTO ave_historial
            (id, criadero_id, ave_id, jaula_id, tipo_evento, fecha, detalle)
          VALUES (?, ?, ?, ?, 'DATOS_ACTUALIZADOS', ?, ?)
        `)
        .bind(
          input.historialId, criaderoId, input.aveId, input.jaulaActualId,
          input.fecha, input.detalle
        ),
    ]);
  }

  async cambiarJaula(criaderoId: string, input: CambiarJaulaInput): Promise<void> {
    const sentencias = [
      this.db
        .prepare(`
          UPDATE aves
          SET jaula_actual_id = ?, fecha_actualizacion = CURRENT_TIMESTAMP
          WHERE id = ? AND criadero_id = ?
        `)
        .bind(input.nuevaJaulaId, input.aveId, criaderoId),
      this.db
        .prepare(`
          INSERT INTO ave_historial
            (id, criadero_id, ave_id, jaula_id, tipo_evento, fecha, detalle)
          VALUES (?, ?, ?, ?, 'CAMBIO_JAULA', ?, ?)
        `)
        .bind(
          input.historialId, criaderoId, input.aveId, input.nuevaJaulaId,
          input.fecha, input.detalleCambio
        ),
    ];

    if (input.jaulaAnteriorId && input.salida) {
      sentencias.push(
        this.db
          .prepare(`
            INSERT INTO jaula_historial
              (id, criadero_id, jaula_id, ave_id, tipo_evento, fecha, detalle)
            VALUES (?, ?, ?, ?, 'SALIDA_AVE', ?, ?)
          `)
          .bind(
            input.salida.id, criaderoId, input.jaulaAnteriorId, input.aveId,
            input.fecha, input.salida.detalle
          )
      );
    }

    if (input.nuevaJaulaId && input.ingreso) {
      sentencias.push(
        this.db
          .prepare(`
            INSERT INTO jaula_historial
              (id, criadero_id, jaula_id, ave_id, tipo_evento, fecha, detalle)
            VALUES (?, ?, ?, ?, 'INGRESO_AVE', ?, ?)
          `)
          .bind(
            input.ingreso.id, criaderoId, input.nuevaJaulaId, input.aveId,
            input.fecha, input.ingreso.detalle
          )
      );
    }

    await this.db.batch(sentencias);
  }

  async listarHistorial(criaderoId: string, aveId: string): Promise<HistorialAve[]> {
    const result = await this.db
      .prepare(`
        SELECT
          h.id,
          h.ave_id AS aveId,
          h.jaula_id AS jaulaId,
          h.tipo_evento AS tipoEvento,
          h.fecha,
          h.detalle,
          h.fecha_creacion AS fechaCreacion,
          j.codigo AS jaulaCodigo
        FROM ave_historial h
        LEFT JOIN jaulas j ON j.id = h.jaula_id
        WHERE h.ave_id = ? AND h.criadero_id = ?
        ORDER BY h.fecha DESC, h.id DESC
      `)
      .bind(aveId, criaderoId)
      .all<HistorialAve>();

    return result.results;
  }

  async insertarEvento(criaderoId: string, input: EventoAveInput): Promise<void> {
    await this.db
      .prepare(`
        INSERT INTO ave_historial
          (id, criadero_id, ave_id, tipo_evento, fecha, detalle)
        VALUES (?, ?, ?, ?, ?, ?)
      `)
      .bind(input.id, criaderoId, input.aveId, input.tipoEvento, input.fecha, input.detalle)
      .run();
  }

  async obtenerContextoEvolucion(
    criaderoId: string,
    aveId: string
  ): Promise<ContextoEvolucion | null> {
    const ave = await this.obtenerFila(criaderoId, aveId);

    if (!ave) return null;

    const total = await this.db
      .prepare('SELECT COUNT(*) AS total FROM ave_evolucion WHERE ave_id = ? AND criadero_id = ?')
      .bind(aveId, criaderoId)
      .first<{ total: number }>();

    return { ave, totalEvoluciones: Number(total?.total ?? 0) };
  }

  async registrarEvolucion(criaderoId: string, input: EvolucionInput): Promise<void> {
    const sentencias: D1PreparedStatement[] = [];

    if (input.inicial) {
      const i = input.inicial;

      sentencias.push(
        this.db
          .prepare(`
            INSERT INTO ave_evolucion
              (id, criadero_id, ave_id, fecha, foto_r2_key, peso_gramos, altura_cm,
               largo_cm, caracteristicas, observacion)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'Registro inicial')
          `)
          .bind(
            i.id, criaderoId, input.aveId, i.fecha, i.fotoUri, i.pesoGramos,
            i.alturaCm, i.largoCm, i.caracteristicas
          )
      );
    }

    sentencias.push(
      this.db
        .prepare(`
          UPDATE aves
          SET
            foto_r2_key = ?,
            peso_gramos = ?,
            altura_cm = ?,
            largo_cm = ?,
            caracteristicas = ?,
            fecha_actualizacion = CURRENT_TIMESTAMP
          WHERE id = ? AND criadero_id = ?
        `)
        .bind(
          input.fotoUri, input.pesoGramos, input.alturaCm, input.largoCm,
          input.caracteristicas, input.aveId, criaderoId
        ),
      this.db
        .prepare(`
          INSERT INTO ave_evolucion
            (id, criadero_id, ave_id, fecha, foto_r2_key, peso_gramos, altura_cm,
             largo_cm, caracteristicas, observacion)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `)
        .bind(
          input.evolucionId, criaderoId, input.aveId, input.fecha, input.fotoUri,
          input.pesoGramos, input.alturaCm, input.largoCm, input.caracteristicas,
          input.observacion
        ),
      this.db
        .prepare(`
          INSERT INTO ave_historial
            (id, criadero_id, ave_id, jaula_id, tipo_evento, fecha, detalle)
          VALUES (?, ?, ?, ?, 'EVOLUCION', ?, ?)
        `)
        .bind(
          input.historialId, criaderoId, input.aveId, input.jaulaActualId,
          input.fecha, input.detalle
        )
    );

    await this.db.batch(sentencias);
  }

  async finalizarTratamiento(
    criaderoId: string,
    input: FinalizarTratamientoInput
  ): Promise<void> {
    await this.db.batch([
      this.db
        .prepare(`
          UPDATE aves
          SET estado_salud = 'SANA', fecha_ultimo_control_salud = ?
          WHERE id = ? AND criadero_id = ?
        `)
        .bind(input.fecha, input.aveId, criaderoId),
      this.db
        .prepare(`
          UPDATE diagnosticos_ave
          SET estado = 'CERRADO'
          WHERE ave_id = ? AND criadero_id = ? AND estado = 'ACTIVO'
        `)
        .bind(input.aveId, criaderoId),
      this.db
        .prepare(`
          INSERT INTO ave_historial
            (id, criadero_id, ave_id, tipo_evento, fecha, detalle)
          VALUES (?, ?, ?, 'SALUD', ?, ?)
        `)
        .bind(input.saludId, criaderoId, input.aveId, input.fecha, input.detalleSalud),
    ]);
  }
}

export function generateAveId(): string {
  return uuidv7();
}
