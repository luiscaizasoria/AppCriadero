/**
 * BajaAveRepository contra la API (modo API). Misma interfaz que
 * BajaAveRepository.sqlite.js: registrarMuerteAve y registrarVentaAve
 * devuelven undefined, como V1.
 *
 * - La fecha la genera el cliente (reloj de la app), como V1.
 * - Celular vacio en la venta -> Error('CELULAR_COMPRADOR_REQUERIDO')
 *   (el servidor aplica normalizarCelular de V1 y responde 400 con ese codigo).
 * - Ave inexistente -> Error('AVE_NO_ENCONTRADA') (V1: FOREIGN KEY failed;
 *   la pantalla no distingue).
 * obtenerBajasAve no se implementa (omitida, sin llamadores).
 */

import {
    apiFetch,
    ApiError
} from '../api/apiClient';

import {
    rutaAves,
    traducirErrorAve
} from '../api/avesApi';


function valorOpcional(valor) {

    return valor === undefined
        ? null
        : valor;

}


export async function registrarMuerteAve({
    aveId,
    causa,
    detalle
}) {

    const fecha =
        new Date()
            .toISOString();

    const base = await rutaAves();

    try {

        await apiFetch(
            `${base}/${encodeURIComponent(aveId)}/muerte`,
            {
                method: 'POST',
                body: {
                    causa,
                    detalle,
                    fecha
                }
            }
        );

    }
    catch (error) {

        throw traducirErrorAve(error);

    }

}


export async function registrarVentaAve({
    aveId,
    fechaVenta,
    celular,
    ciudadDestino,
    cooperativaEnvio,
    comprador,
    valorVenta,
    valorEnvio,
    detalle
}) {

    const fecha =
        fechaVenta
        ||
        new Date()
            .toISOString();

    const base = await rutaAves();

    try {

        await apiFetch(
            `${base}/${encodeURIComponent(aveId)}/venta`,
            {
                method: 'POST',
                body: {
                    fecha,
                    celular,
                    ciudadDestino,
                    cooperativaEnvio,
                    comprador,
                    valorVenta: valorOpcional(valorVenta),
                    valorEnvio: valorOpcional(valorEnvio),
                    detalle
                }
            }
        );

    }
    catch (error) {

        if (
            error instanceof ApiError
            &&
            error.code === 'CELULAR_COMPRADOR_REQUERIDO'
        ) {

            throw new Error(
                'CELULAR_COMPRADOR_REQUERIDO'
            );

        }

        throw traducirErrorAve(error);

    }

}
