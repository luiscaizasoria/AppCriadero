/**
 * Plantilla inicial de CatalogoItems V2
 *
 * Contiene las definiciones base para generar los CatalogoItems iniciales
 * de un nuevo Criadero. Cada item se convertirá en un registro independiente
 * con su propio UUID v7, criadero_id y catalogo_id al momento de la creación.
 *
 * Basado en Modelo aprobado #11 de V2_MODELO_DATOS.md
 */

export interface DefaultCatalogItem {
  catalogCode: string;
  code: string;
  name: string;
  description?: string | null;
  order?: number | null;
}

/**
 * Colección inmutable de items iniciales por catálogo
 *
 * Total: 27 items
 * - RAZAS: 9 items
 * - SEXOS: 2 items
 * - ENFERMEDADES: 4 items
 * - MEDICAMENTOS: 4 items
 * - ALIMENTOS: 0 items
 * - BEBIDAS: 0 items
 * - CATEGORIAS_FINANCIERAS: 8 items
 */
export const DEFAULT_CATALOG_ITEMS: readonly DefaultCatalogItem[] = [
  // RAZAS (9 items)
  {
    catalogCode: 'RAZAS',
    code: 'KIKIRIS',
    name: 'Kikiris',
    order: 1,
  },
  {
    catalogCode: 'RAZAS',
    code: 'KIKIRIKIS_MEJORADOS',
    name: 'Kikirikis mejorados',
    order: 2,
  },
  {
    catalogCode: 'RAZAS',
    code: 'AZTECAS',
    name: 'Aztecas',
    order: 3,
  },
  {
    catalogCode: 'RAZAS',
    code: 'SEBRING',
    name: 'Sebring',
    order: 4,
  },
  {
    catalogCode: 'RAZAS',
    code: 'NAGASAKI',
    name: 'Nagasaki',
    order: 5,
  },
  {
    catalogCode: 'RAZAS',
    code: 'KIRI',
    name: 'Kiri',
    order: 6,
  },
  {
    catalogCode: 'RAZAS',
    code: 'FANTASIA',
    name: 'Fantasía',
    order: 7,
  },
  {
    catalogCode: 'RAZAS',
    code: 'SERAMA',
    name: 'Serama',
    order: 8,
  },
  {
    catalogCode: 'RAZAS',
    code: 'OTRO',
    name: 'Otro',
    order: 9,
  },

  // SEXOS (2 items)
  {
    catalogCode: 'SEXOS',
    code: 'MACHO',
    name: 'Macho',
    order: 1,
  },
  {
    catalogCode: 'SEXOS',
    code: 'HEMBRA',
    name: 'Hembra',
    order: 2,
  },

  // ENFERMEDADES (4 items, sin orden)
  {
    catalogCode: 'ENFERMEDADES',
    code: 'COCCIDIA',
    name: 'Coccidia',
    order: null,
  },
  {
    catalogCode: 'ENFERMEDADES',
    code: 'CORIZA',
    name: 'Coriza',
    order: null,
  },
  {
    catalogCode: 'ENFERMEDADES',
    code: 'GRIPE',
    name: 'Gripe',
    order: null,
  },
  {
    catalogCode: 'ENFERMEDADES',
    code: 'OTRO',
    name: 'Otro',
    order: null,
  },

  // MEDICAMENTOS (4 items, sin orden)
  {
    catalogCode: 'MEDICAMENTOS',
    code: 'VITAMINA',
    name: 'Vitamina',
    order: null,
  },
  {
    catalogCode: 'MEDICAMENTOS',
    code: 'ANTIBIOTICO',
    name: 'Antibiótico',
    order: null,
  },
  {
    catalogCode: 'MEDICAMENTOS',
    code: 'ANTIPARASITARIO',
    name: 'Antiparasitario',
    order: null,
  },
  {
    catalogCode: 'MEDICAMENTOS',
    code: 'OTRO',
    name: 'Otro',
    order: null,
  },

  // ALIMENTOS (0 items)
  // No tiene items iniciales según V1

  // BEBIDAS (0 items)
  // No tiene items iniciales según V1

  // CATEGORIAS_FINANCIERAS (8 items)
  {
    catalogCode: 'CATEGORIAS_FINANCIERAS',
    code: 'VENTA_AVE',
    name: 'Venta de ave',
    order: 1,
  },
  {
    catalogCode: 'CATEGORIAS_FINANCIERAS',
    code: 'VENTA_HUEVOS',
    name: 'Venta de huevos',
    order: 2,
  },
  {
    catalogCode: 'CATEGORIAS_FINANCIERAS',
    code: 'ALIMENTO',
    name: 'Alimento',
    order: 3,
  },
  {
    catalogCode: 'CATEGORIAS_FINANCIERAS',
    code: 'MEDICAMENTO',
    name: 'Medicamento',
    order: 4,
  },
  {
    catalogCode: 'CATEGORIAS_FINANCIERAS',
    code: 'INFRAESTRUCTURA',
    name: 'Infraestructura',
    order: 5,
  },
  {
    catalogCode: 'CATEGORIAS_FINANCIERAS',
    code: 'COMPRA_AVE',
    name: 'Compra de ave',
    order: 6,
  },
  {
    catalogCode: 'CATEGORIAS_FINANCIERAS',
    code: 'OTRO',
    name: 'Otro',
    order: 7,
  },
  {
    catalogCode: 'CATEGORIAS_FINANCIERAS',
    code: 'ENVIO_AVE',
    name: 'Envío de ave',
    order: 8,
  },
] as const;
