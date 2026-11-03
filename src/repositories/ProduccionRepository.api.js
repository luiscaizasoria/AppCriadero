/**
 * ProduccionRepository contra la API (modo API). Misma interfaz que
 * ProduccionRepository.sqlite.js. Ver documents/specs/huevos.md.
 */

import {
    apiFetch
} from '../api/apiClient';

import {
    rutaProduccion
} from '../api/huevosApi';


export async function obtenerResumenProduccion() {

    const base = await rutaProduccion();

    const data = await apiFetch(
        `${base}/resumen`
    );

    return {
        hoy: Number(data?.hoy || 0),
        semana: Number(data?.semana || 0),
        mes: Number(data?.mes || 0)
    };

}


export async function obtenerRankingPonedoras() {

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
        `${base}/por-dia`
    );

    return data.dias.map(d => ({
        dia: d.dia,
        cantidad: d.cantidad
    }));

}


export async function obtenerProduccionPorJaula() {

    const base = await rutaProduccion();

    const data = await apiFetch(
        `${base}/por-jaula`
    );

    return data.jaulas.map(j => ({
        id: j.id,
        codigo: j.codigo,
        cantidad: j.cantidad
    }));

}


export async function obtenerProduccionPorAve() {

    const base = await rutaProduccion();

    const data = await apiFetch(
        `${base}/por-ave`
    );

    return data.aves.map(a => ({
        id: a.id,
        codigo: a.codigo,
        cantidad: a.cantidad
    }));

}
