/**
 * Inicio de sesion con Google (solo modo API).
 *
 * La libreria nativa `@react-native-google-signin/google-signin` NO esta instalada
 * y se carga de forma perezosa: `require` dentro de `try`. Metro trata un `require`
 * dentro de `try/catch` como dependencia opcional, asi que el bundle no falla si el
 * modulo falta, y en Expo Go (sin el modulo nativo) el `require` lanza y se captura.
 *
 * Resultado de `iniciarSesionConGoogle()`:
 *   true   -> sesion guardada
 *   false  -> el usuario cancelo (sin error)
 * Lanza `GoogleNoDisponibleError` si falta la libreria/configuracion, o el
 * `ApiError` de la API (codigos GOOGLE_*, NETWORK_ERROR).
 */

import {
    loginConGoogle
} from './accesoApi';


export class GoogleNoDisponibleError extends Error {

    constructor(message) {

        super(message);

        this.name = 'GoogleNoDisponibleError';

        this.code = 'GOOGLE_NO_DISPONIBLE';

    }

}


const MENSAJE_NO_DISPONIBLE =
    'Inicio con Google no disponible en esta versión de la app.';


const MENSAJES_POR_CODIGO = {
    INVALID_GOOGLE_TOKEN:
        'No fue posible iniciar sesión con Google. Intenta de nuevo.',
    GOOGLE_EMAIL_NOT_VERIFIED:
        'Tu correo de Google no está verificado.',
    GOOGLE_NOT_CONFIGURED:
        'Inicio con Google no disponible en este momento.',
    GOOGLE_UNAVAILABLE:
        'No fue posible validar con Google. Intenta de nuevo.',
    GOOGLE_ACCOUNT_CONFLICT:
        'Ese correo ya está asociado a otra cuenta de Google.',
    NETWORK_ERROR:
        'No hay conexión con el servidor. Revisa tu internet e intenta de nuevo.'
};


export function mensajeErrorGoogle(err) {

    return (
        MENSAJES_POR_CODIGO[err?.code] ||
        err?.message ||
        'No fue posible iniciar sesión con Google.'
    );

}


function cargarLibreria() {

    try {

        // eslint-disable-next-line global-require
        return require('@react-native-google-signin/google-signin');

    }
    catch (e) {

        return null;

    }

}


export async function iniciarSesionConGoogle() {

    const webClientId =
        (process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID || '').trim();

    if (!webClientId) {

        throw new GoogleNoDisponibleError(MENSAJE_NO_DISPONIBLE);

    }

    const libreria = cargarLibreria();

    const GoogleSignin = libreria?.GoogleSignin;

    if (!GoogleSignin) {

        throw new GoogleNoDisponibleError(MENSAJE_NO_DISPONIBLE);

    }

    let idToken;

    try {

        GoogleSignin.configure({ webClientId });

        await GoogleSignin.hasPlayServices();

        const resultado = await GoogleSignin.signIn();

        // Versiones nuevas: { type: 'success' | 'cancelled', data }; antiguas: { idToken }.
        if (resultado?.type === 'cancelled') {

            return false;

        }

        idToken =
            resultado?.data?.idToken ||
            resultado?.idToken;

    }
    catch (err) {

        const codigo = String(err?.code ?? '');

        const cancelado =
            codigo === String(libreria?.statusCodes?.SIGN_IN_CANCELLED) ||
            codigo === 'SIGN_IN_CANCELLED' ||
            codigo === '12501' ||
            codigo === String(libreria?.statusCodes?.IN_PROGRESS);

        if (cancelado) {

            return false;

        }

        throw new GoogleNoDisponibleError(
            'No fue posible abrir el inicio con Google. Intenta de nuevo.'
        );

    }

    if (!idToken) {

        throw new GoogleNoDisponibleError(
            'No fue posible obtener la cuenta de Google. Intenta de nuevo.'
        );

    }

    await loginConGoogle(idToken);

    return true;

}
