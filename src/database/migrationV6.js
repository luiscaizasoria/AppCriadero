export const DATABASE_VERSION_V6 = 6;


export const migrationV6 = `

ALTER TABLE jaulas
ADD COLUMN fecha_desactivacion TEXT;


UPDATE jaulas
SET fecha_desactivacion = COALESCE(
    fecha_actualizacion,
    fecha_creacion,
    CURRENT_TIMESTAMP
)
WHERE activa = 0
AND fecha_desactivacion IS NULL;


CREATE TABLE IF NOT EXISTS movimientos_financieros_historial
(
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    movimiento_id INTEGER NOT NULL,
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
    origen_id INTEGER,
    FOREIGN KEY (movimiento_id)
        REFERENCES movimientos_financieros(id)
);


CREATE INDEX IF NOT EXISTS
idx_mov_fin_hist_movimiento
ON movimientos_financieros_historial(movimiento_id);


CREATE INDEX IF NOT EXISTS
idx_movimientos_financieros_origen
ON movimientos_financieros(origen_tipo, origen_id);


INSERT OR IGNORE INTO catalogo_items
(
    catalogo_id,
    codigo,
    nombre,
    orden
)
SELECT
    c.id,
    'ENVIO_AVE',
    'Envío de ave',
    COALESCE(
        (
            SELECT MAX(ci.orden) + 1
            FROM catalogo_items ci
            WHERE ci.catalogo_id = c.id
        ),
        1
    )
FROM catalogos c
WHERE c.codigo = 'CATEGORIAS_FINANCIERAS';


INSERT INTO movimientos_financieros
(
    tipo,
    categoria,
    fecha,
    valor,
    detalle,
    ave_id,
    origen_tipo,
    origen_id
)
SELECT
    'INGRESO',
    'ENVIO_AVE',
    b.fecha,
    b.valor_envio,
    'Valor de envío asociado a venta de ave',
    b.ave_id,
    'VENTA_AVE',
    b.id
FROM bajas_ave b
WHERE b.tipo = 'VENTA'
AND COALESCE(b.valor_envio, 0) > 0
AND NOT EXISTS
(
    SELECT 1
    FROM movimientos_financieros mf
    WHERE mf.origen_tipo = 'VENTA_AVE'
    AND mf.origen_id = b.id
    AND mf.categoria = 'ENVIO_AVE'
);

`;
