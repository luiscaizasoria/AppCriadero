import React, { useEffect, useRef } from 'react';
import { Animated, Easing } from 'react-native';
import Svg, { Circle, Ellipse, Path } from 'react-native-svg';
import { colors, useReducirMovimiento } from '../theme';

// Kikiriki dibujado con react-native-svg (única pantalla de uso de la librería).
// `saltando` da `saltos` saltos (3 por omisión) y queda quieta: el bucle es FINITO porque uno
// infinito impide a Maestro detectar la pantalla en reposo. Se detiene al desmontar y no salta con
// "reducir movimiento". Decorativa: oculta a lectores de pantalla.
// Uso: <Mascota tamano={96} saltando />
export default function Mascota({ tamano = 96, saltando = false, saltos = 3, color = colors.turquesa, style }) {
    const reducir = useReducirMovimiento();
    const salto = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        if (!saltando || reducir) {
            salto.setValue(0);
            return undefined;
        }
        const bucle = Animated.loop(
            Animated.sequence([
                Animated.timing(salto, {
                    toValue: -tamano * 0.12,
                    duration: 320,
                    easing: Easing.out(Easing.quad),
                    useNativeDriver: true
                }),
                Animated.timing(salto, {
                    toValue: 0,
                    duration: 320,
                    easing: Easing.in(Easing.quad),
                    useNativeDriver: true
                }),
                Animated.delay(380)
            ]),
            { iterations: saltos }
        );
        bucle.start();
        return () => bucle.stop();
    }, [saltando, saltos, reducir, tamano, salto]);

    return (
        <Animated.View
            accessibilityElementsHidden
            importantForAccessibility="no-hide-descendants"
            pointerEvents="none"
            style={[{ width: tamano, height: tamano, transform: [{ translateY: salto }] }, style]}
        >
            <Svg width={tamano} height={tamano} viewBox="0 0 100 100">
                {/* patas */}
                <Path d="M42 82 L42 94 M36 94 L48 94 M60 82 L60 94 M54 94 L66 94" stroke="#FF8A1F" strokeWidth="4" strokeLinecap="round" fill="none" />
                {/* cresta */}
                <Ellipse cx="42" cy="22" rx="6" ry="9" fill={colors.coral} />
                <Ellipse cx="52" cy="19" rx="6" ry="10" fill={colors.coral} />
                <Ellipse cx="62" cy="23" rx="5" ry="8" fill={colors.coral} />
                {/* cuerpo */}
                <Ellipse cx="50" cy="56" rx="32" ry="28" fill={color} />
                <Ellipse cx="46" cy="66" rx="18" ry="14" fill="#FFFFFF" opacity="0.35" />
                {/* ala */}
                <Path d="M26 54 Q36 44 44 58 Q36 72 24 66 Z" fill="#0E9AA0" />
                {/* ojo */}
                <Circle cx="64" cy="46" r="7" fill="#FFFFFF" />
                <Circle cx="66" cy="46" r="3.5" fill={colors.text} />
                {/* pico */}
                <Path d="M79 50 L95 56 L79 62 Z" fill="#FF8A1F" />
            </Svg>
        </Animated.View>
    );
}
