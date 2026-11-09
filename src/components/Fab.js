import React from 'react';
import { StyleSheet, Text } from 'react-native';
import { colors, radii, shadows, spacing, typography } from '../theme';
import Icono from './Icono';
import Pulsable from './Pulsable';

// Botón flotante: pill de 58 px, borde blanco 3 px, fondo coral (blanco encima 5,2:1) y sombra
// «flotante». Se coloca solo (position absolute, abajo a la derecha); `style` permite subirlo para
// que no tape la barra inferior o el contenido (se aplicará en C3/C4).
// Uso: <Fab titulo="Nueva jaula" icono="add" onPress={fn} testID="fab-nueva-jaula" />
export default function Fab({ titulo, icono = 'add', onPress, testID, accessibilityLabel, style }) {
    return (
        <Pulsable
            onPress={onPress}
            testID={testID}
            accessibilityRole="button"
            accessibilityLabel={accessibilityLabel || titulo}
            sinMinimo
            style={[estilos.fab, titulo ? estilos.conTitulo : estilos.redondo, style]}
        >
            <Icono nombre={icono} tamano={26} color={colors.white} />
            {titulo ? <Text style={estilos.titulo}>{titulo}</Text> : null}
        </Pulsable>
    );
}

const estilos = StyleSheet.create({
    fab: {
        position: 'absolute',
        right: spacing.pantalla,
        bottom: spacing.pantalla,
        height: 58,
        borderRadius: radii.pill,
        borderWidth: 3,
        borderColor: colors.white,
        backgroundColor: colors.coral,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        ...shadows.flotante
    },
    redondo: { width: 58 },
    conTitulo: { paddingHorizontal: spacing.lg },
    titulo: { ...typography.boton, color: colors.white, marginLeft: spacing.sm }
});
