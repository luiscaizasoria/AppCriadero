import React from 'react';
import { StyleSheet, Text } from 'react-native';
import { colors, spacing, typography } from '../theme';
import Tarjeta from './Tarjeta';
import IconoCirculo from './IconoCirculo';

// Acceso rápido de Inicio: tarjeta blanca con círculo de icono y rótulo. Solo navega a pantallas
// que ya existen. Uso: <AccesoRapido icono="anadir" indice={0} titulo="Nueva ave" onPress={fn} />
export default function AccesoRapido({ icono, indice = 0, titulo, onPress, testID }) {
    return (
        <Tarjeta onPress={onPress} testID={testID} style={estilos.tarjeta}>
            <IconoCirculo icono={icono} indice={indice} tamano={44} />
            <Text style={estilos.titulo} maxFontSizeMultiplier={1.3}>
                {titulo}
            </Text>
        </Tarjeta>
    );
}

const estilos = StyleSheet.create({
    tarjeta: {
        flex: 1,
        minHeight: 96,
        marginBottom: 0,
        marginRight: spacing.sm,
        paddingHorizontal: spacing.sm,
        paddingVertical: spacing.md,
        alignItems: 'center',
        justifyContent: 'center'
    },
    titulo: { ...typography.etiqueta, color: colors.text, textAlign: 'center', marginTop: spacing.sm }
});
