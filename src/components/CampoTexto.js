import React from 'react';
import { StyleSheet, Text, TextInput, View } from 'react-native';
import { colors, radii, spacing, typography } from '../theme';

// Uso: <CampoTexto etiqueta="Nombre" value={v} onChangeText={set} error={msg} testID="campo-nombre" />
// Acepta el resto de props de TextInput (keyboardType, secureTextEntry, multiline...).
export default function CampoTexto({ etiqueta, error, ayuda, testID, style, inputStyle, ...resto }) {
    return (
        <View style={[estilos.contenedor, style]}>
            {etiqueta ? <Text style={estilos.etiqueta}>{etiqueta}</Text> : null}
            <TextInput
                testID={testID}
                accessibilityLabel={resto.accessibilityLabel || etiqueta}
                placeholderTextColor={colors.textSecondary}
                style={[estilos.input, error ? estilos.inputError : null, inputStyle]}
                {...resto}
            />
            {error ? (
                <Text style={estilos.error} accessibilityLiveRegion="polite">{error}</Text>
            ) : ayuda ? (
                <Text style={estilos.ayuda}>{ayuda}</Text>
            ) : null}
        </View>
    );
}

const estilos = StyleSheet.create({
    contenedor: { marginBottom: spacing.md },
    etiqueta: { ...typography.secundario, color: colors.text, fontWeight: '600', marginBottom: spacing.xs },
    input: {
        ...typography.cuerpo,
        minHeight: spacing.touch,
        color: colors.text,
        backgroundColor: colors.surface,
        borderWidth: 1,
        borderColor: colors.border,
        borderRadius: radii.md,
        paddingHorizontal: spacing.md
    },
    inputError: { borderColor: colors.danger },
    error: { ...typography.secundario, color: colors.danger, marginTop: spacing.xs },
    ayuda: { ...typography.secundario, color: colors.textSecondary, marginTop: spacing.xs }
});
