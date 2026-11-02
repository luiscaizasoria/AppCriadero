/**
 * SanidadJaulaRepository contra la API (modo API). Misma interfaz que
 * SanidadJaulaRepository.sqlite.js. El servidor actualiza el estado sanitario
 * de la jaula y registra el evento de historial.
 */

import {
    apiFetch
} from '../api/apiClient';

import {
    rutaJaula,
    traducirErrorCuidado
} from '../api/cuidadosJaulaApi';


export async function registrarSanidadJaula({
    jaulaId,
    fecha,
    tipo,
    detalle
}) {

    const base = await rutaJaula(jaulaId);

    try {

        await apiFetch(
            `${base}/sanidad`,
            {
                method: 'POST',
                body: {
                    tipo,
                    detalle,
                    fecha
                }
            }
        );

    }
    catch (error) {

        throw traducirErrorCuidado(error);

    }

}
