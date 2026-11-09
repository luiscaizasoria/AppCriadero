import React from 'react';
import { StyleSheet, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { colors } from '../theme';

// Fondo de pantalla: UN solo LinearGradient diagonal con tres paradas pastel (rosa, lila, turquesa).
// Con la cabecera suman 2 degradados por pantalla. `liso` usa un color plano (gama baja).
// Uso: <FondoPantalla>...contenido...</FondoPantalla>
export default function FondoPantalla({ children, liso = false, style }) {
    if (liso) {
        return <View style={[estilos.fondo, { backgroundColor: colors.background }, style]}>{children}</View>;
    }
    return (
        <LinearGradient
            colors={colors.gradienteFondo}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={[estilos.fondo, style]}
        >
            {children}
        </LinearGradient>
    );
}

const estilos = StyleSheet.create({
    fondo: { flex: 1 }
});
