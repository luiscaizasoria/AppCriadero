/**
 * HistorialRepository contra la API (modo API). Misma interfaz que
 * HistorialRepository.sqlite.js.
 */

import {
    apiFetch
} from '../api/apiClient';

import {
    rutaJaula
} from '../api/cuidadosJaulaApi';


export async function registrarHistorialJaula() {

    throw new Error(
        'registrarHistorialJaula no se usa en modo API: el servidor registra el evento de historial junto con cada cuidado.'
    );

}


export async function obtenerHistorialJaula(jaulaId) {

    const base = await rutaJaula(jaulaId);

    const data = await apiFetch(
        `${base}/historial`
    );

    return data.historial.map(
        item => ({
            id: item.id,
            jaula_id: item.jaulaId,
            ave_id: item.aveId,
            tipo_evento: item.tipoEvento,
            fecha: item.fecha,
            detalle: item.detalle,
            fecha_creacion: item.fechaCreacion
        })
    );

}
