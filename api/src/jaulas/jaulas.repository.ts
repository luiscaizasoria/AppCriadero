/**
 * Repository de Jaulas (SQL con prepared statements)
 */

import { v7 as uuidv7 } from 'uuid';
import type {
  AveDeJaula,
  AveHistoricaJaula,
  EventoHistorialJaula,
  LiberacionAve,
  JaulaDatos,
  JaulaDetalle,
  JaulaInactivaListado,
  JaulaListado,
} from './jaulas.types';

export interface JaulaRepository {
  listarActivas(criaderoId: string): Promise<JaulaListado[]>;
  listarInactivas(criaderoId: string): Promise<JaulaInactivaListado[]>;
  obtenerPorId(criaderoId: string, jaulaId: string): Promise<JaulaDetalle | null>;
  /** Puede lanzar el error UNIQUE de SQLite si el codigo ya existe en el criadero. */
  crear(criaderoId: string, id: string, datos: JaulaDatos): Promise<void>;
  /** Devuelve las filas modificadas (0 si la jaula no existe en el criadero). */
  actualizar(criaderoId: string, jaulaId: string, datos: JaulaDatos): Promise<number>;
  /** Aves de cualquier estado con jaula_actual_id = jaula (las que libera desactivarJaula). */
  listarAvesDeJaula(criaderoId: string, jaulaId: string): Promise<AveDeJaula[]>;
  /**
   * Atomico (db.batch): por cada liberacion escribe CAMBIO_JAULA (ave_historial, jaula_id NULL)
   * y SALIDA_AVE (jaula_historial); luego aves.jaula_actual_id = NULL de esa jaula y
   * jaulas.activa = 0 solo si estaba activa. Devuelve las filas de jaulas modificadas.
   */
  desactivarLiberandoAves(
    criaderoId: string,
    jaulaId: string,
    fecha: string,
    liberaciones: LiberacionAve[]
  ): Promise<number>;
  /** obtenerAvesHistoricasJaula de V1. */
  listarAvesHistoricas(criaderoId: string, jaulaId: string): Promise<AveHistoricaJaula[]>;
  /** obtenerHistorialCompletoJaula de V1. */
  listarHistorialCompleto(criaderoId: string, jaulaId: string): Promise<EventoHistorialJaula[]>;
}

/** Filas por INSERT multi-fila: respeta el limite de 100 parametros de D1. */
const FILAS_POR_INSERT = 15;

function trocear<T>(items: T[], tamano: number): T[][] {
  const grupos: T[][] = [];

  for (let i = 0; i < items.length; i += tamano) {
    grupos.push(items.slice(i, i + tamano));
  }

  return grupos;
}

export class D1JaulaRepository implements JaulaRepository {
  constructor(private db: D1Database) {}

  async listarActivas(criaderoId: string): Promise<JaulaListado[]> {
    // V1: COUNT de aves ACTIVA con jaula_actual_id = jaula.
    const result = await this.db
      .prepare(`
        SELECT
          j.id,
          j.codigo,
          j.nombre,
          j.ubicacion,
          j.tipo,
          j.estado_sanitario AS estadoSanitario,
          j.activa,
          j.fecha_creacion AS fechaCreacion,
          (
            SELECT COUNT(*) FROM aves a
            WHERE a.jaula_actual_id = j.id AND a.estado = 'ACTIVA'
          ) AS cantidadAves
        FROM jaulas j
        WHERE j.criadero_id = ? AND j.activa = 1
        ORDER BY j.codigo
      `)
      .bind(criaderoId)
      .all<JaulaListado>();

    return result.results;
  }

  async listarInactivas(criaderoId: string): Promise<JaulaInactivaListado[]> {
    const result = await this.db
      .prepare(`
        SELECT
          j.id,
          j.codigo,
          j.nombre,
          j.ubicacion,
          j.tipo,
          j.estado_sanitario AS estadoSanitario,
          j.activa,
          j.fecha_creacion AS fechaCreacion,
          j.fecha_actualizacion AS fechaActualizacion,
          j.fecha_desactivacion AS fechaDesactivacion,
          (
            SELECT COUNT(DISTINCT h.ave_id) FROM jaula_historial h
            WHERE h.jaula_id = j.id
          ) AS cantidadAves
        FROM jaulas j
        WHERE j.criadero_id = ? AND j.activa = 0
        ORDER BY
          COALESCE(j.fecha_desactivacion, j.fecha_actualizacion, j.fecha_creacion) DESC,
          j.codigo
      `)
      .bind(criaderoId)
      .all<JaulaInactivaListado>();

    return result.results;
  }

  async obtenerPorId(criaderoId: string, jaulaId: string): Promise<JaulaDetalle | null> {
    const result = await this.db
      .prepare(`
        SELECT
          id,
          codigo,
          nombre,
          ubicacion,
          tipo,
          estado_sanitario AS estadoSanitario,
          activa,
          fecha_creacion AS fechaCreacion,
          fecha_actualizacion AS fechaActualizacion,
          fecha_desactivacion AS fechaDesactivacion
        FROM jaulas
        WHERE id = ? AND criadero_id = ?
      `)
      .bind(jaulaId, criaderoId)
      .first<JaulaDetalle>();

    return result ?? null;
  }

  async crear(criaderoId: string, id: string, datos: JaulaDatos): Promise<void> {
    await this.db
      .prepare(`
        INSERT INTO jaulas
          (id, criadero_id, codigo, nombre, ubicacion, tipo, estado_sanitario, activa)
        VALUES (?, ?, ?, ?, ?, ?, 'NORMAL', 1)
      `)
      .bind(id, criaderoId, datos.codigo, datos.nombre, datos.ubicacion, datos.tipo)
      .run();
  }

  async actualizar(criaderoId: string, jaulaId: string, datos: JaulaDatos): Promise<number> {
    const result = await this.db
      .prepare(`
        UPDATE jaulas
        SET
          codigo = ?,
          nombre = ?,
          ubicacion = ?,
          tipo = ?,
          fecha_actualizacion = CURRENT_TIMESTAMP
        WHERE id = ? AND criadero_id = ?
      `)
      .bind(datos.codigo, datos.nombre, datos.ubicacion, datos.tipo, jaulaId, criaderoId)
      .run();

    return result.meta.changes;
  }

  async listarAvesDeJaula(criaderoId: string, jaulaId: string): Promise<AveDeJaula[]> {
    const result = await this.db
      .prepare(`
        SELECT id, codigo
        FROM aves
        WHERE criadero_id = ? AND jaula_actual_id = ?
        ORDER BY codigo
      `)
      .bind(criaderoId, jaulaId)
      .all<AveDeJaula>();

    return result.results;
  }

  async desactivarLiberandoAves(
    criaderoId: string,
    jaulaId: string,
    fecha: string,
    liberaciones: LiberacionAve[]
  ): Promise<number> {
    const sentencias: D1PreparedStatement[] = [];

    for (const grupo of trocear(liberaciones, FILAS_POR_INSERT)) {
      sentencias.push(
        this.db
          .prepare(`
            INSERT INTO ave_historial
              (id, criadero_id, ave_id, jaula_id, tipo_evento, fecha, detalle)
            VALUES ${grupo.map(() => "(?, ?, ?, NULL, 'CAMBIO_JAULA', ?, ?)").join(', ')}
          `)
          .bind(
            ...grupo.flatMap((l) => [l.historialAveId, criaderoId, l.aveId, fecha, l.detalleAve])
          )
      );

      sentencias.push(
        this.db
          .prepare(`
            INSERT INTO jaula_historial
              (id, criadero_id, jaula_id, ave_id, tipo_evento, fecha, detalle)
            VALUES ${grupo.map(() => "(?, ?, ?, ?, 'SALIDA_AVE', ?, ?)").join(', ')}
          `)
          .bind(
            ...grupo.flatMap((l) => [
              l.historialJaulaId, criaderoId, jaulaId, l.aveId, fecha, l.detalleJaula,
            ])
          )
      );
    }

    if (liberaciones.length > 0) {
      sentencias.push(
        this.db
          .prepare(`
            UPDATE aves
            SET jaula_actual_id = NULL, fecha_actualizacion = CURRENT_TIMESTAMP
            WHERE criadero_id = ? AND jaula_actual_id = ?
          `)
          .bind(criaderoId, jaulaId)
      );
    }

    sentencias.push(
      this.db
        .prepare(`
          UPDATE jaulas
          SET
            activa = 0,
            fecha_desactivacion = ?,
            fecha_actualizacion = CURRENT_TIMESTAMP
          WHERE id = ? AND criadero_id = ? AND activa = 1
        `)
        .bind(fecha, jaulaId, criaderoId)
    );

    const resultados = await this.db.batch(sentencias);

    return resultados[resultados.length - 1].meta.changes;
  }

  async listarAvesHistoricas(criaderoId: string, jaulaId: string): Promise<AveHistoricaJaula[]> {
    const result = await this.db
      .prepare(`
        SELECT DISTINCT
          a.id,
          a.codigo,
          a.raza,
          a.sexo,
          a.estado,
          a.foto_r2_key AS fotoUri
        FROM jaula_historial h
        INNER JOIN aves a ON a.id = h.ave_id
        WHERE h.jaula_id = ? AND h.criadero_id = ?
        ORDER BY a.codigo
      `)
      .bind(jaulaId, criaderoId)
      .all<AveHistoricaJaula>();

    return result.results;
  }

  async listarHistorialCompleto(
    criaderoId: string,
    jaulaId: string
  ): Promise<EventoHistorialJaula[]> {
    const result = await this.db
      .prepare(`
        SELECT
          h.id,
          h.jaula_id AS jaulaId,
          h.ave_id AS aveId,
          h.tipo_evento AS tipoEvento,
          h.fecha,
          h.detalle,
          a.codigo AS aveCodigo
        FROM jaula_historial h
        LEFT JOIN aves a ON a.id = h.ave_id
        WHERE h.jaula_id = ? AND h.criadero_id = ?
        ORDER BY h.fecha DESC, h.id DESC
      `)
      .bind(jaulaId, criaderoId)
      .all<EventoHistorialJaula>();

    return result.results;
  }
}

export function generateJaulaId(): string {
  return uuidv7();
}
