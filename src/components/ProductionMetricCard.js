import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { colors, radii, spacing, typography } from '../theme';
import IconoCirculo from './IconoCirculo';

// Métrica de producción (Hoy / Este mes): círculo de icono, título y "N huevos".
// El valor y el sufijo van en un mismo Text ("3 huevos").
export default function ProductionMetricCard({ icono, indice = 0, title, value, suffix = 'huevos' }) {
    return (
        <View style={estilos.contenedor}>
            <IconoCirculo icono={icono} indice={indice} tamano={40} />
            <View style={estilos.contenido}>
                <Text style={estilos.titulo}>{title}</Text>
                <Text style={estilos.valor} maxFontSizeMultiplier={1.3}>
                    {value}
                    {' '}
                    <Text style={estilos.sufijo}>{suffix}</Text>
                </Text>
            </View>
        </View>
    );
}

const estilos = StyleSheet.create({
    contenedor: {
        flex: 1,
        backgroundColor: colors.surfaceAlt,
        borderRadius: radii.md,
        padding: spacing.md,
        flexDirection: 'row',
        alignItems: 'center',
        marginHorizontal: spacing.xs
    },
    contenido: { flex: 1, marginLeft: spacing.sm },
    titulo: { ...typography.secundario, color: colors.textSecondary },
    valor: { ...typography.subtitulo, color: colors.primaryDark },
    sufijo: { ...typography.secundario, color: colors.textSecondary }
});
