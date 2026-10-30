/**
 * Llamadas de acceso: registro, inicio de sesion y criaderos del usuario.
 */

import {
    apiFetch
} from './apiClient';

import {
    guardarSesion,
    guardarCriadero
} from './sesion';


export async function iniciarSesion({
    email,
    password
}) {

    const data = await apiFetch(
        '/api/v1/auth/login',
        {
            method: 'POST',
            auth: false,
            body: { email, password }
        }
    );

    await guardarSesion(data);

}


export async function registrarUsuario({
    nombre,
    email,
    password
}) {

    const data = await apiFetch(
        '/api/v1/auth/register',
        {
            method: 'POST',
            auth: false,
            body: { nombre, email, password }
        }
    );

    await guardarSesion(data);

}


export async function listarCriaderos() {

    const data = await apiFetch('/api/v1/criaderos');

    return data.criaderos;

}


export async function crearCriadero(datos) {

    const data = await apiFetch(
        '/api/v1/criaderos',
        {
            method: 'POST',
            body: datos
        }
    );

    return data.id;

}


export async function seleccionarCriadero(criaderoId) {

    await guardarCriadero(criaderoId);

}
