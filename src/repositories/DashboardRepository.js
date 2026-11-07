/**
 * DashboardRepository: punto de entrada que usa InicioScreen (no cambia).
 *
 * Elige la implementacion segun src/config/dataSource.js:
 *   - SQLite local (V1, por defecto): DashboardRepository.sqlite.js
 *   - API en la nube:                  DashboardRepository.api.js
 */

import {
    USAR_API
} from '../config/dataSource';


function origen() {

    return USAR_API
        ? require('./DashboardRepository.api')
        : require('./DashboardRepository.sqlite');

}


export function obtenerDashboard(...args) {
    return origen().obtenerDashboard(...args);
}
