/**
 * Repository de Catalogos (SQL con prepared statements)
 */

import { v7 as uuidv7 } from 'uuid';
import type {
  CatalogoDetalle,
  CatalogoItem,
  CatalogoItemEdicion,
  CatalogoItemNuevo,
  CatalogoListado,
} from './catalogs.types';

export interface CatalogoRepository {
  /** Catalogos activos (no borrados) de los codigos indicados, por nombre. */
  listarCatalogos(codigos: readonly string[]): Promise<CatalogoListado[]>;
  obtenerCatalogoPorCodigo(codigo: string): Promise<CatalogoDetalle | null>;
  /** Items activos del criadero y catalogo, por orden y nombre. */
  listarItems(criaderoId: string, catalogoId: string): Promise<CatalogoItem[]>;
  /** Cualquier estado (activo o no); null si no es de ese criadero y catalogo. */
  obtenerItem(criaderoId: string, catalogoId: string, itemId: string): Promise<CatalogoItem | null>;
  /** Puede lanzar el error UNIQUE de SQLite si el codigo ya existe en el catalogo. */
  crearItem(criaderoId: string, catalogoId: string, id: string, datos: CatalogoItemNuevo): Promise<void>;
  /** Cambia nombre y descripcion; devuelve las filas modificadas. */
  actualizarItem(
    criaderoId: string,
    catalogoId: string,
    itemId: string,
    datos: CatalogoItemEdicion
  ): Promise<number>;
  /** Pone activo = 0 (deleted_at no se toca); devuelve las filas modificadas. */
  desactivarItem(criaderoId: string, catalogoId: string, itemId: string): Promise<number>;
}

const COLUMNAS_ITEM = `
  id,
  codigo,
  nombre,
  descripcion,
  activo,
  COALESCE(orden, 0) AS orden
`;

export class D1CatalogoRepository implements CatalogoRepository {
  constructor(private db: D1Database) {}

  async listarCatalogos(codigos: readonly string[]): Promise<CatalogoListado[]> {
    const marcas = codigos.map(() => '?').join(', ');

    const result = await this.db
      .prepare(`
        SELECT id, codigo, nombre, activo
        FROM catalogos
        WHERE activo = 1 AND deleted_at IS NULL AND codigo IN (${marcas})
        ORDER BY nombre
      `)
      .bind(...codigos)
      .all<CatalogoListado>();

    return result.results;
  }

  async obtenerCatalogoPorCodigo(codigo: string): Promise<CatalogoDetalle | null> {
    const result = await this.db
      .prepare(`
        SELECT id, codigo, nombre
        FROM catalogos
        WHERE codigo = ? AND deleted_at IS NULL
      `)
      .bind(codigo)
      .first<CatalogoDetalle>();

    return result ?? null;
  }

  async listarItems(criaderoId: string, catalogoId: string): Promise<CatalogoItem[]> {
    const result = await this.db
      .prepare(`
        SELECT ${COLUMNAS_ITEM}
        FROM catalogo_items
        WHERE criadero_id = ? AND catalogo_id = ? AND activo = 1 AND deleted_at IS NULL
        ORDER BY COALESCE(orden, 0), nombre
      `)
      .bind(criaderoId, catalogoId)
      .all<CatalogoItem>();

    return result.results;
  }

  async obtenerItem(
    criaderoId: string,
    catalogoId: string,
    itemId: string
  ): Promise<CatalogoItem | null> {
    const result = await this.db
      .prepare(`
        SELECT ${COLUMNAS_ITEM}
        FROM catalogo_items
        WHERE id = ? AND criadero_id = ? AND catalogo_id = ? AND deleted_at IS NULL
      `)
      .bind(itemId, criaderoId, catalogoId)
      .first<CatalogoItem>();

    return result ?? null;
  }

  async crearItem(
    criaderoId: string,
    catalogoId: string,
    id: string,
    datos: CatalogoItemNuevo
  ): Promise<void> {
    await this.db
      .prepare(`
        INSERT INTO catalogo_items
          (id, criadero_id, catalogo_id, codigo, nombre, descripcion, activo, orden)
        VALUES (?, ?, ?, ?, ?, ?, 1, 0)
      `)
      .bind(id, criaderoId, catalogoId, datos.codigo, datos.nombre, datos.descripcion)
      .run();
  }

  async actualizarItem(
    criaderoId: string,
    catalogoId: string,
    itemId: string,
    datos: CatalogoItemEdicion
  ): Promise<number> {
    const result = await this.db
      .prepare(`
        UPDATE catalogo_items
        SET nombre = ?, descripcion = ?, updated_at = CURRENT_TIMESTAMP
        WHERE id = ? AND criadero_id = ? AND catalogo_id = ? AND deleted_at IS NULL
      `)
      .bind(datos.nombre, datos.descripcion, itemId, criaderoId, catalogoId)
      .run();

    return result.meta.changes;
  }

  async desactivarItem(criaderoId: string, catalogoId: string, itemId: string): Promise<number> {
    const result = await this.db
      .prepare(`
        UPDATE catalogo_items
        SET activo = 0, updated_at = CURRENT_TIMESTAMP
        WHERE id = ? AND criadero_id = ? AND catalogo_id = ? AND deleted_at IS NULL
      `)
      .bind(itemId, criaderoId, catalogoId)
      .run();

    return result.meta.changes;
  }
}

export function generateCatalogoItemId(): string {
  return uuidv7();
}
