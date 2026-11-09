import React, {
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


    const entrar = async () => {

        if (!email.trim() || !password) {

            setError('Ingresa tu correo y tu contraseña.');

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
            />

            <CampoContrasena
                etiqueta="Contraseña"
                value={password}
                onChangeText={setPassword}
                placeholder="Contraseña"
                testID="login-contrasena"
            />

            <MensajeError mensaje={error} />

            <Boton
                titulo={procesando ? 'Ingresando...' : 'Ingresar'}
                onPress={entrar}
                atenuado={procesando}
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
