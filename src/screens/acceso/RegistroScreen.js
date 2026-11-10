import React, {
    useRef,
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
import useGuardaEnvio from '../../components/useGuardaEnvio';
import useValidacion from '../../components/useValidacion';

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


    const guardia = useGuardaEnvio();
    const scrollRef = useRef(null);
    const v = useValidacion(scrollRef);


    const registrar = async () => {

        if (!nombre.trim() || !email.trim() || !password) {

            // Mismo mensaje de antes, ahora bajo el primer campo vacío (borde rojo, scroll y foco).
            setError(null);

            v.fallar(
                !nombre.trim()
                    ? 'nombre'
                    : !email.trim()
                        ? 'email'
                        : 'password',
                'Completa tu nombre, correo y contraseña.'
            );

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
            scrollRef={scrollRef}
            testID="pantalla-registro"
        >

            <CampoTexto
                etiqueta="Nombre"
                icono="clientes"
                value={nombre}
                onChangeText={setNombre}
                placeholder="Tu nombre"
                testID="registro-nombre"
                {...v.props('nombre')}
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
                {...v.props('email')}
            />

            <CampoContrasena
                etiqueta="Contraseña"
                value={password}
                onChangeText={setPassword}
                placeholder="Contraseña"
                testID="registro-contrasena"
                {...v.props('password')}
            />

            <MensajeError mensaje={error} />

            <Boton
                titulo="Crear cuenta"
                onPress={guardia(registrar)}
                guardando={procesando}
                tituloGuardando="Creando..."
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
