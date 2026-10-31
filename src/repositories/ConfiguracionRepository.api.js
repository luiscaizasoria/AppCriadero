/**
 * ConfiguracionRepository contra la API (modo API). Misma interfaz que la
 * version SQLite (ConfiguracionRepository.sqlite.js): mismos nombres de
 * funcion y mismos objetos devueltos.
 *
 * La API enruta por CODIGO de catalogo y por id de item; V1 pasa el id del
 * catalogo (obtenerItemsCatalogo) y solo el id del item (actualizar/eliminar).
 * Por eso el modulo recuerda id de catalogo -> codigo e id de item -> codigo
 * de catalogo, rellenados por las lecturas.
 */

import {
    apiFetch,
    ApiError
} from '../api/apiClient';

import {
    obtenerCriaderoId
} from '../api/sesion';


// id de catalogo (lo que ve la pantalla) -> codigo de catalogo (lo que usa la API)
const codigoPorCatalogoId = new Map();

// id de item -> codigo de catalogo al que pertenece
const catalogoPorItemId = new Map();


async function rutaCatalogos() {

    const criaderoId =
        await obtenerCriaderoId();

    if (!criaderoId) {

        throw new Error(
            'CRIADERO_NO_SELECCIONADO'
        );

    }

    return `/api/v1/criaderos/${encodeURIComponent(criaderoId)}/catalogos`;

}


function recordarCatalogo(catalogo) {

    if (catalogo && catalogo.codigo) {

        codigoPorCatalogoId.set(
            catalogo.id,
            catalogo.codigo
        );

    }

}


function aCatalogoSimple(catalogo) {

    return {
        id: catalogo.id,
        codigo: catalogo.codigo,
        nombre: catalogo.nombre
    };

}


export async function obtenerCatalogos() {

    const ruta = await rutaCatalogos();

    const data = await apiFetch(ruta);

    const lista = data.catalogos || [];

    lista.forEach(recordarCatalogo);

    return lista.map(catalogo => ({
        id: catalogo.id,
        codigo: catalogo.codigo,
        nombre: catalogo.nombre,
        activo: catalogo.activo ? 1 : 0
    }));

}


export async function obtenerCatalogoPorCodigo(codigo) {

    const ruta = await rutaCatalogos();

    try {

        const data = await apiFetch(
            `${ruta}/${encodeURIComponent(codigo)}`
        );

        const catalogo = data.catalogo;

        recordarCatalogo(catalogo);

        return aCatalogoSimple(catalogo);

    }
    catch (error) {

        // V1: getFirstAsync devuelve null si no existe.
        if (
            error instanceof ApiError &&
            error.code === 'CATALOGO_NOT_FOUND'
        ) {

            return null;

        }

        throw error;

    }

}


export async function obtenerItemsCatalogo(catalogoId) {

    let codigo =
        codigoPorCatalogoId.get(catalogoId);

    if (!codigo) {

        await obtenerCatalogos();

        codigo =
            codigoPorCatalogoId.get(catalogoId);

    }

    // V1: un catalogo inexistente devuelve lista vacia.
    if (!codigo) {

        return [];

    }

    const ruta = await rutaCatalogos();

    let data;

    try {

        data = await apiFetch(
            `${ruta}/${encodeURIComponent(codigo)}/items`
        );

    }
    catch (error) {

        if (
            error instanceof ApiError &&
            error.code === 'CATALOGO_NOT_FOUND'
        ) {

            return [];

        }

        throw error;

    }

    return (data.items || []).map(item => {

        catalogoPorItemId.set(item.id, codigo);

        return {
            id: item.id,
            codigo: item.codigo,
            nombre: item.nombre,
            descripcion: item.descripcion ?? null,
            activo: item.activo ? 1 : 0,
            orden: item.orden ?? null
        };

    });

}


export async function crearItemCatalogo({
    catalogoId,
    codigo,
    nombre,
    descripcion
}) {

    let codigoCatalogo =
        codigoPorCatalogoId.get(catalogoId);

    if (!codigoCatalogo) {

        await obtenerCatalogos();

        codigoCatalogo =
            codigoPorCatalogoId.get(catalogoId);

    }

    if (!codigoCatalogo) {

        throw new Error(
            'No se encontró el catálogo.'
        );

    }

    const ruta = await rutaCatalogos();

    try {

        await apiFetch(
            `${ruta}/${encodeURIComponent(codigoCatalogo)}/items`,
            {
                method: 'POST',
                body: {
                    codigo,
                    nombre,
                    descripcion: descripcion || null
                }
            }
        );

    }
    catch (error) {

        // La API devuelve el texto de SQLite para el duplicado, igual que V1.
        if (
            error instanceof ApiError &&
            error.status === 409 &&
            error.code === 'UNIQUE_CATALOGO_ITEMS_CODIGO'
        ) {

            throw new Error(error.message);

        }

        throw error;

    }

}


function codigoCatalogoDeItem(id) {

    const codigo =
        catalogoPorItemId.get(id);

    if (!codigo) {

        throw new Error(
            'No se encontró el elemento del catálogo.'
        );

    }

    return codigo;

}


export async function actualizarItemCatalogo({
    id,
    nombre,
    descripcion
}) {

    const codigo =
        codigoCatalogoDeItem(id);

    const ruta = await rutaCatalogos();

    await apiFetch(
        `${ruta}/${encodeURIComponent(codigo)}/items/${encodeURIComponent(id)}`,
        {
            method: 'PUT',
            body: {
                nombre,
                descripcion: descripcion || null
            }
        }
    );

}


export async function eliminarItemCatalogo(id) {

    const codigo =
        codigoCatalogoDeItem(id);

    const ruta = await rutaCatalogos();

    await apiFetch(
        `${ruta}/${encodeURIComponent(codigo)}/items/${encodeURIComponent(id)}`,
        {
            method: 'DELETE'
        }
    );

}
