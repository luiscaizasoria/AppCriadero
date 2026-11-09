import { useEffect, useState } from 'react';
import { AccessibilityInfo } from 'react-native';

// Un solo listener compartido por todos los componentes (no uno por Pulsable).
let valorActual = false;
let iniciado = false;
const oyentes = new Set();

function publicar(valor) {
    valorActual = !!valor;
    oyentes.forEach(fn => fn(valorActual));
}

function iniciar() {
    if (iniciado) return;
    iniciado = true;
    AccessibilityInfo.isReduceMotionEnabled()
        .then(publicar)
        .catch(() => {});
    AccessibilityInfo.addEventListener('reduceMotionChanged', publicar);
}

// true si el usuario pidió reducir el movimiento (Ajustes > Accesibilidad).
// Con true: sin saltos, sin entrada escalonada y la pulsación solo cambia el brillo.
export function useReducirMovimiento() {
    const [reducir, setReducir] = useState(valorActual);

    useEffect(() => {
        iniciar();
        oyentes.add(setReducir);
        setReducir(valorActual);
        return () => {
            oyentes.delete(setReducir);
        };
    }, []);

    return reducir;
}

export const useAnimacionesReducidas = useReducirMovimiento;
