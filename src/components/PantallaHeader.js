import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, spacing, typography } from '../theme';
import Icono from './Icono';
import Pulsable from './Pulsable';

// Cabecera con degradado (primario -> secundario), esquinas inferiores de 34 px, migas tocables y
// título. Los círculos decorativos viven en los 110 px de la derecha, por eso el contenido lleva
// paddingRight 110 (el título nunca queda sobre un adorno). Uso:
// <PantallaHeader titulo="Salud" migas={[{ texto: 'Aves', onPress: irAAves }]} onAtras={volver} />
// `onAtras` (opcional) dibuja la flecha "atrás". `insetSuperior` suma el área de la barra de estado.
export default function PantallaHeader({
    titulo,
    migas = [],
    accion,
    onAtras,
    insetSuperior = 0,
    testID = 'pantalla-header'
}) {
    return (
        <LinearGradient
            colors={colors.gradienteCabecera}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={[estilos.contenedor, { paddingTop: insetSuperior + spacing.sm }]}
            testID={testID}
        >
            <View
                pointerEvents="none"
                accessibilityElementsHidden
                importantForAccessibility="no-hide-descendants"
                style={estilos.circuloA}
            />
            <View
                pointerEvents="none"
                accessibilityElementsHidden
                importantForAccessibility="no-hide-descendants"
                style={estilos.circuloB}
            />
            <View style={estilos.contenido}>
                {migas.length > 0 ? (
                    <View style={estilos.migas}>
                        {migas.map((miga, i) => (
                            <View key={`${miga.texto}-${i}`} style={estilos.miga}>
                                <Pulsable
                                    onPress={miga.onPress}
                                    disabled={!miga.onPress}
                                    testID={`${testID}-miga-${i}`}
                                    accessibilityRole="link"
                                    accessibilityLabel={`Ir a ${miga.texto}`}
                                    style={estilos.migaToque}
                                >
                                    <Text style={estilos.migaTexto} numberOfLines={1}>{miga.texto}</Text>
                                </Pulsable>
                                <Icono nombre="siguiente" tamano={14} color={colors.white} />
                            </View>
                        ))}
                    </View>
                ) : null}
                <View style={estilos.fila}>
                    {onAtras ? (
                        <Pulsable
                            onPress={onAtras}
                            testID={`${testID}-atras`}
                            accessibilityRole="button"
                            accessibilityLabel="Volver"
                            style={estilos.atras}
                        >
                            <Icono nombre="atras" tamano={26} color={colors.white} />
                        </Pulsable>
                    ) : null}
                    <Text style={estilos.titulo} accessibilityRole="header" numberOfLines={2} ellipsizeMode="tail">
                        {titulo}
                    </Text>
                    {accion || null}
                </View>
            </View>
        </LinearGradient>
    );
}

const estilos = StyleSheet.create({
    contenedor: {
        paddingHorizontal: spacing.pantalla,
        paddingBottom: spacing.lg,
        borderBottomLeftRadius: 34,
        borderBottomRightRadius: 34,
        overflow: 'hidden'
    },
    circuloA: {
        position: 'absolute',
        top: -34,
        right: -26,
        width: 110,
        height: 110,
        borderRadius: 55,
        backgroundColor: colors.turquesa,
        opacity: 0.9
    },
    circuloB: {
        position: 'absolute',
        bottom: -22,
        right: 30,
        width: 60,
        height: 60,
        borderRadius: 30,
        backgroundColor: colors.coral,
        opacity: 0.85
    },
    contenido: { paddingRight: 110 },
    migas: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center' },
    miga: { flexDirection: 'row', alignItems: 'center' },
    migaToque: { justifyContent: 'center', paddingRight: spacing.xs },
    migaTexto: { ...typography.secundario, color: colors.white },
    fila: { flexDirection: 'row', alignItems: 'center' },
    atras: {
        marginLeft: -spacing.sm,
        marginRight: spacing.xs,
        justifyContent: 'center',
        alignItems: 'center'
    },
    titulo: { ...typography.titulo, color: colors.white, flex: 1 }
});
