/**
 * Repository de limites de uso (ventana fija) en D1. Fechas en epoch ms.
 */

import type { D1Database } from '@cloudflare/workers-types';

export interface RateLimitHit {
  count: number;
  windowStart: number;
}

export interface RateLimitRepository {
  /** Una sola sentencia atomica: suma 1 (o reinicia la ventana vencida) y devuelve el estado. */
  hit(
    bucket: string,
    key: string,
    now: number,
    windowMs: number
  ): Promise<RateLimitHit>;

  /** Borra ventanas con window_start anterior a `olderThan`. */
  purgeExpired(olderThan: number): Promise<void>;
}

export class D1RateLimitRepository implements RateLimitRepository {
  constructor(private db: D1Database) {}

  async hit(
    bucket: string,
    key: string,
    now: number,
    windowMs: number
  ): Promise<RateLimitHit> {
    const cutoff = now - windowMs;

    const row = await this.db
      .prepare(`
        INSERT INTO rate_limits (bucket, key, window_start, count)
        VALUES (?, ?, ?, 1)
        ON CONFLICT(bucket, key) DO UPDATE SET
          count = CASE WHEN window_start <= ? THEN 1 ELSE count + 1 END,
          window_start = CASE WHEN window_start <= ? THEN ? ELSE window_start END
        RETURNING count, window_start
      `)
      .bind(bucket, key, now, cutoff, cutoff, now)
      .first<{ count: number; window_start: number }>();

    if (!row) {
      throw new Error('rate_limits no devolvio fila');
    }

    return { count: row.count, windowStart: row.window_start };
  }

  async purgeExpired(olderThan: number): Promise<void> {
    await this.db
      .prepare('DELETE FROM rate_limits WHERE window_start < ?')
      .bind(olderThan)
      .run();
  }
}
