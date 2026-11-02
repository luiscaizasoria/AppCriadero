// CUIDADOS DE JAULA (alimentacion, bebida, sanidad) e historial de jaula con los clientes REST reales.
import { prueba, assert } from '../lib/arnes.mjs';
import { ctx, entrarComo } from '../lib/contexto.mjs';
import { http } from '../lib/http.mjs';

const ahora = () => new Date().toISOString();
const cuidados = { };

async function eventos(jaulaId) {
    return await ctx.clientes.historial.obtenerHistorialJaula(jaulaId);
}

prueba('cuidados', 'debe listar los tipos de alimento y bebida de la plantilla ordenados por nombre', async () => {
    const { alimentacion, bebida } = ctx.clientes;
    await entrarComo(ctx.A);
    assert.deepEqual((await alimentacion.obtenerTiposAlimentos()).map(t => t.nombre), ['Balanceado', 'Morichillo']);
    assert.deepEqual((await bebida.obtenerTiposBebidas()).map(t => t.nombre), ['Agua', 'Agua con vitamina']);
});

prueba('cuidados', 'debe registrar alimentacion con su evento de historial y cantidad/detalle nulos', async () => {
    const { alimentacion, jaulas } = ctx.clientes;
    await entrarComo(ctx.A);
    cuidados.jaulaId = await jaulas.crearJaula({ codigo: 'J-CUI', nombre: 'Cuidados', ubicacion: 'x', tipo: 'General' });
    const fecha = ahora();
    const r = await alimentacion.registrarAlimentacion({ jaulaId: cuidados.jaulaId, fecha, tipo: 'Balanceado', cantidad: '', detalle: undefined });
    assert.equal(r, undefined);
    const regs = await alimentacion.obtenerAlimentacionJaula(cuidados.jaulaId);
    assert.equal(regs.length, 1);
    assert.deepEqual([regs[0].tipo, regs[0].cantidad, regs[0].detalle, regs[0].fecha, regs[0].jaula_id], ['Balanceado', null, null, fecha, cuidados.jaulaId]);
    assert.ok(regs[0].fecha_creacion);
    const ev = (await eventos(cuidados.jaulaId)).filter(e => e.tipo_evento === 'ALIMENTACION');
    assert.equal(ev.length, 1);
    assert.deepEqual([ev[0].detalle, ev[0].ave_id, ev[0].fecha], ['Alimentación: Balanceado', null, fecha]);
    assert.ok(ev[0].fecha_creacion);
});

prueba('cuidados', 'debe guardar cantidad y detalle sin ponerlos en el historial y aceptar tipo fuera de catalogo y fecha futura', async () => {
    const { alimentacion } = ctx.clientes;
    await entrarComo(ctx.A);
    const futura = '2099-01-01T00:00:00.000Z';
    await alimentacion.registrarAlimentacion({ jaulaId: cuidados.jaulaId, fecha: futura, tipo: 'Maíz', cantidad: '2 kg', detalle: 'Mañana' });
    const reg = (await alimentacion.obtenerAlimentacionJaula(cuidados.jaulaId))[0];
    assert.deepEqual([reg.tipo, reg.cantidad, reg.detalle, reg.fecha], ['Maíz', '2 kg', 'Mañana', futura]);
    const ev = (await eventos(cuidados.jaulaId)).find(e => e.detalle === 'Alimentación: Maíz');
    assert.ok(ev, 'el historial solo lleva el tipo');
});

prueba('cuidados', 'debe registrar bebida con su evento de historial', async () => {
    const { bebida } = ctx.clientes;
    await entrarComo(ctx.A);
    await bebida.registrarBebida({ jaulaId: cuidados.jaulaId, fecha: ahora(), tipo: 'Agua con vitamina' });
    const ev = (await eventos(cuidados.jaulaId)).filter(e => e.tipo_evento === 'BEBIDA');
    assert.deepEqual(ev.map(e => e.detalle), ['Bebida: Agua con vitamina']);
});

prueba('cuidados', 'debe pedir fecha y tipo con el texto NOT NULL de SQLite (fecha antes que tipo) y no escribir nada', async () => {
    const { alimentacion, bebida, sanidad } = ctx.clientes;
    await entrarComo(ctx.A);
    const antes = (await eventos(cuidados.jaulaId)).length;
    await assert.rejects(alimentacion.registrarAlimentacion({ jaulaId: cuidados.jaulaId, fecha: ahora(), tipo: null }), /NOT NULL constraint failed: alimentacion_jaula\.tipo/);
    await assert.rejects(bebida.registrarBebida({ jaulaId: cuidados.jaulaId, tipo: 'Agua' }), /NOT NULL constraint failed: bebida_jaula\.fecha/);
    await assert.rejects(sanidad.registrarSanidadJaula({ jaulaId: cuidados.jaulaId, fecha: null, tipo: null }), /NOT NULL constraint failed: sanidad_jaula\.fecha/);
    assert.equal((await eventos(cuidados.jaulaId)).length, antes);
});

prueba('cuidados', 'debe cambiar el estado sanitario con cada tipo de sanidad, sin restricciones de transicion', async () => {
    const { sanidad, jaulas } = ctx.clientes;
    await entrarComo(ctx.A);
    assert.equal((await jaulas.obtenerJaulaPorId(cuidados.jaulaId)).estado_sanitario, 'NORMAL');
    assert.equal((await jaulas.obtenerJaulaPorId(cuidados.jaulaId)).fecha_actualizacion, null);
    const secuencia = [
        ['Limpieza', 'LIMPIEZA'], ['Fumigación', 'FUMIGACION'], ['Quemadura', 'QUEMADURA'],
        ['Cuarentena', 'CUARENTENA'], ['Normal', 'NORMAL'], ['Cuarentena', 'CUARENTENA'], ['Cuarentena', 'CUARENTENA'], ['Limpieza', 'LIMPIEZA']
    ];
    for (const [tipo, estado] of secuencia) {
        await sanidad.registrarSanidadJaula({ jaulaId: cuidados.jaulaId, fecha: ahora(), tipo, detalle: undefined });
        assert.equal((await jaulas.obtenerJaulaPorId(cuidados.jaulaId)).estado_sanitario, estado, `tras ${tipo}`);
    }
    assert.ok((await jaulas.obtenerJaulaPorId(cuidados.jaulaId)).fecha_actualizacion, 'sanidad actualiza fecha_actualizacion');
    const eventosSanidad = (await eventos(cuidados.jaulaId)).filter(e => e.tipo_evento === 'SANIDAD');
    assert.equal(eventosSanidad.length, secuencia.length, 'cada registro crea un evento, tambien al repetir el estado');
    assert.ok(eventosSanidad.some(e => e.detalle === 'Sanidad: Fumigación'));
});

prueba('cuidados', 'debe anadir el detalle al historial con " | " y dejar la jaula en NORMAL con un tipo no reconocido', async () => {
    const { sanidad, jaulas } = ctx.clientes;
    await entrarComo(ctx.A);
    await sanidad.registrarSanidadJaula({ jaulaId: cuidados.jaulaId, fecha: ahora(), tipo: 'Fumigación', detalle: 'Se aplicó producto' });
    assert.ok((await eventos(cuidados.jaulaId)).some(e => e.detalle === 'Sanidad: Fumigación | Se aplicó producto'));
    await sanidad.registrarSanidadJaula({ jaulaId: cuidados.jaulaId, fecha: ahora(), tipo: 'FUMIGACION', detalle: '' });
    assert.equal((await jaulas.obtenerJaulaPorId(cuidados.jaulaId)).estado_sanitario, 'NORMAL');
    assert.ok((await eventos(cuidados.jaulaId)).some(e => e.detalle === 'Sanidad: FUMIGACION'), 'texto crudo en el historial, sin " | "');
});

prueba('cuidados', 'debe aceptar cuidados en una jaula inactiva y fallar con FOREIGN KEY en una jaula inexistente', async () => {
    const { alimentacion, sanidad, jaulas } = ctx.clientes;
    await entrarComo(ctx.A);
    const id = await jaulas.crearJaula({ codigo: 'J-CUI2', nombre: 'Inactiva', ubicacion: 'x', tipo: 'General' });
    await jaulas.desactivarJaula(id);
    await alimentacion.registrarAlimentacion({ jaulaId: id, fecha: ahora(), tipo: 'Agua' });
    await sanidad.registrarSanidadJaula({ jaulaId: id, fecha: ahora(), tipo: 'Cuarentena' });
    const falsa = '00000000-0000-7000-8000-00000000cafe';
    await assert.rejects(alimentacion.registrarAlimentacion({ jaulaId: falsa, fecha: ahora(), tipo: 'Agua' }), /FOREIGN KEY constraint failed/);
    await assert.rejects(sanidad.registrarSanidadJaula({ jaulaId: falsa, fecha: ahora(), tipo: 'Normal' }), /FOREIGN KEY constraint failed/);
});

prueba('cuidados', 'debe devolver los eventos de la jaula del mas reciente al mas antiguo con fecha_creacion', async () => {
    await entrarComo(ctx.A);
    const ev = await eventos(cuidados.jaulaId);
    assert.ok(ev.length >= 12);
    const fechas = ev.map(e => e.fecha);
    assert.deepEqual(fechas, [...fechas].sort().reverse());
    assert.ok(ev.every(e => e.fecha_creacion && e.jaula_id === cuidados.jaulaId));
});

prueba('cuidados', 'debe registrar la respuesta de la API con la forma acordada (registro y estado de la jaula)', async () => {
    const r = await http('POST', `/api/v1/criaderos/${ctx.A.criaderoId}/jaulas/${cuidados.jaulaId}/sanidad`, { token: ctx.A.token, body: { tipo: 'Limpieza', fecha: ahora() } });
    assert.equal(r.status, 201, JSON.stringify(r.json));
    assert.equal(r.data.jaula.estadoSanitario, 'LIMPIEZA');
    assert.deepEqual(Object.keys(r.data.registro).sort(), ['detalle', 'fecha', 'id', 'jaulaId', 'tipo']);
    const mal = await http('POST', `/api/v1/criaderos/${ctx.A.criaderoId}/jaulas/${cuidados.jaulaId}/bebida`, { token: ctx.A.token, body: 'no-objeto' });
    assert.equal(mal.status, 400);
    assert.equal(mal.error, 'VALIDATION_ERROR');
});
