import React, {
    useCallback,
    useMemo,
    useState
} from 'react';

import {
    View,
    Text,
    TextInput,
    ScrollView,
    TouchableOpacity,
    ActivityIndicator,
    StyleSheet
} from 'react-native';

import {
    useFocusEffect
} from '@react-navigation/native';

import {
    obtenerClientes
} from '../repositories/ClientesRepository';

import {
    COLORS
} from '../config/constants';



export default function ClientesScreen({
    navigation
}) {

    const [
        clientes,
        setClientes
    ] = useState([]);


    const [
        busqueda,
        setBusqueda
    ] = useState('');


    const [
        loading,
        setLoading
    ] = useState(true);


    const [
        error,
        setError
    ] = useState(null);


    const cargar =
        async () => {

            try {

                setLoading(
                    true
                );

                setError(
                    null
                );


                const data =
                    await obtenerClientes();


                setClientes(
                    data
                );

            }
            catch(errorCarga){

                console.error(
                    'Error cargando clientes:',
                    errorCarga
                );


                setError(
                    'No fue posible cargar los clientes.'
                );

            }
            finally{

                setLoading(
                    false
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


    const filtrados =
        useMemo(
            () => {

                const texto =
                    busqueda
                        .trim()
                        .toLowerCase();


                if(
                    !texto
                ){

                    return clientes;

                }


                return clientes.filter(
                    item => {

                        const nombre =
                            String(
                                item.nombre || ''
                            )
                                .toLowerCase();


                        const celular =
                            String(
                                item.celular || ''
                            )
                                .toLowerCase();


                        const ciudad =
                            String(
                                item.ciudad || ''
                            )
                                .toLowerCase();


                        return (
                            nombre.includes(
                                texto
                            )
                            ||
                            celular.includes(
                                texto
                            )
                            ||
                            ciudad.includes(
                                texto
                            )
                        );

                    }
                );

            },
            [
                clientes,
                busqueda
            ]
        );


    return (

        <ScrollView
            style={
                styles.container
            }
            contentContainerStyle={
                styles.content
            }
            keyboardShouldPersistTaps="handled"
        >

            <Text
                style={
                    styles.title
                }
            >
                👥 Clientes
            </Text>


            <Text
                style={
                    styles.subtitle
                }
            >
                Compradores agrupados por número celular
            </Text>


            <TextInput
                style={
                    styles.search
                }
                value={
                    busqueda
                }
                onChangeText={
                    setBusqueda
                }
                placeholder="Buscar por nombre, celular o ciudad..."
            />


            {
                loading
                &&
                (
                    <View
                        style={
                            styles.center
                        }
                    >

                        <ActivityIndicator
                            size="large"
                            color={
                                COLORS.primary
                            }
                        />

                        <Text
                            style={
                                styles.loadingText
                            }
                        >
                            Cargando clientes...
                        </Text>

                    </View>
                )
            }


            {
                !loading
                &&
                error
                &&
                (
                    <View
                        style={
                            styles.messageCard
                        }
                    >

                        <Text
                            style={
                                styles.errorText
                            }
                        >
                            {error}
                        </Text>

                        <TouchableOpacity
                            style={
                                styles.retryButton
                            }
                            onPress={
                                cargar
                            }
                        >

                            <Text
                                style={
                                    styles.retryText
                                }
                            >
                                Reintentar
                            </Text>

                        </TouchableOpacity>

                    </View>
                )
            }


            {
                !loading
                &&
                !error
                &&
                filtrados.length === 0
                &&
                (
                    <View
                        style={
                            styles.emptyCard
                        }
                    >

                        <Text
                            style={
                                styles.emptyIcon
                            }
                        >
                            👤
                        </Text>

                        <Text
                            style={
                                styles.emptyTitle
                            }
                        >
                            No hay clientes para mostrar
                        </Text>

                        <Text
                            style={
                                styles.emptyText
                            }
                        >
                            Los clientes aparecerán aquí cuando registres ventas con número celular.
                        </Text>

                    </View>
                )
            }


            {
                !loading
                &&
                !error
                &&
                filtrados.map(
                    item => (

                        <TouchableOpacity
                            key={
                                item.celular
                            }
                            style={
                                styles.card
                            }
                            activeOpacity={0.8}
                            onPress={() =>
                                navigation.navigate(
                                    'DetalleCliente',
                                    {
                                        celular:
                                            item.celular
                                    }
                                )
                            }
                        >

                            <View
                                style={
                                    styles.cardTop
                                }
                            >

                                <View
                                    style={
                                        styles.avatar
                                    }
                                >

                                    <Text
                                        style={
                                            styles.avatarText
                                        }
                                    >
                                        👤
                                    </Text>

                                </View>


                                <View
                                    style={
                                        styles.cardMain
                                    }
                                >

                                    <Text
                                        style={
                                            styles.name
                                        }
                                    >
                                        {
                                            item.nombre
                                            ||
                                            'Sin nombre'
                                        }
                                    </Text>

                                    <Text
                                        style={
                                            styles.phone
                                        }
                                    >
                                        📱 {item.celular}
                                    </Text>

                                    {
                                        item.ciudad
                                        ?
                                        (
                                            <Text
                                                style={
                                                    styles.city
                                                }
                                            >
                                                📍 {item.ciudad}
                                            </Text>
                                        )
                                        :
                                        null
                                    }

                                </View>


                                <Text
                                    style={
                                        styles.arrow
                                    }
                                >
                                    ›
                                </Text>

                            </View>


                            <View
                                style={
                                    styles.metrics
                                }
                            >

                                <Metric
                                    label="Compras"
                                    value={
                                        String(
                                            Number(
                                                item.total_compras || 0
                                            )
                                        )
                                    }
                                />

                                <Metric
                                    label="Ventas"
                                    value={
                                        formatearDinero(
                                            item.total_ventas
                                        )
                                    }
                                />

                                <Metric
                                    label="Última"
                                    value={
                                        formatearFechaCorta(
                                            item.ultima_compra
                                        )
                                    }
                                />

                            </View>

                        </TouchableOpacity>

                    )
                )
            }

        </ScrollView>

    );

}



function Metric({
    label,
    value
}) {

    return (

        <View
            style={
                styles.metric
            }
        >

            <Text
                style={
                    styles.metricLabel
                }
            >
                {label}
            </Text>

            <Text
                style={
                    styles.metricValue
                }
                numberOfLines={1}
            >
                {value}
            </Text>

        </View>

    );

}



function formatearDinero(
    valor
) {

    const numero =
        Number(
            valor || 0
        );


    return `$${numero.toFixed(2)}`;

}



function formatearFechaCorta(
    fecha
) {

    if(
        !fecha
    ){

        return '-';

    }


    const parsed =
        new Date(
            String(fecha)
                .replace(
                    ' ',
                    'T'
                )
        );


    if(
        Number.isNaN(
            parsed.getTime()
        )
    ){

        return String(fecha);

    }


    return parsed.toLocaleDateString();

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

        marginBottom:18,

        color:
            COLORS.textSecondary

    },


    search:{

        backgroundColor:
            COLORS.card,

        borderWidth:1,

        borderColor:
            COLORS.border,

        borderRadius:14,

        paddingHorizontal:14,

        paddingVertical:12,

        fontSize:15,

        marginBottom:16

    },


    center:{

        alignItems:'center',

        paddingVertical:35

    },


    loadingText:{

        marginTop:10,

        color:
            COLORS.textSecondary

    },


    card:{

        backgroundColor:
            COLORS.card,

        borderRadius:16,

        padding:15,

        marginBottom:12,

        elevation:2

    },


    cardTop:{

        flexDirection:'row',

        alignItems:'center'

    },


    avatar:{

        width:48,

        height:48,

        borderRadius:24,

        backgroundColor:'#e7f5f5',

        justifyContent:'center',

        alignItems:'center'

    },


    avatarText:{

        fontSize:24

    },


    cardMain:{

        flex:1,

        marginLeft:12

    },


    name:{

        fontSize:17,

        fontWeight:'bold',

        color:
            COLORS.text

    },


    phone:{

        marginTop:3,

        color:
            COLORS.textSecondary

    },


    city:{

        marginTop:2,

        color:
            COLORS.textSecondary,

        fontSize:13

    },


    arrow:{

        fontSize:30,

        color:
            COLORS.primary

    },


    metrics:{

        flexDirection:'row',

        marginTop:14,

        paddingTop:12,

        borderTopWidth:1,

        borderTopColor:
            COLORS.border

    },


    metric:{

        flex:1,

        alignItems:'center'

    },


    metricLabel:{

        fontSize:11,

        color:
            COLORS.textSecondary

    },


    metricValue:{

        marginTop:3,

        fontSize:14,

        fontWeight:'bold',

        color:
            COLORS.text

    },


    messageCard:{

        backgroundColor:
            COLORS.card,

        padding:18,

        borderRadius:14

    },


    errorText:{

        color:
            COLORS.danger,

        textAlign:'center'

    },


    retryButton:{

        alignSelf:'center',

        marginTop:12,

        backgroundColor:
            COLORS.primary,

        paddingHorizontal:18,

        paddingVertical:9,

        borderRadius:10

    },


    retryText:{

        color:
            COLORS.white,

        fontWeight:'bold'

    },


    emptyCard:{

        backgroundColor:
            COLORS.card,

        borderRadius:16,

        padding:24,

        alignItems:'center'

    },


    emptyIcon:{

        fontSize:38

    },


    emptyTitle:{

        marginTop:8,

        fontSize:17,

        fontWeight:'bold',

        color:
            COLORS.text

    },


    emptyText:{

        marginTop:5,

        color:
            COLORS.textSecondary,

        textAlign:'center',

        lineHeight:20

    }

});
