// Capa 2: flujos de pantalla en el emulador con Maestro.
// Uso: node pruebas/movil/ejecutar.mjs smoke|completo [--flujo=texto] [--sin-limpiar]
// Requiere EXPO_PUBLIC_API_URL en el entorno (nunca en archivos).
import fs from 'node:fs';
import path from 'node:path';
import { spawn, spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { urlApi } from '../datos/lib/entorno.mjs';
import { limpiarCuentasDesechables } from '../datos/lib/limpiar.mjs';
import { comprobarConectividadPc, tablaLatencias, PATRON_RED, contadorRed, dormir } from '../datos/lib/red.mjs';
import { asegurarEmulador, asegurarExpoGo, asegurarMetro, verificarEntornoEmulador, infoMetro, metroEstado, adb, LOG_METRO, recuperarEmulador, matarArbol, matarMaestro } from './lib/entorno-movil.mjs';

const aqui = path.dirname(fileURLToPath(import.meta.url));
const raiz = path.resolve(aqui, '../..');
const modo = process.argv[2];
if (!['smoke', 'completo'].includes(modo)) { console.error('Uso: ejecutar.mjs smoke|completo'); process.exit(2); }
const filtro = process.argv.find(a => a.startsWith('--flujo='))?.slice(8);
const sinLimpiar = process.argv.includes('--sin-limpiar');
const URL_API = urlApi();
process.env.EXPO_PUBLIC_API_URL = URL_API;
// Limites de tiempo. FLUJO_MAX_MS y EJECUCION_MAX_MS existen solo para probar estas defensas de forma controlada.
const FLUJO_MAX_MS = Number(process.env.FLUJO_MAX_MS || 6 * 60 * 1000);
const EJECUCION_MAX_MS = Number(process.env.EJECUCION_MAX_MS || 60 * 60 * 1000);

const p = n => String(n).padStart(2, '0');
const d = new Date();
// Una carpeta por ejecucion (hora completa y modo); si existiera, se anade un sufijo: nunca se sobrescribe otra.
const base = `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}-${p(d.getHours())}${p(d.getMinutes())}${p(d.getSeconds())}-${modo}`;
let carpeta = path.join(raiz, 'pruebas/informes', base);
for (let n = 2; fs.existsSync(carpeta); n++) carpeta = path.join(raiz, 'pruebas/informes', `${base}-${n}`);
fs.mkdirSync(carpeta, { recursive: true });

function listarFlujos() {
    const dirs = process.env.FALLO_PROVOCADO ? ['demo'] : (modo === 'smoke' ? ['smoke'] : ['completo', 'esperado-fallar']);
    const salida = [];
    for (const dir of dirs) {
        const base = path.join(aqui, 'flujos', dir);
        if (!fs.existsSync(base)) continue; // esperado-fallar desaparece cuando ya no queda nada por migrar
        for (const f of fs.readdirSync(base).filter(f => f.endsWith('.yaml')).sort()) {
            const texto = fs.readFileSync(path.join(base, f), 'utf8');
            const tags = [...(texto.split('\n---')[0].match(/^\s+- ([\w-]+)$/gm) ?? [])].map(t => t.replace(/^\s+- /, ''));
            if (filtro && !f.includes(filtro)) continue;
            salida.push({
                nombre: `${dir}/${f}`,
                archivo: path.join(base, f),
                esperadoFallar: tags.includes('esperado-fallar'),
                modulo: texto.match(/^# ESPERADO FALLAR [(]([^)]+)[)]/m)?.[1] ?? null,
                // '# SEGUNDA-CUENTA' en el flujo pide una segunda cuenta desechable vacia (EMAIL2, PASSWORD2, CRIADERO2).
                semilla: [...(texto.match(/^# SEMILLA: (.*)$/m)?.[1] ?? '').split(' ').filter(Boolean), ...(/^# SEGUNDA-CUENTA/m.test(texto) ? ['--segunda-cuenta'] : [])]
            });
        }
    }
    return salida;
}

// Lanza un flujo con limite de tiempo. El registro de Maestro se escribe a medida que sale. Al vencer el limite se termina
// todo el arbol de procesos (bash, maestro y java), no solo bash.
function lanzarFlujo(flujo, dirMaestro, limiteMs) {
    return new Promise(resolve => {
        const fd = fs.openSync(path.join(dirMaestro, 'maestro.log'), 'w');
        let salida = '';
        let colgado = false;
        let terminado = false;
        let relojCierre = null;
        const hijo = spawn('bash', [path.join(aqui, 'ejecutar-flujo.sh'), flujo.archivo, ...flujo.semilla], {
            env: { ...process.env, SALIDA_MAESTRO: dirMaestro }, stdio: ['ignore', 'pipe', 'pipe'], windowsHide: true
        });
        const escribir = texto => { if (!terminado) { salida += texto; fs.writeSync(fd, texto); } };
        const fin = status => {
            if (terminado) return;
            clearTimeout(reloj); clearTimeout(relojCierre);
            terminado = true;
            fs.closeSync(fd);
            resolve({ status, salida, colgado });
        };
        const reloj = setTimeout(async () => {
            colgado = true;
            escribir(`\n[ejecutor ${new Date().toISOString()}] flujo colgado: supero ${Math.round(limiteMs / 1000)} s; se termina el arbol de procesos\n`);
            matarArbol(hijo.pid);
            await matarMaestro();
            fin(null);
        }, limiteMs);
        hijo.stdout.on('data', b => escribir(b.toString('utf8')));
        hijo.stderr.on('data', b => escribir(b.toString('utf8')));
        // Si el flujo se colgo, el resultado se entrega solo cuando termina la limpieza de Maestro (no se solapa con el flujo siguiente).
        hijo.on('close', code => { if (!colgado) fin(code); });
        hijo.on('error', e => { escribir(String(e)); fin(1); });
    });
}

async function correrFlujo(flujo, limiteMs, intento = 1) {
    const dirMaestro = path.join(carpeta, flujo.nombre.replace(/[\/]/g, '__').replace('.yaml', ''));
    fs.mkdirSync(dirMaestro, { recursive: true });
    const t0 = Date.now();
    const r = await lanzarFlujo(flujo, dirMaestro, limiteMs);
    const salida = r.salida;
    const infra = r.status !== 0 && !r.colgado && /ConnectException|Connection timed out|Unable to launch|UNAVAILABLE|device offline|No connected devices/.test(salida);
    if (infra && intento < 2) { adb('reconnect'); return correrFlujo(flujo, Math.max(1000, limiteMs - (Date.now() - t0)), intento + 1); }
    return { r: { status: r.status }, salida, dirMaestro, seg: Math.round((Date.now() - t0) / 1000), infra, intentos: intento, colgado: r.colgado };
}

const t0 = Date.now();
// Comprobacion previa de conectividad PC -> Worker: 10 GET /health separadas 3 s, exige >= 9 respuestas 200.
// Si no se cumple: espera 5 min y repite hasta 3 veces; despues aborta con FALLO DE RED sin lanzar flujos.
// SIN_PRECOMPROBACION_RED=1 (y RED_* para acortar tiempos) existen solo para probar este ejecutor de forma controlada.
const SIN_PRECOMPROBACION = process.env.SIN_PRECOMPROBACION_RED === '1';
const conectividad = { intentos: [] };
if (!SIN_PRECOMPROBACION) {
    const REPETICIONES = 3;
    const ESPERA_MS = Number(process.env.RED_ESPERA_MS || 5 * 60 * 1000);
    for (let intento = 0; intento <= REPETICIONES; intento++) {
        const c = await comprobarConectividadPc(URL_API, {
            peticiones: Number(process.env.RED_PETICIONES || 10),
            separacionMs: Number(process.env.RED_SEPARACION_MS || 3000),
            minimo: Number(process.env.RED_MINIMO || 9)
        });
        conectividad.intentos.push(c);
        if (c.ok) break;
        console.log(`Conectividad insuficiente: ${c.oks} de ${c.filas.length} respuestas 200 (comprobacion ${intento + 1}).`);
        if (intento === REPETICIONES) {
            const causa = `el PC no alcanza el Worker de pruebas: ${c.oks} de ${c.filas.length} peticiones dieron 200 tras ${intento + 1} comprobaciones`;
            const lineas = ['EJECUCIÓN INCOMPLETA POR RED', '', `# Flujos moviles (${modo}) - ${new Date().toISOString()}`, '', `FALLO DE RED: ${causa}`, `Hora: ${new Date().toISOString()}`, 'No se lanzo ningun flujo.', '',
                ...conectividad.intentos.flatMap((x, i) => [`## Comprobacion ${i + 1}`, '', ...tablaLatencias(x), ''])];
            fs.writeFileSync(path.join(carpeta, 'resumen.md'), lineas.join('\n'));
            console.log(lineas.join('\n'));
            console.log(`Informe: ${path.relative(process.cwd(), carpeta)}`);
            process.exit(1);
        }
        await dormir(ESPERA_MS);
    }
}
const entorno = { emulador: await asegurarEmulador() };
asegurarExpoGo();
entorno.metro = await asegurarMetro(URL_API);
try {
    entorno.red = SIN_PRECOMPROBACION ? 'omitida (prueba controlada del ejecutor)' : (await verificarEntornoEmulador(URL_API)).desdeEmulador;
    const metro = infoMetro();
    if (!metro) throw new Error('nadie escucha en el puerto de Metro');
    if (entorno.metro === 'arrancado' && metro.inicioMs < t0 - 5000) throw new Error(`el Metro que sirve la app (pid ${metro.pid}) no es el que arranco el ejecutor`);
    entorno.metroInfo = `pid ${metro.pid} (${metro.nombre}), desde ${new Date(metro.inicioMs).toISOString()}`;
} catch (e) {
    const msg = `${e.tipo === 'RED' ? 'FALLO DE RED' : 'FALLO DE ENTORNO'}: ${e.message}`;
    fs.writeFileSync(path.join(carpeta, 'resumen.md'), `${e.tipo === 'RED' ? 'EJECUCIÓN INCOMPLETA POR RED' + String.fromCharCode(10) + String.fromCharCode(10) : ''}# Flujos moviles (${modo}) - ${new Date().toISOString()}

${msg}
`);
    console.log(`${msg}
Informe: ${path.relative(process.cwd(), carpeta)}`);
    process.exit(1);
}

// wrangler tail acotado a la ejecucion (solo diagnostico de fallos de API; --env test).
const tailLog = path.join(carpeta, 'wrangler-tail.log');
const tail = spawn('npx', ['wrangler', 'tail', '--env', 'test', '--format', 'pretty'], {
    cwd: path.join(raiz, 'api'), shell: true, stdio: ['ignore', fs.openSync(tailLog, 'w'), 'ignore']
});

// Texto visible en el emulador (uiautomator) y, si Expo Go muestra "Something went wrong", abre "View error log" y lo vuelca.
function textosPantalla() {
    adb('shell', 'uiautomator', 'dump', '/sdcard/kikirikis-ui.xml');
    const xml = spawnSync('adb', ['exec-out', 'cat', '/sdcard/kikirikis-ui.xml'], { encoding: 'utf8', maxBuffer: 16 * 1024 * 1024, timeout: 30000 }).stdout ?? '';
    return { xml, textos: [...xml.matchAll(/text="([^"]+)"/g)].map(m => m[1]) };
}

async function evidenciaExpoGo(dir) {
    const antes = textosPantalla();
    const lineas = [`Estado de Metro: ${await metroEstado()}`, `adb reverse: ${adb('reverse', '--list').replace(/\s+/g, ' ')}`, '', 'Textos en pantalla:', ...antes.textos.map(t => '  ' + t)];
    const m = antes.xml.match(/text="View error log"[^>]*bounds="\[(\d+),(\d+)\]\[(\d+),(\d+)\]"/) || antes.xml.match(/bounds="\[(\d+),(\d+)\]\[(\d+),(\d+)\]"[^>]*text="View error log"/);
    if (m) {
        adb('shell', 'input', 'tap', String(Math.round((+m[1] + +m[3]) / 2)), String(Math.round((+m[2] + +m[4]) / 2)));
        await new Promise(r => setTimeout(r, 2500));
        lineas.push('', 'Texto del error log de Expo Go:', ...textosPantalla().textos.map(t => '  ' + t));
    } else lineas.push('', '(no aparecio "View error log" en la pantalla)');
    fs.writeFileSync(path.join(dir, 'expo-go-error.txt'), lineas.join('\n'));
}

function guardarEvidencia(x, offsetMetro, ini) {
    const sal = ruta => path.join(x.dirMaestro, ruta);
    fs.writeFileSync(sal('pantalla-final.png'), spawnSync('adb', ['exec-out', 'screencap', '-p'], { maxBuffer: 32 * 1024 * 1024, timeout: 30000 }).stdout ?? Buffer.alloc(0));
    fs.writeFileSync(sal('logcat.txt'), spawnSync('adb', ['logcat', '-d', '-v', 'time', 'ReactNativeJS:V', 'AndroidRuntime:E', '*:S'], { encoding: 'utf8', maxBuffer: 32 * 1024 * 1024, timeout: 30000 }).stdout ?? '');
    if (fs.existsSync(LOG_METRO)) {
        const completo = fs.readFileSync(LOG_METRO);
        const nuevo = completo.subarray(offsetMetro).toString('utf8');
        fs.writeFileSync(sal('metro.txt'), [
            `# Log completo de Metro (${completo.length} bytes; ${offsetMetro} ya existian al empezar el flujo).`,
            nuevo.trim() ? '# Salida escrita durante el flujo:' : '# Metro no escribio nada durante el flujo (en modo CI casi no registra; no significa que estuviera caido: ver el estado en expo-go-error.txt).',
            '', completo.toString('utf8'), nuevo.trim() ? `\n# --- solo durante el flujo ---\n${nuevo}` : ''
        ].join('\n'));
    }
    fs.writeFileSync(sal('intervalo.txt'), `${ini} -> ${new Date().toISOString()} (cruzar con wrangler-tail.log)\n`);
}

const lista = listarFlujos();
const resultados = [];
const recuperaciones = [];
let abortar = null;
let abortarRed = null;
let abortarTiempo = null;
let redSeguidos = 0;
let entornoSeguidos = 0;
let reintentosPreparar = 0;
let limpieza = null;
const hora = () => new Date().toISOString();
const eventos = path.join(carpeta, 'eventos.log');
const evento = texto => fs.appendFileSync(eventos, `${hora()} ${texto}\n`);

// Registros que se guardan a medida que se generan (una ejecucion colgada o abortada nunca queda con solo resumen.md):
// maestro.log y capturas de Maestro (por flujo), wrangler-tail.log, logcat-continuo.txt, metro.txt y eventos.log.
let logcatContinuo = null;
function iniciarLogcat() {
    const fd = fs.openSync(path.join(carpeta, 'logcat-continuo.txt'), 'a');
    logcatContinuo = spawn('adb', ['logcat', '-v', 'time', 'ReactNativeJS:V', 'AndroidRuntime:E', '*:S'], { stdio: ['ignore', fd, 'ignore'], windowsHide: true });
    logcatContinuo.on('error', () => { /* sin adb: el resumen lo dira */ });
}
function copiarMetro() {
    try { if (fs.existsSync(LOG_METRO)) fs.copyFileSync(LOG_METRO, path.join(carpeta, 'metro.txt')); } catch { /* en uso: se copia tras el siguiente flujo */ }
}
function detenerProcesos() {
    // Primero el arbol completo (cmd, npx, node de wrangler); con tail.kill() antes se pierde el vinculo con los hijos y quedan vivos.
    try { matarArbol(tail.pid); } catch { /* ya terminado */ }
    try { if (logcatContinuo) matarArbol(logcatContinuo.pid); } catch { /* ya terminado */ }
}
iniciarLogcat();

// Escribe resumen.md y resultados.json. Se llama tras CADA flujo (parcial) y al final.
function escribirResumen(final) {
    const cuenta = e => resultados.filter(r => r.estado === e).length;
    const limpiezaRed = Boolean(limpieza) && !limpieza.ok && PATRON_RED.test(String(limpieza.detalle ?? ''));
    const fallosRed = cuenta('FALLO DE RED') + (limpiezaRed ? 1 : 0);
    const reintentosRed = reintentosPreparar + contadorRed.reintentos;
    const regresiones = cuenta('REGRESION') + cuenta('FALLO DE ENTORNO');
    const total = ((Date.now() - t0) / 1000 / 60).toFixed(1);
    const pendientes = [...new Set(resultados.filter(r => r.estado === 'FALLO COMO SE ESPERABA' && r.modulo).map(r => r.modulo))];
    const lineaPendiente = pendientes.length ? `PENDIENTE DE MIGRAR: ${pendientes.join(', ')}` : null;
    let veredicto;
    if (!final) veredicto = 'EN CURSO';
    else if (regresiones > 0) veredicto = 'ROJO';
    else if (abortarTiempo) veredicto = 'ABORTADA POR TIEMPO (no es verde)';
    else if (fallosRed > 0) veredicto = 'INCOMPLETA POR RED (no es verde)';
    else veredicto = pendientes.length ? 'SIN REGRESIONES, CON MODULOS PENDIENTES (no es verde)' : 'VERDE';
    const resumen = [
        ...(abortarTiempo ? ['EJECUCIÓN ABORTADA POR TIEMPO', ''] : []),
        ...(final ? [] : [`RESUMEN PARCIAL: ${resultados.length} de ${lista.length} flujos ejecutados (se reescribe tras cada flujo)`, '']),
        ...(fallosRed ? ['EJECUCIÓN INCOMPLETA POR RED', ''] : []),
        ...(lineaPendiente ? [lineaPendiente, ''] : []),
        `# Flujos moviles (${modo}) - ${hora()}`,
        '',
        ...(abortarTiempo ? [`EJECUCIÓN ABORTADA POR TIEMPO: ${abortarTiempo}. Los flujos restantes no se lanzaron; se ejecutaron ${resultados.length} de ${lista.length}.`, ''] : []),
        ...(abortarRed ? [`FALLO DE RED: ${abortarRed}. Ejecucion abortada; los flujos restantes no se lanzaron.`, ''] : []),
        ...(abortar ? [`FALLO DE ENTORNO: ${abortar}. Ejecucion abortada; los flujos restantes no se lanzaron.`, ''] : []),
        `Resultado: **${veredicto}** en ${total} min. Entorno: emulador ${entorno.emulador}, Metro ${entorno.metro} (${entorno.metroInfo ?? 'sin datos'}), red desde el emulador: ${entorno.red ?? 'sin datos'}.`,
        `Paso: ${cuenta('PASO')} | Regresion: ${cuenta('REGRESION')} | Fallo de red: ${cuenta('FALLO DE RED')} | Entorno: ${cuenta('FALLO DE ENTORNO')} | Fallo como se esperaba: ${cuenta('FALLO COMO SE ESPERABA')} | Migrado, quitar etiqueta: ${cuenta('MIGRADO, QUITAR ETIQUETA')}`,
        `Reintentos de red: ${reintentosRed} (preparacion por API ${reintentosPreparar}, limpieza ${contadorRed.reintentos})`,
        `Recuperaciones del emulador: ${recuperaciones.length ? recuperaciones.join('; ') : 'ninguna'}. Limites: ${Math.round(FLUJO_MAX_MS / 1000)} s por flujo, ${Math.round(EJECUCION_MAX_MS / 1000)} s por ejecucion.`,
        limpieza ? `Limpieza de cuentas desechables: ${limpieza.ok ? 'hecha' : 'FALLO'}${limpiezaRed ? ' POR RED (ejecutar: node pruebas/datos/ejecutar.mjs --solo-limpiar)' : ''} ${JSON.stringify(limpieza.recuento ?? limpieza.detalle ?? '')}` : 'Limpieza de cuentas desechables: pendiente (la ejecucion no ha terminado)',
        '',
        '| Flujo | Resultado | Segundos | Detalle |', '|---|---|---|---|',
        ...resultados.map(r => `| ${r.flujo} | ${r.estado} | ${r.seg} | ${r.falla.replace(/\|/g, '/')} |`),
        '',
        ...(conectividad.intentos.length ? ['', ...tablaLatencias(conectividad.intentos[conectividad.intentos.length - 1]), ''] : []),
        'En cada flujo fallido: capturas de Maestro, pantalla-final.png, logcat.txt, metro.txt e intervalo.txt (cruzar con wrangler-tail.log). En toda la ejecucion: logcat-continuo.txt, metro.txt, wrangler-tail.log y eventos.log, escritos a medida que se generan.'
    ];
    fs.writeFileSync(path.join(carpeta, 'resumen.md'), resumen.join('\n'));
    fs.writeFileSync(path.join(carpeta, 'resultados.json'), JSON.stringify({ modo, final, entorno, resultados, recuperaciones, abortarTiempo, limpieza, reintentosRed, conectividad }, null, 2));
    return { veredicto, regresiones, fallosRed, cuenta, total, lineaPendiente };
}

for (const senal of ['SIGINT', 'SIGTERM']) {
    process.on(senal, () => { evento(`senal ${senal}: ejecucion interrumpida`); detenerProcesos(); escribirResumen(false); process.exit(130); });
}
escribirResumen(false);

for (const [indice, flujo] of lista.entries()) {
    const restante = EJECUCION_MAX_MS - (Date.now() - t0);
    if (restante <= 0) {
        abortarTiempo = `se superaron ${Math.round(EJECUCION_MAX_MS / 1000)} s de ejecucion antes de lanzar ${flujo.nombre} (hora ${hora()})`;
        console.log(`EJECUCIÓN ABORTADA POR TIEMPO: ${abortarTiempo}`);
        break;
    }
    const limite = Math.min(FLUJO_MAX_MS, restante);
    const offsetMetro = fs.existsSync(LOG_METRO) ? fs.statSync(LOG_METRO).size : 0;
    adb('logcat', '-c');
    const ini = hora();
    evento(`inicio ${flujo.nombre} (limite ${Math.round(limite / 1000)} s)`);
    const x = await correrFlujo(flujo, limite);
    const colgado = x.colgado;
    const paso = x.r.status === 0 && !colgado;
    // Fallo al abrir la app (nunca llego a una pantalla de la app): es de entorno, no una regresion.
    const abrirFallo = !paso && !colgado && /abrir-app\.yaml\.\.\. FAILED|"Continue" is visible\.\.\. FAILED/.test(x.salida);
    // Fallo de RED hacia el Worker: la preparacion por API no conecta (fetch failed, ConnectTimeoutError, ...) o la app/el
    // emulador no alcanzan el Worker. Nunca se asigna a respuestas HTTP 4xx/5xx ni a fallos de pantalla con la red sana.
    const lineaRed = x.salida.split('\n').find(l => /ENOTFOUND|ConnectTimeoutError|UND_ERR_CONNECT_TIMEOUT|ECONNRESET|EAI_AGAIN/.test(l)) ?? x.salida.split(String.fromCharCode(10)).find(l => PATRON_RED.test(l));
    const redPreparar = !paso && !colgado && x.r.status === 3 && Boolean(lineaRed);
    for (const m of x.salida.matchAll(/\[red\] reintentos=(\d+)/g)) reintentosPreparar += Number(m[1]);
    let redPantalla = null;
    if (!paso && !colgado && !abrirFallo && !redPreparar && !flujo.esperadoFallar) {
        if (textosPantalla().textos.some(t => /No fue posible conectar con el servidor/.test(t))) redPantalla = 'la app muestra "No fue posible conectar con el servidor"';
        else {
            try { await verificarEntornoEmulador(URL_API, 1); } catch (e) { if (e.tipo === 'RED') redPantalla = `el emulador no alcanza el Worker (${e.message})`; }
        }
    }
    const redFallo = Boolean(redPreparar || redPantalla);
    let estado;
    if (colgado) estado = 'FALLO DE ENTORNO';
    else if (redFallo) estado = 'FALLO DE RED';
    else if (flujo.esperadoFallar) estado = paso ? 'MIGRADO, QUITAR ETIQUETA' : 'FALLO COMO SE ESPERABA';
    else estado = paso ? 'PASO' : ((x.infra || abrirFallo) ? 'FALLO DE ENTORNO' : 'REGRESION');
    if (!paso) guardarEvidencia(x, offsetMetro, ini);
    if (abrirFallo) await evidenciaExpoGo(x.dirMaestro);
    copiarMetro();
    const falla = colgado
        ? `flujo colgado: supero ${Math.round(limite / 1000)} s (terminado a las ${hora()})`
        : (redPreparar ? lineaRed.trim().slice(0, 220) : (redPantalla || '')) || x.salida.split('\n').filter(l => /FAILED|not found|is false/.test(l)).slice(0, 2).join(' | ').slice(0, 220);
    resultados.push({ flujo: flujo.nombre, modulo: flujo.modulo, estado, seg: x.seg, intentos: x.intentos, falla: paso ? '' : falla });
    console.log(`${estado.padEnd(26)} ${flujo.nombre} (${x.seg} s)${paso ? '' : '\n   ' + falla}`);
    evento(`fin ${flujo.nombre}: ${estado} (${x.seg} s)`);
    redSeguidos = redFallo ? redSeguidos + 1 : 0;
    entornoSeguidos = estado === 'FALLO DE ENTORNO' ? entornoSeguidos + 1 : 0;
    if (colgado && limite < FLUJO_MAX_MS) abortarTiempo = `se superaron ${Math.round(EJECUCION_MAX_MS / 1000)} s de ejecucion durante ${flujo.nombre} (hora ${hora()})`;
    escribirResumen(false);
    if (abortarTiempo) {
        console.log(`EJECUCIÓN ABORTADA POR TIEMPO: ${abortarTiempo}`);
        break;
    }
    if (redSeguidos >= 2) {
        abortarRed = `dos flujos seguidos no alcanzan el Worker (${redPreparar ? lineaRed.trim().slice(0, 160) : redPantalla}); se ejecutaron ${resultados.length} flujos`;
        console.log(`FALLO DE RED: ${abortarRed}. Se aborta la ejecucion.`);
        break;
    }
    if (abrirFallo && indice === 0) {
        abortar = 'el primer flujo no pudo abrir la app en Expo Go (abrir-app.yaml)';
        console.log(`FALLO DE ENTORNO: ${abortar}. Se aborta la ejecucion (ver expo-go-error.txt, logcat.txt y metro.txt en ${path.relative(process.cwd(), x.dirMaestro)}).`);
        break;
    }
    if (entornoSeguidos >= 2) {
        if (recuperaciones.length === 0) {
            console.log('Dos flujos seguidos con FALLO DE ENTORNO: se intenta recuperar el emulador una vez (solo emulator-5554).');
            evento('recuperando el emulador (adb emu kill y arranque con Start-Process)');
            const tr = Date.now();
            matarArbol(logcatContinuo?.pid);
            try {
                await recuperarEmulador(URL_API);
                recuperaciones.push(`recuperado en ${Math.round((Date.now() - tr) / 1000)} s tras ${resultados.length} flujos`);
                evento(`emulador recuperado en ${Math.round((Date.now() - tr) / 1000)} s`);
                iniciarLogcat();
                entornoSeguidos = 0;
            } catch (e) {
                recuperaciones.push(`NO se recupero: ${e.message}`);
                abortar = `dos flujos seguidos con FALLO DE ENTORNO y el emulador no se recupero (${e.message})`;
                console.log(`FALLO DE ENTORNO: ${abortar}. Se aborta la ejecucion.`);
                break;
            }
        } else {
            abortar = 'dos flujos seguidos con FALLO DE ENTORNO tras haber recuperado el emulador una vez';
            console.log(`FALLO DE ENTORNO: ${abortar}. Se aborta la ejecucion.`);
            break;
        }
    }
}
detenerProcesos();

limpieza = sinLimpiar ? { ok: true, detalle: 'omitida' } : limpiarCuentasDesechables();
const { veredicto, regresiones, fallosRed, cuenta, total, lineaPendiente } = escribirResumen(true);
if (abortarTiempo) console.log('EJECUCIÓN ABORTADA POR TIEMPO');
if (fallosRed) console.log('EJECUCIÓN INCOMPLETA POR RED');
if (lineaPendiente) console.log(`\n${lineaPendiente}`);
console.log(`\n${veredicto} (${modo}): ${cuenta('PASO')} pasaron, ${regresiones} regresiones, ${cuenta('FALLO COMO SE ESPERABA')} fallos esperados, ${cuenta('MIGRADO, QUITAR ETIQUETA')} para quitar etiqueta, ${total} min`);
console.log(`Informe: ${path.relative(process.cwd(), carpeta)}`);
process.exit(regresiones === 0 && fallosRed === 0 && !abortarTiempo ? 0 : 1);
