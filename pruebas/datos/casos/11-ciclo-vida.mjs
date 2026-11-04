// CICLO DE VIDA con el cliente REST real: reune historial, evolucion, salud y huevos (bajas vacias en modo API).
import { prueba, assert } from '../lib/arnes.mjs';
import { ctx, entrarComo } from '../lib/contexto.mjs';

const c = { };
const claves = o => Object.keys(o).sort();

prueba('ciclo-vida', 'debe preparar un ave comprada con salud, huevos y evolucion', async () => {
    const { aves, saludAve, huevo, evolucion } = ctx.clientes;
    await entrarComo(ctx.A);
    c.ave = await aves.crearAve({ codigo: 'C-1', origen: 'COMPRADA', fechaIngreso: '2026-01-10', edadMesesCompra: 6 });
    await saludAve.registrarDiagnostico({ aveId: c.ave, enfermedad: 'Coriza', sintomas: 'Tos', observacion: '', medicamento: 'Oxitetraciclina', dosis: '1 ml', fecha: '2026-02-01T10:00:00.000Z' });
    await saludAve.registrarDiagnostico({ aveId: c.ave, enfermedad: 'Bronquitis', sintomas: '', observacion: '', medicamento: null, dosis: '', fecha: '2026-03-01T10:00:00.000Z' });
    c.h1 = await huevo.registrarHuevo({ aveId: c.ave, fecha: '2026-02-10T08:00:00.000Z' });
    c.h2 = await huevo.registrarHuevo({ aveId: c.ave, fecha: '2026-02-10T09:00:00.000Z' });
    c.h3 = await huevo.registrarHuevo({ aveId: c.ave, fecha: '2026-02-11T08:00:00.000Z' });
    await evolucion.registrarEvolucionAve({ aveId: c.ave, pesoGramos: 1500, observacion: 'inicial' });
    await evolucion.registrarEvolucionAve({ aveId: c.ave, pesoGramos: 1600 });
});

prueba('ciclo-vida', 'debe devolver eventos con las claves y textos de V1 para llegada, salud y huevos', async () => {
    const { ciclo } = ctx.clientes;
    await entrarComo(ctx.A);
    const ev = await ciclo.obtenerCicloVidaAve(c.ave);
    const por = tipo => ev.filter(e => e.tipo === tipo);
    const llegada = por('LLEGADA');
    assert.equal(llegada.length, 1);
    assert.deepEqual([llegada[0].id, llegada[0].fecha, llegada[0].titulo, llegada[0].detalle], [`llegada-${c.ave}`, '2026-01-10', 'Llegada al criadero', 'El ave ingresó al criadero.']);
    assert.equal(por('NACIMIENTO').length, 0);
    const salud = por('SALUD');
    assert.deepEqual(salud.map(e => e.titulo), ['Diagnóstico: Bronquitis', 'Diagnóstico: Coriza']);
    assert.deepEqual(salud.map(e => e.detalle), ['Se registró un diagnóstico de salud.', 'Síntomas: Tos\nMedicamento: Oxitetraciclina · Dosis: 1 ml']);
    assert.deepEqual(claves(salud[0]), ['detalle', 'fecha', 'id', 'tipo', 'titulo']);
    const huevos = por('POSTURA_HUEVO');
    assert.deepEqual(huevos.map(e => e.id), ['huevos-2026-02-11', 'huevos-2026-02-10']);
    assert.deepEqual(huevos.map(e => e.titulo), ['Huevo registrado', '2 huevos registrados']);
    assert.equal(huevos[1].detalle, `Códigos: ${[c.h1, c.h2].sort().join(', ')}`);
    assert.equal(huevos[1].fecha, '2026-02-10T08:00:00.000Z');
});

prueba('ciclo-vida', 'debe incluir la evolucion con el cambio de peso y ordenar todo por fecha descendente', async () => {
    const { ciclo } = ctx.clientes;
    await entrarComo(ctx.A);
    const ev = await ciclo.obtenerCicloVidaAve(c.ave);
    const evo = ev.filter(e => e.tipo === 'EVOLUCION');
    assert.equal(evo.length, 2);
    assert.ok(evo.every(e => e.titulo === 'Evolución registrada' && 'fotoUri' in e && 'caracteristicas' in e));
    assert.ok(evo.some(e => /1500/.test(e.detalle) && /1600/.test(e.detalle)), 'debe mostrar el cambio de peso 1500 a 1600');
    const tiempos = ev.map(e => Date.parse(e.fecha)).filter(t => !Number.isNaN(t));
    assert.ok(tiempos.every((t, i) => i === 0 || tiempos[i - 1] >= t), 'orden por fecha descendente');
    assert.ok(!ev.some(e => ['VENTA', 'MUERTE', 'BAJA'].includes(e.tipo)), 'sin bajas en modo API (Bajas pendiente)');
});

prueba('ciclo-vida', 'debe devolver lista vacia para un ave inexistente o de otra cuenta', async () => {
    const { ciclo } = ctx.clientes;
    await entrarComo(ctx.A);
    assert.deepEqual(await ciclo.obtenerCicloVidaAve('00000000-0000-7000-8000-000000000000'), []);
    await entrarComo(ctx.B);
    assert.deepEqual(await ciclo.obtenerCicloVidaAve(c.ave), []);
});
