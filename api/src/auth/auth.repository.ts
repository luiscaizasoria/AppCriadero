/**
 * Repository para operaciones de autenticación en D1
 */

import type { D1Database, D1PreparedStatement } from '@cloudflare/workers-types';
import { v7 as uuidv7 } from 'uuid';

export interface UserInfo {
  id: string;
  email: string;
  nombre: string;
  password_hash: string | null;
  active: number;
  deleted_at: string | null;
}

export interface AuthRepository {
  findUserByEmail(email: string): Promise<UserInfo | null>;
  emailExists(email: string): Promise<boolean>;
  createUser(data: {
    id: string;
    email: string;
    nombre: string;
    passwordHash: string;
  }): Promise<void>;
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
          deleted_at
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
  }): Promise<void> {
    await this.db
      .prepare(`
        INSERT INTO users (id, email, nombre, password_hash, active)
        VALUES (?, ?, ?, ?, 1)
      `)
      .bind(data.id, data.email, data.nombre, data.passwordHash)
      .run();
  }

  getDb(): D1Database {
    return this.db;
  }
}

/**
 * Password hashing utilities using PBKDF2 + SHA-256
 */
const PBKDF2_ITERATIONS = 210000;
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

function constantTimeCompare(a: string, b: string): boolean {
  if (a.length !== b.length) {
    return false;
  }

  let result = 0;
  for (let i = 0; i < a.length; i++) {
    result |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }

  return result === 0;
}
