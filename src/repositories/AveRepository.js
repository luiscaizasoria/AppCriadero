/**
 * AveRepository: punto de entrada que usan las pantallas (no cambian).
 *
 * Elige la implementacion segun src/config/dataSource.js:
 *   - SQLite local (V1, por defecto): AveRepository.sqlite.js
 *   - API en la nube:                  AveRepository.api.js
 *
 * Ambas exponen las mismas funciones con los mismos objetos y errores.
 */

import {
    USAR_API
} from '../config/dataSource';


function origen() {

    return USAR_API
        ? require('./AveRepository.api')
        : require('./AveRepository.sqlite');

}


export function obtenerAves(...args) {
    return origen().obtenerAves(...args);
}

export function obtenerAvesPorJaula(...args) {
    return origen().obtenerAvesPorJaula(...args);
}

export function obtenerAvesParaAsignarJaula(...args) {
    return origen().obtenerAvesParaAsignarJaula(...args);
}

export function obtenerAvePorId(...args) {
    return origen().obtenerAvePorId(...args);
}

export function obtenerAvesActivasParaPadres(...args) {
    return origen().obtenerAvesActivasParaPadres(...args);
}

export function obtenerJaulasActivas(...args) {
    return origen().obtenerJaulasActivas(...args);
}

export function existeAvePorCodigo(...args) {
    return origen().existeAvePorCodigo(...args);
}

export function crearAve(...args) {
    return origen().crearAve(...args);
}

export function actualizarAve(...args) {
    return origen().actualizarAve(...args);
}

export function cambiarJaulaAve(...args) {
    return origen().cambiarJaulaAve(...args);
}

export function obtenerHistorialAve(...args) {
    return origen().obtenerHistorialAve(...args);
}

export function obtenerAvesActivas(...args) {
    return origen().obtenerAvesActivas(...args);
}

export function obtenerAvesVendidas(...args) {
    return origen().obtenerAvesVendidas(...args);
}

export function obtenerAvesFallecidas(...args) {
    return origen().obtenerAvesFallecidas(...args);
}

export function obtenerBajaAve(...args) {
    return origen().obtenerBajaAve(...args);
}
