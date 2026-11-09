import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { colors, radii, shadows, spacing, typography } from '../theme';
import Icono from './Icono';

// Tres contadores de color (Críticas, Advertencias, Total). Cada texto es UN solo Text
// ("Críticas: 0": etiqueta + cifra anidada) para que lectores de pantalla y flujos lo lean
// completo; cada contador lleva icono (el color no es el único canal).
// Uso: <ResumenAlertas criticas={1} advertencias={2} total={3} />
export default function ResumenAlertas({ criticas = 0, advertencias = 0, total = 0 }) {
    return (
        <View style={estilos.fila}>
            <Contador icono="error" fondo={colors.danger} etiqueta="Críticas:" valor={criticas} />
            <Contador icono="advertencia" fondo={colors.warningSolid} etiqueta="Advertencias:" valor={advertencias} />
            <Contador icono="alertas" fondo={colors.primary} etiqueta="Total:" valor={total} />
        </View>
    );
}

function Contador({ icono, fondo, etiqueta, valor }) {
    return (
        <View style={[estilos.contador, { backgroundColor: fondo }]}>
            <Icono nombre={icono} tamano={22} color={colors.white} />
            <Text style={estilos.etiqueta} maxFontSizeMultiplier={1.3}>
                {etiqueta}
                {' '}
                <Text style={estilos.cifra}>{valor}</Text>
            </Text>
        </View>
    );
}

const estilos = StyleSheet.create({
    fila: { flexDirection: 'row', marginBottom: spacing.md },
    contador: {
        flex: 1,
        minHeight: 92,
        borderRadius: radii.lg,
        padding: spacing.sm,
        marginRight: spacing.sm,
        alignItems: 'center',
        justifyContent: 'center',
        ...shadows.resumen
    },
    etiqueta: { ...typography.chip, color: colors.white, textAlign: 'center', marginTop: spacing.xs },
    cifra: { ...typography.display, color: colors.white }
});
