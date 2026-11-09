import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, spacing, typography } from '../theme';
import Icono from './Icono';

// Migas tocables + título (no usado aún). Uso:
// <PantallaHeader titulo="Ficha del ave" migas={[{ texto: 'Aves', onPress: irAAves }]} />
export default function PantallaHeader({ titulo, migas = [], accion, testID = 'pantalla-header' }) {
    return (
        <View style={estilos.contenedor} testID={testID}>
            {migas.length > 0 ? (
                <View style={estilos.migas} accessibilityRole="header">
                    {migas.map((miga, i) => (
                        <View key={`${miga.texto}-${i}`} style={estilos.miga}>
                            <Pressable
                                onPress={miga.onPress}
                                disabled={!miga.onPress}
                                testID={`${testID}-miga-${i}`}
                                accessibilityRole="link"
                                accessibilityLabel={`Ir a ${miga.texto}`}
                                style={estilos.migaToque}
                            >
                                <Text style={estilos.migaTexto}>{miga.texto}</Text>
                            </Pressable>
                            <Icono nombre="siguiente" tamano={14} color={colors.textSecondary} />
                        </View>
                    ))}
                </View>
            ) : null}
            <View style={estilos.fila}>
                <Text style={estilos.titulo} accessibilityRole="header" numberOfLines={2}>{titulo}</Text>
                {accion || null}
            </View>
        </View>
    );
}

const estilos = StyleSheet.create({
    contenedor: { backgroundColor: colors.primarySoft, paddingHorizontal: spacing.lg, paddingVertical: spacing.md },
    migas: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center' },
    miga: { flexDirection: 'row', alignItems: 'center' },
    migaToque: { minHeight: 32, justifyContent: 'center', paddingRight: spacing.xs },
    migaTexto: { ...typography.secundario, color: colors.primaryDark, fontWeight: '600' },
    fila: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
    titulo: { ...typography.titulo, color: colors.text, flex: 1 }
});
