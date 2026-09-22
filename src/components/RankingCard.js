import React from 'react';


import {
    View,
    Text,
    StyleSheet
} from 'react-native';


import {
    COLORS
} from '../config/constants';




export default function RankingCard({

    posicion,

    codigo,

    cantidad

}) {



    let medalla =
        '🐔';



    if(posicion === 1){

        medalla =
            '🥇';

    }


    if(posicion === 2){

        medalla =
            '🥈';

    }


    if(posicion === 3){

        medalla =
            '🥉';

    }





    return (

        <View

            style={
                styles.container
            }

        >


            <Text

                style={
                    styles.position
                }

            >

                {medalla}

            </Text>



            <View

                style={
                    styles.info
                }

            >

                <Text

                    style={
                        styles.codigo
                    }

                >

                    {codigo}

                </Text>



                <Text

                    style={
                        styles.cantidad
                    }

                >

                    {cantidad}
                    {' '}
                    huevos

                </Text>


            </View>



        </View>

    );

}




const styles =
StyleSheet.create({


    container:{

        flexDirection:'row',

        alignItems:'center',

        backgroundColor:
            '#f7fafa',

        padding:14,

        borderRadius:14,

        marginBottom:10

    },


    position:{

        fontSize:30,

        marginRight:15

    },


    info:{

        flex:1

    },


    codigo:{

        fontSize:18,

        fontWeight:'bold',

        color:
            COLORS.text

    },


    cantidad:{

        marginTop:4,

        color:
            COLORS.textSecondary

    }


});