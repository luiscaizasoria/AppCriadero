/**
 * AlimentacionRepository contra la API (modo API). Misma interfaz que
 * AlimentacionRepository.sqlite.js: mismos nombres, objetos snake_case y
 * errores (jaula inexistente -> 'FOREIGN KEY constraint failed').
 * El servidor registra el evento de historial junto con el cuidado.
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


export async function obtenerTiposAlimentos() {

    const catalogo =
        await obtenerCatalogoPorCodigo('ALIMENTOS');

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


export async function registrarAlimentacion({
    jaulaId,
    fecha,
    tipo,
    cantidad,
    detalle
}) {

    const base = await rutaJaula(jaulaId);

    try {

        await apiFetch(
            `${base}/alimentacion`,
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


export async function obtenerAlimentacionJaula(jaulaId) {

    const base = await rutaJaula(jaulaId);

    const data = await apiFetch(
        `${base}/alimentacion`
    );

    return data.registros.map(
        r => ({
            id: r.id,
            jaula_id: r.jaulaId,
            fecha: r.fecha,
            tipo: r.tipo,
            cantidad: r.cantidad,
            detalle: r.detalle,
            fecha_creacion: r.fechaCreacion
        })
    );

}
