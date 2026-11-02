import { prueba, assert } from '../lib/arnes.mjs';
import { ctx } from '../lib/contexto.mjs';
import { registrar, crearCriaderoHttp, ultimoCriadero, http } from '../lib/http.mjs';
import { claveAleatoria, DOMINIO } from '../lib/entorno.mjs';

const sufijo = Date.now().toString(36);

prueba('preparacion', 'debe responder el health del Worker de pruebas', async () => {
    const r = await http('GET', '/api/v1/health');
    assert.equal(r.status, 200);
});

prueba('preparacion', 'debe crear dos cuentas desechables con su criadero', async () => {
    for (const k of ['A', 'B']) {
        const cuenta = await registrar(`datos-${k}`, `datos-${sufijo}-${k.toLowerCase()}@${DOMINIO}`, claveAleatoria());
        cuenta.criaderoId = await crearCriaderoHttp(cuenta.token, `Criadero ${k}`);
        cuenta.generados = ultimoCriadero.generados;
        ctx[k] = cuenta;
    }
    assert.notEqual(ctx.A.criaderoId, ctx.B.criaderoId);
});

prueba('preparacion', 'debe sembrar datos de B (jaula, ave, item de catalogo)', async () => {
    const B = ctx.B;
    const base = `/api/v1/criaderos/${B.criaderoId}`;
    const j = await http('POST', `${base}/jaulas`, { token: B.token, body: { codigo: 'B-JAULA', nombre: 'Jaula de B', ubicacion: 'x', tipo: 'Reproduccion' } });
    assert.equal(j.status, 201, JSON.stringify(j.json));
    const a = await http('POST', `${base}/aves`, { token: B.token, body: { codigo: 'B-AVE', origen: 'COMPRADA', sexo: 'MACHO', jaulaId: j.data.jaula.id } });
    assert.equal(a.status, 201, JSON.stringify(a.json));
    const cat = await http('POST', `${base}/catalogos/RAZAS/items`, { token: B.token, body: { codigo: 'B_RAZA', nombre: 'Raza de B' } });
    assert.equal(cat.status, 201, JSON.stringify(cat.json));
    ctx.sembradoB = { jaulaId: j.data.jaula.id, aveId: a.data.ave.id, itemId: cat.data.item?.id ?? cat.data.id };
    assert.ok(ctx.sembradoB.itemId, 'sin id de item: ' + JSON.stringify(cat.json));
});
