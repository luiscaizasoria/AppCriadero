// ALERTAS con el cliente REST real (solo lectura, calculadas en el servidor): obtenerTodasLasAlertas y
// obtenerResumenAlertas. Se trabaja en un criadero NUEVO de la cuenta A (arranca vacio). Los datos se cargan por la
// API (jaulas, aves, diagnosticos, alimentacion, bebida, huevos, ventas y movimientos) con fechas RELATIVAS al reloj:
// "hoy" = ahora, "ayer" = ahora - 24 h, control de salud = 12:00 UTC del dia (hoy UTC - N), movimientos del mes UTC en
// curso. El esperado se calcula en JS con el algoritmo de V1 (AlertasRepository.sqlite.js), salvo Salud: excepcion
// aprobada a la paridad (documents/specs/alertas-del-dia.md): alerta SOLO el dia UTC en que control + 7 dias = hoy UTC
// ("lleva 7 dias"), ave ACTIVA y EN_TRATAMIENTO.
// Orden salud -> jaulas (alimentacion y luego bebida por jaula) -> produccion -> finanzas. Todo el borrado lo hace la
// limpieza de cuentas desechables. Si la prueba cruza la medianoche UTC se aborta con un mensaje claro: repetir.
import { prueba, assert } from '../lib/arnes.mjs';
import { ctx, entrarComo } from '../lib/contexto.mjs';
import { http, crearCriaderoHttp } from '../lib/http.mjs';

const G = 'alertas';
const FALSO = '00000000-0000-7000-8000-000000000000';
const al = {};   // criaderoId, ids y modelo de los datos
const a_ = () => ctx.clientes.alertas;
const ruta = id => `/api/v1/criaderos/${id}/alertas`;
const CLAVES = ['tipo', 'nivel', 'titulo', 'mensaje', 'entidadId', 'accion', 'accionDestino'];
const HORA = 3600 * 1000;

const hoyUtc = () => new Date().toISOString().slice(0, 10);
const mesUtc = () => hoyUtc().slice(0, 7);
const haceHoras = h => new Date(Date.now() - h * HORA).toISOString();
// Fecha fija: 12:00 UTC del dia hoy - N (hoy = fecha UTC actual)
const controlHace = dias => { const d = new Date(); return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate() - dias, 12)).toISOString(); };
// control + 7 dias (por dia UTC) coincide con hoy UTC
const venceHoy = control => new Date(Date.parse(control) + 7 * 86400000).toISOString().slice(0, 10) === hoyUtc();
const sinCruzar = () => assert.equal(hoyUtc(), al.dia0, 'se cruzo la medianoche UTC durante la prueba: repetir');

async function entrarAl() {
    await entrarComo(ctx.A);
    await ctx.clientes.acceso.seleccionarCriadero(al.criaderoId);
}

// ---------- Esperado (algoritmo de V1 sobre el modelo en JS) ----------
// modelo = { aves: [{ codigo, id, estado, salud, control }], jaulas: [{ codigo, id, activa, alim, beb }], huevosHoy, ingresos, egresos }
function esperadas(m, ahoraMs) {
    const out = [];
    for (const a of m.aves) {
        if (a.estado !== 'ACTIVA' || a.salud !== 'EN_TRATAMIENTO' || !a.control) continue;
        if (venceHoy(a.control)) {
            out.push({ tipo: 'SALUD', nivel: 'ALTO', titulo: 'Ave en tratamiento prolongado', mensaje: `El ave ${a.codigo} lleva 7 días en tratamiento.`, entidadId: a.id, accion: 'DETALLE_AVE', accionDestino: 'DETALLE_AVE' });
        }
    }
    for (const j of m.jaulas.filter(x => x.activa)) {
        if (!j.alim) out.push({ tipo: 'JAULA', nivel: 'MEDIO', titulo: 'Sin alimentación registrada', mensaje: `La jaula ${j.codigo} no tiene alimentación registrada hoy.`, entidadId: j.id, accion: 'DETALLE_JAULA', accionDestino: 'ALIMENTACION_JAULA' });
        if (!j.beb) out.push({ tipo: 'JAULA', nivel: 'MEDIO', titulo: 'Sin bebida registrada', mensaje: `La jaula ${j.codigo} no tiene bebida registrada hoy.`, entidadId: j.id, accion: 'DETALLE_JAULA', accionDestino: 'BEBIDA_JAULA' });
    }
    if (m.huevosHoy === 0) out.push({ tipo: 'PRODUCCION', nivel: 'MEDIO', titulo: 'Sin producción registrada', mensaje: 'No existen huevos registrados hoy.', entidadId: null, accion: null, accionDestino: null });
    if (m.egresos > m.ingresos) out.push({ tipo: 'FINANZAS', nivel: 'ALTO', titulo: 'Gastos superiores a ingresos', mensaje: 'Los egresos del mes superan los ingresos registrados.', entidadId: null, accion: null, accionDestino: null });
    return out;
}
const resumenDe = lista => ({ total: lista.length, criticas: lista.filter(x => x.nivel === 'ALTO').length, advertencias: lista.filter(x => x.nivel === 'MEDIO').length });

// Compara el array COMPLETO: orden, claves exactas y en orden, y cada valor con tipo estricto.
function comparaLista(real, esp, msg) {
    assert.ok(Array.isArray(real), `${msg}: es un array`);
    assert.equal(real.length, esp.length, `${msg}: cantidad real=${JSON.stringify(real.map(x => x.titulo))}`);
    real.forEach((x, i) => {
        assert.deepEqual(Object.keys(x), CLAVES, `${msg} #${i}: claves y orden`);
        assert.deepEqual(x, esp[i], `${msg} #${i}`);
    });
}

async function verifica(msg) {
    const lista = await a_().obtenerTodasLasAlertas();
    const resumen = await a_().obtenerResumenAlertas();
    sinCruzar();
    const esp = esperadas(al.m, Date.now());
    comparaLista(lista, esp, msg);
    assert.deepEqual(Object.keys(resumen), ['total', 'criticas', 'advertencias'], `${msg}: claves del resumen`);
    assert.deepEqual(resumen, resumenDe(esp), `${msg}: resumen`);
    return lista;
}

// ---------- Casos ----------
prueba(G, 'debe crear un criadero vacio de alertas: solo "Sin produccion registrada" y resumen {1, 0, 1} (ALE-01)', async () => {
    await entrarComo(ctx.A);
    al.criaderoId = await crearCriaderoHttp(ctx.A.token, 'Alertas pruebas');
    al.dia0 = hoyUtc();
    await entrarAl();
    const lista = await a_().obtenerTodasLasAlertas();
    const resumen = await a_().obtenerResumenAlertas();
    sinCruzar();
    assert.deepEqual(lista, [{
        tipo: 'PRODUCCION', nivel: 'MEDIO', titulo: 'Sin producción registrada', mensaje: 'No existen huevos registrados hoy.',
        entidadId: null, accion: null, accionDestino: null
    }]);
    assert.deepEqual(Object.keys(lista[0]), CLAVES);
    assert.deepEqual(resumen, { total: 1, criticas: 0, advertencias: 1 });
    al.m = { aves: [], jaulas: [], huevosHoy: 0, ingresos: 0, egresos: 0 };
});

prueba(G, 'debe cargar por la API 4 jaulas (una desactivada), 5 aves, cuidados de hoy y de ayer y movimientos del mes', async () => {
    const { jaulas, aves, saludAve, bajas, alimentacion, bebida, finanzas } = ctx.clientes;
    await entrarAl();
    const m = al.m;

    // Jaulas (la desactivada va en medio: no debe generar alertas)
    const J = [['AL-J1', 'Uno'], ['AL-J2', 'Dos'], ['AL-J3', 'Tres'], ['AL-J4', 'Cuatro']];
    for (const [codigo, nombre] of J) {
        const id = await jaulas.crearJaula({ codigo, nombre, ubicacion: 'Patio', tipo: 'General' });
        m.jaulas.push({ codigo, id, activa: true, alim: false, beb: false });
    }
    await jaulas.desactivarJaula(m.jaulas[1].id);   // AL-J2
    m.jaulas[1].activa = false;
    const [j1, , j3, j4] = m.jaulas;

    // Aves: creacion intercalada (el orden de salud es el de creacion)
    const ave = async codigo => aves.crearAve({ codigo, origen: 'COMPRADA', fechaIngreso: '2026-01-10', edadMesesCompra: 6, raza: 'Criolla', sexo: 'HEMBRA' });
    const diag = (aveId, fecha) => saludAve.registrarDiagnostico({ aveId, enfermedad: 'Coriza', sintomas: '', observacion: '', medicamento: 'Oxitetraciclina', dosis: '1 ml', fecha });
    const ids = {};
    ids.SANA = await ave('AL-SANA');                       // sin diagnostico
    ids.T7 = await ave('AL-T7'); await diag(ids.T7, controlHace(7));         // alerta: vence hoy (7 dias)
    ids.VEN = await ave('AL-VEN'); await diag(ids.VEN, controlHace(7));      // en tratamiento pero VENDIDA: sin alerta
    ids.T1 = await ave('AL-T1'); await diag(ids.T1, controlHace(1));         // reciente: sin alerta
    ids.T8 = await ave('AL-T8'); await diag(ids.T8, controlHace(8));         // ya paso el dia 7: sin alerta
    ids.T6 = await ave('AL-T6'); await diag(ids.T6, controlHace(6));         // aun no llega: sin alerta
    ids.T7B = await ave('AL-T7B'); await diag(ids.T7B, controlHace(7));      // alerta: vence hoy (7 dias)
    await bajas.registrarVentaAve({
        aveId: ids.VEN, fechaVenta: '2001-03-10T12:00:00.000Z', celular: '0991234567', ciudadDestino: 'Quito', cooperativaEnvio: '',
        comprador: 'Juan', valorVenta: null, valorEnvio: null, detalle: ''
    });

    // Estado real que dejo la API (el esperado usa lo guardado, no lo supuesto)
    for (const codigo of ['SANA', 'T7', 'VEN', 'T1', 'T8', 'T6', 'T7B']) {
        const x = await aves.obtenerAvePorId(ids[codigo]);
        m.aves.push({ codigo: `AL-${codigo}`, id: ids[codigo], estado: x.estado, salud: x.estado_salud, control: x.fecha_ultimo_control_salud ?? null });
    }
    const por = c => m.aves.find(a => a.codigo === `AL-${c}`);
    assert.equal(por('VEN').estado, 'VENDIDA');
    assert.equal(por('SANA').salud === 'EN_TRATAMIENTO', false, 'la sana no esta en tratamiento');
    for (const c of ['T7', 'T1', 'T8', 'T6', 'T7B']) assert.equal(por(c).salud, 'EN_TRATAMIENTO', c);
    for (const c of ['T7', 'T1', 'T8', 'T6', 'T7B']) assert.equal(typeof por(c).control, 'string', `control de ${c}`);

    // Cuidados: J1 alimentacion y bebida de hoy; J3 solo alimentacion de ayer (no cuenta); J4 desactivada sin nada.
    // (J2 desactivada tampoco). Para cubrir "solo alimentacion hoy" se usa una quinta jaula.
    const cuidado = { tipo: 'Balanceado', cantidad: null, detalle: null };
    await alimentacion.registrarAlimentacion({ jaulaId: j1.id, fecha: new Date().toISOString(), ...cuidado });
    await bebida.registrarBebida({ jaulaId: j1.id, fecha: new Date().toISOString(), ...cuidado });
    j1.alim = true; j1.beb = true;
    await alimentacion.registrarAlimentacion({ jaulaId: j3.id, fecha: haceHoras(24), ...cuidado });   // ayer UTC
    await bebida.registrarBebida({ jaulaId: j3.id, fecha: haceHoras(24), ...cuidado });                // ayer UTC
    const id5 = await jaulas.crearJaula({ codigo: 'AL-J5', nombre: 'Cinco', ubicacion: 'Patio', tipo: 'General' });
    await alimentacion.registrarAlimentacion({ jaulaId: id5, fecha: new Date().toISOString(), ...cuidado });
    m.jaulas.push({ codigo: 'AL-J5', id: id5, activa: true, alim: true, beb: false });
    assert.equal(j4.activa, true);   // J4 queda activa y sin cuidados: dos alertas

    // Huevos solo de ayer (no cuentan como hoy) y movimientos del mes UTC en curso
    await ctx.clientes.huevo.registrarHuevo({ aveId: ids.SANA, jaulaId: null, fecha: haceHoras(24) });
    const ahora = new Date();
    const mesAnt = new Date(Date.UTC(ahora.getUTCFullYear(), ahora.getUTCMonth(), 0, 12)).toISOString();
    await finanzas.registrarIngreso({ categoria: 'OTRO', valor: 100, detalle: 'ingreso', fecha: new Date().toISOString() });
    await finanzas.registrarEgreso({ categoria: 'ALIMENTO', valor: 150.25, detalle: 'egreso', fecha: new Date().toISOString() });
    await finanzas.registrarEgreso({ categoria: 'OTRO', valor: 9999, detalle: 'mes anterior', fecha: mesAnt });   // no cuenta
    m.ingresos = 100; m.egresos = 150.25;
    al.ids = ids;
    sinCruzar();
});

prueba(G, 'debe devolver el array completo de V1: salud, jaulas (alimentacion y bebida), produccion y finanzas, con claves y textos exactos (ALE-03 a ALE-28)', async () => {
    await entrarAl();
    const lista = await verifica('con datos');
    // Esperado literal (ademas del calculado): T7 y T7B vencen hoy, J1 completa, J3, J4 y J5 (bebida)
    const m = al.m;
    const idDe = c => m.jaulas.find(j => j.codigo === c).id;
    comparaLista(lista, [
        { tipo: 'SALUD', nivel: 'ALTO', titulo: 'Ave en tratamiento prolongado', mensaje: 'El ave AL-T7 lleva 7 días en tratamiento.', entidadId: al.ids.T7, accion: 'DETALLE_AVE', accionDestino: 'DETALLE_AVE' },
        { tipo: 'SALUD', nivel: 'ALTO', titulo: 'Ave en tratamiento prolongado', mensaje: 'El ave AL-T7B lleva 7 días en tratamiento.', entidadId: al.ids.T7B, accion: 'DETALLE_AVE', accionDestino: 'DETALLE_AVE' },
        { tipo: 'JAULA', nivel: 'MEDIO', titulo: 'Sin alimentación registrada', mensaje: 'La jaula AL-J3 no tiene alimentación registrada hoy.', entidadId: idDe('AL-J3'), accion: 'DETALLE_JAULA', accionDestino: 'ALIMENTACION_JAULA' },
        { tipo: 'JAULA', nivel: 'MEDIO', titulo: 'Sin bebida registrada', mensaje: 'La jaula AL-J3 no tiene bebida registrada hoy.', entidadId: idDe('AL-J3'), accion: 'DETALLE_JAULA', accionDestino: 'BEBIDA_JAULA' },
        { tipo: 'JAULA', nivel: 'MEDIO', titulo: 'Sin alimentación registrada', mensaje: 'La jaula AL-J4 no tiene alimentación registrada hoy.', entidadId: idDe('AL-J4'), accion: 'DETALLE_JAULA', accionDestino: 'ALIMENTACION_JAULA' },
        { tipo: 'JAULA', nivel: 'MEDIO', titulo: 'Sin bebida registrada', mensaje: 'La jaula AL-J4 no tiene bebida registrada hoy.', entidadId: idDe('AL-J4'), accion: 'DETALLE_JAULA', accionDestino: 'BEBIDA_JAULA' },
        { tipo: 'JAULA', nivel: 'MEDIO', titulo: 'Sin bebida registrada', mensaje: 'La jaula AL-J5 no tiene bebida registrada hoy.', entidadId: idDe('AL-J5'), accion: 'DETALLE_JAULA', accionDestino: 'BEBIDA_JAULA' },
        { tipo: 'PRODUCCION', nivel: 'MEDIO', titulo: 'Sin producción registrada', mensaje: 'No existen huevos registrados hoy.', entidadId: null, accion: null, accionDestino: null },
        { tipo: 'FINANZAS', nivel: 'ALTO', titulo: 'Gastos superiores a ingresos', mensaje: 'Los egresos del mes superan los ingresos registrados.', entidadId: null, accion: null, accionDestino: null }
    ], 'literal');
    assert.deepEqual(await a_().obtenerResumenAlertas(), { total: 9, criticas: 3, advertencias: 6 });
    sinCruzar();
    // entidadId es un UUID de texto en salud y jaulas
    for (const x of lista.filter(y => y.tipo === 'SALUD' || y.tipo === 'JAULA')) assert.match(x.entidadId, /^[0-9a-f]{8}-[0-9a-f]{4}-7[0-9a-f]{3}-[0-9a-f]{4}-[0-9a-f]{12}$/, 'UUID v7');
});

prueba(G, 'debe quitar las alertas al registrar cuidados y huevos de hoy y no alertar con egresos = ingresos (ALE-04, ALE-05, ALE-18, ALE-21)', async () => {
    const { alimentacion, bebida, huevo, finanzas } = ctx.clientes;
    await entrarAl();
    const m = al.m;
    const cuidado = { tipo: 'Balanceado', cantidad: null, detalle: null };
    for (const j of m.jaulas.filter(x => x.activa)) {
        if (!j.alim) { await alimentacion.registrarAlimentacion({ jaulaId: j.id, fecha: new Date().toISOString(), ...cuidado }); j.alim = true; }
        if (!j.beb) { await bebida.registrarBebida({ jaulaId: j.id, fecha: new Date().toISOString(), ...cuidado }); j.beb = true; }
    }
    // Un huevo de hoy de cualquier ave (incluida la VENDIDA) quita la alerta de produccion
    await huevo.registrarHuevo({ aveId: al.ids.VEN, jaulaId: null, fecha: new Date().toISOString() });
    m.huevosHoy = 1;
    // 100 + 50.25 = 150.25 exacto en binario: egresos = ingresos no alerta (comparacion estricta)
    await finanzas.registrarIngreso({ categoria: 'OTRO', valor: 50.25, detalle: 'igualar', fecha: new Date().toISOString() });
    m.ingresos = 150.25;
    const lista = await verifica('sin alertas de jaula, produccion ni finanzas');
    assert.deepEqual(lista.map(x => x.tipo), ['SALUD', 'SALUD']);
    assert.deepEqual(await a_().obtenerResumenAlertas(), { total: 2, criticas: 2, advertencias: 0 });

    // Egresos < ingresos: tampoco alerta
    await finanzas.registrarIngreso({ categoria: 'OTRO', valor: 1, detalle: 'mas', fecha: new Date().toISOString() });
    m.ingresos = 151.25;
    await verifica('egresos < ingresos');
    // Volver a egresos > ingresos: la alerta vuelve al final
    await finanzas.registrarEgreso({ categoria: 'OTRO', valor: 5, detalle: 'mas', fecha: new Date().toISOString() });
    m.egresos = 155.25;
    const ultima = (await verifica('egresos > ingresos de nuevo')).at(-1);
    assert.equal(ultima.tipo, 'FINANZAS');
});

prueba(G, 'debe devolver por HTTP crudo data.alertas con las claves exactas, 401 sin token y 403 FORBIDDEN con un criadero inexistente', async () => {
    await entrarAl();
    const x = await http('GET', ruta(al.criaderoId), { token: ctx.A.token });
    assert.equal(x.status, 200);
    assert.equal(x.json.success, true);
    assert.deepEqual(Object.keys(x.data), ['alertas']);
    assert.ok(Array.isArray(x.data.alertas));
    assert.ok(x.data.alertas.length > 0);
    for (const a of x.data.alertas) assert.deepEqual(Object.keys(a), CLAVES, 'claves en el JSON crudo');
    const prod = (await http('GET', ruta(al.criaderoId), { token: ctx.A.token })).data.alertas;
    assert.deepEqual(prod, await a_().obtenerTodasLasAlertas(), 'el cliente devuelve data.alertas tal cual');

    const sin = await http('GET', ruta(al.criaderoId));
    assert.equal(sin.status, 401);
    assert.equal(sin.error, 'UNAUTHORIZED');
    const falso = await http('GET', ruta(FALSO), { token: ctx.A.token });
    assert.equal(falso.status, 403);
    assert.equal(falso.error, 'FORBIDDEN');
    const post = await http('POST', ruta(al.criaderoId), { token: ctx.A.token, body: {} });
    assert.ok(post.status === 404 || post.status === 405, `POST /alertas: ${post.status}`);
    sinCruzar();
});

prueba(G, 'debe aislar alertas entre cuentas: B recibe 403 y desde su criadero nuevo ve solo lo suyo aunque use los mismos codigos (ALE-29)', async () => {
    const { acceso, jaulas, aves, saludAve, alimentacion, bebida } = ctx.clientes;
    await entrarAl();
    const snapA = await a_().obtenerTodasLasAlertas();
    assert.ok(snapA.length > 0);

    const x = await http('GET', ruta(al.criaderoId), { token: ctx.B.token });
    ctx.tabla.push({ grupo: G, endpoint: 'GET alertas', esperado: 403, obtenido: x.status, fuga: x.status !== 403, ok: x.status === 403 && x.error === 'FORBIDDEN' });
    assert.equal(x.status, 403);
    assert.equal(x.error, 'FORBIDDEN');

    // B con un criadero nuevo: solo su alerta de produccion
    await entrarComo(ctx.B);
    const critB = await crearCriaderoHttp(ctx.B.token, 'Alertas B');
    await acceso.seleccionarCriadero(critB);
    const soloProd = [{ tipo: 'PRODUCCION', nivel: 'MEDIO', titulo: 'Sin producción registrada', mensaje: 'No existen huevos registrados hoy.', entidadId: null, accion: null, accionDestino: null }];
    assert.deepEqual(await a_().obtenerTodasLasAlertas(), soloProd);
    assert.deepEqual(await a_().obtenerResumenAlertas(), { total: 1, criticas: 0, advertencias: 1 });

    // B repite codigos de A: un ave en tratamiento hace 7 dias y una jaula con cuidados de hoy
    const jB = await jaulas.crearJaula({ codigo: 'AL-J1', nombre: 'Uno', ubicacion: 'Patio', tipo: 'General' });
    const aveB = await aves.crearAve({ codigo: 'AL-T7', origen: 'COMPRADA', fechaIngreso: '2026-01-10', edadMesesCompra: 6, raza: 'Criolla', sexo: 'HEMBRA' });
    await saludAve.registrarDiagnostico({ aveId: aveB, enfermedad: 'Coriza', sintomas: '', observacion: '', medicamento: 'Oxitetraciclina', dosis: '1 ml', fecha: controlHace(7) });
    const cuidado = { tipo: 'Balanceado', cantidad: null, detalle: null };
    await alimentacion.registrarAlimentacion({ jaulaId: jB, fecha: new Date().toISOString(), ...cuidado });
    await bebida.registrarBebida({ jaulaId: jB, fecha: new Date().toISOString(), ...cuidado });
    const lista = await a_().obtenerTodasLasAlertas();
    sinCruzar();
    assert.deepEqual(lista, [
        { tipo: 'SALUD', nivel: 'ALTO', titulo: 'Ave en tratamiento prolongado', mensaje: 'El ave AL-T7 lleva 7 días en tratamiento.', entidadId: aveB, accion: 'DETALLE_AVE', accionDestino: 'DETALLE_AVE' },
        ...soloProd
    ]);
    const idsA = [...Object.values(al.ids), ...al.m.jaulas.map(j => j.id)];
    assert.ok(!lista.some(a => idsA.includes(a.entidadId)), 'ningun id de A aparece en B');
    assert.deepEqual(await a_().obtenerResumenAlertas(), { total: 2, criticas: 1, advertencias: 1 });

    // A queda igual
    await entrarAl();
    assert.deepEqual(await a_().obtenerTodasLasAlertas(), snapA);
});
