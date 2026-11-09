import React, { useEffect } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { colors, radii, spacing, typography } from '../theme';
import Icono from './Icono';
import Pulsable from './Pulsable';

const TONOS = {
    exito: { fondo: colors.successSoft, texto: colors.successText, franja: colors.success, icono: 'checkmark-circle' },
    error: { fondo: colors.dangerSoft, texto: colors.dangerText, franja: colors.danger, icono: 'alert-circle' },
    info: { fondo: colors.infoSoft, texto: colors.infoText, franja: colors.info, icono: 'information-circle' },
    advertencia: { fondo: colors.warningSoft, texto: colors.warningText, franja: colors.warning, icono: 'warning' }
};

// Aviso no bloqueante (su uso en pantallas es del bloque D). Uso:
// {aviso && <Aviso mensaje={aviso} tono="exito" onCerrar={() => setAviso(null)} />}
// Solo sustituye al Alert de ÉXITO; los Alert de confirmación se conservan.
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
            <View style={[estilos.franja, { backgroundColor: t.franja }]} />
            <Icono nombre={t.icono} tamano={22} color={t.texto} style={estilos.icono} />
            <Text style={[estilos.texto, { color: t.texto }]}>{mensaje}</Text>
            {onCerrar ? (
                <Pulsable
                    onPress={onCerrar}
                    testID={`${testID}-cerrar`}
                    accessibilityRole="button"
                    accessibilityLabel="Cerrar aviso"
                    style={estilos.cerrar}
                >
                    <Icono nombre="cerrar" tamano={20} color={t.texto} />
                </Pulsable>
            ) : null}
        </View>
    );
}

const estilos = StyleSheet.create({
    contenedor: {
        flexDirection: 'row',
        alignItems: 'center',
        borderRadius: radii.md,
        minHeight: spacing.touch,
        overflow: 'hidden'
    },
    franja: { alignSelf: 'stretch', width: 6 },
    icono: { marginLeft: spacing.md },
    texto: { ...typography.cuerpo, flex: 1, marginLeft: spacing.sm, paddingVertical: spacing.sm },
    cerrar: { width: spacing.touchMin, height: spacing.touchMin, alignItems: 'center', justifyContent: 'center' }
});
