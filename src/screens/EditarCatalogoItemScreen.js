import React, {
    useRef,
    useState
} from 'react';


import {
    ScrollView,
    StyleSheet,
    Alert,
    KeyboardAvoidingView,
    Platform
} from 'react-native';


import {
    crearItemCatalogo,
    actualizarItemCatalogo
} from '../repositories/ConfiguracionRepository';


import FondoPantalla from '../components/FondoPantalla';
import Tarjeta from '../components/Tarjeta';
import TituloSeccion from '../components/TituloSeccion';
import CampoTexto from '../components/CampoTexto';
import Boton from '../components/Boton';
import BarraAccion from '../components/BarraAccion';
import Aviso from '../components/Aviso';
import useAvisoExito from '../components/useAvisoExito';
import useGuardaEnvio from '../components/useGuardaEnvio';
import useValidacion from '../components/useValidacion';


import {
    spacing
} from '../theme';



export default function EditarCatalogoItemScreen({
    route,
    navigation
}) {


    const {
        catalogoId,
        item
    } = route.params;



    const [
        nombre,
        setNombre
    ] = useState(
        item?.nombre || ''
    );



    const [
        descripcion,
        setDescripcion
    ] = useState(
        item?.descripcion || ''
    );



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




    const guardia = useGuardaEnvio();
    const scrollRef = useRef(null);
    const v = useValidacion(scrollRef);


    const guardar =
        async () => {


            if(
                !nombre.trim()
            ){

                v.fallar(
                    'nombre',
                    'Ingrese un nombre.'
                );

                Alert.alert(
                    'Nombre requerido',
                    'Ingrese un nombre.'
                );

                return;

            }



            try{


                setGuardando(
                    true
                );



                if(item){


                    await actualizarItemCatalogo({

                        id:
                            item.id,

                        nombre:
                            nombre.trim(),

                        descripcion:
                            descripcion.trim()

                    });


                }
                else{


                    await crearItemCatalogo({

                        catalogoId,

                        codigo:
                            nombre
                            .trim()
                            .toUpperCase()
                            .replace(
                                /\s+/g,
                                '_'
                            ),

                        nombre:
                            nombre.trim(),

                        descripcion:
                            descripcion.trim()

                    });


                }



                // Antes: Alert «Guardado» con «Aceptar» que hacía goBack. Ahora: aviso y vuelve solo.
                mostrarAviso(

                    'Guardado',

                    'El elemento fue guardado correctamente.',

                    () =>
                        navigation.goBack()

                );


            }
            catch(error){


                console.error(
                    'Error guardando catálogo:',
                    error
                );


                Alert.alert(
                    'Error',
                    'No fue posible guardar el elemento.'
                );


            }
            finally{

                setGuardando(
                    false
                );

            }


        };





    return (

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

            <FondoPantalla>

                <ScrollView
                    ref={scrollRef}
                    contentContainerStyle={
                        styles.content
                    }
                    keyboardShouldPersistTaps="handled"
                >

                    <Tarjeta>

                        <TituloSeccion
                            icono={
                                item
                                    ? 'create-outline'
                                    : 'add'
                            }
                        >
                            {
                                item
                                ?
                                'Editar elemento'
                                :
                                'Nuevo elemento'
                            }
                        </TituloSeccion>


                        <CampoTexto
                            etiqueta="Nombre"
                            accessibilityLabel="Nombre del elemento"
                            placeholder="Nombre"
                            value={
                                nombre
                            }
                            onChangeText={
                                setNombre
                            }
                            testID="catalogo-nombre"
                            {...v.props('nombre')}
                        />


                        <CampoTexto
                            etiqueta="Descripción"
                            accessibilityLabel="Descripción del elemento"
                            placeholder="Descripción"
                            value={
                                descripcion
                            }
                            onChangeText={
                                setDescripcion
                            }
                            multiline
                            testID="catalogo-descripcion"
                        />

                    </Tarjeta>

                </ScrollView>


                <BarraAccion>

                    <Boton
                        titulo="Guardar"
                        icono="guardar"
                        onPress={
                            guardia(guardar)
                        }
                        guardando={
                            guardando
                        }
                        atenuado={
                            saliendo
                        }
                        testID="guardar-catalogo-item"
                    />

                </BarraAccion>


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

        </KeyboardAvoidingView>

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

    }

});
