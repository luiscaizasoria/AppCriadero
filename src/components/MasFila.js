import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { colors, spacing, typography } from '../theme';
import Tarjeta from './Tarjeta';
import IconoCirculo from './IconoCirculo';
import Icono from './Icono';

// Fila de menú (Más, Configuración): tarjeta pulsable con círculo de icono, título, descripción
// opcional, un elemento a la derecha opcional (insignia) y flecha. Uso:
// <MasFila icono="clientes" indice={2} titulo="Clientes" descripcion="..." onPress={fn} />
// `color` (opcional) sustituye al acento de `indice` (p. ej. colors.danger).
export default function MasFila({ icono, indice = 0, color, titulo, descripcion, onPress, derecha, testID }) {
    return (
        <Tarjeta onPress={onPress} testID={testID} style={estilos.tarjeta}>
            <IconoCirculo icono={icono} indice={indice} color={color} tamano={48} />
            <View style={estilos.textos}>
                <Text style={estilos.titulo}>{titulo}</Text>
                {descripcion ? <Text style={estilos.descripcion}>{descripcion}</Text> : null}
            </View>
            {derecha || null}
            <Icono nombre="siguiente" tamano={22} color={colors.textSecondary} style={estilos.flecha} />
        </Tarjeta>
    );
}

const estilos = StyleSheet.create({
    tarjeta: {
        flexDirection: 'row',
        alignItems: 'center',
        minHeight: 76,
        paddingVertical: spacing.md
    },
    textos: { flex: 1, marginLeft: spacing.md },
    titulo: { ...typography.subtitulo, color: colors.text },
    descripcion: { ...typography.secundario, color: colors.textSecondary, marginTop: 2 },
    flecha: { marginLeft: spacing.sm }
});
