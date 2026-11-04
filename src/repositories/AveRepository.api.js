/**
 * AveRepository contra la API (modo API). Misma interfaz que la version
 * SQLite (AveRepository.sqlite.js): mismas funciones, mismos objetos
 * (snake_case, como salen de SQLite en V1) y mismos errores (cadenas de V1).
 *
 * Bajas: obtenerBajaAve lee GET .../bajas (null si no hay);
 * obtenerAvesVendidas / obtenerAvesFallecidas usan ?estado= y la API
 * incluye los campos de la baja (fecha_venta, comprador, etc.).
 * La foto (fotoUri) viaja como texto: es la ruta local del telefono.
 */

import {
    apiFetch,
    ApiError
} from '../api/apiClient';

import {
    rutaAves,
    aSnake,
    traducirErrorAve
} from '../api/avesApi';

import {
    obtenerJaulas
} from './JaulaRepository.api';


export async function obtenerAves() {

    const ruta = await rutaAves();

    const data = await apiFetch(
        `${ruta}?estado=ACTIVA`
    );

    return data.aves.map(aSnake);

}


export async function obtenerAvesActivas() {

    return await obtenerAves();

}


export async function obtenerAvesPorJaula(jaulaId) {

    const ruta = await rutaAves();

    const data = await apiFetch(
        `${ruta}/por-jaula/${encodeURIComponent(jaulaId)}`
    );

    return data.aves.map(aSnake);

}


export async function obtenerAvesParaAsignarJaula(jaulaId) {

    const ruta = await rutaAves();

    const data = await apiFetch(
        `${ruta}/para-asignar-jaula?jaulaId=${encodeURIComponent(jaulaId)}`
    );

    return data.aves.map(aSnake);

}


export async function obtenerAvePorId(id) {

    const ruta = await rutaAves();

    try {

        const data = await apiFetch(
            `${ruta}/${encodeURIComponent(id)}`
        );

        return aSnake(data.ave);

    }
    catch (error) {

        // V1: getFirstAsync devuelve un valor falso si no existe.
        if (
            error instanceof ApiError &&
            error.code === 'AVE_NO_ENCONTRADA'
        ) {

            return null;

        }

        throw error;

    }

}


export async function obtenerAvesActivasParaPadres(
    aveIdActual = null
) {

    const ruta = await rutaAves();

    const consulta = aveIdActual
        ? `?aveId=${encodeURIComponent(aveIdActual)}`
        : '';

    const data = await apiFetch(
        `${ruta}/candidatas-padres${consulta}`
    );

    return data.aves.map(aSnake);

}


export async function obtenerJaulasActivas() {

    const jaulas = await obtenerJaulas();

    return jaulas.map(
        jaula => ({
            id: jaula.id,
            codigo: jaula.codigo,
            nombre: jaula.nombre
        })
    );

}


export async function existeAvePorCodigo(
    codigo,
    excluirAveId = null
) {

    const codigoLimpio =
        String(
            codigo || ''
        )
            .trim()
            .toUpperCase();

    // V1: codigo vacio -> false sin consultar.
    if (!codigoLimpio) {

        return false;

    }

    const ruta = await rutaAves();

    let consulta =
        `codigo=${encodeURIComponent(codigoLimpio)}`;

    if (excluirAveId) {

        consulta +=
            `&excluirAveId=${encodeURIComponent(excluirAveId)}`;

    }

    const data = await apiFetch(
        `${ruta}/existe-codigo?${consulta}`
    );

    return !!data.existe;

}


export async function crearAve({
    codigo,
    origen,
    fechaNacimiento,
    edadMesesCompra,
    fechaIngreso,
    criaderoOrigen,
    metodoEnvio,
    raza,
    sexo,
    pesoGramos,
    alturaCm,
    largoCm,
    caracteristicas,
    fotoUri,
    padreId,
    madreId,
    jaulaId
}) {

    const ruta = await rutaAves();

    try {

        const data = await apiFetch(
            ruta,
            {
                method: 'POST',
                body: {
                    codigo,
                    origen,
                    fechaNacimiento,
                    edadMesesCompra,
                    fechaIngreso,
                    criaderoOrigen,
                    metodoEnvio,
                    raza,
                    sexo,
                    pesoGramos,
                    alturaCm,
                    largoCm,
                    caracteristicas,
                    fotoUri,
                    padreId,
                    madreId,
                    jaulaId
                }
            }
        );

        return data.ave.id;

    }
    catch (error) {

        throw traducirErrorAve(error);

    }

}


export async function actualizarAve({
    id,
    codigo,
    origen,
    fechaNacimiento,
    edadMesesCompra,
    fechaIngreso,
    criaderoOrigen,
    metodoEnvio,
    raza,
    sexo,
    pesoGramos,
    alturaCm,
    largoCm,
    caracteristicas,
    fotoUri,
    padreId,
    madreId
}) {

    const ruta = await rutaAves();

    try {

        await apiFetch(
            `${ruta}/${encodeURIComponent(id)}`,
            {
                method: 'PUT',
                body: {
                    codigo,
                    origen,
                    fechaNacimiento,
                    edadMesesCompra,
                    fechaIngreso,
                    criaderoOrigen,
                    metodoEnvio,
                    raza,
                    sexo,
                    pesoGramos,
                    alturaCm,
                    largoCm,
                    caracteristicas,
                    fotoUri,
                    padreId,
                    madreId
                }
            }
        );

    }
    catch (error) {

        throw traducirErrorAve(error);

    }

}


export async function cambiarJaulaAve({
    aveId,
    jaulaAnteriorId,
    nuevaJaulaId,
    codigoAve
}) {

    const ruta = await rutaAves();

    try {

        await apiFetch(
            `${ruta}/${encodeURIComponent(aveId)}/jaula`,
            {
                method: 'PUT',
                body: {
                    nuevaJaulaId:
                        nuevaJaulaId || null,
                    jaulaAnteriorId:
                        jaulaAnteriorId || null,
                    codigoAve
                }
            }
        );

    }
    catch (error) {

        throw traducirErrorAve(error);

    }

}


export async function obtenerHistorialAve(aveId) {

    const ruta = await rutaAves();

    const data = await apiFetch(
        `${ruta}/${encodeURIComponent(aveId)}/historial`
    );

    return data.historial.map(aSnake);

}


export async function obtenerAvesVendidas() {

    const ruta = await rutaAves();

    const data = await apiFetch(
        `${ruta}?estado=VENDIDA`
    );

    return data.aves.map(aSnake);

}


export async function obtenerAvesFallecidas() {

    const ruta = await rutaAves();

    const data = await apiFetch(
        `${ruta}?estado=FALLECIDA`
    );

    return data.aves.map(aSnake);

}


// Baja mas reciente del ave (GET .../bajas ya viene ordenada por fecha DESC);
// null si no hay, como V1.
export async function obtenerBajaAve(aveId) {

    const ruta = await rutaAves();

    const data = await apiFetch(
        `${ruta}/${encodeURIComponent(aveId)}/bajas`
    );

    return data.bajas.length > 0
        ? aSnake(data.bajas[0])
        : null;

}
