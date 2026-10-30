/**
 * JaulaRepository: punto de entrada que usan las pantallas (no cambian).
 *
 * Elige la implementacion segun src/config/dataSource.js:
 *   - SQLite local (V1, por defecto): JaulaRepository.sqlite.js
 *   - API en la nube:                  JaulaRepository.api.js
 *
 * Ambas exponen las mismas funciones con los mismos objetos y errores.
 */

import {
    USAR_API
} from '../config/dataSource';


function origen() {

    return USAR_API
        ? require('./JaulaRepository.api')
        : require('./JaulaRepository.sqlite');

}


export function obtenerJaulas(...args) {
    return origen().obtenerJaulas(...args);
}

export function obtenerJaulasInactivas(...args) {
    return origen().obtenerJaulasInactivas(...args);
}

export function obtenerAvesHistoricasJaula(...args) {
    return origen().obtenerAvesHistoricasJaula(...args);
}

export function obtenerHistorialCompletoJaula(...args) {
    return origen().obtenerHistorialCompletoJaula(...args);
}

export function obtenerJaulaPorId(...args) {
    return origen().obtenerJaulaPorId(...args);
}

export function crearJaula(...args) {
    return origen().crearJaula(...args);
}

export function actualizarJaula(...args) {
    return origen().actualizarJaula(...args);
}

export function desactivarJaula(...args) {
    return origen().desactivarJaula(...args);
}
