// FINANZAS con el cliente REST real. Se trabaja en un criadero NUEVO de la cuenta A (arranca vacio),
// asi los totales son absolutos. Todo el borrado lo hace la limpieza de cuentas desechables.
// Los importes de los periodos MES/ANIO dependen del reloj: ver mismoMes().
import { prueba, assert } from '../lib/arnes.mjs';
import { ctx, entrarComo } from '../lib/contexto.mjs';
import { http, crearCriaderoHttp } from '../lib/http.mjs';

const G = 'finanzas';
const FALSO = '00000000-0000-7000-8000-000000000000';
const fin = {};            // criaderoId, ids sembrados
const dataset = [];        // espejo local de los movimientos manuales: { id, tipo, categoria, fecha, valor, detalle }

const f = () => ctx.clientes.finanzas;
const base = () => `/api/v1/criaderos/${fin.criaderoId}/finanzas`;

async function entrarFin() {
    await entrarComo(ctx.A);
    await ctx.clientes.acceso.seleccionarCriadero(fin.criaderoId);
}

// Reloj: los periodos MES/ANIO se calculan en UTC con la hora del servidor. Si la prueba cruza la
// frontera de mes durante su ejecucion, los esperados dejan de valer: se aborta con un mensaje claro.
const claveMes = () => new Date().toISOString().slice(0, 7);
const mes0 = claveMes();
const anio0 = mes0.slice(0, 4);
const mismoMes = () => assert.equal(claveMes(), mes0, 'se cruzo la frontera de mes UTC durante la prueba: repetir');

// Suma ingenua en JS en el mismo orden de insercion. SQLite (SUM) puede usar suma compensada, asi que
// los totales con 0.1 + 0.2 pueden diferir en ~1e-16: se comparan con tolerancia relativa 1e-9.
// Los conjuntos con importes en cuartos (12.5, 3.25, 100.5, 40.25...) son exactos en binario y se comparan exactos.
const suma = valores => valores.reduce((s, x) => s + x, 0);
function cerca(real, esperado, msg) {
    assert.ok(Math.abs(real - esperado) <= 1e-9 * Math.max(1, Math.abs(real), Math.abs(esperado)), `${msg ?? ''} real=${real} esperado=${esperado}`);
}

const filtros = {
    TODO: () => true,
    MES: m => m.fecha.slice(0, 7) === mes0,
    ANIO: m => m.fecha.slice(0, 4) === anio0
};

function resumenEsperado(periodo) {
    const sel = dataset.filter(filtros[periodo]);
    const ingresos = suma(sel.filter(m => m.tipo === 'INGRESO').map(m => m.valor));
    const egresos = suma(sel.filter(m => m.tipo === 'EGRESO').map(m => m.valor));
    return { ingresos, egresos, utilidad: ingresos - egresos };
}

function comparaResumen(real, esperado, exacto, msg) {
    assert.deepEqual(Object.keys(real).sort(), ['egresos', 'ingresos', 'utilidad'], msg);
    assert.equal(real.utilidad, real.ingresos - real.egresos, `${msg}: utilidad = ingresos - egresos en JS`);
    if (exacto) {
        assert.deepEqual(real, esperado, msg);
    } else {
        for (const k of ['ingresos', 'egresos', 'utilidad']) cerca(real[k], esperado[k], `${msg} ${k}`);
    }
}

function categoriasEsperadas(periodo) {
    const grupos = new Map();
    for (const m of dataset.filter(filtros[periodo])) {
        const k = `${m.tipo}|${m.categoria || 'OTRO'}`;
        const g = grupos.get(k) ?? { tipo: m.tipo, categoria: m.categoria || 'OTRO', cantidad: 0, valores: [] };
        g.cantidad++;
        g.valores.push(m.valor);
        grupos.set(k, g);
    }
    return [...grupos.values()]
        .map(g => ({ tipo: g.tipo, categoria: g.categoria, cantidad: g.cantidad, total: suma(g.valores) }))
        .sort((a, b) => (a.tipo < b.tipo ? 1 : a.tipo > b.tipo ? -1 : b.total - a.total));
}

function mensualEsperado(limite) {
    const grupos = new Map();
    for (const m of dataset) {
        const p = m.fecha.slice(0, 7);
        const g = grupos.get(p) ?? { periodo: p, ing: [], egr: [] };
        (m.tipo === 'INGRESO' ? g.ing : g.egr).push(m.valor);
        grupos.set(p, g);
    }
    return [...grupos.values()]
        .sort((a, b) => (a.periodo < b.periodo ? 1 : -1))
        .slice(0, limite)
        .map(g => ({ periodo: g.periodo, ingresos: suma(g.ing), egresos: suma(g.egr) }));
}

const CLAVES_MOV = ['id', 'tipo', 'categoria', 'fecha', 'valor', 'detalle', 'ave_id', 'origen_tipo', 'origen_id', 'ave_codigo'];
const CLAVES_MOV_ID = [...CLAVES_MOV, 'fecha_creacion'].sort();
const CLAVES_HIST = ['id', 'movimiento_id', 'fecha', 'accion', 'tipo_anterior', 'tipo_nuevo', 'categoria_anterior', 'categoria_nueva',
    'fecha_movimiento_anterior', 'fecha_movimiento_nueva', 'valor_anterior', 'valor_nuevo', 'detalle_anterior', 'detalle_nuevo',
    'origen_tipo', 'origen_id'].sort();

async function alta(tipo, datos) {
    const fn = tipo === 'INGRESO' ? f().registrarIngreso : f().registrarEgreso;
    const id = await fn(datos);
    assert.equal(typeof id, 'string', 'el alta devuelve el id (string)');
    assert.ok(id.length > 10);
    const reg = { id, tipo, categoria: datos.categoria || 'OTRO', fecha: datos.fecha, valor: datos.valor, detalle: datos.detalle || null };
    if (!reg.fecha) reg.fecha = (await f().obtenerMovimientoPorId(id)).fecha;
    dataset.push(reg);
    return reg;
}

prueba(G, 'debe crear un criadero vacio para finanzas y devolver todo en cero o vacio', async () => {
    await entrarComo(ctx.A);
    fin.criaderoId = await crearCriaderoHttp(ctx.A.token, 'Finanzas pruebas');
    await entrarFin();
    for (const p of ['TODO', 'MES', 'ANIO']) {
        assert.deepEqual(await f().obtenerResumenFinanciero(p), { ingresos: 0, egresos: 0, utilidad: 0 }, p);
        assert.deepEqual(await f().obtenerConsolidadoCategorias(p), [], p);
    }
    assert.deepEqual(await f().obtenerResumenFinanciero(), { ingresos: 0, egresos: 0, utilidad: 0 });
    assert.deepEqual(await f().obtenerMovimientosFinancieros(), []);
    assert.deepEqual(await f().obtenerConsolidadoMensual(12), []);
    assert.deepEqual(await f().obtenerHistorialMovimiento(FALSO), []);
});

prueba(G, 'debe dar de alta ingresos y egresos manuales con decimales, fechas fijas y valores por defecto', async () => {
    await entrarFin();
    const ahora = new Date();
    const ant = new Date(Date.UTC(ahora.getUTCFullYear(), ahora.getUTCMonth(), 0, 12)).toISOString();   // ultimo dia del mes anterior
    const sig = `${ahora.getUTCFullYear() + 1}-01-01T00:00:00.000Z`;                                       // otro anio

    // Fechas fijas (2001), dos con la misma fecha para comprobar el desempate
    fin.ing1 = await alta('INGRESO', { categoria: 'VENTA_HUEVOS', valor: 12.5, detalle: 'huevos', fecha: '2001-03-10T08:00:00.000Z' });
    fin.ing2 = await alta('INGRESO', { categoria: 'OTRO', valor: 3.25, detalle: 'otro', fecha: '2001-03-10T08:00:00.000Z' });
    fin.ing3 = await alta('INGRESO', { categoria: '', valor: 0.1, detalle: '', fecha: '2001-05-01T00:00:00.000Z' });
    fin.ing4 = await alta('INGRESO', { categoria: 'OTRO', valor: 0.2, detalle: 'segundo', fecha: '2001-05-01T00:00:01.000Z' });
    fin.egr1 = await alta('EGRESO', { categoria: 'INFRAESTRUCTURA', valor: 1234567.89, detalle: 'galpon', fecha: '2001-03-15T10:00:00.000Z' });
    fin.egr2 = await alta('EGRESO', { categoria: 'ALIMENTO', valor: 0, detalle: 'cero', fecha: '2001-04-01T00:00:00.000Z' });      // FIN-12: el repositorio no valida
    fin.egr3 = await alta('EGRESO', { categoria: 'ALIMENTO', valor: 19.99, detalle: 'maiz', fecha: '2001-04-02T00:00:00.000Z' });
    fin.egr6 = await alta('EGRESO', { categoria: 'OTRO', valor: -3.25, detalle: 'negativo', fecha: '2001-07-01T00:00:00.000Z' });   // FIN-12
    // Fecha actual (MES y ANIO): ing5 sin categoria ni fecha (FIN-11: 'OTRO' y fecha del servidor)
    fin.ing5 = await alta('INGRESO', { valor: 100.5, detalle: '' });
    fin.egr4 = await alta('EGRESO', { categoria: 'ALIMENTO', valor: 40.25, detalle: 'ahora', fecha: ahora.toISOString() });
    // Otro mes cercano (mes anterior) y otro anio (siguiente)
    fin.ing6 = await alta('INGRESO', { categoria: 'OTRO', valor: 7.75, detalle: 'mes anterior', fecha: ant });
    fin.egr5 = await alta('EGRESO', { categoria: 'ALIMENTO', valor: 2.5, detalle: 'mes anterior', fecha: ant });
    fin.ing7 = await alta('INGRESO', { categoria: 'OTRO', valor: 5.5, detalle: 'anio siguiente', fecha: sig });
    mismoMes();

    // FIN-11: valores por defecto
    const m5 = await f().obtenerMovimientoPorId(fin.ing5.id);
    assert.deepEqual([m5.categoria, m5.detalle, m5.origen_tipo, m5.ave_id, m5.origen_id], ['OTRO', null, 'MANUAL', null, null]);
    assert.equal(m5.fecha.slice(0, 7), mes0);
    assert.equal(fin.ing5.categoria, 'OTRO');
    assert.equal((await f().obtenerMovimientoPorId(fin.ing3.id)).categoria, 'OTRO', "categoria '' = 'OTRO'");
    assert.equal((await f().obtenerMovimientoPorId(fin.ing3.id)).detalle, null, "detalle '' = null");
    // el alta manual no escribe historial
    assert.deepEqual(await f().obtenerHistorialMovimiento(fin.ing1.id), []);
});

prueba(G, 'debe devolver los valores decimales identicos y las claves de V1 en obtenerMovimientoPorId', async () => {
    await entrarFin();
    const e1 = await f().obtenerMovimientoPorId(fin.egr1.id);
    assert.deepEqual(Object.keys(e1).sort(), CLAVES_MOV_ID);
    assert.equal(e1.valor, 1234567.89);
    assert.equal(e1.tipo, 'EGRESO');
    assert.equal(e1.categoria, 'INFRAESTRUCTURA');
    assert.equal(e1.fecha, '2001-03-15T10:00:00.000Z');
    assert.equal(e1.detalle, 'galpon');
    assert.deepEqual([e1.ave_id, e1.origen_tipo, e1.origen_id, e1.ave_codigo], [null, 'MANUAL', null, null]);
    assert.ok(e1.fecha_creacion);
    assert.equal((await f().obtenerMovimientoPorId(fin.ing4.id)).valor, 0.2);
    assert.equal((await f().obtenerMovimientoPorId(fin.egr3.id)).valor, 19.99);
    assert.equal((await f().obtenerMovimientoPorId(fin.egr2.id)).valor, 0);
    assert.equal((await f().obtenerMovimientoPorId(fin.egr6.id)).valor, -3.25);
    assert.equal(await f().obtenerMovimientoPorId(FALSO), null);
});

prueba(G, 'debe listar los movimientos por fecha descendente, el insertado despues primero en empates, con claves de V1', async () => {
    await entrarFin();
    const lista = await f().obtenerMovimientosFinancieros();
    assert.equal(lista.length, dataset.length);
    for (const m of lista) assert.deepEqual(Object.keys(m).sort(), [...CLAVES_MOV].sort());
    for (let i = 1; i < lista.length; i++) assert.ok(lista[i - 1].fecha >= lista[i].fecha, `orden ${i}`);
    const esperado = dataset.map((m, i) => ({ ...m, i }))
        .sort((a, b) => (a.fecha < b.fecha ? 1 : a.fecha > b.fecha ? -1 : b.i - a.i))
        .map(m => m.id);
    assert.deepEqual(lista.map(m => m.id), esperado);
    const pos = id => lista.findIndex(m => m.id === id);
    assert.ok(pos(fin.ing2.id) < pos(fin.ing1.id), 'misma fecha: el insertado despues va primero');
    const m1 = lista[pos(fin.ing1.id)];
    assert.deepEqual([m1.tipo, m1.categoria, m1.valor, m1.detalle, m1.origen_tipo, m1.ave_id, m1.ave_codigo], ['INGRESO', 'VENTA_HUEVOS', 12.5, 'huevos', 'MANUAL', null, null]);
});

prueba(G, 'debe calcular el resumen TODO, MES y ANIO con la suma esperada y tratar periodos desconocidos como TODO', async () => {
    await entrarFin();
    const todo = await f().obtenerResumenFinanciero('TODO');
    comparaResumen(todo, resumenEsperado('TODO'), false, 'TODO');
    // Cuartos exactos: 2 decimales (12.5 + 3.25 ...) coinciden exacto
    cerca(todo.egresos, 1234567.89 + 0 + 19.99 + -3.25 + 40.25 + 2.5, 'egresos TODO');

    const mes = await f().obtenerResumenFinanciero('MES');
    comparaResumen(mes, resumenEsperado('MES'), true, 'MES');
    assert.deepEqual(mes, { ingresos: 100.5, egresos: 40.25, utilidad: 60.25 });

    const anio = await f().obtenerResumenFinanciero('ANIO');
    comparaResumen(anio, resumenEsperado('ANIO'), true, 'ANIO');
    const prevMismoAnio = fin.ing6.fecha.slice(0, 4) === anio0;
    assert.equal(anio.ingresos, prevMismoAnio ? 100.5 + 7.75 : 100.5);
    assert.equal(anio.egresos, prevMismoAnio ? 40.25 + 2.5 : 40.25);

    // desconocido, minusculas, undefined y null = TODO
    for (const p of ['mes', 'X', undefined, null]) {
        assert.deepEqual(await f().obtenerResumenFinanciero(p), todo, String(p));
    }
    mismoMes();
});

prueba(G, 'debe sumar 60 movimientos con importes en cuartos y repartirlos por categoria y por mes', async () => {
    await entrarFin();
    // 60 movimientos en 2002 (12 meses x 5 dias), alternando ingreso/egreso
    for (let i = 0; i < 60; i++) {
        const mm = String((i % 12) + 1).padStart(2, '0');
        const dd = String(1 + Math.floor(i / 12)).padStart(2, '0');
        const par = i % 2 === 0;
        await alta(par ? 'INGRESO' : 'EGRESO', {
            categoria: par ? 'VENTA_HUEVOS' : 'ALIMENTO',
            valor: (i + 1) * 0.25,
            detalle: `lote ${i}`,
            fecha: `2002-${mm}-${dd}T12:00:00.000Z`
        });
    }
    const lista = await f().obtenerMovimientosFinancieros();
    assert.equal(lista.length, dataset.length);
    assert.ok(lista.length >= 72);
    comparaResumen(await f().obtenerResumenFinanciero('TODO'), resumenEsperado('TODO'), false, 'TODO tras 60');

    // Consolidado por categoria: INGRESO antes que EGRESO, total descendente, NULL/'' unidos en OTRO
    for (const p of ['TODO', 'MES', 'ANIO']) {
        const real = await f().obtenerConsolidadoCategorias(p);
        const esp = categoriasEsperadas(p);
        assert.equal(real.length, esp.length, p);
        real.forEach((r, i) => {
            assert.deepEqual(Object.keys(r).sort(), ['cantidad', 'categoria', 'tipo', 'total'], p);
            assert.deepEqual([r.tipo, r.categoria, r.cantidad], [esp[i].tipo, esp[i].categoria, esp[i].cantidad], `${p} fila ${i}`);
            cerca(r.total, esp[i].total, `${p} ${r.tipo}/${r.categoria}`);
        });
    }
    const todas = await f().obtenerConsolidadoCategorias('TODO');
    const otro = todas.find(r => r.tipo === 'INGRESO' && r.categoria === 'OTRO');
    assert.equal(otro.cantidad, 6, 'ing2,ing3(vacia),ing4,ing5(ausente),ing6,ing7');
    assert.ok(todas.findIndex(r => r.tipo === 'INGRESO') < todas.findIndex(r => r.tipo === 'EGRESO'));
    assert.deepEqual(await f().obtenerConsolidadoCategorias('MES').then(l => l.map(r => [r.tipo, r.categoria, r.cantidad, r.total])),
        [['INGRESO', 'OTRO', 1, 100.5], ['EGRESO', 'ALIMENTO', 1, 40.25]]);

    // Consolidado mensual: solo meses con movimientos, mas recientes primero, maximo 12
    const todos = mensualEsperado(1000);
    assert.ok(todos.length > 12, 'hay mas de 12 meses con datos');
    const m12 = await f().obtenerConsolidadoMensual(12);
    assert.equal(m12.length, 12);
    m12.forEach((r, i) => {
        assert.deepEqual(Object.keys(r).sort(), ['egresos', 'ingresos', 'periodo']);
        assert.equal(r.periodo, todos[i].periodo, `periodo ${i}`);
        cerca(r.ingresos, todos[i].ingresos, `ingresos ${r.periodo}`);
        cerca(r.egresos, todos[i].egresos, `egresos ${r.periodo}`);
    });
    assert.ok(!m12.some(r => r.periodo === '2001-06'), 'un mes sin movimientos no aparece (relleno con ceros)');
    assert.ok(!m12.some(r => r.periodo === '2001-03'), 'los mas antiguos se descartan');
    for (let i = 1; i < m12.length; i++) assert.ok(m12[i - 1].periodo > m12[i].periodo);
    // limite
    const l3 = await f().obtenerConsolidadoMensual(3);
    assert.deepEqual(l3.map(r => r.periodo), todos.slice(0, 3).map(r => r.periodo));
    for (const limite of [0, 'x', undefined]) {
        assert.equal((await f().obtenerConsolidadoMensual(limite)).length, 12, `limite ${limite}`);
    }
    // Fronteras y meses de solo egresos o con 0.1 + 0.2 (en todos los meses, datos de 2001)
    const todosMeses = await f().obtenerConsolidadoMensual(100);
    assert.equal(todosMeses.length, todos.length);
    const abril = todosMeses.find(r => r.periodo === '2001-04');
    assert.deepEqual([abril.ingresos, abril.egresos], [0, 19.99], 'mes de solo egresos (0 + 19.99)');
    const mayo = todosMeses.find(r => r.periodo === '2001-05');
    cerca(mayo.ingresos, 0.1 + 0.2, 'mayo 2001: 0.1 + 0.2 (puede diferir 1e-16 del orden de suma)');
    assert.equal(mayo.egresos, 0);
    mismoMes();
});

prueba(G, 'debe editar un movimiento manual y registrar EDICION_MANUAL con valores anterior y nuevo (tambien sin cambios y con valores por defecto)', async () => {
    await entrarFin();
    const ed = await alta('INGRESO', { categoria: 'OTRO', valor: 10.5, detalle: 'orig', fecha: '2001-06-01T00:00:00.000Z' });
    const F2 = '2001-06-02T00:00:00.000Z';
    const antes = await f().obtenerResumenFinanciero('TODO');

    // (a) edicion completa; detalle con espacios se recorta
    const r1 = await f().actualizarMovimientoManual({ id: ed.id, tipo: 'EGRESO', categoria: 'ALIMENTO', valor: 12.5, detalle: ' x ', fecha: F2 });
    assert.equal(r1, undefined);
    Object.assign(ed, { tipo: 'EGRESO', categoria: 'ALIMENTO', valor: 12.5, detalle: 'x', fecha: F2 });
    const m = await f().obtenerMovimientoPorId(ed.id);
    assert.deepEqual([m.tipo, m.categoria, m.valor, m.detalle, m.fecha, m.origen_tipo, m.origen_id, m.ave_id],
        ['EGRESO', 'ALIMENTO', 12.5, 'x', F2, 'MANUAL', null, null]);
    const despues = await f().obtenerResumenFinanciero('TODO');
    cerca(despues.ingresos, antes.ingresos - 10.5, 'ingresos tras editar');
    cerca(despues.egresos, antes.egresos + 12.5, 'egresos tras editar');

    let h = await f().obtenerHistorialMovimiento(ed.id);
    assert.equal(h.length, 1);
    assert.deepEqual(Object.keys(h[0]).sort(), CLAVES_HIST);
    const e = h[0];
    assert.deepEqual(
        [e.movimiento_id, e.accion, e.tipo_anterior, e.tipo_nuevo, e.categoria_anterior, e.categoria_nueva, e.fecha_movimiento_anterior, e.fecha_movimiento_nueva,
            e.valor_anterior, e.valor_nuevo, e.detalle_anterior, e.detalle_nuevo, e.origen_tipo, e.origen_id],
        [ed.id, 'EDICION_MANUAL', 'INGRESO', 'EGRESO', 'OTRO', 'ALIMENTO', '2001-06-01T00:00:00.000Z', F2, 10.5, 12.5, 'orig', 'x', 'MANUAL', null]);
    assert.ok(e.fecha);

    // (b) sin cambios: se escribe otra fila igualmente
    await f().actualizarMovimientoManual({ id: ed.id, tipo: 'EGRESO', categoria: 'ALIMENTO', valor: 12.5, detalle: 'x', fecha: F2 });
    h = await f().obtenerHistorialMovimiento(ed.id);
    assert.equal(h.length, 2);
    assert.deepEqual([h[0].valor_anterior, h[0].valor_nuevo, h[0].accion], [12.5, 12.5, 'EDICION_MANUAL'], 'la ultima primero');
    assert.deepEqual([h[1].valor_anterior, h[1].valor_nuevo], [10.5, 12.5]);

    // (c) tipo ausente, categoria '', detalle '', fecha ausente: INGRESO / OTRO / null / fecha anterior
    await f().actualizarMovimientoManual({ id: ed.id, categoria: '', valor: 7.5, detalle: '' });
    Object.assign(ed, { tipo: 'INGRESO', categoria: 'OTRO', valor: 7.5, detalle: null });
    const m2 = await f().obtenerMovimientoPorId(ed.id);
    assert.deepEqual([m2.tipo, m2.categoria, m2.valor, m2.detalle, m2.fecha], ['INGRESO', 'OTRO', 7.5, null, F2]);
    h = await f().obtenerHistorialMovimiento(ed.id);
    assert.equal(h.length, 3);
    for (let i = 1; i < h.length; i++) assert.ok(h[i - 1].fecha >= h[i].fecha, 'historial por fecha descendente');
    assert.deepEqual([h[0].tipo_anterior, h[0].tipo_nuevo, h[0].categoria_anterior, h[0].categoria_nueva, h[0].valor_anterior, h[0].valor_nuevo, h[0].detalle_anterior, h[0].detalle_nuevo, h[0].fecha_movimiento_anterior, h[0].fecha_movimiento_nueva],
        ['EGRESO', 'INGRESO', 'ALIMENTO', 'OTRO', 12.5, 7.5, 'x', null, F2, F2]);
    fin.ed = ed;
});

prueba(G, 'debe rechazar la edicion de un inexistente o con valor invalido sin escribir historial ni cambiar el movimiento', async () => {
    await entrarFin();
    const id = fin.ed.id;
    const antes = await f().obtenerMovimientoPorId(id);
    const nHist = (await f().obtenerHistorialMovimiento(id)).length;
    const completo = { tipo: 'INGRESO', categoria: 'OTRO', detalle: 'z', fecha: '2001-06-03T00:00:00.000Z' };

    await assert.rejects(f().actualizarMovimientoManual({ id: FALSO, valor: 5, ...completo }), e => e instanceof Error && e.message === 'MOVIMIENTO_NO_ENCONTRADO');
    // el inexistente gana al valor invalido
    await assert.rejects(f().actualizarMovimientoManual({ id: FALSO, valor: 0, ...completo }), e => e.message === 'MOVIMIENTO_NO_ENCONTRADO');
    for (const valor of [0, 'abc', null, -1]) {
        await assert.rejects(f().actualizarMovimientoManual({ id, valor, ...completo }), e => e instanceof Error && e.message === 'VALOR_INVALIDO', `valor ${valor}`);
    }
    assert.deepEqual(await f().obtenerMovimientoPorId(id), antes, 'movimiento intacto');
    assert.equal((await f().obtenerHistorialMovimiento(id)).length, nHist, 'sin historial nuevo');
    assert.deepEqual(await f().obtenerHistorialMovimiento(FALSO), [], 'historial de un inexistente = []');
});

prueba(G, 'debe corregir una venta hecha desde Bajas: cambia bajas_ave, ambos movimientos, el historial y el resumen en la diferencia exacta', async () => {
    const { aves, bajas } = ctx.clientes;
    await entrarFin();
    const aveId = await aves.crearAve({ codigo: 'FIN-VENTA', origen: 'COMPRADA', fechaIngreso: '2026-01-10', edadMesesCompra: 6 });
    fin.aveVenta = aveId;
    await bajas.registrarVentaAve({
        aveId, fechaVenta: '2001-09-15T12:00:00.000Z', celular: '0991234567', ciudadDestino: 'Quito', cooperativaEnvio: '',
        comprador: 'Juan', valorVenta: 12.5, valorEnvio: null, detalle: ''
    });
    const baja = await aves.obtenerBajaAve(aveId);
    fin.bajaId = baja.id;

    // obtenerVentaPorBajaId: claves de V1
    const v0 = await f().obtenerVentaPorBajaId(baja.id);
    assert.deepEqual(Object.keys(v0).sort(), ['ave_codigo', 'ave_id', 'celular', 'ciudad_destino', 'comprador', 'cooperativa_envio', 'detalle', 'fecha', 'id', 'valor_envio', 'valor_venta']);
    assert.deepEqual([v0.id, v0.ave_id, v0.ave_codigo, v0.comprador, v0.valor_venta, v0.valor_envio], [baja.id, aveId, 'FIN-VENTA', 'Juan', 12.5, null]);

    // Los dos movimientos nacen de Bajas; ENVIO_AVE (insertado despues) va antes que VENTA_AVE (FIN-46)
    let lista = await f().obtenerMovimientosFinancieros();
    const delAve = lista.filter(m => m.ave_id === aveId);
    assert.equal(delAve.length, 2);
    assert.equal(delAve[0].categoria, 'ENVIO_AVE');
    assert.equal(delAve[1].categoria, 'VENTA_AVE');
    assert.ok(delAve.every(m => m.ave_codigo === 'FIN-VENTA' && m.origen_tipo === 'VENTA_AVE' && m.origen_id === baja.id));
    const movVenta = delAve.find(m => m.categoria === 'VENTA_AVE');
    const movEnvio = delAve.find(m => m.categoria === 'ENVIO_AVE');
    assert.deepEqual([movVenta.valor, movEnvio.valor], [12.5, 0]);

    // El movimiento automatico no es editable
    const histAntesAuto = (await f().obtenerHistorialMovimiento(movVenta.id)).length;
    for (const m of [movVenta, movEnvio]) {
        await assert.rejects(
            f().actualizarMovimientoManual({ id: m.id, tipo: 'INGRESO', categoria: m.categoria, valor: 99, detalle: 'x', fecha: m.fecha }),
            e => e instanceof Error && e.message === 'MOVIMIENTO_AUTOMATICO_NO_EDITABLE'
        );
    }
    assert.equal((await f().obtenerMovimientoPorId(movVenta.id)).valor, 12.5);
    assert.equal((await f().obtenerHistorialMovimiento(movVenta.id)).length, histAntesAuto);

    // NaN: el cliente lo rechaza antes de enviar y no se escribe nada
    const antes = await f().obtenerResumenFinanciero('TODO');
    for (const args of [{ valorVenta: NaN, valorEnvio: 1 }, { valorVenta: 1, valorEnvio: NaN }]) {
        await assert.rejects(f().corregirVentaFinanciera({ bajaId: baja.id, ...args }), e => e instanceof Error && e.message === 'VALOR_INVALIDO');
    }
    assert.deepEqual(await f().obtenerVentaPorBajaId(baja.id), v0, 'la venta no cambio con NaN');
    assert.deepEqual(await f().obtenerResumenFinanciero('TODO'), antes);
    assert.deepEqual(await f().obtenerHistorialMovimiento(movVenta.id), []);

    // Correccion 1
    const r = await f().corregirVentaFinanciera({ bajaId: baja.id, valorVenta: 20.25, valorEnvio: 3.1 });
    assert.equal(r, undefined);
    const v1 = await f().obtenerVentaPorBajaId(baja.id);
    assert.deepEqual([v1.valor_venta, v1.valor_envio, v1.comprador, v1.ave_id], [20.25, 3.1, 'Juan', aveId]);
    const bajaDespues = await aves.obtenerBajaAve(aveId);
    assert.deepEqual([bajaDespues.valor_venta, bajaDespues.valor_envio], [20.25, 3.1]);
    assert.equal((await aves.obtenerAvePorId(aveId)).estado, 'VENDIDA', 'el ave no se toca');

    const mv = await f().obtenerMovimientoPorId(movVenta.id);
    const me = await f().obtenerMovimientoPorId(movEnvio.id);
    assert.deepEqual([mv.tipo, mv.categoria, mv.valor, mv.detalle, mv.fecha, mv.origen_tipo, mv.origen_id, mv.ave_id],
        ['INGRESO', 'VENTA_AVE', 20.25, `Venta de ave ${aveId}`, v1.fecha, 'VENTA_AVE', baja.id, aveId]);
    assert.deepEqual([me.tipo, me.categoria, me.valor, me.detalle, me.fecha, me.origen_tipo, me.origen_id, me.ave_id],
        ['INGRESO', 'ENVIO_AVE', 3.1, `Envío asociado a venta de ave ${aveId}`, v1.fecha, 'VENTA_AVE', baja.id, aveId]);

    // Historial: CORRECCION_VENTA y CORRECCION_ENVIO (una fila cada uno, por movimiento).
    // NOTA: CREACION_POR_CORRECCION solo se da si falta el movimiento de envio; Bajas siempre lo crea (con 0),
    // asi que por la API publica ese caso no es alcanzable aqui. Se comprueba CORRECCION_ENVIO 0 -> 3.1.
    const hv = await f().obtenerHistorialMovimiento(movVenta.id);
    const he = await f().obtenerHistorialMovimiento(movEnvio.id);
    assert.equal(hv.length, 1);
    assert.equal(he.length, 1);
    assert.deepEqual(Object.keys(hv[0]).sort(), CLAVES_HIST);
    assert.deepEqual([hv[0].accion, hv[0].movimiento_id, hv[0].valor_anterior, hv[0].valor_nuevo, hv[0].categoria_anterior, hv[0].categoria_nueva, hv[0].tipo_nuevo, hv[0].origen_tipo, hv[0].origen_id, hv[0].detalle_nuevo],
        ['CORRECCION_VENTA', movVenta.id, 12.5, 20.25, 'VENTA_AVE', 'VENTA_AVE', 'INGRESO', 'VENTA_AVE', baja.id, `Venta de ave ${aveId}`]);
    assert.deepEqual([he[0].accion, he[0].movimiento_id, he[0].valor_anterior, he[0].valor_nuevo, he[0].categoria_nueva, he[0].detalle_nuevo, he[0].origen_id],
        ['CORRECCION_ENVIO', movEnvio.id, 0, 3.1, 'ENVIO_AVE', `Envío asociado a venta de ave ${aveId}`, baja.id]);

    // Resumen: ingresos cambian exactamente en (20.25 + 3.1) - (12.5 + 0); egresos igual
    const despues = await f().obtenerResumenFinanciero('TODO');
    cerca(despues.ingresos - antes.ingresos, (20.25 + 3.1) - (12.5 + 0), 'diferencia de ingresos');
    assert.equal(despues.egresos, antes.egresos);
    assert.equal(despues.utilidad, despues.ingresos - despues.egresos);

    // Correccion 2: texto con coma y vacio (FIN-23)
    await f().corregirVentaFinanciera({ bajaId: baja.id, valorVenta: '120,50', valorEnvio: '' });
    const v2 = await f().obtenerVentaPorBajaId(baja.id);
    assert.deepEqual([v2.valor_venta, v2.valor_envio], [120.5, 0]);
    assert.equal((await f().obtenerMovimientoPorId(movVenta.id)).valor, 120.5);
    assert.equal((await f().obtenerMovimientoPorId(movEnvio.id)).valor, 0);
    // Correccion 3: null y ausente = 0 sin error (FIN-30)
    await f().corregirVentaFinanciera({ bajaId: baja.id, valorVenta: null });
    const v3 = await f().obtenerVentaPorBajaId(baja.id);
    assert.deepEqual([v3.valor_venta, v3.valor_envio], [0, 0]);
    assert.equal((await f().obtenerHistorialMovimiento(movVenta.id)).length, 3);
    assert.equal((await f().obtenerHistorialMovimiento(movEnvio.id)).length, 3);
    // Correccion 4: valores 0.1 y 19.99 se guardan identicos (FIN-26)
    await f().corregirVentaFinanciera({ bajaId: baja.id, valorVenta: 0.1, valorEnvio: 19.99 });
    const v4 = await f().obtenerVentaPorBajaId(baja.id);
    assert.deepEqual([v4.valor_venta, v4.valor_envio], [0.1, 19.99]);
    assert.equal((await f().obtenerMovimientoPorId(movVenta.id)).valor, 0.1);
    assert.equal((await f().obtenerMovimientoPorId(movEnvio.id)).valor, 19.99);

    fin.movVenta = movVenta.id;
    fin.movEnvio = movEnvio.id;
});

prueba(G, 'debe rechazar correcciones invalidas (400 VALOR_INVALIDO) o de una baja inexistente o de muerte sin escribir nada', async () => {
    const { aves, bajas } = ctx.clientes;
    await entrarFin();
    const vAntes = await f().obtenerVentaPorBajaId(fin.bajaId);
    const hAntes = await f().obtenerHistorialMovimiento(fin.movVenta);
    const rutaCorr = id => `${base()}/ventas/${id}/correccion`;

    for (const body of [{ valorVenta: -1, valorEnvio: 0 }, { valorVenta: 'abc', valorEnvio: 0 }, { valorVenta: 1, valorEnvio: -2 }, { valorVenta: 1, valorEnvio: 'x' }]) {
        const r = await http('POST', rutaCorr(fin.bajaId), { token: ctx.A.token, body });
        assert.equal(r.status, 400, JSON.stringify(body));
        assert.equal(r.error, 'VALOR_INVALIDO', JSON.stringify(body));
    }
    // importe invalido gana a la baja inexistente
    const gana = await http('POST', rutaCorr(FALSO), { token: ctx.A.token, body: { valorVenta: -1, valorEnvio: 0 } });
    assert.deepEqual([gana.status, gana.error], [400, 'VALOR_INVALIDO']);
    // baja inexistente con importes validos
    const nf = await http('POST', rutaCorr(FALSO), { token: ctx.A.token, body: { valorVenta: 1, valorEnvio: 0 } });
    assert.deepEqual([nf.status, nf.error], [404, 'VENTA_NO_ENCONTRADA']);
    await assert.rejects(f().corregirVentaFinanciera({ bajaId: FALSO, valorVenta: 1, valorEnvio: 0 }), e => e instanceof Error && e.message === 'VENTA_NO_ENCONTRADA');
    await assert.rejects(f().corregirVentaFinanciera({ bajaId: FALSO, valorVenta: -1, valorEnvio: 0 }), e => e instanceof Error && e.message === 'VALOR_INVALIDO');

    // baja de tipo MUERTE: no es venta
    const aveM = await aves.crearAve({ codigo: 'FIN-MUERTE', origen: 'COMPRADA', fechaIngreso: '2026-01-10', edadMesesCompra: 6 });
    await bajas.registrarMuerteAve({ aveId: aveM, causa: 'Enfermedad', detalle: '' });
    const bm = await aves.obtenerBajaAve(aveM);
    assert.equal(bm.tipo, 'MUERTE');
    assert.equal(await f().obtenerVentaPorBajaId(bm.id), null);
    assert.equal(await f().obtenerVentaPorBajaId(FALSO), null);
    await assert.rejects(f().corregirVentaFinanciera({ bajaId: bm.id, valorVenta: 1, valorEnvio: 0 }), e => e.message === 'VENTA_NO_ENCONTRADA');

    assert.deepEqual(await f().obtenerVentaPorBajaId(fin.bajaId), vAntes, 'la venta no cambio');
    assert.deepEqual(await f().obtenerHistorialMovimiento(fin.movVenta), hAntes, 'historial intacto');
});

prueba(G, 'debe responder 400 a un ingreso con valor null por HTTP y no crear el movimiento', async () => {
    await entrarFin();
    const n = (await f().obtenerMovimientosFinancieros()).length;
    for (const ruta of ['ingresos', 'egresos']) {
        const r = await http('POST', `${base()}/${ruta}`, { token: ctx.A.token, body: { categoria: 'OTRO', valor: null, detalle: '', fecha: '2001-01-01T00:00:00.000Z' } });
        assert.equal(r.status, 400, ruta);
    }
    assert.equal((await f().obtenerMovimientosFinancieros()).length, n);
});

prueba(G, 'debe aislar finanzas entre cuentas: B no ve ni toca nada de A y recibe 403 en todas las rutas del criadero de A', async () => {
    await entrarFin();
    const snapA = {
        resumen: await f().obtenerResumenFinanciero('TODO'),
        lista: await f().obtenerMovimientosFinancieros(),
        venta: await f().obtenerVentaPorBajaId(fin.bajaId),
        hist: await f().obtenerHistorialMovimiento(fin.movVenta),
        edit: await f().obtenerMovimientoPorId(fin.ed.id)
    };
    const idsA = new Set(snapA.lista.map(m => m.id));
    const ruta = base();
    const rutas = [
        ['GET', '/resumen'], ['GET', '/movimientos'], ['GET', `/movimientos/${fin.ed.id}`], ['GET', `/movimientos/${fin.ed.id}/historial`],
        ['GET', `/ventas/${fin.bajaId}`], ['GET', '/consolidado/categorias'], ['GET', '/consolidado/mensual'],
        ['POST', '/ingresos', { categoria: 'OTRO', valor: 1, detalle: 'HACK', fecha: '2001-01-01T00:00:00.000Z' }],
        ['POST', '/egresos', { categoria: 'OTRO', valor: 1, detalle: 'HACK', fecha: '2001-01-01T00:00:00.000Z' }],
        ['PUT', `/movimientos/${fin.ed.id}`, { tipo: 'EGRESO', categoria: 'OTRO', valor: 1, detalle: 'HACK', fecha: '2001-01-01T00:00:00.000Z' }],
        ['POST', `/ventas/${fin.bajaId}/correccion`, { valorVenta: 999, valorEnvio: 999 }]
    ];
    for (const [metodo, fin_, body] of rutas) {
        const r = await http(metodo, `${ruta}${fin_}`, { token: ctx.B.token, body });
        ctx.tabla.push({ grupo: G, endpoint: `${metodo} finanzas${fin_.replace(/[0-9a-f-]{36}/g, ':id')}`, esperado: 403, obtenido: r.status, fuga: r.status !== 403, ok: r.status === 403 && r.error === 'FORBIDDEN' });
        assert.equal(r.status, 403, `${metodo} ${fin_}`);
        assert.equal(r.error, 'FORBIDDEN', `${metodo} ${fin_}`);
    }

    // B dentro de su criadero con ids de A
    await entrarComo(ctx.B);
    assert.equal(await f().obtenerMovimientoPorId(fin.ed.id), null);
    assert.equal(await f().obtenerMovimientoPorId(fin.movVenta), null);
    assert.equal(await f().obtenerVentaPorBajaId(fin.bajaId), null);
    assert.deepEqual(await f().obtenerHistorialMovimiento(fin.movVenta), []);
    await assert.rejects(f().actualizarMovimientoManual({ id: fin.ed.id, tipo: 'EGRESO', categoria: 'OTRO', valor: 1, detalle: 'HACK', fecha: '2001-01-01T00:00:00.000Z' }), e => e.message === 'MOVIMIENTO_NO_ENCONTRADO');
    await assert.rejects(f().actualizarMovimientoManual({ id: fin.movVenta, tipo: 'EGRESO', categoria: 'OTRO', valor: 1, detalle: 'HACK', fecha: '2001-01-01T00:00:00.000Z' }), e => e.message === 'MOVIMIENTO_NO_ENCONTRADO');
    await assert.rejects(f().corregirVentaFinanciera({ bajaId: fin.bajaId, valorVenta: 999, valorEnvio: 999 }), e => e.message === 'VENTA_NO_ENCONTRADA');
    const listaB = await f().obtenerMovimientosFinancieros();
    assert.ok(!listaB.some(m => idsA.has(m.id)), 'B no ve movimientos de A');
    const resB = await f().obtenerResumenFinanciero('TODO');
    assert.notEqual(resB.ingresos, snapA.resumen.ingresos);
    assert.ok(!(await f().obtenerConsolidadoMensual(100)).some(r => r.periodo === '2002-06'), 'B no ve los meses de A');

    // A sigue igual
    await entrarFin();
    assert.deepEqual(await f().obtenerResumenFinanciero('TODO'), snapA.resumen);
    assert.deepEqual(await f().obtenerMovimientosFinancieros(), snapA.lista);
    assert.deepEqual(await f().obtenerVentaPorBajaId(fin.bajaId), snapA.venta);
    assert.deepEqual(await f().obtenerHistorialMovimiento(fin.movVenta), snapA.hist);
    assert.deepEqual(await f().obtenerMovimientoPorId(fin.ed.id), snapA.edit);
});
