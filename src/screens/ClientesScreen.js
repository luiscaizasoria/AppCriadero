import React, {
    useCallback,
    useMemo,
    useState
} from 'react';

import {
    View,
    Text,
    ScrollView,
    StyleSheet
} from 'react-native';

import {
    useFocusEffect
} from '@react-navigation/native';

import {
    obtenerClientes
} from '../repositories/ClientesRepository';

import FondoPantalla from '../components/FondoPantalla';
import Tarjeta from '../components/Tarjeta';
import CampoTexto from '../components/CampoTexto';
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

        <FondoPantalla>

            <ScrollView
                contentContainerStyle={
                    styles.content
                }
                keyboardShouldPersistTaps="handled"
            >

                <Text
                    style={
                        styles.subtitle
                    }
                >
                    Compradores agrupados por número celular
                </Text>


                <CampoTexto
                    icono="buscar"
                    accessibilityLabel="Buscar clientes"
                    value={
                        busqueda
                    }
                    onChangeText={
                        setBusqueda
                    }
                    placeholder="Buscar por nombre, celular o ciudad..."
                    testID="clientes-busqueda"
                />


                {
                    loading
                    &&
                    (
                        <EstadoCarga
                            mensaje="Cargando clientes..."
                        />
                    )
                }


                {
                    !loading
                    &&
                    error
                    &&
                    (
                        <EstadoError
                            titulo={
                                error
                            }
                            mensaje="Revisa tu conexión e inténtalo de nuevo."
                            onReintentar={
                                cargar
                            }
                        />
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
                        <EstadoVacio
                            icono="people-outline"
                            titulo="No hay clientes para mostrar"
                            mensaje="Los clientes aparecerán aquí cuando registres ventas con número celular."
                            testID="clientes-vacio"
                        />
                    )
                }


                {
                    !loading
                    &&
                    !error
                    &&
                    filtrados.map(
                        (item, indice) => (

                            <Tarjeta
                                key={
                                    item.celular
                                }
                                testID={
                                    `cliente-${item.celular}`
                                }
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

                                    <Avatar
                                        icono="person-circle-outline"
                                        indice={indice}
                                    />


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

                                        <View
                                            style={
                                                styles.dato
                                            }
                                        >

                                            <Icono
                                                nombre="call-outline"
                                                tamano={16}
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
                                                {item.celular}
                                            </Text>

                                        </View>

                                        {
                                            item.ciudad
                                            ?
                                            (
                                                <View
                                                    style={
                                                        styles.dato
                                                    }
                                                >

                                                    <Icono
                                                        nombre="location-outline"
                                                        tamano={16}
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
                                                        {item.ciudad}
                                                    </Text>

                                                </View>
                                            )
                                            :
                                            null
                                        }

                                    </View>


                                    <Icono
                                        nombre="siguiente"
                                        tamano={22}
                                        color={colors.textSecondary}
                                    />

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

                            </Tarjeta>

                        )
                    )
                }

            </ScrollView>

        </FondoPantalla>

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
                testID={label === 'Compras' ? 'cliente-compras' : undefined}
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

    content:{

        padding:spacing.pantalla,

        paddingBottom:spacing.xl

    },


    subtitle:{

        ...typography.cuerpo,

        marginBottom:spacing.lg,

        color:
            colors.textSecondary

    },


    cardTop:{

        flexDirection:'row',

        alignItems:'center'

    },


    cardMain:{

        flex:1,

        marginLeft:spacing.md

    },


    name:{

        ...typography.subtitulo,

        color:
            colors.text

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

        ...typography.secundario,

        color:
            colors.textSecondary

    },


    city:{

        ...typography.secundario,

        color:
            colors.textSecondary

    },


    metrics:{

        flexDirection:'row',

        marginTop:spacing.md,

        paddingTop:spacing.md,

        borderTopWidth:1,

        borderTopColor:
            colors.borderSoft

    },


    metric:{

        flex:1,

        alignItems:'center'

    },


    metricLabel:{

        ...typography.secundario,

        color:
            colors.textSecondary

    },


    metricValue:{

        ...typography.cuerpoFuerte,

        marginTop:2,

        color:
            colors.text

    }

});
