/**
 * HistorialRepository: punto de entrada que usan las pantallas (no cambian).
 *
 * Elige la implementacion segun src/config/dataSource.js:
 *   - SQLite local (V1, por defecto): HistorialRepository.sqlite.js
 *   - API en la nube:                  HistorialRepository.api.js
 */

import {
    USAR_API
} from '../config/dataSource';


function origen() {

    return USAR_API
        ? require('./HistorialRepository.api')
        : require('./HistorialRepository.sqlite');

}


export function registrarHistorialJaula(...args) {
    return origen().registrarHistorialJaula(...args);
}

export function obtenerHistorialJaula(...args) {
    return origen().obtenerHistorialJaula(...args);
}
