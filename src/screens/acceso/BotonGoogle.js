import React, {
    useState
} from 'react';

import {
    Alert,
    View,
    Text,
    StyleSheet
} from 'react-native';

import {
    iniciarSesionConGoogle,
    mensajeErrorGoogle
} from '../../api/googleAuth';

import {
    colors,
    spacing,
    typography
} from '../../theme';

import {
    USAR_API
} from '../../config/dataSource';

import Boton from '../../components/Boton';
import useGuardaEnvio from '../../components/useGuardaEnvio';


/**
 * «Continuar con Google» con separador «o». Solo se monta en modo API.
 * Al terminar bien, App.js detecta la sesion guardada y cambia de pantalla.
 * `onError(mensaje)` muestra errores de la API en la pantalla; los de
 * disponibilidad (libreria ausente, Expo Go) salen en un Alert.
 */
export default function BotonGoogle({
    onError,
    testID = 'btn-google'
}) {

    const [procesando, setProcesando] =
        useState(false);

    const guardia = useGuardaEnvio();

    if (!USAR_API) {

        return null;

    }


    const continuar = async () => {

        try {

            setProcesando(true);

            onError?.(null);

            await iniciarSesionConGoogle();

        }
        catch (err) {

            if (err?.code === 'GOOGLE_NO_DISPONIBLE') {

                Alert.alert(
                    'Google',
                    err.message
                );

            }
            else {

                onError?.(mensajeErrorGoogle(err));

            }

        }
        finally {

            setProcesando(false);

        }

    };


    return (

        <View>

            <Text style={estilos.separador}>
                o
            </Text>

            <View>

                <Boton
                    titulo="Continuar con Google"
                    variante="secundario"
                    onPress={guardia(continuar)}
                    guardando={procesando}
                    tituloGuardando="Conectando..."
                    testID={testID}
                />

                {!procesando ? (

                    <View
                        style={estilos.logo}
                        pointerEvents="none"
                        accessibilityElementsHidden
                        importantForAccessibility="no-hide-descendants"
                    >

                        <Text style={estilos.letra}>
                            G
                        </Text>

                    </View>

                ) : null}

            </View>

        </View>

    );

}


const estilos = StyleSheet.create({

    separador: {
        ...typography.etiqueta,
        color: colors.textSecondary,
        textAlign: 'center',
        marginVertical: spacing.sm
    },

    logo: {
        position: 'absolute',
        left: spacing.md,
        top: 0,
        bottom: 0,
        justifyContent: 'center'
    },

    letra: {
        ...typography.boton,
        color: colors.primaryDark
    }

});
