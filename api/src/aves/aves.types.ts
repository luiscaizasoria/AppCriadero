/**
 * Tipos para el modulo de Aves (replica AveRepository.js, EvolucionAveRepository.js
 * y las escrituras de ave_historial de V1). API en camelCase; la foto viaja como
 * texto (`fotoUri`) y se guarda en aves.foto_r2_key sin interpretarla (R2 diferido).
 */

export interface AveListado {
  id: string;
  codigo: string;
  origen: string;
  fechaNacimiento: string | null;
  edadMesesCompra: number | null;
  fechaIngreso: string | null;
  criaderoOrigen: string | null;
  metodoEnvio: string | null;
  raza: string | null;
  sexo: string | null;
  pesoGramos: number | null;
  alturaCm: number | null;
  largoCm: number | null;
  caracteristicas: string | null;
  fotoUri: string | null;
  padreId: string | null;
  madreId: string | null;
  jaulaActualId: string | null;
  estado: string;
  estadoSalud: string | null;
  fechaCreacion: string;
  jaulaCodigo: string | null;
  jaulaNombre: string | null;
  padreCodigo: string | null;
  madreCodigo: string | null;
}

export interface AveDetalle extends AveListado {
  fechaActualizacion: string | null;
  fechaUltimoControlSalud: string | null;
}

/** Campos de baja que acompanan al ave vendida (INNER JOIN bajas_ave tipo VENTA, como V1). */
export interface CamposBajaVenta {
  fechaVenta: string;
  celular: string | null;
  ciudadDestino: string | null;
  cooperativaEnvio: string | null;
  comprador: string | null;
  valorVenta: number | null;
  valorEnvio: number | null;
  detalle: string | null;
}

/** Campos de baja que acompanan al ave fallecida (tipo MUERTE). */
export interface CamposBajaMuerte {
  fechaFallecimiento: string;
  causa: string | null;
  detalle: string | null;
}

/** Ave de VENDIDA/FALLECIDA con los datos de su baja. */
export type AveBajaListado = Omit<AveListado, 'criaderoOrigen' | 'metodoEnvio' | 'fechaCreacion'> &
  (CamposBajaVenta | CamposBajaMuerte);

/** Fila de bajas_ave (obtenerBajaAve / ciclo de vida). */
export interface BajaAve {
  id: string;
  tipo: string;
  fecha: string;
  causa: string | null;
  celular: string | null;
  ciudadDestino: string | null;
  cooperativaEnvio: string | null;
  comprador: string | null;
  valorVenta: number | null;
  valorEnvio: number | null;
  detalle: string | null;
}

export interface BajaMuerteInput {
  aveId: string;
  bajaId: string;
  historialId: string;
  fecha: string;
  causa: string | null;
  detalle: string | null;
  detalleHistorial: string;
}

export interface BajaVentaInput {
  aveId: string;
  bajaId: string;
  ingresoVentaId: string;
  ingresoEnvioId: string;
  historialId: string;
  fecha: string;
  celular: string;
  ciudadDestino: string | null;
  cooperativaEnvio: string | null;
  comprador: string | null;
  valorVenta: number | null;
  valorEnvio: number | null;
  detalle: string | null;
  detalleVenta: string;
  detalleEnvio: string;
  detalleHistorial: string;
}

export interface AvePorJaula {
  id: string;
  codigo: string;
  origen: string;
  fechaNacimiento: string | null;
  raza: string | null;
  caracteristicas: string | null;
  fotoUri: string | null;
  jaulaActualId: string | null;
  estado: string;
}

export interface AveParaAsignar {
  id: string;
  codigo: string;
  raza: string | null;
  fotoUri: string | null;
  jaulaActualId: string | null;
  jaulaCodigo: string | null;
}

export interface AveCandidataPadre {
  id: string;
  codigo: string;
  raza: string | null;
  sexo: string | null;
}

export interface AveParentesco {
  id: string;
  codigo: string;
  sexo: string | null;
}

/** Fila cruda de aves que necesita el servicio para decidir (SELECT * de V1). */
export interface AveFila {
  id: string;
  codigo: string;
  origen: string;
  fechaNacimiento: string | null;
  edadMesesCompra: number | null;
  fechaIngreso: string | null;
  criaderoOrigen: string | null;
  metodoEnvio: string | null;
  raza: string | null;
  sexo: string | null;
  pesoGramos: number | null;
  alturaCm: number | null;
  largoCm: number | null;
  caracteristicas: string | null;
  fotoUri: string | null;
  padreId: string | null;
  madreId: string | null;
  jaulaActualId: string | null;
  estado: string;
  fechaCreacion: string;
}

export interface ContextoEvolucion {
  ave: AveFila;
  totalEvoluciones: number;
}

export interface EvolucionAve {
  id: string;
  aveId: string;
  fecha: string;
  fotoUri: string | null;
  pesoGramos: number | null;
  alturaCm: number | null;
  largoCm: number | null;
  caracteristicas: string | null;
  observacion: string | null;
  fechaCreacion: string;
}

export interface HistorialAve {
  id: string;
  aveId: string;
  jaulaId: string | null;
  tipoEvento: string;
  fecha: string;
  detalle: string | null;
  fechaCreacion: string;
  jaulaCodigo: string | null;
}

/** Datos ya normalizados como crearAve / actualizarAve de V1. */
export interface AveDatos {
  codigo: string;
  origen: string;
  fechaNacimiento: string | null;
  edadMesesCompra: number | null;
  fechaIngreso: string | null;
  criaderoOrigen: string | null;
  metodoEnvio: string | null;
  raza: string | null;
  sexo: string | null;
  pesoGramos: number | null;
  alturaCm: number | null;
  largoCm: number | null;
  caracteristicas: string | null;
  fotoUri: string | null;
  padreId: string | null;
  madreId: string | null;
}

export interface CrearAveInput {
  id: string;
  datos: AveDatos;
  jaulaId: string | null;
  evolucionId: string;
  historialId: string;
  jaulaHistorialId: string | null;
  fecha: string;
  detalleAlta: string;
  detalleJaula: string | null;
}

export interface ActualizarAveInput {
  aveId: string;
  datos: AveDatos;
  /** Jaula del ave antes de editar (jaula_id del evento). */
  jaulaActualId: string | null;
  historialId: string;
  fecha: string;
  detalle: string;
}

export interface CambiarJaulaInput {
  aveId: string;
  nuevaJaulaId: string | null;
  jaulaAnteriorId: string | null;
  fecha: string;
  historialId: string;
  detalleCambio: string;
  salida: { id: string; detalle: string } | null;
  ingreso: { id: string; detalle: string } | null;
}

export interface EventoAveInput {
  id: string;
  aveId: string;
  tipoEvento: string;
  fecha: string;
  detalle: string | null;
}

export interface EvolucionInput {
  aveId: string;
  inicial: {
    id: string;
    fecha: string;
    fotoUri: string | null;
    pesoGramos: number | null;
    alturaCm: number | null;
    largoCm: number | null;
    caracteristicas: string | null;
  } | null;
  fotoUri: string | null;
  pesoGramos: number | null;
  alturaCm: number | null;
  largoCm: number | null;
  caracteristicas: string | null;
  observacion: string | null;
  evolucionId: string;
  fecha: string;
  jaulaActualId: string | null;
  historialId: string;
  detalle: string;
}

export interface FinalizarTratamientoInput {
  aveId: string;
  fecha: string;
  saludId: string;
  detalleSalud: string;
}

export type EstadoBajaAve = 'VENDIDA' | 'FALLECIDA';

export interface ErrorResponse {
  success: false;
  error: string;
  message: string;
}

export type Resultado<T> = { success: true; data: T } | ErrorResponse;

/** Mensajes exactos de SQLite que las pantallas de V1 reconocen. */
export const MENSAJE_CODIGO_DUPLICADO = 'UNIQUE constraint failed: aves.codigo';
export const MENSAJE_FK = 'FOREIGN KEY constraint failed';
