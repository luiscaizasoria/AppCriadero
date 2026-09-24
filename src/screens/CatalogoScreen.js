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
    Ionicons
} from '@expo/vector-icons';

import {
    obtenerCatalogoPorCodigo,
    obtenerItemsCatalogo,
    eliminarItemCatalogo
} from '../repositories/ConfiguracionRepository';

import {
    COLORS
} from '../config/constants';



export default function CatalogoScreen({
    route,
    navigation
}) {

    const {
        codigo,
        titulo
    } = route.params;



    const [
        items,
        setItems
    ] = useState([]);



    const [
        catalogo,
        setCatalogo
    ] = useState(null);



    const cargar =
        async () => {


            try {


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


                            }

                    }

                ]

            );


        };



    return (

        <ScrollView

            style={
                styles.container
            }

            contentContainerStyle={
                styles.content
            }

        >


            <Text
                style={
                    styles.title
                }
            >

                {titulo}

            </Text>



            {
                items.length === 0

                ?

                <View
                    style={
                        styles.empty
                    }
                >

                    <Text
                        style={
                            styles.emptyText
                        }
                    >
                        No existen registros.
                    </Text>

                </View>


                :

                items.map(
                    item => (

                        <View

                            key={
                                item.id
                            }

                            style={
                                styles.card
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


                                <TouchableOpacity

                                    style={[
                                        styles.actionButton,
                                        styles.edit
                                    ]}

                                    activeOpacity={
                                        0.8
                                    }

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


                                    <Ionicons

                                        name="create-outline"

                                        size={
                                            18
                                        }

                                        color="#FFFFFF"

                                    />


                                    <Text
                                        style={
                                            styles.actionText
                                        }
                                    >

                                        Editar

                                    </Text>


                                </TouchableOpacity>



                                <TouchableOpacity

                                    style={[
                                        styles.actionButton,
                                        styles.delete
                                    ]}

                                    activeOpacity={
                                        0.8
                                    }

                                    onPress={() =>
                                        eliminar(
                                            item
                                        )
                                    }

                                >


                                    <Ionicons

                                        name="trash-outline"

                                        size={
                                            18
                                        }

                                        color="#FFFFFF"

                                    />


                                    <Text
                                        style={
                                            styles.actionText
                                        }
                                    >

                                        Eliminar

                                    </Text>


                                </TouchableOpacity>


                            </View>


                        </View>

                    )
                )

            }



            <TouchableOpacity

                style={[
                    styles.button,

                    !catalogo
                    &&
                    styles.buttonDisabled
                ]}

                disabled={
                    !catalogo
                }

                activeOpacity={
                    0.8
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

            >


                <Ionicons

                    name="add"

                    size={
                        20
                    }

                    color="#FFFFFF"

                />


                <Text
                    style={
                        styles.buttonText
                    }
                >

                    Nuevo elemento

                </Text>


            </TouchableOpacity>


        </ScrollView>

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

        fontSize:26,

        fontWeight:'bold',

        color:
            COLORS.primary,

        marginBottom:20

    },


    card:{

        backgroundColor:
            COLORS.card,

        padding:16,

        borderRadius:14,

        marginBottom:12

    },


    name:{

        fontSize:17,

        fontWeight:'bold',

        color:
            COLORS.text

    },


    description:{

        marginTop:5,

        color:
            COLORS.textSecondary

    },


    actions:{

        flexDirection:'row',

        marginTop:15

    },


    actionButton:{

        flexDirection:'row',

        alignItems:'center',

        justifyContent:'center',

        paddingHorizontal:14,

        paddingVertical:10,

        borderRadius:10

    },


    edit:{

        backgroundColor:
            '#4ea8de',

        marginRight:10

    },


    delete:{

        backgroundColor:
            '#d9534f'

    },


    actionText:{

        color:'#FFFFFF',

        fontWeight:'bold',

        marginLeft:6

    },


    empty:{

        padding:30,

        alignItems:'center',

        backgroundColor:
            COLORS.card,

        borderRadius:14,

        marginBottom:15

    },


    emptyText:{

        color:
            COLORS.textSecondary

    },


    button:{

        flexDirection:'row',

        justifyContent:'center',

        alignItems:'center',

        backgroundColor:
            COLORS.primary,

        padding:16,

        borderRadius:14

    },


    buttonDisabled:{

        opacity:0.5

    },


    buttonText:{

        color:'#FFFFFF',

        fontWeight:'bold',

        marginLeft:6

    }

});