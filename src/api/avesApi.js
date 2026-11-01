/**
 * Utilidades comunes de los clientes REST del modulo Aves (modo API):
 * AveRepository.api.js, EstadoSaludRepository.api.js,
 * CicloVidaRepository.api.js y EvolucionAveRepository.api.js.
 */

import {
    ApiError
} from './apiClient';

import {
    obtenerCriaderoId
} from './sesion';


export async function rutaAves() {

    const criaderoId =
        await obtenerCriaderoId();

    if (!criaderoId) {

        throw new Error(
            'CRIADERO_NO_SELECCIONADO'
        );

    }

    return `/api/v1/criaderos/${encodeURIComponent(criaderoId)}/aves`;

}


/**
 * camelCase de la API -> snake_case de las columnas que devuelve SQLite en V1
 * (fotoUri -> foto_uri, jaulaActualId -> jaula_actual_id, ...).
 */
export function aSnake(objeto) {

    if (
        objeto === null ||
        objeto === undefined
    ) {

        return objeto;

    }

    const fila = {};

    for (const clave of Object.keys(objeto)) {

        fila[
            clave.replace(
                /[A-Z]/g,
                letra => `_${letra.toLowerCase()}`
            )
        ] = objeto[clave];

    }

    return fila;

}


// Errores de dominio que V1 lanza como new Error('<CODIGO>').
const ERRORES_DOMINIO = new Set([
    'AVE_NO_ENCONTRADA',
    'AVE_NO_ACTIVA',
    'CODIGO_AVE_DUPLICADO',
    'PADRES_IGUALES',
    'PADRE_ES_MISMA_AVE',
    'MADRE_ES_MISMA_AVE',
    'PADRE_NO_ENCONTRADO',
    'MADRE_NO_ENCONTRADA',
    'PADRE_NO_MACHO',
    'MADRE_NO_HEMBRA',
    'PARENTESCO_CIRCULAR_PADRE',
    'PARENTESCO_CIRCULAR_MADRE'
]);


/**
 * Las pantallas reconocen los errores por el texto de Error.message
 * (cadenas de V1 o mensajes de SQLite). Los errores de red, sesion o
 * validacion se dejan pasar como ApiError.
 */
export function traducirErrorAve(error) {

    if (!(error instanceof ApiError)) {

        return error;

    }

    if (error.code === 'UNIQUE_AVES_CODIGO') {

        return new Error(
            'UNIQUE constraint failed: aves.codigo'
        );

    }

    if (error.code === 'JAULA_NO_ENCONTRADA') {

        return new Error(
            'FOREIGN KEY constraint failed'
        );

    }

    if (ERRORES_DOMINIO.has(error.code)) {

        return new Error(
            error.code
        );

    }

    return error;

}
