import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { colors, radii, spacing, typography } from '../theme';
import Icono from './Icono';
import Pulsable from './Pulsable';

// Opción de lista de selección única (tipo de alimento, de bebida o de sanidad). El estado
// seleccionado no depende del color: cambia el icono (radio lleno) y el borde se engrosa.
// Uso: <JaulaOpcion texto="Agua" seleccionado={tipo?.id === item.id} onPress={fn} icono="water-outline" />
export default function JaulaOpcion({ texto, seleccionado, onPress, icono, testID, disabled }) {
    return (
        <Pulsable
            onPress={onPress}
            disabled={disabled}
            testID={testID}
            accessibilityRole="radio"
            accessibilityState={{ selected: !!seleccionado, disabled: !!disabled }}
            sinMinimo
            style={[estilos.opcion, seleccionado && estilos.seleccionada]}
        >
            {icono ? (
                <View style={estilos.icono}>
                    <Icono nombre={icono} tamano={22} color={colors.primary} />
                </View>
            ) : null}
            <Text style={[estilos.texto, seleccionado && estilos.textoSeleccionado]}>{texto}</Text>
            <Icono
                nombre={seleccionado ? 'radio-button-on' : 'radio-button-off'}
                tamano={24}
                color={seleccionado ? colors.primary : colors.border}
            />
        </Pulsable>
    );
}

const estilos = StyleSheet.create({
    opcion: {
        minHeight: 56,
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: colors.surface,
        borderWidth: 2,
        borderColor: colors.borderSoft,
        borderRadius: radii.md,
        paddingHorizontal: spacing.lg,
        marginBottom: spacing.sm
    },
    seleccionada: { borderColor: colors.primary, backgroundColor: colors.primarySoft },
    icono: { marginRight: spacing.md },
    texto: { ...typography.cuerpo, color: colors.text, flex: 1 },
    textoSeleccionado: { ...typography.cuerpoFuerte, color: colors.primaryDark }
});
