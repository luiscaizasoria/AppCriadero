/**
 * ClientesRepository: punto de entrada que usan las pantallas (no cambian).
 *
 * Elige la implementacion segun src/config/dataSource.js:
 *   - SQLite local (V1, por defecto): ClientesRepository.sqlite.js
 *   - API en la nube:                  ClientesRepository.api.js
 */

import {
    USAR_API
} from '../config/dataSource';


function origen() {

    return USAR_API
        ? require('./ClientesRepository.api')
        : require('./ClientesRepository.sqlite');

}


export function obtenerClientes(...args) {
    return origen().obtenerClientes(...args);
}

export function obtenerClientePorCelular(...args) {
    return origen().obtenerClientePorCelular(...args);
}

export function obtenerComprasCliente(...args) {
    return origen().obtenerComprasCliente(...args);
}
