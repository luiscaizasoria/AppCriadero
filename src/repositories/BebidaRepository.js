/**
 * BebidaRepository: punto de entrada que usan las pantallas (no cambian).
 *
 * Elige la implementacion segun src/config/dataSource.js:
 *   - SQLite local (V1, por defecto): BebidaRepository.sqlite.js
 *   - API en la nube:                  BebidaRepository.api.js
 */

import {
    USAR_API
} from '../config/dataSource';


function origen() {

    return USAR_API
        ? require('./BebidaRepository.api')
        : require('./BebidaRepository.sqlite');

}


export function obtenerTiposBebidas(...args) {
    return origen().obtenerTiposBebidas(...args);
}

export function registrarBebida(...args) {
    return origen().registrarBebida(...args);
}
