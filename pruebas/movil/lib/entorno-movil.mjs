// Prepara el entorno del emulador: AVD, Expo Go (sin autoactualizacion), Metro y adb reverse.
// Reutiliza lo que ya este arrancado. Herramientas fuera del repo: C:\Android\kikirikis-tools.
import { spawn, spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const raiz = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../..');
export const PUERTO_METRO = process.env.PUERTO_METRO || '8090';
export const APK = process.env.EXPO_GO_APK || 'C:/Android/kikirikis-tools/expo-go/Expo-Go-57.0.9.apk';
export const AVD = process.env.AVD || 'Medium_Phone_API_37.0';
export const LOG_METRO = path.join(raiz, 'pruebas/.cache/metro.log');

const sh = (cmd, args, op = {}) => spawnSync(cmd, args, { encoding: 'utf8', shell: true, ...op });
export const adb = (...a) => sh('adb', a).stdout?.trim() ?? '';
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
        adb('install', '-r', `"${APK}"`);
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
    while (Date.now() - t0 < limiteMs) {
        causa = null;
        const paquetes = adb('shell', 'pm', 'list', 'packages', '|', 'head', '-1');
        if (adb('shell', 'getprop', 'sys.boot_completed') !== '1') causa = 'el emulador no termino de arrancar (sys.boot_completed distinto de 1)';
        else if (!paquetes.startsWith('package:')) causa = `el servicio de paquetes del emulador no responde (pm list packages: "${paquetes.slice(0, 60)}")`;
        else if (!adb('reverse', '--list').includes(`tcp:${PUERTO_METRO}`)) {
            adb('reverse', `tcp:${PUERTO_METRO}`, `tcp:${PUERTO_METRO}`);
            causa = `falta adb reverse tcp:${PUERTO_METRO} (se intento crearlo)`;
        } else {
            // nc cierra al terminar stdin: se espera 3 s tras enviar para recibir la respuesta.
            const peticion = `(printf 'GET /api/v1/health HTTP/1.1\r\nHost: ${host}\r\nConnection: close\r\n\r\n'; sleep 3) | nc -w 8 ${host} 80`;
            const r = spawnSync('adb', ['shell', peticion], { encoding: 'utf8' });
            const linea = (r.stdout || '').split('\n')[0].trim();
            if (/^HTTP\/1\.[01] (200|30[1278])/.test(linea)) return { desdeEmulador: linea };
            causa = linea
                ? `el Worker respondio desde el emulador algo inesperado: "${linea.slice(0, 60)}"`
                : 'sin red desde el emulador hacia el Worker de pruebas (DNS o salida a Internet: nc no obtuvo respuesta)';
        }
        await espera(3000);
    }
    throw new Error(causa);
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
    spawn('npx', ['expo', 'start', '--port', PUERTO_METRO, '--offline'], {
        cwd: raiz, detached: true, stdio: ['ignore', salida, salida], shell: true,
        env: { ...process.env, CI: '1', EXPO_NO_TELEMETRY: '1', EXPO_NO_TYPESCRIPT_SETUP: '1', EXPO_PUBLIC_DATA_SOURCE: 'api', EXPO_PUBLIC_API_URL: urlApi }
    }).unref();
    for (let i = 0; i < 60 && !(await metroVivo()); i++) await espera(2000);
    if (!(await metroVivo())) throw new Error(`Metro no respondio en el puerto ${PUERTO_METRO} (log: ${LOG_METRO})`);
    return 'arrancado';
}
