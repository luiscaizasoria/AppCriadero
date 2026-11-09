import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { colors, radii, spacing, typography } from '../theme';
import IconoCirculo from './IconoCirculo';

// Fila de dato de producción (Mejor ponedora / Mayor postura): círculo de icono, título y valor.
export default function ProductionInfoCard({ icono, indice = 0, title, value }) {
    return (
        <View style={estilos.contenedor}>
            <IconoCirculo icono={icono} indice={indice} tamano={36} />
            <Text style={estilos.titulo}>{title}</Text>
            <Text style={estilos.valor} maxFontSizeMultiplier={1.3}>
                {value}
            </Text>
        </View>
    );
}

const estilos = StyleSheet.create({
    contenedor: {
        backgroundColor: colors.surfaceAlt,
        borderRadius: radii.md,
        paddingVertical: spacing.sm,
        paddingHorizontal: spacing.md,
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: spacing.sm,
        minHeight: 52
    },
    titulo: { ...typography.etiqueta, flex: 1, color: colors.text, marginLeft: spacing.sm },
    valor: { ...typography.subtitulo, color: colors.primaryDark }
});
