import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { colors, radii, shadows, spacing } from '../theme';

// Uso: <Tarjeta onPress={fn} testID="tarjeta-x">...</Tarjeta> (sin onPress es estática)
export default function Tarjeta({ children, onPress, testID, accessibilityLabel, style }) {
    if (onPress) {
        return (
            <Pressable
                onPress={onPress}
                testID={testID}
                accessibilityRole="button"
                accessibilityLabel={accessibilityLabel}
                style={({ pressed }) => [estilos.tarjeta, pressed && estilos.presionada, style]}
            >
                {children}
            </Pressable>
        );
    }
    return (
        <View testID={testID} accessibilityLabel={accessibilityLabel} style={[estilos.tarjeta, style]}>
            {children}
        </View>
    );
}

const estilos = StyleSheet.create({
    tarjeta: {
        backgroundColor: colors.surface,
        borderRadius: radii.lg,
        padding: spacing.lg,
        marginBottom: spacing.md,
        ...shadows.card
    },
    presionada: { opacity: 0.9 }
});
