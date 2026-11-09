import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { colors, spacing, typography } from '../../theme';

// Barra de progreso con etiqueta y valor ("100%": valor y sufijo en un mismo Text).
export default function ProgressBar({ label, value, max = 100, suffix = '%' }) {
    const porcentaje = max > 0 ? Math.min((value / max) * 100, 100) : 0;

    return (
        <View style={estilos.contenedor}>
            <View style={estilos.cabecera}>
                <Text style={estilos.etiqueta}>{label}</Text>
                <Text style={estilos.valor}>
                    {value}
                    {suffix}
                </Text>
            </View>
            <View style={estilos.fondo}>
                <View style={[estilos.progreso, { width: `${porcentaje}%` }]} />
            </View>
        </View>
    );
}

const estilos = StyleSheet.create({
    contenedor: { marginBottom: spacing.md },
    cabecera: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
    etiqueta: { ...typography.etiqueta, color: colors.text },
    valor: { ...typography.etiqueta, color: colors.primaryDark },
    fondo: { height: 12, backgroundColor: colors.primarySoft, borderRadius: 6, overflow: 'hidden' },
    progreso: { height: '100%', backgroundColor: colors.primary, borderRadius: 6 }
});
