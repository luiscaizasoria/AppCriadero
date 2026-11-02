/**
 * SaludRepository contra la API (modo API). Misma interfaz que
 * SaludRepository.sqlite.js: mismos nombres y objetos snake_case.
 * Ave inexistente al registrar -> Error('AVE_NO_ENCONTRADA')
 * (V1: 'FOREIGN KEY constraint failed'; la pantalla no distingue).
 * actualizarEstadoSaludAve no se implementa (omitida, sin llamadores).
 */

import {
    apiFetch
} from '../api/apiClient';

import {
    rutaAves,
    aSnake,
    traducirErrorAve
} from '../api/avesApi';

import {
    obtenerCatalogoPorCodigo,
    obtenerItemsCatalogo
} from './ConfiguracionRepository.api';


// Lectura de un catalogo por codigo (mismo resultado que V1).
async function leerCatalogoApi(codigoCatalogo) {

    const catalogo =
        await obtenerCatalogoPorCodigo(codigoCatalogo);

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


export async function obtenerEnfermedades() {

    return await leerCatalogoApi('ENFERMEDADES');

}


export async function obtenerMedicamentos() {

    return await leerCatalogoApi('MEDICAMENTOS');

}


export async function registrarDiagnostico({
    aveId,
    enfermedad,
    sintomas,
    observacion,
    medicamento,
    dosis,
    fecha
}) {

    const base = await rutaAves();

    try {

        await apiFetch(
            `${base}/${encodeURIComponent(aveId)}/diagnosticos`,
            {
                method: 'POST',
                body: {
                    enfermedad,
                    sintomas,
                    observacion,
                    medicamento,
                    dosis,
                    fecha
                }
            }
        );

    }
    catch (error) {

        throw traducirErrorAve(error);

    }

}


export async function obtenerHistorialSaludAve(
    aveId
) {

    const base = await rutaAves();

    const data = await apiFetch(
        `${base}/${encodeURIComponent(aveId)}/salud`
    );

    return data.historial.map(aSnake);

}
