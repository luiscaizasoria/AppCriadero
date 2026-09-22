import React, {
    useCallback,
    useState
} from 'react';

import {
    View,
    Text,
    Image,
    ScrollView,
    ActivityIndicator,
    StyleSheet
} from 'react-native';

import {
    useFocusEffect
} from '@react-navigation/native';

import {
    obtenerClientePorCelular,
    obtenerComprasCliente
} from '../repositories/ClientesRepository';

import {
    COLORS
} from '../config/constants';



export default function DetalleClienteScreen({
    route
}) {

    const {
        celular
    } = route.params;


    const [
        cliente,
        setCliente
    ] = useState(null);


    const [
        compras,
        setCompras
    ] = useState([]);


    const [
        loading,
        setLoading
    ] = useState(true);


    const cargar =
        async () => {

            try {

                setLoading(
                    true
                );


                const [
                    clienteData,
                    comprasData
                ] =
                    await Promise.all([

                        obtenerClientePorCelular(
                            celular
                        ),

                        obtenerComprasCliente(
                            celular
                        )

                    ]);


                setCliente(
                    clienteData
                );


                setCompras(
                    comprasData
                );

            }
            catch(error){

                console.error(
                    'Error cargando detalle del cliente:',
                    error
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
            [
                celular
            ]
        )

    );


    if(
        loading
    ){

        return (

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

            </View>

        );

    }


    if(
        !cliente
    ){

        return (

            <View
                style={
                    styles.center
                }
            >

                <Text
                    style={
                        styles.notFound
                    }
                >
                    Cliente no encontrado.
                </Text>

            </View>

        );

    }


    return (

        <ScrollView
            style={
                styles.container
            }
            contentContainerStyle={
                styles.content
            }
        >

            <View
                style={
                    styles.header
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
                        styles.headerInfo
                    }
                >

                    <Text
                        style={
                            styles.title
                        }
                    >
                        {
                            cliente.nombre
                            ||
                            'Sin nombre'
                        }
                    </Text>

                    <Text
                        style={
                            styles.phone
                        }
                    >
                        📱 {cliente.celular}
                    </Text>

                    {
                        cliente.ciudad
                        ?
                        (
                            <Text
                                style={
                                    styles.city
                                }
                            >
                                📍 {cliente.ciudad}
                            </Text>
                        )
                        :
                        null
                    }

                </View>

            </View>


            <View
                style={
                    styles.summaryCard
                }
            >

                <SummaryMetric
                    label="Compras"
                    value={
                        String(
                            Number(
                                cliente.total_compras || 0
                            )
                        )
                    }
                />

                <SummaryMetric
                    label="Total aves"
                    value={
                        formatearDinero(
                            cliente.total_ventas
                        )
                    }
                />

                <SummaryMetric
                    label="Envíos"
                    value={
                        formatearDinero(
                            cliente.total_envios
                        )
                    }
                />

            </View>


            <Text
                style={
                    styles.sectionTitle
                }
            >
                🐔 Compras realizadas
            </Text>


            {
                compras.map(
                    item => (

                        <View
                            key={
                                item.venta_id
                            }
                            style={
                                styles.purchaseCard
                            }
                        >

                            <View
                                style={
                                    styles.purchaseTop
                                }
                            >

                                {
                                    item.ave_foto_uri
                                    ?
                                    (
                                        <Image
                                            source={{
                                                uri:
                                                    item.ave_foto_uri
                                            }}
                                            style={
                                                styles.avePhoto
                                            }
                                        />
                                    )
                                    :
                                    (
                                        <View
                                            style={
                                                styles.avePhotoEmpty
                                            }
                                        >

                                            <Text>
                                                🐔
                                            </Text>

                                        </View>
                                    )
                                }


                                <View
                                    style={
                                        styles.purchaseMain
                                    }
                                >

                                    <Text
                                        style={
                                            styles.aveCode
                                        }
                                    >
                                        {item.ave_codigo}
                                    </Text>

                                    <Text
                                        style={
                                            styles.aveDetail
                                        }
                                    >
                                        {
                                            item.ave_raza ||
                                            'Sin raza'
                                        }
                                        {' · '}
                                        {
                                            textoSexo(
                                                item.ave_sexo
                                            )
                                        }
                                    </Text>

                                    <Text
                                        style={
                                            styles.date
                                        }
                                    >
                                        {
                                            formatearFecha(
                                                item.fecha
                                            )
                                        }
                                    </Text>

                                </View>

                            </View>


                            <InfoRow
                                label="Valor ave"
                                value={
                                    formatearDineroOpcional(
                                        item.valor_venta
                                    )
                                }
                            />

                            <InfoRow
                                label="Valor envío"
                                value={
                                    formatearDineroOpcional(
                                        item.valor_envio
                                    )
                                }
                            />

                            <InfoRow
                                label="Ciudad"
                                value={
                                    item.ciudad_destino
                                    ||
                                    'No registrado'
                                }
                            />

                            <InfoRow
                                label="Cooperativa"
                                value={
                                    item.cooperativa_envio
                                    ||
                                    'No registrado'
                                }
                            />

                            {
                                item.detalle
                                ?
                                (
                                    <Text
                                        style={
                                            styles.detail
                                        }
                                    >
                                        {item.detalle}
                                    </Text>
                                )
                                :
                                null
                            }

                        </View>

                    )
                )
            }

        </ScrollView>

    );

}



function SummaryMetric({
    label,
    value
}) {

    return (

        <View
            style={
                styles.summaryMetric
            }
        >

            <Text
                style={
                    styles.summaryLabel
                }
            >
                {label}
            </Text>

            <Text
                style={
                    styles.summaryValue
                }
            >
                {value}
            </Text>

        </View>

    );

}



function InfoRow({
    label,
    value
}) {

    return (

        <View
            style={
                styles.infoRow
            }
        >

            <Text
                style={
                    styles.infoLabel
                }
            >
                {label}
            </Text>

            <Text
                style={
                    styles.infoValue
                }
            >
                {value}
            </Text>

        </View>

    );

}



function textoSexo(
    sexo
) {

    if(
        sexo === 'MACHO'
    ){

        return '🐓 Macho';

    }


    if(
        sexo === 'HEMBRA'
    ){

        return '🐔 Hembra';

    }


    return 'Sexo no registrado';

}



function formatearDineroOpcional(
    valor
) {

    if(
        valor === null
        ||
        valor === undefined
        ||
        valor === ''
    ){

        return 'No registrado';

    }


    const numero =
        Number(
            valor
        );


    if(
        !Number.isFinite(
            numero
        )
    ){

        return 'No registrado';

    }


    return `$${numero.toFixed(2)}`;

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



function formatearFecha(
    fecha
) {

    if(
        !fecha
    ){

        return 'Sin fecha';

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


    return parsed.toLocaleString();

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


    center:{

        flex:1,

        justifyContent:'center',

        alignItems:'center',

        backgroundColor:
            COLORS.background

    },


    notFound:{

        color:
            COLORS.textSecondary

    },


    header:{

        flexDirection:'row',

        alignItems:'center',

        marginBottom:16

    },


    avatar:{

        width:62,

        height:62,

        borderRadius:31,

        backgroundColor:'#e7f5f5',

        alignItems:'center',

        justifyContent:'center'

    },


    avatarText:{

        fontSize:30

    },


    headerInfo:{

        flex:1,

        marginLeft:14

    },


    title:{

        fontSize:24,

        fontWeight:'bold',

        color:
            COLORS.primary

    },


    phone:{

        marginTop:4,

        color:
            COLORS.text

    },


    city:{

        marginTop:2,

        color:
            COLORS.textSecondary

    },


    summaryCard:{

        flexDirection:'row',

        backgroundColor:
            COLORS.card,

        borderRadius:16,

        paddingVertical:15,

        marginBottom:20

    },


    summaryMetric:{

        flex:1,

        alignItems:'center',

        paddingHorizontal:5

    },


    summaryLabel:{

        fontSize:11,

        color:
            COLORS.textSecondary,

        textAlign:'center'

    },


    summaryValue:{

        marginTop:4,

        fontSize:16,

        fontWeight:'bold',

        color:
            COLORS.text

    },


    sectionTitle:{

        fontSize:19,

        fontWeight:'bold',

        color:
            COLORS.text,

        marginBottom:12

    },


    purchaseCard:{

        backgroundColor:
            COLORS.card,

        borderRadius:16,

        padding:15,

        marginBottom:12,

        elevation:2

    },


    purchaseTop:{

        flexDirection:'row',

        alignItems:'center',

        marginBottom:12

    },


    avePhoto:{

        width:54,

        height:54,

        borderRadius:27

    },


    avePhotoEmpty:{

        width:54,

        height:54,

        borderRadius:27,

        backgroundColor:'#e7f5f5',

        alignItems:'center',

        justifyContent:'center'

    },


    purchaseMain:{

        flex:1,

        marginLeft:12

    },


    aveCode:{

        fontSize:18,

        fontWeight:'bold',

        color:
            COLORS.text

    },


    aveDetail:{

        marginTop:2,

        color:
            COLORS.textSecondary

    },


    date:{

        marginTop:4,

        fontSize:12,

        color:
            COLORS.textSecondary

    },


    infoRow:{

        flexDirection:'row',

        justifyContent:'space-between',

        paddingVertical:7,

        borderTopWidth:1,

        borderTopColor:
            COLORS.border

    },


    infoLabel:{

        color:
            COLORS.textSecondary,

        fontSize:13

    },


    infoValue:{

        color:
            COLORS.text,

        fontWeight:'600',

        fontSize:13,

        maxWidth:'60%',

        textAlign:'right'

    },


    detail:{

        marginTop:10,

        color:
            COLORS.textSecondary,

        lineHeight:19

    }

});
