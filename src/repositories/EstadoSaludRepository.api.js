/**
 * EstadoSaludRepository contra la API (modo API). Misma firma que v1.0.0:
 * finalizarTratamiento({ aveId, observacion }). Devuelve undefined.
 * La API deja el ave SANA, cierra diagnosticos y registra el evento SALUD;
 * el evento RECUPERACION lo sigue registrando la pantalla con
 * registrarEventoCicloVida.
 */

import {
    apiFetch
} from '../api/apiClient';

import {
    rutaAves,
    traducirErrorAve
} from '../api/avesApi';


export async function finalizarTratamiento({
    aveId,
    observacion
}) {

    const ruta = await rutaAves();

    try {

        await apiFetch(
            `${ruta}/${encodeURIComponent(aveId)}/finalizar-tratamiento`,
            {
                method: 'POST',
                body: {
                    observacion
                }
            }
        );

    }
    catch (error) {

        throw traducirErrorAve(error);

    }

}
