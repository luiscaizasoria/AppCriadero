import React, {
    useCallback,
    useState
} from 'react';

import {
    View,
    Text,
    Image,
    ScrollView,
    TouchableOpacity,
    StyleSheet,
    ActivityIndicator,
    Alert
} from 'react-native';

import {
    useFocusEffect
} from '@react-navigation/native';

import {
    obtenerAvesParaAsignarJaula,
    cambiarJaulaAve
} from '../repositories/AveRepository';

import {
    COLORS
} from '../config/constants';


export default function SeleccionarAveJaulaScreen({
    route,
    navigation
}) {

    const {
        jaulaId,
        jaulaCodigo
    } = route.params;


    const [
        aves,
        setAves
    ] = useState([]);


    const [
        loading,
        setLoading
    ] = useState(true);


    const [
        procesandoId,
        setProcesandoId
    ] = useState(null);


    const cargar =
        async () => {

            try {

                setLoading(
                    true
                );


                const data =
                    await obtenerAvesParaAsignarJaula(
                        jaulaId
                    );


                setAves(
                    data
                );

            }
            catch (error) {

                console.error(
                    'Error cargando aves disponibles:',
                    error
                );


                Alert.alert(
                    'Error',
                    'No fue posible cargar las aves disponibles.'
                );

            }
            finally {

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
            [jaulaId]
        )

    );


    const confirmarAsignacion =
        ave => {

            const mensaje =
                ave.jaula_actual_id
                    ? `El ave ${ave.codigo} actualmente pertenece a la jaula ${ave.jaula_codigo}. ¿Deseas moverla a ${jaulaCodigo}?`
                    : `¿Deseas agregar el ave ${ave.codigo} a la jaula ${jaulaCodigo}?`;


            Alert.alert(

                'Asignar ave',

                mensaje,

                [
                    {
                        text:
                            'Cancelar',

                        style:
                            'cancel'
                    },

                    {
                        text:
                            ave.jaula_actual_id
                                ? 'Mover'
                                : 'Agregar',

                        onPress: () =>
                            asignarAve(
                                ave
                            )
                    }
                ]

            );

        };


    const asignarAve =
        async ave => {

            try {

                setProcesandoId(
                    ave.id
                );


                await cambiarJaulaAve({

                    aveId:
                        ave.id,

                    jaulaAnteriorId:
                        ave.jaula_actual_id
                        ||
                        null,

                    nuevaJaulaId:
                        jaulaId,

                    codigoAve:
                        ave.codigo

                });


                Alert.alert(

                    'Ave asignada',

                    `El ave ${ave.codigo} ahora pertenece a la jaula ${jaulaCodigo}.`,

                    [
                        {
                            text:
                                'Aceptar',

                            onPress: () =>
                                navigation.goBack()
                        }
                    ]

                );

            }
            catch (error) {

                console.error(
                    'Error asignando ave:',
                    error
                );


                Alert.alert(
                    'Error',
                    'No fue posible asignar el ave a la jaula.'
                );

            }
            finally {

                setProcesandoId(
                    null
                );

            }

        };


    if (loading) {

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


                <Text
                    style={
                        styles.loadingText
                    }
                >
                    Buscando aves...
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

            <Text
                style={
                    styles.title
                }
            >
                🐔 Agregar ave
            </Text>


            <Text
                style={
                    styles.subtitle
                }
            >
                Selecciona un ave para asignarla a la jaula {jaulaCodigo}.
            </Text>


            {
                aves.length === 0
                    ? (

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
                                ✅
                            </Text>


                            <Text
                                style={
                                    styles.emptyTitle
                                }
                            >
                                No hay aves disponibles
                            </Text>


                            <Text
                                style={
                                    styles.emptyText
                                }
                            >
                                Todas las aves activas ya pertenecen a esta jaula o no existen más aves registradas.
                            </Text>

                        </View>

                    )
                    : aves.map(
                        ave => (

                            <TouchableOpacity
                                key={
                                    ave.id
                                }
                                style={
                                    styles.birdCard
                                }
                                activeOpacity={
                                    0.8
                                }
                                disabled={
                                    procesandoId !==
                                    null
                                }
                                onPress={() =>
                                    confirmarAsignacion(
                                        ave
                                    )
                                }
                            >

                                {
                                    ave.foto_uri
                                        ? (

                                            <Image
                                                source={{
                                                    uri:
                                                        ave.foto_uri
                                                }}
                                                style={
                                                    styles.avatarPhoto
                                                }
                                            />

                                        )
                                        : (

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
                                                    🐔
                                                </Text>

                                            </View>

                                        )
                                }


                                <View
                                    style={
                                        styles.info
                                    }
                                >

                                    <Text
                                        style={
                                            styles.codigo
                                        }
                                    >
                                        {ave.codigo}
                                    </Text>


                                    <Text
                                        style={
                                            styles.raza
                                        }
                                    >
                                        {
                                            ave.raza
                                            ||
                                            'Raza no especificada'
                                        }
                                    </Text>


                                    <Text
                                        style={
                                            styles.location
                                        }
                                    >
                                        {
                                            ave.jaula_codigo
                                                ? `Actualmente: Jaula ${ave.jaula_codigo}`
                                                : 'Actualmente: Sin jaula'
                                        }
                                    </Text>

                                </View>


                                {
                                    procesandoId ===
                                    ave.id
                                        ? (

                                            <ActivityIndicator
                                                color={
                                                    COLORS.primary
                                                }
                                            />

                                        )
                                        : (

                                            <Text
                                                style={
                                                    styles.arrow
                                                }
                                            >
                                                ›
                                            </Text>

                                        )
                                }

                            </TouchableOpacity>

                        )
                    )
            }

        </ScrollView>

    );

}


const styles =
    StyleSheet.create({

        container: {

            flex: 1,

            backgroundColor:
                COLORS.background

        },


        content: {

            padding: 18,

            paddingBottom: 40

        },


        center: {

            flex: 1,

            justifyContent:
                'center',

            alignItems:
                'center',

            backgroundColor:
                COLORS.background

        },


        loadingText: {

            marginTop: 10,

            color:
                COLORS.textSecondary

        },


        title: {

            fontSize: 27,

            fontWeight:
                'bold',

            color:
                COLORS.primary

        },


        subtitle: {

            color:
                COLORS.textSecondary,

            marginTop: 5,

            marginBottom: 20,

            lineHeight: 20

        },


        birdCard: {

            backgroundColor:
                COLORS.card,

            borderRadius: 15,

            padding: 14,

            marginBottom: 11,

            flexDirection:
                'row',

            alignItems:
                'center',

            elevation: 2

        },


        avatar: {

            width: 54,

            height: 54,

            borderRadius: 27,

            backgroundColor:
                '#e7f5f5',

            alignItems:
                'center',

            justifyContent:
                'center'

        },


        avatarPhoto: {

            width: 54,

            height: 54,

            borderRadius: 27,

            backgroundColor:
                '#e7f5f5'

        },


        avatarText: {

            fontSize: 28

        },


        info: {

            flex: 1,

            marginLeft: 12

        },


        codigo: {

            fontSize: 18,

            fontWeight:
                'bold',

            color:
                COLORS.text

        },


        raza: {

            color:
                COLORS.textSecondary,

            marginTop: 2

        },


        location: {

            color:
                COLORS.primary,

            fontSize: 12,

            fontWeight:
                '600',

            marginTop: 6

        },


        arrow: {

            fontSize: 30,

            color:
                COLORS.primary

        },


        emptyCard: {

            backgroundColor:
                COLORS.card,

            borderRadius: 16,

            padding: 25,

            alignItems:
                'center',

            elevation: 2

        },


        emptyIcon: {

            fontSize: 38

        },


        emptyTitle: {

            fontSize: 18,

            fontWeight:
                'bold',

            color:
                COLORS.text,

            marginTop: 9

        },


        emptyText: {

            textAlign:
                'center',

            color:
                COLORS.textSecondary,

            lineHeight: 20,

            marginTop: 7

        }

    });