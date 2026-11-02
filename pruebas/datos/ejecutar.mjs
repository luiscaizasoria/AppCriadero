// Capa 1: pruebas de datos contra el Worker de pruebas con los clientes REST reales de la app.
// Uso: node pruebas/datos/ejecutar.mjs [--solo=grupo] [--sin-limpiar] [--solo-limpiar]
// Requiere EXPO_PUBLIC_API_URL en el entorno (nunca en archivos).
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { urlApi } from './lib/entorno.mjs';
import { limpiarCuentasDesechables } from './lib/limpiar.mjs';

const aqui = path.dirname(fileURLToPath(import.meta.url));
const args = process.argv.slice(2);
const sinLimpiar = args.includes('--sin-limpiar');
const filtro = args.find(a => a.startsWith('--solo='))?.slice(7);

process.env.EXPO_PUBLIC_API_URL = urlApi();
process.env.EXPO_PUBLIC_DATA_SOURCE = 'api';

function marcaTiempo() {
    const d = new Date();
    const p = n => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}-${p(d.getHours())}${p(d.getMinutes())}`;
}

if (args.includes('--solo-limpiar')) {
    console.log(JSON.stringify(limpiarCuentasDesechables(), null, 2));
    process.exit(0);
}

const t0 = Date.now();
const { cargarClientes } = await import('./lib/cliente.mjs');
const { ctx } = await import('./lib/contexto.mjs');
const { ejecutarTodo } = await import('./lib/arnes.mjs');

ctx.clientes = await cargarClientes();

for (const f of fs.readdirSync(path.join(aqui, 'casos')).filter(f => f.endsWith('.mjs')).sort()) {
    await import(`./casos/${f}`);
}

const resultados = await ejecutarTodo({ filtro });

let limpieza = { ok: true, detalle: 'omitida (--sin-limpiar)' };
if (!sinLimpiar) limpieza = limpiarCuentasDesechables();

const fallos = resultados.filter(r => r.estado === 'fallo');
const fuga = ctx.tabla.some(f => f.fuga);
const duracion = ((Date.now() - t0) / 1000).toFixed(1);

const carpeta = path.resolve(aqui, '../informes', `${marcaTiempo()}-datos`);
fs.mkdirSync(carpeta, { recursive: true });

const lineas = [
    `# Pruebas de datos - ${new Date().toISOString()}`,
    '',
    `Resultado: **${fallos.length === 0 ? 'VERDE' : 'ROJO'}** - ${resultados.length - fallos.length}/${resultados.length} casos OK en ${duracion} s.`,
    `Fuga entre cuentas: **${fuga ? 'SI' : 'NO'}**. Limpieza: ${limpieza.ok ? 'hecha' : 'FALLO'} ${JSON.stringify(limpieza.recuento ?? limpieza.detalle ?? '')}`,
    '',
    '## Casos',
    '',
    ...resultados.map(r => `- ${r.estado === 'paso' ? 'OK' : 'FALLO'} [${r.grupo}] ${r.nombre} (${r.ms} ms)${r.detalle ? '\n  - ' + r.detalle : ''}`),
    '',
    '## Aislamiento endpoint por endpoint',
    '',
    '| Grupo | Endpoint | Esperado | Obtenido | Fuga | OK |',
    '|---|---|---|---|---|---|',
    ...ctx.tabla.map(f => `| ${f.grupo} | ${f.endpoint} | ${f.esperado} | ${f.obtenido} | ${f.fuga ? 'SI' : 'no'} | ${f.ok ? 'si' : 'NO'} |`)
];
fs.writeFileSync(path.join(carpeta, 'resumen.md'), lineas.join('\n'));
fs.writeFileSync(path.join(carpeta, 'resultados.json'), JSON.stringify({ resultados, tabla: ctx.tabla, limpieza, duracion }, null, 2));

console.log(`\n${fallos.length === 0 ? 'VERDE' : 'ROJO'}: ${resultados.length - fallos.length}/${resultados.length} casos, ${duracion} s, fuga=${fuga ? 'SI' : 'NO'}, limpieza=${limpieza.ok ? 'ok' : 'FALLO'}`);
console.log(`Informe: ${path.relative(process.cwd(), carpeta)}`);
process.exit(fallos.length === 0 && limpieza.ok ? 0 : 1);
