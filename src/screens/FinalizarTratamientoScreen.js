import React,{
    useState
} from 'react';

import {
    View,
    Text,
    ScrollView,
    StyleSheet,
    Alert,
    KeyboardAvoidingView,
    Platform
} from 'react-native';

import {
    finalizarTratamiento
} from '../repositories/EstadoSaludRepository';

import {
    registrarEventoCicloVida
} from '../repositories/CicloVidaRepository';

import FondoPantalla
    from '../components/FondoPantalla';

import Tarjeta
    from '../components/Tarjeta';

import IconoCirculo
    from '../components/IconoCirculo';

import CampoTexto
    from '../components/CampoTexto';

import Boton
    from '../components/Boton';

import BarraAccion
    from '../components/BarraAccion';

import Aviso
    from '../components/Aviso';

import useAvisoExito
    from '../components/useAvisoExito';

import useGuardaEnvio
    from '../components/useGuardaEnvio';

import {
    colors,
    spacing,
    typography
} from '../theme';


export default function FinalizarTratamientoScreen({
    route,
    navigation
}) {

    const {
        aveId
    } = route.params;


    const [
        observacion,
        setObservacion
    ] = useState('');


    const [
        guardando,
        setGuardando
    ] = useState(false);


    const {
        aviso,
        mostrar: mostrarAviso,
        cerrar: cerrarAviso,
        saliendo
    } = useAvisoExito();


    const guardia = useGuardaEnvio();


    const guardar =
        async () => {

            try {

                setGuardando(
                    true
                );


                const observacionLimpia =
                    observacion.trim();


                const fechaRecuperacion =
                    new Date()
                        .toISOString();


                await finalizarTratamiento({

                    aveId,

                    observacion:
                        observacionLimpia

                });


                await registrarEventoCicloVida({

                    aveId,

                    tipoEvento:
                        'RECUPERACION',

                    fecha:
                        fechaRecuperacion,

                    detalle:
                        observacionLimpia
                            ? `Tratamiento finalizado. ${observacionLimpia}`
                            : 'Tratamiento finalizado. El ave volvió al estado sana.'

                });


                // Antes: Alert con «Aceptar» que hacía goBack. Ahora: aviso y vuelve solo.
                mostrarAviso(

                    'Tratamiento finalizado',

                    'El ave volvió al estado sana.',

                    () =>
                        navigation.goBack()

                );

            }
            catch(error){

                console.error(
                    error
                );


                Alert.alert(
                    'Error',
                    'No fue posible finalizar el tratamiento.'
                );

            }
            finally{

                setGuardando(
                    false
                );

            }

        };


    return (

        <FondoPantalla>

            <KeyboardAvoidingView
                style={
                    styles.container
                }
                behavior={
                    Platform.OS === 'ios'
                        ? 'padding'
                        : undefined
                }
            >

                <ScrollView
                    contentContainerStyle={
                        styles.content
                    }
                    keyboardShouldPersistTaps="handled"
                >

                    <Tarjeta>

                        <View
                            style={
                                styles.intro
                            }
                        >

                            <IconoCirculo
                                icono="checkmark-circle-outline"
                                color={colors.success}
                                tamano={48}
                            />

                            <Text
                                style={
                                    styles.introTexto
                                }
                            >
                                El ave volverá al estado sana.
                            </Text>

                        </View>


                        <CampoTexto
                            etiqueta="Observación"
                            multiline
                            value={
                                observacion
                            }
                            onChangeText={
                                setObservacion
                            }
                            placeholder="Ej. Ave recuperada correctamente..."
                            testID="observacion-recuperacion"
                            style={
                                styles.campo
                            }
                        />

                    </Tarjeta>

                </ScrollView>


                <BarraAccion>

                    <Boton
                        titulo="Confirmar recuperación"
                        icono="checkmark-circle-outline"
                        onPress={
                            guardia(guardar)
                        }
                        guardando={
                            guardando
                        }
                        atenuado={
                            saliendo
                        }
                        testID="confirmar-recuperacion"
                    />

                </BarraAccion>

            </KeyboardAvoidingView>


            {aviso ? (
                <Aviso
                    flotante
                    tono="exito"
                    duracion={0}
                    titulo={aviso.titulo}
                    mensaje={aviso.mensaje}
                    onCerrar={cerrarAviso}
                />
            ) : null}

        </FondoPantalla>

    );

}


const styles =
StyleSheet.create({

    container:{
        flex:1
    },


    content:{
        padding:spacing.pantalla,
        paddingBottom:spacing.xl
    },


    intro:{
        flexDirection:'row',
        alignItems:'center',
        marginBottom:spacing.lg
    },


    introTexto:{
        ...typography.cuerpoFuerte,
        color:
            colors.text,
        flex:1,
        marginLeft:spacing.md
    },


    campo:{
        marginBottom:0
    }

});
