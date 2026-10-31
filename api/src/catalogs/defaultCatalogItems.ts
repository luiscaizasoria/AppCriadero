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
 * Total: 42 items
 * - RAZAS: 9 items
 * - SEXOS: 2 items
 * - ENFERMEDADES: 4 items
 * - MEDICAMENTOS: 4 items
 * - ALIMENTOS: 2 items
 * - BEBIDAS: 2 items
 * - CATEGORIAS_FINANCIERAS: 8 items
 * - ESPECIES: 5 items
 * - TIPOS_CRIADERO: 3 items
 * - FINALIDADES_CRIADERO: 3 items
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

  // ALIMENTOS (2 items)
  // V1 no los siembra; decisión del usuario (D-CAT-03)
  {
    catalogCode: 'ALIMENTOS',
    code: 'MORICHILLO',
    name: 'Morichillo',
    order: 0,
  },
  {
    catalogCode: 'ALIMENTOS',
    code: 'BALANCEADO',
    name: 'Balanceado',
    order: 0,
  },

  // BEBIDAS (2 items)
  // V1 no los siembra; decisión del usuario (D-CAT-03)
  {
    catalogCode: 'BEBIDAS',
    code: 'AGUA',
    name: 'Agua',
    order: 0,
  },
  {
    catalogCode: 'BEBIDAS',
    code: 'AGUA_VITAMINA',
    name: 'Agua con vitamina',
    order: 0,
  },

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

  // ESPECIES (5 items)
  {
    catalogCode: 'ESPECIES',
    code: 'GALLINA_GALLO',
    name: 'Gallina / Gallo',
    order: 1,
  },
  {
    catalogCode: 'ESPECIES',
    code: 'PATO',
    name: 'Pato',
    order: 2,
  },
  {
    catalogCode: 'ESPECIES',
    code: 'PAVO',
    name: 'Pavo',
    order: 3,
  },
  {
    catalogCode: 'ESPECIES',
    code: 'CODORNIZ',
    name: 'Codorniz',
    order: 4,
  },
  {
    catalogCode: 'ESPECIES',
    code: 'OTRA',
    name: 'Otra',
    order: 5,
  },

  // TIPOS_CRIADERO (3 items)
  {
    catalogCode: 'TIPOS_CRIADERO',
    code: 'CRIANZA',
    name: 'Cría',
    order: 1,
  },
  {
    catalogCode: 'TIPOS_CRIADERO',
    code: 'REPRODUCCION',
    name: 'Reproducción',
    order: 2,
  },
  {
    catalogCode: 'TIPOS_CRIADERO',
    code: 'MIXTO',
    name: 'Mixto',
    order: 3,
  },

  // FINALIDADES_CRIADERO (3 items)
  {
    catalogCode: 'FINALIDADES_CRIADERO',
    code: 'VENTA',
    name: 'Venta',
    order: 1,
  },
  {
    catalogCode: 'FINALIDADES_CRIADERO',
    code: 'CONSUMO',
    name: 'Consumo propio',
    order: 2,
  },
  {
    catalogCode: 'FINALIDADES_CRIADERO',
    code: 'EXPOSICION',
    name: 'Exhibición',
    order: 3,
  },
] as const;
