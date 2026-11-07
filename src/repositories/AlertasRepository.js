/**
 * AlertasRepository: punto de entrada que usan las pantallas (no cambian).
 *
 * Elige la implementacion segun src/config/dataSource.js:
 *   - SQLite local (V1, por defecto): AlertasRepository.sqlite.js
 *   - API en la nube:                  AlertasRepository.api.js
 *
 * obtenerAlertasSalud, obtenerAlertasJaulas, obtenerAlertasProduccion y
 * obtenerAlertasFinanzas no tienen llamadores y no existen en la API
 * (omitidas): solo funcionan en modo SQLite.
 */

import {
    USAR_API
} from '../config/dataSource';


function origen() {

    return USAR_API
        ? require('./AlertasRepository.api')
        : require('./AlertasRepository.sqlite');

}


export function obtenerAlertasSalud(...args) {
    return origen().obtenerAlertasSalud(...args);
}

export function obtenerAlertasJaulas(...args) {
    return origen().obtenerAlertasJaulas(...args);
}

export function obtenerAlertasProduccion(...args) {
    return origen().obtenerAlertasProduccion(...args);
}

export function obtenerAlertasFinanzas(...args) {
    return origen().obtenerAlertasFinanzas(...args);
}

export function obtenerTodasLasAlertas(...args) {
    return origen().obtenerTodasLasAlertas(...args);
}

export function obtenerResumenAlertas(...args) {
    return origen().obtenerResumenAlertas(...args);
}
