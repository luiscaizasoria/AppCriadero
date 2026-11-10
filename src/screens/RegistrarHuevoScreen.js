import React, {
    useEffect,
    useState
} from 'react';


import {
    View,
    Text,
    ScrollView,
    StyleSheet,
    Alert,
    KeyboardAvoidingView,
    Platform
} from 'react-native';



import {
    obtenerAvePorId
} from '../repositories/AveRepository';



import {
    registrarHuevo
} from '../repositories/HuevoRepository';



import FondoPantalla
    from '../components/FondoPantalla';

import Tarjeta
    from '../components/Tarjeta';

import IconoCirculo
    from '../components/IconoCirculo';

import CampoTexto
    from '../components/CampoTexto';

import Boton
    from '../components/Boton';

import BarraAccion
    from '../components/BarraAccion';

import Aviso
    from '../components/Aviso';

import useAvisoExito
    from '../components/useAvisoExito';

import EstadoError
    from '../components/EstadoError';

import {
    colors,
    spacing,
    typography
} from '../theme';




export default function RegistrarHuevoScreen({
    route,
    navigation
}) {


    const {
        aveId
    } = route.params;



    const [
        ave,
        setAve
    ] = useState(null);



    const [
        errorCarga,
        setErrorCarga
    ] = useState(false);



    const [
        observacion,
        setObservacion
    ] = useState('');



    const [
        guardando,
        setGuardando
    ] = useState(false);



    const {
        aviso,
        mostrar: mostrarAviso,
        cerrar: cerrarAviso,
        saliendo
    } = useAvisoExito();




    useEffect(

        () => {

            cargarAve();

        },

        []

    );




    // Mismo repositorio y misma lectura; solo se añade un estado de error con «Reintentar»
    // (antes un fallo de red era una promesa sin capturar).
    const cargarAve =
        async () => {

            try {

                setErrorCarga(
                    false
                );


                const data =
                    await obtenerAvePorId(
                        aveId
                    );


                setAve(
                    data
                );

            }
            catch(error){

                console.error(
                    error
                );

                setErrorCarga(
                    true
                );

            }

        };





    const guardar =
        async () => {


            try {


                setGuardando(
                    true
                );



                const codigo =
                    await registrarHuevo({

                        aveId,

                        jaulaId:
                            ave?.jaula_actual_id,

                        fecha:
                            new Date()
                            .toISOString(),

                        observacion:
                            observacion.trim()

                    });



                // Antes: Alert con «Aceptar» que hacía goBack. Ahora: aviso y vuelve solo.
                mostrarAviso(

                    'Huevo registrado',

                    `Se generó el código ${codigo}`,

                    () =>
                        navigation.goBack()

                );


            }
            catch(error){


                console.error(
                    'Error registrando huevo:',
                    error
                );


                Alert.alert(
                    'Error',
                    'No fue posible registrar el huevo.'
                );


            }
            finally{

                setGuardando(
                    false
                );

            }


        };





    return (

        <FondoPantalla>

            <KeyboardAvoidingView
                style={
                    styles.container
                }
                behavior={
                    Platform.OS === 'ios'
                        ? 'padding'
                        : undefined
                }
            >

                <ScrollView
                    contentContainerStyle={
                        styles.content
                    }
                    keyboardShouldPersistTaps="handled"
                >


                    {
                        errorCarga
                        &&
                        (

                            <Tarjeta>

                                <EstadoError
                                    titulo="No fue posible cargar el ave."
                                    onReintentar={
                                        cargarAve
                                    }
                                />

                            </Tarjeta>

                        )
                    }


                    {
                        ave
                        &&
                        (

                            <Tarjeta
                                testID="huevo-ave"
                            >

                                <View
                                    style={
                                        styles.fila
                                    }
                                >

                                    <IconoCirculo
                                        icono="huevo"
                                        indice={1}
                                        tamano={52}
                                    />

                                    <View
                                        style={
                                            styles.textos
                                        }
                                    >

                                        <Text
                                            style={
                                                styles.dato
                                            }
                                        >
                                            Ave:
                                            {' '}
                                            {ave.codigo}
                                        </Text>


                                        <Text
                                            style={
                                                styles.datoSecundario
                                            }
                                        >
                                            Jaula:
                                            {' '}
                                            {
                                                ave.jaula_codigo
                                                ||
                                                'Sin jaula'
                                            }
                                        </Text>

                                    </View>

                                </View>

                            </Tarjeta>

                        )

                    }



                    <Tarjeta>

                        <CampoTexto
                            etiqueta="Observación"
                            multiline
                            value={
                                observacion
                            }
                            onChangeText={
                                setObservacion
                            }
                            placeholder="Ej. Huevo normal, tamaño grande..."
                            testID="observacion-huevo"
                            style={
                                styles.campo
                            }
                        />

                    </Tarjeta>


                </ScrollView>



                <BarraAccion>

                    <Boton
                        testID="guardar-huevo"
                        titulo={
                            guardando
                            ?
                            'Guardando...'
                            :
                            'Registrar huevo'
                        }
                        icono={
                            guardando
                                ? undefined
                                : 'huevo'
                        }
                        onPress={
                            guardar
                        }
                        atenuado={
                            guardando
                            ||
                            saliendo
                        }
                    />

                </BarraAccion>

            </KeyboardAvoidingView>


            {aviso ? (
                <Aviso
                    flotante
                    tono="exito"
                    duracion={0}
                    titulo={aviso.titulo}
                    mensaje={aviso.mensaje}
                    onCerrar={cerrarAviso}
                />
            ) : null}

        </FondoPantalla>

    );

}




const styles =
StyleSheet.create({

    container:{
        flex:1
    },


    content:{
        padding:spacing.pantalla,
        paddingBottom:spacing.xl
    },


    fila:{
        flexDirection:'row',
        alignItems:'center'
    },


    textos:{
        flex:1,
        marginLeft:spacing.md
    },


    dato:{
        ...typography.subtitulo,
        color:
            colors.text
    },


    datoSecundario:{
        ...typography.cuerpo,
        color:
            colors.textSecondary
    },


    campo:{
        marginBottom:0
    }

});
