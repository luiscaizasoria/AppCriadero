export const DATABASE_VERSION_V2 = 2;


export const migrationV2 = `

    ALTER TABLE aves
    ADD COLUMN estado_salud TEXT
    DEFAULT 'SANA';


    ALTER TABLE aves
    ADD COLUMN fecha_ultimo_control_salud TEXT;


    CREATE TABLE IF NOT EXISTS enfermedades_catalogo
    (

        id INTEGER PRIMARY KEY AUTOINCREMENT,

        codigo TEXT NOT NULL UNIQUE,

        nombre TEXT NOT NULL,

        activo INTEGER NOT NULL DEFAULT 1,

        fecha_creacion TEXT
        DEFAULT CURRENT_TIMESTAMP

    );


    CREATE TABLE IF NOT EXISTS medicamentos_catalogo
    (

        id INTEGER PRIMARY KEY AUTOINCREMENT,

        codigo TEXT NOT NULL UNIQUE,

        nombre TEXT NOT NULL,

        activo INTEGER NOT NULL DEFAULT 1,

        fecha_creacion TEXT
        DEFAULT CURRENT_TIMESTAMP

    );


    INSERT OR IGNORE INTO enfermedades_catalogo
    (
        codigo,
        nombre
    )
    VALUES

    ('COCCIDIA','Coccidia'),

    ('CORIZA','Coriza'),

    ('GRIPE','Gripe'),

    ('OTRO','Otro');



    INSERT OR IGNORE INTO medicamentos_catalogo
    (
        codigo,
        nombre
    )
    VALUES

    ('VITAMINA','Vitamina'),

    ('ANTIBIOTICO','Antibiótico'),

    ('ANTIPARASITARIO','Antiparasitario'),

    ('OTRO','Otro');

`;