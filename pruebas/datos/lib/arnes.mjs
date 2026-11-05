// Arnes minimo de pruebas (sin dependencias). Secuencial; cada caso registra resultado y duracion.
import assert from 'node:assert/strict';

export { assert };

const casos = [];
export const resultados = [];

export function prueba(grupo, nombre, fn) {
    casos.push({ grupo, nombre, fn });
}

export async function ejecutarTodo({ filtro } = {}) {
    for (const caso of casos) {
        if (filtro && !caso.grupo.startsWith(filtro)) continue;
        const t0 = Date.now();
        let estado = 'paso';
        let detalle = '';
        try {
            await caso.fn();
        } catch (e) {
            estado = 'fallo';
            detalle = e?.stack?.split('\n').slice(0, Number(process.env.DETALLE_LINEAS || 4)).join(' | ') || String(e);
        }
        const ms = Date.now() - t0;
        resultados.push({ grupo: caso.grupo, nombre: caso.nombre, estado, ms, detalle });
        console.log(`${estado === 'paso' ? 'OK   ' : 'FALLO'} [${caso.grupo}] ${caso.nombre} (${ms} ms)${detalle ? '\n      ' + detalle : ''}`);
    }
    return resultados;
}
