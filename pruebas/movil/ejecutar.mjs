// Capa 2: flujos de pantalla en el emulador con Maestro.
// Uso: node pruebas/movil/ejecutar.mjs smoke|completo [--flujo=texto] [--sin-limpiar]
// Requiere EXPO_PUBLIC_API_URL en el entorno (nunca en archivos).
import fs from 'node:fs';
import path from 'node:path';
import { spawn, spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { urlApi } from '../datos/lib/entorno.mjs';
import { limpiarCuentasDesechables } from '../datos/lib/limpiar.mjs';
import { asegurarEmulador, asegurarExpoGo, asegurarMetro, verificarEntornoEmulador, adb, LOG_METRO } from './lib/entorno-movil.mjs';

const aqui = path.dirname(fileURLToPath(import.meta.url));
const raiz = path.resolve(aqui, '../..');
const modo = process.argv[2];
if (!['smoke', 'completo'].includes(modo)) { console.error('Uso: ejecutar.mjs smoke|completo'); process.exit(2); }
const filtro = process.argv.find(a => a.startsWith('--flujo='))?.slice(8);
const sinLimpiar = process.argv.includes('--sin-limpiar');
const URL_API = urlApi();
process.env.EXPO_PUBLIC_API_URL = URL_API;

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
        for (const f of fs.readdirSync(base).filter(f => f.endsWith('.yaml')).sort()) {
            const texto = fs.readFileSync(path.join(base, f), 'utf8');
            const tags = [...(texto.split('\n---')[0].match(/^\s+- ([\w-]+)$/gm) ?? [])].map(t => t.replace(/^\s+- /, ''));
            if (filtro && !f.includes(filtro)) continue;
            salida.push({
                nombre: `${dir}/${f}`,
                archivo: path.join(base, f),
                esperadoFallar: tags.includes('esperado-fallar'),
                modulo: texto.match(/^# ESPERADO FALLAR [(]([^)]+)[)]/m)?.[1] ?? null,
                semilla: (texto.match(/^# SEMILLA: (.*)$/m)?.[1] ?? '').split(' ').filter(Boolean)
            });
        }
    }
    return salida;
}

function correrFlujo(flujo, intento = 1) {
    const dirMaestro = path.join(carpeta, flujo.nombre.replace(/[\/]/g, '__').replace('.yaml', ''));
    fs.mkdirSync(dirMaestro, { recursive: true });
    const t0 = Date.now();
    const r = spawnSync('bash', [path.join(aqui, 'ejecutar-flujo.sh'), flujo.archivo, ...flujo.semilla], {
        encoding: 'utf8', maxBuffer: 64 * 1024 * 1024, timeout: 12 * 60 * 1000,
        env: { ...process.env, SALIDA_MAESTRO: dirMaestro }
    });
    const salida = `${r.stdout ?? ''}\n${r.stderr ?? ''}`;
    fs.writeFileSync(path.join(dirMaestro, 'maestro.log'), salida);
    const infra = r.status !== 0 && /ConnectException|Connection timed out|Unable to launch|UNAVAILABLE|device offline|No connected devices/.test(salida);
    if (infra && intento < 2) { adb('reconnect'); return correrFlujo(flujo, intento + 1); }
    return { r, salida, dirMaestro, seg: Math.round((Date.now() - t0) / 1000), infra, intentos: intento };
}

const t0 = Date.now();
const entorno = { emulador: await asegurarEmulador() };
asegurarExpoGo();
entorno.metro = await asegurarMetro(URL_API);
try {
    entorno.red = (await verificarEntornoEmulador(URL_API)).desdeEmulador;
} catch (e) {
    const msg = `FALLO DE ENTORNO: ${e.message}`;
    fs.writeFileSync(path.join(carpeta, 'resumen.md'), `# Flujos moviles (${modo}) - ${new Date().toISOString()}

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

function guardarEvidencia(x, offsetMetro, ini) {
    const sal = ruta => path.join(x.dirMaestro, ruta);
    fs.writeFileSync(sal('pantalla-final.png'), spawnSync('adb', ['exec-out', 'screencap', '-p'], { maxBuffer: 32 * 1024 * 1024 }).stdout);
    fs.writeFileSync(sal('logcat.txt'), spawnSync('adb', ['logcat', '-d', '-v', 'time', 'ReactNativeJS:V', 'AndroidRuntime:E', '*:S'], { encoding: 'utf8', maxBuffer: 32 * 1024 * 1024 }).stdout ?? '');
    if (fs.existsSync(LOG_METRO)) fs.writeFileSync(sal('metro.txt'), fs.readFileSync(LOG_METRO).subarray(offsetMetro));
    fs.writeFileSync(sal('intervalo.txt'), `${ini} -> ${new Date().toISOString()} (cruzar con wrangler-tail.log)\n`);
}

const resultados = [];
for (const flujo of listarFlujos()) {
    const offsetMetro = fs.existsSync(LOG_METRO) ? fs.statSync(LOG_METRO).size : 0;
    adb('logcat', '-c');
    const ini = new Date().toISOString();
    const x = correrFlujo(flujo);
    const paso = x.r.status === 0;
    let estado;
    if (flujo.esperadoFallar) estado = paso ? 'MIGRADO, QUITAR ETIQUETA' : 'FALLO COMO SE ESPERABA';
    else estado = paso ? 'PASO' : (x.infra ? 'FALLO DE ENTORNO' : 'REGRESION');
    if (!paso) guardarEvidencia(x, offsetMetro, ini);
    const falla = x.salida.split('\n').filter(l => /FAILED|not found|is false/.test(l)).slice(0, 2).join(' | ').slice(0, 220);
    resultados.push({ flujo: flujo.nombre, modulo: flujo.modulo, estado, seg: x.seg, intentos: x.intentos, falla: paso ? '' : falla });
    console.log(`${estado.padEnd(26)} ${flujo.nombre} (${x.seg} s)${paso ? '' : '\n   ' + falla}`);
}
try { tail.kill(); spawnSync('taskkill', ['/F', '/T', '/PID', String(tail.pid)]); } catch { /* ya terminado */ }

const limpieza = sinLimpiar ? { ok: true, detalle: 'omitida' } : limpiarCuentasDesechables();
const cuenta = e => resultados.filter(r => r.estado === e).length;
const regresiones = cuenta('REGRESION') + cuenta('FALLO DE ENTORNO');
const total = ((Date.now() - t0) / 1000 / 60).toFixed(1);
const pendientes = [...new Set(resultados.filter(r => r.estado === 'FALLO COMO SE ESPERABA' && r.modulo).map(r => r.modulo))];
const lineaPendiente = pendientes.length ? `PENDIENTE DE MIGRAR: ${pendientes.join(', ')}` : null;
const veredicto = regresiones > 0 ? 'ROJO' : (pendientes.length ? 'SIN REGRESIONES, CON MODULOS PENDIENTES (no es verde)' : 'VERDE');
const resumen = [
    ...(lineaPendiente ? [lineaPendiente, ''] : []),
    `# Flujos moviles (${modo}) - ${new Date().toISOString()}`,
    '',
    `Resultado: **${veredicto}** en ${total} min. Entorno: emulador ${entorno.emulador}, Metro ${entorno.metro}.`,
    `Paso: ${cuenta('PASO')} | Regresion: ${cuenta('REGRESION')} | Entorno: ${cuenta('FALLO DE ENTORNO')} | Fallo como se esperaba: ${cuenta('FALLO COMO SE ESPERABA')} | Migrado, quitar etiqueta: ${cuenta('MIGRADO, QUITAR ETIQUETA')}`,
    `Limpieza de cuentas desechables: ${limpieza.ok ? 'hecha' : 'FALLO'} ${JSON.stringify(limpieza.recuento ?? limpieza.detalle ?? '')}`,
    '',
    '| Flujo | Resultado | Segundos | Detalle |', '|---|---|---|---|',
    ...resultados.map(r => `| ${r.flujo} | ${r.estado} | ${r.seg} | ${r.falla.replace(/\|/g, '/')} |`),
    '',
    'En cada flujo fallido: capturas de Maestro, pantalla-final.png, logcat.txt, metro.txt e intervalo.txt (cruzar con wrangler-tail.log).'
];
fs.writeFileSync(path.join(carpeta, 'resumen.md'), resumen.join('\n'));
fs.writeFileSync(path.join(carpeta, 'resultados.json'), JSON.stringify({ modo, entorno, resultados, limpieza }, null, 2));
if (lineaPendiente) console.log(`
${lineaPendiente}`);
console.log(`\n${veredicto} (${modo}): ${cuenta('PASO')} pasaron, ${regresiones} regresiones, ${cuenta('FALLO COMO SE ESPERABA')} fallos esperados, ${cuenta('MIGRADO, QUITAR ETIQUETA')} para quitar etiqueta, ${total} min`);
console.log(`Informe: ${path.relative(process.cwd(), carpeta)}`);
process.exit(regresiones === 0 ? 0 : 1);
