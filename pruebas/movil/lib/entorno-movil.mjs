// Prepara el entorno del emulador: AVD, Expo Go (sin autoactualizacion), Metro y adb reverse.
// Reutiliza lo que ya este arrancado. Herramientas fuera del repo: C:\Android\kikirikis-tools.
import { spawn, spawnSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const raiz = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../..');
export const PUERTO_METRO = process.env.PUERTO_METRO || '8090';
export const APK = process.env.EXPO_GO_APK || 'C:/Android/kikirikis-tools/expo-go/Expo-Go-57.0.9.apk';
export const AVD = process.env.AVD || 'Medium_Phone_API_37.0';
export const LOG_METRO = path.join(raiz, 'pruebas/.cache/metro.log');

// adb sin shell y con limite de 45 s: un adb colgado (emulador sin responder) no bloquea al ejecutor para siempre.
export const adb = (...a) => spawnSync('adb', a, { encoding: 'utf8', timeout: 45000 }).stdout?.trim() ?? '';
/** Termina un proceso y todos sus hijos (Windows). */
export function matarArbol(pid) { if (pid) spawnSync('taskkill', ['/F', '/T', '/PID', String(pid)], { stdio: 'ignore', timeout: 30000 }); }
const espera = ms => new Promise(r => setTimeout(r, ms));

export function dispositivoListo() {
    return /emulator-\d+\s+device/.test(adb('devices')) && adb('shell', 'getprop', 'sys.boot_completed') === '1';
}

export async function asegurarEmulador() {
    if (dispositivoListo()) return 'reutilizado';
    spawn('emulator', ['-avd', AVD, '-no-snapshot-save', '-netdelay', 'none', '-netspeed', 'full'], { detached: true, stdio: 'ignore', shell: true }).unref();
    for (let i = 0; i < 90 && !dispositivoListo(); i++) await espera(4000);
    if (!dispositivoListo()) throw new Error('El emulador no arranco en 6 minutos');
    return 'arrancado';
}

export function asegurarExpoGo() {
    if (!adb('shell', 'pm', 'list', 'packages').includes('host.exp.exponent')) {
        if (!fs.existsSync(APK)) throw new Error(`Falta el APK de Expo Go 57 en ${APK} (ver pruebas/README.md)`);
        adb('install', '-r', APK);
    }
    adb('shell', 'pm', 'disable-user', '--user', '0', 'com.android.vending'); // evita autoactualizacion de Expo Go
    adb('shell', 'settings', 'put', 'secure', 'immersive_mode_confirmations', 'confirmed');
}

/**
 * Comprueba el emulador ANTES de lanzar Maestro: arranque completo, servicio de paquetes, adb reverse y red
 * hacia el Worker de pruebas hecha DESDE el emulador. Reintenta hasta 90 s; si no, lanza Error con la causa exacta.
 * El emulador no trae curl ni wget: se usa nc (toybox) por el puerto 80 del host del Worker, que Cloudflare
 * responde con una redireccion HTTP; eso prueba DNS, salida a Internet y que el Worker es alcanzable. El 200 de
 * /api/v1/health por HTTPS se comprueba desde el PC. La URL no se escribe en ningun mensaje.
 */
export async function verificarEntornoEmulador(urlApi, limiteMs = 90000) {
    const host = new URL(urlApi).hostname;
    const t0 = Date.now();
    let causa = 'sin comprobar';
    let tipo = 'ENTORNO';
    while (Date.now() - t0 < limiteMs) {
        causa = null;
        tipo = 'ENTORNO';
        const paquetes = adb('shell', 'pm', 'list', 'packages', '|', 'head', '-1');
        if (adb('shell', 'getprop', 'sys.boot_completed') !== '1') causa = 'el emulador no termino de arrancar (sys.boot_completed distinto de 1)';
        else if (!paquetes.startsWith('package:')) causa = `el servicio de paquetes del emulador no responde (pm list packages: "${paquetes.slice(0, 60)}")`;
        else if (!adb('reverse', '--list').includes(`tcp:${PUERTO_METRO}`)) {
            adb('reverse', `tcp:${PUERTO_METRO}`, `tcp:${PUERTO_METRO}`);
            causa = `falta adb reverse tcp:${PUERTO_METRO} (se intento crearlo)`;
        } else {
            // nc cierra al terminar stdin: se espera 3 s tras enviar para recibir la respuesta.
            const peticion = `(printf 'GET /api/v1/health HTTP/1.1\r\nHost: ${host}\r\nConnection: close\r\n\r\n'; sleep 3) | nc -w 8 ${host} 80`;
            const r = spawnSync('adb', ['shell', peticion], { encoding: 'utf8', timeout: 30000 });
            const linea = (r.stdout || '').split('\n')[0].trim();
            if (/^HTTP\/1\.[01] (200|30[1278])/.test(linea)) return { desdeEmulador: linea };
            tipo = 'RED';
            causa = linea
                ? `el Worker respondio desde el emulador algo inesperado: "${linea.slice(0, 60)}"`
                : 'sin red desde el emulador hacia el Worker de pruebas (DNS o salida a Internet: nc no obtuvo respuesta)';
        }
        await espera(3000);
    }
    const e = new Error(causa);
    e.tipo = tipo; // 'RED' si el emulador no llega al Worker; 'ENTORNO' en lo demas (emulador, adb, paquetes)
    throw e;
}

/** Proceso que escucha en el puerto de Metro y desde cuando (para comprobar que es el Metro del ejecutor). */
export function infoMetro() {
    const orden = `Get-NetTCPConnection -LocalPort ${PUERTO_METRO} -State Listen -ErrorAction SilentlyContinue | Select-Object -First 1 | ForEach-Object { $p = Get-Process -Id $_.OwningProcess; '{0}|{1}|{2}' -f $p.Id, $p.ProcessName, $p.StartTime.ToUniversalTime().ToString('o') }`;
    const r = spawnSync('powershell', ['-NoProfile', '-Command', orden], { encoding: 'utf8' });
    const [pid, nombre, inicio] = (r.stdout || '').trim().split('|');
    return pid ? { pid: Number(pid), nombre, inicioMs: Date.parse(inicio) } : null;
}

export async function metroEstado() {
    try { return `/status ${(await fetch(`http://127.0.0.1:${PUERTO_METRO}/status`)).status}`; } catch (e) { return `/status sin respuesta (${e.message})`; }
}

async function metroVivo() {
    try { return (await fetch(`http://127.0.0.1:${PUERTO_METRO}/status`)).ok; } catch { return false; }
}

export async function asegurarMetro(urlApi) {
    adb('reverse', `tcp:${PUERTO_METRO}`, `tcp:${PUERTO_METRO}`);
    // Metro en modo CI no recarga: un Metro viejo serviria codigo desfasado. Se reinicia siempre
    // (solo el del puerto de pruebas); REUSAR_METRO=1 lo conserva.
    if (await metroVivo()) {
        if (process.env.REUSAR_METRO === '1') return 'reutilizado';
        spawnSync('powershell', ['-NoProfile', '-Command', `Get-NetTCPConnection -LocalPort ${PUERTO_METRO} -State Listen -ErrorAction SilentlyContinue | ForEach-Object { Stop-Process -Id $_.OwningProcess -Force }`]);
        for (let i = 0; i < 10 && (await metroVivo()); i++) await espera(1000);
    }
    fs.mkdirSync(path.dirname(LOG_METRO), { recursive: true });
    const salida = fs.openSync(LOG_METRO, 'w');
    // Cabecera propia: el log nunca queda vacio (Expo en modo CI casi no escribe) y deja constancia de quien lo arranco.
    fs.writeSync(salida, `[ejecutor ${new Date().toISOString()}] arrancando Metro en el puerto ${PUERTO_METRO} (pid del ejecutor ${process.pid})\n`);
    spawn('npx', ['expo', 'start', '--port', PUERTO_METRO, '--offline'], {
        cwd: raiz, detached: true, stdio: ['ignore', salida, salida], shell: true,
        env: { ...process.env, CI: '1', EXPO_NO_TELEMETRY: '1', EXPO_NO_TYPESCRIPT_SETUP: '1', EXPO_DEBUG: '1', EXPO_PUBLIC_DATA_SOURCE: 'api', EXPO_PUBLIC_API_URL: urlApi }
    }).unref();
    for (let i = 0; i < 60 && !(await metroVivo()); i++) await espera(2000);
    if (!(await metroVivo())) throw new Error(`Metro no respondio en el puerto ${PUERTO_METRO} (log: ${LOG_METRO})`);
    return 'arrancado';
}

function rutaEmulador() {
    const candidatas = [process.env.ANDROID_HOME, process.env.ANDROID_SDK_ROOT, 'C:/Android/Sdk'].filter(Boolean).map(d => path.join(d, 'emulator', 'emulator.exe'));
    return candidatas.find(c => fs.existsSync(c)) ?? 'emulator';
}

/**
 * Recupera el emulador colgado: adb emu kill SOLO de emulator-5554, arranque con Start-Process (desde bash con & muere con la
 * tarea), espera al arranque y repite la comprobacion de entorno. Lanza Error con la causa si no se recupera.
 */
export async function recuperarEmulador(urlApi) {
    spawnSync('adb', ['-s', 'emulator-5554', 'emu', 'kill'], { encoding: 'utf8', timeout: 30000 });
    for (let i = 0; i < 15 && /emulator-5554/.test(adb('devices')); i++) await espera(2000);
    if (/emulator-5554/.test(adb('devices'))) throw new Error('adb emu kill no cerro emulator-5554 en 30 s');
    const orden = `Start-Process -FilePath '${rutaEmulador()}' -ArgumentList '-avd','${AVD}','-no-snapshot-save','-netdelay','none','-netspeed','full' -WindowStyle Minimized`;
    spawnSync('powershell', ['-NoProfile', '-Command', orden], { timeout: 30000 });
    for (let i = 0; i < 90 && !dispositivoListo(); i++) await espera(4000);
    if (!dispositivoListo()) throw new Error('el emulador no arranco en 6 minutos tras adb emu kill');
    asegurarExpoGo();
    await verificarEntornoEmulador(urlApi);
}

/**
 * Termina Maestro (java) y su servidor en el emulador. taskkill /T no alcanza a java porque bash de Git rompe el
 * arbol de procesos en Windows: sin esto, un flujo colgado deja a Maestro vivo y los flujos siguientes fallan al instante.
 */
export async function matarMaestro() {
    const orden = "Get-CimInstance Win32_Process -Filter \"Name='java.exe'\" | Where-Object { $_.CommandLine -match 'maestro\.cli\.AppKt' } | ForEach-Object { Stop-Process -Id $_.ProcessId -Force }";
    spawnSync('powershell', ['-NoProfile', '-Command', orden], { stdio: 'ignore', timeout: 30000 });
    // Un force-stop deja el servidor de Maestro del emulador en un estado en el que el flujo siguiente falla al conectar;
    // desinstalar sus dos paquetes hace que Maestro los reinstale limpios al empezar (comprobado en el emulador).
    adb('shell', 'am', 'force-stop', 'dev.mobile.maestro');
    adb('uninstall', 'dev.mobile.maestro');
    adb('uninstall', 'dev.mobile.maestro.test');
    // Espera por condicion: sin proceso de Maestro en el emulador ni en el PC antes de lanzar el flujo siguiente.
    for (let i = 0; i < 15; i++) {
        const enEmulador = adb('shell', 'ps', '-A').includes('dev.mobile.maestro');
        const enPc = spawnSync('powershell', ['-NoProfile', '-Command', "@(Get-CimInstance Win32_Process -Filter \"Name='java.exe'\" | Where-Object { $_.CommandLine -match 'maestro\.cli\.AppKt' }).Count"], { encoding: 'utf8', timeout: 30000 }).stdout.trim() !== '0';
        if (!enEmulador && !enPc) break;
        await espera(2000);
    }
    return await restaurarMaestro();
}

/**
 * Tras matar Maestro, el primer intento de conectar puede fallar ("Device server died ... UNAVAILABLE"). Se lanza un flujo
 * minimo hasta que Maestro conecte (maximo 4 intentos, reinstalando su servidor entre intentos). Devuelve true si conecto.
 */
async function restaurarMaestro() {
    const flujo = path.join(raiz, 'pruebas/movil/lib/calentar-maestro.yaml');
    const salida = fs.mkdtempSync(path.join(os.tmpdir(), 'kikirikis-maestro-'));
    try {
        for (let intento = 1; intento <= 4; intento++) {
            const r = spawnSync('bash', ['-c', 'export PATH="$PATH:/c/Android/kikirikis-tools/maestro/maestro/bin"; maestro test --test-output-dir "$1" "$2"', '_', salida, flujo], { encoding: 'utf8', timeout: 120000 });
            if (r.status === 0) return true;
            matarArbol(r.pid);
            adb('uninstall', 'dev.mobile.maestro');
            adb('uninstall', 'dev.mobile.maestro.test');
            await espera(3000);
        }
        return false;
    } finally { fs.rmSync(salida, { recursive: true, force: true }); }
}
