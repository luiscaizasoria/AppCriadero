import React from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { colors, spacing, typography } from '../theme';

// Uso: <EstadoCarga mensaje="Cargando aves..." />
export default function EstadoCarga({ mensaje = 'Cargando...', testID = 'estado-carga' }) {
    return (
        <View
            style={estilos.contenedor}
            testID={testID}
            accessibilityRole="progressbar"
            accessibilityLabel={mensaje}
        >
            <ActivityIndicator size="large" color={colors.primaryDark} />
            <Text style={estilos.mensaje}>{mensaje}</Text>
        </View>
    );
}

const estilos = StyleSheet.create({
    contenedor: { alignItems: 'center', justifyContent: 'center', padding: spacing.xl },
    mensaje: { ...typography.cuerpo, color: colors.textSecondary, marginTop: spacing.md }
});
