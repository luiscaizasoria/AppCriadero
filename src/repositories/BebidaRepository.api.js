/**
 * BebidaRepository contra la API (modo API). Misma interfaz que
 * BebidaRepository.sqlite.js. El servidor registra el evento de historial.
 */

import {
    apiFetch
} from '../api/apiClient';

import {
    rutaJaula,
    traducirErrorCuidado
} from '../api/cuidadosJaulaApi';

import {
    obtenerCatalogoPorCodigo,
    obtenerItemsCatalogo
} from './ConfiguracionRepository.api';


export async function obtenerTiposBebidas() {

    const catalogo =
        await obtenerCatalogoPorCodigo('BEBIDAS');

    if (!catalogo) {
        return [];
    }

    const items =
        await obtenerItemsCatalogo(catalogo.id);

    return items
        .map(i => ({
            id: i.id,
            codigo: i.codigo,
            nombre: i.nombre
        }))
        .sort((a, b) =>
            a.nombre < b.nombre ? -1 : (a.nombre > b.nombre ? 1 : 0)
        );

}


export async function registrarBebida({
    jaulaId,
    fecha,
    tipo,
    cantidad,
    detalle
}) {

    const base = await rutaJaula(jaulaId);

    try {

        await apiFetch(
            `${base}/bebida`,
            {
                method: 'POST',
                body: {
                    tipo,
                    cantidad,
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
