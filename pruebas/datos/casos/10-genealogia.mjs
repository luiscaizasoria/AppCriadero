// GENEALOGIA con el cliente REST real (algoritmo de V1 sobre las aves leidas por la API).
import { prueba, assert } from '../lib/arnes.mjs';
import { ctx, entrarComo } from '../lib/contexto.mjs';

const g = { };
const codigos = lista => lista.map(x => x.nodo.codigo);
const relaciones = lista => lista.map(x => x.relacion);

prueba('genealogia', 'debe preparar abuelos, padres e hijos con padre y madre', async () => {
    const { aves, config } = ctx.clientes;
    await entrarComo(ctx.A);
    const sexos = await config.obtenerItemsCatalogo((await config.obtenerCatalogoPorCodigo('SEXOS')).id);
    const macho = sexos.find(s => /MACHO/i.test(s.codigo)).codigo;
    const hembra = sexos.find(s => /HEMBRA/i.test(s.codigo)).codigo;
    const base = { origen: 'NACIDA_CRIADERO', fechaNacimiento: '2026-01-01' };
    g.abuelo = await aves.crearAve({ ...base, codigo: 'G-ABUELO', sexo: macho });
    g.abuela = await aves.crearAve({ ...base, codigo: 'G-ABUELA', sexo: hembra });
    g.padre = await aves.crearAve({ ...base, codigo: 'G-PADRE', sexo: macho, padreId: g.abuelo, madreId: g.abuela });
    g.madre = await aves.crearAve({ ...base, codigo: 'G-MADRE', sexo: hembra });
    g.hijo = await aves.crearAve({ ...base, codigo: 'G-HIJO', sexo: macho, padreId: g.padre, madreId: g.madre });
    g.hija = await aves.crearAve({ ...base, codigo: 'G-HIJA', sexo: hembra, padreId: g.padre, madreId: g.madre });
});

prueba('genealogia', 'debe devolver ave, generaciones, ancestros, descendientes y relacionesInvalidas con las claves de V1', async () => {
    const { genealogia } = ctx.clientes;
    await entrarComo(ctx.A);
    const r = await genealogia.obtenerGenealogiaAve(g.hijo);
    assert.deepEqual(Object.keys(r).sort(), ['ancestros', 'ave', 'descendientes', 'generaciones', 'relacionesInvalidas']);
    assert.equal(r.generaciones, 3);
    assert.deepEqual(Object.keys(r.ave).sort(), ['codigo', 'estado', 'estado_salud', 'fecha_nacimiento', 'foto_uri', 'id', 'raza', 'sexo']);
    assert.deepEqual([r.ave.id, r.ave.codigo, r.ave.estado], [g.hijo, 'G-HIJO', 'ACTIVA']);
    assert.deepEqual(r.relacionesInvalidas, []);
    assert.deepEqual(relaciones(r.ancestros.padres), ['Padre', 'Madre']);
    assert.deepEqual(codigos(r.ancestros.padres), ['G-PADRE', 'G-MADRE']);
    const padre = r.ancestros.padres[0].nodo;
    assert.deepEqual(relaciones(padre.padres), ['Ancestro paterno', 'Ancestro materno']);
    assert.deepEqual(codigos(padre.padres), ['G-ABUELO', 'G-ABUELA']);
    assert.deepEqual(r.ancestros.padres[1].nodo.padres, []);
    assert.deepEqual(r.descendientes.hijos, []);
});

prueba('genealogia', 'debe listar descendientes ordenados por codigo y respetar el limite de generaciones 1 a 4', async () => {
    const { genealogia } = ctx.clientes;
    await entrarComo(ctx.A);
    const r = await genealogia.obtenerGenealogiaAve(g.abuelo, 3);
    const hijos = r.descendientes.hijos;
    assert.deepEqual(hijos.map(x => x.codigo), ['G-PADRE']);
    assert.deepEqual(hijos[0].hijos.map(x => x.codigo), ['G-HIJA', 'G-HIJO']);
    assert.deepEqual((await genealogia.obtenerGenealogiaAve(g.abuelo, 1)).descendientes.hijos[0].hijos, []);
    assert.equal((await genealogia.obtenerGenealogiaAve(g.hijo, 1)).ancestros.padres[0].nodo.padres.length, 0);
    assert.equal((await genealogia.obtenerGenealogiaAve(g.hijo, 9)).generaciones, 4);
    assert.equal((await genealogia.obtenerGenealogiaAve(g.hijo, 0)).generaciones, 3);
    assert.equal((await genealogia.obtenerGenealogiaAve(g.hijo, 'x')).generaciones, 3);
});

prueba('genealogia', 'debe devolver null para un ave inexistente o de otra cuenta', async () => {
    const { genealogia } = ctx.clientes;
    await entrarComo(ctx.A);
    assert.equal(await genealogia.obtenerGenealogiaAve('00000000-0000-7000-8000-000000000000'), null);
    await entrarComo(ctx.B);
    assert.equal(await genealogia.obtenerGenealogiaAve(g.hijo), null);
});
