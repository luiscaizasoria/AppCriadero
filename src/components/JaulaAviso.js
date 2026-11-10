import React, { useEffect, useRef, useState } from 'react';
import { Animated, StyleSheet, Text, View } from 'react-native';
import { colors, radii, spacing, typography, useReducirMovimiento } from '../theme';
import Icono from './Icono';
import Pulsable from './Pulsable';

// Aviso de ÉXITO no bloqueante para Jaulas: sustituye al Alert de éxito (los Alert de error y de
// confirmación se conservan). Muestra el MISMO título y mensaje del Alert, en dos textos separados.
//
// Hook: const { aviso, mostrar, cerrar, saliendo } = useAvisoExito();
//   mostrar(titulo, mensaje)           -> se ve 4 s y se cierra solo
//   mostrar(titulo, mensaje, despues)  -> se ve 1,8 s y luego ejecuta `despues` (la navegación que
//                                         antes hacía el «Aceptar»); `saliendo` pasa a true para que
//                                         el botón no acepte otro toque mientras tanto.
// Componente: <JaulaAviso aviso={aviso} onCerrar={cerrar} /> (flota arriba, sin mover el contenido).
const DURACION_VISIBLE = 4000;
const DURACION_ANTES_DE_SALIR = 1800;

export function useAvisoExito() {
    const [aviso, setAviso] = useState(null);
    const [saliendo, setSaliendo] = useState(false);
    const temporizador = useRef(null);

    useEffect(
        () => () => {
            if (temporizador.current) clearTimeout(temporizador.current);
        },
        []
    );

    const mostrar = (titulo, mensaje, despues) => {
        if (temporizador.current) clearTimeout(temporizador.current);
        setAviso({ titulo, mensaje });
        if (despues) {
            setSaliendo(true);
            temporizador.current = setTimeout(despues, DURACION_ANTES_DE_SALIR);
        } else {
            temporizador.current = setTimeout(() => setAviso(null), DURACION_VISIBLE);
        }
    };

    const cerrar = () => setAviso(null);

    return { aviso, mostrar, cerrar, saliendo };
}

export default function JaulaAviso({ aviso, onCerrar, testID = 'aviso' }) {
    const reducir = useReducirMovimiento();
    const opacidad = useRef(new Animated.Value(0)).current;
    const desplazamiento = useRef(new Animated.Value(-12)).current;

    useEffect(() => {
        if (!aviso) return;
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
    }, [aviso, reducir, opacidad, desplazamiento]);

    if (!aviso) return null;

    return (
        <Animated.View
            testID={testID}
            accessibilityLiveRegion="polite"
            style={[estilos.contenedor, { opacity: opacidad, transform: [{ translateY: desplazamiento }] }]}
        >
            <View style={estilos.franja} />
            <Icono nombre="checkmark-circle" tamano={24} color={colors.successText} style={estilos.icono} />
            <View style={estilos.textos}>
                <Text style={estilos.titulo}>{aviso.titulo}</Text>
                {aviso.mensaje ? <Text style={estilos.mensaje}>{aviso.mensaje}</Text> : null}
            </View>
            {onCerrar ? (
                <Pulsable
                    onPress={onCerrar}
                    testID={`${testID}-cerrar`}
                    accessibilityRole="button"
                    accessibilityLabel="Cerrar aviso"
                    style={estilos.cerrar}
                >
                    <Icono nombre="cerrar" tamano={20} color={colors.successText} />
                </Pulsable>
            ) : null}
        </Animated.View>
    );
}

const estilos = StyleSheet.create({
    contenedor: {
        position: 'absolute',
        top: spacing.sm,
        left: spacing.pantalla,
        right: spacing.pantalla,
        zIndex: 20,
        elevation: 6,
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: colors.successSoft,
        borderRadius: radii.md,
        minHeight: spacing.touch,
        overflow: 'hidden'
    },
    franja: { alignSelf: 'stretch', width: 6, backgroundColor: colors.success },
    icono: { marginLeft: spacing.md },
    textos: { flex: 1, marginLeft: spacing.sm, paddingVertical: spacing.sm },
    titulo: { ...typography.cuerpoFuerte, color: colors.successText },
    mensaje: { ...typography.secundario, color: colors.successText },
    cerrar: { width: spacing.touchMin, height: spacing.touchMin, alignItems: 'center', justifyContent: 'center' }
});
