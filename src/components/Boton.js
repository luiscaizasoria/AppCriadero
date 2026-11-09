import React from 'react';
import { ActivityIndicator, StyleSheet, Text } from 'react-native';
import { colors, radii, spacing, typography } from '../theme';
import Icono from './Icono';
import Pulsable from './Pulsable';

// Alturas y colores según propuesta-visual-v2 §4. Primario: color sólido (sin degradado ni sombra).
const VARIANTES = {
    primario: { fondo: colors.primary, texto: colors.white, borde: colors.primary, alto: 58 },
    secundario: { fondo: colors.surface, texto: colors.primaryDark, borde: colors.primary, alto: 52 },
    contorno: { fondo: colors.surface, texto: colors.primaryDark, borde: colors.primary, alto: 52 },
    peligro: { fondo: colors.danger, texto: colors.white, borde: colors.danger, alto: 52 },
    terciario: { fondo: 'transparent', texto: colors.primaryDark, borde: 'transparent', alto: 50, subrayado: true },
    texto: { fondo: 'transparent', texto: colors.primaryDark, borde: 'transparent', alto: 50, subrayado: true }
};

// Uso: <Boton titulo="Guardar" icono="guardar" onPress={fn} testID="btn-guardar" />
// variante: primario | secundario | contorno | peligro | terciario (texto)
export default function Boton({
    titulo,
    onPress,
    variante = 'primario',
    icono,
    cargando = false,
    disabled = false,
    testID,
    accessibilityLabel,
    style
}) {
    const v = VARIANTES[variante] || VARIANTES.primario;
    const inactivo = disabled || cargando;
    const deshabilitado = disabled && !v.subrayado;
    const colorTexto = deshabilitado ? colors.disabledText : v.texto;
    return (
        <Pulsable
            onPress={onPress}
            disabled={inactivo}
            testID={testID}
            accessibilityRole="button"
            accessibilityLabel={accessibilityLabel || titulo}
            accessibilityState={{ disabled: inactivo, busy: cargando }}
            sinMinimo
            style={[
                estilos.base,
                { minHeight: v.alto, backgroundColor: v.fondo, borderColor: v.borde },
                deshabilitado && estilos.deshabilitado,
                disabled && v.subrayado && estilos.apagado,
                style
            ]}
        >
            {cargando ? (
                <ActivityIndicator color={colorTexto} />
            ) : (
                <>
                    {icono ? <Icono nombre={icono} tamano={22} color={colorTexto} style={estilos.icono} /> : null}
                    {titulo ? (
                        <Text
                            style={[
                                typography.boton,
                                { color: colorTexto },
                                v.subrayado && estilos.subrayado
                            ]}
                        >
                            {titulo}
                        </Text>
                    ) : null}
                </>
            )}
        </Pulsable>
    );
}

const estilos = StyleSheet.create({
    base: {
        paddingHorizontal: spacing.lg,
        borderRadius: 20,
        borderWidth: 2.5,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center'
    },
    icono: { marginRight: spacing.sm },
    // Deshabilitado: fondo #E6E3EE, texto #5F5B73 (5,1:1), borde punteado 2 px, sin sombra
    deshabilitado: {
        backgroundColor: colors.disabledBg,
        borderColor: colors.disabledBorder,
        borderStyle: 'dashed',
        borderWidth: 2,
        borderRadius: radii.lg - 2
    },
    apagado: { opacity: 0.5 },
    subrayado: { textDecorationLine: 'underline' }
});
