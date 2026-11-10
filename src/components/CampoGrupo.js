import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { colors, radii, spacing, typography } from '../theme';
import Icono from './Icono';

// Envuelve un conjunto de opciones (píldoras, selectores) para marcar un error de validación:
// borde rojo y el mensaje debajo. Sin error, no añade nada visual. Ver useValidacion (`v.grupo`).
export default function CampoGrupo({ error, contenedorRef, children, style }) {
    return (
        <View ref={contenedorRef} collapsable={false} style={style}>
            <View style={error ? estilos.conError : null}>{children}</View>
            {error ? (
                <View style={estilos.fila}>
                    <Icono nombre="error" tamano={16} color={colors.dangerText} style={estilos.icono} />
                    <Text style={estilos.texto} accessibilityLiveRegion="polite">{error}</Text>
                </View>
            ) : null}
        </View>
    );
}

const estilos = StyleSheet.create({
    conError: {
        borderWidth: 2,
        borderColor: colors.danger,
        borderRadius: radii.md,
        padding: spacing.xs
    },
    fila: { flexDirection: 'row', alignItems: 'center', marginTop: spacing.xs, marginBottom: spacing.sm },
    icono: { marginRight: spacing.xs },
    texto: { ...typography.secundario, color: colors.dangerText, flex: 1 }
});
