// Clasificacion y reintentos de errores de RED hacia el Worker de pruebas (nunca de respuestas HTTP 4xx/5xx).
export const PATRON_RED = /fetch failed|ConnectTimeoutError|UND_ERR_CONNECT_TIMEOUT|ECONNRESET|ENOTFOUND|EAI_AGAIN/;

export const dormir = ms => new Promise(r => setTimeout(r, ms));

/** Contador compartido de reintentos de red hechos en este proceso. */
export const contadorRed = { reintentos: 0 };

export function esErrorRed(e) {
    const partes = [e?.message, e?.code, e?.name, e?.cause?.message, e?.cause?.code, e?.cause?.name, String(e)];
    return partes.filter(Boolean).some(p => PATRON_RED.test(String(p)));
}

/** Reintenta SOLO si la excepcion es de red (la respuesta HTTP, aunque sea 4xx o 5xx, no lanza y no se reintenta). */
export async function conReintentosRed(fn, { reintentos = 2, esperaMs = 3000 } = {}) {
    for (let i = 0; ; i++) {
        try {
            return await fn();
        } catch (e) {
            if (!esErrorRed(e) || i >= reintentos) throw e;
            contadorRed.reintentos++;
            await dormir(esperaMs);
        }
    }
}

const pad = n => String(n).padStart(2, '0');
const hora = d => `${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;

/** N peticiones GET /api/v1/health desde el PC, separadas, midiendo latencia. Exige `minimo` respuestas 200. */
export async function comprobarConectividadPc(urlApi, { peticiones = 10, separacionMs = 3000, minimo = 9, timeoutMs = 10000 } = {}) {
    const filas = [];
    for (let n = 1; n <= peticiones; n++) {
        const ini = Date.now();
        const f = { n, hora: hora(new Date()), estado: '', ms: 0 };
        try {
            const r = await fetch(`${urlApi}/api/v1/health`, { signal: AbortSignal.timeout(timeoutMs) });
            f.estado = String(r.status);
        } catch (e) {
            f.estado = (e?.cause?.code || e?.cause?.name || e?.name || 'ERROR').toString();
        }
        f.ms = Date.now() - ini;
        filas.push(f);
        if (n < peticiones) await dormir(separacionMs);
    }
    const oks = filas.filter(f => f.estado === '200').length;
    return { ok: oks >= minimo, oks, minimo, filas };
}

export function tablaLatencias(c) {
    const ms = c.filas.filter(f => f.estado === '200').map(f => f.ms).sort((a, b) => a - b);
    const resumen = ms.length ? `min ${ms[0]} ms, mediana ${ms[Math.floor(ms.length / 2)]} ms, max ${ms[ms.length - 1]} ms` : 'sin respuestas 200';
    return [
        `Conectividad PC -> Worker: ${c.oks}/${c.filas.length} respuestas 200 (minimo ${c.minimo}); ${resumen}`,
        '',
        '| # | Hora | Resultado | Latencia (ms) |', '|---|---|---|---|',
        ...c.filas.map(f => `| ${f.n} | ${f.hora} | ${f.estado} | ${f.ms} |`)
    ];
}
