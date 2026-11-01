/**
 * EvolucionAveRepository contra la API (modo API). Misma firma que V1:
 * registrarEvolucionAve({ aveId, fotoUri, pesoGramos, alturaCm, largoCm,
 * caracteristicas, observacion }). Devuelve undefined. Error de V1:
 * AVE_NO_ENCONTRADA. La foto es solo texto (ruta local del telefono).
 *
 * obtenerEvolucionAve no tiene llamadores ni endpoint: la fachada la deja
 * en SQLite.
 */

import {
    apiFetch
} from '../api/apiClient';

import {
    rutaAves,
    traducirErrorAve
} from '../api/avesApi';


export async function registrarEvolucionAve({
    aveId,
    fotoUri,
    pesoGramos,
    alturaCm,
    largoCm,
    caracteristicas,
    observacion
}) {

    const ruta = await rutaAves();

    try {

        await apiFetch(
            `${ruta}/${encodeURIComponent(aveId)}/evolucion`,
            {
                method: 'POST',
                body: {
                    fotoUri,
                    pesoGramos,
                    alturaCm,
                    largoCm,
                    caracteristicas,
                    observacion
                }
            }
        );

    }
    catch (error) {

        throw traducirErrorAve(error);

    }

}
