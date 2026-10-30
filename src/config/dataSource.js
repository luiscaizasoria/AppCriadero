/**
 * Origen de los datos de la app.
 *
 * Por defecto la app usa SQLite local (V1, sin cambios). Para usar la API en
 * la nube se arranca Expo con variables de entorno, sin editar codigo:
 *
 *   EXPO_PUBLIC_DATA_SOURCE=api
 *   EXPO_PUBLIC_API_URL=http://<ip-del-servidor>:<puerto>
 *
 * Sin la variable, todo funciona exactamente como en V1.
 */

export const DATA_SOURCE =
    process.env.EXPO_PUBLIC_DATA_SOURCE === 'api'
        ? 'api'
        : 'sqlite';


export const USAR_API =
    DATA_SOURCE === 'api';


export const API_BASE_URL =
    (process.env.EXPO_PUBLIC_API_URL || '')
        .trim()
        .replace(/\/+$/, '');
