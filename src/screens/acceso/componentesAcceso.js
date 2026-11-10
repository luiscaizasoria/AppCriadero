import React, {
    useState
} from 'react';

import {
    View,
    Text,
    ScrollView,
    KeyboardAvoidingView,
    Platform,
    StatusBar as BarraNativa,
    StyleSheet
} from 'react-native';

import {
    StatusBar
} from 'expo-status-bar';

import {
    colors,
    radii,
    spacing,
    typography
} from '../../theme';

import FondoPantalla from '../../components/FondoPantalla';
import Mascota from '../../components/Mascota';
import Pulsable from '../../components/Pulsable';
import Icono from '../../components/Icono';
import CampoTexto from '../../components/CampoTexto';
import Aviso from '../../components/Aviso';


const INSET_SUPERIOR =
    Platform.OS === 'android'
        ? (BarraNativa.currentHeight || 24)
        : 48;


/**
 * Marco comun del flujo de acceso: fondo con un solo degradado, barra de
 * estado oscura (legible sobre el degradado pastel), mascota, nombre de la
 * app y una tarjeta blanca con el contenido. `compacta` reduce la mascota.
 */
export function PantallaAcceso({
    children,
    titulo,
    subtitulo,
    lema,
    compacta = false,
    saltando = false,
    scrollRef,
    testID
}) {

    return (

        <FondoPantalla>

            <StatusBar style="dark" />

            <KeyboardAvoidingView
                style={estilos.flex}
                behavior={
                    Platform.OS === 'ios'
                        ? 'padding'
                        : undefined
                }
            >

                <ScrollView
                    ref={scrollRef}
                    contentContainerStyle={estilos.contenido}
                    keyboardShouldPersistTaps="handled"
                    testID={testID}
                >

                    <View
                        style={[
                            estilos.encabezado,
                            compacta && estilos.encabezadoCompacto
                        ]}
                    >

                        <Mascota
                            tamano={compacta ? 72 : 112}
                            saltando={saltando}
                        />

                        <Text style={estilos.marca}>
                            Criadero Kikirikis
                        </Text>

                        {
                            lema ?
                            <Text style={estilos.lema}>
                                {lema}
                            </Text>
                            : null
                        }

                    </View>

                    <View style={estilos.tarjeta}>

                        <Text
                            style={estilos.titulo}
                            accessibilityRole="header"
                        >
                            {titulo}
                        </Text>

                        {
                            subtitulo ?
                            <Text style={estilos.subtitulo}>
                                {subtitulo}
                            </Text>
                            : null
                        }

                        {children}

                    </View>

                </ScrollView>

            </KeyboardAvoidingView>

        </FondoPantalla>

    );

}


/**
 * Campo de contrasena con ojo de 44x44 para mostrar u ocultar.
 */
export function CampoContrasena(props) {

    const [visible, setVisible] =
        useState(false);

    return (

        <CampoTexto
            icono="contrasena"
            autoCapitalize="none"
            autoCorrect={false}
            {...props}
            secureTextEntry={!visible}
            accion={

                <Pulsable
                    onPress={() => setVisible(v => !v)}
                    accessibilityRole="button"
                    accessibilityLabel={
                        visible
                            ? 'Ocultar contraseña'
                            : 'Mostrar contraseña'
                    }
                    testID={
                        props.testID
                            ? `${props.testID}-ojo`
                            : undefined
                    }
                    style={estilos.ojo}
                >

                    <Icono
                        nombre={
                            visible
                                ? 'ocultarContrasena'
                                : 'verContrasena'
                        }
                        tamano={24}
                        color={colors.primaryDark}
                    />

                </Pulsable>

            }
        />

    );

}


/**
 * Mensaje de error (el texto es el mismo que ya se mostraba).
 */
export function MensajeError({
    mensaje,
    testID = 'acceso-error'
}) {

    if (!mensaje) {
        return null;
    }

    return (

        <View style={estilos.error}>

            <Aviso
                mensaje={mensaje}
                tono="error"
                duracion={0}
                testID={testID}
            />

        </View>

    );

}


const estilos = StyleSheet.create({

    flex: {
        flex: 1
    },

    contenido: {
        flexGrow: 1,
        paddingTop: INSET_SUPERIOR + spacing.lg,
        paddingHorizontal: spacing.pantalla,
        paddingBottom: spacing.xxl
    },

    encabezado: {
        alignItems: 'center',
        marginBottom: spacing.xl
    },

    encabezadoCompacto: {
        marginBottom: spacing.lg
    },

    marca: {
        ...typography.display,
        color: colors.primaryDark,
        marginTop: spacing.sm,
        textAlign: 'center'
    },

    lema: {
        ...typography.cuerpoFuerte,
        color: colors.textSecondary,
        marginTop: spacing.xs,
        textAlign: 'center'
    },

    tarjeta: {
        backgroundColor: colors.surface,
        borderRadius: 28,
        borderWidth: 1,
        borderColor: colors.borderSoft,
        padding: spacing.xl
    },

    titulo: {
        ...typography.titulo,
        color: colors.text
    },

    subtitulo: {
        ...typography.cuerpo,
        color: colors.textSecondary,
        marginTop: spacing.xs,
        marginBottom: spacing.lg
    },

    ojo: {
        width: spacing.touchMin,
        height: spacing.touchMin,
        marginRight: -spacing.sm,
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: radii.md
    },

    error: {
        marginBottom: spacing.md
    }

});
