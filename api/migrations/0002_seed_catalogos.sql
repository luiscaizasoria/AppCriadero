-- ============================================================
-- Criadero Kikirikis V2
-- Migration 0002 - Seed global catalogs
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
    '01a0f489-e9f5-7119-99e9-7444720de744',
    'RAZAS',
    'Razas',
    'Tipos de razas de aves',
    1
),
(
    '01a0f489-e9f9-7489-acba-424894851a0e',
    'SEXOS',
    'Sexos',
    'Tipos de sexo de las aves',
    1
),
(
    '01a0f489-e9f9-7489-acba-4702fc52aa28',
    'ENFERMEDADES',
    'Enfermedades',
    'Catalogo de enfermedades',
    1
),
(
    '01a0f489-e9f9-7489-acba-484b426db289',
    'MEDICAMENTOS',
    'Medicamentos',
    'Catalogo de medicamentos',
    1
),
(
    '01a0f489-e9f9-7489-acba-4d8cf66c97fb',
    'ALIMENTOS',
    'Alimentos',
    'Tipos de alimentos',
    1
),
(
    '01a0f489-e9f9-7489-acba-527fc0a73286',
    'BEBIDAS',
    'Bebidas',
    'Tipos de bebidas',
    1
),
(
    '01a0f489-e9f9-7489-acba-5489b167929e',
    'CATEGORIAS_FINANCIERAS',
    'Categorias financieras',
    'Categorias para movimientos financieros',
    1
);
