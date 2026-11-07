// INICIO (dashboard) con el cliente REST real (solo lectura, calculado en el servidor): obtenerDashboard.
// Se trabaja en un criadero NUEVO de la cuenta A (arranca vacio). Los datos se cargan por la API (jaulas, aves,
// diagnosticos, huevos, bajas y movimientos) con fechas RELATIVAS a un unico instante base (ahora - d*24 h, asi todas
// comparten la hora UTC), nunca en el borde exacto de los 6 dias. El esperado se calcula en JS con el algoritmo de V1
// (DashboardRepository.sqlite.js) sobre un modelo de lo guardado; los empates de mejorPonedora y horaPico se EVITAN en
// los datos (la spec los marca como hipotesis H-1 y H-2) y el calculo aborta si hubiera uno. Todo el borrado lo hace
// la limpieza de cuentas desechables. Si la prueba cruza la medianoche UTC se aborta con un mensaje claro: repetir.
import { prueba, assert } from '../lib/arnes.mjs';
import { ctx, entrarComo } from '../lib/contexto.mjs';
import { http, crearCriaderoHttp } from '../lib/http.mjs';

const G = 'inicio';
const FALSO = '00000000-0000-7000-8000-000000000000';
const ini = {};   // criaderoId, ids y modelo de los datos
const d_ = () => ctx.clientes.dashboard;
const ruta = id => `/api/v1/criaderos/${id}/dashboard`;
const DIA = 24 * 3600 * 1000;
const NOMBRES = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];

const CLAVES = {
    raiz: ['aves', 'salud', 'finanzas', 'jaulas', 'ocupacionJaulas', 'huevos', 'mejorPonedora', 'horaPico', 'produccionSemana', 'avesPorRaza', 'totalRazas', 'promedioHuevos'],
    aves: ['activas', 'vendidas', 'fallecidas'],
    salud: ['sanas', 'tratamiento', 'enfermas'],
    finanzas: ['ingresos', 'egresos', 'utilidad'],
    jaulas: ['total', 'ocupadas'],
    ocupacionJaulas: ['porcentaje'],
    huevos: ['hoy', 'mes'],
    mejorPonedora: ['codigo', 'cantidad'],
    horaPico: ['hora', 'cantidad'],
    dia: ['dia', 'cantidad'],
    raza: ['raza', 'cantidad', 'porcentaje']
};

const iso = ms => new Date(ms).toISOString();
const hoyUtc = () => iso(Date.now()).slice(0, 10);
const sinCruzar = () => assert.equal(hoyUtc(), ini.dia0, 'se cruzo la medianoche UTC durante la prueba: repetir');
const haceDias = (base, d) => iso(base - d * DIA);

async function entrarAl() {
    await entrarComo(ctx.A);
    await ctx.clientes.acceso.seleccionarCriadero(ini.criaderoId);
}

// ---------- Esperado (algoritmo de V1 sobre el modelo en JS) ----------
// m = { aves: [{ codigo, estado, salud, raza, jaulaId }], jaulas: [{ id, activa }], huevos: [{ ave, fecha }], movs: [{ tipo, valor, fecha }] }
function unicoMaximo(mapa, que) {
    const orden = [...mapa.entries()].sort((a, b) => b[1] - a[1]);
    if (orden.length > 1 && orden[0][1] === orden[1][1]) throw new Error(`datos de prueba con empate en ${que}: no se afirma el desempate (H-1/H-2)`);
    return orden[0] ?? null;
}
function esperado(m, ahoraMs) {
    const hoy = iso(ahoraMs).slice(0, 10), mes = hoy.slice(0, 7), desde = iso(ahoraMs - 6 * DIA).slice(0, 10);
    const cuenta = e => m.aves.filter(a => a.estado === e).length;
    const activas = m.aves.filter(a => a.estado === 'ACTIVA');
    const sal = s => activas.filter(a => a.salud === s).length;
    let ingresos = 0, egresos = 0;
    for (const x of m.movs) {
        if (x.fecha.slice(0, 7) !== mes) continue;
        if (x.tipo === 'INGRESO') ingresos += x.valor; else if (x.tipo === 'EGRESO') egresos += x.valor;
    }
    const jActivas = m.jaulas.filter(j => j.activa);
    const ocupadas = jActivas.filter(j => activas.some(a => a.jaulaId === j.id)).length;

    const porAve = new Map();
    for (const h of m.huevos) porAve.set(h.ave, (porAve.get(h.ave) ?? 0) + 1);
    const mejor = unicoMaximo(porAve, 'mejorPonedora');
    const porHora = new Map();
    for (const h of m.huevos) porHora.set(h.fecha.slice(11, 13), (porHora.get(h.fecha.slice(11, 13)) ?? 0) + 1);
    const pico = unicoMaximo(porHora, 'horaPico');

    const ventana = m.huevos.filter(h => h.fecha >= desde);   // comparacion de texto, sin cota superior (como V1)
    const porDow = new Map();
    for (const h of ventana) { const w = new Date(h.fecha).getUTCDay(); porDow.set(w, (porDow.get(w) ?? 0) + 1); }
    const semana = [...porDow.entries()].sort((a, b) => a[0] - b[0]).map(([w, cantidad]) => ({ dia: NOMBRES[w], cantidad }));

    const razas = new Map();
    for (const a of activas) { const r = (a.raza ?? '').trim() || 'Sin raza'; razas.set(r, (razas.get(r) ?? 0) + 1); }
    const avesPorRaza = [...razas.entries()]
        .sort((a, b) => b[1] - a[1] || (a[0] < b[0] ? -1 : a[0] > b[0] ? 1 : 0))
        .map(([raza, cantidad]) => ({ raza, cantidad, porcentaje: Number((cantidad * 100 / activas.length).toFixed(2)) }));

    return {
        aves: { activas: cuenta('ACTIVA'), vendidas: cuenta('VENDIDA'), fallecidas: cuenta('FALLECIDA') },
        salud: { sanas: sal('SANA'), tratamiento: sal('EN_TRATAMIENTO'), enfermas: sal('ENFERMA') },
        finanzas: { ingresos, egresos, utilidad: ingresos - egresos },
        jaulas: { total: jActivas.length, ocupadas },
        ocupacionJaulas: { porcentaje: jActivas.length > 0 ? Number(((ocupadas / jActivas.length) * 100).toFixed(2)) : 0 },
        huevos: { hoy: m.huevos.filter(h => h.fecha.slice(0, 10) === hoy).length, mes: m.huevos.filter(h => h.fecha.slice(0, 7) === mes).length },
        mejorPonedora: mejor ? { codigo: mejor[0], cantidad: mejor[1] } : null,
        horaPico: pico ? { hora: pico[0], cantidad: pico[1] } : null,
        produccionSemana: semana,
        avesPorRaza,
        totalRazas: avesPorRaza.length,
        promedioHuevos: Number((ventana.length / 7).toFixed(2))
    };
}

// Claves EXACTAS y en orden en la raiz, en cada parte y en cada elemento de los arreglos; tipos estrictos con deepEqual.
function comparaClaves(real, msg) {
    assert.deepEqual(Object.keys(real), CLAVES.raiz, `${msg}: claves de la raiz y orden`);
    for (const k of ['aves', 'salud', 'finanzas', 'jaulas', 'ocupacionJaulas', 'huevos']) assert.deepEqual(Object.keys(real[k]), CLAVES[k], `${msg}: claves de ${k}`);
    for (const k of ['mejorPonedora', 'horaPico']) if (real[k] !== null) assert.deepEqual(Object.keys(real[k]), CLAVES[k], `${msg}: claves de ${k}`);
    assert.ok(Array.isArray(real.produccionSemana), `${msg}: produccionSemana es array`);
    assert.ok(Array.isArray(real.avesPorRaza), `${msg}: avesPorRaza es array`);
    real.produccionSemana.forEach((x, i) => assert.deepEqual(Object.keys(x), CLAVES.dia, `${msg}: produccionSemana #${i}`));
    real.avesPorRaza.forEach((x, i) => assert.deepEqual(Object.keys(x), CLAVES.raza, `${msg}: avesPorRaza #${i}`));
}
function compara(real, esp, msg) {
    comparaClaves(real, msg);
    assert.deepEqual(real, esp, msg);
    for (const k of ['ingresos', 'egresos', 'utilidad']) assert.equal(typeof real.finanzas[k], 'number', `${msg}: tipo finanzas.${k}`);
    assert.equal(typeof real.ocupacionJaulas.porcentaje, 'number', `${msg}: tipo ocupacion`);
    assert.equal(typeof real.totalRazas, 'number');
    assert.equal(typeof real.promedioHuevos, 'number');
    if (real.horaPico !== null) { assert.equal(typeof real.horaPico.hora, 'string'); assert.match(real.horaPico.hora, /^\d{2}$/, `${msg}: hora de 2 digitos`); }
    for (const x of real.produccionSemana) assert.ok(NOMBRES.includes(x.dia), `${msg}: dia en espanol ${x.dia}`);
}

const VACIO = {
    aves: { activas: 0, vendidas: 0, fallecidas: 0 }, salud: { sanas: 0, tratamiento: 0, enfermas: 0 }, finanzas: { ingresos: 0, egresos: 0, utilidad: 0 },
    jaulas: { total: 0, ocupadas: 0 }, ocupacionJaulas: { porcentaje: 0 }, huevos: { hoy: 0, mes: 0 }, mejorPonedora: null, horaPico: null,
    produccionSemana: [], avesPorRaza: [], totalRazas: 0, promedioHuevos: 0
};

// ---------- Casos ----------
prueba(G, 'debe crear un criadero vacio de inicio: todo en cero, null reales y arreglos vacios con las claves de V1 (INI-01, INI-05)', async () => {
    await entrarComo(ctx.A);
    ini.criaderoId = await crearCriaderoHttp(ctx.A.token, 'Inicio pruebas');
    ini.dia0 = hoyUtc();
    await entrarAl();
    const d = await d_().obtenerDashboard();
    sinCruzar();
    comparaClaves(d, 'vacio');
    assert.deepEqual(d, VACIO);
    assert.strictEqual(d.mejorPonedora, null);
    assert.strictEqual(d.horaPico, null);
    ini.m = { aves: [], jaulas: [], huevos: [], movs: [] };
});

prueba(G, 'debe cargar por la API 4 jaulas (una desactivada), 9 aves (vendida, fallecida y en tratamiento), huevos de la semana y de fuera, y movimientos del mes', async () => {
    const { jaulas, aves, huevo, saludAve, bajas, finanzas } = ctx.clientes;
    await entrarAl();
    const m = ini.m;
    const base = Date.now();
    ini.base = base;

    // Jaulas: J1 con aves ACTIVAS; J2 solo con un ave vendida (no cuenta como ocupada); J3 vacia; J4 desactivada
    const J = {};
    for (const [k, codigo] of [['J1', 'IN-J1'], ['J2', 'IN-J2'], ['J3', 'IN-J3'], ['J4', 'IN-J4']]) {
        J[k] = await jaulas.crearJaula({ codigo, nombre: k, ubicacion: 'Patio', tipo: 'General' });
    }
    await jaulas.desactivarJaula(J.J4);
    m.jaulas = [{ id: J.J1, activa: true }, { id: J.J2, activa: true }, { id: J.J3, activa: true }, { id: J.J4, activa: false }];

    // Aves: 7 ACTIVAS (3 Criolla, 2 Plymouth, 1 Rhode, 1 sin raza con espacios), 1 VENDIDA y 1 FALLECIDA
    const PLAN = [
        ['C1', 'Criolla', J.J1], ['C2', 'Criolla'], ['C3', 'Criolla'], ['P1', 'Plymouth', J.J1], ['P2', 'Plymouth'],
        ['R1', 'Rhode'], ['S1', '   '], ['VEN', 'Criolla', J.J2], ['FAL', 'Rhode']
    ];
    const ids = {};
    for (const [k, raza, jaulaId] of PLAN) {
        ids[k] = await aves.crearAve({ codigo: `IN-${k}`, origen: 'COMPRADA', fechaIngreso: '2026-01-10', edadMesesCompra: 6, raza, sexo: 'HEMBRA', jaulaId });
    }
    ini.ids = ids;

    // Huevos (antes de las bajas): VEN 6 (la mejor, aunque vendida), C1 5, P1 3, P2 2; sin empate de aves ni de hora
    const mesAnt = iso(Date.UTC(new Date(base).getUTCFullYear(), new Date(base).getUTCMonth(), 0, 12));
    const F = d => (d === 'mesAnt' ? mesAnt : haceDias(base, d));
    const HUEVOS = { VEN: [0, 1, 2, 3, 8, 'mesAnt'], C1: [0, 0, 1, 3, 5], P1: [0, 1, 5], P2: [4, 8] };
    for (const [k, dias] of Object.entries(HUEVOS)) {
        for (const d of dias) {
            await huevo.registrarHuevo({ aveId: ids[k], jaulaId: null, fecha: F(d) });
            m.huevos.push({ ave: `IN-${k}`, fecha: F(d) });
        }
    }

    // Salud: P2 y VEN (esta ultima no cuenta: no es ACTIVA) quedan en tratamiento
    const diag = aveId => saludAve.registrarDiagnostico({ aveId, enfermedad: 'Coriza', sintomas: '', observacion: '', medicamento: 'Oxitetraciclina', dosis: '1 ml', fecha: iso(base) });
    await diag(ids.P2);
    await diag(ids.VEN);

    // Bajas
    await bajas.registrarVentaAve({
        aveId: ids.VEN, fechaVenta: '2001-03-10T12:00:00.000Z', celular: '0991234567', ciudadDestino: 'Quito', cooperativaEnvio: '',
        comprador: 'Juan', valorVenta: null, valorEnvio: null, detalle: ''
    });
    await bajas.registrarMuerteAve({ aveId: ids.FAL, causa: 'Enfermedad', detalle: '' });

    // Estado real que dejo la API (el esperado usa lo guardado, no lo supuesto)
    for (const [k, raza, jaulaId] of PLAN) {
        const x = await aves.obtenerAvePorId(ids[k]);
        m.aves.push({ codigo: `IN-${k}`, estado: x.estado, salud: x.estado_salud ?? null, raza: raza.trim() || null, jaulaId: jaulaId ?? null });
    }
    const por = k => m.aves.find(a => a.codigo === `IN-${k}`);
    assert.equal(por('VEN').estado, 'VENDIDA');
    assert.equal(por('FAL').estado, 'FALLECIDA');
    assert.equal(por('P2').salud, 'EN_TRATAMIENTO');

    // Movimientos: ingresos y egresos del mes UTC (valores exactos en binario) y uno del mes anterior que no cuenta
    await finanzas.registrarIngreso({ categoria: 'OTRO', valor: 100.5, detalle: 'i1', fecha: iso(base) });
    await finanzas.registrarIngreso({ categoria: 'OTRO', valor: 50.25, detalle: 'i2', fecha: iso(base) });
    await finanzas.registrarEgreso({ categoria: 'ALIMENTO', valor: 30.75, detalle: 'e1', fecha: iso(base) });
    await finanzas.registrarEgreso({ categoria: 'OTRO', valor: 12.125, detalle: 'e2', fecha: iso(base) });
    await finanzas.registrarIngreso({ categoria: 'OTRO', valor: 9999.5, detalle: 'mes anterior', fecha: mesAnt });
    m.movs = [
        { tipo: 'INGRESO', valor: 100.5, fecha: iso(base) }, { tipo: 'INGRESO', valor: 50.25, fecha: iso(base) },
        { tipo: 'EGRESO', valor: 30.75, fecha: iso(base) }, { tipo: 'EGRESO', valor: 12.125, fecha: iso(base) },
        { tipo: 'INGRESO', valor: 9999.5, fecha: mesAnt }
    ];
    sinCruzar();
});

prueba(G, 'debe devolver el objeto completo de V1: claves y orden, tipos, dias en espanol Domingo a Sabado y redondeos (INI-02 a INI-24)', async () => {
    await entrarAl();
    const real = await d_().obtenerDashboard();
    sinCruzar();
    const esp = esperado(ini.m, Date.now());
    compara(real, esp, 'con datos');

    // Esperado literal (ademas del calculado)
    assert.deepEqual(real.aves, { activas: 7, vendidas: 1, fallecidas: 1 });
    assert.deepEqual(real.salud, { sanas: 6, tratamiento: 1, enfermas: 0 }, 'la vendida en tratamiento no cuenta');
    assert.deepEqual(real.finanzas, { ingresos: 150.75, egresos: 42.875, utilidad: 107.875 });
    assert.deepEqual(real.jaulas, { total: 3, ocupadas: 1 }, 'inactiva fuera; la jaula con solo un ave vendida no esta ocupada');
    assert.deepEqual(real.ocupacionJaulas, { porcentaje: 33.33 });
    assert.deepEqual(real.mejorPonedora, { codigo: 'IN-VEN', cantidad: 6 }, 'cuenta tambien aves vendidas y huevos de cualquier fecha');
    assert.deepEqual(real.avesPorRaza, [
        { raza: 'Criolla', cantidad: 3, porcentaje: 42.86 }, { raza: 'Plymouth', cantidad: 2, porcentaje: 28.57 },
        { raza: 'Rhode', cantidad: 1, porcentaje: 14.29 }, { raza: 'Sin raza', cantidad: 1, porcentaje: 14.29 }
    ]);
    assert.equal(real.totalRazas, real.avesPorRaza.length);
    assert.equal(real.totalRazas, 4);
    assert.ok(real.huevos.hoy >= 1 && real.huevos.mes >= real.huevos.hoy && real.huevos.mes <= 16);
    // Semana: 13 huevos en los dias 0 a 5 (los de hace 8 dias y los del mes anterior pueden quedar fuera); orden por dia de la semana
    const orden = real.produccionSemana.map(x => NOMBRES.indexOf(x.dia));
    assert.deepEqual(orden, [...orden].sort((a, b) => a - b), 'orden Domingo a Sabado, no cronologico');
    assert.equal(new Set(orden).size, orden.length, 'una fila por dia de la semana');
    assert.ok(real.produccionSemana.length >= 6);
});

prueba(G, 'debe devolver por HTTP crudo el objeto directamente en data, 401 sin token, 403 FORBIDDEN con un criadero inexistente y sin POST', async () => {
    await entrarAl();
    const x = await http('GET', ruta(ini.criaderoId), { token: ctx.A.token });
    assert.equal(x.status, 200);
    assert.equal(x.json.success, true);
    comparaClaves(x.data, 'crudo');
    assert.ok(!('dashboard' in x.data), 'data es el objeto, sin envoltorio');
    assert.deepEqual(x.data, await d_().obtenerDashboard(), 'el cliente devuelve data tal cual');

    const sin = await http('GET', ruta(ini.criaderoId));
    assert.equal(sin.status, 401);
    assert.equal(sin.error, 'UNAUTHORIZED');
    const falso = await http('GET', ruta(FALSO), { token: ctx.A.token });
    assert.equal(falso.status, 403);
    assert.equal(falso.error, 'FORBIDDEN');
    const post = await http('POST', ruta(ini.criaderoId), { token: ctx.A.token, body: {} });
    assert.ok(post.status === 404 || post.status === 405, `POST /dashboard: ${post.status}`);
    sinCruzar();
});

prueba(G, 'debe aislar inicio entre cuentas: B recibe 403 y desde su criadero nuevo ve solo lo suyo aunque use los mismos codigos (INI-23)', async () => {
    const { acceso, jaulas, aves, huevo } = ctx.clientes;
    await entrarAl();
    const snapA = await d_().obtenerDashboard();
    assert.equal(snapA.aves.activas, 7);

    const x = await http('GET', ruta(ini.criaderoId), { token: ctx.B.token });
    ctx.tabla.push({ grupo: G, endpoint: 'GET dashboard', esperado: 403, obtenido: x.status, fuga: x.status !== 403, ok: x.status === 403 && x.error === 'FORBIDDEN' });
    assert.equal(x.status, 403);
    assert.equal(x.error, 'FORBIDDEN');

    // B con un criadero nuevo: vacio
    await entrarComo(ctx.B);
    const critB = await crearCriaderoHttp(ctx.B.token, 'Inicio B');
    await acceso.seleccionarCriadero(critB);
    const vacioB = await d_().obtenerDashboard();
    comparaClaves(vacioB, 'B vacio');
    assert.deepEqual(vacioB, VACIO);

    // B repite codigos de A: una jaula, un ave Criolla en ella y un huevo de hoy
    const jB = await jaulas.crearJaula({ codigo: 'IN-J1', nombre: 'J1', ubicacion: 'Patio', tipo: 'General' });
    const aveB = await aves.crearAve({ codigo: 'IN-C1', origen: 'COMPRADA', fechaIngreso: '2026-01-10', edadMesesCompra: 6, raza: 'Criolla', sexo: 'HEMBRA', jaulaId: jB });
    const fecha = iso(Date.now());
    await huevo.registrarHuevo({ aveId: aveB, jaulaId: null, fecha });
    const xb = await aves.obtenerAvePorId(aveB);
    const mB = {
        aves: [{ codigo: 'IN-C1', estado: xb.estado, salud: xb.estado_salud ?? null, raza: 'Criolla', jaulaId: jB }],
        jaulas: [{ id: jB, activa: true }], huevos: [{ ave: 'IN-C1', fecha }], movs: []
    };
    const realB = await d_().obtenerDashboard();
    sinCruzar();
    compara(realB, esperado(mB, Date.now()), 'B con datos propios');
    assert.deepEqual(realB.aves, { activas: 1, vendidas: 0, fallecidas: 0 });
    assert.deepEqual(realB.jaulas, { total: 1, ocupadas: 1 });
    assert.deepEqual(realB.ocupacionJaulas, { porcentaje: 100 });
    assert.deepEqual(realB.huevos, { hoy: 1, mes: 1 });
    assert.deepEqual(realB.mejorPonedora, { codigo: 'IN-C1', cantidad: 1 });
    assert.deepEqual(realB.avesPorRaza, [{ raza: 'Criolla', cantidad: 1, porcentaje: 100 }]);
    assert.deepEqual(realB.finanzas, { ingresos: 0, egresos: 0, utilidad: 0 });

    // A queda igual
    await entrarAl();
    assert.deepEqual(await d_().obtenerDashboard(), snapA);
});
