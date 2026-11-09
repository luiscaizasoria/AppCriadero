import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { colors, typography } from '../theme';
import FondoPantalla from './FondoPantalla';
import Mascota from './Mascota';

// Pantalla de espera del arranque: fondo + mascota saltando. Sin `mensaje` no pinta texto
// (se usa mientras cargan las fuentes, para no mostrar texto con una fuente equivocada).
export default function PantallaEspera({ mensaje, testID = 'pantalla-espera' }) {
    return (
        <FondoPantalla>
            <View style={estilos.centro} testID={testID}>
                <Mascota tamano={110} saltando />
                {mensaje ? <Text style={estilos.mensaje}>{mensaje}</Text> : null}
            </View>
        </FondoPantalla>
    );
}

const estilos = StyleSheet.create({
    centro: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 20 },
    mensaje: { ...typography.cuerpo, color: colors.textSecondary, marginTop: 16, textAlign: 'center' }
});
