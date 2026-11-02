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

/** obtenerAvesHistoricasJaula de V1. */
export interface AveHistoricaJaula {
  id: string;
  codigo: string;
  raza: string | null;
  sexo: string | null;
  estado: string;
  fotoUri: string | null;
}

/** obtenerHistorialCompletoJaula de V1. */
export interface EventoHistorialJaula {
  id: string;
  jaulaId: string;
  aveId: string | null;
  tipoEvento: string;
  fecha: string;
  detalle: string | null;
  fechaCreacion: string;
  aveCodigo: string | null;
}

/** Ave (de cualquier estado) con jaula_actual_id = jaula, para desactivarJaula. */
export interface AveDeJaula {
  id: string;
  codigo: string;
}

/** Eventos que escribe desactivarJaula de V1 por cada ave liberada. */
export interface LiberacionAve {
  aveId: string;
  historialAveId: string;
  detalleAve: string;
  historialJaulaId: string;
  detalleJaula: string;
}

export interface ErrorResponse {
  success: false;
  error: string;
  message: string;
}

export type Resultado<T> = { success: true; data: T } | ErrorResponse;

/** Mensaje exacto del error de SQLite que las pantallas de V1 reconocen. */
export const MENSAJE_CODIGO_DUPLICADO = 'UNIQUE constraint failed: jaulas.codigo';
