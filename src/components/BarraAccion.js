import React from 'react';
import { StyleSheet, View } from 'react-native';
import { colors, shadows, spacing } from '../theme';

// Barra fija al pie de un formulario (donde vive «Guardar»). Va fuera del ScrollView, así el botón
// no se pierde al final de un formulario largo. Uso:
// <BarraAccion><Boton titulo="Guardar" .../></BarraAccion>
export default function BarraAccion({ children, fila = false, testID = 'barra-accion' }) {
    return (
        <View testID={testID} style={[estilos.barra, fila && estilos.fila]}>
            {children}
        </View>
    );
}

const estilos = StyleSheet.create({
    barra: {
        backgroundColor: colors.surface,
        borderTopWidth: 1,
        borderTopColor: colors.borderSoft,
        paddingHorizontal: spacing.pantalla,
        paddingTop: spacing.md,
        paddingBottom: spacing.md,
        ...shadows.barra
    },
    fila: { flexDirection: 'row', alignItems: 'center' }
});
