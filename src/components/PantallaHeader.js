import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, spacing, typography } from '../theme';
import Icono from './Icono';

// Migas tocables + título. Uso:
// <PantallaHeader titulo="Salud" migas={[{ texto: 'Aves', onPress: irAAves }]} onAtras={volver} />
// `onAtras` (opcional) dibuja la flecha "atrás" a la izquierda del título.
export default function PantallaHeader({ titulo, migas = [], accion, onAtras, testID = 'pantalla-header' }) {
    return (
        <View style={estilos.contenedor} testID={testID}>
            {migas.length > 0 ? (
                <View style={estilos.migas}>
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
                                <Text style={estilos.migaTexto} numberOfLines={1}>{miga.texto}</Text>
                            </Pressable>
                            <Icono nombre="siguiente" tamano={14} color={colors.textSecondary} />
                        </View>
                    ))}
                </View>
            ) : null}
            <View style={estilos.fila}>
                {onAtras ? (
                    <Pressable
                        onPress={onAtras}
                        testID={`${testID}-atras`}
                        accessibilityRole="button"
                        accessibilityLabel="Volver"
                        hitSlop={8}
                        style={estilos.atras}
                    >
                        <Icono nombre="atras" tamano={26} color={colors.primaryDark} />
                    </Pressable>
                ) : null}
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
    migaToque: { minHeight: 44, minWidth: 44, justifyContent: 'center', paddingRight: spacing.xs },
    migaTexto: { ...typography.secundario, color: colors.primaryDark, fontWeight: '600' },
    fila: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
    atras: { minHeight: 44, minWidth: 44, justifyContent: 'center', alignItems: 'center', marginLeft: -spacing.sm },
    titulo: { ...typography.titulo, color: colors.text, flex: 1 }
});
