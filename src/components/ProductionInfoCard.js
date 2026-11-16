import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { colors, radii, spacing, typography } from '../theme';
import IconoCirculo from './IconoCirculo';
import Icono from './Icono';
import Pulsable from './Pulsable';

// Fila de dato de producción (Mejor ponedora / Mayor postura): círculo de icono, título y valor.
// Con `onPress` es tocable (efecto de pulsación, chevron y rol de botón).
export default function ProductionInfoCard({
    icono,
    indice = 0,
    title,
    value,
    onPress,
    accessibilityLabel,
    testID
}) {
    const contenido = (
        <>
            <IconoCirculo icono={icono} indice={indice} tamano={36} />
            <Text style={estilos.titulo}>{title}</Text>
            <Text style={estilos.valor} maxFontSizeMultiplier={1.3}>
                {value}
            </Text>
            {onPress ? <Icono nombre="siguiente" tamano={20} color={colors.primaryDark} style={estilos.chevron} /> : null}
        </>
    );
    if (onPress) {
        return (
            <Pulsable
                testID={testID}
                onPress={onPress}
                accessibilityRole="button"
                accessibilityLabel={accessibilityLabel}
                sinMinimo
                style={estilos.contenedor}
            >
                {contenido}
            </Pulsable>
        );
    }
    return <View style={estilos.contenedor}>{contenido}</View>;
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
    valor: { ...typography.subtitulo, color: colors.primaryDark },
    chevron: { marginLeft: spacing.xs }
});
