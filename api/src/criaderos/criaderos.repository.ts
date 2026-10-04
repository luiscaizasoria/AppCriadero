/**
 * Repository para operaciones de base de datos de Criaderos
 */

import { v7 as uuidv7 } from 'uuid';

export interface CatalogoItemInfo {
  id: string;
  criaderoId: string;
  catalogoCodigo: string;
  activo: number;
  deletedAt: string | null;
}

export interface CriaderoInfo {
  id: string;
  nombre: string;
  pais: string | null;
  provincia: string | null;
  ciudad: string | null;
  telefono: string | null;
  correoContacto: string | null;
  onboardingCompletado: number;
  version: number;
}

export interface CriaderoConfiguracionInfo {
  criaderoId: string;
  especiePrincipalItemId: string | null;
  razaPrincipalItemId: string | null;
  tipoCriaderoItemId: string | null;
  finalidadItemId: string | null;
}

export interface CriaderoRepository {
  userExistsAndActive(userId: string): Promise<boolean>;
  criaderoExists(criaderoId: string): Promise<boolean>;
  getCriaderoInfo(criaderoId: string): Promise<CriaderoInfo | null>;
  getCriaderoConfiguracion(criaderoId: string): Promise<CriaderoConfiguracionInfo | null>;
  getCatalogosByCodigo(codigos: string[]): Promise<Map<string, string>>;
  getCatalogoItemsInfo(itemIds: string[]): Promise<Map<string, CatalogoItemInfo>>;
  getConfiguracionVersion(criaderoId: string): Promise<number | null>;
  updateConfiguracion(data: {
    criaderoId: string;
    especiePrincipalItemId: string;
    razaPrincipalItemId: string;
    tipoCriaderoItemId: string;
    finalidadItemId: string;
    currentVersion: number;
  }): Promise<{ success: boolean; rowsAffected: number }>;
  completeOnboarding(criaderoId: string, currentVersion: number): Promise<{ success: boolean; rowsAffected: number }>;
  executeBatch(statements: D1PreparedStatement[]): Promise<void>;
  getDb(): D1Database;
}

export class D1CriaderoRepository implements CriaderoRepository {
  constructor(private db: D1Database) {}

  async userExistsAndActive(userId: string): Promise<boolean> {
    const result = await this.db
      .prepare('SELECT id FROM users WHERE id = ? AND active = 1 AND deleted_at IS NULL')
      .bind(userId)
      .first<{ id: string }>();

    return !!result;
  }

  async criaderoExists(criaderoId: string): Promise<boolean> {
    const result = await this.db
      .prepare('SELECT id FROM criaderos WHERE id = ? AND deleted_at IS NULL')
      .bind(criaderoId)
      .first<{ id: string }>();

    return !!result;
  }

  async getCriaderoInfo(criaderoId: string): Promise<CriaderoInfo | null> {
    const result = await this.db
      .prepare(`
        SELECT
          id,
          nombre,
          pais,
          provincia,
          ciudad,
          telefono,
          correo_contacto as correoContacto,
          onboarding_completado as onboardingCompletado,
          version
        FROM criaderos
        WHERE id = ? AND deleted_at IS NULL
      `)
      .bind(criaderoId)
      .first<CriaderoInfo>();

    return result ?? null;
  }

  async getCriaderoConfiguracion(criaderoId: string): Promise<CriaderoConfiguracionInfo | null> {
    const result = await this.db
      .prepare(`
        SELECT
          criadero_id as criaderoId,
          especie_principal_item_id as especiePrincipalItemId,
          raza_principal_item_id as razaPrincipalItemId,
          tipo_criadero_item_id as tipoCriaderoItemId,
          finalidad_item_id as finalidadItemId
        FROM criadero_configuracion
        WHERE criadero_id = ?
      `)
      .bind(criaderoId)
      .first<CriaderoConfiguracionInfo>();

    return result ?? null;
  }

  async getCatalogosByCodigo(codigos: string[]): Promise<Map<string, string>> {
    if (codigos.length === 0) {
      return new Map();
    }

    const placeholders = codigos.map(() => '?').join(',');
    const result = await this.db
      .prepare(`SELECT codigo, id FROM catalogos WHERE codigo IN (${placeholders})`)
      .bind(...codigos)
      .all<{ codigo: string; id: string }>();

    const map = new Map<string, string>();
    for (const row of result.results) {
      map.set(row.codigo, row.id);
    }

    return map;
  }

  async getCatalogoItemsInfo(itemIds: string[]): Promise<Map<string, CatalogoItemInfo>> {
    if (itemIds.length === 0) {
      return new Map();
    }

    const placeholders = itemIds.map(() => '?').join(',');
    const result = await this.db
      .prepare(`
        SELECT
          ci.id,
          ci.criadero_id as criaderoId,
          c.codigo as catalogoCodigo,
          ci.activo,
          ci.deleted_at as deletedAt
        FROM catalogo_items ci
        INNER JOIN catalogos c ON ci.catalogo_id = c.id
        WHERE ci.id IN (${placeholders})
      `)
      .bind(...itemIds)
      .all<CatalogoItemInfo>();

    const map = new Map<string, CatalogoItemInfo>();
    for (const row of result.results) {
      map.set(row.id, row);
    }

    return map;
  }

  async getConfiguracionVersion(criaderoId: string): Promise<number | null> {
    const result = await this.db
      .prepare('SELECT version FROM criadero_configuracion WHERE criadero_id = ?')
      .bind(criaderoId)
      .first<{ version: number }>();

    return result?.version ?? null;
  }

  async updateConfiguracion(data: {
    criaderoId: string;
    especiePrincipalItemId: string;
    razaPrincipalItemId: string;
    tipoCriaderoItemId: string;
    finalidadItemId: string;
    currentVersion: number;
  }): Promise<{ success: boolean; rowsAffected: number }> {
    const result = await this.db
      .prepare(`
        UPDATE criadero_configuracion
        SET
          especie_principal_item_id = ?,
          raza_principal_item_id = ?,
          tipo_criadero_item_id = ?,
          finalidad_item_id = ?,
          updated_at = CURRENT_TIMESTAMP,
          version = version + 1
        WHERE criadero_id = ? AND version = ?
      `)
      .bind(
        data.especiePrincipalItemId,
        data.razaPrincipalItemId,
        data.tipoCriaderoItemId,
        data.finalidadItemId,
        data.criaderoId,
        data.currentVersion
      )
      .run();

    return {
      success: result.meta.changes > 0,
      rowsAffected: result.meta.changes,
    };
  }

  async completeOnboarding(criaderoId: string, currentVersion: number): Promise<{ success: boolean; rowsAffected: number }> {
    const result = await this.db
      .prepare(`
        UPDATE criaderos
        SET
          onboarding_completado = 1,
          updated_at = CURRENT_TIMESTAMP,
          version = version + 1
        WHERE id = ? AND deleted_at IS NULL AND onboarding_completado = 0 AND version = ?
      `)
      .bind(criaderoId, currentVersion)
      .run();

    return {
      success: result.meta.changes > 0,
      rowsAffected: result.meta.changes,
    };
  }

  async executeBatch(statements: D1PreparedStatement[]): Promise<void> {
    if (statements.length === 0) {
      return;
    }

    await this.db.batch(statements);
  }

  getDb(): D1Database {
    return this.db;
  }
}

export function generateCriaderoId(): string {
  return uuidv7();
}

export function generateCatalogoItemId(): string {
  return uuidv7();
}

export function generateConfiguracionId(): string {
  return uuidv7();
}
