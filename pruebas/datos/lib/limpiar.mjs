// Borra SOLO las cuentas desechables (@kikirikis.test) y sus datos en criadero-kikirikis-test.
// Nunca toca otros usuarios. Dos llamadas a wrangler con --env test (aprobado por el usuario).
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { DOMINIO } from './entorno.mjs';

const raiz = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../..');
const cwd = path.join(raiz, 'api');

const U = `SELECT id FROM users WHERE email LIKE '%@${DOMINIO}'`;
const CR = `SELECT id FROM criaderos WHERE user_id IN (${U})`;

const SQL = [
    `DELETE FROM ave_historial WHERE criadero_id IN (${CR});`,
    `DELETE FROM jaula_historial WHERE criadero_id IN (${CR});`,
    `DELETE FROM ave_evolucion WHERE criadero_id IN (${CR});`,
    `DELETE FROM tratamientos_ave WHERE criadero_id IN (${CR});`,
    `DELETE FROM diagnosticos_ave WHERE criadero_id IN (${CR});`,
    `UPDATE aves SET padre_id=NULL, madre_id=NULL WHERE criadero_id IN (${CR});`,
    `DELETE FROM aves WHERE criadero_id IN (${CR});`,
    `DELETE FROM alimentacion_jaula WHERE criadero_id IN (${CR});`,
    `DELETE FROM bebida_jaula WHERE criadero_id IN (${CR});`,
    `DELETE FROM sanidad_jaula WHERE criadero_id IN (${CR});`,
    `DELETE FROM jaulas WHERE criadero_id IN (${CR});`,
    `DELETE FROM catalogo_items WHERE criadero_id IN (${CR});`,
    `DELETE FROM criadero_configuracion WHERE criadero_id IN (${CR});`,
    `DELETE FROM criaderos WHERE user_id IN (${U});`,
    `DELETE FROM users WHERE email LIKE '%@${DOMINIO}';`
].join('\n');

const CONSULTA = [
    'SELECT (SELECT count(*) FROM users) users',
    `(SELECT count(*) FROM users WHERE email LIKE '%@${DOMINIO}') desechables`,
    '(SELECT count(*) FROM criaderos) criaderos',
    '(SELECT count(*) FROM jaulas) jaulas',
    '(SELECT count(*) FROM aves) aves',
    '(SELECT count(*) FROM catalogo_items) items'
].join(', ');

function wrangler(extra) {
    return spawnSync(
        'npx',
        ['wrangler', 'd1', 'execute', 'criadero-kikirikis-test', '--remote', '--env', 'test', '--json', ...extra],
        { cwd, encoding: 'utf8', shell: true, timeout: 120000 }
    );
}

export function recuento() {
    const q = wrangler(['--command', `"${CONSULTA}"`]);
    try {
        return JSON.parse(q.stdout.slice(q.stdout.indexOf('[')))[0].results?.[0] ?? null;
    } catch {
        return null;
    }
}

export function limpiarCuentasDesechables() {
    const archivo = path.join(os.tmpdir(), `kikirikis-limpieza-${process.pid}.sql`);
    fs.writeFileSync(archivo, SQL);
    const r = wrangler(['--file', archivo]);
    fs.rmSync(archivo, { force: true });

    if (r.status !== 0) {
        return { ok: false, detalle: (r.stderr || r.stdout || '').slice(-600) };
    }

    return { ok: true, recuento: recuento() };
}

/** Ítems de catálogo de un criadero en D1 (todos los catálogos, incluidos los de onboarding). Solo lectura, --env test. */
export function itemsPorCatalogo(criaderoId) {
    if (!/^[0-9a-f-]{36}$/i.test(criaderoId)) throw new Error('criaderoId no valido');
    const consulta = `SELECT c.codigo, count(i.id) n FROM catalogos c LEFT JOIN catalogo_items i ON i.catalogo_id=c.id AND i.criadero_id='${criaderoId}' GROUP BY c.codigo ORDER BY c.codigo`;
    const q = wrangler(['--command', `"${consulta}"`]);
    const filas = JSON.parse(q.stdout.slice(q.stdout.indexOf('[')))[0].results;
    return Object.fromEntries(filas.map(f => [f.codigo, f.n]));
}
