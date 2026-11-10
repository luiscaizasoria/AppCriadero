import React from 'react';
import { Ionicons } from '@expo/vector-icons';
import Svg, { Circle, Ellipse, Line, Path } from 'react-native-svg';
import { colors, icons } from '../theme';

// Uso: <Icono nombre="huevo" tamano={24} color={colors.primary} />
// `nombre` es un nombre lógico de theme/icons; si no existe se interpreta como glifo de Ionicons.
// Decorativo por defecto (oculto a lectores); pasar accessibilityLabel si es el único contenido.
//
// Ionicons no trae un ave ni un grano: los glifos 'ave', 'ave-relleno' y 'grano' se dibujan con
// react-native-svg (ya instalado). Los antiguos 'paw' y 'nutrition' (huella y manzana) se
// redirigen a ellos para que ninguna pantalla muestre un icono que no es de criadero.
const ALIAS_SVG = {
    paw: 'ave-relleno',
    'paw-outline': 'ave',
    nutrition: 'grano',
    'nutrition-outline': 'grano',
    ave: 'ave',
    'ave-relleno': 'ave-relleno',
    grano: 'grano',
    // Jaula de barras: reemplaza a 'grid' / 'grid-outline' (cuadrícula) en todas las pantallas.
    jaula: 'jaula',
    'jaula-relleno': 'jaula-relleno',
    'grid-outline': 'jaula',
    grid: 'jaula-relleno'
};

function GlifoSvg({ tipo, tamano, color, style, testID, accesible, etiqueta }) {
    const relleno = tipo === 'ave-relleno';
    const props = {
        width: tamano,
        height: tamano,
        viewBox: '0 0 24 24',
        style,
        testID,
        accessible: accesible,
        accessibilityLabel: etiqueta,
        importantForAccessibility: accesible ? 'yes' : 'no-hide-descendants'
    };
    const trazo = { stroke: color, strokeWidth: 1.6, strokeLinecap: 'round', strokeLinejoin: 'round' };
    if (tipo === 'grano') {
        // Espiga de grano: tallo y tres pares de granos.
        return (
            <Svg {...props}>
                <Line x1="12" y1="22" x2="12" y2="8" {...trazo} />
                <Ellipse cx="12" cy="4.5" rx="1.9" ry="2.8" fill="none" {...trazo} />
                <Ellipse cx="8.4" cy="9.5" rx="1.8" ry="2.9" transform="rotate(-35 8.4 9.5)" fill="none" {...trazo} />
                <Ellipse cx="15.6" cy="9.5" rx="1.8" ry="2.9" transform="rotate(35 15.6 9.5)" fill="none" {...trazo} />
                <Ellipse cx="8.4" cy="15" rx="1.8" ry="2.9" transform="rotate(-35 8.4 15)" fill="none" {...trazo} />
                <Ellipse cx="15.6" cy="15" rx="1.8" ry="2.9" transform="rotate(35 15.6 15)" fill="none" {...trazo} />
            </Svg>
        );
    }
    if (tipo === 'jaula' || tipo === 'jaula-relleno') {
        // Jaula de barras: asa, techo curvo, cuatro barras verticales, base y patas.
        const lleno = tipo === 'jaula-relleno';
        return (
            <Svg {...props}>
                <Path d="M12 2.5 L12 5" fill="none" {...trazo} />
                <Path d="M4 19 L4 11 A8 6.5 0 0 1 20 11 L20 19 Z" fill={lleno ? color : 'none'} {...trazo} />
                <Line x1="8.7" y1="5.4" x2="8.7" y2="19" {...trazo} stroke={lleno ? colors.white : color} />
                <Line x1="12" y1="5" x2="12" y2="19" {...trazo} stroke={lleno ? colors.white : color} />
                <Line x1="15.3" y1="5.4" x2="15.3" y2="19" {...trazo} stroke={lleno ? colors.white : color} />
                <Line x1="2.8" y1="19" x2="21.2" y2="19" {...trazo} />
                <Line x1="6" y1="19" x2="6" y2="21.5" {...trazo} />
                <Line x1="18" y1="19" x2="18" y2="21.5" {...trazo} />
            </Svg>
        );
    }
    // Pollito/gallina de perfil: cuerpo, cabeza, pico, cresta y patas.
    const fill = relleno ? color : 'none';
    return (
        <Svg {...props}>
            <Ellipse cx="10.5" cy="14.5" rx="7" ry="5.2" fill={fill} {...trazo} />
            <Circle cx="16.5" cy="8.5" r="3.4" fill={fill} {...trazo} />
            <Path d="M19.6 8 L22.4 9.1 L19.6 10.2 Z" fill={color} stroke={color} strokeWidth={0.8} strokeLinejoin="round" />
            <Path d="M15.4 5.3 Q16.5 2.6 17.8 5.3" fill="none" {...trazo} />
            <Circle cx="17.3" cy="8" r="0.8" fill={relleno ? colors.white : color} />
            <Line x1="9" y1="19.7" x2="9" y2="22.5" {...trazo} />
            <Line x1="12.5" y1="19.7" x2="12.5" y2="22.5" {...trazo} />
        </Svg>
    );
}

export default function Icono({
    nombre,
    tamano = 24,
    color = colors.primaryDark,
    accessibilityLabel,
    testID,
    style
}) {
    const glifo = icons[nombre] || nombre;
    const svg = ALIAS_SVG[glifo];
    if (svg) {
        return (
            <GlifoSvg
                tipo={svg}
                tamano={tamano}
                color={color}
                style={style}
                testID={testID}
                accesible={!!accessibilityLabel}
                etiqueta={accessibilityLabel}
            />
        );
    }
    return (
        <Ionicons
            name={glifo}
            size={tamano}
            color={color}
            style={style}
            testID={testID}
            accessible={!!accessibilityLabel}
            accessibilityLabel={accessibilityLabel}
            importantForAccessibility={accessibilityLabel ? 'yes' : 'no-hide-descendants'}
        />
    );
}
