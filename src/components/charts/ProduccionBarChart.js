import React from 'react';


import {
    View,
    Text,
    StyleSheet
} from 'react-native';


import {
    COLORS
} from '../../config/constants';



export default function ProduccionBarChart({

    data = []

}) {



    const maximo =
        Math.max(

            ...data.map(
                item =>
                    Number(
                        item.cantidad || 0
                    )
            ),

            1

        );




    return (

        <View>


            {
                data.map(

                    item => {


                        const porcentaje =

                            (
                                Number(
                                    item.cantidad || 0
                                )
                                /
                                maximo

                            )
                            *
                            100;




                        return (

                            <View

                                key={
                                    item.dia
                                }

                                style={
                                    styles.item
                                }

                            >



                                <View

                                    style={
                                        styles.header
                                    }

                                >


                                    <Text
                                        style={
                                            styles.label
                                        }
                                    >

                                        {
                                            item.dia
                                        }

                                    </Text>



                                    <Text

                                        style={
                                            styles.value
                                        }

                                    >

                                        {
                                            item.cantidad
                                        }
                                        {' '}
                                        huevos

                                    </Text>


                                </View>





                                <View

                                    style={
                                        styles.background
                                    }

                                >


                                    <View

                                        style={[
                                            styles.bar,

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
        fontWeight:'bold',
        color:
            '#e9c46a'
    },


    background:{
        height:14,
        backgroundColor:'#e8eeee',
        borderRadius:10,
        overflow:'hidden'
    },


    bar:{
        height:'100%',
        backgroundColor:'#e9c46a',
        borderRadius:10
    }


});