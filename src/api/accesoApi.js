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


export async function loginConGoogle(idToken) {

    const data = await apiFetch(
        '/api/v1/auth/google',
        {
            method: 'POST',
            auth: false,
            body: { idToken }
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

    // Con verificación de correo activa la API no emite token: se devuelve
    // { verificationRequired, email, expiresIn, resendAfterSeconds } y no se inicia sesión.
    if (data?.verificationRequired) {

        return data;

    }

    await guardarSesion(data);

    return null;

}


export async function verifyEmail({
    email,
    code
}) {

    const data = await apiFetch(
        '/api/v1/auth/verification/verify',
        {
            method: 'POST',
            auth: false,
            body: { email, code }
        }
    );

    await guardarSesion(data);

}


export async function resendCode({
    email
}) {

    const data = await apiFetch(
        '/api/v1/auth/verification/resend',
        {
            method: 'POST',
            auth: false,
            body: { email }
        }
    );

    return data;

}


export async function changeEmail({
    email,
    password,
    nuevoEmail
}) {

    const data = await apiFetch(
        '/api/v1/auth/verification/change-email',
        {
            method: 'POST',
            auth: false,
            body: { email, password, nuevoEmail }
        }
    );

    return data;

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
