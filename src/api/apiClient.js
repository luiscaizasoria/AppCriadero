/**
 * Cliente HTTP de la API (modo API). Devuelve `data` de las respuestas
 * { success: true, data } y lanza ApiError con el mensaje de la API en los
 * errores { success: false, error, message }.
 */

import {
    API_BASE_URL
} from '../config/dataSource';

import {
    obtenerToken,
    cerrarSesion,
    descartarCriadero,
    obtenerEstado
} from './sesion';


export class ApiError extends Error {

    constructor(message, {
        status = 0,
        code = 'ERROR',
        data = null
    } = {}) {

        super(message);

        this.name = 'ApiError';

        this.status = status;

        this.code = code;

        this.data = data;

    }

}


export async function apiFetch(path, {
    method = 'GET',
    body,
    auth = true,
    timeoutMs = 15000
} = {}) {

    if (!API_BASE_URL) {

        throw new ApiError(
            'No está configurada la dirección del servidor (EXPO_PUBLIC_API_URL).',
            { code: 'API_URL_NO_CONFIGURADA' }
        );

    }

    const headers = {
        Accept: 'application/json'
    };

    if (body !== undefined) {

        headers['Content-Type'] = 'application/json';

    }

    if (auth) {

        const token = await obtenerToken();

        if (!token) {

            throw new ApiError(
                'Debes iniciar sesión.',
                { status: 401, code: 'UNAUTHORIZED' }
            );

        }

        headers.Authorization = `Bearer ${token}`;

    }

    const controlador = new AbortController();

    const temporizador = setTimeout(
        () => controlador.abort(),
        timeoutMs
    );

    let respuesta;

    try {

        respuesta = await fetch(
            `${API_BASE_URL}${path}`,
            {
                method,
                headers,
                body: body === undefined
                    ? undefined
                    : JSON.stringify(body),
                signal: controlador.signal
            }
        );

    }
    catch (error) {

        throw new ApiError(
            'No fue posible conectar con el servidor.',
            { code: 'NETWORK_ERROR' }
        );

    }
    finally {

        clearTimeout(temporizador);

    }

    let json = null;

    try {

        json = await respuesta.json();

    }
    catch (error) {

        json = null;

    }

    if (!respuesta.ok || !json || json.success !== true) {

        // Token vencido o inválido: se vuelve al inicio de sesión.
        if (respuesta.status === 401 && auth) {

            await cerrarSesion();

        }

        // Criadero guardado inexistente o ajeno: se vuelve a elegir criadero.
        // Un 404 de un ítem concreto (JAULA_NOT_FOUND, etc.) no entra aquí.
        if (
            auth &&
            (
                json?.error === 'FORBIDDEN' ||
                json?.error === 'CRIADERO_NOT_FOUND'
            ) &&
            (respuesta.status === 403 || respuesta.status === 404)
        ) {

            const coincide = path.match(/\/criaderos\/([^/?#]+)/);

            if (
                coincide &&
                coincide[1] === obtenerEstado().criaderoId
            ) {

                await descartarCriadero();

            }

        }

        throw new ApiError(
            json?.message || `Error del servidor (${respuesta.status}).`,
            {
                status: respuesta.status,
                code: json?.error || 'ERROR',
                data: json
            }
        );

    }

    return json.data;

}
