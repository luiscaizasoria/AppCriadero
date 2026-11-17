/**
 * Repository de codigos de verificacion de correo (D1).
 * Fechas expires_at / sent_at en epoch ms.
 */

import type { D1Database } from '@cloudflare/workers-types';

export const MAX_VERIFICATION_ATTEMPTS = 5;

export interface StoredCode {
  codeHash: string;
  salt: string;
  /** Intentos tras sumar el actual. */
  attempts: number;
}

export interface VerificationRepository {
  /** Un codigo activo por cuenta: reemplaza hash, sal y vigencia y pone attempts = 0. */
  upsertCode(data: {
    id: string;
    userId: string;
    codeHash: string;
    salt: string;
    expiresAt: number;
    sentAt: number;
  }): Promise<void>;

  /** true si hay un codigo vigente (no vencido). */
  hasActiveCode(userId: string, now: number): Promise<boolean>;

  /**
   * Suma un intento de forma atomica ANTES de comparar. Devuelve null si no hay
   * codigo, esta vencido o ya agoto los intentos.
   */
  registerAttempt(userId: string, now: number): Promise<StoredCode | null>;

  /** Atomico: marca la cuenta verificada y borra el codigo. */
  completeVerification(userId: string): Promise<void>;
}

export class D1VerificationRepository implements VerificationRepository {
  constructor(private db: D1Database) {}

  async upsertCode(data: {
    id: string;
    userId: string;
    codeHash: string;
    salt: string;
    expiresAt: number;
    sentAt: number;
  }): Promise<void> {
    await this.db
      .prepare(`
        INSERT INTO email_verification_codes
          (id, user_id, code_hash, salt, expires_at, attempts, sent_at)
        VALUES (?, ?, ?, ?, ?, 0, ?)
        ON CONFLICT(user_id) DO UPDATE SET
          code_hash = excluded.code_hash,
          salt = excluded.salt,
          expires_at = excluded.expires_at,
          sent_at = excluded.sent_at,
          attempts = 0,
          updated_at = CURRENT_TIMESTAMP
      `)
      .bind(
        data.id,
        data.userId,
        data.codeHash,
        data.salt,
        data.expiresAt,
        data.sentAt
      )
      .run();
  }

  async hasActiveCode(userId: string, now: number): Promise<boolean> {
    const row = await this.db
      .prepare(
        'SELECT id FROM email_verification_codes WHERE user_id = ? AND expires_at > ?'
      )
      .bind(userId, now)
      .first<{ id: string }>();

    return !!row;
  }

  async registerAttempt(
    userId: string,
    now: number
  ): Promise<StoredCode | null> {
    const row = await this.db
      .prepare(`
        UPDATE email_verification_codes
           SET attempts = attempts + 1, updated_at = CURRENT_TIMESTAMP
         WHERE user_id = ? AND attempts < ? AND expires_at > ?
        RETURNING code_hash, salt, attempts
      `)
      .bind(userId, MAX_VERIFICATION_ATTEMPTS, now)
      .first<{ code_hash: string; salt: string; attempts: number }>();

    if (!row) {
      return null;
    }

    return { codeHash: row.code_hash, salt: row.salt, attempts: row.attempts };
  }

  async completeVerification(userId: string): Promise<void> {
    await this.db.batch([
      this.db
        .prepare(`
          UPDATE users
             SET email_verified_at = CURRENT_TIMESTAMP, email_verified_via = 'CODE', updated_at = CURRENT_TIMESTAMP
           WHERE id = ? AND email_verified_at IS NULL
        `)
        .bind(userId),
      this.db
        .prepare('DELETE FROM email_verification_codes WHERE user_id = ?')
        .bind(userId),
    ]);
  }
}
