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
}
