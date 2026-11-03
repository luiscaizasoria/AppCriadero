/**
 * ProduccionRepository: punto de entrada que usan las pantallas (no cambian).
 *
 * Elige la implementacion segun src/config/dataSource.js:
 *   - SQLite local (V1, por defecto): ProduccionRepository.sqlite.js
 *   - API en la nube:                  ProduccionRepository.api.js
 */

import {
    USAR_API
} from '../config/dataSource';


function origen() {

    return USAR_API
        ? require('./ProduccionRepository.api')
        : require('./ProduccionRepository.sqlite');

}


export function obtenerResumenProduccion(...args) {
    return origen().obtenerResumenProduccion(...args);
}

export function obtenerRankingPonedoras(...args) {
    return origen().obtenerRankingPonedoras(...args);
}

export function obtenerProduccionPorDia(...args) {
    return origen().obtenerProduccionPorDia(...args);
}

export function obtenerProduccionPorJaula(...args) {
    return origen().obtenerProduccionPorJaula(...args);
}

export function obtenerProduccionPorAve(...args) {
    return origen().obtenerProduccionPorAve(...args);
}
