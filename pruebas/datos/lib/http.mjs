// HTTP crudo (sin sesion) para comprobar status y codigos de error de la API.
import { urlApi, secretoVerificacion } from './entorno.mjs';
import { conReintentosRed } from './red.mjs';

export async function http(metodo, ruta, { token, body, bypass, testCode } = {}) {
    const cabeceras = { Accept: 'application/json' };
    // Solo en el registro y solo si hay secreto: la cuenta nace sin verificar y la API devuelve data.codigoPrueba.
    const secretoCodigo = testCode ? secretoVerificacion() : '';
    if (secretoCodigo) cabeceras['X-Verification-Test-Code'] = secretoCodigo;
    // Solo en el registro y solo si hay secreto: la cuenta nace verificada. Sin secreto, nada cambia.
    const secretoBypass = bypass ? secretoVerificacion() : '';
    if (secretoBypass) cabeceras['X-Verification-Bypass'] = secretoBypass;
    if (body !== undefined) cabeceras['Content-Type'] = 'application/json';
    if (token) cabeceras.Authorization = `Bearer ${token}`;

    const llamar = () => fetch(`${urlApi()}${ruta}`, {
        method: metodo,
        headers: cabeceras,
        body: body === undefined ? undefined : JSON.stringify(body)
    });
    // Solo errores de red (fetch lanza); un 4xx/5xx es una respuesta y nunca se reintenta.
    const r = process.env.REINTENTOS_RED === '1' ? await conReintentosRed(llamar) : await llamar();

    let json = null;
    try { json = await r.json(); } catch { /* sin cuerpo */ }

    return { status: r.status, json, data: json?.data, error: json?.error };
}

export async function registrar(nombre, email, password) {
    const r = await http('POST', '/api/v1/auth/register', { body: { nombre, email, password }, bypass: true });
    if (r.status !== 201 && r.status !== 200) throw new Error(`registro ${email}: ${r.status} ${JSON.stringify(r.json)}`);
    return { token: r.data.accessToken, userId: r.data.user.id, email, password };
}

// Registra una cuenta SIN verificar (requiere bandera ON y secreto). Devuelve { email, password, codigo }.
export async function registrarSinVerificar(nombre, email, password) {
    if (!secretoVerificacion()) throw new Error('registrarSinVerificar: falta VERIFICATION_BYPASS_SECRET');
    const r = await http('POST', '/api/v1/auth/register', { body: { nombre, email, password }, testCode: true });
    if (r.status !== 201 && r.status !== 200) throw new Error(`registro sin verificar ${email}: ${r.status} ${JSON.stringify(r.json)}`);
    if (!r.data?.codigoPrueba) throw new Error('registro sin verificar: la API no devolvio codigoPrueba (bandera apagada o secreto distinto)');
    return { email, password, codigo: r.data.codigoPrueba };
}

export async function crearCriaderoHttp(token, nombre = 'Criadero de prueba') {
    const r = await http('POST', '/api/v1/criaderos', {
        token,
        body: { nombre, pais: 'EC', provincia: 'P', ciudad: 'C', telefono: '1', correoContacto: 'x@kikirikis.test' }
    });
    if (r.status !== 201 && r.status !== 200) throw new Error(`criadero: ${r.status} ${JSON.stringify(r.json)}`);
    ultimoCriadero.generados = r.data.catalogoItemsGenerados;
    return r.data.id;
}
export const ultimoCriadero = {};
