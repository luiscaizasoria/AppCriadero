import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { colors, spacing, typography } from '../theme';
import IconoCirculo from './IconoCirculo';

// Título de sección con icono en círculo de color (sustituye al emoji del título).
// Uso: <TituloSeccion icono="huevo" indice={2}>Producción</TituloSeccion>
export default function TituloSeccion({ icono, indice = 0, children }) {
    return (
        <View style={estilos.fila}>
            {icono ? <IconoCirculo icono={icono} indice={indice} tamano={32} style={estilos.icono} /> : null}
            <Text style={estilos.texto} accessibilityRole="header">
                {children}
            </Text>
        </View>
    );
}

const estilos = StyleSheet.create({
    fila: { flexDirection: 'row', alignItems: 'center', marginTop: spacing.sm, marginBottom: spacing.sm },
    icono: { marginRight: spacing.sm },
    texto: { ...typography.subtitulo, color: colors.text, flex: 1 }
});
