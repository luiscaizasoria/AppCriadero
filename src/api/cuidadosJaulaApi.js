/**
 * Utilidades comunes de los clientes REST de cuidados de jaula
 * (Alimentacion, Bebida, SanidadJaula, Historial).
 */

import {
    ApiError
} from './apiClient';

import {
    obtenerCriaderoId
} from './sesion';


export async function rutaJaula(jaulaId) {

    const criaderoId =
        await obtenerCriaderoId();

    if (!criaderoId) {

        throw new Error(
            'CRIADERO_NO_SELECCIONADO'
        );

    }

    return `/api/v1/criaderos/${encodeURIComponent(criaderoId)}/jaulas/${encodeURIComponent(jaulaId)}`;

}


/**
 * Las pantallas reconocen los errores por el texto de SQLite de V1:
 * jaula inexistente -> FOREIGN KEY; dato obligatorio -> NOT NULL.
 */
export function traducirErrorCuidado(error) {

    if (
        error instanceof ApiError &&
        error.code === 'JAULA_NO_ENCONTRADA'
    ) {

        return new Error(
            'FOREIGN KEY constraint failed'
        );

    }

    if (
        error instanceof ApiError &&
        error.status === 400 &&
        error.code === 'VALIDATION_ERROR'
    ) {

        return new Error(
            error.message
        );

    }

    return error;

}
