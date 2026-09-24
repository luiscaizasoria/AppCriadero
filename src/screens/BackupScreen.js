import React, {
    useState
} from 'react';


import {
    View,
    Text,
    TouchableOpacity,
    StyleSheet,
    Alert,
    ActivityIndicator
} from 'react-native';


import {
    crearBackup,
    compartirBackup,
    seleccionarBackup,
    restaurarBackup
} from '../repositories/BackupRepository';


import {
    COLORS
} from '../config/constants';



export default function BackupScreen(){


    const [
        rutaBackup,
        setRutaBackup
    ] = useState(null);


    const [
        procesando,
        setProcesando
    ] = useState(false);



    const obtenerMensajeError =
        (
            error
        ) => {


            const mensaje =
                error?.message
                ||
                'ERROR_DESCONOCIDO';


            if(
                mensaje ===
                'OPERACION_CANCELADA'
            ){

                return (
                    'La operación fue cancelada.'
                );

            }


            if(
                mensaje ===
                'NO_SE_RECIBIO_URI_DESTINO'
            ){

                return (
                    'Android no devolvió la ubicación del archivo.'
                );

            }


            if(
                mensaje.startsWith(
                    'FUNCION_NO_DISPONIBLE:'
                )
            ){

                return (
                    `Función no disponible: ${mensaje}`
                );

            }


            if(
                mensaje ===
                'COMPARTIR_NO_DISPONIBLE'
            ){

                return (
                    'La función de compartir no está disponible.'
                );

            }


            if(
                mensaje ===
                'RESPALDO_VACIO'
            ){

                return (
                    'El archivo seleccionado está vacío.'
                );

            }


            return mensaje;

        };



    const generar =
        async()=>{


            console.log(
                '[BACKUP_SCREEN] Iniciando creación de respaldo'
            );


            try{


                setProcesando(
                    true
                );


                const ruta =
                    await crearBackup();


                setRutaBackup(
                    ruta
                );


                Alert.alert(

                    'Respaldo creado',

                    'El respaldo fue guardado correctamente en la ubicación seleccionada.'

                );


            }
            catch(error){


                console.error(
                    '[BACKUP_SCREEN][ERROR] generar',
                    error
                );


                if(
                    error?.message ===
                    'OPERACION_CANCELADA'
                ){

                    return;

                }


                Alert.alert(

                    'Error creando respaldo',

                    obtenerMensajeError(
                        error
                    )

                );


            }
            finally{


                setProcesando(
                    false
                );


            }

        };



    const compartir =
        async()=>{


            if(
                !rutaBackup
            ){

                Alert.alert(
                    'Sin respaldo',
                    'Primero cree un respaldo.'
                );

                return;

            }


            try{


                setProcesando(
                    true
                );


                await compartirBackup(
                    rutaBackup
                );


            }
            catch(error){


                console.error(
                    '[BACKUP_SCREEN][ERROR] compartir',
                    error
                );


                Alert.alert(

                    'Error compartiendo respaldo',

                    obtenerMensajeError(
                        error
                    )

                );


            }
            finally{


                setProcesando(
                    false
                );


            }

        };



    const ejecutarRestauracion =
        async(
            archivo
        )=>{


            try{


                setProcesando(
                    true
                );


                await restaurarBackup(
                    archivo
                );


                Alert.alert(

                    'Restauración completa',

                    'La información fue restaurada correctamente. Reinicie la aplicación.'

                );


            }
            catch(error){


                console.error(
                    '[BACKUP_SCREEN][ERROR] restaurar',
                    error
                );


                Alert.alert(

                    'Error restaurando respaldo',

                    obtenerMensajeError(
                        error
                    )

                );


            }
            finally{


                setProcesando(
                    false
                );


            }

        };



    const restaurar =
        async()=>{


            try{


                const archivo =
                    await seleccionarBackup();


                if(
                    !archivo
                ){

                    return;

                }


                Alert.alert(

                    'Restaurar respaldo',

                    'Los datos actuales serán reemplazados. ¿Desea continuar?',

                    [

                        {
                            text:'Cancelar',
                            style:'cancel'
                        },

                        {
                            text:'Restaurar',
                            style:'destructive',

                            onPress:
                                () =>
                                    ejecutarRestauracion(
                                        archivo
                                    )
                        }

                    ]

                );


            }
            catch(error){


                console.error(
                    '[BACKUP_SCREEN][ERROR] seleccionar',
                    error
                );


                Alert.alert(

                    'Error seleccionando respaldo',

                    obtenerMensajeError(
                        error
                    )

                );


            }

        };



    return(

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
                💾 Respaldo
            </Text>


            <Text
                style={
                    styles.subtitle
                }
            >
                Cree una copia de seguridad y seleccione dónde guardarla en su teléfono.
            </Text>



            <View
                style={
                    styles.card
                }
            >


                <Text
                    style={
                        styles.cardTitle
                    }
                >
                    Copia de seguridad
                </Text>


                <Text
                    style={
                        styles.label
                    }
                >
                    Último respaldo:
                </Text>


                <Text
                    style={
                        styles.path
                    }
                >
                    {
                        rutaBackup
                        ||
                        'No creado'
                    }
                </Text>


            </View>



            {
                procesando
                ?
                (

                    <View
                        style={
                            styles.processing
                        }
                    >

                        <ActivityIndicator
                            size="small"
                            color={
                                COLORS.primary
                            }
                        />

                        <Text
                            style={
                                styles.processingText
                            }
                        >
                            Procesando...
                        </Text>

                    </View>

                )
                :
                null
            }



            <TouchableOpacity

                style={[
                    styles.button,

                    procesando &&
                    styles.disabled
                ]}

                onPress={
                    generar
                }

                disabled={
                    procesando
                }

            >

                <Text
                    style={
                        styles.buttonText
                    }
                >
                    💾 Crear y guardar respaldo
                </Text>

            </TouchableOpacity>



            <TouchableOpacity

                style={[
                    styles.shareButton,

                    (
                        procesando ||
                        !rutaBackup
                    )
                    &&
                    styles.disabled
                ]}

                onPress={
                    compartir
                }

                disabled={
                    procesando ||
                    !rutaBackup
                }

            >

                <Text
                    style={
                        styles.buttonText
                    }
                >
                    📤 Compartir último respaldo
                </Text>

            </TouchableOpacity>



            <TouchableOpacity

                style={[
                    styles.restore,

                    procesando &&
                    styles.disabled
                ]}

                onPress={
                    restaurar
                }

                disabled={
                    procesando
                }

            >

                <Text
                    style={
                        styles.buttonText
                    }
                >
                    ♻️ Restaurar respaldo
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
        fontSize:28,
        fontWeight:'bold',
        color:
            COLORS.primary
    },


    subtitle:{
        marginTop:8,
        color:
            COLORS.textSecondary,
        lineHeight:20
    },


    card:{
        backgroundColor:
            COLORS.card,
        padding:18,
        borderRadius:16,
        marginTop:20
    },


    cardTitle:{
        fontSize:17,
        fontWeight:'bold',
        color:
            COLORS.text
    },


    label:{
        marginTop:15,
        fontWeight:'bold'
    },


    path:{
        marginTop:5,
        color:
            COLORS.textSecondary,
        fontSize:12
    },


    processing:{
        flexDirection:'row',
        justifyContent:'center',
        alignItems:'center',
        marginTop:20
    },


    processingText:{
        marginLeft:10,
        color:
            COLORS.textSecondary
    },


    button:{
        backgroundColor:
            COLORS.primary,
        padding:16,
        borderRadius:14,
        marginTop:20,
        alignItems:'center'
    },


    shareButton:{
        backgroundColor:'#4ea8de',
        padding:16,
        borderRadius:14,
        marginTop:12,
        alignItems:'center'
    },


    restore:{
        backgroundColor:'#d9534f',
        padding:16,
        borderRadius:14,
        marginTop:12,
        alignItems:'center'
    },


    disabled:{
        opacity:0.45
    },


    buttonText:{
        color:'#fff',
        fontWeight:'bold'
    }

});