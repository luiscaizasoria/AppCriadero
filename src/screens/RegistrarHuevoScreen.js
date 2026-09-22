import React, {
    useEffect,
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
    obtenerAvePorId
} from '../repositories/AveRepository';



import {
    registrarHuevo
} from '../repositories/HuevoRepository';



import {
    COLORS
} from '../config/constants';




export default function RegistrarHuevoScreen({
    route,
    navigation
}) {


    const {
        aveId
    } = route.params;



    const [
        ave,
        setAve
    ] = useState(null);



    const [
        observacion,
        setObservacion
    ] = useState('');



    const [
        guardando,
        setGuardando
    ] = useState(false);




    useEffect(

        () => {

            cargarAve();

        },

        []

    );




    const cargarAve =
        async () => {


            const data =
                await obtenerAvePorId(
                    aveId
                );


            setAve(
                data
            );


        };





    const guardar =
        async () => {


            try {


                setGuardando(
                    true
                );



                const codigo =
                    await registrarHuevo({

                        aveId,

                        jaulaId:
                            ave?.jaula_actual_id,

                        fecha:
                            new Date()
                            .toISOString(),

                        observacion:
                            observacion.trim()

                    });





                Alert.alert(

                    'Huevo registrado',

                    `Se generó el código ${codigo}`,

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
                    'Error registrando huevo:',
                    error
                );


                Alert.alert(
                    'Error',
                    'No fue posible registrar el huevo.'
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
                🥚 Registrar huevo
            </Text>



            {
                ave
                &&
                (

                    <View
                        style={
                            styles.card
                        }
                    >

                        <Text>
                            Ave:
                            {' '}
                            {ave.codigo}
                        </Text>


                        <Text>
                            Jaula:
                            {' '}
                            {
                                ave.jaula_codigo
                                ||
                                'Sin jaula'
                            }
                        </Text>


                    </View>

                )

            }





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

                placeholder="Ej. Huevo normal, tamaño grande..."

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
                        '🥚 Registrar huevo'
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
        fontSize:26,
        fontWeight:'bold',
        color:
            COLORS.primary
    },


    card:{
        backgroundColor:
            COLORS.card,
        padding:15,
        borderRadius:14,
        marginTop:20
    },


    label:{
        marginTop:25,
        marginBottom:8,
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
        minHeight:100,
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