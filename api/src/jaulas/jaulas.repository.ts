/**
 * Repository de Jaulas (SQL con prepared statements)
 */

import { v7 as uuidv7 } from 'uuid';
import type {
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
  /** Pone activa = 0 solo si estaba activa; devuelve las filas modificadas. */
  desactivar(criaderoId: string, jaulaId: string, fecha: string): Promise<number>;
}

export class D1JaulaRepository implements JaulaRepository {
  constructor(private db: D1Database) {}

  async listarActivas(criaderoId: string): Promise<JaulaListado[]> {
    // cantidadAves queda en 0 hasta la migracion 0006 (tabla aves).
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
          0 AS cantidadAves
        FROM jaulas
        WHERE criadero_id = ? AND activa = 1
        ORDER BY codigo
      `)
      .bind(criaderoId)
      .all<JaulaListado>();

    return result.results;
  }

  async listarInactivas(criaderoId: string): Promise<JaulaInactivaListado[]> {
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
          fecha_desactivacion AS fechaDesactivacion,
          0 AS cantidadAves
        FROM jaulas
        WHERE criadero_id = ? AND activa = 0
        ORDER BY
          COALESCE(fecha_desactivacion, fecha_actualizacion, fecha_creacion) DESC,
          codigo
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

  async desactivar(criaderoId: string, jaulaId: string, fecha: string): Promise<number> {
    const result = await this.db
      .prepare(`
        UPDATE jaulas
        SET
          activa = 0,
          fecha_desactivacion = ?,
          fecha_actualizacion = CURRENT_TIMESTAMP
        WHERE id = ? AND criadero_id = ? AND activa = 1
      `)
      .bind(fecha, jaulaId, criaderoId)
      .run();

    return result.meta.changes;
  }
}

export function generateJaulaId(): string {
  return uuidv7();
}
