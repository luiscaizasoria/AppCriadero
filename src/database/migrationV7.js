export const DATABASE_VERSION_V7 = 7;


export const migrationV7 = `


INSERT OR IGNORE INTO catalogos
(
    codigo,
    nombre
)
VALUES
(
    'ENFERMEDADES',
    'Enfermedades'
);



INSERT OR IGNORE INTO catalogos
(
    codigo,
    nombre
)
VALUES
(
    'MEDICAMENTOS',
    'Medicamentos'
);



INSERT OR IGNORE INTO catalogos
(
    codigo,
    nombre
)
VALUES
(
    'ALIMENTOS',
    'Alimentos'
);



INSERT OR IGNORE INTO catalogos
(
    codigo,
    nombre
)
VALUES
(
    'BEBIDAS',
    'Bebidas'
);



INSERT OR IGNORE INTO catalogos
(
    codigo,
    nombre
)
VALUES
(
    'CATEGORIAS_FINANCIERAS',
    'Categorías financieras'
);





INSERT OR IGNORE INTO catalogo_items
(
    catalogo_id,
    codigo,
    nombre,
    orden
)
SELECT
    id,
    'VENTA_AVE',
    'Venta de ave',
    1
FROM catalogos
WHERE codigo = 'CATEGORIAS_FINANCIERAS';



INSERT OR IGNORE INTO catalogo_items
(
    catalogo_id,
    codigo,
    nombre,
    orden
)
SELECT
    id,
    'VENTA_HUEVOS',
    'Venta de huevos',
    2
FROM catalogos
WHERE codigo = 'CATEGORIAS_FINANCIERAS';



INSERT OR IGNORE INTO catalogo_items
(
    catalogo_id,
    codigo,
    nombre,
    orden
)
SELECT
    id,
    'ALIMENTO',
    'Alimento',
    3
FROM catalogos
WHERE codigo = 'CATEGORIAS_FINANCIERAS';



INSERT OR IGNORE INTO catalogo_items
(
    catalogo_id,
    codigo,
    nombre,
    orden
)
SELECT
    id,
    'MEDICAMENTO',
    'Medicamento',
    4
FROM catalogos
WHERE codigo = 'CATEGORIAS_FINANCIERAS';



INSERT OR IGNORE INTO catalogo_items
(
    catalogo_id,
    codigo,
    nombre,
    orden
)
SELECT
    id,
    'INFRAESTRUCTURA',
    'Infraestructura',
    5
FROM catalogos
WHERE codigo = 'CATEGORIAS_FINANCIERAS';



INSERT OR IGNORE INTO catalogo_items
(
    catalogo_id,
    codigo,
    nombre,
    orden
)
SELECT
    id,
    'COMPRA_AVE',
    'Compra de ave',
    6
FROM catalogos
WHERE codigo = 'CATEGORIAS_FINANCIERAS';



INSERT OR IGNORE INTO catalogo_items
(
    catalogo_id,
    codigo,
    nombre,
    orden
)
SELECT
    id,
    'OTRO',
    'Otro',
    7
FROM catalogos
WHERE codigo = 'CATEGORIAS_FINANCIERAS';


`;