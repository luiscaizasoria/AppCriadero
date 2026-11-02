/**
 * SaludRepository: punto de entrada que usan las pantallas (no cambian).
 *
 * Elige la implementacion segun src/config/dataSource.js:
 *   - SQLite local (V1, por defecto): SaludRepository.sqlite.js
 *   - API en la nube:                  SaludRepository.api.js
 *
 * actualizarEstadoSaludAve no tiene llamadores y no existe en la API
 * (omitida por decision del usuario): solo funciona en modo SQLite.
 */

import {
    USAR_API
} from '../config/dataSource';


function origen() {

    return USAR_API
        ? require('./SaludRepository.api')
        : require('./SaludRepository.sqlite');

}


export function obtenerEnfermedades(...args) {
    return origen().obtenerEnfermedades(...args);
}

export function obtenerMedicamentos(...args) {
    return origen().obtenerMedicamentos(...args);
}

export function registrarDiagnostico(...args) {
    return origen().registrarDiagnostico(...args);
}

export function obtenerHistorialSaludAve(...args) {
    return origen().obtenerHistorialSaludAve(...args);
}

export function actualizarEstadoSaludAve(...args) {
    return origen().actualizarEstadoSaludAve(...args);
}
