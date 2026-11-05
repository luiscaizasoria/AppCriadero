/**
 * ReportesRepository contra la API (modo API). Misma interfaz que
 * ReportesRepository.sqlite.js: diez funciones sin parametros, solo lectura.
 *
 * Los reportes y exportaciones se calculan en el servidor.
 * - Resumenes: se devuelve `data` tal cual (sin aSnake ni Number()).
 * - Exportaciones: se devuelve `data.filas` tal cual. Las claves son PascalCase
 *   y su orden son las cabeceras del CSV (ExportService): no transformar,
 *   no usar aSnake, no reordenar.
 * Errores de red/sesion: se propaga el ApiError. Ver documents/specs/reportes.md.
 */

import {
    apiFetch
} from '../api/apiClient';

import {
    rutaCriadero
} from '../api/huevosApi';


async function resumen(nombre) {

    const base = await rutaCriadero();

    return apiFetch(
        `${base}/reportes/${nombre}`
    );

}


async function exportacion(nombre) {

    const base = await rutaCriadero();

    const data = await apiFetch(
        `${base}/reportes/exportaciones/${nombre}`
    );

    return data.filas;

}


export async function obtenerReporteAves() {
    return resumen('aves');
}

export async function obtenerReporteSalud() {
    return resumen('salud');
}

export async function obtenerReporteProduccion() {
    return resumen('produccion');
}

export async function obtenerReporteFinanzas() {
    return resumen('finanzas');
}

export async function obtenerExportacionAves() {
    return exportacion('aves');
}

export async function obtenerExportacionVentas() {
    return exportacion('ventas');
}

export async function obtenerExportacionClientes() {
    return exportacion('clientes');
}

export async function obtenerExportacionFinanzas() {
    return exportacion('finanzas');
}

export async function obtenerExportacionHuevos() {
    return exportacion('huevos');
}

export async function obtenerExportacionJaulas() {
    return exportacion('jaulas');
}
