-- ============================================================
-- Criadero Kikirikis V2
-- Migration 0010 - Bajas (bajas_ave, movimientos_financieros)
--
-- Proposito: registrar las bajas de aves individuales (venta o
-- muerte) y los dos movimientos financieros que genera una venta
-- (VENTA_AVE y ENVIO_AVE). movimientos_financieros se crea aqui
-- porque la venta la escribe; Finanzas anade despues
-- movimientos_financieros_historial (0011).
--
-- Paridad con V1 (src/database/migrations.js:292-343, migrationV5.js:18-23,
-- migrationV6.js:48-50): mismas columnas, nulabilidad y valores por
-- defecto. Importes REAL; origen_id sin FK (polimorfico). Sin CHECK,
-- created_at, updated_at, deleted_at ni version (V1 no los tiene).
--
-- Diferencias tecnicas del paso a online:
--   - id TEXT PRIMARY KEY (UUID v7) en lugar de INTEGER AUTOINCREMENT;
--     origen_id pasa a TEXT (en VENTA_AVE es bajas_ave.id).
--   - criadero_id TEXT NOT NULL con FK a criaderos.
--   - FK a aves con ON DELETE/UPDATE RESTRICT (V1 no declaraba accion).
--   - Indices de rendimiento (no cambian resultados).
-- ============================================================

CREATE TABLE bajas_ave (
    id TEXT PRIMARY KEY NOT NULL,
    criadero_id TEXT NOT NULL,
    ave_id TEXT NOT NULL,
    tipo TEXT NOT NULL,
    fecha TEXT NOT NULL,
    causa TEXT,
    celular TEXT,
    ciudad_destino TEXT,
    cooperativa_envio TEXT,
    comprador TEXT,
    valor_venta REAL,
    valor_envio REAL,
    detalle TEXT,
    fecha_creacion TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (criadero_id)
        REFERENCES criaderos(id)
        ON DELETE RESTRICT ON UPDATE RESTRICT,
    FOREIGN KEY (ave_id)
        REFERENCES aves(id)
        ON DELETE RESTRICT ON UPDATE RESTRICT
);

-- Listados y obtenerBajaAve; cubre la comprobacion de la FK a aves.
CREATE INDEX ix_bajas_ave_ave
    ON bajas_ave(ave_id, fecha);

-- idx_bajas_ave_celular de V1 (lo usara Clientes).
CREATE INDEX ix_bajas_ave_celular
    ON bajas_ave(celular);

CREATE TABLE movimientos_financieros (
    id TEXT PRIMARY KEY NOT NULL,
    criadero_id TEXT NOT NULL,
    tipo TEXT NOT NULL,
    categoria TEXT,
    fecha TEXT NOT NULL,
    valor REAL NOT NULL,
    detalle TEXT,
    ave_id TEXT,
    origen_tipo TEXT,
    origen_id TEXT,
    fecha_creacion TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (criadero_id)
        REFERENCES criaderos(id)
        ON DELETE RESTRICT ON UPDATE RESTRICT,
    FOREIGN KEY (ave_id)
        REFERENCES aves(id)
        ON DELETE RESTRICT ON UPDATE RESTRICT
);

-- idx_movimientos_fecha de V1, por criadero.
CREATE INDEX ix_movimientos_criadero_fecha
    ON movimientos_financieros(criadero_id, fecha);

-- Busqueda por origen (indice de migrationV6.js): sincronizarMovimientoVenta
-- y corregirVentaFinanciera.
CREATE INDEX ix_movimientos_origen
    ON movimientos_financieros(origen_tipo, origen_id);
