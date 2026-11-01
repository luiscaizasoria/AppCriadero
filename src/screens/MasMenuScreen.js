import React, {
    useCallback,
    useState
} from 'react';

import {
    View,
    Text,
    TouchableOpacity,
    StyleSheet,
    ScrollView,
    Alert
} from 'react-native';

import {
    useFocusEffect
} from '@react-navigation/native';


import {
    COLORS
} from '../config/constants';


import {
    USAR_API
} from '../config/dataSource';


import {
    obtenerResumenAlertas
} from '../repositories/AlertasRepository';


import AlertBadge
from '../components/AlertBadge';



export default function MasMenuScreen({
    navigation
}) {


    const [

        resumenAlertas,

        setResumenAlertas

    ] = useState({

        total:0

    });



    const cargarAlertas =
        async()=>{


            try{


                const resumen =

                    await obtenerResumenAlertas();



                setResumenAlertas(

                    resumen

                );


            }
            catch(error){


                console.error(

                    'Error cargando resumen alertas:',

                    error

                );


            }


        };



    useFocusEffect(

        useCallback(()=>{


            cargarAlertas();


        },[])

    );



    return (


        <ScrollView
            style={
                styles.container
            }
            contentContainerStyle={
                styles.content
            }
        >


            <Text style={styles.title}>
                Más
            </Text>


            <Text style={styles.subtitle}>
                Administración y análisis del criadero
            </Text>



            <MenuCard
                icon="⚙️"
                title="Configuración"
                description="Catálogos y parámetros del criadero"
                onPress={() =>
                    navigation.navigate(
                        'Configuracion'
                    )
                }
            />


            <MenuCard
                icon="🥚"
                title="Producción de huevos"
                description="Estadísticas de postura y producción"
                onPress={() =>
                    navigation.navigate(
                        'ProduccionHuevos'
                    )
                }
            />


            <MenuCard
                icon="👥"
                title="Clientes"
                description="Compradores e historial de ventas por celular"
                onPress={() =>
                    navigation.navigate(
                        'Clientes'
                    )
                }
            />


            <MenuCard
                icon="📊"
                title="Reportes"
                description="Indicadores y estadísticas del criadero"
                onPress={() =>
                    navigation.navigate(
                        'Reportes'
                    )
                }
            />


            <MenuCard
                icon="💾"
                title="Respaldo"
                description="Crear y compartir copia de seguridad"
                onPress={() =>
                    navigation.navigate(
                        'Backup'
                    )
                }
            />


            <TouchableOpacity

                style={styles.card}

                onPress={() =>

                    navigation.navigate(

                        'Alertas'

                    )

                }

            >


                <Text style={styles.icon}>
                    🔔
                </Text>


                <View style={styles.alertContent}>


                    <View style={styles.cardText}>


                        <Text style={styles.cardTitle}>
                            Alertas
                        </Text>


                        <Text style={styles.description}>
                            Estado y pendientes del criadero
                        </Text>


                    </View>


                    <AlertBadge

                        cantidad={

                            resumenAlertas.total

                        }

                    />


                </View>


            </TouchableOpacity>


            {
                /* Solo en modo API (excepcion aprobada a la regla de no tocar V1). */
                USAR_API &&
                <MenuCard
                    icon="🚪"
                    title="Cerrar sesión"
                    description="Salir de la cuenta en este teléfono"
                    onPress={
                        confirmarCerrarSesion
                    }
                />
            }

        </ScrollView>


    );

}



function confirmarCerrarSesion(){

    Alert.alert(
        'Cerrar sesión',
        '¿Quieres cerrar la sesión en este teléfono?',
        [
            {
                text:'Cancelar',
                style:'cancel'
            },
            {
                text:'Cerrar sesión',
                style:'destructive',
                onPress:()=>{

                    // require diferido: en modo SQLite el modulo de sesion no se carga.
                    require('../api/sesion')
                        .cerrarSesion();

                }
            }
        ]
    );

}


function MenuCard({
    icon,
    title,
    description,
    onPress
}) {

    return (

        <TouchableOpacity
            style={
                styles.card
            }
            onPress={
                onPress
            }
        >

            <Text
                style={
                    styles.icon
                }
            >
                {icon}
            </Text>


            <View
                style={
                    styles.cardText
                }
            >

                <Text
                    style={
                        styles.cardTitle
                    }
                >
                    {title}
                </Text>


                <Text
                    style={
                        styles.description
                    }
                >
                    {description}
                </Text>

            </View>

        </TouchableOpacity>

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

        padding:16,

        paddingBottom:40

    },


    title:{

        fontSize:28,

        fontWeight:'bold',

        color:
            COLORS.primary

    },


    subtitle:{

        marginTop:5,

        color:
            COLORS.textSecondary,

        marginBottom:25

    },


    card:{

        backgroundColor:
            COLORS.card,

        padding:18,

        borderRadius:16,

        flexDirection:'row',

        alignItems:'center',

        marginBottom:15

    },


    icon:{

        fontSize:35,

        marginRight:15

    },


    cardText:{

        flex:1

    },


    alertContent:{

        flex:1,

        flexDirection:'row',

        alignItems:'center',

        justifyContent:'space-between'

    },


    cardTitle:{

        fontSize:18,

        fontWeight:'bold',

        color:
            COLORS.text

    },


    description:{

        marginTop:5,

        color:
            COLORS.textSecondary

    }

});
