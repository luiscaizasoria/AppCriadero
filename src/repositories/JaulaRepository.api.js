/**
 * JaulaRepository contra la API (modo API). Misma interfaz que la version
 * SQLite (JaulaRepository.sqlite.js): mismos nombres de funcion, mismos
 * objetos devueltos (snake_case, como salen de SQLite en V1) y mismos errores,
 * para que las pantallas no cambien.
 *
 * Pendiente hasta migrar Aves (migracion D1 0006): cantidad_aves llega en 0,
 * y obtenerAvesHistoricasJaula / obtenerHistorialCompletoJaula devuelven [].
 */

import {
    apiFetch,
    ApiError
} from '../api/apiClient';

import {
    obtenerCriaderoId
} from '../api/sesion';


async function rutaJaulas() {

    const criaderoId =
        await obtenerCriaderoId();

    if (!criaderoId) {

        throw new Error(
            'CRIADERO_NO_SELECCIONADO'
        );

    }

    return `/api/v1/criaderos/${encodeURIComponent(criaderoId)}/jaulas`;

}


/** La pantalla reconoce el duplicado por el texto de SQLite. */
function traducirError(error) {

    if (
        error instanceof ApiError &&
        error.status === 409
    ) {

        return new Error(
            'UNIQUE constraint failed: jaulas.codigo'
        );

    }

    if (
        error instanceof ApiError &&
        error.code === 'JAULA_NO_ENCONTRADA'
    ) {

        return new Error(
            'JAULA_NO_ENCONTRADA'
        );

    }

    return error;

}


function aListado(jaula) {

    const fila = {
        id: jaula.id,
        codigo: jaula.codigo,
        nombre: jaula.nombre,
        ubicacion: jaula.ubicacion,
        tipo: jaula.tipo,
        estado_sanitario: jaula.estadoSanitario,
        activa: jaula.activa,
        fecha_creacion: jaula.fechaCreacion
    };

    if ('fechaActualizacion' in jaula) {

        fila.fecha_actualizacion =
            jaula.fechaActualizacion;

        fila.fecha_desactivacion =
            jaula.fechaDesactivacion;

    }

    fila.cantidad_aves =
        jaula.cantidadAves;

    return fila;

}


function aDetalle(jaula) {

    return {
        id: jaula.id,
        codigo: jaula.codigo,
        nombre: jaula.nombre,
        ubicacion: jaula.ubicacion,
        tipo: jaula.tipo,
        estado_sanitario: jaula.estadoSanitario,
        activa: jaula.activa,
        fecha_creacion: jaula.fechaCreacion,
        fecha_actualizacion: jaula.fechaActualizacion,
        fecha_desactivacion: jaula.fechaDesactivacion
    };

}


export async function obtenerJaulas() {

    const ruta = await rutaJaulas();

    const data = await apiFetch(
        `${ruta}?estado=ACTIVA`
    );

    return data.jaulas.map(aListado);

}


export async function obtenerJaulasInactivas() {

    const ruta = await rutaJaulas();

    const data = await apiFetch(
        `${ruta}?estado=INACTIVA`
    );

    return data.jaulas.map(aListado);

}


// Pendiente de Aves y jaula_historial (migracion D1 0006).
export async function obtenerAvesHistoricasJaula() {

    return [];

}


// Pendiente de Aves y jaula_historial (migracion D1 0006).
export async function obtenerHistorialCompletoJaula() {

    return [];

}


export async function obtenerJaulaPorId(id) {

    const ruta = await rutaJaulas();

    try {

        const data = await apiFetch(
            `${ruta}/${encodeURIComponent(id)}`
        );

        return aDetalle(data.jaula);

    }
    catch (error) {

        // V1: getFirstAsync devuelve null si no existe.
        if (
            error instanceof ApiError &&
            error.code === 'JAULA_NO_ENCONTRADA'
        ) {

            return null;

        }

        throw error;

    }

}


export async function crearJaula({
    codigo,
    nombre,
    ubicacion,
    tipo
}) {

    const ruta = await rutaJaulas();

    try {

        const data = await apiFetch(
            ruta,
            {
                method: 'POST',
                body: {
                    codigo,
                    nombre,
                    ubicacion,
                    tipo
                }
            }
        );

        return data.jaula.id;

    }
    catch (error) {

        throw traducirError(error);

    }

}


export async function actualizarJaula({
    id,
    codigo,
    nombre,
    ubicacion,
    tipo
}) {

    const ruta = await rutaJaulas();

    try {

        await apiFetch(
            `${ruta}/${encodeURIComponent(id)}`,
            {
                method: 'PUT',
                body: {
                    codigo,
                    nombre,
                    ubicacion,
                    tipo
                }
            }
        );

    }
    catch (error) {

        throw traducirError(error);

    }

}


export async function desactivarJaula(id) {

    const ruta = await rutaJaulas();

    try {

        const data = await apiFetch(
            `${ruta}/${encodeURIComponent(id)}`,
            {
                method: 'DELETE'
            }
        );

        return {
            cantidadAvesLiberadas:
                data.cantidadAvesLiberadas
        };

    }
    catch (error) {

        throw traducirError(error);

    }

}
