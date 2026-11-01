/**
 * CicloVidaRepository: punto de entrada que usan las pantallas (no cambian).
 *
 *   - SQLite local (V1, por defecto): CicloVidaRepository.sqlite.js
 *   - API en la nube:                  CicloVidaRepository.api.js
 *
 * obtenerCicloVidaAve no tiene endpoint aun (depende de huevos, bajas y
 * salud): sigue en SQLite tambien en modo API (solo lee; con ids de la nube
 * devuelve []).
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
    return sqlite().obtenerCicloVidaAve(...args);
}

export function registrarEventoCicloVida(...args) {
    return origen().registrarEventoCicloVida(...args);
}
