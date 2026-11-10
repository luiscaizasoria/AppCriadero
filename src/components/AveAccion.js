import React from 'react';
import { StyleSheet, Text } from 'react-native';
import { colors, radii, spacing, typography } from '../theme';
import IconoCirculo from './IconoCirculo';
import Pulsable from './Pulsable';

// Mosaico de acción de la ficha del ave: círculo de icono de color + texto, sobre blanco con borde.
// Dos por fila (48 %). Alto mínimo 88. Uso:
// <AveAccion texto="Salud" icono="salud" indice={2} onPress={fn} testID="accion-salud" />
export default function AveAccion({ texto, icono, indice = 0, onPress, testID }) {
    return (
        <Pulsable
            onPress={onPress}
            testID={testID}
            accessibilityRole="button"
            accessibilityLabel={texto}
            escala={0.96}
            sinMinimo
            style={estilos.mosaico}
        >
            <IconoCirculo icono={icono} indice={indice} tamano={44} />
            <Text style={estilos.texto} numberOfLines={2}>{texto}</Text>
        </Pulsable>
    );
}

const estilos = StyleSheet.create({
    mosaico: {
        width: '48.5%',
        minHeight: 96,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: colors.surface,
        borderRadius: radii.md,
        borderWidth: 1,
        borderColor: colors.borderSoft,
        paddingHorizontal: spacing.sm,
        paddingVertical: spacing.md,
        marginBottom: spacing.md
    },
    texto: { ...typography.etiqueta, color: colors.text, marginTop: spacing.sm, textAlign: 'center' }
});
