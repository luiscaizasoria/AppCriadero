/**
 * FinanzasRepository: punto de entrada que usan las pantallas (no cambian).
 *
 * Elige la implementacion segun src/config/dataSource.js:
 *   - SQLite local (V1, por defecto): FinanzasRepository.sqlite.js
 *   - API en la nube:                  FinanzasRepository.api.js
 *
 * obtenerIngresos y obtenerEgresos no tienen llamadores y no existen en la API
 * (omitidas): solo funcionan en modo SQLite.
 */

import {
    USAR_API
} from '../config/dataSource';


function origen() {

    return USAR_API
        ? require('./FinanzasRepository.api')
        : require('./FinanzasRepository.sqlite');

}


export function obtenerResumenFinanciero(...args) {
    return origen().obtenerResumenFinanciero(...args);
}

export function obtenerMovimientosFinancieros(...args) {
    return origen().obtenerMovimientosFinancieros(...args);
}

export function obtenerIngresos(...args) {
    return origen().obtenerIngresos(...args);
}

export function obtenerEgresos(...args) {
    return origen().obtenerEgresos(...args);
}

export function registrarIngreso(...args) {
    return origen().registrarIngreso(...args);
}

export function registrarEgreso(...args) {
    return origen().registrarEgreso(...args);
}

export function obtenerMovimientoPorId(...args) {
    return origen().obtenerMovimientoPorId(...args);
}

export function obtenerVentaPorBajaId(...args) {
    return origen().obtenerVentaPorBajaId(...args);
}

export function actualizarMovimientoManual(...args) {
    return origen().actualizarMovimientoManual(...args);
}

export function corregirVentaFinanciera(...args) {
    return origen().corregirVentaFinanciera(...args);
}

export function obtenerHistorialMovimiento(...args) {
    return origen().obtenerHistorialMovimiento(...args);
}

export function obtenerConsolidadoCategorias(...args) {
    return origen().obtenerConsolidadoCategorias(...args);
}

export function obtenerConsolidadoMensual(...args) {
    return origen().obtenerConsolidadoMensual(...args);
}
