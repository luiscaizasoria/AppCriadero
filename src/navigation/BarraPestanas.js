import React, { useEffect, useRef, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { CommonActions } from '@react-navigation/native';
import Icono from '../components/Icono';
import Pulsable from '../components/Pulsable';
import { colors, radii, shadows, spacing, typography } from '../theme';
import { obtenerResumenAlertas } from '../repositories/AlertasRepository';

// Iconos por pestaña (contorno; relleno cuando está activa).
const ICONOS = {
    Inicio: ['inicio', 'inicioActivo', 'tab-inicio'],
    Jaulas: ['jaulas', 'jaulasActivo', 'tab-jaulas'],
    Aves: ['aves', 'avesActivo', 'tab-aves'],
    Finanzas: ['finanzas', 'finanzasActivo', 'tab-finanzas'],
    'Más': ['mas', 'masActivo', 'tab-mas']
};

// Las alertas pendientes cambian con las acciones del usuario; se vuelven a leer al enfocar Inicio
// o Más, como mucho una vez cada 10 s (la misma función que usa Más: obtenerResumenAlertas).
const INTERVALO_MIN_MS = 10000;

// Barra inferior a ancho completo (mínimo 64 de alto): cinco pestañas iguales (20 % cada una, para
// que los toques por coordenadas de los flujos Maestro sigan cayendo en la misma pestaña) y cápsula
// de color primario en la activa. Misma navegación que la barra estándar: tocar la activa vuelve
// a la raíz de su pila (lo resuelve el navegador de pila al recibir tabPress).
export default function BarraPestanas({ state, descriptors, navigation }) {
    const insets = useSafeAreaInsets();
    const [pendientes, setPendientes] = useState(0);
    const ultimaLectura = useRef(0);

    const montada = useRef(true);

    useEffect(() => () => {
        montada.current = false;
    }, []);

    // Solo se relee al enfocar Inicio o Más (la insignia vive en Más); cambiar a Jaulas, Aves o
    // Finanzas no dispara GET /alertas.
    const ruta = state.routes[state.index];
    const rutaActiva = ruta ? ruta.name : '';

    useEffect(() => {
        if (rutaActiva !== 'Inicio' && rutaActiva !== 'Más') return;
        const ahora = Date.now();
        if (ultimaLectura.current && ahora - ultimaLectura.current < INTERVALO_MIN_MS) {
            return;
        }
        ultimaLectura.current = ahora;
        Promise.resolve()
            .then(() => obtenerResumenAlertas())
            .then(resumen => {
                if (montada.current) setPendientes(Number(resumen && resumen.total) || 0);
            })
            .catch(() => {});
    }, [rutaActiva]);

    return (
        <View style={[estilos.barra, { paddingBottom: estilos.barra.paddingBottom + insets.bottom }]}>
            {state.routes.map((route, indice) => {
                const { options } = descriptors[route.key];
                const enfocada = state.index === indice;
                const etiqueta = options.title !== undefined ? options.title : route.name;
                const [inactivo, activo, testID] = ICONOS[route.name] || ['info', 'info', `tab-${route.name}`];
                const esMas = route.name === 'Más';
                const mostrarInsignia = esMas && pendientes > 0;
                const color = enfocada ? colors.white : colors.textSecondary;

                const alTocar = () => {
                    const evento = navigation.emit({
                        type: 'tabPress',
                        target: route.key,
                        canPreventDefault: true
                    });
                    if (!enfocada && !evento.defaultPrevented) {
                        navigation.dispatch({
                            ...CommonActions.navigate(route.name, undefined, { merge: true }),
                            target: state.key
                        });
                    }
                };

                const alMantener = () => {
                    navigation.emit({ type: 'tabLongPress', target: route.key });
                };

                return (
                    <Pulsable
                        key={route.key}
                        onPress={alTocar}
                        onLongPress={alMantener}
                        testID={testID}
                        accessibilityRole="tab"
                        accessibilityLabel={etiqueta}
                        accessibilityHint={mostrarInsignia ? `${pendientes} alertas pendientes` : undefined}
                        accessibilityState={{ selected: enfocada }}
                        sinMinimo
                        escala={0.95}
                        style={estilos.item}
                    >
                        <View style={[estilos.capsula, enfocada && estilos.capsulaActiva]}>
                            <View>
                                <Icono nombre={enfocada ? activo : inactivo} tamano={24} color={color} />
                                {mostrarInsignia ? (
                                    <View style={estilos.insignia} testID="tab-mas-insignia">
                                        <Text style={estilos.insigniaTexto} maxFontSizeMultiplier={1.2}>
                                            {pendientes > 99 ? '99+' : String(pendientes)}
                                        </Text>
                                    </View>
                                ) : null}
                            </View>
                            <Text
                                style={[estilos.etiqueta, { color }]}
                                numberOfLines={1}
                                maxFontSizeMultiplier={1.2}
                            >
                                {etiqueta}
                            </Text>
                        </View>
                    </Pulsable>
                );
            })}
        </View>
    );
}

const estilos = StyleSheet.create({
    barra: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: colors.surface,
        minHeight: 64,
        paddingTop: 5,
        paddingBottom: 5,
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        ...shadows.barra
    },
    item: { flex: 1, alignItems: 'center', justifyContent: 'center', height: 54 },
    capsula: {
        minWidth: 60,
        height: 54,
        paddingHorizontal: spacing.sm,
        borderRadius: 27,
        alignItems: 'center',
        justifyContent: 'center'
    },
    capsulaActiva: { backgroundColor: colors.primary },
    etiqueta: { ...typography.pestana, marginTop: 1 },
    insignia: {
        position: 'absolute',
        top: -6,
        right: -12,
        minWidth: 18,
        height: 18,
        paddingHorizontal: 4,
        borderRadius: radii.pill,
        backgroundColor: colors.danger,
        borderWidth: 2,
        borderColor: colors.surface,
        alignItems: 'center',
        justifyContent: 'center'
    },
    insigniaTexto: { ...typography.chip, fontSize: 11, lineHeight: 13, color: colors.white }
});
