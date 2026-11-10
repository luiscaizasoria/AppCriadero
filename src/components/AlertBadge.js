import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { colors, radii, typography } from '../theme';
import Icono from './Icono';

// Insignia de alertas pendientes de Más: campana (Ionicons) + cantidad. Fondo `danger` (#C0182B),
// blanco encima 6,1:1. Antes era un solo Text «🔔 N»; ahora el Text solo lleva el número
// (testID `alertas-insignia-texto`, accessibilityLabel «N alertas pendientes»).
export default function AlertBadge({ cantidad = 0 }) {
    if (cantidad <= 0) {
        return null;
    }

    return (
        <View style={estilos.contenedor} testID="alertas-insignia">
            <Icono nombre="notifications" tamano={15} color={colors.white} style={estilos.icono} />
            <Text
                style={estilos.texto}
                testID="alertas-insignia-texto"
                accessibilityLabel={`${cantidad} alertas pendientes`}
                maxFontSizeMultiplier={1.3}
            >
                {String(cantidad)}
            </Text>
        </View>
    );
}

const estilos = StyleSheet.create({
    contenedor: {
        flexDirection: 'row',
        backgroundColor: colors.danger,
        minWidth: 44,
        height: 30,
        paddingHorizontal: 10,
        borderRadius: radii.pill,
        justifyContent: 'center',
        alignItems: 'center'
    },
    icono: { marginRight: 4 },
    texto: { ...typography.chip, color: colors.white }
});
