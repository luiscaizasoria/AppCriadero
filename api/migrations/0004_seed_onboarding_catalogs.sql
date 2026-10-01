-- ============================================================
-- Criadero Kikirikis V2
-- Migration 0004 - Seed onboarding catalogs
-- ============================================================
--
-- Catálogos nuevos para el onboarding:
-- - ESPECIES
-- - TIPOS_CRIADERO
-- - FINALIDADES_CRIADERO
--
-- NOTA: Los items de estos catálogos NO se insertan en catalogo_items
-- desde esta migración. La plantilla de items está en
-- api/src/catalogs/defaultCatalogItems.ts y se copiará al crear
-- cada criadero con su criadero_id real.
-- ============================================================

INSERT INTO catalogos (
    id,
    codigo,
    nombre,
    descripcion,
    activo
)
VALUES
(
    '01a0f489-e9f9-7489-acba-600000000001',
    'ESPECIES',
    'Especies',
    'Especies de animales del criadero',
    1
),
(
    '01a0f489-e9f9-7489-acba-600000000002',
    'TIPOS_CRIADERO',
    'Tipos de criadero',
    'Tipos o clasificaciones de criaderos',
    1
),
(
    '01a0f489-e9f9-7489-acba-600000000003',
    'FINALIDADES_CRIADERO',
    'Finalidades del criadero',
    'Propósitos principales del criadero',
    1
);
