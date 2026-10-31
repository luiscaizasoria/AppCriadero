/**
 * Sesion de la app en modo API: token de acceso y criadero seleccionado.
 * Se guardan en expo-secure-store (almacenamiento seguro del dispositivo).
 * El token dura expiresIn segundos (3600) y no hay refresh token: al expirar
 * la app vuelve al inicio de sesion.
 */

import * as SecureStore from 'expo-secure-store';

const CLAVES = {
    token: 'kikirikis.accessToken',
    expiraEn: 'kikirikis.expiraEn',
    criaderoId: 'kikirikis.criaderoId'
};

const MAXIMO_TIMEOUT_MS = 2147483647;


let estado = {
    cargando: true,
    token: null,
    expiraEn: 0,
    criaderoId: null
};

let cargaInicial = null;

let temporizador = null;

const oyentes = new Set();


function emitir() {

    const copia = { ...estado };

    oyentes.forEach(oyente => oyente(copia));

}


async function leer(clave) {

    try {

        return await SecureStore.getItemAsync(clave);

    }
    catch (error) {

        console.error('No fue posible leer la sesión:', error);

        return null;

    }

}


async function escribir(clave, valor) {

    try {

        if (valor === null || valor === undefined) {

            await SecureStore.deleteItemAsync(clave);

        }
        else {

            await SecureStore.setItemAsync(clave, String(valor));

        }

    }
    catch (error) {

        console.error('No fue posible guardar la sesión:', error);

    }

}


function programarExpiracion() {

    if (temporizador) {

        clearTimeout(temporizador);

        temporizador = null;

    }

    if (!estado.token) {

        return;

    }

    const restante =
        estado.expiraEn - Date.now();

    if (restante <= 0) {

        cerrarSesion();

        return;

    }

    temporizador = setTimeout(
        cerrarSesion,
        Math.min(restante, MAXIMO_TIMEOUT_MS)
    );

}


export function cargarSesion() {

    if (!cargaInicial) {

        cargaInicial = (async () => {

            const token = await leer(CLAVES.token);

            const expiraEn = Number(
                await leer(CLAVES.expiraEn)
            ) || 0;

            const criaderoId = await leer(CLAVES.criaderoId);

            if (token && expiraEn > Date.now()) {

                estado = {
                    cargando: false,
                    token,
                    expiraEn,
                    criaderoId: criaderoId || null
                };

            }
            else {

                estado = {
                    cargando: false,
                    token: null,
                    expiraEn: 0,
                    criaderoId: null
                };

                await escribir(CLAVES.token, null);
                await escribir(CLAVES.expiraEn, null);
                await escribir(CLAVES.criaderoId, null);

            }

            programarExpiracion();

            emitir();

        })();

    }

    return cargaInicial;

}


export function obtenerEstado() {

    return { ...estado };

}


export function suscribir(oyente) {

    oyentes.add(oyente);

    return () => oyentes.delete(oyente);

}


export async function obtenerToken() {

    await cargarSesion();

    if (estado.token && estado.expiraEn > Date.now()) {

        return estado.token;

    }

    return null;

}


export async function obtenerCriaderoId() {

    await cargarSesion();

    return estado.criaderoId;

}


/** Tras iniciar sesion hay que elegir criadero: se descarta el anterior. */
export async function guardarSesion({
    accessToken,
    expiresIn
}) {

    await cargarSesion();

    const expiraEn =
        Date.now() + (Number(expiresIn) || 3600) * 1000;

    estado = {
        cargando: false,
        token: accessToken,
        expiraEn,
        criaderoId: null
    };

    await escribir(CLAVES.token, accessToken);
    await escribir(CLAVES.expiraEn, expiraEn);
    await escribir(CLAVES.criaderoId, null);

    programarExpiracion();

    emitir();

}


export async function guardarCriadero(criaderoId) {

    await cargarSesion();

    estado = {
        ...estado,
        criaderoId
    };

    await escribir(CLAVES.criaderoId, criaderoId);

    emitir();

}


export async function cerrarSesion() {

    if (temporizador) {

        clearTimeout(temporizador);

        temporizador = null;

    }

    estado = {
        cargando: false,
        token: null,
        expiraEn: 0,
        criaderoId: null
    };

    await escribir(CLAVES.token, null);
    await escribir(CLAVES.expiraEn, null);
    await escribir(CLAVES.criaderoId, null);

    emitir();

}
