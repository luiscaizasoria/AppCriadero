/**
 * BajaAveRepository: punto de entrada que usan las pantallas (no cambian).
 *
 * Elige la implementacion segun src/config/dataSource.js:
 *   - SQLite local (V1, por defecto): BajaAveRepository.sqlite.js
 *   - API en la nube:                  BajaAveRepository.api.js
 *
 * obtenerBajasAve no tiene llamadores y no existe en la API (omitida por
 * decision del usuario): solo funciona en modo SQLite.
 */

import {
    USAR_API
} from '../config/dataSource';


function origen() {

    return USAR_API
        ? require('./BajaAveRepository.api')
        : require('./BajaAveRepository.sqlite');

}


export function registrarMuerteAve(...args) {
    return origen().registrarMuerteAve(...args);
}

export function registrarVentaAve(...args) {
    return origen().registrarVentaAve(...args);
}

export function obtenerBajasAve(...args) {
    return origen().obtenerBajasAve(...args);
}
