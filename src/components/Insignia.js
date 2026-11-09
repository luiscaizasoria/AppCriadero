import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { colors, radii, spacing, typography } from '../theme';

const TONOS = {
    neutro: { fondo: colors.surfaceAlt, texto: colors.text },
    primario: { fondo: colors.primarySoft, texto: colors.primaryDark },
    exito: { fondo: colors.successSoft, texto: colors.success },
    peligro: { fondo: colors.dangerSoft, texto: colors.danger },
    advertencia: { fondo: colors.warningSoft, texto: colors.warningText },
    info: { fondo: colors.primarySoft, texto: colors.info },
    acento: { fondo: colors.accent, texto: colors.accentText }
};

// Uso: <Insignia texto="Sana" tono="exito" testID="insignia-estado" />
export default function Insignia({ texto, tono = 'neutro', testID, style }) {
    const t = TONOS[tono] || TONOS.neutro;
    return (
        <View testID={testID} style={[estilos.insignia, { backgroundColor: t.fondo }, style]}>
            <Text style={[estilos.texto, { color: t.texto }]}>{texto}</Text>
        </View>
    );
}

const estilos = StyleSheet.create({
    insignia: {
        alignSelf: 'flex-start',
        paddingHorizontal: spacing.sm + 2,
        paddingVertical: spacing.xs,
        borderRadius: radii.pill
    },
    texto: { ...typography.micro, fontWeight: '600' }
});
