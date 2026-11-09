import React from 'react';
import { Ionicons } from '@expo/vector-icons';
import { colors, icons } from '../theme';

// Uso: <Icono nombre="huevo" tamano={24} color={colors.primary} />
// `nombre` es un nombre lógico de theme/icons; si no existe se interpreta como glifo de Ionicons.
// Decorativo por defecto (oculto a lectores); pasar accessibilityLabel si es el único contenido.
export default function Icono({
    nombre,
    tamano = 24,
    color = colors.primaryDark,
    accessibilityLabel,
    testID,
    style
}) {
    const glifo = icons[nombre] || nombre;
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
