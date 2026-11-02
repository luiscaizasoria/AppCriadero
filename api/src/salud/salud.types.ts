/**
 * Contratos del modulo Salud (diagnosticos y tratamientos de un ave).
 */

export interface ErrorResponse {
  success: false;
  error: string;
  message: string;
}

export type Resultado<T> = { success: true; data: T } | ErrorResponse;

/** Fila del historial sanitario (obtenerHistorialSaludAve de V1). */
export interface HistorialSalud {
  id: string;
  fecha: string;
  enfermedad: string;
  sintomas: string | null;
  observacion: string | null;
  medicamento: string | null;
  dosis: string | null;
}

/** Datos ya normalizados por el servicio. */
export interface RegistrarDiagnosticoInput {
  diagnosticoId: string;
  tratamientoId: string;
  historialId: string;
  aveId: string;
  fecha: string;
  enfermedad: string;
  sintomas: string | null;
  observacion: string | null;
  /** null = sin tratamiento (no se inserta la fila). */
  medicamento: string | null;
  dosis: string | null;
}
