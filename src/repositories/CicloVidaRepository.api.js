/**
 * CicloVidaRepository contra la API (modo API).
 *
 * Solo registrarEventoCicloVida tiene endpoint (POST .../aves/:aveId/eventos).
 * obtenerCicloVidaAve NO se reimplementa aqui: la fachada la deja en SQLite
 * (mezcla huevos, bajas y salud, de modulos aun no migrados); con un ave de la
 * nube devuelve [] porque el id no existe en SQLite.
 */

import {
    apiFetch
} from '../api/apiClient';

import {
    rutaAves,
    traducirErrorAve
} from '../api/avesApi';


export async function registrarEventoCicloVida({
    aveId,
    tipoEvento,
    detalle,
    fecha = null
}) {

    const ruta = await rutaAves();

    try {

        await apiFetch(
            `${ruta}/${encodeURIComponent(aveId)}/eventos`,
            {
                method: 'POST',
                body: {
                    tipoEvento,
                    detalle: detalle || null,
                    fecha: fecha || null
                }
            }
        );

    }
    catch (error) {

        throw traducirErrorAve(error);

    }

}
