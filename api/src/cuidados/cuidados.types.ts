/**
 * Contratos del modulo Cuidados de jaula (alimentacion, bebida, sanidad).
 */

export type TipoCuidado = 'alimentacion' | 'bebida' | 'sanidad';

export type EstadoSanitario = 'NORMAL' | 'LIMPIEZA' | 'FUMIGACION' | 'QUEMADURA' | 'CUARENTENA';

export interface ErrorResponse {
  success: false;
  error: string;
  message: string;
}

export type Resultado<T> = { success: true; data: T } | ErrorResponse;

/** Registro de alimentacion o bebida tal como lo devuelve el POST. */
export interface RegistroAlimentoBebida {
  id: string;
  jaulaId: string;
  fecha: string;
  tipo: string;
  cantidad: string | null;
  detalle: string | null;
}

export interface RegistroSanidad {
  id: string;
  jaulaId: string;
  fecha: string;
  tipo: string;
  detalle: string | null;
}

export interface RegistroAlimentacionListado extends RegistroAlimentoBebida {
  fechaCreacion: string;
}

/** Datos ya normalizados por el servicio. */
export interface CrearAlimentoBebidaInput {
  id: string;
  historialId: string;
  jaulaId: string;
  fecha: string;
  tipo: string;
  cantidad: string | null;
  detalle: string | null;
  detalleHistorial: string;
}

export interface CrearSanidadInput {
  id: string;
  historialId: string;
  jaulaId: string;
  fecha: string;
  tipo: string;
  detalle: string | null;
  estadoSanitario: EstadoSanitario;
  detalleHistorial: string;
}

export const MENSAJE_CUERPO_OBJETO = 'El cuerpo debe ser un objeto JSON';
