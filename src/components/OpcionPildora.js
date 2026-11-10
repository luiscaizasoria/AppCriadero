import React from 'react';
import { StyleSheet, Text } from 'react-native';
import { colors, radii, spacing, typography } from '../theme';
import Icono from './Icono';
import Pulsable from './Pulsable';

// Opción de selección única en forma de píldora (tipo de movimiento, categoría...). Seleccionada:
// fondo primario y texto blanco (6,6:1) con icono; sin seleccionar: blanco, borde de campo y texto
// principal. Alto táctil 44. Uso:
// <OpcionPildora texto="Ingreso" icono="trending-up-outline" activo={x} onPress={fn} testID="tipo-ingreso" />
// `acento` (opcional): color de fondo y borde al estar seleccionada (por defecto, primario).
export default function OpcionPildora({ texto, icono, activo = false, onPress, testID, acento }) {
    const colorIcono = activo ? colors.white : colors.primaryDark;
    return (
        <Pulsable
            testID={testID}
            accessibilityRole="radio"
            accessibilityState={{ selected: activo }}
            onPress={onPress}
            sinMinimo
            style={[
                estilos.pildora,
                activo && estilos.activa,
                activo && acento ? { backgroundColor: acento, borderColor: acento } : null
            ]}
        >
            {icono || activo ? (
                <Icono nombre={icono || 'checkmark'} tamano={18} color={colorIcono} style={estilos.icono} />
            ) : null}
            <Text style={[estilos.texto, activo && estilos.textoActivo]}>{texto}</Text>
        </Pulsable>
    );
}

const estilos = StyleSheet.create({
    pildora: {
        minHeight: spacing.touchMin,
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: colors.surface,
        borderWidth: 2,
        borderColor: colors.border,
        borderRadius: radii.pill,
        paddingHorizontal: spacing.lg,
        marginRight: spacing.sm,
        marginBottom: spacing.sm
    },
    activa: { backgroundColor: colors.primary, borderColor: colors.primary },
    icono: { marginRight: spacing.xs },
    texto: { ...typography.cuerpo, color: colors.text },
    textoActivo: { ...typography.cuerpoFuerte, color: colors.white }
});
