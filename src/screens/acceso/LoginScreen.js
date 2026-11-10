import React, {
    useRef,
    useState
} from 'react';

import {
    View,
    StyleSheet
} from 'react-native';

import {
    iniciarSesion
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


export default function LoginScreen({
    navigation
}) {

    const [email, setEmail] =
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


    const entrar = async () => {

        if (!email.trim() || !password) {

            // Mismo mensaje de antes, ahora bajo el primer campo vacío (borde rojo, scroll y foco).
            setError(null);

            v.fallar(
                [
                    !email.trim() && 'email',
                    !password && 'password'
                ].filter(Boolean),
                'Ingresa tu correo y tu contraseña.'
            );

            return;

        }

        try {

            setProcesando(true);

            setError(null);

            await iniciarSesion({
                email: email.trim(),
                password
            });

        }
        catch (err) {

            setError(
                err?.message ||
                'No fue posible iniciar sesión.'
            );

        }
        finally {

            setProcesando(false);

        }

    };


    return (

        <PantallaAcceso
            titulo="Iniciar sesión"
            subtitulo="Ingresa con tu cuenta para usar tus datos en la nube."
            lema="Control de aves, fácil"
            saltando
            scrollRef={scrollRef}
            testID="pantalla-login"
        >

            <CampoTexto
                etiqueta="Correo"
                icono="correo"
                value={email}
                onChangeText={setEmail}
                placeholder="correo@ejemplo.com"
                autoCapitalize="none"
                autoCorrect={false}
                keyboardType="email-address"
                testID="login-correo"
                {...v.props('email')}
            />

            <CampoContrasena
                etiqueta="Contraseña"
                value={password}
                onChangeText={setPassword}
                placeholder="Contraseña"
                testID="login-contrasena"
                {...v.props('password')}
            />

            <MensajeError mensaje={error} />

            <Boton
                titulo="Ingresar"
                onPress={guardia(entrar)}
                guardando={procesando}
                tituloGuardando="Ingresando..."
                testID="login-ingresar"
                style={estilos.principal}
            />

            <View style={estilos.enlace}>

                <Boton
                    titulo="Crear una cuenta"
                    variante="terciario"
                    onPress={() => navigation.navigate('Registro')}
                    testID="login-crear-cuenta"
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
