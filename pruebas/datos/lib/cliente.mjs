// Empaqueta con esbuild los clientes REST REALES de la app (src/api y src/repositories/*.api.js)
// sustituyendo solo expo-secure-store por una memoria. No se modifica src/.
import { fileURLToPath, pathToFileURL } from 'node:url';
import path from 'node:path';
import fs from 'node:fs';

const aqui = path.dirname(fileURLToPath(import.meta.url));
const raiz = path.resolve(aqui, '../../..');
const cache = path.resolve(raiz, 'pruebas/.cache');

export async function cargarClientes() {
    const esbuild = await import(pathToFileURL(path.join(raiz, 'api/node_modules/esbuild/lib/main.js')).href);

    fs.mkdirSync(cache, { recursive: true });

    const salida = path.join(cache, `clientes-${process.pid}.mjs`);

    await esbuild.build({
        stdin: {
            resolveDir: raiz,
            sourcefile: 'entrada.js',
            contents: `
export * as acceso from './src/api/accesoApi.js';
export * as sesion from './src/api/sesion.js';
export { ApiError } from './src/api/apiClient.js';
export * as jaulas from './src/repositories/JaulaRepository.api.js';
export * as aves from './src/repositories/AveRepository.api.js';
export * as config from './src/repositories/ConfiguracionRepository.api.js';
export * as salud from './src/repositories/EstadoSaludRepository.api.js';
export * as saludAve from './src/repositories/SaludRepository.api.js';
export * as huevo from './src/repositories/HuevoRepository.api.js';
export * as produccion from './src/repositories/ProduccionRepository.api.js';
export * as genealogia from './src/repositories/GenealogiaRepository.api.js';
export * as ciclo from './src/repositories/CicloVidaRepository.api.js';
export * as evolucion from './src/repositories/EvolucionAveRepository.api.js';
export * as alimentacion from './src/repositories/AlimentacionRepository.api.js';
export * as bebida from './src/repositories/BebidaRepository.api.js';
export * as sanidad from './src/repositories/SanidadJaulaRepository.api.js';
export * as historial from './src/repositories/HistorialRepository.api.js';
export * as bajas from './src/repositories/BajaAveRepository.api.js';
export * as finanzas from './src/repositories/FinanzasRepository.api.js';
export * as clientes from './src/repositories/ClientesRepository.api.js';
export * as reportes from './src/repositories/ReportesRepository.api.js';
export * as alertas from './src/repositories/AlertasRepository.api.js';
export * as dashboard from './src/repositories/DashboardRepository.api.js';
`
        },
        bundle: true,
        platform: 'node',
        format: 'esm',
        outfile: salida,
        logLevel: 'error',
        alias: { 'expo-secure-store': path.join(aqui, '../stubs/secure-store.mjs') }
    });

    const modulo = await import(pathToFileURL(salida).href);
    fs.rmSync(salida, { force: true });
    return modulo;
}
