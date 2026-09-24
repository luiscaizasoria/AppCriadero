import React, {
    useState
} from 'react';

import {
    Text,
    TextInput,
    ScrollView,
    TouchableOpacity,
    View,
    StyleSheet,
    Alert
} from 'react-native';


import {
    registrarSanidadJaula
} from '../repositories/SanidadJaulaRepository';


import {
    COLORS
} from '../config/constants';



const TIPOS = [
    'Normal',
    'Limpieza',
    'Fumigación',
    'Quemadura',
    'Cuarentena'
];



export default function SanidadJaulaScreen({
    route,
    navigation
}) {


    const {
        jaulaId
    } = route.params;



    const [
        tipo,
        setTipo
    ] = useState('Normal');



    const [
        detalle,
        setDetalle
    ] = useState('');




    const guardar =
        async () => {


            try {


                await registrarSanidadJaula({

                    jaulaId,

                    fecha:
                        new Date()
                        .toISOString(),

                    tipo,

                    detalle:
                        detalle.trim()

                });



                Alert.alert(

                    'Sanidad registrada',

                    `La jaula quedó en estado ${tipo}.`,

                    [
                        {
                            text:'Aceptar',

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

                    'No fue posible guardar el registro sanitario.'

                );


            }


        };





    return (

        <ScrollView

            style={
                styles.container
            }

            contentContainerStyle={
                styles.content
            }

        >


            <Text
                style={
                    styles.title
                }
            >
                🧼 Sanidad
            </Text>



            <Text
                style={
                    styles.subtitle
                }
            >
                Seleccione el estado sanitario actual de la jaula.
            </Text>




            <View
                style={
                    styles.options
                }
            >


                {
                    TIPOS.map(

                        item => (

                            <TouchableOpacity

                                key={
                                    item
                                }

                                style={[
                                    styles.option,

                                    tipo === item &&
                                    styles.selected
                                ]}


                                onPress={() =>
                                    setTipo(item)
                                }

                            >

                                <Text

                                    style={[
                                        styles.optionText,

                                        tipo === item &&
                                        styles.selectedText
                                    ]}

                                >

                                    {
                                        item === 'Normal'
                                        ?
                                        '🟢 Normal'
                                        :
                                        item
                                    }

                                </Text>


                            </TouchableOpacity>

                        )

                    )
                }


            </View>




            <TextInput

                style={
                    styles.textArea
                }

                multiline

                value={
                    detalle
                }

                onChangeText={
                    setDetalle
                }

                placeholder="Detalle de la actividad sanitaria..."

            />




            <TouchableOpacity

                style={
                    styles.save
                }

                onPress={
                    guardar
                }

            >

                <Text
                    style={
                        styles.saveText
                    }
                >

                    💾 Guardar sanidad

                </Text>


            </TouchableOpacity>



        </ScrollView>

    );

}




const styles =
StyleSheet.create({

    container:{
        flex:1,
        backgroundColor:
            COLORS.background
    },


    content:{
        padding:20
    },


    title:{
        fontSize:26,
        fontWeight:'bold',
        color:
            COLORS.primary,
        marginBottom:10
    },


    subtitle:{
        color:
            COLORS.textSecondary,
        marginBottom:20
    },


    options:{
        flexDirection:'row',
        flexWrap:'wrap'
    },


    option:{
        backgroundColor:'#e8eeee',
        paddingHorizontal:14,
        paddingVertical:10,
        borderRadius:20,
        marginRight:8,
        marginBottom:8
    },


    selected:{
        backgroundColor:
            COLORS.primary
    },


    optionText:{
        color:
            COLORS.text
    },


    selectedText:{
        color:'#fff',
        fontWeight:'bold'
    },


    textArea:{
        backgroundColor:
            COLORS.card,
        borderWidth:1,
        borderColor:'#d9e2e5',
        borderRadius:12,
        padding:13,
        minHeight:110,
        marginTop:20,
        textAlignVertical:'top'
    },


    save:{
        backgroundColor:
            COLORS.primary,
        borderRadius:14,
        padding:15,
        alignItems:'center',
        marginTop:30
    },


    saveText:{
        color:'#fff',
        fontWeight:'bold'
    }

});