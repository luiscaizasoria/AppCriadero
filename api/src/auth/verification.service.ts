/**
 * Piezas de la verificacion por codigo: limites de uso, emision y envio del
 * codigo y comprobacion. Sin Hono ni D1 directo. Las usa AuthService.
 */

import { v7 as uuidv7 } from 'uuid';
import {
  constantTimeCompare,
  generateNumericCode,
  generateSaltBase64,
  sha256Hex,
} from '../shared/crypto';
import { EnvioCorreoConfigError, type EnvioCorreo } from './correo/envio-correo';
import type { ErrorResponse } from './auth.types';
import { CODE_EXPIRES_IN_SECONDS } from './auth.types';
import type { RateLimitRepository } from './rate-limit.repository';
import type { VerificationRepository } from './verification.repository';

export const VERIFICATION_LIMITS = {
  send_email: { windowMs: 3_600_000, max: 5 },
  resend_cooldown: { windowMs: 60_000, max: 1 },
  register_ip: { windowMs: 3_600_000, max: 5 },
  send_ip: { windowMs: 3_600_000, max: 15 },
  verify_email: { windowMs: 600_000, max: 10 },
  verify_ip: { windowMs: 3_600_000, max: 40 },
  send_global: { windowMs: 86_400_000, max: 80 },
} as const;

export type LimitBucket = keyof typeof VERIFICATION_LIMITS;

export interface VerificationDeps {
  /** EMAIL_VERIFICATION_REQUIRED === 'true'. */
  enabled: boolean;
  codes: VerificationRepository;
  limits: RateLimitRepository;
  mailer: EnvioCorreo;
  /** Reloj inyectable (epoch ms). */
  now?: () => number;
  /** Generador de codigo inyectable (tests). */
  generateCode?: () => string;
}

export type CheckCodeResult = 'ok' | 'invalid' | 'exceeded';

export class VerificationService {
  private readonly now: () => number;
  private readonly generateCode: () => string;

  constructor(
    private readonly deps: VerificationDeps,
    private readonly hashSalt: string
  ) {
    this.now = deps.now ?? (() => Date.now());
    this.generateCode = deps.generateCode ?? generateNumericCode;
  }

  get enabled(): boolean {
    return this.deps.enabled;
  }

  nowMs(): number {
    return this.now();
  }

  async emailKey(email: string): Promise<string> {
    return sha256Hex(`email:${email}`);
  }

  async ipKey(ip: string | undefined): Promise<string> {
    return sha256Hex(`${ip && ip.length > 0 ? ip : 'desconocida'}${this.hashSalt}`);
  }

  /** Limpieza oportunista de ventanas vencidas (las mas largas duran 24 h). */
  async purgeRateLimits(): Promise<void> {
    await this.deps.limits.purgeExpired(this.now() - 86_400_000);
  }

  /** Cutoff de cuentas sin verificar ('YYYY-MM-DD HH:MM:SS' UTC, hace 24 h). */
  staleCutoff(): string {
    return new Date(this.now() - 86_400_000)
      .toISOString()
      .slice(0, 19)
      .replace('T', ' ');
  }

  /** Suma un golpe al bucket; devuelve RATE_LIMITED si se supera el maximo. */
  async checkLimit(bucket: LimitBucket, key: string): Promise<ErrorResponse | null> {
    const rule = VERIFICATION_LIMITS[bucket];
    const now = this.now();
    const hit = await this.deps.limits.hit(bucket, key, now, rule.windowMs);

    if (hit.count > rule.max) {
      const retryAfterSeconds = Math.max(
        1,
        Math.ceil((hit.windowStart + rule.windowMs - now) / 1000)
      );
      return {
        success: false,
        error: 'RATE_LIMITED',
        message: `Demasiadas solicitudes. Intenta de nuevo en ${retryAfterSeconds} segundos.`,
        retryAfterSeconds,
      };
    }

    return null;
  }

  async checkLimits(
    checks: Array<[LimitBucket, string]>
  ): Promise<ErrorResponse | null> {
    for (const [bucket, key] of checks) {
      const error = await this.checkLimit(bucket, key);
      if (error) {
        return error;
      }
    }
    return null;
  }

  /**
   * Genera y guarda un codigo nuevo (reemplaza el anterior) y lo envia.
   * Con testCode no envia correo ni consume el limite global y devuelve el codigo.
   */
  async issueAndSend(
    user: { id: string; email: string; nombre: string },
    testCode: boolean
  ): Promise<{ error: ErrorResponse | null; codigoPrueba?: string }> {
    if (!testCode) {
      const limited = await this.checkLimit('send_global', 'global');
      if (limited) {
        return { error: limited };
      }
    }

    const codigo = this.generateCode();
    const salt = generateSaltBase64();
    const codeHash = await sha256Hex(`${salt}${codigo}`);
    const now = this.now();

    await this.deps.codes.upsertCode({
      id: uuidv7(),
      userId: user.id,
      codeHash,
      salt,
      expiresAt: now + CODE_EXPIRES_IN_SECONDS * 1000,
      sentAt: now,
    });

    if (testCode) {
      return { error: null, codigoPrueba: codigo };
    }

    try {
      await this.deps.mailer.enviarCodigoVerificacion({
        to: user.email,
        nombre: user.nombre,
        codigo,
        expiraEnMinutos: CODE_EXPIRES_IN_SECONDS / 60,
      });
    } catch (error) {
      if (error instanceof EnvioCorreoConfigError) {
        console.error('Correo no configurado:', error.message);
        return {
          error: {
            success: false,
            error: 'CONFIGURATION_ERROR',
            message: 'El servicio de correo no está configurado',
          },
        };
      }
      console.error('Fallo el envio del correo de verificacion:', error);
      return {
        error: {
          success: false,
          error: 'EMAIL_DELIVERY_FAILED',
          message: 'No fue posible enviar el correo. Intenta reenviar el código.',
        },
      };
    }

    return { error: null };
  }

  async hasActiveCode(userId: string): Promise<boolean> {
    return this.deps.codes.hasActiveCode(userId, this.now());
  }

  /** Suma el intento de forma atomica y compara en tiempo constante. */
  async checkCode(userId: string, code: string): Promise<CheckCodeResult> {
    const stored = await this.deps.codes.registerAttempt(userId, this.now());
    if (!stored) {
      return 'invalid';
    }

    const candidate = await sha256Hex(`${stored.salt}${code}`);
    if (constantTimeCompare(candidate, stored.codeHash)) {
      return 'ok';
    }

    return stored.attempts >= 5 ? 'exceeded' : 'invalid';
  }

  async completeVerification(userId: string): Promise<void> {
    await this.deps.codes.completeVerification(userId);
  }
}
