/**
 * Tipos para el módulo de Autenticación
 */

export interface RegisterRequest {
  email: string;
  nombre: string;
  password: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface UserResponse {
  id: string;
  email: string;
  nombre: string;
}

export interface AuthResponse {
  success: true;
  data: {
    user: UserResponse;
    accessToken: string;
    expiresIn: number;
  };
}

export interface ErrorResponse {
  success: false;
  error: string;
  message: string;
  /** Solo RATE_LIMITED. */
  retryAfterSeconds?: number;
  /** Solo EMAIL_NOT_VERIFIED. */
  data?: Record<string, unknown>;
}

// --- Verificacion de cuenta por codigo ---

export const CODE_EXPIRES_IN_SECONDS = 600;
export const RESEND_AFTER_SECONDS = 60;

export interface VerifyRequest {
  email: string;
  code: string;
}

export interface ResendRequest {
  email: string;
}

export interface ChangeEmailRequest {
  email: string;
  password: string;
  nuevoEmail: string;
}

/** Modo de omision de pruebas, ya validado por la ruta contra VERIFICATION_BYPASS_SECRET. */
export type VerificationBypass = 'verified' | 'test-code';

export interface RequestContext {
  /** IP del cliente (CF-Connecting-IP). */
  ip?: string;
  bypass?: VerificationBypass;
}

export interface VerificationRequiredResponse {
  success: true;
  data: {
    verificationRequired: true;
    email: string;
    expiresIn: number;
    resendAfterSeconds: number;
    /** Solo con el bypass de pruebas 'test-code'. */
    codigoPrueba?: string;
  };
}

export interface ResendResponse {
  success: true;
  data: {
    resendAfterSeconds: number;
    codigoPrueba?: string;
  };
}
