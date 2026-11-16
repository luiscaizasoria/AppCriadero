import React from 'react';
import { StyleSheet, View } from 'react-native';
import { colors } from '../theme';
import Tarjeta from './Tarjeta';
import Icono from './Icono';

// Tarjeta tocable con chevron a la derecha: indica que abre otra pantalla.
// Uso: <TarjetaEnlace onPress={fn} accessibilityLabel="Ver jaulas" testID="x">...</TarjetaEnlace>
export default function TarjetaEnlace({ children, onPress, accessibilityLabel, testID, franja, style }) {
    return (
        <Tarjeta
            onPress={onPress}
            accessibilityLabel={accessibilityLabel}
            testID={testID}
            franja={franja}
            style={style}
        >
            <View style={estilos.fila}>
                <View style={estilos.contenido}>{children}</View>
                <Icono nombre="siguiente" tamano={22} color={colors.primaryDark} style={estilos.chevron} />
            </View>
        </Tarjeta>
    );
}

const estilos = StyleSheet.create({
    fila: { flexDirection: 'row', alignItems: 'center' },
    contenido: { flex: 1, minWidth: 0 },
    chevron: { marginLeft: 8 }
});
