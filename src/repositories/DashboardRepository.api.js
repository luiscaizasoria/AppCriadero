/**
 * DashboardRepository contra la API (modo API). Misma interfaz que
 * DashboardRepository.sqlite.js: obtenerDashboard() (solo lectura).
 *
 * El dashboard se calcula en el servidor. Se devuelve `data` tal cual
 * (sin aSnake ni Number(): el objeto ya llega con las claves y el orden de V1;
 * los importes llegan como numeros, que FinanzasBarChart necesita para toFixed).
 * No se cachea: cada llamada hace una peticion (V1 recalcula cada vez).
 * Errores de red/sesion: se propaga el ApiError. Ver documents/specs/inicio.md.
 */

import {
    apiFetch
} from '../api/apiClient';

import {
    rutaCriadero
} from '../api/huevosApi';


export async function obtenerDashboard() {

    const base = await rutaCriadero();

    return apiFetch(
        `${base}/dashboard`
    );

}
