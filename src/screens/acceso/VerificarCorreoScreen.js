import React, {
    useEffect,
    useRef,
    useState
} from 'react';

import {
    Alert,
    View,
    StyleSheet
} from 'react-native';

import {
    verifyEmail,
    resendCode
} from '../../api/accesoApi';

import {
    spacing
} from '../../theme';

import Aviso from '../../components/Aviso';
import Boton from '../../components/Boton';
import CampoTexto from '../../components/CampoTexto';
import useAvisoExito from '../../components/useAvisoExito';
import useGuardaEnvio from '../../components/useGuardaEnvio';
import useValidacion from '../../components/useValidacion';

import {
    PantallaAcceso,
    MensajeError
} from './componentesAcceso';


const SEGUNDOS_REENVIO = 60;


function ocultarCorreo(email) {

    const [usuario, dominio] =
        String(email || '').split('@');

    if (!dominio) {
        return String(email || '');
    }

    return `${usuario.slice(0, 2)}***@${dominio}`;

}


function segundosDe(err) {

    const valor =
        err?.data?.retryAfterSeconds ??
        err?.data?.data?.retryAfterSeconds;

    const n = Number(valor);

    return Number.isFinite(n) && n > 0
        ? Math.ceil(n)
        : null;

}


// Mensajes en español por código de error de la API.
function mensajeDe(err, valorPorDefecto) {

    switch (err?.code) {

        case 'INVALID_VERIFICATION_CODE':
            return 'Código incorrecto o vencido. Revisa el código o solicita uno nuevo.';

        case 'VERIFICATION_ATTEMPTS_EXCEEDED':
            return 'Demasiados intentos. Solicita un código nuevo.';

        case 'RATE_LIMITED': {

            const s = segundosDe(err);

            return s
                ? `Demasiados intentos. Espera ${s} segundos e inténtalo de nuevo.`
                : 'Demasiados intentos. Espera un momento e inténtalo de nuevo.';

        }

        case 'EMAIL_DELIVERY_FAILED':
            return 'No fue posible enviar el correo. Intenta reenviar el código.';

        case 'NETWORK_ERROR':
            return 'No fue posible conectar con el servidor.';

        case 'CONFIGURATION_ERROR':
            return 'El servicio de correo no está disponible por ahora. Inténtalo más tarde.';

        default:
            return err?.message || valorPorDefecto;

    }

}


export default function VerificarCorreoScreen({
    navigation,
    route
}) {

    const params = route?.params || {};

    const email = params.email || '';

    const [hayCodigo, setHayCodigo] =
        useState(params.hasActiveCode !== false);

    const [codigo, setCodigo] =
        useState('');

    const [segundos, setSegundos] =
        useState(
            params.hasActiveCode === false
                ? 0
                : Number(params.resendAfterSeconds) || 0
        );

    const [verificando, setVerificando] =
        useState(false);

    const [reenviando, setReenviando] =
        useState(false);

    const [agotado, setAgotado] =
        useState(false);

    const [error, setError] =
        useState(null);


    const guardia = useGuardaEnvio();
    const scrollRef = useRef(null);
    const v = useValidacion(scrollRef);
    const exito = useAvisoExito();


    // Si se vuelve desde "Cambiar correo" llegan parámetros nuevos: se reinicia el estado.
    useEffect(() => {

        setHayCodigo(params.hasActiveCode !== false);

        setSegundos(
            params.hasActiveCode === false
                ? 0
                : Number(params.resendAfterSeconds) || 0
        );

        setCodigo('');
        setAgotado(false);
        setError(null);

    }, [
        params.email,
        params.hasActiveCode,
        params.resendAfterSeconds,
        params.ts
    ]);


    // Cuenta atrás del reenvío.
    useEffect(() => {

        if (segundos <= 0) {
            return undefined;
        }

        const temporizador = setTimeout(
            () => setSegundos(s => Math.max(0, s - 1)),
            1000
        );

        return () => clearTimeout(temporizador);

    }, [segundos]);


    const verificar = async () => {

        if (codigo.length !== 6) {

            setError(null);

            v.fallar(
                'codigo',
                'Ingresa el código de 6 dígitos.'
            );

            return;

        }

        try {

            setVerificando(true);

            setError(null);

            // Al terminar, guardarSesion cambia el estado y App pasa a SeleccionCriadero.
            await verifyEmail({
                email,
                code: codigo
            });

        }
        catch (err) {

            const mensaje =
                mensajeDe(err, 'No fue posible verificar el código.');

            if (err?.code === 'INVALID_VERIFICATION_CODE') {

                v.fallar('codigo', mensaje);

            }
            else if (err?.code === 'VERIFICATION_ATTEMPTS_EXCEEDED') {

                setAgotado(true);

                setError(mensaje);

            }
            else {

                Alert.alert('No se pudo verificar', mensaje);

                if (err?.code === 'RATE_LIMITED') {

                    setError(mensaje);

                }

            }

        }
        finally {

            setVerificando(false);

        }

    };


    const reenviar = async () => {

        try {

            setReenviando(true);

            setError(null);

            v.limpiarTodo();

            const data = await resendCode({ email });

            setHayCodigo(true);

            setAgotado(false);

            setCodigo('');

            setSegundos(
                Number(data?.resendAfterSeconds) || SEGUNDOS_REENVIO
            );

            exito.mostrar(
                'Código enviado',
                'Te enviamos un código nuevo.'
            );

        }
        catch (err) {

            const s = segundosDe(err);

            if (err?.code === 'RATE_LIMITED' && s) {

                setSegundos(s);

            }

            Alert.alert(
                'No se pudo enviar el código',
                mensajeDe(err, 'No fue posible enviar el código.')
            );

        }
        finally {

            setReenviando(false);

        }

    };


    const textoReenvio =
        !hayCodigo
            ? 'Enviar código'
            : segundos > 0
                ? `Reenviar código (${segundos} s)`
                : 'Reenviar código';


    return (

        <PantallaAcceso
            titulo="Verifica tu correo"
            subtitulo={
                hayCodigo
                    ? `Enviamos un código de 6 dígitos a ${ocultarCorreo(email)}.`
                    : `Tu cuenta ${ocultarCorreo(email)} aún no está verificada. Solicita un código para continuar.`
            }
            compacta
            scrollRef={scrollRef}
            testID="pantalla-verificar-correo"
        >

            {
                hayCodigo ?
                <CampoTexto
                    etiqueta="Código de verificación"
                    icono="contrasena"
                    value={codigo}
                    onChangeText={
                        texto => setCodigo(
                            texto.replace(/[^0-9]/g, '').slice(0, 6)
                        )
                    }
                    placeholder="000000"
                    keyboardType="number-pad"
                    maxLength={6}
                    autoCorrect={false}
                    autoComplete="one-time-code"
                    textContentType="oneTimeCode"
                    testID="codigo-verificacion"
                    {...v.props('codigo')}
                />
                : null
            }

            <MensajeError mensaje={error} />

            {
                exito.aviso ?
                <View style={estilos.exito}>
                    <Aviso
                        titulo={exito.aviso.titulo}
                        mensaje={exito.aviso.mensaje}
                        tono="exito"
                        duracion={0}
                        testID="verificar-aviso"
                    />
                </View>
                : null
            }

            {
                hayCodigo ?
                <Boton
                    titulo="Verificar"
                    onPress={guardia(verificar)}
                    guardando={verificando}
                    tituloGuardando="Verificando..."
                    disabled={agotado}
                    testID="btn-verificar"
                    style={estilos.principal}
                />
                : null
            }

            <View style={estilos.enlace}>

                <Boton
                    titulo={textoReenvio}
                    variante={
                        hayCodigo && !agotado
                            ? 'terciario'
                            : 'primario'
                    }
                    onPress={guardia(reenviar)}
                    guardando={reenviando}
                    tituloGuardando="Enviando..."
                    disabled={hayCodigo && segundos > 0}
                    testID="btn-reenviar"
                />

            </View>

            <View style={estilos.enlace}>

                <Boton
                    titulo="Cambiar correo"
                    variante="terciario"
                    onPress={
                        () => navigation.navigate(
                            'CambiarCorreo',
                            { email }
                        )
                    }
                    testID="link-cambiar-correo"
                />

            </View>

            <View style={estilos.enlace}>

                <Boton
                    titulo="Volver a iniciar sesión"
                    variante="terciario"
                    onPress={() => navigation.navigate('Login')}
                    testID="link-volver-login"
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
    },

    exito: {
        marginBottom: spacing.md
    }

});
