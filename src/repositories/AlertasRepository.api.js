/**
 * AlertasRepository contra la API (modo API). Misma interfaz que
 * AlertasRepository.sqlite.js para las funciones que usan las pantallas:
 * obtenerTodasLasAlertas y obtenerResumenAlertas (solo lectura).
 *
 * Las alertas se calculan en el servidor. Se devuelve `data.alertas` tal cual
 * (sin aSnake ni Number(): claves tipo, nivel, titulo, mensaje, entidadId,
 * accion, accionDestino; entidadId es un UUID string o null).
 * No se cachea: cada llamada hace una peticion (V1 recalcula cada vez).
 * Errores de red/sesion: se propaga el ApiError. Ver documents/specs/alertas.md.
 *
 * Omitidas (ninguna pantalla las llama; solo existen en modo SQLite):
 * obtenerAlertasSalud, obtenerAlertasJaulas, obtenerAlertasProduccion y
 * obtenerAlertasFinanzas.
 */

import {
    apiFetch
} from '../api/apiClient';

import {
    rutaCriadero
} from '../api/huevosApi';


export async function obtenerTodasLasAlertas() {

    const base = await rutaCriadero();

    const data = await apiFetch(
        `${base}/alertas`
    );

    return data.alertas;

}


export async function obtenerResumenAlertas() {

    const alertas =
        await obtenerTodasLasAlertas();

    return {

        total:
            alertas.length,

        criticas:
            alertas.filter(
                item =>
                    item.nivel === 'ALTO'
            ).length,

        advertencias:
            alertas.filter(
                item =>
                    item.nivel === 'MEDIO'
            ).length

    };

}
