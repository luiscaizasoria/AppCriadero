// HUEVOS (registrarHuevo, lecturas de HuevoRepository y ProduccionRepository) con los clientes REST reales.
// Los huevos de fecha fija van en 2020 (no dependen del reloj); el unico huevo "de hoy" se registra sin fecha.
import { prueba, assert } from '../lib/arnes.mjs';
import { ctx, entrarComo } from '../lib/contexto.mjs';

const h = { };

prueba('huevos', 'debe generar codigos H000001... por criadero y guardar el evento POSTURA_HUEVO', async () => {
    const { huevo, aves } = ctx.clientes;
    await entrarComo(ctx.A);
    h.madre = ctx.idsAves.madre;
    h.padre = ctx.idsAves.padre;
    assert.equal(await huevo.registrarHuevo({ aveId: h.madre, fecha: '2020-03-02T08:30:00.000Z', observacion: '' }), 'H000001');
    assert.equal(await huevo.registrarHuevo({ aveId: h.madre, fecha: '2020-03-02T09:10:00.000Z', jaulaId: '' }), 'H000002');
    assert.equal(await huevo.registrarHuevo({ aveId: h.padre, jaulaId: ctx.jaulaIds.j1, fecha: '2020-03-03T08:05:00.000Z', observacion: 'prueba' }), 'H000003');
    assert.equal(await huevo.registrarHuevo({ aveId: h.madre }), 'H000004');
    assert.equal(await huevo.generarCodigoHuevo(), 'H000005');
    const ev = (await aves.obtenerHistorialAve(h.madre)).filter(e => e.tipo_evento === 'POSTURA_HUEVO');
    assert.equal(ev.length, 3);
    assert.ok(ev.some(e => e.detalle === 'Registró huevo H000001' && e.fecha === '2020-03-02T08:30:00.000Z'));
});

prueba('huevos', 'debe listar los huevos del ave del mas reciente al mas antiguo con jaula_codigo y estado REGISTRADO', async () => {
    const { huevo } = ctx.clientes;
    await entrarComo(ctx.A);
    const lista = await huevo.obtenerHuevosAve(h.madre);
    assert.equal(lista.length, 3);
    assert.deepEqual(lista.map(x => x.codigo), ['H000004', 'H000002', 'H000001']);
    assert.ok(lista.every(x => x.estado === 'REGISTRADO' && x.jaula_codigo === null && x.observacion === null));
    const delPadre = await huevo.obtenerHuevosAve(h.padre);
    assert.equal(delPadre.length, 1);
    assert.ok(delPadre[0].jaula_codigo, 'debe traer el codigo de la jaula');
    assert.equal(delPadre[0].observacion, 'prueba');
    assert.deepEqual(await huevo.obtenerHuevosAve('00000000-0000-7000-8000-000000000000'), []);
});

prueba('huevos', 'debe calcular produccion total, resumen, ranking, por jaula y por hora con las claves de V1', async () => {
    const { huevo, produccion } = ctx.clientes;
    await entrarComo(ctx.A);
    const total = await huevo.obtenerProduccionHuevos();
    assert.equal(total.total, 4);
    assert.equal(total.hoy, 1);
    assert.equal(total.mes, 1);
    assert.deepEqual(await produccion.obtenerResumenProduccion(), { hoy: 1, semana: 1, mes: 1 });
    const ranking = await produccion.obtenerRankingPonedoras();
    assert.deepEqual(ranking.map(r => [r.codigo, r.cantidad]), [['A-MADRE', 3], ['A-PADRE', 1]]);
    assert.deepEqual((await huevo.obtenerTopPonedoras()).map(r => r.cantidad), [3, 1]);
    const jaulas = await produccion.obtenerProduccionPorJaula();
    assert.equal(jaulas.length, 1);
    assert.equal(jaulas[0].cantidad, 1);
    assert.ok(jaulas[0].id && jaulas[0].codigo);
    assert.deepEqual(Object.keys((await huevo.obtenerProduccionPorJaula())[0]).sort(), ['cantidad', 'codigo']);
    const horas = await huevo.obtenerProduccionPorHora();
    assert.ok(horas.every(x => typeof x.hora === 'string' && x.hora.length === 2));
    assert.equal(horas.reduce((a, x) => a + x.cantidad, 0), 4);
    assert.equal((await produccion.obtenerProduccionPorAve()).reduce((a, x) => a + x.cantidad, 0), 4);
    const historico = await huevo.obtenerProduccionPorDia();
    assert.equal(historico.reduce((a, x) => a + x.cantidad, 0), 4);
    assert.equal((await produccion.obtenerProduccionPorDia()).reduce((a, x) => a + x.cantidad, 0), 1);
});

prueba('huevos', 'debe fallar con FOREIGN KEY en ave o jaula inexistente y no escribir nada', async () => {
    const { huevo } = ctx.clientes;
    await entrarComo(ctx.A);
    const falsa = '00000000-0000-7000-8000-000000000000';
    await assert.rejects(huevo.registrarHuevo({ aveId: falsa }), /FOREIGN KEY constraint failed/);
    await assert.rejects(huevo.registrarHuevo({ aveId: h.madre, jaulaId: falsa }), /FOREIGN KEY constraint failed/);
    assert.equal(await huevo.generarCodigoHuevo(), 'H000005');
});

prueba('huevos', 'debe aislar huevos y produccion de A frente a B, con su propio contador de codigos', async () => {
    const { huevo, produccion } = ctx.clientes;
    await entrarComo(ctx.B);
    assert.deepEqual(await huevo.obtenerHuevosAve(h.madre), []);
    assert.deepEqual(await produccion.obtenerResumenProduccion(), { hoy: 0, semana: 0, mes: 0 });
    assert.equal((await huevo.obtenerProduccionHuevos()).total, 0);
    assert.equal(await huevo.generarCodigoHuevo(), 'H000001');
    await assert.rejects(huevo.registrarHuevo({ aveId: h.madre }), /FOREIGN KEY constraint failed/);
    await entrarComo(ctx.A);
    assert.equal((await huevo.obtenerHuevosAve(h.madre)).length, 3);
});
