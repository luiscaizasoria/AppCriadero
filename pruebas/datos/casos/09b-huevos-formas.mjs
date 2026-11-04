// HUEVOS: forma exacta (claves, tipos, orden) de las 13 funciones de lectura de HuevoRepository y
// ProduccionRepository contra el Worker, con fechas FIJAS de 2020 (no dependen del reloj).
// Cuenta B (sin huevos al empezar). Las comparaciones con V1 salen de las consultas de
// HuevoRepository.sqlite.js y ProduccionRepository.sqlite.js (alias y orden).
import { prueba, assert } from '../lib/arnes.mjs';
import { ctx, entrarComo } from '../lib/contexto.mjs';

const f = { };
const claves = o => Object.keys(o).sort();
const noCreciente = lista => lista.every((x, i) => i === 0 || lista[i - 1].cantidad >= x.cantidad);
const mapa = (lista, k) => Object.fromEntries(lista.map(x => [x[k], x.cantidad]));

prueba('huevos-formas', 'debe preparar tres aves, dos jaulas y diez huevos con fechas fijas', async () => {
    const { jaulas, aves, huevo } = ctx.clientes;
    await entrarComo(ctx.B);
    f.j1 = await jaulas.crearJaula({ codigo: 'JB-1', nombre: 'Uno', ubicacion: 'x', tipo: 'General' });
    f.j2 = await jaulas.crearJaula({ codigo: 'JB-2', nombre: 'Dos', ubicacion: 'x', tipo: 'General' });
    const base = { origen: 'NACIDA_CRIADERO', fechaNacimiento: '2020-01-01' };
    f.a1 = await aves.crearAve({ ...base, codigo: 'B-1', raza: 'Criolla' });
    f.a2 = await aves.crearAve({ ...base, codigo: 'B-2', raza: 'Plymouth' });
    f.a3 = await aves.crearAve({ ...base, codigo: 'B-3' });
    const huevos = [
        [f.a1, f.j1, '2020-03-02T08:10:00.000Z'], [f.a1, f.j1, '2020-03-02T08:40:00.000Z'], [f.a1, f.j1, '2020-03-02T14:00:00.000Z'],
        [f.a1, null, '2020-03-04T08:20:00.000Z'], [f.a1, null, '2020-03-07T20:30:00.000Z'],
        [f.a2, f.j2, '2020-03-02T14:30:00.000Z'], [f.a2, f.j2, '2020-03-03T08:50:00.000Z'], [f.a2, null, '2020-03-04T09:00:00.000Z'],
        [f.a3, f.j1, '2020-03-07T20:45:00.000Z'], [f.a3, f.j1, '2020-03-07T21:10:00.000Z']
    ];
    for (const [aveId, jaulaId, fecha] of huevos) await huevo.registrarHuevo({ aveId, jaulaId, fecha });
    assert.equal(await huevo.generarCodigoHuevo(), 'H000011');
});

prueba('huevos-formas', 'obtenerHuevosAve: claves {id,codigo,fecha,estado,observacion,jaula_codigo} y orden fecha descendente', async () => {
    const { huevo } = ctx.clientes;
    await entrarComo(ctx.B);
    const l = await huevo.obtenerHuevosAve(f.a1);
    assert.deepEqual(l.map(x => x.fecha), ['2020-03-07T20:30:00.000Z', '2020-03-04T08:20:00.000Z', '2020-03-02T14:00:00.000Z', '2020-03-02T08:40:00.000Z', '2020-03-02T08:10:00.000Z']);
    assert.deepEqual(claves(l[0]), ['codigo', 'estado', 'fecha', 'id', 'jaula_codigo', 'observacion']);
    assert.deepEqual([typeof l[0].id, typeof l[0].codigo, l[0].estado, l[0].observacion, l[0].jaula_codigo], ['string', 'string', 'REGISTRADO', null, null]);
    assert.equal(l[4].jaula_codigo, 'JB-1');
});

prueba('huevos-formas', 'HuevoRepository.obtenerProduccionHuevos: {total,hoy,mes} numericos (hoy y mes 0, no null, si hay huevos)', async () => {
    const { huevo } = ctx.clientes;
    await entrarComo(ctx.B);
    const t = await huevo.obtenerProduccionHuevos();
    assert.deepEqual(claves(t), ['hoy', 'mes', 'total']);
    assert.deepEqual(t, { total: 10, hoy: 0, mes: 0 });
});

prueba('huevos-formas', 'ranking de ponedoras (Huevo y Produccion): {id,codigo,raza,cantidad} por cantidad descendente', async () => {
    const { huevo, produccion } = ctx.clientes;
    await entrarComo(ctx.B);
    for (const lista of [await huevo.obtenerTopPonedoras(), await produccion.obtenerRankingPonedoras()]) {
        assert.deepEqual(lista.map(x => [x.codigo, x.raza, x.cantidad]), [['B-1', 'Criolla', 5], ['B-2', 'Plymouth', 3], ['B-3', null, 2]]);
        assert.deepEqual(claves(lista[0]), ['cantidad', 'codigo', 'id', 'raza']);
        assert.equal(typeof lista[0].cantidad, 'number');
    }
});

prueba('huevos-formas', 'obtenerProduccionPorDia (Huevo): {dia,cantidad} con nombres de dia en UTC, cantidad descendente', async () => {
    const { huevo } = ctx.clientes;
    await entrarComo(ctx.B);
    const l = await huevo.obtenerProduccionPorDia();
    assert.deepEqual(mapa(l, 'dia'), { 'Lunes': 4, 'Martes': 1, 'Miércoles': 2, 'Sábado': 3 });
    assert.ok(noCreciente(l));
    assert.deepEqual(claves(l[0]), ['cantidad', 'dia']);
});

prueba('huevos-formas', 'obtenerProduccionPorHora (Huevo): {hora,cantidad} con hora de 2 digitos como string, UTC', async () => {
    const { huevo } = ctx.clientes;
    await entrarComo(ctx.B);
    const l = await huevo.obtenerProduccionPorHora();
    assert.deepEqual(mapa(l, 'hora'), { '08': 4, '09': 1, '14': 2, '20': 2, '21': 1 });
    assert.ok(noCreciente(l));
    assert.deepEqual(claves(l[0]), ['cantidad', 'hora']);
    assert.equal(typeof l[0].hora, 'string');
});

prueba('huevos-formas', 'produccion por jaula: Huevo devuelve {codigo,cantidad} y Produccion {id,codigo,cantidad}; solo huevos con jaula', async () => {
    const { huevo, produccion } = ctx.clientes;
    await entrarComo(ctx.B);
    const h = await huevo.obtenerProduccionPorJaula();
    const p = await produccion.obtenerProduccionPorJaula();
    assert.deepEqual(h.map(x => [x.codigo, x.cantidad]), [['JB-1', 5], ['JB-2', 2]]);
    assert.deepEqual(p.map(x => [x.codigo, x.cantidad]), [['JB-1', 5], ['JB-2', 2]]);
    assert.deepEqual(claves(h[0]), ['cantidad', 'codigo']);
    assert.deepEqual(claves(p[0]), ['cantidad', 'codigo', 'id']);
    assert.equal(p[0].id, f.j1);
});

prueba('huevos-formas', 'obtenerProduccionPorAve y obtenerResumenProduccion/PorDia (Produccion): formas y vacio fuera de la ventana de 7 dias', async () => {
    const { produccion } = ctx.clientes;
    await entrarComo(ctx.B);
    const a = await produccion.obtenerProduccionPorAve();
    assert.deepEqual(a.map(x => [x.codigo, x.cantidad]), [['B-1', 5], ['B-2', 3], ['B-3', 2]]);
    assert.deepEqual(claves(a[0]), ['cantidad', 'codigo', 'id']);
    const r = await produccion.obtenerResumenProduccion();
    assert.deepEqual(r, { hoy: 0, semana: 0, mes: 0 });
    assert.deepEqual(claves(r), ['hoy', 'mes', 'semana']);
    assert.deepEqual(await produccion.obtenerProduccionPorDia(), []);
});
