import React from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text } from 'react-native';
import { colors, radii, spacing, typography } from '../theme';
import Icono from './Icono';

const VARIANTES = {
    primario: { fondo: colors.primaryDark, texto: colors.white, borde: colors.primaryDark },
    secundario: { fondo: colors.primarySoft, texto: colors.primaryDark, borde: colors.primarySoft },
    contorno: { fondo: colors.surface, texto: colors.primaryDark, borde: colors.primaryDark },
    peligro: { fondo: colors.danger, texto: colors.white, borde: colors.danger },
    texto: { fondo: 'transparent', texto: colors.primaryDark, borde: 'transparent' }
};

// Uso: <Boton titulo="Guardar" icono="guardar" onPress={fn} testID="btn-guardar" />
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
    return (
        <Pressable
            onPress={onPress}
            disabled={inactivo}
            testID={testID}
            accessibilityRole="button"
            accessibilityLabel={accessibilityLabel || titulo}
            accessibilityState={{ disabled: inactivo, busy: cargando }}
            style={({ pressed }) => [
                estilos.base,
                { backgroundColor: v.fondo, borderColor: v.borde },
                inactivo && estilos.inactivo,
                pressed && estilos.presionado,
                style
            ]}
        >
            {cargando ? (
                <ActivityIndicator color={v.texto} />
            ) : (
                <>
                    {icono ? <Icono nombre={icono} tamano={20} color={v.texto} style={estilos.icono} /> : null}
                    {titulo ? <Text style={[typography.boton, { color: v.texto }]}>{titulo}</Text> : null}
                </>
            )}
        </Pressable>
    );
}

const estilos = StyleSheet.create({
    base: {
        minHeight: spacing.touch,
        paddingHorizontal: spacing.lg,
        borderRadius: radii.md,
        borderWidth: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center'
    },
    icono: { marginRight: spacing.sm },
    inactivo: { opacity: 0.5 },
    presionado: { opacity: 0.85 }
});
