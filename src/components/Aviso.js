import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet, Text, View } from 'react-native';
import { colors, radii, spacing, typography, useReducirMovimiento } from '../theme';
import Icono from './Icono';
import Pulsable from './Pulsable';

const TONOS = {
    exito: { fondo: colors.successSoft, texto: colors.successText, franja: colors.success, icono: 'checkmark-circle' },
    error: { fondo: colors.dangerSoft, texto: colors.dangerText, franja: colors.danger, icono: 'alert-circle' },
    info: { fondo: colors.infoSoft, texto: colors.infoText, franja: colors.info, icono: 'information-circle' },
    advertencia: { fondo: colors.warningSoft, texto: colors.warningText, franja: colors.warning, icono: 'warning' }
};

// Aviso no bloqueante. Uso:
// {aviso && <Aviso mensaje={aviso} tono="exito" onCerrar={() => setAviso(null)} />}
// Solo sustituye al Alert de ÉXITO; los Alert de confirmación se conservan.
// Se cierra solo tras `duracion` ms (0 = no se cierra solo).
// `titulo` (opcional): título y mensaje en textos separados (los flujos Maestro buscan el título).
// `flotante` (opcional): se superpone arriba de la pantalla con una entrada animada, sin mover el
// contenido (el padre debe ser el contenedor de la pantalla). Con `useAvisoExito` usar duracion={0}.
export default function Aviso({
    mensaje,
    titulo,
    tono = 'info',
    duracion = 4000,
    onCerrar,
    flotante = false,
    testID = 'aviso'
}) {
    const t = TONOS[tono] || TONOS.info;
    const reducir = useReducirMovimiento();
    const opacidad = useRef(new Animated.Value(flotante ? 0 : 1)).current;
    const desplazamiento = useRef(new Animated.Value(flotante ? -12 : 0)).current;

    useEffect(() => {
        if (!duracion || !onCerrar) return undefined;
        const id = setTimeout(onCerrar, duracion);
        return () => clearTimeout(id);
    }, [duracion, onCerrar, mensaje]);

    useEffect(() => {
        if (!flotante) return;
        if (reducir) {
            opacidad.setValue(1);
            desplazamiento.setValue(0);
            return;
        }
        opacidad.setValue(0);
        desplazamiento.setValue(-12);
        Animated.parallel([
            Animated.timing(opacidad, { toValue: 1, duration: 180, useNativeDriver: true }),
            Animated.timing(desplazamiento, { toValue: 0, duration: 180, useNativeDriver: true })
        ]).start();
    }, [flotante, titulo, mensaje, reducir, opacidad, desplazamiento]);

    return (
        <Animated.View
            testID={testID}
            accessibilityLiveRegion="polite"
            style={[
                estilos.contenedor,
                flotante && estilos.flotante,
                { backgroundColor: t.fondo },
                flotante && { opacity: opacidad, transform: [{ translateY: desplazamiento }] }
            ]}
        >
            <View style={[estilos.franja, { backgroundColor: t.franja }]} />
            <Icono nombre={t.icono} tamano={titulo ? 24 : 22} color={t.texto} style={estilos.icono} />
            {titulo ? (
                <View style={estilos.textos}>
                    <Text style={[estilos.titulo, { color: t.texto }]}>{titulo}</Text>
                    {mensaje ? <Text style={[estilos.mensaje, { color: t.texto }]}>{mensaje}</Text> : null}
                </View>
            ) : (
                <Text style={[estilos.texto, { color: t.texto }]}>{mensaje}</Text>
            )}
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
        </Animated.View>
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
    flotante: {
        position: 'absolute',
        top: spacing.sm,
        left: spacing.pantalla,
        right: spacing.pantalla,
        zIndex: 20,
        elevation: 6
    },
    franja: { alignSelf: 'stretch', width: 6 },
    icono: { marginLeft: spacing.md },
    texto: { ...typography.cuerpo, flex: 1, marginLeft: spacing.sm, paddingVertical: spacing.sm },
    textos: { flex: 1, marginLeft: spacing.sm, paddingVertical: spacing.sm },
    titulo: { ...typography.cuerpoFuerte },
    mensaje: { ...typography.secundario },
    cerrar: { width: spacing.touchMin, height: spacing.touchMin, alignItems: 'center', justifyContent: 'center' }
});
