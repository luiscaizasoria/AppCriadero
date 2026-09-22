import React from 'react';


import {
    TouchableOpacity,
    Text,
    StyleSheet
} from 'react-native';


import {
    COLORS
} from '../config/constants';



export default function AlertCard({

    nivel,

    tipo,

    titulo,

    mensaje,

    accionDestino,

    onPress

}) {


    let backgroundColor =
        '#fff3cd';


    let icon =
        '🟡';



    if(nivel === 'ALTO'){

        backgroundColor =
            '#fde2e2';

        icon =
            '🔴';

    }



    const obtenerAccion = ()=>{


        switch(accionDestino){


            case 'BEBIDA_JAULA':

                return '💧 Registrar bebida →';



            case 'ALIMENTACION_JAULA':

                return '🍚 Registrar alimentación →';



            case 'DETALLE_AVE':

                return '🐔 Revisar ave →';



            default:

                return 'Ver detalle →';

        }


    };





    return (

        <TouchableOpacity

            style={[
                styles.container,
                {
                    backgroundColor
                }
            ]}

            onPress={
                onPress
            }

            activeOpacity={0.8}

        >


            <Text style={styles.tipo}>

                {icon}

                {' '}

                {tipo}

            </Text>



            <Text style={styles.titulo}>

                {titulo}

            </Text>



            <Text style={styles.mensaje}>

                {mensaje}

            </Text>



            {
                onPress &&

                <Text style={styles.action}>

                    {
                        obtenerAccion()
                    }

                </Text>
            }


        </TouchableOpacity>

    );

}





const styles =
StyleSheet.create({


    container:{

        padding:15,

        borderRadius:14,

        marginBottom:12

    },


    tipo:{

        fontWeight:'bold',

        color:
            COLORS.primary

    },


    titulo:{

        marginTop:5,

        fontSize:16,

        fontWeight:'bold',

        color:
            COLORS.text

    },


    mensaje:{

        marginTop:5,

        color:
            COLORS.textSecondary

    },


    action:{

        marginTop:10,

        fontWeight:'bold',

        color:
            COLORS.primary

    }


});