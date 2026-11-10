import React, {
    useCallback,
    useRef,
    useState
} from 'react';

import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    Alert,
    KeyboardAvoidingView,
    Platform
} from 'react-native';

import {
    useFocusEffect
} from '@react-navigation/native';

import {
    obtenerCatalogoPorCodigo,
    obtenerItemsCatalogo,
    eliminarItemCatalogo,
    crearItemCatalogo
} from '../repositories/ConfiguracionRepository';

import FondoPantalla from '../components/FondoPantalla';
import Tarjeta from '../components/Tarjeta';
import TituloSeccion from '../components/TituloSeccion';
import CampoTexto from '../components/CampoTexto';
import Boton from '../components/Boton';
import Pulsable from '../components/Pulsable';
import Icono from '../components/Icono';
import Aviso from '../components/Aviso';
import useAvisoExito from '../components/useAvisoExito';
import useValidacion from '../components/useValidacion';
import EstadoCarga from '../components/EstadoCarga';
import EstadoError from '../components/EstadoError';
import EstadoVacio from '../components/EstadoVacio';

import {
    colors,
    radii,
    spacing,
    typography
} from '../theme';



export default function CatalogoScreen({
    route,
    navigation
}) {

    const {
        codigo
    } = route.params;



    const [
        items,
        setItems
    ] = useState([]);



    const [
        catalogo,
        setCatalogo
    ] = useState(null);


    const [
        cargando,
        setCargando
    ] = useState(true);


    const [
        errorCarga,
        setErrorCarga
    ] = useState(false);


    const [
        nombreNuevo,
        setNombreNuevo
    ] = useState('');


    const [
        anadiendo,
        setAnadiendo
    ] = useState(false);

    const anadiendoRef = useRef(false);

    // Elemento que se está eliminando (retroalimentación visual en su botón)
    const [
        eliminandoId,
        setEliminandoId
    ] = useState(null);

    const scrollRef = useRef(null);
    const v = useValidacion(scrollRef);


    const {
        aviso,
        mostrar: mostrarAviso,
        cerrar: cerrarAviso
    } = useAvisoExito();



    const cargar =
        async () => {


            try {

                setErrorCarga(
                    false
                );


                const catalogoData =
                    await obtenerCatalogoPorCodigo(
                        codigo
                    );


                setCatalogo(
                    catalogoData
                );



                if(
                    catalogoData
                ){


                    const itemsData =
                        await obtenerItemsCatalogo(
                            catalogoData.id
                        );


                    setItems(
                        itemsData
                    );


                }
                else{


                    setItems(
                        []
                    );


                }


            }
            catch(error){


                console.error(
                    'Error cargando catálogo:',
                    error
                );


                setItems(
                    []
                );


                setErrorCarga(
                    true
                );


            }
            finally{

                setCargando(
                    false
                );

            }

        };



    useFocusEffect(

        useCallback(
            () => {

                cargar();

            },
            [
                codigo
            ]
        )

    );



    const eliminar =
        async(
            item
        ) => {


            Alert.alert(

                'Eliminar elemento',

                `¿Desea eliminar ${item.nombre}?`,

                [

                    {
                        text:
                            'Cancelar',

                        style:
                            'cancel'
                    },


                    {
                        text:
                            'Eliminar',

                        style:
                            'destructive',

                        onPress:
                            async() => {


                                try{


                                    setEliminandoId(
                                        item.id
                                    );


                                    await eliminarItemCatalogo(
                                        item.id
                                    );


                                    await cargar();


                                }
                                catch(error){


                                    console.error(
                                        'Error eliminando elemento:',
                                        error
                                    );


                                    Alert.alert(
                                        'Error',
                                        'No fue posible eliminar el elemento.'
                                    );


                                }
                                finally{

                                    setEliminandoId(
                                        null
                                    );

                                }


                            }

                    }

                ]

            );


        };



    // Alta rápida: mismas validaciones, mismo código derivado y mismo repositorio que
    // EditarCatalogoItemScreen (descripción vacía).
    const altaRapida =
        async () => {


            // Evita doble envío (doble Enter) mientras se guarda.
            if(
                anadiendoRef.current
            ){
                return;
            }

            if(
                !nombreNuevo.trim()
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


                anadiendoRef.current = true;

                setAnadiendo(
                    true
                );


                await crearItemCatalogo({

                    catalogoId:
                        catalogo?.id,

                    codigo:
                        nombreNuevo
                        .trim()
                        .toUpperCase()
                        .replace(
                            /\s+/g,
                            '_'
                        ),

                    nombre:
                        nombreNuevo.trim(),

                    descripcion:
                        ''

                });


                setNombreNuevo(
                    ''
                );


                mostrarAviso(
                    'Guardado',
                    'El elemento fue guardado correctamente.'
                );


                await cargar();


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

                anadiendoRef.current = false;

                setAnadiendo(
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

                    {
                        cargando
                            ? (
                                <EstadoCarga
                                    mensaje="Cargando elementos..."
                                />
                            )
                            : null
                    }


                    {
                        !cargando && errorCarga
                            ? (
                                <EstadoError
                                    titulo="No fue posible cargar el catálogo."
                                    mensaje="Revisa tu conexión e inténtalo de nuevo."
                                    onReintentar={
                                        () => {
                                            setCargando(
                                                true
                                            );
                                            cargar();
                                        }
                                    }
                                />
                            )
                            : null
                    }


                    {
                        !cargando && !errorCarga
                            ? (
                                <>

                                    <Tarjeta>

                                        <TituloSeccion
                                            icono="add"
                                        >
                                            Alta rápida
                                        </TituloSeccion>

                                        <View
                                            style={
                                                styles.altaFila
                                            }
                                        >

                                            <CampoTexto
                                                accessibilityLabel="Nombre del nuevo elemento"
                                                placeholder="Escribe un nombre"
                                                value={
                                                    nombreNuevo
                                                }
                                                onChangeText={
                                                    setNombreNuevo
                                                }
                                                editable={
                                                    !!catalogo
                                                }
                                                returnKeyType="done"
                                                onSubmitEditing={
                                                    altaRapida
                                                }
                                                style={
                                                    styles.altaCampo
                                                }
                                                testID="catalogo-alta-rapida"
                                                {...v.props('nombre')}
                                            />

                                            <Boton
                                                titulo="Añadir"
                                                icono="add"
                                                onPress={
                                                    altaRapida
                                                }
                                                disabled={
                                                    !catalogo
                                                }
                                                guardando={
                                                    anadiendo
                                                }
                                                style={
                                                    styles.altaBoton
                                                }
                                                testID="catalogo-alta-rapida-anadir"
                                            />

                                        </View>

                                    </Tarjeta>


                                    {
                                        items.length === 0
                                        ?
                                        <EstadoVacio
                                            icono="list-outline"
                                            titulo="No existen registros."
                                            mensaje="Añade el primer elemento con el campo de arriba."
                                            testID="catalogo-vacio"
                                        />
                                        :
                                        items.map(
                                            item => (

                                                <Tarjeta

                                                    key={
                                                        item.id
                                                    }

                                                >

                                                    <Text
                                                        style={
                                                            styles.name
                                                        }
                                                    >

                                                        {item.nombre}

                                                    </Text>


                                                    {
                                                        item.descripcion
                                                        &&
                                                        <Text
                                                            style={
                                                                styles.description
                                                            }
                                                        >

                                                            {item.descripcion}

                                                        </Text>
                                                    }


                                                    <View
                                                        style={
                                                            styles.actions
                                                        }
                                                    >

                                                        <Pulsable

                                                            testID={
                                                                `catalogo-editar-${item.id}`
                                                            }

                                                            accessibilityRole="button"

                                                            sinMinimo

                                                            style={[
                                                                styles.actionButton,
                                                                styles.edit
                                                            ]}

                                                            onPress={() =>

                                                                navigation.navigate(

                                                                    'EditarCatalogoItem',

                                                                    {

                                                                        catalogoId:
                                                                            catalogo.id,

                                                                        item

                                                                    }

                                                                )

                                                            }

                                                        >

                                                            <Icono
                                                                nombre="create-outline"
                                                                tamano={18}
                                                                color={colors.primaryDark}
                                                            />

                                                            <Text
                                                                style={[
                                                                    styles.actionText,
                                                                    styles.editText
                                                                ]}
                                                            >
                                                                Editar
                                                            </Text>

                                                        </Pulsable>


                                                        <Pulsable

                                                            testID={
                                                                `catalogo-eliminar-${item.id}`
                                                            }

                                                            accessibilityRole="button"

                                                            sinMinimo

                                                            style={[
                                                                styles.actionButton,
                                                                styles.delete
                                                            ]}

                                                            disabled={
                                                                eliminandoId !== null
                                                            }

                                                            onPress={() =>
                                                                eliminar(
                                                                    item
                                                                )
                                                            }

                                                        >

                                                            <Icono
                                                                nombre="trash-outline"
                                                                tamano={18}
                                                                color={colors.white}
                                                            />

                                                            <Text
                                                                style={[
                                                                    styles.actionText,
                                                                    styles.deleteText
                                                                ]}
                                                            >
                                                                {
                                                                    eliminandoId === item.id
                                                                        ? 'Eliminando...'
                                                                        : 'Eliminar'
                                                                }
                                                            </Text>

                                                        </Pulsable>

                                                    </View>

                                                </Tarjeta>

                                            )
                                        )

                                    }


                                    <Boton
                                        titulo="Nuevo elemento"
                                        icono="add"
                                        variante="secundario"
                                        disabled={
                                            !catalogo
                                        }
                                        onPress={() =>

                                            navigation.navigate(

                                                'EditarCatalogoItem',

                                                {

                                                    catalogoId:
                                                        catalogo?.id,

                                                    item:
                                                        null

                                                }

                                            )

                                        }
                                        testID="catalogo-nuevo-elemento"
                                    />

                                </>
                            )
                            : null
                    }

                </ScrollView>


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

    },


    altaFila:{

        flexDirection:'row',

        alignItems:'flex-start'

    },


    altaCampo:{

        flex:1,

        marginBottom:0,

        marginRight:spacing.sm

    },


    altaBoton:{

        minHeight:54,

        paddingHorizontal:spacing.md

    },


    name:{

        ...typography.subtitulo,

        color:
            colors.text

    },


    description:{

        ...typography.cuerpo,

        marginTop:spacing.xs,

        color:
            colors.textSecondary

    },


    actions:{

        flexDirection:'row',

        marginTop:spacing.md

    },


    actionButton:{

        minHeight:spacing.touchMin,

        flexDirection:'row',

        alignItems:'center',

        justifyContent:'center',

        paddingHorizontal:spacing.lg,

        borderRadius:radii.pill,

        borderWidth:2

    },


    edit:{

        backgroundColor:
            colors.surface,

        borderColor:
            colors.primary,

        marginRight:spacing.sm

    },


    delete:{

        backgroundColor:
            colors.danger,

        borderColor:
            colors.danger

    },


    actionText:{

        ...typography.etiqueta,

        marginLeft:spacing.xs

    },


    editText:{

        color:
            colors.primaryDark

    },


    deleteText:{

        color:
            colors.white

    }

});
