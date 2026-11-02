// Utilidades de la puerta 1: peticion de A + registro en la tabla del informe.
import { assert } from './arnes.mjs';
import { ctx } from './contexto.mjs';
import { http } from './http.mjs';

export const api = c => `/api/v1/criaderos/${c}`;

function marcadoresB() {
    return [
        ctx.B.criaderoId, ctx.B.userId, ctx.B.email,
        ctx.sembradoB.jaulaId, ctx.sembradoB.aveId, ctx.sembradoB.itemId,
        'B-JAULA', 'B-AVE', 'B_RAZA', 'Raza de B'
    ].filter(Boolean);
}

export function etiqueta(ruta) {
    const B = ctx.sembradoB;
    return ruta
        .replaceAll(B.aveId, '{aveB}')
        .replaceAll(B.jaulaId, '{jaulaB}')
        .replaceAll(B.itemId, '{itemB}')
        .replaceAll(ctx.idsAves.padre ?? '@@', '{aveA}')
        .replaceAll(ctx.jaulaIds.j1 ?? '@@', '{jaulaA}');
}

export async function comprobar(grupo, metodo, ruta, body, estadosOk) {
    const r = await http(metodo, ruta, { token: ctx.A.token, body });
    const texto = JSON.stringify(r.json ?? '');
    const fuga = r.status >= 200 && r.status < 300 && marcadoresB().some(m => texto.includes(m));
    const ok = estadosOk.includes(r.status) && !fuga;
    ctx.tabla.push({
        grupo,
        endpoint: `${metodo} ${etiqueta(ruta.replace(ctx.A.criaderoId, '{A}').replace(ctx.B.criaderoId, '{B}'))}`,
        esperado: estadosOk.join('/'),
        obtenido: r.status + (r.error ? ` ${r.error}` : ''),
        fuga,
        ok
    });
    assert.ok(ok, `${metodo} ${etiqueta(ruta)}: esperado ${estadosOk.join('/')}, obtenido ${r.status} ${r.error ?? ''}${fuga ? ' CON DATOS DE B' : ''}`);
}

export async function recorrer(grupo, casos) {
    const fallos = [];
    for (const [m, ruta, body, ok] of casos) {
        try { await comprobar(grupo, m, ruta, body, ok); }
        catch (e) { fallos.push(e.message); }
    }
    assert.equal(fallos.length, 0, fallos.join(' || '));
}
