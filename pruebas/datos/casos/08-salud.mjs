// SALUD (registrarDiagnostico, obtenerHistorialSaludAve, enfermedades y medicamentos) con los clientes REST reales.
import { prueba, assert } from '../lib/arnes.mjs';
import { ctx, entrarComo } from '../lib/contexto.mjs';

const salud = { };

prueba('salud', 'debe listar enfermedades y medicamentos de la plantilla desde la nube', async () => {
    const { saludAve } = ctx.clientes;
    await entrarComo(ctx.A);
    const enf = await saludAve.obtenerEnfermedades();
    const med = await saludAve.obtenerMedicamentos();
    assert.ok(enf.length > 0 && med.length > 0, 'los catalogos ENFERMEDADES y MEDICAMENTOS deben venir de la nube');
    assert.ok(enf[0].id && enf[0].codigo && enf[0].nombre);
});

prueba('salud', 'debe registrar diagnostico con tratamiento, dejar el ave EN_TRATAMIENTO y escribir el evento SALUD', async () => {
    const { saludAve, aves } = ctx.clientes;
    await entrarComo(ctx.A);
    salud.aveId = ctx.idsAves.madre;
    const fecha = '2026-05-01T10:00:00.000Z';
    const r = await saludAve.registrarDiagnostico({ aveId: salud.aveId, enfermedad: 'Coriza', sintomas: 'Estornudos', observacion: '', medicamento: 'Oxitetraciclina', dosis: '1 ml', fecha });
    assert.equal(r, undefined);
    const ave = await aves.obtenerAvePorId(salud.aveId);
    assert.equal(ave.estado_salud, 'EN_TRATAMIENTO');
    assert.equal(ave.fecha_ultimo_control_salud, fecha);
    const h = await saludAve.obtenerHistorialSaludAve(salud.aveId);
    assert.equal(h.length, 1);
    assert.deepEqual([h[0].enfermedad, h[0].sintomas, h[0].observacion, h[0].medicamento, h[0].dosis, h[0].fecha], ['Coriza', 'Estornudos', null, 'Oxitetraciclina', '1 ml', fecha]);
    const ev = (await aves.obtenerHistorialAve(salud.aveId)).filter(e => e.tipo_evento === 'SALUD');
    assert.equal(ev.length, 1);
    assert.equal(ev[0].detalle, 'Diagnóstico registrado: Coriza');
});

prueba('salud', 'debe registrar diagnostico sin medicamento (dosis descartada) y ordenar el historial por fecha descendente', async () => {
    const { saludAve } = ctx.clientes;
    await entrarComo(ctx.A);
    await saludAve.registrarDiagnostico({ aveId: salud.aveId, enfermedad: 'Bronquitis', sintomas: '', observacion: '', medicamento: null, dosis: 'ignorada', fecha: '2026-06-01T10:00:00.000Z' });
    const h = await saludAve.obtenerHistorialSaludAve(salud.aveId);
    assert.deepEqual(h.map(x => x.enfermedad), ['Bronquitis', 'Coriza']);
    assert.deepEqual([h[0].medicamento, h[0].dosis, h[0].sintomas], [null, null, null]);
});

prueba('salud', 'debe cerrar los diagnosticos al finalizar el tratamiento y seguir mostrandolos en el historial', async () => {
    const { saludAve, salud: estado, aves } = ctx.clientes;
    await entrarComo(ctx.A);
    await estado.finalizarTratamiento({ aveId: salud.aveId, observacion: 'ok' });
    assert.equal((await aves.obtenerAvePorId(salud.aveId)).estado_salud, 'SANA');
    assert.equal((await saludAve.obtenerHistorialSaludAve(salud.aveId)).length, 2);
});

prueba('salud', 'debe devolver historial vacio para un ave inexistente y FOREIGN KEY o AVE_NO_ENCONTRADA al registrar', async () => {
    const { saludAve } = ctx.clientes;
    await entrarComo(ctx.A);
    const falsa = '00000000-0000-7000-8000-000000000000';
    assert.deepEqual(await saludAve.obtenerHistorialSaludAve(falsa), []);
    await assert.rejects(saludAve.registrarDiagnostico({ aveId: falsa, enfermedad: 'X', fecha: '2026-01-01T00:00:00.000Z' }), /AVE_NO_ENCONTRADA|FOREIGN KEY/);
});

prueba('salud', 'debe aislar el historial de salud de A frente a B', async () => {
    const { saludAve } = ctx.clientes;
    await entrarComo(ctx.B);
    assert.deepEqual(await saludAve.obtenerHistorialSaludAve(salud.aveId), []);
    await assert.rejects(saludAve.registrarDiagnostico({ aveId: salud.aveId, enfermedad: 'Intruso', fecha: '2026-01-01T00:00:00.000Z' }), /AVE_NO_ENCONTRADA|FOREIGN KEY|FORBIDDEN/);
    await entrarComo(ctx.A);
    assert.equal((await saludAve.obtenerHistorialSaludAve(salud.aveId)).length, 2);
});
