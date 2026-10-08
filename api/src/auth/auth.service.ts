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
} from './auth.types';
import { v7 as uuidv7 } from 'uuid';
import { hashPassword, verifyPassword } from './auth.repository';

const JWT_EXPIRES_IN_SECONDS = 3600;

export class AuthService {
  constructor(
    private repository: AuthRepository,
    private jwtSecret: string
  ) {}

  async register(request: RegisterRequest): Promise<AuthResponse | ErrorResponse> {
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
      // Verificar si el email ya existe (incluyendo soft-deleted)
      const emailExists = await this.repository.emailExists(normalizedEmail);
      if (emailExists) {
        return {
          success: false,
          error: 'EMAIL_ALREADY_REGISTERED',
          message: 'El correo electrónico ya está registrado',
        };
      }

      // Hashear password
      const passwordHash = await hashPassword(password);

      // Crear usuario
      const userId = uuidv7();
      await this.repository.createUser({
        id: userId,
        email: normalizedEmail,
        nombre,
        passwordHash,
      });

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

      // Generar JWT
      const accessToken = await this.generateToken(user.id, user.email);

      return {
        success: true,
        data: {
          user: {
            id: user.id,
            email: user.email,
            nombre: user.nombre,
          },
          accessToken,
          expiresIn: JWT_EXPIRES_IN_SECONDS,
        },
      };
    } catch (error) {
      console.error('Error en login:', error);
      return {
        success: false,
        error: 'INTERNAL_ERROR',
        message: 'Error al iniciar sesión',
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
