/**
 * Contratos del modulo Huevos (registro de huevos por ave y produccion).
 */

export interface ErrorResponse {
  success: false;
  error: string;
  message: string;
}

export type Resultado<T> = { success: true; data: T } | ErrorResponse;

/** Datos ya normalizados por el servicio para registrar un huevo. */
export interface RegistrarHuevoInput {
  huevoId: string;
  historialId: string;
  aveId: string;
  /** null = sin jaula (`jaulaId || null` de V1). */
  jaulaId: string | null;
  fecha: string;
  observacion: string | null;
}

/** Fila de obtenerHuevosAve (V1). */
export interface HuevoAve {
  id: string;
  codigo: string;
  fecha: string;
  estado: string;
  observacion: string | null;
  jaulaCodigo: string | null;
}

export interface ResumenProduccion {
  hoy: number;
  semana: number;
  mes: number;
}

export interface RankingPonedora {
  id: string;
  codigo: string;
  raza: string | null;
  cantidad: number;
}

export interface ProduccionDia {
  dia: string;
  cantidad: number;
}

export interface ProduccionHora {
  hora: string;
  cantidad: number;
}

export interface ProduccionJaula {
  id: string;
  codigo: string;
  cantidad: number;
}

export interface ProduccionAve {
  id: string;
  codigo: string;
  cantidad: number;
}

/** obtenerProduccionHuevos de V1: hoy y mes son null si no hay huevos. */
export interface TotalProduccion {
  total: number;
  hoy: number | null;
  mes: number | null;
}
