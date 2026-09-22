import React from 'react';


import {
    View,
    Text,
    StyleSheet
} from 'react-native';


import {
    COLORS
} from '../../config/constants';



export default function ProgressBar({

    label,

    value,

    max = 100,

    suffix = '%'

}) {


    const porcentaje =
        max > 0
        ?
        Math.min(
            (value / max) * 100,
            100
        )
        :
        0;



    return (

        <View
            style={styles.container}
        >


            <View
                style={styles.header}
            >

                <Text
                    style={styles.label}
                >

                    {label}

                </Text>


                <Text
                    style={styles.value}
                >

                    {value}
                    {suffix}

                </Text>


            </View>




            <View
                style={styles.background}
            >


                <View
                    style={[
                        styles.progress,

                        {
                            width:
                                `${porcentaje}%`
                        }

                    ]}
                />


            </View>


        </View>

    );

}





const styles =
StyleSheet.create({


    container:{
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
        fontWeight:'bold',
        color:
            COLORS.primary
    },


    background:{
        height:12,
        backgroundColor:'#e8eeee',
        borderRadius:10,
        overflow:'hidden'
    },


    progress:{
        height:'100%',
        backgroundColor:
            COLORS.primary,
        borderRadius:10
    }


});