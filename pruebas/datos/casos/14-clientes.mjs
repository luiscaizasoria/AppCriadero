// CLIENTES con el cliente REST real (solo lectura: se calculan en el servidor a partir de las ventas).
// Se trabaja en un criadero NUEVO de la cuenta A (arranca vacio). Las ventas se registran por la API de Bajas
// (que normaliza el celular a digitos) con fechas fijas de 2001; el esperado se calcula en JS con el algoritmo de V1
// (ClientesRepository.sqlite.js). Todo el borrado lo hace la limpieza de cuentas desechables.
import { prueba, assert } from '../lib/arnes.mjs';
import { ctx, entrarComo } from '../lib/contexto.mjs';
import { http, crearCriaderoHttp } from '../lib/http.mjs';

const G = 'clientes';
const FALSO = '00000000-0000-7000-8000-000000000000';
const cli = {};            // criaderoId
const ventas = [];         // espejo local de las ventas de A, en orden de registro

const c = () => ctx.clientes.clientes;
const base = () => `/api/v1/criaderos/${cli.criaderoId}/clientes`;

async function entrarCli() {
    await entrarComo(ctx.A);
    await ctx.clientes.acceso.seleccionarCriadero(cli.criaderoId);
}

const C1 = '0991234567';
const C2 = '0987654321';
const C3 = '0911111111';

const CLAVES_CLIENTE = ['celular', 'ciudad', 'nombre', 'total_compras', 'total_envios', 'total_ventas', 'ultima_compra'];
const CLAVES_COMPRA = ['venta_id', 'fecha', 'celular', 'comprador', 'ciudad_destino', 'cooperativa_envio', 'valor_venta', 'valor_envio',
    'detalle', 'ave_id', 'ave_codigo', 'ave_raza', 'ave_sexo', 'ave_foto_uri'].sort();

function cerca(real, esperado, msg) {
    assert.ok(Math.abs(real - esperado) <= 1e-9 * Math.max(1, Math.abs(real), Math.abs(esperado)), `${msg ?? ''} real=${real} esperado=${esperado}`);
}
const vacio = t => String(t ?? '').trim() === '';
const sumaNoNula = vs => vs.filter(x => x !== null && x !== undefined).reduce((s, x) => s + x, 0);

// Registro de una venta: crea el ave (raza, sexo, foto) y la vende por la API de Bajas.
let nAve = 0;
async function vender(entrada, norm, v) {
    const { aves, bajas } = ctx.clientes;
    nAve++;
    const ave = {
        codigo: `CLI-A${nAve}`, origen: 'COMPRADA', fechaIngreso: '2026-01-10', edadMesesCompra: 6,
        raza: `Raza ${nAve}`, sexo: nAve % 2 ? 'MACHO' : 'HEMBRA', fotoUri: `file:///data/user/0/kikirikis/cli-foto-${nAve}.jpg`
    };
    const aveId = await aves.crearAve(ave);
    await bajas.registrarVentaAve({
        aveId, fechaVenta: v.fecha, celular: entrada, ciudadDestino: v.ciudad, cooperativaEnvio: v.coop ?? '',
        comprador: v.comprador, valorVenta: v.vv, valorEnvio: v.ve, detalle: v.detalle ?? ''
    });
    const baja = await aves.obtenerBajaAve(aveId);
    const reg = { ...v, norm, entrada, aveId, bajaId: baja.id, ave, idx: ventas.length };
    ventas.push(reg);
    return reg;
}

// Algoritmo de V1: grupo por celular; nombre y ciudad de la ultima venta (fecha DESC, orden de registro DESC)
// con valor no vacio; ultima_compra = MAX(fecha); orden ultima_compra DESC, celular ASC.
function ordenDesc(a, b) {
    return a.fecha < b.fecha ? 1 : a.fecha > b.fecha ? -1 : b.idx - a.idx;
}
function clientesEsperados(lista = ventas) {
    const grupos = new Map();
    for (const v of lista) (grupos.get(v.norm) ?? grupos.set(v.norm, []).get(v.norm)).push(v);
    const filas = [...grupos.entries()].map(([celular, vs]) => {
        const orden = [...vs].sort(ordenDesc);
        return {
            celular,
            nombre: orden.find(v => !vacio(v.comprador))?.comprador ?? 'Sin nombre',
            ciudad: orden.find(v => !vacio(v.ciudad))?.ciudad ?? '',
            total_compras: vs.length,
            total_ventas: sumaNoNula(vs.map(v => v.vv)),
            total_envios: sumaNoNula(vs.map(v => v.ve)),
            ultima_compra: vs.reduce((m, v) => (v.fecha > m ? v.fecha : m), '')
        };
    });
    return filas.sort((a, b) => (a.ultima_compra < b.ultima_compra ? 1 : a.ultima_compra > b.ultima_compra ? -1 : a.celular < b.celular ? -1 : 1));
}
function comparaCliente(real, esp, msg) {
    assert.deepEqual(Object.keys(real).sort(), CLAVES_CLIENTE, `${msg}: claves`);
    for (const k of ['celular', 'nombre', 'ciudad', 'ultima_compra']) {
        assert.equal(typeof real[k], 'string', `${msg}: tipo de ${k}`);
        assert.equal(real[k], esp[k], `${msg}: ${k}`);
    }
    assert.equal(real.total_compras, esp.total_compras, `${msg}: total_compras`);
    for (const k of ['total_ventas', 'total_envios']) {
        assert.equal(typeof real[k], 'number', `${msg}: tipo de ${k}`);
        cerca(real[k], esp[k], `${msg} ${k}`);
    }
}
function comprasEsperadas(norm) {
    return ventas.filter(v => v.norm === norm).sort(ordenDesc).map(v => ({
        venta_id: v.bajaId, fecha: v.fecha, celular: v.norm, comprador: vacio(v.comprador) ? null : v.comprador,
        ciudad_destino: vacio(v.ciudad) ? null : v.ciudad, cooperativa_envio: vacio(v.coop) ? null : v.coop,
        valor_venta: v.vv ?? null, valor_envio: v.ve ?? null, detalle: vacio(v.detalle) ? null : v.detalle,
        ave_id: v.aveId, ave_codigo: v.ave.codigo, ave_raza: v.ave.raza, ave_sexo: v.ave.sexo, ave_foto_uri: v.ave.fotoUri
    }));
}

prueba(G, 'debe crear un criadero vacio para clientes y devolver [], null y [] sin ventas', async () => {
    await entrarComo(ctx.A);
    cli.criaderoId = await crearCriaderoHttp(ctx.A.token, 'Clientes pruebas');
    await entrarCli();
    assert.deepEqual(await c().obtenerClientes(), []);
    assert.equal(await c().obtenerClientePorCelular(C1), null);
    assert.deepEqual(await c().obtenerComprasCliente(C1), []);
});

prueba(G, 'debe registrar seis ventas por la API normalizando el celular de entrada a solo digitos', async () => {
    await entrarCli();
    // C1: tres entradas distintas del mismo celular; fechas fijas de 2001
    await vender('+593 99 123 4567', C1, { fecha: '2001-01-10T12:00:00.000Z', comprador: 'Juan', ciudad: 'Quito', coop: 'Servientrega', vv: 12.5, ve: 3.25, detalle: 'primera' });
    await vender('0991234567', C1, { fecha: '2001-02-01T12:00:00.000Z', comprador: 'Juan Perez', ciudad: 'Cuenca', coop: '', vv: 7.5, ve: null, detalle: '' });
    await vender('593991234567', C1, { fecha: '2001-03-05T12:00:00.000Z', comprador: '', ciudad: '', coop: '', vv: 0.1, ve: null, detalle: '' });
    // C2: dos ventas el mismo dia
    await vender('0987654321', C2, { fecha: '2001-01-05T08:00:00.000Z', comprador: 'Ana', ciudad: 'Loja', coop: '', vv: 0, ve: null, detalle: '' });
    await vender('0987654321', C2, { fecha: '2001-01-05T09:00:00.000Z', comprador: 'Beto', ciudad: '', coop: '', vv: 40.25, ve: null, detalle: '' });
    // C3: todo vacio, misma ultima_compra que C2
    await vender('0911111111', C3, { fecha: '2001-01-05T09:00:00.000Z', comprador: '', ciudad: '', coop: '', vv: null, ve: null, detalle: '' });
    assert.equal(ventas.length, 6);

    // El celular se guardo normalizado: las tres entradas de C1 caen en el mismo cliente
    const compras = await c().obtenerComprasCliente(C1);
    assert.equal(compras.length, 3);
    assert.ok(compras.every(x => x.celular === C1), 'celular normalizado a 0991234567');
    // y sin normalizar no coincide (como en V1)
    for (const crudo of ['+593 99 123 4567', '593991234567', '+593991234567', '99 123 4567']) {
        assert.equal(await c().obtenerClientePorCelular(crudo), null, `sin normalizar: ${crudo}`);
        assert.deepEqual(await c().obtenerComprasCliente(crudo), [], `sin normalizar: ${crudo}`);
    }
});

prueba(G, 'debe listar los clientes con las siete claves, agregados de V1 y orden ultima_compra DESC, celular ASC', async () => {
    await entrarCli();
    const lista = await c().obtenerClientes();
    const esp = clientesEsperados();
    assert.deepEqual(esp.map(x => x.celular), [C1, C3, C2], 'orden esperado');
    assert.equal(lista.length, 3);
    lista.forEach((real, i) => comparaCliente(real, esp[i], `fila ${i} ${esp[i].celular}`));
    const [r1, r3, r2] = lista;
    assert.deepEqual([r1.nombre, r1.ciudad, r1.total_compras], ['Juan Perez', 'Cuenca', 3], 'ultima con valor no vacio');
    cerca(r1.total_ventas, 12.5 + 7.5 + 0.1, 'C1 ventas');
    assert.equal(r1.total_envios, 3.25);
    assert.equal(r1.ultima_compra, '2001-03-05T12:00:00.000Z');
    assert.deepEqual([r2.nombre, r2.ciudad, r2.total_compras, r2.total_ventas, r2.total_envios], ['Beto', 'Loja', 2, 40.25, 0]);
    assert.deepEqual([r3.nombre, r3.ciudad, r3.total_compras, r3.total_ventas, r3.total_envios], ['Sin nombre', '', 1, 0, 0]);
    assert.equal(r2.ultima_compra, r3.ultima_compra, 'empate de ultima_compra: desempata el celular ASC');
});

prueba(G, 'debe devolver un cliente por celular igual a su fila del listado y null para lo no normalizado o inexistente', async () => {
    await entrarCli();
    const lista = await c().obtenerClientes();
    const esp = clientesEsperados();
    for (const fila of lista) {
        const uno = await c().obtenerClientePorCelular(fila.celular);
        assert.deepEqual(uno, fila, `detalle de ${fila.celular}`);
        comparaCliente(uno, esp.find(x => x.celular === fila.celular), `detalle ${fila.celular}`);
    }
    for (const raro of ['+593 99 123 4567', '593991234567', 'a/b%c', '%2B', '0999999999']) {
        assert.equal(await c().obtenerClientePorCelular(raro), null, raro);
        assert.deepEqual(await c().obtenerComprasCliente(raro), [], raro);
    }
});

prueba(G, 'debe devolver las compras con 14 claves, orden fecha DESC, nulos reales, cero conservado y datos del ave', async () => {
    const { aves } = ctx.clientes;
    await entrarCli();
    const compras = await c().obtenerComprasCliente(C1);
    const esp = comprasEsperadas(C1);
    assert.deepEqual(compras.map(x => x.fecha), ['2001-03-05T12:00:00.000Z', '2001-02-01T12:00:00.000Z', '2001-01-10T12:00:00.000Z'], 'orden a3, a2, a1');
    compras.forEach((x, i) => {
        assert.deepEqual(Object.keys(x).sort(), CLAVES_COMPRA, `claves ${i}`);
        assert.deepEqual(x, esp[i], `compra ${i}`);
    });
    const [a3, a2, a1] = compras;
    assert.deepEqual([a3.comprador, a3.ciudad_destino, a3.cooperativa_envio, a3.detalle, a3.valor_venta, a3.valor_envio], [null, null, null, null, 0.1, null], "'' se guarda como null");
    assert.deepEqual([a2.cooperativa_envio, a2.detalle, a2.valor_envio], [null, null, null]);
    assert.deepEqual([a1.cooperativa_envio, a1.detalle, a1.valor_venta, a1.valor_envio], ['Servientrega', 'primera', 12.5, 3.25]);
    assert.equal(a1.ave_foto_uri, ventas[0].ave.fotoUri);

    // valor_venta 0 se conserva (no se convierte en null)
    const c2 = await c().obtenerComprasCliente(C2);
    assert.deepEqual(c2.map(x => [x.comprador, x.valor_venta]), [['Beto', 40.25], ['Ana', 0]]);
    assert.equal(c2[1].valor_venta, 0);
    const c3 = await c().obtenerComprasCliente(C3);
    assert.equal(c3.length, 1);
    assert.deepEqual([c3[0].valor_venta, c3[0].valor_envio], [null, null]);

    // Datos del ave cruzados con el modulo de aves
    for (const x of compras) {
        const ave = await aves.obtenerAvePorId(x.ave_id);
        assert.deepEqual([x.ave_codigo, x.ave_raza, x.ave_sexo, x.ave_foto_uri], [ave.codigo, ave.raza, ave.sexo, ave.foto_uri]);
        assert.equal(ave.estado, 'VENDIDA');
    }
});

prueba(G, 'debe reflejar en el cliente una venta corregida desde Finanzas', async () => {
    const { finanzas } = ctx.clientes;
    await entrarCli();
    const v1 = ventas[0];
    const antes = await c().obtenerClientePorCelular(C1);
    await finanzas.corregirVentaFinanciera({ bajaId: v1.bajaId, valorVenta: 20.25, valorEnvio: 3.1 });
    v1.vv = 20.25;
    v1.ve = 3.1;

    const lista = await c().obtenerClientes();
    const esp = clientesEsperados();
    lista.forEach((real, i) => comparaCliente(real, esp[i], `tras corregir ${esp[i].celular}`));
    const ahora = await c().obtenerClientePorCelular(C1);
    cerca(ahora.total_ventas, 20.25 + 7.5 + 0.1, 'ventas corregidas');
    cerca(ahora.total_envios, 3.1, 'envios corregidos');
    assert.notEqual(ahora.total_ventas, antes.total_ventas);
    assert.equal(ahora.total_compras, 3);
    const compras = await c().obtenerComprasCliente(C1);
    const a1 = compras.find(x => x.venta_id === v1.bajaId);
    assert.deepEqual([a1.valor_venta, a1.valor_envio], [20.25, 3.1]);
    assert.deepEqual(compras, comprasEsperadas(C1));
});

prueba(G, 'debe conservar intacto el celular codificado en la ruta (+, espacios, %, /) por HTTP crudo y usar camelCase', async () => {
    await entrarCli();
    for (const raro of ['+593 99 123 4567', ' 0991234567', '0991234567 ', 'a/b%c', '%2B', '+', '%', 'x y']) {
        const seg = encodeURIComponent(raro);
        const r1 = await http('GET', `${base()}/${seg}`, { token: ctx.A.token });
        assert.equal(r1.status, 200, `cliente ${raro}`);
        assert.equal(r1.json.success, true);
        assert.equal(r1.data.cliente, null, `cliente null ${raro}`);
        const r2 = await http('GET', `${base()}/${seg}/compras`, { token: ctx.A.token });
        assert.equal(r2.status, 200, `compras ${raro}`);
        assert.deepEqual(r2.data.compras, [], `compras [] ${raro}`);
    }
    // forma de la respuesta cruda (camelCase)
    const r = await http('GET', `${base()}/${encodeURIComponent(C2)}`, { token: ctx.A.token });
    assert.equal(r.status, 200);
    assert.deepEqual(Object.keys(r.data.cliente).sort(), ['celular', 'ciudad', 'nombre', 'totalCompras', 'totalEnvios', 'totalVentas', 'ultimaCompra']);
    const rc = await http('GET', `${base()}/${encodeURIComponent(C1)}/compras`, { token: ctx.A.token });
    assert.equal(rc.status, 200);
    assert.deepEqual(Object.keys(rc.data.compras[0]).sort(),
        ['aveCodigo', 'aveFotoUri', 'aveId', 'aveRaza', 'aveSexo', 'celular', 'ciudadDestino', 'comprador', 'cooperativaEnvio', 'detalle', 'fecha', 'valorEnvio', 'valorVenta', 'ventaId']);
    const rl = await http('GET', base(), { token: ctx.A.token });
    assert.equal(rl.status, 200);
    assert.equal(rl.data.clientes.length, 3);
});

prueba(G, 'debe responder 401 sin token y 403 FORBIDDEN con un criadero inexistente (la propiedad no distingue ajeno de inexistente, como el resto de modulos)', async () => {
    const rutas = [`${base()}`, `${base()}/${C1}`, `${base()}/${C1}/compras`];
    for (const ruta of rutas) {
        const r = await http('GET', ruta);
        assert.equal(r.status, 401, ruta);
        assert.equal(r.error, 'UNAUTHORIZED', ruta);
    }
    const falso = `/api/v1/criaderos/${FALSO}/clientes`;
    for (const ruta of [falso, `${falso}/${C1}`, `${falso}/${C1}/compras`]) {
        const r = await http('GET', ruta, { token: ctx.A.token });
        assert.equal(r.status, 403, ruta);
        assert.equal(r.error, 'FORBIDDEN', ruta);
    }
});

prueba(G, 'debe aislar clientes entre cuentas: B recibe 403, no ve los celulares de A y su venta al mismo celular no mezcla datos', async () => {
    const { aves, bajas } = ctx.clientes;
    await entrarCli();
    const snapA = { lista: await c().obtenerClientes(), c1: await c().obtenerComprasCliente(C1), uno: await c().obtenerClientePorCelular(C1) };

    const rutas = ['', `/${C1}`, `/${C1}/compras`];
    for (const r_ of rutas) {
        const r = await http('GET', `${base()}${r_}`, { token: ctx.B.token });
        ctx.tabla.push({ grupo: G, endpoint: `GET clientes${r_.replace(C1, ':celular')}`, esperado: 403, obtenido: r.status, fuga: r.status !== 403, ok: r.status === 403 && r.error === 'FORBIDDEN' });
        assert.equal(r.status, 403, `GET ${r_}`);
        assert.equal(r.error, 'FORBIDDEN', `GET ${r_}`);
    }

    // B desde su criadero: no ve nada de A
    await entrarComo(ctx.B);
    const celularesA = new Set([C1, C2, C3]);
    assert.ok(!(await c().obtenerClientes()).some(x => celularesA.has(x.celular)), 'B no ve clientes de A');
    for (const cel of celularesA) {
        assert.equal(await c().obtenerClientePorCelular(cel), null, cel);
        assert.deepEqual(await c().obtenerComprasCliente(cel), [], cel);
    }

    // B vende al mismo celular: sus datos no se mezclan con los de A
    const aveB = await aves.crearAve({ codigo: 'B-CLI-1', origen: 'COMPRADA', fechaIngreso: '2026-01-10', edadMesesCompra: 6, raza: 'Raza B', sexo: 'MACHO' });
    await bajas.registrarVentaAve({
        aveId: aveB, fechaVenta: '2001-12-31T12:00:00.000Z', celular: C1, ciudadDestino: 'Ciudad B', cooperativaEnvio: '',
        comprador: 'Comprador B', valorVenta: 5.5, valorEnvio: null, detalle: ''
    });
    const clienteB = await c().obtenerClientePorCelular(C1);
    assert.deepEqual([clienteB.nombre, clienteB.ciudad, clienteB.total_compras, clienteB.total_ventas, clienteB.total_envios, clienteB.ultima_compra],
        ['Comprador B', 'Ciudad B', 1, 5.5, 0, '2001-12-31T12:00:00.000Z']);
    const comprasB = await c().obtenerComprasCliente(C1);
    assert.equal(comprasB.length, 1);
    assert.deepEqual([comprasB[0].comprador, comprasB[0].ave_codigo, comprasB[0].ave_raza], ['Comprador B', 'B-CLI-1', 'Raza B']);

    // A queda igual
    await entrarCli();
    assert.deepEqual(await c().obtenerClientes(), snapA.lista);
    assert.deepEqual(await c().obtenerComprasCliente(C1), snapA.c1);
    assert.deepEqual(await c().obtenerClientePorCelular(C1), snapA.uno);
    assert.equal(snapA.uno.nombre, 'Juan Perez');
});
