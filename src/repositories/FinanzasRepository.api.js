/**
 * FinanzasRepository contra la API (modo API). Misma interfaz que
 * FinanzasRepository.sqlite.js: mismos nombres y objetos snake_case.
 * obtenerIngresos y obtenerEgresos no se implementan (omitidas, sin llamadores).
 *
 * Importes: sin redondeo ni conversion en el cliente; viajan como numero JSON
 * y se devuelven tal cual. Ver documents/specs/finanzas.md.
 *
 * Errores (mismo texto que V1): MOVIMIENTO_NO_ENCONTRADO,
 * MOVIMIENTO_AUTOMATICO_NO_EDITABLE, VALOR_INVALIDO, VENTA_NO_ENCONTRADA.
 * obtenerMovimientoPorId y obtenerVentaPorBajaId devuelven null si no existe.
 */

import {
    apiFetch
} from '../api/apiClient';

import {
    aSnake
} from '../api/avesApi';

import {
    rutaFinanzas,
    traducirErrorFinanzas,
    esErrorCodigo
} from '../api/finanzasApi';


function consultaPeriodo(periodo) {

    return periodo === undefined || periodo === null
        ? ''
        : `?periodo=${encodeURIComponent(periodo)}`;

}


export async function obtenerResumenFinanciero(
    periodo = 'TODO'
) {

    const base = await rutaFinanzas();

    const data = await apiFetch(
        `${base}/resumen${consultaPeriodo(periodo)}`
    );

    return {
        ingresos: data.ingresos,
        egresos: data.egresos,
        utilidad: data.utilidad
    };

}


export async function obtenerMovimientosFinancieros() {

    const base = await rutaFinanzas();

    const data = await apiFetch(
        `${base}/movimientos`
    );

    return data.movimientos.map(aSnake);

}


async function registrarMovimiento(
    ruta,
    {
        categoria,
        valor,
        detalle,
        fecha
    }
) {

    const base = await rutaFinanzas();

    const data = await apiFetch(
        `${base}/${ruta}`,
        {
            method: 'POST',
            body: {
                categoria,
                valor,
                detalle,
                fecha
            }
        }
    );

    return data.id;

}


export async function registrarIngreso(args) {

    return await registrarMovimiento(
        'ingresos',
        args
    );

}


export async function registrarEgreso(args) {

    return await registrarMovimiento(
        'egresos',
        args
    );

}


export async function obtenerMovimientoPorId(
    id
) {

    const base = await rutaFinanzas();

    try {

        const data = await apiFetch(
            `${base}/movimientos/${encodeURIComponent(id)}`
        );

        return aSnake(data.movimiento);

    }
    catch (error) {

        if (
            esErrorCodigo(
                error,
                'MOVIMIENTO_NO_ENCONTRADO'
            )
        ) {

            return null;

        }

        throw error;

    }

}


export async function obtenerVentaPorBajaId(
    bajaId
) {

    const base = await rutaFinanzas();

    try {

        const data = await apiFetch(
            `${base}/ventas/${encodeURIComponent(bajaId)}`
        );

        return aSnake(data.venta);

    }
    catch (error) {

        if (
            esErrorCodigo(
                error,
                'VENTA_NO_ENCONTRADA'
            )
        ) {

            return null;

        }

        throw error;

    }

}


export async function actualizarMovimientoManual({
    id,
    tipo,
    categoria,
    valor,
    detalle,
    fecha
}) {

    const base = await rutaFinanzas();

    try {

        await apiFetch(
            `${base}/movimientos/${encodeURIComponent(id)}`,
            {
                method: 'PUT',
                body: {
                    tipo,
                    categoria,
                    valor,
                    detalle,
                    fecha
                }
            }
        );

    }
    catch (error) {

        throw traducirErrorFinanzas(error);

    }

}


export async function corregirVentaFinanciera({
    bajaId,
    valorVenta,
    valorEnvio
}) {

    const base = await rutaFinanzas();

    try {

        await apiFetch(
            `${base}/ventas/${encodeURIComponent(bajaId)}/correccion`,
            {
                method: 'POST',
                body: {
                    valorVenta,
                    valorEnvio
                }
            }
        );

    }
    catch (error) {

        throw traducirErrorFinanzas(error);

    }

}


export async function obtenerHistorialMovimiento(
    movimientoId
) {

    const base = await rutaFinanzas();

    const data = await apiFetch(
        `${base}/movimientos/${encodeURIComponent(movimientoId)}/historial`
    );

    return data.historial.map(aSnake);

}


export async function obtenerConsolidadoCategorias(
    periodo = 'TODO'
) {

    const base = await rutaFinanzas();

    const data = await apiFetch(
        `${base}/consolidado/categorias${consultaPeriodo(periodo)}`
    );

    return data.categorias.map(aSnake);

}


export async function obtenerConsolidadoMensual(
    limite = 12
) {

    const base = await rutaFinanzas();

    const data = await apiFetch(
        `${base}/consolidado/mensual?limite=${encodeURIComponent(limite)}`
    );

    return data.meses.map(aSnake);

}
