/**
 * Contratos del modulo Clientes (solo lectura, calculado sobre bajas_ave tipo VENTA).
 * Los importes son REAL sin redondeo; los totales son 0 si todas las ventas tienen NULL.
 */

export interface ErrorResponse {
  success: false;
  error: string;
  message: string;
}

export type Resultado<T> = { success: true; data: T } | ErrorResponse;

/** Fila de obtenerClientes / obtenerClientePorCelular (V1). */
export interface Cliente {
  celular: string;
  nombre: string;
  ciudad: string;
  totalCompras: number;
  totalVentas: number;
  totalEnvios: number;
  ultimaCompra: string;
}

/** Fila de obtenerComprasCliente (V1). */
export interface CompraCliente {
  ventaId: string;
  fecha: string;
  celular: string;
  comprador: string | null;
  ciudadDestino: string | null;
  cooperativaEnvio: string | null;
  valorVenta: number | null;
  valorEnvio: number | null;
  detalle: string | null;
  aveId: string;
  aveCodigo: string;
  aveRaza: string | null;
  aveSexo: string | null;
  aveFotoUri: string | null;
}
