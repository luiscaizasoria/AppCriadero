/**
 * ClientesRepository contra la API (modo API). Misma interfaz que
 * ClientesRepository.sqlite.js: mismos nombres y objetos snake_case.
 *
 * Solo lectura. Los clientes se calculan en el servidor (ventas agrupadas por
 * celular). Los valores pasan sin transformar (sin Number() ni redondeo).
 * - obtenerClientePorCelular devuelve null si no hay ventas con ese celular.
 * - obtenerComprasCliente devuelve [] si no hay ventas con ese celular.
 * - El celular viaja en la ruta con encodeURIComponent.
 * Errores de red/sesion: se propaga el ApiError. Ver documents/specs/clientes.md.
 */

import {
    apiFetch
} from '../api/apiClient';

import {
    aSnake
} from '../api/avesApi';

import {
    rutaCriadero
} from '../api/huevosApi';


export async function obtenerClientes() {

    const base = await rutaCriadero();

    const data = await apiFetch(
        `${base}/clientes`
    );

    return data.clientes.map(aSnake);

}


export async function obtenerClientePorCelular(
    celular
) {

    const base = await rutaCriadero();

    const data = await apiFetch(
        `${base}/clientes/${encodeURIComponent(celular)}`
    );

    return aSnake(data.cliente);

}


export async function obtenerComprasCliente(
    celular
) {

    const base = await rutaCriadero();

    const data = await apiFetch(
        `${base}/clientes/${encodeURIComponent(celular)}/compras`
    );

    return data.compras.map(aSnake);

}
