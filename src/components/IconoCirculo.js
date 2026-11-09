import React from 'react';
import { StyleSheet, View } from 'react-native';
import { acentos, colors } from '../theme';
import Icono from './Icono';

// Ionicons dentro de un círculo de color (c1 a c4). `indice` elige un acento de la paleta
// (con su color de icono que cumple contraste); o pasar `color` y `colorIcono`.
// Decorativo: oculto a lectores de pantalla.
// Uso: <IconoCirculo icono="huevo" indice={1} tamano={44} />
export default function IconoCirculo({ icono, indice = 0, color, colorIcono, tamano = 44, borde = false, style }) {
    const acento = acentos[Math.abs(indice) % acentos.length];
    const fondo = color || acento.fondo;
    const glifo = colorIcono || (color ? colors.white : acento.icono);
    return (
        <View
            accessibilityElementsHidden
            importantForAccessibility="no-hide-descendants"
            style={[
                estilos.circulo,
                {
                    width: tamano,
                    height: tamano,
                    borderRadius: tamano / 2,
                    backgroundColor: fondo
                },
                borde && estilos.borde,
                style
            ]}
        >
            <Icono nombre={icono} tamano={Math.round(tamano * 0.5)} color={glifo} />
        </View>
    );
}

const estilos = StyleSheet.create({
    circulo: { alignItems: 'center', justifyContent: 'center' },
    borde: { borderWidth: 3, borderColor: colors.white }
});
