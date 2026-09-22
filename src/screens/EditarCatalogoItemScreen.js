import React, {
    useState
} from 'react';


import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    StyleSheet,
    Alert
} from 'react-native';


import {
    crearItemCatalogo,
    actualizarItemCatalogo
} from '../repositories/ConfiguracionRepository';


import {
    COLORS
} from '../config/constants';



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




    const guardar =
        async () => {


            if(
                !nombre.trim()
            ){

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



                Alert.alert(

                    'Guardado',

                    'El elemento fue guardado correctamente.',

                    [
                        {
                            text:'Aceptar',

                            onPress:
                                () =>
                                navigation.goBack()
                        }
                    ]

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
                {
                    item
                    ?
                    'Editar elemento'
                    :
                    'Nuevo elemento'
                }
            </Text>




            <Text
                style={
                    styles.label
                }
            >
                Nombre
            </Text>


            <TextInput

                style={
                    styles.input
                }

                value={
                    nombre
                }

                onChangeText={
                    setNombre
                }

                placeholder="Nombre"

            />




            <Text
                style={
                    styles.label
                }
            >
                Descripción
            </Text>



            <TextInput

                style={[
                    styles.input,
                    styles.area
                ]}

                value={
                    descripcion
                }

                onChangeText={
                    setDescripcion
                }

                multiline

                placeholder="Descripción"

            />





            <TouchableOpacity

                style={
                    styles.button
                }

                onPress={
                    guardar
                }

                disabled={
                    guardando
                }

            >

                <Text
                    style={
                        styles.buttonText
                    }
                >

                    {
                        guardando
                        ?
                        'Guardando...'
                        :
                        '💾 Guardar'
                    }

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

        fontSize:26,

        fontWeight:'bold',

        color:
            COLORS.primary

    },


    label:{

        marginTop:20,

        marginBottom:8,

        fontWeight:'600'

    },


    input:{

        backgroundColor:
            COLORS.card,

        borderRadius:12,

        padding:14,

        borderWidth:1,

        borderColor:
            COLORS.border

    },


    area:{

        minHeight:100,

        textAlignVertical:
            'top'

    },


    button:{

        marginTop:30,

        backgroundColor:
            COLORS.primary,

        padding:16,

        borderRadius:14,

        alignItems:'center'

    },


    buttonText:{

        color:'#fff',

        fontWeight:'bold'

    }

});