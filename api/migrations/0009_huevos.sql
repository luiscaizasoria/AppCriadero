-- ============================================================
-- Criadero Kikirikis V2
-- Migration 0009 - Huevos (huevos)
--
-- Proposito: registrar los huevos puestos por un ave individual
-- (codigo H000001..., fecha, jaula donde estaba y observacion).
--
-- Paridad con V1 (src/database/migrations.js:218): mismas columnas,
-- nulabilidad y valores por defecto (estado DEFAULT 'REGISTRADO',
-- jaula_id nullable, observacion nullable). Sin CHECK, version,
-- deleted_at ni updated_at (V1 no los tiene; los huevos solo se
-- crean y se leen). aves y jaulas existen desde 0005 y 0006.
--
-- Diferencias tecnicas del paso a online:
--   - id TEXT PRIMARY KEY (UUID v7) en lugar de INTEGER AUTOINCREMENT.
--   - criadero_id TEXT NOT NULL con FK a criaderos.
--   - codigo: UNIQUE por criadero (UNIQUE (criadero_id, codigo)) en
--     lugar de UNIQUE global; el contador pasa a ser por criadero.
--   - FK a aves y jaulas con ON DELETE/UPDATE RESTRICT (V1 no
--     declaraba accion; V2 no borra aves ni jaulas).
--   - Indices por ave, criadero y jaula (rendimiento; no cambian
--     resultados). V1 solo tenia idx_huevos_ave(ave_id).
-- ============================================================

CREATE TABLE huevos (
    id TEXT PRIMARY KEY NOT NULL,
    criadero_id TEXT NOT NULL,
    codigo TEXT NOT NULL,
    ave_id TEXT NOT NULL,
    jaula_id TEXT,
    fecha TEXT NOT NULL,
    estado TEXT NOT NULL DEFAULT 'REGISTRADO',
    observacion TEXT,
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

-- Codigo unico por criadero; ademas respalda el COUNT(*) por criadero
-- del INSERT ... SELECT que genera el codigo.
CREATE UNIQUE INDEX ux_huevos_criadero_codigo
    ON huevos(criadero_id, codigo);

-- obtenerHuevosAve (WHERE ave_id ORDER BY fecha DESC); sustituye a
-- idx_huevos_ave de V1 y cubre la comprobacion de la FK a aves.
CREATE INDEX ix_huevos_ave_fecha
    ON huevos(ave_id, fecha);

-- Agregados de produccion (resumen, por dia, por hora) filtrados por criadero.
CREATE INDEX ix_huevos_criadero_fecha
    ON huevos(criadero_id, fecha);

-- Produccion por jaula y comprobacion de la FK a jaulas.
CREATE INDEX ix_huevos_jaula
    ON huevos(jaula_id);
