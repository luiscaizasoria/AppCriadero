import { useCallback, useRef } from 'react';

// Guard contra doble envío (solo presentación): envuelve un manejador asíncrono para que un segundo
// toque mientras el primero sigue en curso se ignore. No cambia lo que hace el manejador.
// Uso: const guardia = useGuardaEnvio(); ... onPress={guardia(guardar)}
export default function useGuardaEnvio() {
    const enCurso = useRef(false);
    return useCallback(
        fn =>
            async (...args) => {
                if (enCurso.current) return undefined;
                enCurso.current = true;
                try {
                    return await fn(...args);
                } finally {
                    enCurso.current = false;
                }
            },
        []
    );
}
