/**
 * CicloVidaRepository: punto de entrada que usan las pantallas (no cambian).
 *
 *   - SQLite local (V1, por defecto): CicloVidaRepository.sqlite.js
 *   - API en la nube:                  CicloVidaRepository.api.js
 *
 * En modo API, obtenerCicloVidaAve reune en el cliente las lecturas de ave,
 * historial, evolucion, salud y huevos (sin endpoint propio).
 */

import {
    USAR_API
} from '../config/dataSource';


function sqlite() {

    return require('./CicloVidaRepository.sqlite');

}


function origen() {

    return USAR_API
        ? require('./CicloVidaRepository.api')
        : sqlite();

}


export function obtenerCicloVidaAve(...args) {
    return origen().obtenerCicloVidaAve(...args);
}

export function registrarEventoCicloVida(...args) {
    return origen().registrarEventoCicloVida(...args);
}
