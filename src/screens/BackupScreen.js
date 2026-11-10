import React, {
    useState
} from 'react';

import {
    View,
    Text,
    ScrollView,
    StyleSheet,
    Alert,
    ActivityIndicator
} from 'react-native';

import FondoPantalla from '../components/FondoPantalla';
import Tarjeta from '../components/Tarjeta';
import Boton from '../components/Boton';

import {
    colors,
    spacing,
    typography
} from '../theme';

import {
    crearBackup,
    compartirBackup,
    seleccionarBackup,
    restaurarBackup
} from '../repositories/BackupRepository';



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


            if(
                mensaje ===
                'ARCHIVO_NO_ES_RESPALDO_VALIDO'
            ){

                return (
                    'El archivo seleccionado no corresponde a un respaldo válido de Criadero Kikirikis.'
                );

            }


            if(
                mensaje ===
                'MANIFEST_IMAGENES_INVALIDO'
            ){

                return (
                    'La información de imágenes del respaldo está dañada.'
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

                    'El respaldo fue guardado correctamente. Incluye los datos y las imágenes disponibles del criadero.'

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


            try{


                setProcesando(
                    true
                );


                /*
                    Si existe un respaldo creado durante
                    esta sesión, se comparte ese.

                    Si no existe, el repository crea
                    automáticamente uno temporal con el
                    estado actual de la aplicación.
                */

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


                const resultado =
                    await restaurarBackup(
                        archivo
                    );


                const imagenes =
                    resultado
                        ?.imagenes
                        ?.restauradas
                    ||
                    0;


                Alert.alert(

                    'Restauración completa',

                    imagenes > 0
                        ?
                        `La información fue restaurada correctamente junto con ${imagenes} imagen(es). Reinicie la aplicación para recargar todos los datos.`
                        :
                        'La información fue restaurada correctamente. Este respaldo no contenía imágenes o no había imágenes disponibles. Reinicie la aplicación para recargar todos los datos.'

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

                    'Los datos actuales serán reemplazados por el contenido del respaldo. Las imágenes incluidas también serán restauradas. ¿Desea continuar?',

                    [

                        {
                            text:
                                'Cancelar',

                            style:
                                'cancel'
                        },

                        {
                            text:
                                'Restaurar',

                            style:
                                'destructive',

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

        <FondoPantalla>

        <ScrollView
            contentContainerStyle={
                styles.container
            }
        >


            <Text
                style={
                    styles.subtitle
                }
            >
                Cree una copia de seguridad de los datos e imágenes del criadero.
            </Text>



            <Tarjeta
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
                        styles.cardDescription
                    }
                >
                    El respaldo incluye aves, jaulas, catálogos, finanzas, historial y fotografías disponibles.
                </Text>


                <Text
                    style={
                        styles.label
                    }
                >
                    Último respaldo creado en esta sesión:
                </Text>


                <Text
                    style={
                        styles.path
                    }
                >
                    {
                        rutaBackup
                        ||
                        'No creado. También puede compartir directamente un nuevo respaldo.'
                    }
                </Text>


            </Tarjeta>



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
                                colors.primary
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



            <Boton
                titulo="Crear y guardar respaldo"
                icono="guardar"
                onPress={generar}
                atenuado={procesando}
                style={styles.boton}
            />


            <Boton
                titulo="Compartir respaldo"
                variante="secundario"
                icono="exportar"
                onPress={compartir}
                atenuado={procesando}
                style={styles.boton}
            />


            <Boton
                titulo="Restaurar respaldo"
                variante="peligro"
                icono="refresh-outline"
                onPress={restaurar}
                atenuado={procesando}
                style={styles.boton}
            />


        </ScrollView>

        </FondoPantalla>

    );

}



const styles =
StyleSheet.create({

    container:{

        padding:spacing.pantalla,

        paddingBottom:spacing.xl

    },


    subtitle:{

        ...typography.cuerpo,

        color:
            colors.textSecondary

    },


    card:{

        marginTop:spacing.lg

    },


    cardTitle:{

        ...typography.tituloTarjeta,

        color:
            colors.text

    },


    cardDescription:{

        ...typography.cuerpo,

        marginTop:spacing.sm,

        color:
            colors.textSecondary

    },


    label:{

        ...typography.etiqueta,

        marginTop:spacing.md,

        color:
            colors.text

    },


    path:{

        ...typography.secundario,

        marginTop:spacing.xs,

        color:
            colors.textSecondary

    },


    processing:{

        flexDirection:'row',

        justifyContent:'center',

        alignItems:'center',

        marginBottom:spacing.sm

    },


    processingText:{

        ...typography.secundario,

        marginLeft:spacing.sm,

        color:
            colors.textSecondary

    },


    boton:{

        marginTop:spacing.md

    }

});