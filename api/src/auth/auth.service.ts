/**
 * Service para lógica de negocio de autenticación
 */

import { SignJWT, jwtVerify } from 'jose';
import type { AuthRepository } from './auth.repository';
import type {
  RegisterRequest,
  LoginRequest,
  AuthResponse,
  ErrorResponse,
  VerifyRequest,
  ResendRequest,
  ChangeEmailRequest,
  RequestContext,
  VerificationRequiredResponse,
  ResendResponse,
} from './auth.types';
import { CODE_EXPIRES_IN_SECONDS, RESEND_AFTER_SECONDS } from './auth.types';
import { v7 as uuidv7 } from 'uuid';
import { hashPassword, verifyPassword } from './auth.repository';
import {
  VerificationService,
  type VerificationDeps,
} from './verification.service';

const JWT_EXPIRES_IN_SECONDS = 3600;
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const CLEANUP_BATCH = 20;

const INVALID_CODE_ERROR: ErrorResponse = {
  success: false,
  error: 'INVALID_VERIFICATION_CODE',
  message: 'Código incorrecto o vencido. Revisa el código o solicita uno nuevo.',
};

const INVALID_CREDENTIALS_ERROR: ErrorResponse = {
  success: false,
  error: 'INVALID_CREDENTIALS',
  message: 'Correo o contraseña incorrectos',
};

const EMAIL_TAKEN_ERROR: ErrorResponse = {
  success: false,
  error: 'EMAIL_ALREADY_REGISTERED',
  message: 'El correo electrónico ya está registrado',
};

function validationError(message: string): ErrorResponse {
  return { success: false, error: 'VALIDATION_ERROR', message };
}

export class AuthService {
  private readonly verification: VerificationService | null;

  /**
   * Sin `verificationDeps` (o con enabled = false) el comportamiento es el de
   * siempre: register emite token y marca la cuenta verificada.
   */
  constructor(
    private repository: AuthRepository,
    private jwtSecret: string,
    verificationDeps?: VerificationDeps
  ) {
    this.verification = verificationDeps
      ? new VerificationService(verificationDeps, jwtSecret)
      : null;
  }

  private get verificationOn(): boolean {
    return this.verification?.enabled === true;
  }

  async register(
    request: RegisterRequest,
    context: RequestContext = {}
  ): Promise<AuthResponse | VerificationRequiredResponse | ErrorResponse> {
    // Normalizar email desde el inicio
    const normalizedEmail = request.email?.trim().toLowerCase();
    const nombre = request.nombre?.trim();
    const password = request.password;

    if (!normalizedEmail || !nombre || !password) {
      return {
        success: false,
        error: 'VALIDATION_ERROR',
        message: 'Todos los campos son requeridos',
      };
    }

    if (normalizedEmail.length === 0 || nombre.length === 0) {
      return {
        success: false,
        error: 'VALIDATION_ERROR',
        message: 'Email y nombre no pueden estar vacíos',
      };
    }

    // Validar formato básico de email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(normalizedEmail)) {
      return {
        success: false,
        error: 'VALIDATION_ERROR',
        message: 'Formato de email inválido',
      };
    }

    // Validar longitud mínima de password
    if (password.length < 8) {
      return {
        success: false,
        error: 'VALIDATION_ERROR',
        message: 'La contraseña debe tener al menos 8 caracteres',
      };
    }

    try {
      const verification = this.verificationOn ? this.verification : null;
      const bypassVerified = verification !== null && context.bypass === 'verified';
      const testCode = verification !== null && context.bypass === 'test-code';

      let existingUnverifiedId: string | null = null;

      if (verification) {
        // Limpieza oportunista (sin Cron Trigger); un fallo no bloquea el registro.
        try {
          await this.repository.purgeStaleUnverified(
            verification.staleCutoff(),
            CLEANUP_BATCH
          );
          await verification.purgeRateLimits();
        } catch (cleanupError) {
          console.error('Error en limpieza oportunista:', cleanupError);
        }

        const existing = await this.repository.findUserByEmail(normalizedEmail);
        if (existing) {
          if (
            existing.deleted_at !== null ||
            existing.email_verified_at !== null ||
            existing.active !== 1
          ) {
            return EMAIL_TAKEN_ERROR;
          }
          existingUnverifiedId = existing.id;
        }

        if (!bypassVerified) {
          const limited = await verification.checkLimits([
            ['register_ip', await verification.ipKey(context.ip)],
            ['send_ip', await verification.ipKey(context.ip)],
            ['send_email', await verification.emailKey(normalizedEmail)],
            ['resend_cooldown', await verification.emailKey(normalizedEmail)],
          ]);
          if (limited) {
            return limited;
          }
        }
      } else {
        // Verificar si el email ya existe (incluyendo soft-deleted)
        const emailExists = await this.repository.emailExists(normalizedEmail);
        if (emailExists) {
          return EMAIL_TAKEN_ERROR;
        }
      }

      // Hashear password
      const passwordHash = await hashPassword(password);

      let userId: string;
      if (existingUnverifiedId && !bypassVerified) {
        // Reintento de una cuenta sin verificar: nunca se probo la propiedad del correo.
        userId = existingUnverifiedId;
        await this.repository.updateUnverifiedCredentials(
          userId,
          nombre,
          passwordHash
        );
      } else {
        if (existingUnverifiedId) {
          await this.repository.deleteUnverifiedUser(existingUnverifiedId);
        }
        userId = uuidv7();
        await this.repository.createUser({
          id: userId,
          email: normalizedEmail,
          nombre,
          passwordHash,
          // Bandera apagada o bypass de pruebas: la cuenta nace verificada.
          verified: verification === null || bypassVerified,
        });
      }

      if (verification && !bypassVerified) {
        const sent = await verification.issueAndSend(
          { id: userId, email: normalizedEmail, nombre },
          testCode
        );
        if (sent.error) {
          return sent.error;
        }

        return {
          success: true,
          data: {
            verificationRequired: true,
            email: normalizedEmail,
            expiresIn: CODE_EXPIRES_IN_SECONDS,
            resendAfterSeconds: RESEND_AFTER_SECONDS,
            ...(sent.codigoPrueba ? { codigoPrueba: sent.codigoPrueba } : {}),
          },
        };
      }

      // Generar JWT
      const accessToken = await this.generateToken(userId, normalizedEmail);

      return {
        success: true,
        data: {
          user: {
            id: userId,
            email: normalizedEmail,
            nombre,
          },
          accessToken,
          expiresIn: JWT_EXPIRES_IN_SECONDS,
        },
      };
    } catch (error) {
      // Manejar conflicto UNIQUE(email) por concurrencia
      if (error instanceof Error && error.message.includes('UNIQUE')) {
        return {
          success: false,
          error: 'EMAIL_ALREADY_REGISTERED',
          message: 'El correo electrónico ya está registrado',
        };
      }

      console.error('Error en registro:', error);
      return {
        success: false,
        error: 'INTERNAL_ERROR',
        message: 'Error al registrar usuario',
      };
    }
  }

  async login(request: LoginRequest): Promise<AuthResponse | ErrorResponse> {
    // Normalizar email desde el inicio
    const normalizedEmail = request.email?.trim().toLowerCase();
    const password = request.password;

    if (!normalizedEmail || !password) {
      return {
        success: false,
        error: 'VALIDATION_ERROR',
        message: 'Email y contraseña son requeridos',
      };
    }

    if (normalizedEmail.length === 0) {
      return {
        success: false,
        error: 'VALIDATION_ERROR',
        message: 'Email no puede estar vacío',
      };
    }

    try {
      // Buscar usuario por email
      const user = await this.repository.findUserByEmail(normalizedEmail);

      // Usuario no existe o está soft-deleted
      if (!user || user.deleted_at !== null) {
        return {
          success: false,
          error: 'INVALID_CREDENTIALS',
          message: 'Correo o contraseña incorrectos',
        };
      }

      // Usuario inactivo
      if (user.active !== 1) {
        return {
          success: false,
          error: 'USER_INACTIVE',
          message: 'El usuario se encuentra inactivo',
        };
      }

      // Verificar password
      if (!user.password_hash) {
        return {
          success: false,
          error: 'INVALID_CREDENTIALS',
          message: 'Correo o contraseña incorrectos',
        };
      }

      const passwordValid = await verifyPassword(password, user.password_hash);
      if (!passwordValid) {
        return {
          success: false,
          error: 'INVALID_CREDENTIALS',
          message: 'Correo o contraseña incorrectos',
        };
      }

      // Cuenta sin verificar (solo con la bandera encendida); se comprueba
      // despues de la contraseña para no filtrar nada a quien no la conoce.
      if (this.verification && this.verificationOn && user.email_verified_at === null) {
        return {
          success: false,
          error: 'EMAIL_NOT_VERIFIED',
          message: 'Debes verificar tu correo para continuar.',
          data: {
            email: user.email,
            hasActiveCode: await this.verification.hasActiveCode(user.id),
            resendAfterSeconds: RESEND_AFTER_SECONDS,
          },
        };
      }

      return this.sessionFor(user.id, user.email, user.nombre);
    } catch (error) {
      console.error('Error en login:', error);
      return {
        success: false,
        error: 'INTERNAL_ERROR',
        message: 'Error al iniciar sesión',
      };
    }
  }

  private async sessionFor(
    id: string,
    email: string,
    nombre: string
  ): Promise<AuthResponse> {
    const accessToken = await this.generateToken(id, email);
    return {
      success: true,
      data: {
        user: { id, email, nombre },
        accessToken,
        expiresIn: JWT_EXPIRES_IN_SECONDS,
      },
    };
  }

  /** POST /auth/verification/verify */
  async verifyEmail(
    request: VerifyRequest,
    context: RequestContext = {}
  ): Promise<AuthResponse | ErrorResponse> {
    const email = typeof request?.email === 'string' ? request.email.trim().toLowerCase() : '';
    const code = typeof request?.code === 'string' ? request.code.trim() : '';

    if (!email || !code) {
      return validationError('Correo y código son requeridos');
    }
    if (!/^\d{6}$/.test(code)) {
      return validationError('El código debe tener 6 dígitos');
    }

    try {
      const verification = this.verification;
      if (!verification) {
        return INVALID_CODE_ERROR;
      }

      const emailKey = await verification.emailKey(email);
      const limited = await verification.checkLimits([
        ['verify_email', emailKey],
        ['verify_ip', await verification.ipKey(context.ip)],
      ]);
      if (limited) {
        return limited;
      }

      const user = await this.repository.findUserByEmail(email);
      if (
        !user ||
        user.deleted_at !== null ||
        user.active !== 1 ||
        user.email_verified_at !== null
      ) {
        return INVALID_CODE_ERROR;
      }

      const outcome = await verification.checkCode(user.id, code);
      if (outcome === 'exceeded') {
        return {
          success: false,
          error: 'VERIFICATION_ATTEMPTS_EXCEEDED',
          message: 'Demasiados intentos. Solicita un código nuevo.',
        };
      }
      if (outcome === 'invalid') {
        return INVALID_CODE_ERROR;
      }

      await verification.completeVerification(user.id);
      return this.sessionFor(user.id, user.email, user.nombre);
    } catch (error) {
      console.error('Error en verificacion de correo:', error);
      return {
        success: false,
        error: 'INTERNAL_ERROR',
        message: 'Error al verificar el correo',
      };
    }
  }

  /** POST /auth/verification/resend: respuesta uniforme exista o no la cuenta. */
  async resendCode(
    request: ResendRequest,
    context: RequestContext = {}
  ): Promise<ResendResponse | ErrorResponse> {
    const email = typeof request?.email === 'string' ? request.email.trim().toLowerCase() : '';

    if (!email) {
      return validationError('Email es requerido');
    }
    if (!EMAIL_REGEX.test(email)) {
      return validationError('Formato de email inválido');
    }

    const uniform: ResendResponse = {
      success: true,
      data: { resendAfterSeconds: RESEND_AFTER_SECONDS },
    };

    try {
      const verification = this.verification;
      if (!verification || !this.verificationOn) {
        return uniform;
      }

      const emailKey = await verification.emailKey(email);
      const limited = await verification.checkLimits([
        ['resend_cooldown', emailKey],
        ['send_ip', await verification.ipKey(context.ip)],
        ['send_email', emailKey],
      ]);
      if (limited) {
        return limited;
      }

      const user = await this.repository.findUserByEmail(email);
      if (
        !user ||
        user.deleted_at !== null ||
        user.active !== 1 ||
        user.email_verified_at !== null
      ) {
        return uniform;
      }

      const sent = await verification.issueAndSend(
        { id: user.id, email: user.email, nombre: user.nombre },
        context.bypass === 'test-code'
      );
      if (sent.error) {
        return sent.error;
      }

      return {
        success: true,
        data: {
          resendAfterSeconds: RESEND_AFTER_SECONDS,
          ...(sent.codigoPrueba ? { codigoPrueba: sent.codigoPrueba } : {}),
        },
      };
    } catch (error) {
      console.error('Error al reenviar el codigo:', error);
      return {
        success: false,
        error: 'INTERNAL_ERROR',
        message: 'Error al reenviar el código',
      };
    }
  }

  /** POST /auth/verification/change-email: solo cuentas sin verificar, con contraseña. */
  async changeEmail(
    request: ChangeEmailRequest,
    context: RequestContext = {}
  ): Promise<VerificationRequiredResponse | ErrorResponse> {
    const email = typeof request?.email === 'string' ? request.email.trim().toLowerCase() : '';
    const nuevoEmail =
      typeof request?.nuevoEmail === 'string' ? request.nuevoEmail.trim().toLowerCase() : '';
    const password = typeof request?.password === 'string' ? request.password : '';

    if (!email || !nuevoEmail || !password) {
      return validationError('Todos los campos son requeridos');
    }
    if (!EMAIL_REGEX.test(email) || !EMAIL_REGEX.test(nuevoEmail)) {
      return validationError('Formato de email inválido');
    }
    if (email === nuevoEmail) {
      return validationError('El nuevo correo debe ser distinto del actual');
    }

    try {
      const verification = this.verification;
      if (!verification || !this.verificationOn) {
        // Sin verificacion no hay cuentas sin verificar: nada que cambiar.
        return INVALID_CREDENTIALS_ERROR;
      }

      const limitedIp = await verification.checkLimit(
        'send_ip',
        await verification.ipKey(context.ip)
      );
      if (limitedIp) {
        return limitedIp;
      }

      const user = await this.repository.findUserByEmail(email);
      if (
        !user ||
        user.deleted_at !== null ||
        user.active !== 1 ||
        !user.password_hash
      ) {
        return INVALID_CREDENTIALS_ERROR;
      }
      if (!(await verifyPassword(password, user.password_hash))) {
        return INVALID_CREDENTIALS_ERROR;
      }
      if (user.email_verified_at !== null) {
        return INVALID_CREDENTIALS_ERROR;
      }

      const limited = await verification.checkLimit(
        'send_email',
        await verification.emailKey(nuevoEmail)
      );
      if (limited) {
        return limited;
      }

      const other = await this.repository.findUserByEmail(nuevoEmail);
      if (other) {
        if (
          other.deleted_at !== null ||
          other.email_verified_at !== null ||
          other.active !== 1
        ) {
          return EMAIL_TAKEN_ERROR;
        }
        await this.repository.deleteUnverifiedUser(other.id);
      }

      await this.repository.changeUnverifiedEmail(user.id, nuevoEmail);

      const sent = await verification.issueAndSend(
        { id: user.id, email: nuevoEmail, nombre: user.nombre },
        context.bypass === 'test-code'
      );
      if (sent.error) {
        return sent.error;
      }

      return {
        success: true,
        data: {
          verificationRequired: true,
          email: nuevoEmail,
          expiresIn: CODE_EXPIRES_IN_SECONDS,
          resendAfterSeconds: RESEND_AFTER_SECONDS,
          ...(sent.codigoPrueba ? { codigoPrueba: sent.codigoPrueba } : {}),
        },
      };
    } catch (error) {
      if (error instanceof Error && error.message.includes('UNIQUE')) {
        return EMAIL_TAKEN_ERROR;
      }
      console.error('Error al cambiar el correo:', error);
      return {
        success: false,
        error: 'INTERNAL_ERROR',
        message: 'Error al cambiar el correo',
      };
    }
  }

  private async generateToken(userId: string, email: string): Promise<string> {
    const secret = new TextEncoder().encode(this.jwtSecret);

    const jwt = await new SignJWT({
      sub: userId,
      email: email,
    })
      .setProtectedHeader({ alg: 'HS256' })
      .setIssuedAt()
      .setExpirationTime(`${JWT_EXPIRES_IN_SECONDS}s`)
      .sign(secret);

    return jwt;
  }
}
