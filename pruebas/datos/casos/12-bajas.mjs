// BAJAS (muerte y venta) con el cliente REST real; los movimientos financieros se leen de D1 (--env test).
import { prueba, assert } from '../lib/arnes.mjs';
import { ctx, entrarComo } from '../lib/contexto.mjs';
import { http } from '../lib/http.mjs';
import { movimientosPorCriadero } from '../lib/limpiar.mjs';

const b = {};
const ruta = (criaderoId, aveId, final) => `/api/v1/criaderos/${criaderoId}/aves/${aveId}/${final}`;
const nueva = async codigo => ctx.clientes.aves.crearAve({ codigo, origen: 'COMPRADA', fechaIngreso: '2026-01-10', edadMesesCompra: 6 });
const movs = aveId => movimientosPorCriadero(ctx.A.criaderoId).filter(m => m.ave_id === aveId);
const porCategoria = (lista, categoria) => lista.filter(m => m.categoria === categoria);
const ventaBase = { celular: '+593 99 123 4567', ciudadDestino: 'Quito', cooperativaEnvio: '', comprador: 'Juan', valorVenta: 12.5, valorEnvio: null, detalle: '' };

prueba('bajas', 'debe preparar las aves de los casos de baja', async () => {
    await entrarComo(ctx.A);
    for (const k of ['v1', 'v2', 'v3', 'v4', 'm1', 'dos', 'cel', 'ais']) b[k] = await nueva(`BAJ-${k}`);
});

prueba('bajas', 'debe registrar una venta sin envio con celular normalizado y dos ingresos (envio en 0)', async () => {
    const { bajas, aves } = ctx.clientes;
    await entrarComo(ctx.A);
    const r = await bajas.registrarVentaAve({ aveId: b.v1, fechaVenta: new Date().toISOString(), ...ventaBase });
    assert.equal(r, undefined);
    const baja = await aves.obtenerBajaAve(b.v1);
    assert.equal(baja.tipo, 'VENTA');
    assert.equal(baja.celular, '0991234567');
    assert.equal(baja.valor_venta, 12.5);
    assert.equal(baja.valor_envio, null);
    assert.equal(baja.comprador, 'Juan');
    assert.equal(baja.ciudad_destino, 'Quito');
    assert.equal(baja.causa, null);
    assert.equal(baja.detalle, null);
    assert.ok((await aves.obtenerAvesVendidas()).some(a => a.id === b.v1), 'debe salir en vendidas');
    assert.ok(!(await aves.obtenerAves()).some(a => a.id === b.v1), 'ya no esta activa');
    const m = movs(b.v1);
    assert.equal(m.length, 2);
    assert.ok(m.every(x => x.tipo === 'INGRESO' && x.origen_tipo === 'VENTA_AVE' && x.origen_id === baja.id));
    const venta = porCategoria(m, 'VENTA_AVE');
    const envio = porCategoria(m, 'ENVIO_AVE');
    assert.equal(venta.length, 1);
    assert.equal(envio.length, 1);
    assert.deepEqual([venta[0].valor, venta[0].detalle], [12.5, `Venta de ave ${b.v1} a Juan`]);
    assert.deepEqual([envio[0].valor, envio[0].detalle], [0, `Envío de venta de ave ${b.v1} a Juan`]);
});

prueba('bajas', 'debe registrar una venta con envio y mostrarla una sola vez en el ciclo de vida', async () => {
    const { bajas, aves, ciclo } = ctx.clientes;
    await entrarComo(ctx.A);
    await bajas.registrarVentaAve({ aveId: b.v2, fechaVenta: new Date().toISOString(), ...ventaBase, valorEnvio: 3.25, cooperativaEnvio: 'Coop', detalle: 'Gracias' });
    const baja = await aves.obtenerBajaAve(b.v2);
    assert.deepEqual([baja.valor_venta, baja.valor_envio, baja.cooperativa_envio, baja.detalle], [12.5, 3.25, 'Coop', 'Gracias']);
    const m = movs(b.v2);
    assert.equal(porCategoria(m, 'ENVIO_AVE')[0].valor, 3.25);
    assert.equal(porCategoria(m, 'VENTA_AVE')[0].valor, 12.5);
    const ev = await ciclo.obtenerCicloVidaAve(b.v2);
    const ventas = ev.filter(e => e.tipo === 'VENTA');
    assert.equal(ventas.length, 1, 'exactamente un evento VENTA');
    assert.equal(ventas[0].id, `venta-${baja.id}`);
    assert.equal(ventas[0].titulo, 'Ave vendida');
    assert.ok(ventas[0].detalle.includes('Valor: $12.50'), ventas[0].detalle);
    assert.ok(ventas[0].detalle.includes('Envío: $3.25'), ventas[0].detalle);
    assert.ok(ventas[0].detalle.includes('Gracias'), ventas[0].detalle);
});

prueba('bajas', 'debe guardar null y movimientos en 0 cuando la venta no trae valores ni comprador', async () => {
    const { bajas, aves } = ctx.clientes;
    await entrarComo(ctx.A);
    await bajas.registrarVentaAve({ aveId: b.v3, fechaVenta: new Date().toISOString(), celular: '0991234567', ciudadDestino: '', cooperativaEnvio: '', comprador: '', valorVenta: null, valorEnvio: null, detalle: '' });
    const baja = await aves.obtenerBajaAve(b.v3);
    assert.deepEqual([baja.valor_venta, baja.valor_envio, baja.comprador], [null, null, null]);
    const m = movs(b.v3);
    assert.equal(m.length, 2);
    assert.deepEqual([porCategoria(m, 'VENTA_AVE')[0].valor, porCategoria(m, 'VENTA_AVE')[0].detalle], [0, `Venta de ave ${b.v3}`]);
    assert.deepEqual([porCategoria(m, 'ENVIO_AVE')[0].valor, porCategoria(m, 'ENVIO_AVE')[0].detalle], [0, `Envío de venta de ave ${b.v3}`]);
});

prueba('bajas', 'debe conservar valorVenta 0 como 0 y no como null', async () => {
    const { bajas, aves } = ctx.clientes;
    await entrarComo(ctx.A);
    await bajas.registrarVentaAve({ aveId: b.v4, fechaVenta: new Date().toISOString(), ...ventaBase, valorVenta: 0 });
    const baja = await aves.obtenerBajaAve(b.v4);
    assert.equal(baja.valor_venta, 0);
    assert.equal(porCategoria(movs(b.v4), 'VENTA_AVE')[0].valor, 0);
});

prueba('bajas', 'debe rechazar celular vacio o sin digitos con CELULAR_COMPRADOR_REQUERIDO sin escribir nada', async () => {
    const { bajas, aves } = ctx.clientes;
    await entrarComo(ctx.A);
    for (const celular of ['', 'abc']) {
        await assert.rejects(
            bajas.registrarVentaAve({ aveId: b.cel, fechaVenta: new Date().toISOString(), ...ventaBase, celular }),
            e => e instanceof Error && e.message === 'CELULAR_COMPRADOR_REQUERIDO'
        );
    }
    assert.equal((await aves.obtenerAvePorId(b.cel)).estado, 'ACTIVA');
    assert.equal(await aves.obtenerBajaAve(b.cel), null);
    assert.deepEqual(movs(b.cel), []);
    assert.ok(!(await aves.obtenerAvesVendidas()).some(a => a.id === b.cel));
});

prueba('bajas', 'debe registrar la muerte con causa, un solo evento Fallecimiento y sin movimientos', async () => {
    const { bajas, aves, ciclo } = ctx.clientes;
    await entrarComo(ctx.A);
    const r = await bajas.registrarMuerteAve({ aveId: b.m1, causa: 'Enfermedad', detalle: '' });
    assert.equal(r, undefined);
    assert.ok((await aves.obtenerAvesFallecidas()).some(a => a.id === b.m1), 'debe salir en fallecidas');
    const baja = await aves.obtenerBajaAve(b.m1);
    assert.deepEqual([baja.tipo, baja.causa, baja.detalle], ['MUERTE', 'Enfermedad', null]);
    const ev = await ciclo.obtenerCicloVidaAve(b.m1);
    const muertes = ev.filter(e => e.tipo === 'MUERTE');
    assert.equal(muertes.length, 1, 'exactamente un evento MUERTE');
    assert.equal(muertes[0].id, `muerte-${baja.id}`);
    assert.equal(muertes[0].titulo, 'Fallecimiento');
    assert.ok(muertes[0].detalle.includes('Causa: Enfermedad'), muertes[0].detalle);
    assert.deepEqual(movs(b.m1), []);
});

prueba('bajas', 'debe aceptar otra baja de un ave ya vendida y pisar el estado (como V1)', async () => {
    const { bajas, aves } = ctx.clientes;
    await entrarComo(ctx.A);
    await bajas.registrarVentaAve({ aveId: b.dos, fechaVenta: new Date().toISOString(), ...ventaBase });
    await bajas.registrarMuerteAve({ aveId: b.dos, causa: 'Accidente', detalle: 'Aplastada' });
    assert.equal((await aves.obtenerAvePorId(b.dos)).estado, 'FALLECIDA');
    assert.ok((await aves.obtenerAvesFallecidas()).some(a => a.id === b.dos));
    assert.equal((await aves.obtenerBajaAve(b.dos)).tipo, 'MUERTE', 'la baja mas reciente es la muerte');
});

prueba('bajas', 'debe lanzar AVE_NO_ENCONTRADA con un ave inexistente y no escribir nada', async () => {
    const { bajas } = ctx.clientes;
    await entrarComo(ctx.A);
    const falso = '00000000-0000-7000-8000-000000000000';
    const antes = movimientosPorCriadero(ctx.A.criaderoId).length;
    await assert.rejects(bajas.registrarMuerteAve({ aveId: falso, causa: 'x', detalle: '' }), e => e.message === 'AVE_NO_ENCONTRADA');
    await assert.rejects(bajas.registrarVentaAve({ aveId: falso, fechaVenta: new Date().toISOString(), ...ventaBase }), e => e.message === 'AVE_NO_ENCONTRADA');
    assert.equal(movimientosPorCriadero(ctx.A.criaderoId).length, antes, 'sin movimientos nuevos');
    const r = await http('POST', ruta(ctx.A.criaderoId, falso, 'muerte'), { token: ctx.A.token, body: { causa: 'x', detalle: '', fecha: new Date().toISOString() } });
    assert.equal(r.status, 404);
    assert.equal(r.error, 'AVE_NO_ENCONTRADA');
});

prueba('bajas', 'debe aislar las bajas entre cuentas (403 criadero ajeno, 404 ave ajena) y dejar intacta el ave de A', async () => {
    const { bajas, aves } = ctx.clientes;
    const cuerpoMuerte = { causa: 'HACK', detalle: '', fecha: new Date().toISOString() };
    const cuerpoVenta = { fecha: new Date().toISOString(), celular: '0991234567', valorVenta: 1 };
    // B contra el criadero de A (HTTP crudo)
    for (const [metodo, final, body] of [['POST', 'muerte', cuerpoMuerte], ['POST', 'venta', cuerpoVenta], ['GET', 'bajas', undefined]]) {
        const r = await http(metodo, ruta(ctx.A.criaderoId, b.ais, final), { token: ctx.B.token, body });
        assert.equal(r.status, 403, `${metodo} ${final}`);
        assert.equal(r.error, 'FORBIDDEN', `${metodo} ${final}`);
    }
    // B con el ave de A en su propio criadero
    await entrarComo(ctx.B);
    await assert.rejects(bajas.registrarMuerteAve({ aveId: b.ais, causa: 'HACK', detalle: '' }), e => e.message === 'AVE_NO_ENCONTRADA');
    await assert.rejects(bajas.registrarVentaAve({ aveId: b.ais, fechaVenta: new Date().toISOString(), ...ventaBase }), e => e.message === 'AVE_NO_ENCONTRADA');
    assert.equal(await aves.obtenerBajaAve(b.ais), null);
    assert.ok(!(await aves.obtenerAvesFallecidas()).some(a => a.id === b.ais));
    assert.ok(!(await aves.obtenerAvesVendidas()).some(a => a.id === b.ais));
    // A sigue igual
    await entrarComo(ctx.A);
    assert.equal((await aves.obtenerAvePorId(b.ais)).estado, 'ACTIVA');
    assert.equal(await aves.obtenerBajaAve(b.ais), null);
    assert.deepEqual(movs(b.ais), []);
});
