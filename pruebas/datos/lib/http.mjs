// HTTP crudo (sin sesion) para comprobar status y codigos de error de la API.
import { urlApi } from './entorno.mjs';

export async function http(metodo, ruta, { token, body } = {}) {
    const cabeceras = { Accept: 'application/json' };
    if (body !== undefined) cabeceras['Content-Type'] = 'application/json';
    if (token) cabeceras.Authorization = `Bearer ${token}`;

    const r = await fetch(`${urlApi()}${ruta}`, {
        method: metodo,
        headers: cabeceras,
        body: body === undefined ? undefined : JSON.stringify(body)
    });

    let json = null;
    try { json = await r.json(); } catch { /* sin cuerpo */ }

    return { status: r.status, json, data: json?.data, error: json?.error };
}

export async function registrar(nombre, email, password) {
    const r = await http('POST', '/api/v1/auth/register', { body: { nombre, email, password } });
    if (r.status !== 201 && r.status !== 200) throw new Error(`registro ${email}: ${r.status} ${JSON.stringify(r.json)}`);
    return { token: r.data.accessToken, userId: r.data.user.id, email, password };
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
