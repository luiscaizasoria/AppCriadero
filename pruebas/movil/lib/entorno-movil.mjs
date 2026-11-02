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

async function metroVivo() {
    try { return (await fetch(`http://127.0.0.1:${PUERTO_METRO}/status`)).ok; } catch { return false; }
}

export async function asegurarMetro(urlApi) {
    adb('reverse', `tcp:${PUERTO_METRO}`, `tcp:${PUERTO_METRO}`);
    if (await metroVivo()) return 'reutilizado';
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
