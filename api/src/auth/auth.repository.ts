/**
 * Repository para operaciones de autenticación en D1
 */

import type { D1Database, D1PreparedStatement } from '@cloudflare/workers-types';
import { constantTimeCompare } from '../shared/crypto';

export interface UserInfo {
  id: string;
  email: string;
  nombre: string;
  password_hash: string | null;
  active: number;
  deleted_at: string | null;
  email_verified_at: string | null;
}

export interface AuthRepository {
  findUserByEmail(email: string): Promise<UserInfo | null>;
  emailExists(email: string): Promise<boolean>;
  /** verified = true escribe email_verified_at = CURRENT_TIMESTAMP; false lo deja en NULL. */
  createUser(data: {
    id: string;
    email: string;
    nombre: string;
    passwordHash: string;
    verified: boolean;
  }): Promise<void>;
  /** Solo cuentas sin verificar: reemplaza nombre y hash de contraseña. */
  updateUnverifiedCredentials(
    userId: string,
    nombre: string,
    passwordHash: string
  ): Promise<void>;
  /** Borrado fisico, solo si la cuenta sigue sin verificar y sin criaderos. */
  deleteUnverifiedUser(userId: string): Promise<void>;
  /** Solo cuentas sin verificar: cambia el correo. */
  changeUnverifiedEmail(userId: string, email: string): Promise<void>;
  /** Limpieza oportunista: borra hasta `limit` cuentas sin verificar creadas antes de `cutoff` ('YYYY-MM-DD HH:MM:SS'). */
  purgeStaleUnverified(cutoff: string, limit: number): Promise<number>;
  getDb(): D1Database;
}

export class D1AuthRepository implements AuthRepository {
  constructor(private db: D1Database) {}

  async findUserByEmail(email: string): Promise<UserInfo | null> {
    const result = await this.db
      .prepare(`
        SELECT
          id,
          email,
          nombre,
          password_hash,
          active,
          deleted_at,
          email_verified_at
        FROM users
        WHERE email = ?
      `)
      .bind(email)
      .first<UserInfo>();

    return result ?? null;
  }

  async emailExists(email: string): Promise<boolean> {
    const result = await this.db
      .prepare('SELECT id FROM users WHERE email = ?')
      .bind(email)
      .first<{ id: string }>();

    return !!result;
  }

  async createUser(data: {
    id: string;
    email: string;
    nombre: string;
    passwordHash: string;
    verified: boolean;
  }): Promise<void> {
    await this.db
      .prepare(`
        INSERT INTO users (id, email, nombre, password_hash, active, email_verified_at)
        VALUES (?, ?, ?, ?, 1, CASE WHEN ? = 1 THEN CURRENT_TIMESTAMP ELSE NULL END)
      `)
      .bind(
        data.id,
        data.email,
        data.nombre,
        data.passwordHash,
        data.verified ? 1 : 0
      )
      .run();
  }

  async updateUnverifiedCredentials(
    userId: string,
    nombre: string,
    passwordHash: string
  ): Promise<void> {
    await this.db
      .prepare(`
        UPDATE users
           SET nombre = ?, password_hash = ?, updated_at = CURRENT_TIMESTAMP
         WHERE id = ? AND email_verified_at IS NULL
      `)
      .bind(nombre, passwordHash, userId)
      .run();
  }

  async deleteUnverifiedUser(userId: string): Promise<void> {
    await this.db
      .prepare(`
        DELETE FROM users
         WHERE id = ?
           AND email_verified_at IS NULL
           AND NOT EXISTS (SELECT 1 FROM criaderos c WHERE c.user_id = users.id)
      `)
      .bind(userId)
      .run();
  }

  async changeUnverifiedEmail(userId: string, email: string): Promise<void> {
    await this.db
      .prepare(`
        UPDATE users
           SET email = ?, updated_at = CURRENT_TIMESTAMP
         WHERE id = ? AND email_verified_at IS NULL
      `)
      .bind(email, userId)
      .run();
  }

  async purgeStaleUnverified(cutoff: string, limit: number): Promise<number> {
    const result = await this.db
      .prepare(`
        DELETE FROM users
         WHERE id IN (
           SELECT u.id FROM users u
            WHERE u.email_verified_at IS NULL
              AND u.google_sub IS NULL
              AND u.created_at < ?
              AND NOT EXISTS (SELECT 1 FROM criaderos c WHERE c.user_id = u.id)
            ORDER BY u.created_at
            LIMIT ?
         )
      `)
      .bind(cutoff, limit)
      .run();

    return result.meta?.changes ?? 0;
  }

  getDb(): D1Database {
    return this.db;
  }
}

/**
 * Password hashing utilities using PBKDF2 + SHA-256
 */
// workerd (Cloudflare Workers) rechaza PBKDF2 con más de 100000 iteraciones
// (NotSupportedError). Es el máximo; la verificación lee el número del hash guardado.
export const PBKDF2_ITERATIONS = 100000;
const SALT_LENGTH = 16;
const HASH_LENGTH = 32;

export async function generateSalt(): Promise<Uint8Array> {
  const salt = new Uint8Array(SALT_LENGTH);
  crypto.getRandomValues(salt);
  return salt;
}

export async function hashPassword(password: string): Promise<string> {
  const encoder = new TextEncoder();
  const passwordData = encoder.encode(password);
  const salt = await generateSalt();

  const key = await crypto.subtle.importKey(
    'raw',
    passwordData,
    'PBKDF2',
    false,
    ['deriveBits']
  );

  const derivedBits = await crypto.subtle.deriveBits(
    {
      name: 'PBKDF2',
      salt: salt,
      iterations: PBKDF2_ITERATIONS,
      hash: 'SHA-256',
    },
    key,
    HASH_LENGTH * 8
  );

  const hashArray = new Uint8Array(derivedBits);
  const saltBase64 = btoa(String.fromCharCode(...salt));
  const hashBase64 = btoa(String.fromCharCode(...hashArray));

  return `pbkdf2_sha256$${PBKDF2_ITERATIONS}$${saltBase64}$${hashBase64}`;
}

export async function verifyPassword(
  password: string,
  storedHash: string
): Promise<boolean> {
  try {
    const parts = storedHash.split('$');
    if (parts.length !== 4 || parts[0] !== 'pbkdf2_sha256') {
      return false;
    }

    const iterations = parseInt(parts[1], 10);
    const saltBase64 = parts[2];
    const storedHashBase64 = parts[3];

    const encoder = new TextEncoder();
    const passwordData = encoder.encode(password);

    const saltString = atob(saltBase64);
    const salt = new Uint8Array(saltString.length);
    for (let i = 0; i < saltString.length; i++) {
      salt[i] = saltString.charCodeAt(i);
    }

    const key = await crypto.subtle.importKey(
      'raw',
      passwordData,
      'PBKDF2',
      false,
      ['deriveBits']
    );

    const derivedBits = await crypto.subtle.deriveBits(
      {
        name: 'PBKDF2',
        salt: salt,
        iterations: iterations,
        hash: 'SHA-256',
      },
      key,
      HASH_LENGTH * 8
    );

    const hashArray = new Uint8Array(derivedBits);
    const computedHashBase64 = btoa(String.fromCharCode(...hashArray));

    return constantTimeCompare(computedHashBase64, storedHashBase64);
  } catch (error) {
    return false;
  }
}
