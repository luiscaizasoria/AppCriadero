import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { colors, spacing, typography } from '../theme';
import Mascota from './Mascota';

// Uso: <EstadoCarga mensaje="Cargando aves..." />
// Mascota saltando + dos barras-esqueleto del 14 % primario (quieta con "reducir movimiento").
export default function EstadoCarga({ mensaje = 'Cargando...', testID = 'estado-carga' }) {
    return (
        <View
            style={estilos.contenedor}
            testID={testID}
            accessibilityRole="progressbar"
            accessibilityLabel={mensaje}
        >
            <Mascota tamano={80} saltando />
            <Text style={estilos.mensaje}>{mensaje}</Text>
            <View style={[estilos.barra, { width: '70%' }]} />
            <View style={[estilos.barra, { width: '50%' }]} />
        </View>
    );
}

const estilos = StyleSheet.create({
    contenedor: { alignItems: 'center', justifyContent: 'center', padding: spacing.xl },
    mensaje: { ...typography.cuerpo, color: colors.textSecondary, marginTop: spacing.md, marginBottom: spacing.md },
    barra: {
        height: 14,
        borderRadius: 7,
        marginTop: spacing.sm,
        backgroundColor: 'rgba(109,59,210,0.14)'
    }
});
