// La URL del Worker de pruebas NUNCA va en archivos versionados. Orden de busqueda:
//   1. variable de entorno EXPO_PUBLIC_API_URL (o KIKIRIKIS_API_URL)
//   2. archivo local ignorado por Git: pruebas/.entorno.local (linea EXPO_PUBLIC_API_URL=...)
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ARCHIVO_LOCAL = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../.entorno.local');

function leerArchivoLocal() {
    if (!fs.existsSync(ARCHIVO_LOCAL)) return '';
    const linea = fs.readFileSync(ARCHIVO_LOCAL, 'utf8')
        .split(/\r?\n/)
        .map(l => l.trim())
        .find(l => /^(EXPO_PUBLIC_API_URL|KIKIRIKIS_API_URL)\s*=/.test(l));
    return linea ? linea.slice(linea.indexOf('=') + 1).trim().replace(/^["']|["']$/g, '') : '';
}

export function urlApi() {
    const url = (process.env.EXPO_PUBLIC_API_URL || process.env.KIKIRIKIS_API_URL || leerArchivoLocal())
        .trim()
        .replace(/\/+$/, '');

    if (!url) {
        console.error('Falta la URL del Worker de pruebas: define EXPO_PUBLIC_API_URL o crea pruebas/.entorno.local (ver pruebas/README.md).');
        process.exit(2);
    }

    return url;
}

export function claveAleatoria() {
    return `Aa1-${Math.random().toString(36).slice(2)}${Math.random().toString(36).slice(2)}`;
}

export const DOMINIO = 'kikirikis.test';
