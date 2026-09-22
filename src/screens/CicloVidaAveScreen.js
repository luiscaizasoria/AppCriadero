import React, {
    useCallback,
    useState
} from 'react';

import {
    View,
    Text,
    Image,
    ScrollView,
    StyleSheet,
    ActivityIndicator
} from 'react-native';

import {
    useFocusEffect
} from '@react-navigation/native';

import {
    obtenerAvePorId
} from '../repositories/AveRepository';

import {
    obtenerCicloVidaAve
} from '../repositories/CicloVidaRepository';

import {
    COLORS
} from '../config/constants';


export default function CicloVidaAveScreen({
    route
}) {

    const {
        aveId
    } = route.params;


    const [
        ave,
        setAve
    ] = useState(null);


    const [
        eventos,
        setEventos
    ] = useState([]);


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


                const [
                    aveData,
                    eventosData
                ] =
                    await Promise.all([
                        obtenerAvePorId(
                            aveId
                        ),
                        obtenerCicloVidaAve(
                            aveId
                        )
                    ]);


                setAve(
                    aveData
                );


                setEventos(
                    eventosData
                );

            }
            catch (errorCarga) {

                console.error(
                    'Error cargando ciclo de vida:',
                    errorCarga
                );


                setError(
                    'No fue posible cargar el ciclo de vida del ave.'
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
            [
                aveId
            ]
        )

    );


    if (
        loading
    ) {

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
                    Cargando ciclo de vida...
                </Text>

            </View>

        );

    }


    if (
        error
        ||
        !ave
    ) {

        return (

            <View
                style={
                    styles.center
                }
            >

                <Text
                    style={
                        styles.errorText
                    }
                >
                    {
                        error ||
                        'Ave no encontrada.'
                    }
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
                🌿 Ciclo de vida
            </Text>


            <Text
                style={
                    styles.subtitle
                }
            >
                Historia completa y cronológica de {ave.codigo}
            </Text>


            <View
                style={
                    styles.birdCard
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
                                    styles.birdPhoto
                                }
                            />

                        )
                        : (

                            <View
                                style={
                                    styles.birdPhotoEmpty
                                }
                            >

                                <Text
                                    style={
                                        styles.birdPhotoIcon
                                    }
                                >
                                    🐔
                                </Text>

                            </View>

                        )
                }


                <View
                    style={
                        styles.birdInfo
                    }
                >

                    <Text
                        style={
                            styles.birdCode
                        }
                    >
                        {ave.codigo}
                    </Text>


                    <Text
                        style={
                            styles.birdRaza
                        }
                    >
                        {
                            ave.raza ||
                            'Sin raza'
                        }
                    </Text>


                    <Text
                        style={
                            styles.birdMeta
                        }
                    >
                        {
                            obtenerTextoSexo(
                                ave.sexo
                            )
                        }
                        {' · '}
                        {
                            obtenerTextoEstado(
                                ave.estado
                            )
                        }
                    </Text>

                </View>

            </View>


            <Text
                style={
                    styles.sectionTitle
                }
            >
                Línea de tiempo
            </Text>


            {
                eventos.length === 0
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
                                🌱
                            </Text>


                            <Text
                                style={
                                    styles.emptyTitle
                                }
                            >
                                Sin eventos todavía
                            </Text>


                            <Text
                                style={
                                    styles.emptyText
                                }
                            >
                                Los cambios del ave aparecerán aquí a medida que se registren.
                            </Text>

                        </View>

                    )
                    : eventos.map(
                        (
                            evento,
                            index
                        ) => {

                            const visual =
                                obtenerVisualEvento(
                                    evento.tipo
                                );


                            const esUltimo =
                                index ===
                                eventos.length - 1;


                            return (

                                <View
                                    key={
                                        evento.id
                                    }
                                    style={
                                        styles.timelineItem
                                    }
                                >

                                    <View
                                        style={
                                            styles.timelineRail
                                        }
                                    >

                                        <View
                                            style={[
                                                styles.timelineDot,
                                                {
                                                    backgroundColor:
                                                        visual.color
                                                }
                                            ]}
                                        >

                                            <Text
                                                style={
                                                    styles.timelineIcon
                                                }
                                            >
                                                {visual.icono}
                                            </Text>

                                        </View>


                                        {
                                            !esUltimo
                                                ? (

                                                    <View
                                                        style={[
                                                            styles.timelineLine,
                                                            {
                                                                backgroundColor:
                                                                    visual.lineColor
                                                            }
                                                        ]}
                                                    />

                                                )
                                                : null
                                        }

                                    </View>


                                    <View
                                        style={
                                            styles.eventCard
                                        }
                                    >

                                        <Text
                                            style={
                                                styles.eventDate
                                            }
                                        >
                                            {
                                                formatearFecha(
                                                    evento.fecha
                                                )
                                            }
                                        </Text>


                                        <Text
                                            style={
                                                styles.eventTitle
                                            }
                                        >
                                            {evento.titulo}
                                        </Text>


                                        {
                                            evento.detalle
                                                ? (

                                                    <Text
                                                        style={
                                                            styles.eventDetail
                                                        }
                                                    >
                                                        {evento.detalle}
                                                    </Text>

                                                )
                                                : null
                                        }


                                        {
                                            evento.jaulaCodigo
                                                ? (

                                                    <Text
                                                        style={
                                                            styles.eventMeta
                                                        }
                                                    >
                                                        🏠 Jaula {evento.jaulaCodigo}
                                                    </Text>

                                                )
                                                : null
                                        }


                                        {
                                            evento.caracteristicas
                                                ? (

                                                    <View
                                                        style={
                                                            styles.characteristicsBox
                                                        }
                                                    >

                                                        <Text
                                                            style={
                                                                styles.characteristicsLabel
                                                            }
                                                        >
                                                            Características
                                                        </Text>


                                                        <Text
                                                            style={
                                                                styles.characteristicsText
                                                            }
                                                        >
                                                            {evento.caracteristicas}
                                                        </Text>

                                                    </View>

                                                )
                                                : null
                                        }


                                        {
                                            evento.fotoUri
                                                ? (

                                                    <Image
                                                        source={{
                                                            uri:
                                                                evento.fotoUri
                                                        }}
                                                        style={
                                                            styles.eventPhoto
                                                        }
                                                    />

                                                )
                                                : null
                                        }

                                    </View>

                                </View>

                            );

                        }
                    )
            }

        </ScrollView>

    );

}


function obtenerTextoSexo(
    sexo
) {

    if (
        sexo === 'MACHO'
    ) {

        return '🐓 Macho';

    }


    if (
        sexo === 'HEMBRA'
    ) {

        return '🐔 Hembra';

    }


    return 'Sexo no registrado';

}


function obtenerTextoEstado(
    estado
) {

    if (
        estado === 'VENDIDA'
    ) {

        return 'Vendida';

    }


    if (
        estado === 'FALLECIDA'
    ) {

        return 'Fallecida';

    }


    return 'Activa';

}


function obtenerVisualEvento(
    tipo
) {

    switch (
        String(
            tipo || ''
        )
            .toUpperCase()
    ) {

        case 'NACIMIENTO':

            return {
                icono: '🐣',
                color: '#8acb78',
                lineColor: '#cfe7c8'
            };


        case 'LLEGADA':

            return {
                icono: '🏡',
                color: '#58c7b4',
                lineColor: '#bfe8df'
            };


        case 'ALTA':

            return {
                icono: '📝',
                color: '#4ea8de',
                lineColor: '#c5e2f2'
            };


        case 'DATOS_ACTUALIZADOS':

            return {
                icono: '✏️',
                color: '#7f8c8d',
                lineColor: '#d7dddd'
            };


        case 'EVOLUCION':

            return {
                icono: '📸',
                color: '#8e7cc3',
                lineColor: '#ded7ee'
            };


        case 'CAMBIO_JAULA':

            return {
                icono: '🏠',
                color: '#5b8def',
                lineColor: '#cfddfa'
            };


        case 'SALUD':

            return {
                icono: '🩺',
                color: '#e76f51',
                lineColor: '#f3cec5'
            };


        case 'RECUPERACION':

            return {
                icono: '✅',
                color: '#52b788',
                lineColor: '#c9ead9'
            };


        case 'POSTURA_HUEVO':

            return {
                icono: '🥚',
                color: '#e9c46a',
                lineColor: '#f4e3b9'
            };


        case 'VENTA':

            return {
                icono: '💰',
                color: '#2a9d8f',
                lineColor: '#bfe1dc'
            };


        case 'MUERTE':

            return {
                icono: '⚰',
                color: '#6c757d',
                lineColor: '#d5d7d9'
            };


        default:

            return {
                icono: '•',
                color: COLORS.primary,
                lineColor: '#cfe1e1'
            };

    }

}


function formatearFecha(
    fecha
) {

    if (!fecha) {

        return 'Fecha no registrada';

    }


    const texto =
        String(
            fecha
        )
            .trim();


    const coincidencia =
        texto.match(
            /^(\d{4})-(\d{2})-(\d{2})(?:[T\s](\d{2}):(\d{2}))?/
        );


    if (!coincidencia) {

        return texto;

    }


    const meses = [
        'ene',
        'feb',
        'mar',
        'abr',
        'may',
        'jun',
        'jul',
        'ago',
        'sep',
        'oct',
        'nov',
        'dic'
    ];


    const anio =
        coincidencia[1];


    const mes =
        meses[
            Number(
                coincidencia[2]
            ) - 1
        ];


    const dia =
        Number(
            coincidencia[3]
        );


    const hora =
        coincidencia[4];


    const minuto =
        coincidencia[5];


    if (
        hora
        &&
        minuto
    ) {

        return `${dia} ${mes} ${anio} · ${hora}:${minuto}`;

    }


    return `${dia} ${mes} ${anio}`;

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

            paddingBottom: 50

        },


        center: {

            flex: 1,

            justifyContent: 'center',

            alignItems: 'center',

            padding: 24,

            backgroundColor:
                COLORS.background

        },


        loadingText: {

            marginTop: 10,

            color:
                COLORS.textSecondary

        },


        errorText: {

            color:
                COLORS.danger,

            textAlign: 'center'

        },


        title: {

            fontSize: 27,

            fontWeight: 'bold',

            color:
                COLORS.primary

        },


        subtitle: {

            marginTop: 5,

            color:
                COLORS.textSecondary,

            lineHeight: 20

        },


        birdCard: {

            marginTop: 18,

            backgroundColor:
                COLORS.card,

            borderRadius: 18,

            padding: 14,

            flexDirection: 'row',

            alignItems: 'center',

            elevation: 2

        },


        birdPhoto: {

            width: 68,

            height: 68,

            borderRadius: 34

        },


        birdPhotoEmpty: {

            width: 68,

            height: 68,

            borderRadius: 34,

            backgroundColor: '#e7f5f5',

            alignItems: 'center',

            justifyContent: 'center'

        },


        birdPhotoIcon: {

            fontSize: 30

        },


        birdInfo: {

            flex: 1,

            marginLeft: 13

        },


        birdCode: {

            fontSize: 22,

            fontWeight: 'bold',

            color:
                COLORS.text

        },


        birdRaza: {

            marginTop: 2,

            color:
                COLORS.textSecondary

        },


        birdMeta: {

            marginTop: 7,

            fontSize: 12,

            color:
                COLORS.text

        },


        sectionTitle: {

            marginTop: 25,

            marginBottom: 14,

            fontSize: 20,

            fontWeight: 'bold',

            color:
                COLORS.text

        },


        timelineItem: {

            flexDirection: 'row',

            alignItems: 'stretch'

        },


        timelineRail: {

            width: 46,

            alignItems: 'center'

        },


        timelineDot: {

            width: 36,

            height: 36,

            borderRadius: 18,

            alignItems: 'center',

            justifyContent: 'center',

            zIndex: 2,

            elevation: 1

        },


        timelineIcon: {

            fontSize: 16

        },


        timelineLine: {

            width: 3,

            flex: 1,

            minHeight: 48,

            marginTop: 2,

            marginBottom: 2,

            borderRadius: 2

        },


        eventCard: {

            flex: 1,

            backgroundColor:
                COLORS.card,

            borderRadius: 16,

            padding: 14,

            marginLeft: 7,

            marginBottom: 14,

            elevation: 2

        },


        eventDate: {

            fontSize: 11,

            color:
                COLORS.textSecondary,

            marginBottom: 4

        },


        eventTitle: {

            fontSize: 16,

            fontWeight: 'bold',

            color:
                COLORS.text

        },


        eventDetail: {

            marginTop: 6,

            color:
                COLORS.textSecondary,

            lineHeight: 20

        },


        eventMeta: {

            marginTop: 8,

            color:
                COLORS.text,

            fontSize: 12,

            fontWeight: '600'

        },


        characteristicsBox: {

            marginTop: 9,

            padding: 10,

            borderRadius: 11,

            backgroundColor: '#f4f7f7'

        },


        characteristicsLabel: {

            fontSize: 11,

            color:
                COLORS.textSecondary,

            fontWeight: '700'

        },


        characteristicsText: {

            marginTop: 3,

            color:
                COLORS.text,

            lineHeight: 18

        },


        eventPhoto: {

            marginTop: 10,

            width: 125,

            height: 125,

            borderRadius: 13,

            backgroundColor: '#eeeeee'

        },


        emptyCard: {

            backgroundColor:
                COLORS.card,

            borderRadius: 18,

            padding: 24,

            alignItems: 'center',

            elevation: 2

        },


        emptyIcon: {

            fontSize: 38

        },


        emptyTitle: {

            marginTop: 8,

            fontSize: 18,

            fontWeight: 'bold',

            color:
                COLORS.text

        },


        emptyText: {

            marginTop: 6,

            color:
                COLORS.textSecondary,

            textAlign: 'center',

            lineHeight: 20

        }

    });
