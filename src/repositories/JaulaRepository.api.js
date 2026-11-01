/**
 * JaulaRepository contra la API (modo API). Misma interfaz que la version
 * SQLite (JaulaRepository.sqlite.js): mismos nombres de funcion, mismos
 * objetos devueltos (snake_case, como salen de SQLite en V1) y mismos errores,
 * para que las pantallas no cambien.
 *
 * Con Aves migrado (migracion D1 0006): cantidad_aves es la real (activas en
 * jaulas activas; aves distintas del historial en inactivas),
 * obtenerAvesHistoricasJaula / obtenerHistorialCompletoJaula usan
 * /aves-historicas y /historial, y desactivarJaula devuelve
 * cantidadAvesLiberadas real.
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


export async function obtenerAvesHistoricasJaula(jaulaId) {

    const ruta = await rutaJaulas();

    const data = await apiFetch(
        `${ruta}/${encodeURIComponent(jaulaId)}/aves-historicas`
    );

    return data.aves.map(
        ave => ({
            id: ave.id,
            codigo: ave.codigo,
            raza: ave.raza,
            sexo: ave.sexo,
            estado: ave.estado,
            foto_uri: ave.fotoUri
        })
    );

}


export async function obtenerHistorialCompletoJaula(jaulaId) {

    const ruta = await rutaJaulas();

    const data = await apiFetch(
        `${ruta}/${encodeURIComponent(jaulaId)}/historial`
    );

    return data.historial.map(
        item => ({
            id: item.id,
            jaula_id: item.jaulaId,
            ave_id: item.aveId,
            tipo_evento: item.tipoEvento,
            fecha: item.fecha,
            detalle: item.detalle,
            ave_codigo: item.aveCodigo
        })
    );

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
