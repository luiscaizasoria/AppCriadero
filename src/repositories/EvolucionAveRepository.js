/**
 * EvolucionAveRepository: punto de entrada que usan las pantallas (no cambian).
 *
 *   - SQLite local (V1, por defecto): EvolucionAveRepository.sqlite.js
 *   - API en la nube:                  EvolucionAveRepository.api.js
 *
 * obtenerEvolucionAve (sin llamadores ni endpoint) sigue en SQLite.
 */

import {
    USAR_API
} from '../config/dataSource';


function sqlite() {

    return require('./EvolucionAveRepository.sqlite');

}


function origen() {

    return USAR_API
        ? require('./EvolucionAveRepository.api')
        : sqlite();

}


export function obtenerEvolucionAve(...args) {
    return sqlite().obtenerEvolucionAve(...args);
}

export function registrarEvolucionAve(...args) {
    return origen().registrarEvolucionAve(...args);
}
