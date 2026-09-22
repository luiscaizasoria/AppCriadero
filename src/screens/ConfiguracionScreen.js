import React from 'react';


import {
    View,
    Text,
    TouchableOpacity,
    StyleSheet
} from 'react-native';


import {
    COLORS
} from '../config/constants';



export default function ConfiguracionScreen({
    navigation
}) {


    const opciones = [

        {
            titulo:'🐔 Razas',
            codigo:'RAZAS'
        },

        {
            titulo:'🩺 Enfermedades',
            codigo:'ENFERMEDADES'
        },

        {
            titulo:'💊 Medicamentos',
            codigo:'MEDICAMENTOS'
        },

        {
            titulo:'🍚 Alimentos',
            codigo:'ALIMENTOS'
        },

        {
            titulo:'💧 Bebidas',
            codigo:'BEBIDAS'
        },

        {
            titulo:'💰 Categorías financieras',
            codigo:'CATEGORIAS_FINANCIERAS'
        }

    ];



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
                ⚙️ Configuración
            </Text>



            <Text
                style={
                    styles.subtitle
                }
            >
                Administración de catálogos del criadero
            </Text>




            {
                opciones.map(
                    item => (

                        <TouchableOpacity

                            key={
                                item.codigo
                            }

                            style={
                                styles.card
                            }

                            onPress={() =>
                                navigation.navigate(
                                    'Catalogo',
                                    {
                                        codigo:
                                            item.codigo,

                                        titulo:
                                            item.titulo
                                    }
                                )
                            }

                        >

                            <Text
                                style={
                                    styles.cardText
                                }
                            >
                                {
                                    item.titulo
                                }
                            </Text>


                        </TouchableOpacity>

                    )
                )
            }



        </View>

    );

}




const styles =
StyleSheet.create({

    container:{

        flex:1,

        backgroundColor:
            COLORS.background,

        padding:16

    },


    title:{

        fontSize:28,

        fontWeight:'bold',

        color:
            COLORS.primary

    },


    subtitle:{

        marginTop:8,

        marginBottom:25,

        color:
            COLORS.textSecondary

    },


    card:{

        backgroundColor:
            COLORS.card,

        padding:18,

        borderRadius:16,

        marginBottom:12

    },


    cardText:{

        fontSize:18,

        fontWeight:'600',

        color:
            COLORS.text

    }

});