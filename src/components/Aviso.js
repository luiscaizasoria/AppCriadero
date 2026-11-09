import React, { useEffect } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, radii, shadows, spacing, typography } from '../theme';
import Icono from './Icono';

const TONOS = {
    exito: { fondo: colors.successSoft, texto: colors.success, icono: 'exito' },
    error: { fondo: colors.dangerSoft, texto: colors.danger, icono: 'error' },
    info: { fondo: colors.primarySoft, texto: colors.primaryDark, icono: 'info' },
    advertencia: { fondo: colors.warningSoft, texto: colors.warningText, icono: 'advertencia' }
};

// Aviso no bloqueante (no usado aún). Uso:
// {aviso && <Aviso mensaje={aviso} tono="exito" onCerrar={() => setAviso(null)} />}
// Se cierra solo tras `duracion` ms (0 = no se cierra solo).
export default function Aviso({ mensaje, tono = 'info', duracion = 4000, onCerrar, testID = 'aviso' }) {
    const t = TONOS[tono] || TONOS.info;

    useEffect(() => {
        if (!duracion || !onCerrar) return undefined;
        const id = setTimeout(onCerrar, duracion);
        return () => clearTimeout(id);
    }, [duracion, onCerrar, mensaje]);

    return (
        <View
            testID={testID}
            accessibilityLiveRegion="polite"
            style={[estilos.contenedor, { backgroundColor: t.fondo }]}
        >
            <Icono nombre={t.icono} tamano={22} color={t.texto} />
            <Text style={[estilos.texto, { color: t.texto }]}>{mensaje}</Text>
            {onCerrar ? (
                <Pressable
                    onPress={onCerrar}
                    testID={`${testID}-cerrar`}
                    accessibilityRole="button"
                    accessibilityLabel="Cerrar aviso"
                    style={estilos.cerrar}
                >
                    <Icono nombre="cerrar" tamano={20} color={t.texto} />
                </Pressable>
            ) : null}
        </View>
    );
}

const estilos = StyleSheet.create({
    contenedor: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingLeft: spacing.md,
        borderRadius: radii.md,
        minHeight: spacing.touch,
        ...shadows.card
    },
    texto: { ...typography.cuerpo, flex: 1, marginLeft: spacing.sm, paddingVertical: spacing.sm },
    cerrar: { width: spacing.touch, height: spacing.touch, alignItems: 'center', justifyContent: 'center' }
});
