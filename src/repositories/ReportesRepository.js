/**
 * ReportesRepository: punto de entrada que usan las pantallas (no cambian).
 *
 * Elige la implementacion segun src/config/dataSource.js:
 *   - SQLite local (V1, por defecto): ReportesRepository.sqlite.js
 *   - API en la nube:                  ReportesRepository.api.js
 */

import {
    USAR_API
} from '../config/dataSource';


function origen() {

    return USAR_API
        ? require('./ReportesRepository.api')
        : require('./ReportesRepository.sqlite');

}


export function obtenerReporteAves(...args) {
    return origen().obtenerReporteAves(...args);
}

export function obtenerReporteSalud(...args) {
    return origen().obtenerReporteSalud(...args);
}

export function obtenerReporteProduccion(...args) {
    return origen().obtenerReporteProduccion(...args);
}

export function obtenerReporteFinanzas(...args) {
    return origen().obtenerReporteFinanzas(...args);
}

export function obtenerExportacionAves(...args) {
    return origen().obtenerExportacionAves(...args);
}

export function obtenerExportacionVentas(...args) {
    return origen().obtenerExportacionVentas(...args);
}

export function obtenerExportacionClientes(...args) {
    return origen().obtenerExportacionClientes(...args);
}

export function obtenerExportacionFinanzas(...args) {
    return origen().obtenerExportacionFinanzas(...args);
}

export function obtenerExportacionHuevos(...args) {
    return origen().obtenerExportacionHuevos(...args);
}

export function obtenerExportacionJaulas(...args) {
    return origen().obtenerExportacionJaulas(...args);
}
