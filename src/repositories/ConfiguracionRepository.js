/**
 * ConfiguracionRepository: punto de entrada que usan las pantallas (no cambian).
 *
 * Elige la implementacion segun src/config/dataSource.js:
 *   - SQLite local (V1, por defecto): ConfiguracionRepository.sqlite.js
 *   - API en la nube:                  ConfiguracionRepository.api.js
 *
 * Ambas exponen las mismas funciones con los mismos objetos y errores.
 */

import {
    USAR_API
} from '../config/dataSource';


function origen() {

    return USAR_API
        ? require('./ConfiguracionRepository.api')
        : require('./ConfiguracionRepository.sqlite');

}


export function obtenerCatalogos(...args) {
    return origen().obtenerCatalogos(...args);
}

export function obtenerCatalogoPorCodigo(...args) {
    return origen().obtenerCatalogoPorCodigo(...args);
}

export function obtenerItemsCatalogo(...args) {
    return origen().obtenerItemsCatalogo(...args);
}

export function crearItemCatalogo(...args) {
    return origen().crearItemCatalogo(...args);
}

export function actualizarItemCatalogo(...args) {
    return origen().actualizarItemCatalogo(...args);
}

export function eliminarItemCatalogo(...args) {
    return origen().eliminarItemCatalogo(...args);
}
