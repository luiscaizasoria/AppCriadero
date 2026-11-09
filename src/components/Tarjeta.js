import React from 'react';
import { StyleSheet, View } from 'react-native';
import { colors, radii, spacing } from '../theme';
import Pulsable from './Pulsable';

// Tarjeta blanca de radio 22 con borde de 1 px y SIN sombra. `franja` (color) dibuja una franja
// lateral de 8 px que conserva su significado (jaula: estado sanitario; alerta: nivel).
// Uso: <Tarjeta onPress={fn} testID="tarjeta-x" franja={color}>...</Tarjeta> (sin onPress es estática)
export default function Tarjeta({ children, onPress, testID, accessibilityLabel, franja, style }) {
    const contenido = (
        <>
            {franja ? <View pointerEvents="none" style={[estilos.franja, { backgroundColor: franja }]} /> : null}
            {children}
        </>
    );
    const estiloTarjeta = [estilos.tarjeta, franja ? estilos.conFranja : null, style];

    if (onPress) {
        return (
            <Pulsable
                onPress={onPress}
                testID={testID}
                accessibilityRole="button"
                accessibilityLabel={accessibilityLabel}
                escala={0.98}
                sinMinimo
                style={estiloTarjeta}
            >
                {contenido}
            </Pulsable>
        );
    }
    return (
        <View testID={testID} accessibilityLabel={accessibilityLabel} style={estiloTarjeta}>
            {contenido}
        </View>
    );
}

const estilos = StyleSheet.create({
    tarjeta: {
        backgroundColor: colors.surface,
        borderRadius: radii.lg,
        borderWidth: 1,
        borderColor: colors.borderSoft,
        padding: spacing.lg,
        marginBottom: spacing.md,
        overflow: 'hidden'
    },
    conFranja: { paddingLeft: spacing.lg + 8 },
    franja: { position: 'absolute', left: 0, top: 0, bottom: 0, width: 8 }
});
