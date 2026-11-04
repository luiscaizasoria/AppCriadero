/**
 * Utilidades comunes del cliente REST de Finanzas (modo API):
 * FinanzasRepository.api.js.
 */

import {
    ApiError
} from './apiClient';

import {
    rutaCriadero
} from './huevosApi';


export async function rutaFinanzas() {

    return `${await rutaCriadero()}/finanzas`;

}


// Errores de dominio que V1 lanza como new Error('<CODIGO>').
const ERRORES_DOMINIO = new Set([
    'MOVIMIENTO_NO_ENCONTRADO',
    'MOVIMIENTO_AUTOMATICO_NO_EDITABLE',
    'VENTA_NO_ENCONTRADA',
    'VALOR_INVALIDO'
]);


/**
 * Convierte el codigo de dominio de la API en el Error con el mismo texto
 * que V1. Los errores de red, sesion o validacion se dejan pasar como ApiError.
 */
export function traducirErrorFinanzas(error) {

    if (
        error instanceof ApiError &&
        ERRORES_DOMINIO.has(error.code)
    ) {

        return new Error(
            error.code
        );

    }

    return error;

}


export function esErrorCodigo(error, codigo) {

    return error instanceof ApiError &&
        error.code === codigo;

}
