export const DATABASE_VERSION_V4 = 4;


export const migrationV4 = `

ALTER TABLE aves
ADD COLUMN sexo TEXT;


ALTER TABLE aves
ADD COLUMN peso_gramos REAL;


ALTER TABLE aves
ADD COLUMN altura_cm REAL;


ALTER TABLE aves
ADD COLUMN largo_cm REAL;


INSERT OR IGNORE INTO catalogos
(
    codigo,
    nombre
)
VALUES
(
    'SEXOS',
    'Sexo de aves'
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
    'MACHO',
    'Macho',
    1
FROM catalogos
WHERE codigo = 'SEXOS';


INSERT OR IGNORE INTO catalogo_items
(
    catalogo_id,
    codigo,
    nombre,
    orden
)
SELECT
    id,
    'HEMBRA',
    'Hembra',
    2
FROM catalogos
WHERE codigo = 'SEXOS';

`;
