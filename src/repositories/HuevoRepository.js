/**
 * HuevoRepository: punto de entrada que usan las pantallas (no cambian).
 *
 * Elige la implementacion segun src/config/dataSource.js:
 *   - SQLite local (V1, por defecto): HuevoRepository.sqlite.js
 *   - API en la nube:                  HuevoRepository.api.js
 */

import {
    USAR_API
} from '../config/dataSource';


function origen() {

    return USAR_API
        ? require('./HuevoRepository.api')
        : require('./HuevoRepository.sqlite');

}


export function generarCodigoHuevo(...args) {
    return origen().generarCodigoHuevo(...args);
}

export function registrarHuevo(...args) {
    return origen().registrarHuevo(...args);
}

export function obtenerHuevosAve(...args) {
    return origen().obtenerHuevosAve(...args);
}

export function obtenerProduccionHuevos(...args) {
    return origen().obtenerProduccionHuevos(...args);
}

export function obtenerTopPonedoras(...args) {
    return origen().obtenerTopPonedoras(...args);
}

export function obtenerProduccionPorDia(...args) {
    return origen().obtenerProduccionPorDia(...args);
}

export function obtenerProduccionPorHora(...args) {
    return origen().obtenerProduccionPorHora(...args);
}

export function obtenerProduccionPorJaula(...args) {
    return origen().obtenerProduccionPorJaula(...args);
}
