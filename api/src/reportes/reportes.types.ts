/**
 * Contratos del modulo Reportes (solo lectura; replica ReportesRepository.js de V1).
 * Los resumenes usan claves de una sola palabra. Las filas de las exportaciones llevan las claves
 * EXACTAS de V1 (PascalCase, en el orden del SELECT) porque son las cabeceras del CSV de la app
 * (excepcion tecnica E-5 de la spec). Los importes son REAL sin redondeo.
 */

export interface ErrorResponse {
  success: false;
  error: string;
  message: string;
}

export type Resultado<T> = { success: true; data: T } | ErrorResponse;

export interface ReporteAves {
  activas: number;
  vendidas: number;
  fallecidas: number;
}

export interface EstadoSaludResumen {
  tratamiento: number;
  enfermas: number;
}

export interface EnfermedadCantidad {
  enfermedad: string;
  cantidad: number;
}

export interface ReporteSalud {
  estado: EstadoSaludResumen;
  enfermedades: EnfermedadCantidad[];
}

export interface HuevosHoyMes {
  hoy: number;
  mes: number;
}

export interface MejorPonedora {
  codigo: string;
  cantidad: number;
}

export interface ReporteProduccion {
  huevos: HuevosHoyMes;
  mejor: MejorPonedora | null;
}

export interface TotalesFinanzas {
  ingresos: number | null;
  egresos: number | null;
}

export interface ReporteFinanzas {
  ingresos: number;
  egresos: number;
  utilidad: number;
}

export interface FilaExportacionAves {
  Codigo: string;
  Raza: string | null;
  Sexo: string | null;
  Estado: string;
  EstadoSalud: string | null;
  FechaNacimiento: string | null;
  PesoGramos: number | null;
  AlturaCm: number | null;
  LargoCm: number | null;
  Padre: string | null;
  Madre: string | null;
  Jaula: string | null;
  Origen: string;
  Caracteristicas: string | null;
}

export interface FilaExportacionVentas {
  Ave: string;
  Fecha: string;
  Celular: string | null;
  Nombre: string | null;
  CiudadDestino: string | null;
  Cooperativa: string | null;
  ValorAve: number | null;
  ValorEnvio: number | null;
  Detalle: string | null;
}

export interface FilaExportacionClientes {
  Celular: string;
  Nombre: string | null;
  Ciudad: string | null;
  Compras: number;
  TotalAves: number;
  TotalEnvios: number;
  UltimaCompra: string;
}

export interface FilaExportacionFinanzas {
  Fecha: string;
  Tipo: string;
  Categoria: string | null;
  Valor: number;
  Detalle: string | null;
  Ave: string | null;
  Origen: string | null;
  /** Entero en V1; TEXT (UUID v7) en V2 (excepcion E-1). */
  OrigenId: string | null;
}

export interface FilaExportacionHuevos {
  Codigo: string;
  Fecha: string;
  Ave: string | null;
  Jaula: string | null;
  Estado: string;
  Observacion: string | null;
}

export interface FilaExportacionJaulas {
  Codigo: string;
  Nombre: string | null;
  Ubicacion: string | null;
  Tipo: string | null;
  EstadoSanitario: string;
  Estado: 'ACTIVA' | 'INACTIVA';
  FechaCreacion: string;
  FechaDesactivacion: string | null;
}

export interface Exportacion<T> {
  filas: T[];
}
