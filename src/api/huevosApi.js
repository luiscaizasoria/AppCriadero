/**
 * Utilidades comunes de los clientes REST de Huevos y Produccion (modo API):
 * HuevoRepository.api.js y ProduccionRepository.api.js.
 */

import {
    ApiError
} from './apiClient';

import {
    obtenerCriaderoId
} from './sesion';


export async function rutaCriadero() {

    const criaderoId =
        await obtenerCriaderoId();

    if (!criaderoId) {

        throw new Error(
            'CRIADERO_NO_SELECCIONADO'
        );

    }

    return `/api/v1/criaderos/${encodeURIComponent(criaderoId)}`;

}


export async function rutaProduccion() {

    return `${await rutaCriadero()}/huevos/produccion`;

}


/**
 * V1: ave o jaula inexistente -> 'FOREIGN KEY constraint failed'
 * (la pantalla solo muestra un aviso generico).
 */
export function traducirErrorHuevo(error) {

    if (
        error instanceof ApiError &&
        (
            error.code === 'AVE_NO_ENCONTRADA' ||
            error.code === 'JAULA_NO_ENCONTRADA'
        )
    ) {

        return new Error(
            'FOREIGN KEY constraint failed'
        );

    }

    return error;

}
