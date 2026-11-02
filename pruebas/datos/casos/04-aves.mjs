import { prueba, assert } from '../lib/arnes.mjs';
import { ctx, entrarComo } from '../lib/contexto.mjs';

prueba('aves', 'debe crear aves con raza y sexo de la nube, con padre y madre', async () => {
    const { aves, config } = ctx.clientes;
    await entrarComo(ctx.A);
    const razas = await config.obtenerCatalogoPorCodigo('RAZAS');
    const sexos = await config.obtenerCatalogoPorCodigo('SEXOS');
    const raza = (await config.obtenerItemsCatalogo(razas.id))[0];
    const listaSexos = await config.obtenerItemsCatalogo(sexos.id);
    const macho = listaSexos.find(s => /MACHO/i.test(s.codigo));
    const hembra = listaSexos.find(s => /HEMBRA/i.test(s.codigo));
    assert.ok(raza && macho && hembra, 'RAZAS y SEXOS (MACHO/HEMBRA) deben venir de la nube');

    const base = { origen: 'NACIDA_CRIADERO', raza: raza.nombre, fechaNacimiento: '2026-01-01' };
    ctx.idsAves.padre = await aves.crearAve({ ...base, codigo: 'A-PADRE', sexo: macho.codigo, jaulaId: ctx.jaulaIds.j1 });
    ctx.idsAves.madre = await aves.crearAve({ ...base, codigo: 'A-MADRE', sexo: hembra.codigo });
    ctx.idsAves.hijo = await aves.crearAve({ ...base, codigo: 'A-HIJO', sexo: macho.codigo, padreId: ctx.idsAves.padre, madreId: ctx.idsAves.madre });
    assert.equal((await aves.obtenerAvesActivas()).length, 3);
    const hijo = await aves.obtenerAvePorId(ctx.idsAves.hijo);
    assert.equal(hijo.padre_id, ctx.idsAves.padre);
    assert.equal(hijo.madre_id, ctx.idsAves.madre);
    assert.equal(hijo.raza, raza.nombre);
});

prueba('aves', 'debe rechazar el codigo de ave duplicado al crear y al editar', async () => {
    const { aves } = ctx.clientes;
    await entrarComo(ctx.A);
    await assert.rejects(aves.crearAve({ codigo: 'A-PADRE', origen: 'COMPRADA' }), /CODIGO_AVE_DUPLICADO|UNIQUE constraint failed: aves\.codigo/);
    const madre = await aves.obtenerAvePorId(ctx.idsAves.madre);
    await assert.rejects(
        aves.actualizarAve({ id: madre.id, codigo: 'A-PADRE', origen: madre.origen, sexo: madre.sexo }),
        /CODIGO_AVE_DUPLICADO|UNIQUE constraint failed: aves\.codigo/
    );
    assert.equal(await aves.existeAvePorCodigo('A-PADRE'), true);
    assert.equal(await aves.existeAvePorCodigo('NO-EXISTE'), false);
});

prueba('aves', 'debe aplicar las reglas de sexo de padre y madre de V1', async () => {
    const { aves } = ctx.clientes;
    await entrarComo(ctx.A);
    await assert.rejects(aves.crearAve({ codigo: 'A-X1', origen: 'COMPRADA', padreId: ctx.idsAves.madre }), /PADRE_NO_MACHO/);
    await assert.rejects(aves.crearAve({ codigo: 'A-X2', origen: 'COMPRADA', madreId: ctx.idsAves.padre }), /MADRE_NO_HEMBRA/);
});

prueba('aves', 'debe listar candidatos a padre y madre solo de la cuenta', async () => {
    const { aves } = ctx.clientes;
    await entrarComo(ctx.A);
    const codigos = (await aves.obtenerAvesActivasParaPadres(ctx.idsAves.hijo)).map(a => a.codigo);
    assert.ok(codigos.includes('A-PADRE') && codigos.includes('A-MADRE'));
    assert.ok(!codigos.includes('B-AVE'));
    assert.ok(!codigos.includes('A-HIJO'), 'no debe ofrecerse a si misma');
});

prueba('aves', 'debe mover un ave de jaula con contadores e historial', async () => {
    const { aves, jaulas } = ctx.clientes;
    await entrarComo(ctx.A);
    await aves.cambiarJaulaAve({ aveId: ctx.idsAves.madre, jaulaAnteriorId: null, nuevaJaulaId: ctx.jaulaIds.j1, codigoAve: 'A-MADRE' });
    const j1 = (await jaulas.obtenerJaulas()).find(j => j.id === ctx.jaulaIds.j1);
    assert.equal(j1.cantidad_aves, 2);
    const j3 = await jaulas.crearJaula({ codigo: 'J-03', nombre: 'Tres', ubicacion: 'x', tipo: 'Reproduccion' });
    await aves.cambiarJaulaAve({ aveId: ctx.idsAves.madre, jaulaAnteriorId: ctx.jaulaIds.j1, nuevaJaulaId: j3, codigoAve: 'A-MADRE' });
    const lista = await jaulas.obtenerJaulas();
    assert.equal(lista.find(j => j.id === ctx.jaulaIds.j1).cantidad_aves, 1);
    assert.equal(lista.find(j => j.id === j3).cantidad_aves, 1);
    assert.ok((await aves.obtenerHistorialAve(ctx.idsAves.madre)).length >= 2, 'historial del ave');
    assert.ok((await jaulas.obtenerHistorialCompletoJaula(ctx.jaulaIds.j1)).length >= 1, 'historial de la jaula');
    ctx.jaulaIds.j3 = j3;
});

prueba('aves', 'debe liberar las aves al desactivar una jaula con aves', async () => {
    const { jaulas, aves } = ctx.clientes;
    await entrarComo(ctx.A);
    const r = await jaulas.desactivarJaula(ctx.jaulaIds.j3);
    assert.equal(r.cantidadAvesLiberadas, 1);
    assert.equal((await aves.obtenerAvePorId(ctx.idsAves.madre)).jaula_actual_id, null);
});

prueba('aves', 'debe finalizar un tratamiento y dejar el ave SANA', async () => {
    const { salud, aves } = ctx.clientes;
    await entrarComo(ctx.A);
    await salud.finalizarTratamiento({ aveId: ctx.idsAves.hijo, observacion: 'prueba' });
    assert.equal((await aves.obtenerAvePorId(ctx.idsAves.hijo)).estado_salud, 'SANA');
});

prueba('aves', 'debe devolver null para un ave inexistente y listas vacias de vendidas/fallecidas', async () => {
    const { aves } = ctx.clientes;
    await entrarComo(ctx.A);
    assert.equal(await aves.obtenerAvePorId('00000000-0000-7000-8000-000000000000'), null);
    assert.deepEqual(await aves.obtenerAvesVendidas(), []);
    assert.deepEqual(await aves.obtenerAvesFallecidas(), []);
});
