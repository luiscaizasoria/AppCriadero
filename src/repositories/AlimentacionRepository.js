/**
 * AlimentacionRepository: punto de entrada que usan las pantallas (no cambian).
 *
 * Elige la implementacion segun src/config/dataSource.js:
 *   - SQLite local (V1, por defecto): AlimentacionRepository.sqlite.js
 *   - API en la nube:                  AlimentacionRepository.api.js
 */

import {
    USAR_API
} from '../config/dataSource';


function origen() {

    return USAR_API
        ? require('./AlimentacionRepository.api')
        : require('./AlimentacionRepository.sqlite');

}


export function obtenerTiposAlimentos(...args) {
    return origen().obtenerTiposAlimentos(...args);
}

export function registrarAlimentacion(...args) {
    return origen().registrarAlimentacion(...args);
}

export function obtenerAlimentacionJaula(...args) {
    return origen().obtenerAlimentacionJaula(...args);
}
