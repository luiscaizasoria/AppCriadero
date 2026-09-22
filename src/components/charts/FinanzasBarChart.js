import React from 'react';


import {
    View,
    Text,
    StyleSheet
} from 'react-native';


import {
    COLORS
} from '../../config/constants';



export default function FinanzasBarChart({

    ingresos = 0,

    egresos = 0,

    utilidad = 0

}) {



    const maximo =
        Math.max(
            ingresos,
            egresos,
            utilidad,
            1
        );



    const calcularAncho =
        (valor)=>
            `${(
                (valor / maximo)
                *
                100
            ).toFixed(2)}%`;





    const renderBarra =
    (
        titulo,
        valor,
        color
    ) => (

        <View
            style={styles.item}
        >


            <View
                style={styles.header}
            >


                <Text
                    style={styles.label}
                >

                    {titulo}

                </Text>



                <Text
                    style={[
                        styles.value,
                        {
                            color
                        }
                    ]}
                >

                    ${valor.toFixed(2)}

                </Text>


            </View>





            <View
                style={styles.background}
            >


                <View

                    style={[

                        styles.bar,

                        {
                            width:
                                calcularAncho(
                                    valor
                                ),

                            backgroundColor:
                                color

                        }

                    ]}

                />


            </View>


        </View>

    );





    return (

        <View>


            {
                renderBarra(

                    '💰 Ingresos',

                    ingresos,

                    '#2a9d8f'

                )
            }



            {
                renderBarra(

                    '📉 Egresos',

                    egresos,

                    '#d9534f'

                )
            }



            {
                renderBarra(

                    '📊 Utilidad',

                    utilidad,

                    COLORS.primary

                )
            }



        </View>

    );

}





const styles =
StyleSheet.create({



    item:{
        marginBottom:15
    },



    header:{
        flexDirection:'row',
        justifyContent:'space-between',
        marginBottom:6
    },



    label:{
        fontWeight:'600',
        color:
            COLORS.text
    },



    value:{
        fontWeight:'bold'
    },



    background:{
        height:14,
        backgroundColor:'#e8eeee',
        borderRadius:10,
        overflow:'hidden'
    },



    bar:{
        height:'100%',
        borderRadius:10
    }



});