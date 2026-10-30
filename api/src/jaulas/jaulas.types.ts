/**
 * Tipos para el modulo de Jaulas (replica JaulaRepository.js de V1)
 */

export interface JaulaListado {
  id: string;
  codigo: string;
  nombre: string | null;
  ubicacion: string | null;
  tipo: string | null;
  estadoSanitario: string;
  activa: number;
  fechaCreacion: string;
  cantidadAves: number;
}

export interface JaulaInactivaListado extends JaulaListado {
  /** NULL hasta la primera edicion o baja, como en V1. */
  fechaActualizacion: string | null;
  fechaDesactivacion: string | null;
}

export interface JaulaDetalle {
  id: string;
  codigo: string;
  nombre: string | null;
  ubicacion: string | null;
  tipo: string | null;
  estadoSanitario: string;
  activa: number;
  fechaCreacion: string;
  fechaActualizacion: string | null;
  fechaDesactivacion: string | null;
}

/** Cuerpo de POST y PUT (los cuatro campos de crearJaula / actualizarJaula). */
export interface JaulaRequest {
  codigo: string;
  nombre?: string | null;
  ubicacion?: string | null;
  tipo?: string | null;
}

/** Datos ya normalizados (trim; vacio -> null), como en V1. */
export interface JaulaDatos {
  codigo: string;
  nombre: string | null;
  ubicacion: string | null;
  tipo: string | null;
}

export type EstadoJaulas = 'ACTIVA' | 'INACTIVA';

export interface ErrorResponse {
  success: false;
  error: string;
  message: string;
}

export type Resultado<T> = { success: true; data: T } | ErrorResponse;

/** Mensaje exacto del error de SQLite que las pantallas de V1 reconocen. */
export const MENSAJE_CODIGO_DUPLICADO = 'UNIQUE constraint failed: jaulas.codigo';
