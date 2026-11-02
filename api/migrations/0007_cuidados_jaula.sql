-- ============================================================
-- Criadero Kikirikis V2
-- Migration 0007 - Cuidados de jaula (alimentacion, bebida, sanidad)
--
-- Proposito: registrar los cuidados de una jaula como eventos
-- inmutables (alimentacion_jaula, bebida_jaula, sanidad_jaula).
--
-- Paridad con V1 (src/database/migrations.js): mismas columnas,
-- nulabilidad y valores por defecto. Sin CHECK, version, deleted_at
-- ni updated_at (V1 no los tiene). `tipo` es texto libre (nombre del
-- item de catalogo o texto de pantalla), sin FK al catalogo.
-- sanidad_jaula no tiene `cantidad`, igual que en V1.
-- jaulas.estado_sanitario ya existe en 0005; jaula_historial en 0006.
--
-- Diferencias tecnicas del paso a online:
--   - id TEXT PRIMARY KEY (UUID v7) en lugar de INTEGER AUTOINCREMENT.
--   - criadero_id TEXT NOT NULL con FK a criaderos.
--   - jaula_id TEXT con FK ON DELETE RESTRICT en lugar de CASCADE
--     (V2 no borra jaulas: baja logica por estado).
-- ============================================================

CREATE TABLE alimentacion_jaula (
    id TEXT PRIMARY KEY NOT NULL,
    criadero_id TEXT NOT NULL,
    jaula_id TEXT NOT NULL,
    fecha TEXT NOT NULL,
    tipo TEXT NOT NULL,
    cantidad TEXT,
    detalle TEXT,
    fecha_creacion TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (criadero_id)
        REFERENCES criaderos(id)
        ON DELETE RESTRICT ON UPDATE RESTRICT,
    FOREIGN KEY (jaula_id)
        REFERENCES jaulas(id)
        ON DELETE RESTRICT ON UPDATE RESTRICT
);

CREATE INDEX ix_alimentacion_jaula_jaula_fecha
    ON alimentacion_jaula(jaula_id, fecha);

CREATE TABLE bebida_jaula (
    id TEXT PRIMARY KEY NOT NULL,
    criadero_id TEXT NOT NULL,
    jaula_id TEXT NOT NULL,
    fecha TEXT NOT NULL,
    tipo TEXT NOT NULL,
    cantidad TEXT,
    detalle TEXT,
    fecha_creacion TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (criadero_id)
        REFERENCES criaderos(id)
        ON DELETE RESTRICT ON UPDATE RESTRICT,
    FOREIGN KEY (jaula_id)
        REFERENCES jaulas(id)
        ON DELETE RESTRICT ON UPDATE RESTRICT
);

CREATE INDEX ix_bebida_jaula_jaula_fecha
    ON bebida_jaula(jaula_id, fecha);

CREATE TABLE sanidad_jaula (
    id TEXT PRIMARY KEY NOT NULL,
    criadero_id TEXT NOT NULL,
    jaula_id TEXT NOT NULL,
    fecha TEXT NOT NULL,
    tipo TEXT NOT NULL,
    detalle TEXT,
    fecha_creacion TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (criadero_id)
        REFERENCES criaderos(id)
        ON DELETE RESTRICT ON UPDATE RESTRICT,
    FOREIGN KEY (jaula_id)
        REFERENCES jaulas(id)
        ON DELETE RESTRICT ON UPDATE RESTRICT
);

CREATE INDEX ix_sanidad_jaula_jaula_fecha
    ON sanidad_jaula(jaula_id, fecha);
