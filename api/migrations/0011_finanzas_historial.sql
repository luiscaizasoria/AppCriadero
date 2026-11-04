-- ============================================================
-- Criadero Kikirikis V2
-- Migration 0011 - Finanzas (movimientos_financieros_historial)
--
-- Proposito: auditoria de las correcciones de movimientos
-- financieros (EDICION_MANUAL, CORRECCION_VENTA, CORRECCION_ENVIO,
-- CREACION_POR_CORRECCION). movimientos_financieros ya existe (0010).
--
-- Paridad con V1 (src/database/migrationV6.js:20-45): mismas 15
-- columnas de datos, nulabilidad y valores por defecto. accion sin
-- restriccion; origen_id sin FK (polimorfico). Sin CHECK,
-- fecha_creacion, created_at, updated_at, deleted_at ni version
-- (V1 no los tiene).
--
-- Diferencias tecnicas del paso a online:
--   - id TEXT PRIMARY KEY (UUID v7) en lugar de INTEGER AUTOINCREMENT;
--     movimiento_id y origen_id pasan a TEXT.
--   - criadero_id TEXT NOT NULL con FK a criaderos.
--   - FK con ON DELETE/UPDATE RESTRICT (V1 no declaraba accion).
-- ============================================================

CREATE TABLE movimientos_financieros_historial (
    id TEXT PRIMARY KEY NOT NULL,
    criadero_id TEXT NOT NULL,
    movimiento_id TEXT NOT NULL,
    fecha TEXT NOT NULL,
    accion TEXT NOT NULL,
    tipo_anterior TEXT,
    tipo_nuevo TEXT,
    categoria_anterior TEXT,
    categoria_nueva TEXT,
    fecha_movimiento_anterior TEXT,
    fecha_movimiento_nueva TEXT,
    valor_anterior REAL,
    valor_nuevo REAL,
    detalle_anterior TEXT,
    detalle_nuevo TEXT,
    origen_tipo TEXT,
    origen_id TEXT,

    FOREIGN KEY (criadero_id)
        REFERENCES criaderos(id)
        ON DELETE RESTRICT ON UPDATE RESTRICT,
    FOREIGN KEY (movimiento_id)
        REFERENCES movimientos_financieros(id)
        ON DELETE RESTRICT ON UPDATE RESTRICT
);

-- idx_mov_fin_hist_movimiento de V1 (migrationV6.js:43-45); cubre la FK
-- y obtenerHistorialMovimiento.
CREATE INDEX ix_movimientos_historial_movimiento
    ON movimientos_financieros_historial(movimiento_id);
