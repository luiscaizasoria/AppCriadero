import React, {
    useRef,
    useState
} from 'react';

import {
    Alert,
    View,
    StyleSheet
} from 'react-native';

import {
    changeEmail
} from '../../api/accesoApi';

import {
    spacing
} from '../../theme';

import Boton from '../../components/Boton';
import CampoTexto from '../../components/CampoTexto';
import useGuardaEnvio from '../../components/useGuardaEnvio';
import useValidacion from '../../components/useValidacion';

import {
    PantallaAcceso,
    CampoContrasena,
    MensajeError
} from './componentesAcceso';


function mensajeDe(err) {

    switch (err?.code) {

        case 'INVALID_CREDENTIALS':
            return 'La contraseña es incorrecta o la cuenta ya no puede cambiar de correo.';

        case 'EMAIL_ALREADY_REGISTERED':
            return 'Ese correo ya está registrado. Usa otro.';

        case 'RATE_LIMITED': {

            const s = Number(
                err?.data?.retryAfterSeconds ??
                err?.data?.data?.retryAfterSeconds
            );

            return Number.isFinite(s) && s > 0
                ? `Demasiados intentos. Espera ${Math.ceil(s)} segundos e inténtalo de nuevo.`
                : 'Demasiados intentos. Espera un momento e inténtalo de nuevo.';

        }

        case 'EMAIL_DELIVERY_FAILED':
            return 'No fue posible enviar el correo. Intenta de nuevo.';

        case 'NETWORK_ERROR':
            return 'No fue posible conectar con el servidor.';

        default:
            return err?.message || 'No fue posible cambiar el correo.';

    }

}


export default function CambiarCorreoScreen({
    navigation,
    route
}) {

    const emailActual =
        route?.params?.email || '';

    const [nuevoEmail, setNuevoEmail] =
        useState('');

    const [password, setPassword] =
        useState('');

    const [procesando, setProcesando] =
        useState(false);

    const [error, setError] =
        useState(null);


    const guardia = useGuardaEnvio();
    const scrollRef = useRef(null);
    const v = useValidacion(scrollRef);


    const cambiar = async () => {

        if (!nuevoEmail.trim() || !password) {

            setError(null);

            v.fallar(
                [
                    !nuevoEmail.trim() && 'nuevoEmail',
                    !password && 'password'
                ].filter(Boolean),
                'Ingresa el nuevo correo y tu contraseña.'
            );

            return;

        }

        try {

            setProcesando(true);

            setError(null);

            const data = await changeEmail({
                email: emailActual,
                password,
                nuevoEmail: nuevoEmail.trim()
            });

            navigation.navigate(
                'VerificarCorreo',
                {
                    email: data?.email || nuevoEmail.trim(),
                    hasActiveCode: true,
                    resendAfterSeconds: data?.resendAfterSeconds,
                    ts: Date.now()
                }
            );

        }
        catch (err) {

            const mensaje = mensajeDe(err);

            setError(mensaje);

            Alert.alert('No se pudo cambiar el correo', mensaje);

        }
        finally {

            setProcesando(false);

        }

    };


    return (

        <PantallaAcceso
            titulo="Cambiar correo"
            subtitulo="Escribe el correo correcto y tu contraseña. Te enviaremos un código nuevo."
            compacta
            scrollRef={scrollRef}
            testID="pantalla-cambiar-correo"
        >

            <CampoTexto
                etiqueta="Nuevo correo"
                icono="correo"
                value={nuevoEmail}
                onChangeText={setNuevoEmail}
                placeholder="correo@ejemplo.com"
                autoCapitalize="none"
                autoCorrect={false}
                keyboardType="email-address"
                testID="cambiar-correo-nuevo"
                {...v.props('nuevoEmail')}
            />

            <CampoContrasena
                etiqueta="Contraseña"
                value={password}
                onChangeText={setPassword}
                placeholder="Contraseña"
                testID="cambiar-correo-contrasena"
                {...v.props('password')}
            />

            <MensajeError mensaje={error} />

            <Boton
                titulo="Cambiar y reenviar código"
                onPress={guardia(cambiar)}
                guardando={procesando}
                tituloGuardando="Enviando..."
                testID="cambiar-correo-confirmar"
                style={estilos.principal}
            />

            <View style={estilos.enlace}>

                <Boton
                    titulo="Volver"
                    variante="terciario"
                    onPress={() => navigation.goBack()}
                    testID="cambiar-correo-volver"
                />

            </View>

        </PantallaAcceso>

    );

}


const estilos = StyleSheet.create({

    principal: {
        marginTop: spacing.sm
    },

    enlace: {
        marginTop: spacing.md
    }

});
