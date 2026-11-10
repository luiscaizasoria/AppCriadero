import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { colors, radii, spacing, typography } from '../theme';
import IconoCirculo from './IconoCirculo';

// Fila de «Mejores ponedoras» de Producción de huevos (C5). Misma información que RankingCard
// (código y «N huevos» en dos textos separados) pero con iconos en lugar de las medallas emoji.
// Posiciones 1 a 3: copa en coral, turquesa y violeta (icono con contraste AA); el resto, paw.
// No sustituye a RankingCard (compartida con otras pantallas).
// Uso: <HuevoRanking posicion={1} codigo="AV-P" cantidad={3} />
const ACENTOS = [3, 1, 0];

export default function HuevoRanking({ posicion, codigo, cantidad }) {
    const destacada = posicion >= 1 && posicion <= 3;
    return (
        <View style={estilos.fila} testID={`ranking-${codigo}`}>
            {destacada ? (
                <IconoCirculo icono="trophy-outline" indice={ACENTOS[posicion - 1]} tamano={44} />
            ) : (
                <IconoCirculo icono="paw-outline" color={colors.textSecondary} tamano={44} />
            )}
            <View style={estilos.info}>
                <Text style={estilos.codigo}>{codigo}</Text>
                <Text style={estilos.cantidad}>
                    {cantidad}
                    {' '}
                    huevos
                </Text>
            </View>
        </View>
    );
}

const estilos = StyleSheet.create({
    fila: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: colors.surfaceAlt,
        padding: spacing.md,
        borderRadius: radii.md,
        marginBottom: spacing.sm
    },
    info: { flex: 1, marginLeft: spacing.md },
    codigo: { ...typography.subtitulo, color: colors.text },
    cantidad: { ...typography.secundario, color: colors.textSecondary, marginTop: 2 }
});
