import React, {
    useState
} from 'react';

import {
    View,
    StyleSheet
} from 'react-native';

import {
    registrarUsuario
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


export default function RegistroScreen({
    navigation
}) {

    const [nombre, setNombre] =
        useState('');

    const [email, setEmail] =
        useState('');

    const [password, setPassword] =
        useState('');

    const [procesando, setProcesando] =
        useState(false);

    const [error, setError] =
        useState(null);


    const registrar = async () => {

        if (!nombre.trim() || !email.trim() || !password) {

            setError('Completa tu nombre, correo y contraseña.');

            return;

        }

        try {

            setProcesando(true);

            setError(null);

            await registrarUsuario({
                nombre: nombre.trim(),
                email: email.trim(),
                password
            });

        }
        catch (err) {

            setError(
                err?.message ||
                'No fue posible crear la cuenta.'
            );

        }
        finally {

            setProcesando(false);

        }

    };


    return (

        <PantallaAcceso
            titulo="Crear cuenta"
            subtitulo="Tu información se guarda en la nube, asociada a tu cuenta."
            compacta
            testID="pantalla-registro"
        >

            <CampoTexto
                etiqueta="Nombre"
                icono="clientes"
                value={nombre}
                onChangeText={setNombre}
                placeholder="Tu nombre"
                testID="registro-nombre"
            />

            <CampoTexto
                etiqueta="Correo"
                icono="correo"
                value={email}
                onChangeText={setEmail}
                placeholder="correo@ejemplo.com"
                autoCapitalize="none"
                autoCorrect={false}
                keyboardType="email-address"
                testID="registro-correo"
            />

            <CampoContrasena
                etiqueta="Contraseña"
                value={password}
                onChangeText={setPassword}
                placeholder="Contraseña"
                testID="registro-contrasena"
            />

            <MensajeError mensaje={error} />

            <Boton
                titulo={procesando ? 'Creando...' : 'Crear cuenta'}
                onPress={registrar}
                cargando={procesando}
                testID="registro-crear"
                style={estilos.principal}
            />

            <View style={estilos.enlace}>

                <Boton
                    titulo="Ya tengo una cuenta"
                    variante="terciario"
                    onPress={() => navigation.navigate('Login')}
                    testID="registro-ya-tengo-cuenta"
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
