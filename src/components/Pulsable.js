import React, { useRef } from 'react';
import { Animated, Pressable, StyleSheet } from 'react-native';
import { spacing, useReducirMovimiento } from '../theme';

const PressableAnimado = Animated.createAnimatedComponent(Pressable);

// Pressable común: garantiza 44x44 de área táctil, escala 0,97 al pulsar (spring nativo) y
// brillo -12 %. Con "reducir movimiento" solo cambia el brillo. `sinMinimo` quita el 44x44
// (tarjetas y filas grandes). `style` debe ser un objeto o arreglo (no función).
export default function Pulsable({
    children,
    style,
    escala = 0.97,
    sinMinimo = false,
    disabled,
    onPressIn,
    onPressOut,
    ...resto
}) {
    const reducir = useReducirMovimiento();
    const scale = useRef(new Animated.Value(1)).current;
    const brillo = useRef(new Animated.Value(1)).current;

    const animar = pulsado => {
        const animaciones = [
            Animated.timing(brillo, { toValue: pulsado ? 0.88 : 1, duration: 90, useNativeDriver: true })
        ];
        if (!reducir) {
            animaciones.push(
                Animated.spring(scale, {
                    toValue: pulsado ? escala : 1,
                    speed: 40,
                    bounciness: 6,
                    useNativeDriver: true
                })
            );
        }
        Animated.parallel(animaciones).start();
    };

    // La opacidad del estilo (p. ej. botón apagado 0,5) se multiplica por la del brillo.
    const opacidadEstilo = StyleSheet.flatten(style)?.opacity;
    const opacidad =
        typeof opacidadEstilo === 'number' ? Animated.multiply(brillo, opacidadEstilo) : brillo;

    return (
        <PressableAnimado
            {...resto}
            disabled={disabled}
            onPressIn={e => {
                animar(true);
                if (onPressIn) onPressIn(e);
            }}
            onPressOut={e => {
                animar(false);
                if (onPressOut) onPressOut(e);
            }}
            style={[
                sinMinimo ? null : { minWidth: spacing.touchMin, minHeight: spacing.touchMin },
                style,
                { opacity: opacidad, transform: [{ scale }] }
            ]}
        >
            {children}
        </PressableAnimado>
    );
}
