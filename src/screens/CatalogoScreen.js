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



                if(catalogoData){


                    const itemsData =
                        await obtenerItemsCatalogo(
                            catalogoData.id
                        );


                    setItems(
                        itemsData
                    );

                }


            }
            catch(error){

                console.error(
                    'Error cargando catálogo:',
                    error
                );

            }

        };




    useFocusEffect(

        useCallback(
            () => {

                cargar();

            },
            []
        )

    );





    const eliminar =
        async(item)=>{


            Alert.alert(

                'Eliminar elemento',

                `¿Desea eliminar ${item.nombre}?`,

                [

                    {
                        text:'Cancelar'
                    },


                    {
                        text:'Eliminar',

                        onPress:
                            async()=>{

                                await eliminarItemCatalogo(
                                    item.id
                                );


                                cargar();

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

                    <Text>
                        No existen registros.
                    </Text>

                </View>


                :

                items.map(
                    item=>(

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

                                    style={
                                        styles.edit
                                    }

                                    onPress={()=>

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

                                    <Text
                                        style={
                                            styles.actionText
                                        }
                                    >
                                        ✏️ Editar
                                    </Text>


                                </TouchableOpacity>





                                <TouchableOpacity

                                    style={
                                        styles.delete
                                    }

                                    onPress={()=>
                                        eliminar(item)
                                    }

                                >

                                    <Text
                                        style={
                                            styles.actionText
                                        }
                                    >
                                        🗑️ Eliminar
                                    </Text>


                                </TouchableOpacity>


                            </View>


                        </View>

                    )
                )

            }





            <TouchableOpacity

                style={
                    styles.button
                }

                onPress={()=>


                    navigation.navigate(

                        'EditarCatalogoItem',

                        {

                            catalogoId:
                                catalogo?.id,

                            item:null

                        }

                    )

                }

            >

                <Text
                    style={
                        styles.buttonText
                    }
                >
                    ＋ Nuevo elemento
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
        padding:16
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
        fontWeight:'bold'
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


    edit:{
        backgroundColor:'#4ea8de',
        padding:10,
        borderRadius:10,
        marginRight:10
    },


    delete:{
        backgroundColor:'#d9534f',
        padding:10,
        borderRadius:10
    },


    actionText:{
        color:'#fff',
        fontWeight:'bold'
    },


    empty:{
        padding:30,
        alignItems:'center'
    },


    button:{
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