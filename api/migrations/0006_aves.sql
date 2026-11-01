-- ============================================================
-- Criadero Kikirikis V2
-- Migration 0006 - Aves, evolucion, historiales y diagnosticos
--
-- Replica las tablas de V1 (SQLite local, migraciones base + V2/V4/V5)
-- con las diferencias tecnicas del paso a online: id TEXT (UUID v7),
-- criadero_id, foto_uri -> foto_r2_key (R2) y FK con ON DELETE RESTRICT
-- (baja logica por estado; no hay hard delete de aves).
-- Sin CHECK, version ni deleted_at (V1 no los tiene).
--
-- Orden sin referencias circulares: aves (autorreferencia padre/madre)
-- -> ave_evolucion -> ave_historial -> jaula_historial -> diagnosticos_ave.
-- tratamientos_ave pertenece al modulo Salud y no se crea aqui.
-- ============================================================

CREATE TABLE aves (
    id TEXT PRIMARY KEY NOT NULL,
    criadero_id TEXT NOT NULL,
    codigo TEXT NOT NULL,
    origen TEXT NOT NULL,
    fecha_nacimiento TEXT,
    edad_meses_compra INTEGER,
    fecha_ingreso TEXT,
    criadero_origen TEXT,
    metodo_envio TEXT,
    raza TEXT,
    caracteristicas TEXT,
    foto_r2_key TEXT,
    padre_id TEXT,
    madre_id TEXT,
    jaula_actual_id TEXT,
    estado TEXT NOT NULL DEFAULT 'ACTIVA',
    fecha_creacion TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    fecha_actualizacion TEXT,
    estado_salud TEXT DEFAULT 'SANA',
    fecha_ultimo_control_salud TEXT,
    sexo TEXT,
    peso_gramos REAL,
    altura_cm REAL,
    largo_cm REAL,

    FOREIGN KEY (criadero_id)
        REFERENCES criaderos(id)
        ON DELETE RESTRICT ON UPDATE RESTRICT,
    FOREIGN KEY (padre_id)
        REFERENCES aves(id)
        ON DELETE RESTRICT ON UPDATE RESTRICT,
    FOREIGN KEY (madre_id)
        REFERENCES aves(id)
        ON DELETE RESTRICT ON UPDATE RESTRICT,
    FOREIGN KEY (jaula_actual_id)
        REFERENCES jaulas(id)
        ON DELETE RESTRICT ON UPDATE RESTRICT
);

-- Como en V1 (UNIQUE sobre codigo): unico por criadero, distingue mayusculas.
CREATE UNIQUE INDEX ux_aves_criadero_codigo
    ON aves(criadero_id, codigo);

CREATE INDEX ix_aves_criadero_estado
    ON aves(criadero_id, estado);

CREATE INDEX ix_aves_jaula_actual
    ON aves(jaula_actual_id);

CREATE TABLE ave_evolucion (
    id TEXT PRIMARY KEY NOT NULL,
    criadero_id TEXT NOT NULL,
    ave_id TEXT NOT NULL,
    fecha TEXT NOT NULL,
    foto_r2_key TEXT,
    caracteristicas TEXT,
    observacion TEXT,
    fecha_creacion TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    peso_gramos REAL,
    altura_cm REAL,
    largo_cm REAL,

    FOREIGN KEY (criadero_id)
        REFERENCES criaderos(id)
        ON DELETE RESTRICT ON UPDATE RESTRICT,
    FOREIGN KEY (ave_id)
        REFERENCES aves(id)
        ON DELETE RESTRICT ON UPDATE RESTRICT
);

CREATE INDEX ix_ave_evolucion_ave_fecha
    ON ave_evolucion(ave_id, fecha);

CREATE TABLE ave_historial (
    id TEXT PRIMARY KEY NOT NULL,
    criadero_id TEXT NOT NULL,
    ave_id TEXT NOT NULL,
    jaula_id TEXT,
    tipo_evento TEXT NOT NULL,
    fecha TEXT NOT NULL,
    detalle TEXT,
    fecha_creacion TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (criadero_id)
        REFERENCES criaderos(id)
        ON DELETE RESTRICT ON UPDATE RESTRICT,
    FOREIGN KEY (ave_id)
        REFERENCES aves(id)
        ON DELETE RESTRICT ON UPDATE RESTRICT,
    FOREIGN KEY (jaula_id)
        REFERENCES jaulas(id)
        ON DELETE RESTRICT ON UPDATE RESTRICT
);

CREATE INDEX ix_ave_historial_ave_fecha
    ON ave_historial(ave_id, fecha);

CREATE TABLE jaula_historial (
    id TEXT PRIMARY KEY NOT NULL,
    criadero_id TEXT NOT NULL,
    jaula_id TEXT NOT NULL,
    ave_id TEXT,
    tipo_evento TEXT NOT NULL,
    fecha TEXT NOT NULL,
    detalle TEXT,
    fecha_creacion TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (criadero_id)
        REFERENCES criaderos(id)
        ON DELETE RESTRICT ON UPDATE RESTRICT,
    FOREIGN KEY (jaula_id)
        REFERENCES jaulas(id)
        ON DELETE RESTRICT ON UPDATE RESTRICT,
    FOREIGN KEY (ave_id)
        REFERENCES aves(id)
        ON DELETE RESTRICT ON UPDATE RESTRICT
);

CREATE INDEX ix_jaula_historial_jaula_fecha
    ON jaula_historial(jaula_id, fecha);

-- Diagnosticos de salud de un ave (V1: diagnosticos_ave).
CREATE TABLE diagnosticos_ave (
    id TEXT PRIMARY KEY NOT NULL,
    criadero_id TEXT NOT NULL,
    ave_id TEXT NOT NULL,
    fecha TEXT NOT NULL,
    enfermedad TEXT NOT NULL,
    sintomas TEXT,
    observacion TEXT,
    estado TEXT NOT NULL DEFAULT 'ACTIVO',
    fecha_creacion TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (criadero_id)
        REFERENCES criaderos(id)
        ON DELETE RESTRICT ON UPDATE RESTRICT,
    FOREIGN KEY (ave_id)
        REFERENCES aves(id)
        ON DELETE RESTRICT ON UPDATE RESTRICT
);

CREATE INDEX ix_diagnosticos_ave_estado
    ON diagnosticos_ave(ave_id, estado);
