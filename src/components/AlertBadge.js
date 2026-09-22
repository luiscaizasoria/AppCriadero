import React from 'react';


import {
    View,
    Text,
    StyleSheet
} from 'react-native';


import {
    COLORS
} from '../config/constants';





export default function AlertBadge({

    cantidad = 0

}) {


    if(
        cantidad <= 0
    ){

        return null;

    }



    return (

        <View

            style={
                styles.container
            }

        >

            <Text

                style={
                    styles.text
                }

            >

                🔔 {cantidad}

            </Text>


        </View>

    );

}







const styles =
StyleSheet.create({


    container:{

        backgroundColor:
            '#d9534f',

        minWidth:28,

        height:28,

        paddingHorizontal:8,

        borderRadius:15,

        justifyContent:'center',

        alignItems:'center'

    },



    text:{

        color:'#fff',

        fontWeight:'bold',

        fontSize:13

    }


});