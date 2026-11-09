import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { acentos, colors, radii, shadows, spacing, typography } from '../theme';
import Icono from './Icono';

// Tarjeta de métrica (resumen): color sólido de la paleta, cifra Fredoka 38 y círculo blanco
// translúcido decorativo arriba a la derecha (sin texto encima). `indice` elige el acento.
// Uso: <MetricCard icono="aves" title="Activas" value="24" indice={0} />
export default function MetricCard({ icono, title, value, indice = 0, testID }) {
    const acento = acentos[Math.abs(indice) % acentos.length];
    const texto = acento.icono;
    return (
        <View testID={testID} style={[estilos.tarjeta, { backgroundColor: acento.fondo }]}>
            <View
                pointerEvents="none"
                accessibilityElementsHidden
                importantForAccessibility="no-hide-descendants"
                style={estilos.adorno}
            />
            <Icono nombre={icono} tamano={26} color={texto} />
            <Text style={[estilos.cifra, { color: texto }]} maxFontSizeMultiplier={1.3}>
                {value}
            </Text>
            <Text style={[estilos.titulo, { color: texto }]} maxFontSizeMultiplier={1.3}>
                {title}
            </Text>
        </View>
    );
}

const estilos = StyleSheet.create({
    tarjeta: {
        flex: 1,
        minHeight: 104,
        borderRadius: radii.lg,
        padding: spacing.md,
        overflow: 'hidden',
        ...shadows.resumen
    },
    adorno: {
        position: 'absolute',
        top: -20,
        right: -20,
        width: 76,
        height: 76,
        borderRadius: 38,
        backgroundColor: colors.white,
        opacity: 0.2
    },
    cifra: { ...typography.cifra, marginTop: spacing.xs },
    titulo: { ...typography.etiqueta }
});
