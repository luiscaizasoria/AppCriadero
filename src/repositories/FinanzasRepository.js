import {
    getDatabase
} from '../database/database';


export async function obtenerResumenFinanciero(
    periodo = 'TODO'
) {

    const db =
        await getDatabase();

    const filtroFecha =
        construirFiltroPeriodo(
            periodo,
            'fecha'
        );

    const resultado =
        await db.getFirstAsync(
            `
            SELECT
                COALESCE(
                    SUM(
                        CASE
                            WHEN tipo = 'INGRESO'
                            THEN valor
                            ELSE 0
                        END
                    ),
                    0
                ) AS ingresos,

                COALESCE(
                    SUM(
                        CASE
                            WHEN tipo = 'EGRESO'
                            THEN valor
                            ELSE 0
                        END
                    ),
                    0
                ) AS egresos

            FROM movimientos_financieros
            ${filtroFecha}
            `
        );

    const ingresos =
        Number(
            resultado?.ingresos || 0
        );

    const egresos =
        Number(
            resultado?.egresos || 0
        );

    return {
        ingresos,
        egresos,
        utilidad:
            ingresos - egresos
    };

}


export async function obtenerMovimientosFinancieros() {

    const db =
        await getDatabase();

    return await db.getAllAsync(
        `
        SELECT
            mf.id,
            mf.tipo,
            mf.categoria,
            mf.fecha,
            mf.valor,
            mf.detalle,
            mf.ave_id,
            mf.origen_tipo,
            mf.origen_id,
            a.codigo AS ave_codigo
        FROM movimientos_financieros mf
        LEFT JOIN aves a
            ON a.id = mf.ave_id
        ORDER BY
            mf.fecha DESC,
            mf.id DESC
        `
    );

}


export async function obtenerIngresos() {

    const db =
        await getDatabase();

    return await db.getAllAsync(
        `
        SELECT
            mf.id,
            mf.categoria,
            mf.fecha,
            mf.valor,
            mf.detalle,
            mf.ave_id,
            mf.origen_tipo,
            mf.origen_id,
            a.codigo AS ave_codigo
        FROM movimientos_financieros mf
        LEFT JOIN aves a
            ON a.id = mf.ave_id
        WHERE mf.tipo = 'INGRESO'
        ORDER BY
            mf.fecha DESC,
            mf.id DESC
        `
    );

}


export async function obtenerEgresos() {

    const db =
        await getDatabase();

    return await db.getAllAsync(
        `
        SELECT
            mf.id,
            mf.categoria,
            mf.fecha,
            mf.valor,
            mf.detalle,
            mf.ave_id,
            mf.origen_tipo,
            mf.origen_id,
            a.codigo AS ave_codigo
        FROM movimientos_financieros mf
        LEFT JOIN aves a
            ON a.id = mf.ave_id
        WHERE mf.tipo = 'EGRESO'
        ORDER BY
            mf.fecha DESC,
            mf.id DESC
        `
    );

}


export async function registrarIngreso({
    categoria,
    valor,
    detalle,
    fecha
}) {

    return await registrarMovimientoManual({
        tipo:'INGRESO',
        categoria,
        valor,
        detalle,
        fecha
    });

}


export async function registrarEgreso({
    categoria,
    valor,
    detalle,
    fecha
}) {

    return await registrarMovimientoManual({
        tipo:'EGRESO',
        categoria,
        valor,
        detalle,
        fecha
    });

}


async function registrarMovimientoManual({
    tipo,
    categoria,
    valor,
    detalle,
    fecha
}) {

    const db =
        await getDatabase();

    const result =
        await db.runAsync(
            `
            INSERT INTO movimientos_financieros
            (
                tipo,
                categoria,
                fecha,
                valor,
                detalle,
                origen_tipo
            )
            VALUES (?, ?, ?, ?, ?, ?)
            `,
            [
                tipo,
                categoria || 'OTRO',
                fecha || new Date().toISOString(),
                Number(valor),
                detalle || null,
                'MANUAL'
            ]
        );

    return result.lastInsertRowId;

}


export async function obtenerMovimientoPorId(
    id
) {

    const db =
        await getDatabase();

    return await db.getFirstAsync(
        `
        SELECT
            mf.*,
            a.codigo AS ave_codigo
        FROM movimientos_financieros mf
        LEFT JOIN aves a
            ON a.id = mf.ave_id
        WHERE mf.id = ?
        `,
        [id]
    );

}


export async function obtenerVentaPorBajaId(
    bajaId
) {

    const db =
        await getDatabase();

    return await db.getFirstAsync(
        `
        SELECT
            b.id,
            b.ave_id,
            b.fecha,
            b.celular,
            b.comprador,
            b.ciudad_destino,
            b.cooperativa_envio,
            b.valor_venta,
            b.valor_envio,
            b.detalle,
            a.codigo AS ave_codigo
        FROM bajas_ave b
        INNER JOIN aves a
            ON a.id = b.ave_id
        WHERE b.id = ?
        AND b.tipo = 'VENTA'
        `,
        [bajaId]
    );

}


export async function actualizarMovimientoManual({
    id,
    tipo,
    categoria,
    valor,
    detalle,
    fecha
}) {

    const db =
        await getDatabase();

    await db.withTransactionAsync(
        async () => {

            const anterior =
                await db.getFirstAsync(
                    `
                    SELECT *
                    FROM movimientos_financieros
                    WHERE id = ?
                    `,
                    [id]
                );

            if(!anterior){
                throw new Error(
                    'MOVIMIENTO_NO_ENCONTRADO'
                );
            }

            if(
                anterior.origen_tipo
                &&
                anterior.origen_tipo !== 'MANUAL'
            ){
                throw new Error(
                    'MOVIMIENTO_AUTOMATICO_NO_EDITABLE'
                );
            }

            const nuevoValor =
                Number(valor);

            if(
                !Number.isFinite(nuevoValor)
                ||
                nuevoValor <= 0
            ){
                throw new Error(
                    'VALOR_INVALIDO'
                );
            }

            const nuevaFecha =
                fecha ||
                anterior.fecha;

            const nuevoDetalle =
                detalle?.trim() ||
                null;

            const nuevaCategoria =
                categoria ||
                'OTRO';

            const nuevoTipo =
                tipo === 'EGRESO'
                    ? 'EGRESO'
                    : 'INGRESO';

            await registrarAuditoria(
                db,
                anterior,
                {
                    tipo:nuevoTipo,
                    categoria:nuevaCategoria,
                    fecha:nuevaFecha,
                    valor:nuevoValor,
                    detalle:nuevoDetalle
                },
                'EDICION_MANUAL'
            );

            await db.runAsync(
                `
                UPDATE movimientos_financieros
                SET
                    tipo = ?,
                    categoria = ?,
                    fecha = ?,
                    valor = ?,
                    detalle = ?
                WHERE id = ?
                `,
                [
                    nuevoTipo,
                    nuevaCategoria,
                    nuevaFecha,
                    nuevoValor,
                    nuevoDetalle,
                    id
                ]
            );

        }
    );

}


export async function corregirVentaFinanciera({
    bajaId,
    valorVenta,
    valorEnvio
}) {

    const db =
        await getDatabase();

    const valorAve =
        numeroNoNegativo(
            valorVenta
        );

    const valorTransporte =
        numeroNoNegativo(
            valorEnvio
        );

    if(
        valorAve === null
        ||
        valorTransporte === null
    ){
        throw new Error(
            'VALOR_INVALIDO'
        );
    }

    await db.withTransactionAsync(
        async () => {

            const venta =
                await db.getFirstAsync(
                    `
                    SELECT *
                    FROM bajas_ave
                    WHERE id = ?
                    AND tipo = 'VENTA'
                    `,
                    [bajaId]
                );

            if(!venta){
                throw new Error(
                    'VENTA_NO_ENCONTRADA'
                );
            }

            await db.runAsync(
                `
                UPDATE bajas_ave
                SET
                    valor_venta = ?,
                    valor_envio = ?
                WHERE id = ?
                `,
                [
                    valorAve,
                    valorTransporte,
                    bajaId
                ]
            );

            await sincronizarMovimientoVenta({
                db,
                venta,
                categoria:'VENTA_AVE',
                valor:valorAve,
                detalle:
                    `Venta de ave ${venta.ave_id}`,
                accion:'CORRECCION_VENTA'
            });

            await sincronizarMovimientoVenta({
                db,
                venta,
                categoria:'ENVIO_AVE',
                valor:valorTransporte,
                detalle:
                    `Envío asociado a venta de ave ${venta.ave_id}`,
                accion:'CORRECCION_ENVIO'
            });

        }
    );

}


async function sincronizarMovimientoVenta({
    db,
    venta,
    categoria,
    valor,
    detalle,
    accion
}) {

    const existente =
        await db.getFirstAsync(
            `
            SELECT *
            FROM movimientos_financieros
            WHERE origen_tipo = 'VENTA_AVE'
            AND origen_id = ?
            AND categoria = ?
            ORDER BY id
            LIMIT 1
            `,
            [
                venta.id,
                categoria
            ]
        );

    if(existente){

        await registrarAuditoria(
            db,
            existente,
            {
                tipo:'INGRESO',
                categoria,
                fecha:venta.fecha,
                valor,
                detalle
            },
            accion
        );

        await db.runAsync(
            `
            UPDATE movimientos_financieros
            SET
                tipo = 'INGRESO',
                categoria = ?,
                fecha = ?,
                valor = ?,
                detalle = ?,
                ave_id = ?,
                origen_tipo = 'VENTA_AVE',
                origen_id = ?
            WHERE id = ?
            `,
            [
                categoria,
                venta.fecha,
                valor,
                detalle,
                venta.ave_id,
                venta.id,
                existente.id
            ]
        );

        return;

    }

    const insert =
        await db.runAsync(
            `
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
            VALUES
            ('INGRESO', ?, ?, ?, ?, ?, 'VENTA_AVE', ?)
            `,
            [
                categoria,
                venta.fecha,
                valor,
                detalle,
                venta.ave_id,
                venta.id
            ]
        );

    const creado =
        await db.getFirstAsync(
            `
            SELECT *
            FROM movimientos_financieros
            WHERE id = ?
            `,
            [insert.lastInsertRowId]
        );

    await registrarAuditoria(
        db,
        {
            id:creado.id,
            tipo:null,
            categoria:null,
            fecha:null,
            valor:null,
            detalle:null,
            origen_tipo:creado.origen_tipo,
            origen_id:creado.origen_id
        },
        creado,
        'CREACION_POR_CORRECCION'
    );

}


async function registrarAuditoria(
    db,
    anterior,
    nuevo,
    accion
) {

    await db.runAsync(
        `
        INSERT INTO movimientos_financieros_historial
        (
            movimiento_id,
            fecha,
            accion,
            tipo_anterior,
            tipo_nuevo,
            categoria_anterior,
            categoria_nueva,
            fecha_movimiento_anterior,
            fecha_movimiento_nueva,
            valor_anterior,
            valor_nuevo,
            detalle_anterior,
            detalle_nuevo,
            origen_tipo,
            origen_id
        )
        VALUES
        (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `,
        [
            anterior.id,
            new Date().toISOString(),
            accion,
            anterior.tipo ?? null,
            nuevo.tipo ?? null,
            anterior.categoria ?? null,
            nuevo.categoria ?? null,
            anterior.fecha ?? null,
            nuevo.fecha ?? null,
            anterior.valor ?? null,
            nuevo.valor ?? null,
            anterior.detalle ?? null,
            nuevo.detalle ?? null,
            anterior.origen_tipo ?? null,
            anterior.origen_id ?? null
        ]
    );

}


export async function obtenerHistorialMovimiento(
    movimientoId
) {

    const db =
        await getDatabase();

    return await db.getAllAsync(
        `
        SELECT *
        FROM movimientos_financieros_historial
        WHERE movimiento_id = ?
        ORDER BY fecha DESC, id DESC
        `,
        [movimientoId]
    );

}


export async function obtenerConsolidadoCategorias(
    periodo = 'TODO'
) {

    const db =
        await getDatabase();

    const filtroFecha =
        construirFiltroPeriodo(
            periodo,
            'fecha'
        );

    return await db.getAllAsync(
        `
        SELECT
            tipo,
            COALESCE(categoria, 'OTRO') AS categoria,
            COUNT(*) AS cantidad,
            COALESCE(SUM(valor), 0) AS total
        FROM movimientos_financieros
        ${filtroFecha}
        GROUP BY tipo, COALESCE(categoria, 'OTRO')
        ORDER BY tipo DESC, total DESC
        `
    );

}


export async function obtenerConsolidadoMensual(
    limite = 12
) {

    const db =
        await getDatabase();

    return await db.getAllAsync(
        `
        SELECT
            strftime('%Y-%m', fecha) AS periodo,
            COALESCE(
                SUM(
                    CASE
                        WHEN tipo='INGRESO'
                        THEN valor
                        ELSE 0
                    END
                ),
                0
            ) AS ingresos,
            COALESCE(
                SUM(
                    CASE
                        WHEN tipo='EGRESO'
                        THEN valor
                        ELSE 0
                    END
                ),
                0
            ) AS egresos
        FROM movimientos_financieros
        GROUP BY strftime('%Y-%m', fecha)
        ORDER BY periodo DESC
        LIMIT ?
        `,
        [Number(limite) || 12]
    );

}


function construirFiltroPeriodo(
    periodo,
    columna
) {

    if(periodo === 'MES'){
        return `WHERE strftime('%Y-%m', ${columna}) = strftime('%Y-%m', 'now')`;
    }

    if(periodo === 'ANIO'){
        return `WHERE strftime('%Y', ${columna}) = strftime('%Y', 'now')`;
    }

    return '';

}


function numeroNoNegativo(
    valor
) {

    if(
        valor === null
        ||
        valor === undefined
        ||
        String(valor).trim() === ''
    ){
        return 0;
    }

    const numero =
        Number(
            String(valor)
                .replace(',', '.')
        );

    if(
        !Number.isFinite(numero)
        ||
        numero < 0
    ){
        return null;
    }

    return numero;

}
