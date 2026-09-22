export const DATABASE_VERSION = 1;

export const migrationV1 = `
    CREATE TABLE IF NOT EXISTS catalogos (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        codigo TEXT NOT NULL UNIQUE,
        nombre TEXT NOT NULL,
        activo INTEGER NOT NULL DEFAULT 1,
        fecha_creacion TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS catalogo_items (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        catalogo_id INTEGER NOT NULL,
        codigo TEXT NOT NULL,
        nombre TEXT NOT NULL,
        descripcion TEXT,
        activo INTEGER NOT NULL DEFAULT 1,
        orden INTEGER NOT NULL DEFAULT 0,
        fecha_creacion TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,

        FOREIGN KEY (catalogo_id)
            REFERENCES catalogos(id),

        UNIQUE(catalogo_id, codigo)
    );


    CREATE TABLE IF NOT EXISTS jaulas (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        codigo TEXT NOT NULL UNIQUE,
        nombre TEXT,
        ubicacion TEXT,
        tipo TEXT,
        estado_sanitario TEXT NOT NULL DEFAULT 'NORMAL',
        activa INTEGER NOT NULL DEFAULT 1,
        fecha_creacion TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
        fecha_actualizacion TEXT
    );


    CREATE TABLE IF NOT EXISTS aves (
        id INTEGER PRIMARY KEY AUTOINCREMENT,

        codigo TEXT NOT NULL UNIQUE,

        origen TEXT NOT NULL,

        fecha_nacimiento TEXT,

        edad_meses_compra INTEGER,

        fecha_ingreso TEXT,

        criadero_origen TEXT,

        metodo_envio TEXT,

        raza TEXT,

        caracteristicas TEXT,

        foto_uri TEXT,

        padre_id INTEGER,

        madre_id INTEGER,

        jaula_actual_id INTEGER,

        estado TEXT NOT NULL DEFAULT 'ACTIVA',

        fecha_creacion TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,

        fecha_actualizacion TEXT,

        FOREIGN KEY (padre_id)
            REFERENCES aves(id),

        FOREIGN KEY (madre_id)
            REFERENCES aves(id),

        FOREIGN KEY (jaula_actual_id)
            REFERENCES jaulas(id)
    );


    CREATE TABLE IF NOT EXISTS ave_evolucion (
        id INTEGER PRIMARY KEY AUTOINCREMENT,

        ave_id INTEGER NOT NULL,

        fecha TEXT NOT NULL,

        foto_uri TEXT,

        caracteristicas TEXT,

        observacion TEXT,

        fecha_creacion TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,

        FOREIGN KEY (ave_id)
            REFERENCES aves(id)
            ON DELETE CASCADE
    );


    CREATE TABLE IF NOT EXISTS jaula_historial (
        id INTEGER PRIMARY KEY AUTOINCREMENT,

        jaula_id INTEGER NOT NULL,

        ave_id INTEGER,

        tipo_evento TEXT NOT NULL,

        fecha TEXT NOT NULL,

        detalle TEXT,

        fecha_creacion TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,

        FOREIGN KEY (jaula_id)
            REFERENCES jaulas(id)
            ON DELETE CASCADE,

        FOREIGN KEY (ave_id)
            REFERENCES aves(id)
    );


    CREATE TABLE IF NOT EXISTS ave_historial (
        id INTEGER PRIMARY KEY AUTOINCREMENT,

        ave_id INTEGER NOT NULL,

        jaula_id INTEGER,

        tipo_evento TEXT NOT NULL,

        fecha TEXT NOT NULL,

        detalle TEXT,

        fecha_creacion TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,

        FOREIGN KEY (ave_id)
            REFERENCES aves(id)
            ON DELETE CASCADE,

        FOREIGN KEY (jaula_id)
            REFERENCES jaulas(id)
    );


    CREATE TABLE IF NOT EXISTS alimentacion_jaula (
        id INTEGER PRIMARY KEY AUTOINCREMENT,

        jaula_id INTEGER NOT NULL,

        fecha TEXT NOT NULL,

        tipo TEXT NOT NULL,

        cantidad TEXT,

        detalle TEXT,

        fecha_creacion TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,

        FOREIGN KEY (jaula_id)
            REFERENCES jaulas(id)
            ON DELETE CASCADE
    );


    CREATE TABLE IF NOT EXISTS bebida_jaula (
        id INTEGER PRIMARY KEY AUTOINCREMENT,

        jaula_id INTEGER NOT NULL,

        fecha TEXT NOT NULL,

        tipo TEXT NOT NULL,

        cantidad TEXT,

        detalle TEXT,

        fecha_creacion TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,

        FOREIGN KEY (jaula_id)
            REFERENCES jaulas(id)
            ON DELETE CASCADE
    );


    CREATE TABLE IF NOT EXISTS sanidad_jaula (
        id INTEGER PRIMARY KEY AUTOINCREMENT,

        jaula_id INTEGER NOT NULL,

        fecha TEXT NOT NULL,

        tipo TEXT NOT NULL,

        detalle TEXT,

        fecha_creacion TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,

        FOREIGN KEY (jaula_id)
            REFERENCES jaulas(id)
            ON DELETE CASCADE
    );


    CREATE TABLE IF NOT EXISTS huevos (
        id INTEGER PRIMARY KEY AUTOINCREMENT,

        codigo TEXT NOT NULL UNIQUE,

        ave_id INTEGER NOT NULL,

        jaula_id INTEGER,

        fecha TEXT NOT NULL,

        estado TEXT NOT NULL DEFAULT 'REGISTRADO',

        observacion TEXT,

        fecha_creacion TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,

        FOREIGN KEY (ave_id)
            REFERENCES aves(id),

        FOREIGN KEY (jaula_id)
            REFERENCES jaulas(id)
    );


    CREATE TABLE IF NOT EXISTS diagnosticos_ave (
        id INTEGER PRIMARY KEY AUTOINCREMENT,

        ave_id INTEGER NOT NULL,

        fecha TEXT NOT NULL,

        enfermedad TEXT NOT NULL,

        sintomas TEXT,

        observacion TEXT,

        estado TEXT NOT NULL DEFAULT 'ACTIVO',

        fecha_creacion TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,

        FOREIGN KEY (ave_id)
            REFERENCES aves(id)
            ON DELETE CASCADE
    );


    CREATE TABLE IF NOT EXISTS tratamientos_ave (
        id INTEGER PRIMARY KEY AUTOINCREMENT,

        diagnostico_id INTEGER,

        ave_id INTEGER NOT NULL,

        fecha TEXT NOT NULL,

        medicamento TEXT NOT NULL,

        dosis TEXT,

        observacion TEXT,

        fecha_creacion TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,

        FOREIGN KEY (diagnostico_id)
            REFERENCES diagnosticos_ave(id),

        FOREIGN KEY (ave_id)
            REFERENCES aves(id)
            ON DELETE CASCADE
    );


    CREATE TABLE IF NOT EXISTS bajas_ave (
        id INTEGER PRIMARY KEY AUTOINCREMENT,

        ave_id INTEGER NOT NULL,

        tipo TEXT NOT NULL,

        fecha TEXT NOT NULL,

        causa TEXT,

        ciudad_destino TEXT,

        cooperativa_envio TEXT,

        comprador TEXT,

        valor_venta REAL,

        detalle TEXT,

        fecha_creacion TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,

        FOREIGN KEY (ave_id)
            REFERENCES aves(id)
    );


    CREATE TABLE IF NOT EXISTS movimientos_financieros (
        id INTEGER PRIMARY KEY AUTOINCREMENT,

        tipo TEXT NOT NULL,

        categoria TEXT,

        fecha TEXT NOT NULL,

        valor REAL NOT NULL,

        detalle TEXT,

        ave_id INTEGER,

        origen_tipo TEXT,

        origen_id INTEGER,

        fecha_creacion TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,

        FOREIGN KEY (ave_id)
            REFERENCES aves(id)
    );


    CREATE INDEX IF NOT EXISTS idx_aves_jaula
        ON aves(jaula_actual_id);

    CREATE INDEX IF NOT EXISTS idx_aves_estado
        ON aves(estado);

    CREATE INDEX IF NOT EXISTS idx_jaula_historial_jaula
        ON jaula_historial(jaula_id);

    CREATE INDEX IF NOT EXISTS idx_ave_historial_ave
        ON ave_historial(ave_id);

    CREATE INDEX IF NOT EXISTS idx_huevos_ave
        ON huevos(ave_id);

    CREATE INDEX IF NOT EXISTS idx_diagnosticos_ave
        ON diagnosticos_ave(ave_id);

    CREATE INDEX IF NOT EXISTS idx_movimientos_fecha
        ON movimientos_financieros(fecha);
`;