// REPORTES con el cliente REST real (solo lectura, calculados en el servidor): 4 resumenes y 6 exportaciones.
// Se trabaja en un criadero NUEVO de la cuenta A (arranca vacio). Los datos se cargan por la API (jaulas, aves,
// huevos, diagnosticos, ventas, muerte y movimientos manuales) con fechas fijas de 2001, salvo los huevos de "hoy"
// y del mes en curso, que son relativos al reloj (el esperado se calcula en JS con las mismas cadenas de fecha).
// El esperado se calcula en JS con el algoritmo de V1 (ReportesRepository.sqlite.js). Todo el borrado lo hace la
// limpieza de cuentas desechables. Si la prueba cruza la medianoche UTC se aborta con un mensaje claro: repetir.
import { prueba, assert } from '../lib/arnes.mjs';
import { ctx, entrarComo } from '../lib/contexto.mjs';
import { http, crearCriaderoHttp } from '../lib/http.mjs';

const G = 'reportes';
const FALSO = '00000000-0000-7000-8000-000000000000';
const rep = {};              // criaderoId, ids, espejo de los datos
const r_ = () => ctx.clientes.reportes;
const base = () => `/api/v1/criaderos/${rep.criaderoId}/reportes`;

async function entrarRep() {
    await entrarComo(ctx.A);
    await ctx.clientes.acceso.seleccionarCriadero(rep.criaderoId);
}

const COL = {
    aves: ['Codigo', 'Raza', 'Sexo', 'Estado', 'EstadoSalud', 'FechaNacimiento', 'PesoGramos', 'AlturaCm', 'LargoCm', 'Padre', 'Madre', 'Jaula', 'Origen', 'Caracteristicas'],
    ventas: ['Ave', 'Fecha', 'Celular', 'Nombre', 'CiudadDestino', 'Cooperativa', 'ValorAve', 'ValorEnvio', 'Detalle'],
    clientes: ['Celular', 'Nombre', 'Ciudad', 'Compras', 'TotalAves', 'TotalEnvios', 'UltimaCompra'],
    finanzas: ['Fecha', 'Tipo', 'Categoria', 'Valor', 'Detalle', 'Ave', 'Origen', 'OrigenId'],
    huevos: ['Codigo', 'Fecha', 'Ave', 'Jaula', 'Estado', 'Observacion'],
    jaulas: ['Codigo', 'Nombre', 'Ubicacion', 'Tipo', 'EstadoSanitario', 'Estado', 'FechaCreacion', 'FechaDesactivacion']
};
const FUNCION = {
    aves: 'obtenerExportacionAves', ventas: 'obtenerExportacionVentas', clientes: 'obtenerExportacionClientes',
    finanzas: 'obtenerExportacionFinanzas', huevos: 'obtenerExportacionHuevos', jaulas: 'obtenerExportacionJaulas'
};
const RESUMENES = ['obtenerReporteAves', 'obtenerReporteSalud', 'obtenerReporteProduccion', 'obtenerReporteFinanzas'];
const RUTAS = ['aves', 'salud', 'produccion', 'finanzas', 'exportaciones/aves', 'exportaciones/ventas', 'exportaciones/clientes',
    'exportaciones/finanzas', 'exportaciones/huevos', 'exportaciones/jaulas'];

function cerca(real, esperado, msg) {
    assert.ok(Math.abs(real - esperado) <= 1e-9 * Math.max(1, Math.abs(real), Math.abs(esperado)), `${msg ?? ''} real=${real} esperado=${esperado}`);
}
const vacio = t => String(t ?? '').trim() === '';
const nulo = t => (vacio(t) ? null : t);
const sumaNoNula = vs => vs.filter(x => x !== null && x !== undefined).reduce((s, x) => s + x, 0);
const hoyUtc = () => new Date().toISOString().slice(0, 10);

// Compara una fila con el esperado: claves exactas y en orden, y cada valor con tipo estricto.
// Detalle puede ser una RegExp y los numeros marcados en `aprox` se comparan con tolerancia.
function comparaFila(real, esp, columnas, msg, aprox = []) {
    assert.deepEqual(Object.keys(real), columnas, `${msg}: claves y orden`);
    for (const k of columnas) {
        if (esp[k] instanceof RegExp) { assert.equal(typeof real[k], 'string', `${msg}: ${k}`); assert.match(real[k], esp[k], `${msg}: ${k}`); }
        else if (aprox.includes(k) && esp[k] === null) assert.equal(real[k], null, `${msg}: ${k} null`);
        else if (aprox.includes(k)) { assert.equal(typeof real[k], 'number', `${msg}: tipo de ${k}`); cerca(real[k], esp[k], `${msg} ${k}`); }
        else assert.equal(real[k], esp[k], `${msg}: ${k}`);
    }
}

// ---------- Datos ----------
const J = { J1: { codigo: 'R-J1', nombre: 'Uno', ubicacion: 'Patio', tipo: 'General' }, J2: { codigo: 'R-J2', nombre: 'Dos', ubicacion: 'Fondo', tipo: 'Cuarentena' } };
const CARAC = 'Cresta; "roja"\nlinea 2';
const AVES = [   // en orden de creacion (rowid)
    { k: 'PAD', codigo: 'R-PAD', origen: 'COMPRADA', fechaIngreso: '2026-01-10', edadMesesCompra: 12, raza: 'Criolla', sexo: 'MACHO', pesoGramos: 2500.5, alturaCm: 0, largoCm: 45.25, caracteristicas: CARAC, jaula: 'J1' },
    { k: 'MAD', codigo: 'R-MAD', origen: 'NACIDA_CRIADERO', fechaNacimiento: '2001-01-01', raza: 'Criolla', sexo: 'HEMBRA', pesoGramos: 0, jaula: 'J1' },
    { k: 'HIJ', codigo: 'R-HIJ', origen: 'NACIDA_CRIADERO', fechaNacimiento: '2001-06-01', raza: 'Plymouth', sexo: 'HEMBRA', pesoGramos: 1800, padre: 'PAD', madre: 'MAD' },
    { k: 'VEN1', codigo: 'R-VEN1', origen: 'COMPRADA', fechaIngreso: '2026-01-10', edadMesesCompra: 6, raza: 'Rhode', sexo: 'MACHO' },
    { k: 'VEN2', codigo: 'R-VEN2', origen: 'COMPRADA', fechaIngreso: '2026-01-10', edadMesesCompra: 6, raza: 'Rhode', sexo: 'HEMBRA' },
    { k: 'VEN3', codigo: 'R-VEN3', origen: 'COMPRADA', fechaIngreso: '2026-01-10', edadMesesCompra: 6 },
    { k: 'FAL', codigo: 'R-FAL', origen: 'COMPRADA', fechaIngreso: '2026-01-10', edadMesesCompra: 6, raza: 'Rhode', sexo: 'MACHO' }
];
const ESTADO_FINAL = { PAD: 'ACTIVA', MAD: 'ACTIVA', HIJ: 'ACTIVA', VEN1: 'VENDIDA', VEN2: 'VENDIDA', VEN3: 'VENDIDA', FAL: 'FALLECIDA' };

// Diagnosticos [ave, enfermedad, medicamento]: Coriza 3, Bronquitis 2, Newcastle 2, Viruela 2 y tres de 1 (empate en el puesto 5)
const DIAGNOSTICOS = [
    ['MAD', 'Coriza', 'Oxitetraciclina'], ['MAD', 'Bronquitis', null], ['MAD', 'Viruela', null],
    ['HIJ', 'Coriza', 'Oxitetraciclina'], ['HIJ', 'Newcastle', null], ['HIJ', 'Viruela', null],
    ['VEN1', 'Coriza', null], ['VEN1', 'Bronquitis', null], ['VEN1', 'Parasitos', null],
    ['FAL', 'Newcastle', null], ['FAL', 'Aspergilosis', null], ['FAL', 'Zeta', null]
];

const VENTAS = [  // celular de entrada, celular normalizado
    { k: 'VEN1', entrada: '+593 99 123 4567', norm: '0991234567', fecha: '2001-03-10T12:00:00.000Z', comprador: 'Juan', ciudad: 'Quito', coop: 'Servientrega', vv: 12.5, ve: 3.25, detalle: 'Primera; "caja"' },
    { k: 'VEN2', entrada: '0991234567', norm: '0991234567', fecha: '2001-03-10T12:00:00.000Z', comprador: '  Zoe  ', ciudad: 'Cuenca', coop: '', vv: 0.1, ve: null, detalle: '' },
    { k: 'VEN3', entrada: '0911111111', norm: '0911111111', fecha: '2001-01-05T09:00:00.000Z', comprador: '', ciudad: '', coop: '', vv: null, ve: null, detalle: '' }
];

const MANUALES = [  // movimientos manuales, en orden de insercion
    { tipo: 'INGRESO', categoria: 'VENTA_HUEVOS', valor: 12.5, detalle: 'huevos', fecha: '2001-03-10T08:00:00.000Z' },
    { tipo: 'INGRESO', categoria: 'OTRO', valor: 3.25, detalle: 'otro', fecha: '2001-03-10T08:00:00.000Z' },
    { tipo: 'INGRESO', categoria: '', valor: 0.1, detalle: '', fecha: '2001-05-01T00:00:00.000Z' },
    { tipo: 'INGRESO', categoria: 'OTRO', valor: 0.2, detalle: 'segundo', fecha: '2001-05-01T00:00:01.000Z' },
    { tipo: 'EGRESO', categoria: 'INFRAESTRUCTURA', valor: 1234567.89, detalle: 'galpon', fecha: '2001-03-15T10:00:00.000Z' },
    { tipo: 'EGRESO', categoria: 'ALIMENTO', valor: 0, detalle: 'cero', fecha: '2001-04-01T00:00:00.000Z' },
    { tipo: 'EGRESO', categoria: 'ALIMENTO', valor: 19.99, detalle: 'maiz', fecha: '2001-04-02T00:00:00.000Z' },
    { tipo: 'EGRESO', categoria: 'OTRO', valor: 40.25, detalle: 'nota; con "comillas"', fecha: '2001-07-01T00:00:00.000Z' }
];

// ---------- Esperados (algoritmo de V1) ----------
function resumenAves() {
    const c = e => AVES.filter(a => ESTADO_FINAL[a.k] === e).length;
    return { activas: c('ACTIVA'), vendidas: c('VENDIDA'), fallecidas: c('FALLECIDA') };
}
function enfermedadesEsperadas() {
    const m = new Map();
    for (const [, e] of DIAGNOSTICOS) m.set(e, (m.get(e) ?? 0) + 1);
    return [...m.entries()].map(([enfermedad, cantidad]) => ({ enfermedad, cantidad }))
        .sort((a, b) => b.cantidad - a.cantidad || (a.enfermedad < b.enfermedad ? 1 : -1)).slice(0, 5); // empates: enfermedad DESC, como V1 (confirmado por la paridad con el codigo real)
}
function mejorEsperado() {
    let mejor = null;
    for (const a of AVES) {   // orden de creacion: el empate lo gana la creada antes
        const cantidad = rep.huevos.filter(h => h.k === a.k).length;
        if (cantidad > 0 && (!mejor || cantidad > mejor.cantidad)) mejor = { codigo: a.codigo, cantidad };
    }
    return mejor;
}
function movimientosEsperados() {   // _idx = orden de insercion; _venta = filas que escribe una venta
    const filas = [];
    let idx = 0;
    for (const m of MANUALES) {
        filas.push({ Fecha: m.fecha, Tipo: m.tipo, Categoria: m.categoria || 'OTRO', Valor: m.valor, Detalle: nulo(m.detalle), Ave: null, Origen: 'MANUAL', OrigenId: null, _idx: idx++ });
    }
    for (const v of VENTAS) {
        const id = rep.ids[v.k], bajaId = rep.bajas[v.k];
        filas.push({ Fecha: v.fecha, Tipo: 'INGRESO', Categoria: 'VENTA_AVE', Valor: v.vv ?? 0, Detalle: new RegExp(`^Venta de ave ${id}`), Ave: AVES.find(a => a.k === v.k).codigo, Origen: 'VENTA_AVE', OrigenId: bajaId, _idx: idx++, _venta: true });
        filas.push({ Fecha: v.fecha, Tipo: 'INGRESO', Categoria: 'ENVIO_AVE', Valor: v.ve ?? 0, Detalle: new RegExp(`^Env.o de venta de ave ${id}`), Ave: AVES.find(a => a.k === v.k).codigo, Origen: 'VENTA_AVE', OrigenId: bajaId, _idx: idx++, _venta: true });
    }
    return filas;
}
const claveFila = f => `${f.Tipo}|${f.Categoria}|${f.Ave}`;

// ---------- Casos ----------
prueba(G, 'debe crear un criadero vacio para reportes: los 4 resumenes en cero y las 6 exportaciones []', async () => {
    await entrarComo(ctx.A);
    rep.criaderoId = await crearCriaderoHttp(ctx.A.token, 'Reportes pruebas');
    await entrarRep();
    const r = r_();
    assert.deepEqual(await r.obtenerReporteAves(), { activas: 0, vendidas: 0, fallecidas: 0 });
    assert.deepEqual(await r.obtenerReporteSalud(), { estado: { tratamiento: 0, enfermas: 0 }, enfermedades: [] });
    assert.deepEqual(await r.obtenerReporteProduccion(), { huevos: { hoy: 0, mes: 0 }, mejor: null });
    assert.deepEqual(await r.obtenerReporteFinanzas(), { ingresos: 0, egresos: 0, utilidad: 0 });
    for (const k of Object.keys(FUNCION)) assert.deepEqual(await r[FUNCION[k]](), [], k);
    // HTTP crudo: 200 con filas []
    for (const k of Object.keys(FUNCION)) {
        const x = await http('GET', `${base()}/exportaciones/${k}`, { token: ctx.A.token });
        assert.equal(x.status, 200, k);
        assert.deepEqual(x.data, { filas: [] }, k);
    }
});

prueba(G, 'debe cargar por la API 2 jaulas (una desactivada), 7 aves, huevos, diagnosticos, 3 ventas, una muerte y movimientos', async () => {
    const { jaulas, aves, huevo, saludAve, bajas, finanzas } = ctx.clientes;
    await entrarRep();
    rep.dia0 = hoyUtc();
    rep.mes0 = rep.dia0.slice(0, 7);

    rep.jaulaIds = {};
    for (const [k, d] of Object.entries(J)) rep.jaulaIds[k] = await jaulas.crearJaula(d);

    rep.ids = {};
    for (const a of AVES) {
        const { k, jaula, padre, madre, ...datos } = a;
        rep.ids[k] = await aves.crearAve({
            ...datos, jaulaId: jaula ? rep.jaulaIds[jaula] : undefined,
            padreId: padre ? rep.ids[padre] : undefined, madreId: madre ? rep.ids[madre] : undefined
        });
    }

    // Huevos: hoy (relativos al reloj), mes anterior, inicio del mes en curso y fechas fijas de 2001
    const ahora = new Date();
    const hoyA = ahora.toISOString();
    const hoyB = new Date(ahora.getTime() - 1000).toISOString();
    const mesAnt = new Date(Date.UTC(ahora.getUTCFullYear(), ahora.getUTCMonth(), 0, 12)).toISOString();
    const inicioMes = `${rep.mes0}-01T00:00:00.000Z`;
    const OBS = 'Obs; "x"\ny';
    const huevos = [   // en orden de insercion
        { k: 'MAD', j: 'J1', fecha: hoyA, obs: OBS }, { k: 'MAD', j: 'J1', fecha: hoyB }, { k: 'MAD', j: null, fecha: mesAnt },
        { k: 'MAD', j: null, fecha: inicioMes }, { k: 'MAD', j: 'J1', fecha: '2001-03-02T08:00:00.000Z' }, { k: 'MAD', j: null, fecha: '2001-03-02T08:00:00.000Z' },
        { k: 'HIJ', j: 'J2', fecha: '2001-03-05T10:00:00.000Z' }, { k: 'HIJ', j: null, fecha: '2001-04-01T10:00:00.000Z' },
        { k: 'VEN1', j: null, fecha: '2001-03-03T11:00:00.000Z' }, { k: 'VEN1', j: null, fecha: '2001-03-04T11:00:00.000Z' },
        { k: 'VEN1', j: null, fecha: '2001-03-05T11:00:00.000Z' }, { k: 'VEN1', j: null, fecha: '2001-04-02T11:00:00.000Z' },
        { k: 'VEN1', j: null, fecha: '2001-04-03T11:00:00.000Z' }, { k: 'VEN1', j: null, fecha: '2001-04-04T11:00:00.000Z' }
    ];
    for (const h of huevos) {
        h.codigo = await huevo.registrarHuevo({ aveId: rep.ids[h.k], jaulaId: h.j ? rep.jaulaIds[h.j] : null, fecha: h.fecha, observacion: h.obs });
        assert.equal(typeof h.codigo, 'string');
    }
    rep.huevos = huevos;

    // Diagnosticos con fechas fijas (antes de las bajas)
    let n = 0;
    for (const [k, enfermedad, medicamento] of DIAGNOSTICOS) {
        n++;
        await saludAve.registrarDiagnostico({
            aveId: rep.ids[k], enfermedad, sintomas: '', observacion: '', medicamento,
            dosis: medicamento ? '1 ml' : null, fecha: `2001-02-${String(n).padStart(2, '0')}T10:00:00.000Z`
        });
    }

    // Desactivar la segunda jaula
    await jaulas.desactivarJaula(rep.jaulaIds.J2);

    // Ventas y muerte
    rep.bajas = {};
    for (const v of VENTAS) {
        await bajas.registrarVentaAve({
            aveId: rep.ids[v.k], fechaVenta: v.fecha, celular: v.entrada, ciudadDestino: v.ciudad, cooperativaEnvio: v.coop,
            comprador: v.comprador, valorVenta: v.vv, valorEnvio: v.ve, detalle: v.detalle
        });
        rep.bajas[v.k] = (await aves.obtenerBajaAve(rep.ids[v.k])).id;
    }
    await bajas.registrarMuerteAve({ aveId: rep.ids.FAL, causa: 'Enfermedad', detalle: '' });

    // Movimientos manuales
    for (const m of MANUALES) {
        const fn = m.tipo === 'INGRESO' ? finanzas.registrarIngreso : finanzas.registrarEgreso;
        await fn({ categoria: m.categoria, valor: m.valor, detalle: m.detalle, fecha: m.fecha });
    }

    // Estados reales de salud/estado que dejo la API (para el esperado de Salud y de la exportacion de aves)
    rep.estadoReal = {};
    for (const a of AVES) {
        const x = await aves.obtenerAvePorId(rep.ids[a.k]);
        rep.estadoReal[a.k] = { estado: x.estado, estado_salud: x.estado_salud, fecha_nacimiento: x.fecha_nacimiento ?? null };
        assert.equal(x.estado, ESTADO_FINAL[a.k], `estado de ${a.codigo}`);
    }
});

prueba(G, 'debe calcular los 4 resumenes igual que el algoritmo de V1 (REP-02 a REP-12)', async () => {
    await entrarRep();
    const r = r_();
    const aves = await r.obtenerReporteAves();
    const salud = await r.obtenerReporteSalud();
    const prod = await r.obtenerReporteProduccion();
    const fin = await r.obtenerReporteFinanzas();
    assert.equal(hoyUtc(), rep.dia0, 'se cruzo la medianoche UTC durante la prueba: repetir');

    // Aves
    assert.deepEqual(Object.keys(aves), ['activas', 'vendidas', 'fallecidas']);
    assert.deepEqual(aves, resumenAves());
    assert.deepEqual(aves, { activas: 3, vendidas: 3, fallecidas: 1 });

    // Salud: estado solo de las aves ACTIVAS; diagnosticos de todas las aves, top 5 con empates por nombre
    const activas = AVES.filter(a => rep.estadoReal[a.k].estado === 'ACTIVA');
    const esperadoEstado = {
        tratamiento: activas.filter(a => rep.estadoReal[a.k].estado_salud === 'EN_TRATAMIENTO').length,
        enfermas: activas.filter(a => rep.estadoReal[a.k].estado_salud === 'ENFERMA').length
    };
    assert.deepEqual(Object.keys(salud), ['estado', 'enfermedades']);
    assert.deepEqual(Object.keys(salud.estado), ['tratamiento', 'enfermas']);
    assert.deepEqual(salud.estado, esperadoEstado);
    assert.equal(salud.estado.tratamiento, 2, 'MAD y HIJ con diagnostico y medicamento');
    const enf = enfermedadesEsperadas();
    assert.deepEqual(enf.map(x => [x.enfermedad, x.cantidad]),
        [['Coriza', 3], ['Viruela', 2], ['Newcastle', 2], ['Bronquitis', 2], ['Zeta', 1]], 'esperado en JS (empates por enfermedad DESC)');
    assert.equal(salud.enfermedades.length, 5);
    salud.enfermedades.forEach((x, i) => {
        assert.deepEqual(Object.keys(x), ['enfermedad', 'cantidad'], `claves enfermedad ${i}`);
        assert.equal(typeof x.cantidad, 'number');
    });
    assert.deepEqual(salud.enfermedades, enf);

    // Produccion: hoy y mes por texto UTC; mejor con empate (MAD y VEN1 con 6) gana la creada antes
    const hoy = rep.dia0, mes = rep.mes0;
    const esperadoHuevos = {
        hoy: rep.huevos.filter(h => h.fecha.slice(0, 10) === hoy).length,
        mes: rep.huevos.filter(h => h.fecha.slice(0, 7) === mes).length
    };
    assert.deepEqual(Object.keys(prod), ['huevos', 'mejor']);
    assert.deepEqual(Object.keys(prod.huevos), ['hoy', 'mes']);
    assert.deepEqual(prod.huevos, esperadoHuevos);
    assert.ok(prod.huevos.hoy >= 1 && prod.huevos.mes >= prod.huevos.hoy);
    assert.deepEqual(Object.keys(prod.mejor), ['codigo', 'cantidad']);
    assert.deepEqual(prod.mejor, mejorEsperado());
    assert.deepEqual(prod.mejor, { codigo: 'R-MAD', cantidad: 6 });

    // Finanzas: suma ingenua en JS (tolerancia por la suma de SQLite)
    const filas = movimientosEsperados();
    const ingresos = filas.filter(f => f.Tipo === 'INGRESO').reduce((s, f) => s + f.Valor, 0);
    const egresos = filas.filter(f => f.Tipo === 'EGRESO').reduce((s, f) => s + f.Valor, 0);
    assert.deepEqual(Object.keys(fin), ['ingresos', 'egresos', 'utilidad']);
    for (const k of ['ingresos', 'egresos', 'utilidad']) assert.equal(typeof fin[k], 'number', k);
    cerca(fin.ingresos, ingresos, 'ingresos');
    cerca(fin.egresos, egresos, 'egresos');
    assert.equal(fin.utilidad, fin.ingresos - fin.egresos, 'utilidad = ingresos - egresos en JS');
});

prueba(G, 'debe exportar aves con 14 claves en orden, codigos de padre/madre/jaula, todos los estados y orden por Codigo (REP-13, REP-14)', async () => {
    await entrarRep();
    const filas = await r_().obtenerExportacionAves();
    const esp = AVES.map(a => {
        const real = rep.estadoReal[a.k];
        return {
            Codigo: a.codigo, Raza: a.raza ?? null, Sexo: a.sexo ?? null, Estado: ESTADO_FINAL[a.k], EstadoSalud: real.estado_salud,
            FechaNacimiento: a.fechaNacimiento ?? real.fecha_nacimiento, PesoGramos: a.pesoGramos ?? null, AlturaCm: a.alturaCm ?? null, LargoCm: a.largoCm ?? null,
            Padre: a.padre ? AVES.find(x => x.k === a.padre).codigo : null, Madre: a.madre ? AVES.find(x => x.k === a.madre).codigo : null,
            Jaula: a.jaula ? J[a.jaula].codigo : null, Origen: a.origen, Caracteristicas: a.caracteristicas ?? null
        };
    }).sort((a, b) => (a.Codigo < b.Codigo ? -1 : 1));
    assert.equal(filas.length, 7);
    assert.deepEqual(filas.map(f => f.Codigo), ['R-FAL', 'R-HIJ', 'R-MAD', 'R-PAD', 'R-VEN1', 'R-VEN2', 'R-VEN3']);
    filas.forEach((f, i) => comparaFila(f, esp[i], COL.aves, f.Codigo));
    const por = c => filas.find(f => f.Codigo === c);
    assert.deepEqual([por('R-HIJ').Padre, por('R-HIJ').Madre, por('R-PAD').Padre, por('R-PAD').Jaula], ['R-PAD', 'R-MAD', null, 'R-J1']);
    assert.deepEqual([por('R-MAD').PesoGramos, por('R-PAD').AlturaCm, por('R-PAD').LargoCm, por('R-VEN1').PesoGramos], [0, 0, 45.25, null], 'cero conservado y null real');
    assert.deepEqual([por('R-VEN1').Estado, por('R-FAL').Estado, por('R-PAD').Caracteristicas], ['VENDIDA', 'FALLECIDA', CARAC]);
    assert.equal(por('R-MAD').FechaNacimiento, '2001-01-01');
});

prueba(G, 'debe exportar ventas (solo VENTA), clientes con MAX recortado, finanzas, huevos y jaulas con claves exactas (REP-15 a REP-19)', async () => {
    await entrarRep();
    const r = r_();

    // Ventas: Fecha DESC, empate por orden de registro; sin la muerte
    const ventas = await r.obtenerExportacionVentas();
    assert.equal(ventas.length, 3);
    assert.ok(!ventas.some(f => f.Ave === 'R-FAL'), 'la muerte no sale en ventas');
    const espV = [...VENTAS.keys()].sort((a, b) => (VENTAS[a].fecha < VENTAS[b].fecha ? 1 : VENTAS[a].fecha > VENTAS[b].fecha ? -1 : a - b)).map(i => {
        const v = VENTAS[i];
        return { Ave: AVES.find(a => a.k === v.k).codigo, Fecha: v.fecha, Celular: v.norm, Nombre: nulo(v.comprador?.trim()), CiudadDestino: nulo(v.ciudad), Cooperativa: nulo(v.coop), ValorAve: v.vv ?? null, ValorEnvio: v.ve ?? null, Detalle: nulo(v.detalle) };
    });
    assert.deepEqual(espV.map(f => f.Ave), ['R-VEN1', 'R-VEN2', 'R-VEN3']);
    ventas.forEach((f, i) => {
        // el servidor puede conservar o recortar los espacios del comprador: se compara recortado
        assert.deepEqual(Object.keys(f), COL.ventas, `ventas ${i}: claves y orden`);
        const copia = { ...f, Nombre: f.Nombre === null ? null : f.Nombre.trim() };
        comparaFila(copia, espV[i], COL.ventas, `venta ${i}`, ['ValorAve']);
    });
    assert.deepEqual([ventas[2].Nombre, ventas[2].CiudadDestino, ventas[2].Cooperativa, ventas[2].ValorAve, ventas[2].ValorEnvio, ventas[2].Detalle], [null, null, null, null, null, null]);

    // Clientes: MAX(NULLIF(TRIM(...))) por texto, totales con COALESCE(SUM, 0), orden UltimaCompra DESC, celular ASC
    const clientes = await r.obtenerExportacionClientes();
    const grupos = new Map();
    for (const v of VENTAS) (grupos.get(v.norm) ?? grupos.set(v.norm, []).get(v.norm)).push(v);
    const maxTxt = vs => vs.filter(x => !vacio(x)).map(x => x.trim()).reduce((m, x) => (m === null || x > m ? x : m), null);
    const espC = [...grupos.entries()].map(([celular, vs]) => ({
        Celular: celular, Nombre: maxTxt(vs.map(v => v.comprador)), Ciudad: maxTxt(vs.map(v => v.ciudad)), Compras: vs.length,
        TotalAves: sumaNoNula(vs.map(v => v.vv)), TotalEnvios: sumaNoNula(vs.map(v => v.ve)), UltimaCompra: vs.reduce((m, v) => (v.fecha > m ? v.fecha : m), '')
    })).sort((a, b) => (a.UltimaCompra < b.UltimaCompra ? 1 : a.UltimaCompra > b.UltimaCompra ? -1 : a.Celular < b.Celular ? 1 : -1)); // empate de UltimaCompra: celular DESC, como V1
    assert.deepEqual(espC.map(f => f.Celular), ['0991234567', '0911111111']);
    assert.equal(clientes.length, 2);
    clientes.forEach((f, i) => comparaFila(f, espC[i], COL.clientes, `cliente ${i}`, ['TotalAves', 'TotalEnvios']));
    assert.deepEqual([clientes[0].Nombre, clientes[0].Ciudad, clientes[0].Compras, clientes[0].TotalEnvios], ['Zoe', 'Quito', 2, 3.25]);
    assert.deepEqual([clientes[1].Nombre, clientes[1].Ciudad, clientes[1].Compras, clientes[1].TotalAves, clientes[1].TotalEnvios], [null, null, 1, 0, 0]);

    // Finanzas: 8 filas por movimiento (8 manuales + 6 de ventas); Fecha DESC; empate = ultimo insertado primero
    const finanzas = await r.obtenerExportacionFinanzas();
    const esp = movimientosEsperados();
    assert.equal(finanzas.length, esp.length);
    assert.equal(esp.length, 14);
    const fechas = [...new Set(esp.map(f => f.Fecha))].sort().reverse();
    let pos = 0;
    for (const fecha of fechas) {
        const grupo = esp.filter(f => f.Fecha === fecha);
        const real = finanzas.slice(pos, pos + grupo.length);
        pos += grupo.length;
        if (grupo.some(f => f._venta)) {   // una venta escribe 2 filas con la misma fecha: se comparan sin orden
            const e = [...grupo].sort((a, b) => (claveFila(a) < claveFila(b) ? -1 : 1));
            const x = [...real].sort((a, b) => (claveFila(a) < claveFila(b) ? -1 : 1));
            x.forEach((f, i) => comparaFila(f, e[i], COL.finanzas, `${fecha} venta ${i}`));
        } else {
            [...grupo].sort((a, b) => b._idx - a._idx).forEach((e, i) => comparaFila(real[i], e, COL.finanzas, `${fecha} ${i}`));
        }
    }
    const vf = finanzas.filter(f => f.Origen === 'VENTA_AVE');
    assert.equal(vf.length, 6);
    assert.ok(vf.every(f => typeof f.OrigenId === 'string' && f.OrigenId.length > 0), 'OrigenId de la venta = texto no vacio');
    assert.ok(finanzas.filter(f => f.Origen === 'MANUAL').every(f => f.OrigenId === null && f.Ave === null));
    assert.deepEqual(finanzas.filter(f => f.Categoria === 'OTRO' && f.Valor === 0.1).map(f => f.Detalle), [null], "categoria '' -> OTRO y detalle '' -> null");
    assert.equal(finanzas.find(f => f.Valor === 0 && f.Origen === 'MANUAL').Valor, 0, 'cero conservado');

    // Huevos: Fecha DESC, empate = ultimo insertado primero; Jaula codigo o null; Estado REGISTRADO
    const huevos = await r.obtenerExportacionHuevos();
    const espH = rep.huevos.map((h, i) => ({
        Codigo: h.codigo, Fecha: h.fecha, Ave: AVES.find(a => a.k === h.k).codigo, Jaula: h.j ? J[h.j].codigo : null, Estado: 'REGISTRADO', Observacion: h.obs ?? null, _i: i
    })).sort((a, b) => (a.Fecha < b.Fecha ? 1 : a.Fecha > b.Fecha ? -1 : b._i - a._i));
    assert.equal(huevos.length, 14);
    huevos.forEach((f, i) => comparaFila(f, espH[i], COL.huevos, `huevo ${i}`));
    assert.deepEqual([huevos[0].Observacion, huevos.filter(f => f.Jaula === 'R-J2').length], ['Obs; "x"\ny', 1], 'observacion intacta y jaula inactiva resuelta');
    assert.ok(huevos.some(f => f.Jaula === null && f.Observacion === null));

    // Jaulas: incluye la inactiva; Estado calculado; orden Codigo
    const jaulas = await r.obtenerExportacionJaulas();
    assert.equal(jaulas.length, 2);
    jaulas.forEach((f, i) => {
        const d = Object.values(J)[i];
        assert.deepEqual(Object.keys(f), COL.jaulas, `jaula ${i}: claves y orden`);
        assert.deepEqual([f.Codigo, f.Nombre, f.Ubicacion, f.Tipo, f.Estado], [d.codigo, d.nombre, d.ubicacion, d.tipo, i === 0 ? 'ACTIVA' : 'INACTIVA']);
        assert.ok(f.EstadoSanitario === null || typeof f.EstadoSanitario === 'string');
        assert.equal(typeof f.FechaCreacion, 'string');
        assert.ok(f.FechaCreacion.length > 0);
    });
    assert.equal(jaulas[0].FechaDesactivacion, null);
    assert.equal(typeof jaulas[1].FechaDesactivacion, 'string');
    assert.ok(jaulas[1].FechaDesactivacion.length > 0);
});

prueba(G, 'debe devolver por HTTP crudo las claves esperadas: resumenes en una palabra y exportaciones en PascalCase dentro de filas', async () => {
    await entrarRep();
    const get = async ruta => {
        const x = await http('GET', `${base()}/${ruta}`, { token: ctx.A.token });
        assert.equal(x.status, 200, ruta);
        assert.equal(x.json.success, true, ruta);
        return x.data;
    };
    assert.deepEqual(Object.keys(await get('aves')), ['activas', 'vendidas', 'fallecidas']);
    const salud = await get('salud');
    assert.deepEqual(Object.keys(salud), ['estado', 'enfermedades']);
    assert.deepEqual(Object.keys(salud.estado), ['tratamiento', 'enfermas']);
    assert.deepEqual(Object.keys(salud.enfermedades[0]), ['enfermedad', 'cantidad']);
    const prod = await get('produccion');
    assert.deepEqual(Object.keys(prod), ['huevos', 'mejor']);
    assert.deepEqual(Object.keys(prod.huevos), ['hoy', 'mes']);
    assert.deepEqual(Object.keys(prod.mejor), ['codigo', 'cantidad']);
    assert.deepEqual(Object.keys(await get('finanzas')), ['ingresos', 'egresos', 'utilidad']);
    for (const k of Object.keys(COL)) {
        const d = await get(`exportaciones/${k}`);
        assert.deepEqual(Object.keys(d), ['filas'], k);
        assert.ok(d.filas.length > 0, k);
        for (const f of d.filas) assert.deepEqual(Object.keys(f), COL[k], `${k}: PascalCase y orden en el JSON crudo`);
    }
    // Los 10 endpoints son GET sin cuerpo: otro verbo no esta disponible
    const x = await http('POST', `${base()}/aves`, { token: ctx.A.token, body: {} });
    assert.ok(x.status === 404 || x.status === 405, `POST /reportes/aves: ${x.status}`);
});

prueba(G, 'debe responder 401 sin token y 403 FORBIDDEN con un criadero inexistente (la propiedad no distingue ajeno de inexistente)', async () => {
    for (const ruta of RUTAS) {
        const r = await http('GET', `${base()}/${ruta}`);
        assert.equal(r.status, 401, ruta);
        assert.equal(r.error, 'UNAUTHORIZED', ruta);
    }
    for (const ruta of RUTAS) {
        const r = await http('GET', `/api/v1/criaderos/${FALSO}/reportes/${ruta}`, { token: ctx.A.token });
        assert.equal(r.status, 403, ruta);
        assert.equal(r.error, 'FORBIDDEN', ruta);
    }
});

prueba(G, 'debe aislar reportes entre cuentas: B recibe 403 en las 10 rutas y desde su criadero nuevo ve ceros y [] aunque use codigos iguales (REP-22, REP-23)', async () => {
    const { acceso, jaulas, aves, huevo, finanzas } = ctx.clientes;
    await entrarRep();
    const r = r_();
    const foto = async () => ({
        res: [await r.obtenerReporteAves(), await r.obtenerReporteSalud(), await r.obtenerReporteProduccion(), await r.obtenerReporteFinanzas()],
        exp: await Promise.all(Object.keys(FUNCION).map(k => r[FUNCION[k]]()))
    });
    const snapA = await foto();
    assert.equal(snapA.res[0].activas, 3);

    for (const ruta of RUTAS) {
        const x = await http('GET', `${base()}/${ruta}`, { token: ctx.B.token });
        ctx.tabla.push({ grupo: G, endpoint: `GET reportes/${ruta}`, esperado: 403, obtenido: x.status, fuga: x.status !== 403, ok: x.status === 403 && x.error === 'FORBIDDEN' });
        assert.equal(x.status, 403, ruta);
        assert.equal(x.error, 'FORBIDDEN', ruta);
    }

    // B con un criadero nuevo (vacio): ceros y []
    await entrarComo(ctx.B);
    const critB = await crearCriaderoHttp(ctx.B.token, 'Reportes B');
    await acceso.seleccionarCriadero(critB);
    assert.deepEqual(await r.obtenerReporteAves(), { activas: 0, vendidas: 0, fallecidas: 0 });
    assert.deepEqual(await r.obtenerReporteSalud(), { estado: { tratamiento: 0, enfermas: 0 }, enfermedades: [] });
    assert.deepEqual(await r.obtenerReporteProduccion(), { huevos: { hoy: 0, mes: 0 }, mejor: null });
    assert.deepEqual(await r.obtenerReporteFinanzas(), { ingresos: 0, egresos: 0, utilidad: 0 });
    for (const k of Object.keys(FUNCION)) assert.deepEqual(await r[FUNCION[k]](), [], `B vacio ${k}`);

    // B usa los mismos codigos que A: nada se mezcla
    const jB = await jaulas.crearJaula(J.J1);
    const padreB = await aves.crearAve({ codigo: 'R-PAD', origen: 'COMPRADA', fechaIngreso: '2026-01-10', edadMesesCompra: 6, raza: 'Criolla', sexo: 'MACHO', jaulaId: jB });
    const hijoB = await aves.crearAve({ codigo: 'R-HIJ', origen: 'NACIDA_CRIADERO', fechaNacimiento: '2001-06-01', raza: 'Plymouth', sexo: 'HEMBRA', padreId: padreB });
    const codHuevo = await huevo.registrarHuevo({ aveId: hijoB, jaulaId: jB, fecha: '2001-03-05T10:00:00.000Z' });
    await finanzas.registrarIngreso({ categoria: 'OTRO', valor: 7.5, detalle: 'de B', fecha: '2001-03-05T10:00:00.000Z' });

    assert.deepEqual(await r.obtenerReporteAves(), { activas: 2, vendidas: 0, fallecidas: 0 });
    assert.deepEqual(await r.obtenerReporteProduccion(), { huevos: { hoy: 0, mes: 0 }, mejor: { codigo: 'R-HIJ', cantidad: 1 } });
    assert.deepEqual(await r.obtenerReporteFinanzas(), { ingresos: 7.5, egresos: 0, utilidad: 7.5 });
    assert.deepEqual((await r.obtenerReporteSalud()).enfermedades, []);
    const avesB = await r.obtenerExportacionAves();
    assert.deepEqual(avesB.map(f => [f.Codigo, f.Padre, f.Madre, f.Jaula]), [['R-HIJ', 'R-PAD', null, null], ['R-PAD', null, null, 'R-J1']]);
    const huevosB = await r.obtenerExportacionHuevos();
    assert.deepEqual(huevosB.map(f => [f.Codigo, f.Ave, f.Jaula]), [[codHuevo, 'R-HIJ', 'R-J1']]);
    const finB = await r.obtenerExportacionFinanzas();
    assert.deepEqual(finB.map(f => [f.Valor, f.Detalle, f.Ave]), [[7.5, 'de B', null]]);
    assert.equal((await r.obtenerExportacionJaulas()).length, 1);
    assert.deepEqual(await r.obtenerExportacionVentas(), []);
    assert.deepEqual(await r.obtenerExportacionClientes(), []);

    // A queda igual
    await entrarRep();
    assert.deepEqual(await foto(), snapA);
});
