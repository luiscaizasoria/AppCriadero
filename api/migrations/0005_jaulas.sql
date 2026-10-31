-- ============================================================
-- Criadero Kikirikis V2
-- Migration 0005 - Jaulas
--
-- Replica la tabla `jaulas` de V1 (SQLite local) con las
-- diferencias tecnicas del paso a online: id TEXT (UUID v7) y
-- criadero_id. Sin CHECK, version ni deleted_at (V1 no los tiene:
-- "eliminar" una jaula es activa = 0).
--
-- jaula_historial y las aves llegan en la migracion 0006.
-- ============================================================

CREATE TABLE jaulas (
    id TEXT PRIMARY KEY NOT NULL,
    criadero_id TEXT NOT NULL,
    codigo TEXT NOT NULL,
    nombre TEXT,
    ubicacion TEXT,
    tipo TEXT,
    estado_sanitario TEXT NOT NULL DEFAULT 'NORMAL',
    activa INTEGER NOT NULL DEFAULT 1,
    fecha_creacion TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    fecha_actualizacion TEXT,
    fecha_desactivacion TEXT,

    FOREIGN KEY (criadero_id)
        REFERENCES criaderos(id)
        ON DELETE RESTRICT
        ON UPDATE RESTRICT
);

-- Como en V1 (UNIQUE sobre codigo): el codigo es unico entre TODAS las
-- jaulas del criadero, activas e inactivas, y distingue mayusculas.
CREATE UNIQUE INDEX ux_jaulas_criadero_codigo
    ON jaulas(criadero_id, codigo);

CREATE INDEX ix_jaulas_criadero_activa
    ON jaulas(criadero_id, activa);
