import { useEffect, useSyncExternalStore } from 'react';

// Texto de contexto por pantalla (p. ej. el código del ave "A-12") para las migas.
// Las pantallas de detalle lo publican con useContextoPantalla(route.key, texto);
// la cabecera de las pantallas siguientes lo lee. No toca datos ni parámetros de ruta.

const valores = new Map();
const oyentes = new Set();
let version = 0;

function avisar() {
    version += 1;
    oyentes.forEach(oyente => oyente());
}

function suscribir(oyente) {
    oyentes.add(oyente);
    return () => oyentes.delete(oyente);
}

export function useContextoPantalla(claveRuta, texto) {
    useEffect(() => {
        if (!claveRuta) {
            return;
        }
        if (texto) {
            if (valores.get(claveRuta) !== texto) {
                valores.set(claveRuta, texto);
                avisar();
            }
        } else if (valores.has(claveRuta)) {
            valores.delete(claveRuta);
            avisar();
        }
    }, [claveRuta, texto]);

    useEffect(() => () => {
        if (claveRuta && valores.delete(claveRuta)) {
            avisar();
        }
    }, [claveRuta]);
}

// Devuelve el Map de contextos; se vuelve a renderizar cuando cambia alguno.
export function useContextos() {
    useSyncExternalStore(suscribir, () => version);
    return valores;
}
