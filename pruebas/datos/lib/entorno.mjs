// La URL del Worker de pruebas SOLO viene de variables de entorno (nunca de archivos).
export function urlApi() {
    const url = (process.env.EXPO_PUBLIC_API_URL || process.env.KIKIRIKIS_API_URL || '')
        .trim()
        .replace(/\/+$/, '');

    if (!url) {
        console.error('Falta EXPO_PUBLIC_API_URL (URL del Worker de pruebas) en el entorno.');
        process.exit(2);
    }

    return url;
}

export function claveAleatoria() {
    return `Aa1-${Math.random().toString(36).slice(2)}${Math.random().toString(36).slice(2)}`;
}

export const DOMINIO = 'kikirikis.test';
