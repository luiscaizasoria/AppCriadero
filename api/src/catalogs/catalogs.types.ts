/**
 * Tipos del modulo de Catalogos (replica ConfiguracionRepository.js de V1)
 */

/** Catalogos basicos expuestos por la API; los de onboarding no se exponen. */
export const CATALOGOS_BASICOS = [
  'RAZAS',
  'SEXOS',
  'ENFERMEDADES',
  'MEDICAMENTOS',
  'ALIMENTOS',
  'BEBIDAS',
  'CATEGORIAS_FINANCIERAS',
] as const;

export interface CatalogoListado {
  id: string;
  codigo: string;
  nombre: string;
  activo: number;
}

export interface CatalogoDetalle {
  id: string;
  codigo: string;
  nombre: string;
}

export interface CatalogoItem {
  id: string;
  codigo: string;
  nombre: string;
  descripcion: string | null;
  activo: number;
  orden: number;
}

/** Datos de alta ya validados. El codigo no se normaliza (lo hace la pantalla, como V1). */
export interface CatalogoItemNuevo {
  codigo: string;
  nombre: string;
  descripcion: string | null;
}

/** Datos de edicion: V1 solo cambia nombre y descripcion. */
export interface CatalogoItemEdicion {
  nombre: string;
  descripcion: string | null;
}

export interface ErrorResponse {
  success: false;
  error: string;
  message: string;
}

export type Resultado<T> = { success: true; data: T } | ErrorResponse;

/** Mensaje exacto del error de SQLite que reconocen las pantallas de V1. */
export const MENSAJE_ITEM_CODIGO_DUPLICADO =
  'UNIQUE constraint failed: catalogo_items.catalogo_id, catalogo_items.codigo';
