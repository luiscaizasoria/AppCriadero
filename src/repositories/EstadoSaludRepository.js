/**
 * EstadoSaludRepository: punto de entrada que usan las pantallas (no cambian).
 *
 * Reemplaza la copia muerta de NuevaAveScreen que ocupaba este archivo desde
 * v1.0.1 (decision del usuario, opcion A): vuelve a exportar
 * finalizarTratamiento como en v1.0.0.
 *
 *   - SQLite local (V1, por defecto): EstadoSaludRepository.sqlite.js
 *     (codigo de v1.0.0; renombrar a .sqlite.js cuando se pueda)
 *   - API en la nube:                  EstadoSaludRepository.api.js
 */

import {
    USAR_API
} from '../config/dataSource';


function origen() {

    return USAR_API
        ? require('./EstadoSaludRepository.api')
        : require('./EstadoSaludRepository.sqlite');

}


export function finalizarTratamiento(...args) {
    return origen().finalizarTratamiento(...args);
}
