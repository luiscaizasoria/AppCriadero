/**
 * Repository para operaciones de base de datos de Criaderos
 */

import { v7 as uuidv7 } from 'uuid';

export interface CriaderoRepository {
  userExistsAndActive(userId: string): Promise<boolean>;
  getCatalogosByCodigo(codigos: string[]): Promise<Map<string, string>>;
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
