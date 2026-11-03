/**
 * HuevoRepository contra la API (modo API). Misma interfaz que
 * HuevoRepository.sqlite.js: mismos nombres y objetos snake_case.
 * Ave o jaula inexistente al registrar -> Error('FOREIGN KEY constraint failed')
 * (como V1). Ver documents/specs/huevos.md.
 */

import {
    apiFetch
} from '../api/apiClient';

import {
    aSnake
} from '../api/avesApi';

import {
    rutaCriadero,
    rutaProduccion,
    traducirErrorHuevo
} from '../api/huevosApi';


export async function generarCodigoHuevo() {

    const base = await rutaCriadero();

    const data = await apiFetch(
        `${base}/huevos/siguiente-codigo`
    );

    return data.codigo;

}


export async function registrarHuevo({
    aveId,
    jaulaId,
    fecha,
    observacion
}) {

    const base = await rutaCriadero();

    try {

        const data = await apiFetch(
            `${base}/aves/${encodeURIComponent(aveId)}/huevos`,
            {
                method: 'POST',
                body: {
                    jaulaId: jaulaId || null,
                    fecha: fecha || new Date().toISOString(),
                    observacion: observacion || null
                }
            }
        );

        return data.codigo;

    }
    catch (error) {

        throw traducirErrorHuevo(error);

    }

}


export async function obtenerHuevosAve(
    aveId
) {

    const base = await rutaCriadero();

    const data = await apiFetch(
        `${base}/aves/${encodeURIComponent(aveId)}/huevos`
    );

    return data.huevos.map(aSnake);

}


export async function obtenerProduccionHuevos() {

    const base = await rutaProduccion();

    const data = await apiFetch(
        `${base}/total`
    );

    return {
        total: data.total,
        hoy: data.hoy,
        mes: data.mes
    };

}


export async function obtenerTopPonedoras() {

    const base = await rutaProduccion();

    const data = await apiFetch(
        `${base}/ranking`
    );

    return data.ranking.map(r => ({
        id: r.id,
        codigo: r.codigo,
        raza: r.raza ?? null,
        cantidad: r.cantidad
    }));

}


export async function obtenerProduccionPorDia() {

    const base = await rutaProduccion();

    const data = await apiFetch(
        `${base}/por-dia-historico`
    );

    return data.dias.map(d => ({
        dia: d.dia,
        cantidad: d.cantidad
    }));

}


export async function obtenerProduccionPorHora() {

    const base = await rutaProduccion();

    const data = await apiFetch(
        `${base}/por-hora`
    );

    return data.horas.map(h => ({
        hora: String(h.hora),
        cantidad: h.cantidad
    }));

}


export async function obtenerProduccionPorJaula() {

    const base = await rutaProduccion();

    const data = await apiFetch(
        `${base}/por-jaula`
    );

    // V1 (HuevoRepository): sin la clave id.
    return data.jaulas.map(j => ({
        codigo: j.codigo,
        cantidad: j.cantidad
    }));

}
