-- ============================================================
-- Criadero Kikirikis V2
-- Migration 0008 - Salud (tratamientos_ave)
--
-- Proposito: registrar los tratamientos asociados a un diagnostico
-- de un ave (medicamento, dosis y observacion).
--
-- Paridad con V1 (src/database/migrations.js:266): mismas columnas,
-- nulabilidad y valores por defecto. Sin CHECK, version, deleted_at
-- ni updated_at (V1 no los tiene). diagnostico_id es nullable, igual
-- que en V1. diagnosticos_ave y aves existen desde 0006.
--
-- Diferencias tecnicas del paso a online:
--   - id TEXT PRIMARY KEY (UUID v7) en lugar de INTEGER AUTOINCREMENT.
--   - criadero_id TEXT NOT NULL con FK a criaderos.
--   - ave_id con FK ON DELETE RESTRICT en lugar de CASCADE (V2 no
--     borra aves: baja logica por estado). La FK a diagnosticos_ave
--     tambien es RESTRICT (V1 no declaraba accion).
--   - Indices por ave_id y diagnostico_id (solo rendimiento).
-- ============================================================

CREATE TABLE tratamientos_ave (
    id TEXT PRIMARY KEY NOT NULL,
    criadero_id TEXT NOT NULL,
    diagnostico_id TEXT,
    ave_id TEXT NOT NULL,
    fecha TEXT NOT NULL,
    medicamento TEXT NOT NULL,
    dosis TEXT,
    observacion TEXT,
    fecha_creacion TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (criadero_id)
        REFERENCES criaderos(id)
        ON DELETE RESTRICT ON UPDATE RESTRICT,
    FOREIGN KEY (diagnostico_id)
        REFERENCES diagnosticos_ave(id)
        ON DELETE RESTRICT ON UPDATE RESTRICT,
    FOREIGN KEY (ave_id)
        REFERENCES aves(id)
        ON DELETE RESTRICT ON UPDATE RESTRICT
);

CREATE INDEX ix_tratamientos_ave_ave
    ON tratamientos_ave(ave_id);

CREATE INDEX ix_tratamientos_ave_diagnostico
    ON tratamientos_ave(diagnostico_id);
