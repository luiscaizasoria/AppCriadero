/**
 * GenealogiaRepository: punto de entrada que usan las pantallas (no cambian).
 *
 * Elige la implementacion segun src/config/dataSource.js:
 *   - SQLite local (V1, por defecto): GenealogiaRepository.sqlite.js
 *   - API en la nube:                  GenealogiaRepository.api.js
 */

import {
    USAR_API
} from '../config/dataSource';


function origen() {

    return USAR_API
        ? require('./GenealogiaRepository.api')
        : require('./GenealogiaRepository.sqlite');

}


export function obtenerGenealogiaAve(...args) {
    return origen().obtenerGenealogiaAve(...args);
}
