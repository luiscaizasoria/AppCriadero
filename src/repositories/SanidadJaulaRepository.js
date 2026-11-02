/**
 * SanidadJaulaRepository: punto de entrada que usan las pantallas (no cambian).
 *
 * Elige la implementacion segun src/config/dataSource.js:
 *   - SQLite local (V1, por defecto): SanidadJaulaRepository.sqlite.js
 *   - API en la nube:                  SanidadJaulaRepository.api.js
 */

import {
    USAR_API
} from '../config/dataSource';


function origen() {

    return USAR_API
        ? require('./SanidadJaulaRepository.api')
        : require('./SanidadJaulaRepository.sqlite');

}


export function registrarSanidadJaula(...args) {
    return origen().registrarSanidadJaula(...args);
}
