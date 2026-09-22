import React,{
    useState
} from 'react';

import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    StyleSheet,
    Alert
} from 'react-native';

import {
    finalizarTratamiento
} from '../repositories/EstadoSaludRepository';

import {
    registrarEventoCicloVida
} from '../repositories/CicloVidaRepository';

import {
    COLORS
} from '../config/constants';


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


                Alert.alert(

                    'Tratamiento finalizado',

                    'El ave volvió al estado sana.',

                    [
                        {
                            text:
                                'Aceptar',

                            onPress:
                                () =>
                                navigation.goBack()
                        }
                    ]

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

        <View
            style={
                styles.container
            }
        >

            <Text
                style={
                    styles.title
                }
            >
                🩺 Finalizar tratamiento
            </Text>


            <Text
                style={
                    styles.label
                }
            >
                Observación
            </Text>


            <TextInput

                style={
                    styles.input
                }

                multiline

                value={
                    observacion
                }

                onChangeText={
                    setObservacion
                }

                placeholder="Ej. Ave recuperada correctamente..."

            />


            <TouchableOpacity

                style={
                    styles.button
                }

                onPress={
                    guardar
                }

                disabled={
                    guardando
                }

            >

                <Text
                    style={
                        styles.buttonText
                    }
                >

                    {
                        guardando
                        ?
                        'Guardando...'
                        :
                        '✅ Confirmar recuperación'
                    }

                </Text>

            </TouchableOpacity>

        </View>

    );

}


const styles =
StyleSheet.create({

    container:{

        flex:1,

        backgroundColor:
            COLORS.background,

        padding:20

    },


    title:{

        fontSize:25,

        fontWeight:'bold',

        color:
            COLORS.primary

    },


    label:{

        marginTop:25,

        fontWeight:'bold'

    },


    input:{

        backgroundColor:
            COLORS.card,

        borderWidth:1,

        borderColor:
            COLORS.border,

        borderRadius:12,

        padding:15,

        marginTop:10,

        minHeight:120,

        textAlignVertical:'top'

    },


    button:{

        backgroundColor:
            COLORS.primary,

        marginTop:30,

        padding:16,

        borderRadius:14,

        alignItems:'center'

    },


    buttonText:{

        color:'#fff',

        fontWeight:'bold'

    }

});
