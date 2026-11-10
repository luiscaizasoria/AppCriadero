import React from 'react';
import { StyleSheet, Text } from 'react-native';
import { colors, radii, spacing, typography } from '../theme';
import Icono from './Icono';
import Pulsable from './Pulsable';

// Opción seleccionable en píldora (origen, raza, sexo, padres, jaula, filtros) con icono + texto.
// Seleccionada: fondo primario con texto blanco (6,6:1) y marca de verificación; no seleccionada:
// fondo suave con borde y texto oscuro. Alto mínimo 44. Uso:
// <AveOpcion texto="Macho" icono="male-outline" seleccionado={x} onPress={fn} testID="opcion-macho" />
export default function AveOpcion({ texto, icono, seleccionado = false, onPress, testID, style }) {
    const colorTexto = seleccionado ? colors.white : colors.text;
    return (
        <Pulsable
            onPress={onPress}
            testID={testID}
            accessibilityRole="button"
            accessibilityLabel={texto}
            accessibilityState={{ selected: seleccionado }}
            style={[estilos.base, seleccionado ? estilos.activa : estilos.inactiva, style]}
        >
            {icono ? <Icono nombre={icono} tamano={18} color={colorTexto} style={estilos.icono} /> : null}
            <Text style={[estilos.texto, { color: colorTexto }]}>{texto}</Text>
            {seleccionado ? <Icono nombre="checkmark" tamano={16} color={colors.white} style={estilos.marca} /> : null}
        </Pulsable>
    );
}

const estilos = StyleSheet.create({
    base: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: spacing.touchMin,
        paddingHorizontal: spacing.md,
        borderRadius: radii.pill,
        borderWidth: 2,
        marginRight: spacing.sm,
        marginBottom: spacing.sm
    },
    activa: { backgroundColor: colors.primary, borderColor: colors.primary },
    inactiva: { backgroundColor: colors.surfaceAlt, borderColor: colors.border },
    icono: { marginRight: spacing.xs },
    marca: { marginLeft: spacing.xs },
    texto: { ...typography.etiqueta }
});
