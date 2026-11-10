import React, {
    useCallback,
    useState
} from 'react';

import {
    View,
    Text,
    Image,
    ScrollView,
    StyleSheet
} from 'react-native';

import {
    useFocusEffect
} from '@react-navigation/native';

import {
    obtenerClientePorCelular,
    obtenerComprasCliente
} from '../repositories/ClientesRepository';

import FondoPantalla from '../components/FondoPantalla';
import Tarjeta from '../components/Tarjeta';
import TituloSeccion from '../components/TituloSeccion';
import Avatar from '../components/Avatar';
import Icono from '../components/Icono';
import EstadoCarga from '../components/EstadoCarga';
import EstadoError from '../components/EstadoError';
import EstadoVacio from '../components/EstadoVacio';

import {
    colors,
    spacing,
    typography
} from '../theme';



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


    const [
        errorCarga,
        setErrorCarga
    ] = useState(false);


    const cargar =
        async () => {

            try {

                setLoading(
                    true
                );

                setErrorCarga(
                    false
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

                setErrorCarga(
                    true
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

            <FondoPantalla>

                <EstadoCarga
                    mensaje="Cargando cliente..."
                />

            </FondoPantalla>

        );

    }


    if(
        errorCarga
    ){

        return (

            <FondoPantalla>

                <EstadoError
                    titulo="No fue posible cargar el cliente."
                    mensaje="Revisa tu conexión e inténtalo de nuevo."
                    onReintentar={
                        cargar
                    }
                />

            </FondoPantalla>

        );

    }


    if(
        !cliente
    ){

        return (

            <FondoPantalla>

                <EstadoVacio
                    icono="search-outline"
                    titulo="Cliente no encontrado."
                    testID="cliente-no-encontrado"
                />

            </FondoPantalla>

        );

    }


    return (

        <FondoPantalla>

            <ScrollView
                contentContainerStyle={
                    styles.content
                }
            >

                <Tarjeta>

                    <View
                        style={
                            styles.header
                        }
                    >

                        <Avatar
                            icono="person-circle-outline"
                            tamano={72}
                            indice={0}
                        />


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

                            <View
                                style={
                                    styles.dato
                                }
                            >

                                <Icono
                                    nombre="call-outline"
                                    tamano={18}
                                    color={colors.textSecondary}
                                    style={
                                        styles.datoIcono
                                    }
                                />

                                <Text
                                    style={
                                        styles.phone
                                    }
                                >
                                    {cliente.celular}
                                </Text>

                            </View>

                            {
                                cliente.ciudad
                                ?
                                (
                                    <View
                                        style={
                                            styles.dato
                                        }
                                    >

                                        <Icono
                                            nombre="location-outline"
                                            tamano={18}
                                            color={colors.textSecondary}
                                            style={
                                                styles.datoIcono
                                            }
                                        />

                                        <Text
                                            style={
                                                styles.city
                                            }
                                        >
                                            {cliente.ciudad}
                                        </Text>

                                    </View>
                                )
                                :
                                null
                            }

                        </View>

                    </View>

                </Tarjeta>


                <Tarjeta
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

                </Tarjeta>


                <TituloSeccion
                    icono="paw-outline"
                    indice={2}
                >
                    Compras realizadas
                </TituloSeccion>


                {
                    compras.map(
                        item => (

                            <Tarjeta
                                key={
                                    item.venta_id
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
                                            <Avatar
                                                icono="paw-outline"
                                                tamano={56}
                                                indice={1}
                                            />
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

                                        <View
                                            style={
                                                styles.dato
                                            }
                                        >

                                            {
                                                item.ave_sexo === 'MACHO'
                                                ?
                                                (
                                                    <Icono
                                                        nombre="male-outline"
                                                        tamano={16}
                                                        color={colors.textSecondary}
                                                        style={
                                                            styles.datoIcono
                                                        }
                                                    />
                                                )
                                                :
                                                null
                                            }

                                            {
                                                item.ave_sexo === 'HEMBRA'
                                                ?
                                                (
                                                    <Icono
                                                        nombre="female-outline"
                                                        tamano={16}
                                                        color={colors.textSecondary}
                                                        style={
                                                            styles.datoIcono
                                                        }
                                                    />
                                                )
                                                :
                                                null
                                            }

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

                                        </View>

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

                            </Tarjeta>

                        )
                    )
                }

            </ScrollView>

        </FondoPantalla>

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
                maxFontSizeMultiplier={1.3}
                testID={label === 'Compras' ? 'cliente-compras' : undefined}
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

        return 'Macho';

    }


    if(
        sexo === 'HEMBRA'
    ){

        return 'Hembra';

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

    content:{

        padding:spacing.pantalla,

        paddingBottom:spacing.xl

    },


    header:{

        flexDirection:'row',

        alignItems:'center'

    },


    headerInfo:{

        flex:1,

        marginLeft:spacing.lg

    },


    title:{

        ...typography.titulo,

        color:
            colors.primaryDark

    },


    dato:{

        flexDirection:'row',

        alignItems:'center',

        marginTop:2

    },


    datoIcono:{

        marginRight:spacing.xs

    },


    phone:{

        ...typography.cuerpo,

        color:
            colors.text

    },


    city:{

        ...typography.cuerpo,

        color:
            colors.textSecondary

    },


    summaryCard:{

        flexDirection:'row',

        paddingHorizontal:spacing.sm

    },


    summaryMetric:{

        flex:1,

        alignItems:'center',

        paddingHorizontal:spacing.xs

    },


    summaryLabel:{

        ...typography.secundario,

        color:
            colors.textSecondary,

        textAlign:'center'

    },


    summaryValue:{

        ...typography.subtitulo,

        marginTop:spacing.xs,

        color:
            colors.text

    },


    purchaseTop:{

        flexDirection:'row',

        alignItems:'center',

        marginBottom:spacing.md

    },


    avePhoto:{

        width:56,

        height:56,

        borderRadius:28,

        borderWidth:3,

        borderColor:
            colors.white

    },


    purchaseMain:{

        flex:1,

        marginLeft:spacing.md

    },


    aveCode:{

        ...typography.subtitulo,

        color:
            colors.text

    },


    aveDetail:{

        ...typography.secundario,

        color:
            colors.textSecondary

    },


    date:{

        ...typography.secundario,

        marginTop:spacing.xs,

        color:
            colors.textSecondary

    },


    infoRow:{

        flexDirection:'row',

        justifyContent:'space-between',

        paddingVertical:spacing.sm,

        borderTopWidth:1,

        borderTopColor:
            colors.borderSoft

    },


    infoLabel:{

        ...typography.secundario,

        color:
            colors.textSecondary

    },


    infoValue:{

        ...typography.etiqueta,

        color:
            colors.text,

        maxWidth:'60%',

        textAlign:'right'

    },


    detail:{

        ...typography.cuerpo,

        marginTop:spacing.sm,

        color:
            colors.textSecondary

    }

});
