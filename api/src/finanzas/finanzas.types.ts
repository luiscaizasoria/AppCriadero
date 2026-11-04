/**
 * Contratos del modulo Finanzas (movimientos financieros, correcciones e historial).
 * Los importes son REAL: numeros JSON, sin redondeo ni conversion a centavos.
 */

export interface ErrorResponse {
  success: false;
  error: string;
  message: string;
}

export type Resultado<T> = { success: true; data: T } | ErrorResponse;

/** Fila de obtenerMovimientosFinancieros (V1). */
export interface MovimientoListado {
  id: string;
  tipo: string;
  categoria: string | null;
  fecha: string;
  valor: number;
  detalle: string | null;
  aveId: string | null;
  origenTipo: string | null;
  origenId: string | null;
  aveCodigo: string | null;
}

/** Fila de obtenerMovimientoPorId (V1): `mf.*` + codigo del ave. */
export interface MovimientoDetalle extends MovimientoListado {
  fechaCreacion: string;
}

/** Fila de obtenerVentaPorBajaId (V1). */
export interface VentaBaja {
  id: string;
  aveId: string;
  fecha: string;
  celular: string | null;
  comprador: string | null;
  ciudadDestino: string | null;
  cooperativaEnvio: string | null;
  valorVenta: number | null;
  valorEnvio: number | null;
  detalle: string | null;
  aveCodigo: string;
}

/** `SELECT * FROM bajas_ave WHERE id = ? AND tipo = 'VENTA'` reducido a lo que usa la correccion. */
export interface BajaVentaBasica {
  id: string;
  aveId: string;
  fecha: string;
}

/** Fila de obtenerHistorialMovimiento (V1): las 16 columnas. */
export interface HistorialFila {
  id: string;
  movimientoId: string;
  fecha: string;
  accion: string;
  tipoAnterior: string | null;
  tipoNuevo: string | null;
  categoriaAnterior: string | null;
  categoriaNueva: string | null;
  fechaMovimientoAnterior: string | null;
  fechaMovimientoNueva: string | null;
  valorAnterior: number | null;
  valorNuevo: number | null;
  detalleAnterior: string | null;
  detalleNuevo: string | null;
  origenTipo: string | null;
  origenId: string | null;
}

export interface ResumenSumas {
  ingresos: number;
  egresos: number;
}

export interface ResumenFinanciero extends ResumenSumas {
  utilidad: number;
}

export interface CategoriaConsolidada {
  tipo: string;
  categoria: string;
  cantidad: number;
  total: number;
}

export interface MesConsolidado {
  periodo: string | null;
  ingresos: number;
  egresos: number;
}

/** Alta manual ya normalizada por el servicio (registrarMovimientoManual de V1). */
export interface MovimientoManualInput {
  id: string;
  tipo: 'INGRESO' | 'EGRESO';
  categoria: string;
  fecha: string;
  valor: number;
  detalle: string | null;
}

/** Las 15 columnas de datos de movimientos_financieros_historial + id. */
export interface HistorialInsert {
  id: string;
  movimientoId: string;
  fecha: string;
  accion: string;
  tipoAnterior: string | null;
  tipoNuevo: string | null;
  categoriaAnterior: string | null;
  categoriaNueva: string | null;
  fechaMovimientoAnterior: string | null;
  fechaMovimientoNueva: string | null;
  valorAnterior: number | null;
  valorNuevo: number | null;
  detalleAnterior: string | null;
  detalleNuevo: string | null;
  origenTipo: string | null;
  origenId: string | null;
}

/** UPDATE de actualizarMovimientoManual: tipo, categoria, fecha, valor, detalle. */
export interface MovimientoManualUpdate {
  id: string;
  tipo: 'INGRESO' | 'EGRESO';
  categoria: string;
  fecha: string;
  valor: number;
  detalle: string | null;
}

/** Una de las dos sincronizaciones (VENTA_AVE / ENVIO_AVE) de corregirVentaFinanciera. */
export interface SincronizacionVenta {
  categoria: 'VENTA_AVE' | 'ENVIO_AVE';
  valor: number;
  detalle: string;
  /** Movimiento existente (se escribe historial y luego UPDATE) o null (INSERT y luego historial). */
  existenteId: string | null;
  /** Id del INSERT si no existia (UUID v7 generado antes del batch). */
  nuevoId: string;
  historial: HistorialInsert;
}

export interface CorreccionVentaPlan {
  bajaId: string;
  aveId: string;
  fechaVenta: string;
  valorVenta: number;
  valorEnvio: number;
  /** Se ejecutan en este orden: VENTA_AVE, luego ENVIO_AVE. */
  sincronizaciones: SincronizacionVenta[];
}
