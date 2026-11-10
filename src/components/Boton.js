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
    atenuado = false,
    // `guardando`: patrón común de guardado. Apaga el botón, quita el icono y muestra «Guardando...»
    // (o `tituloGuardando`) hasta que termina la operación.
    guardando = false,
    tituloGuardando = 'Guardando...',
    disabled = false,
    testID,
    accessibilityLabel,
    acento,
    style
}) {
    // `acento` (opcional): sustituye fondo y borde del botón primario (p. ej. verde de éxito).
    const base = VARIANTES[variante] || VARIANTES.primario;
    const v = acento ? { ...base, fondo: acento, borde: acento } : base;
    // `atenuado`: mientras envía, el botón conserva su texto, se ve apagado y no acepta otro toque
    // (sin spinner animado, que retrasa la detección de reposo de Maestro).
    const inactivo = disabled || cargando || atenuado || guardando;
    const tituloVisible = guardando ? tituloGuardando : titulo;
    const iconoVisible = guardando ? undefined : icono;
    const deshabilitado = disabled && !v.subrayado;
    const colorTexto = deshabilitado ? colors.disabledText : v.texto;
    return (
        <Pulsable
            onPress={onPress}
            disabled={inactivo}
            testID={testID}
            accessibilityRole="button"
            accessibilityLabel={guardando ? tituloGuardando : accessibilityLabel || titulo}
            accessibilityState={{ disabled: inactivo, busy: cargando || atenuado || guardando }}
            sinMinimo
            style={[
                estilos.base,
                { minHeight: v.alto, backgroundColor: v.fondo, borderColor: v.borde },
                deshabilitado && estilos.deshabilitado,
                (atenuado || guardando || (disabled && v.subrayado)) && estilos.apagado,
                style
            ]}
        >
            {cargando ? (
                <ActivityIndicator color={colorTexto} />
            ) : (
                <>
                    {iconoVisible ? <Icono nombre={iconoVisible} tamano={22} color={colorTexto} style={estilos.icono} /> : null}
                    {tituloVisible ? (
                        <Text
                            style={[
                                typography.boton,
                                { color: colorTexto },
                                v.subrayado && estilos.subrayado
                            ]}
                        >
                            {tituloVisible}
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
