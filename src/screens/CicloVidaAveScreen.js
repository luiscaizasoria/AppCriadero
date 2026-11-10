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
    obtenerAvePorId
} from '../repositories/AveRepository';

import {
    obtenerCicloVidaAve
} from '../repositories/CicloVidaRepository';

import FondoPantalla
    from '../components/FondoPantalla';

import Tarjeta
    from '../components/Tarjeta';

import TituloSeccion
    from '../components/TituloSeccion';

import IconoCirculo
    from '../components/IconoCirculo';

import Avatar
    from '../components/Avatar';

import Chip
    from '../components/Chip';

import Icono
    from '../components/Icono';

import EstadoCarga
    from '../components/EstadoCarga';

import EstadoError
    from '../components/EstadoError';

import EstadoVacio
    from '../components/EstadoVacio';

import {
    visualEstadoAve,
    visualSexo,
    propsAvatar
} from '../components/aveVisual';

import {
    colors,
    radii,
    spacing,
    typography
} from '../theme';


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

            <FondoPantalla>

                <View
                    style={
                        styles.center
                    }
                >

                    <EstadoCarga
                        mensaje="Cargando ciclo de vida..."
                    />

                </View>

            </FondoPantalla>

        );

    }


    if (
        error
        ||
        !ave
    ) {

        return (

            <FondoPantalla>

                <View
                    style={
                        styles.center
                    }
                >

                    {
                        error
                            ? (

                                <EstadoError
                                    titulo={
                                        error
                                    }
                                    onReintentar={
                                        cargar
                                    }
                                />

                            )
                            : (

                                <EstadoVacio
                                    titulo="Ave no encontrada."
                                />

                            )
                    }

                </View>

            </FondoPantalla>

        );

    }


    const sexo =
        visualSexo(
            ave.sexo
        );


    const estado =
        visualEstadoAve(
            ave.estado
        );


    return (

        <FondoPantalla>

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
                    styles.subtitle
                }
            >
                Historia completa y cronológica de {ave.codigo}
            </Text>


            <Tarjeta
                testID="ciclo-ave"
            >

                <View
                    style={
                        styles.birdRow
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

                                <Avatar
                                    icono="paw-outline"
                                    tamano={68}
                                    {...propsAvatar(ave)}
                                />

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

                    </View>

                </View>


                <View
                    style={
                        styles.chips
                    }
                >

                    <Chip
                        texto={
                            ave.sexo === 'MACHO' || ave.sexo === 'HEMBRA'
                                ? sexo.texto
                                : 'Sexo no registrado'
                        }
                        icono={
                            sexo.icono
                        }
                        style={
                            styles.chip
                        }
                    />

                    <Chip
                        texto={
                            estado.texto
                        }
                        tono={
                            estado.tono
                        }
                        icono={
                            estado.icono
                        }
                        style={
                            styles.chip
                        }
                    />

                </View>

            </Tarjeta>


            <TituloSeccion
                icono="cicloVida"
                indice={1}
            >
                Línea de tiempo
            </TituloSeccion>


            {
                eventos.length === 0
                    ? (

                        <Tarjeta>

                            <EstadoVacio
                                titulo="Sin eventos todavía"
                                mensaje="Los cambios del ave aparecerán aquí a medida que se registren."
                            />

                        </Tarjeta>

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

                                        <IconoCirculo
                                            icono={
                                                visual.icono
                                            }
                                            color={
                                                visual.color
                                            }
                                            colorIcono={
                                                visual.colorIcono
                                            }
                                            tamano={40}
                                            style={
                                                styles.timelineDot
                                            }
                                        />


                                        {
                                            !esUltimo
                                                ? (

                                                    <View
                                                        style={
                                                            styles.timelineLine
                                                        }
                                                    />

                                                )
                                                : null
                                        }

                                    </View>


                                    <Tarjeta
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

                                                    <View
                                                        style={
                                                            styles.eventMetaRow
                                                        }
                                                    >

                                                        <Icono
                                                            nombre="grid-outline"
                                                            tamano={16}
                                                            color={
                                                                colors.textSecondary
                                                            }
                                                            style={
                                                                styles.eventMetaIcono
                                                            }
                                                        />

                                                        <Text
                                                            style={
                                                                styles.eventMeta
                                                            }
                                                        >
                                                            Jaula {evento.jaulaCodigo}
                                                        </Text>

                                                    </View>

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

                                    </Tarjeta>

                                </View>

                            );

                        }
                    )
            }

        </ScrollView>

        </FondoPantalla>

    );

}


// Presentación del evento: icono de Ionicons y color del círculo (icono blanco, o texto oscuro
// sobre turquesa claro). Solo cambia el aspecto; el título y el detalle vienen del repositorio.
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
                icono: 'sparkles-outline',
                color: colors.turquesa,
                colorIcono: colors.text
            };


        case 'LLEGADA':

            return {
                icono: 'home-outline',
                color: colors.primary
            };


        case 'ALTA':

            return {
                icono: 'document-text-outline',
                color: colors.info
            };


        case 'DATOS_ACTUALIZADOS':

            return {
                icono: 'create-outline',
                color: colors.textSecondary
            };


        case 'EVOLUCION':

            return {
                icono: 'camera-outline',
                color: colors.secondary
            };


        case 'CAMBIO_JAULA':

            return {
                icono: 'grid-outline',
                color: colors.primaryDark
            };


        case 'SALUD':

            return {
                icono: 'medkit-outline',
                color: colors.danger
            };


        case 'RECUPERACION':

            return {
                icono: 'checkmark-circle-outline',
                color: colors.success
            };


        case 'POSTURA_HUEVO':

            return {
                icono: 'egg-outline',
                color: colors.warningSolid
            };


        case 'VENTA':

            return {
                icono: 'cart-outline',
                color: colors.turquesaProfundo
            };


        case 'MUERTE':

            return {
                icono: 'skull-outline',
                color: colors.text
            };


        default:

            return {
                icono: 'ellipse',
                color: colors.primary
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

            flex: 1

        },


        content: {

            padding: spacing.pantalla,

            paddingBottom: 50

        },


        center: {

            flex: 1,

            justifyContent: 'center',

            alignItems: 'center',

            padding: spacing.xl

        },


        subtitle: {

            ...typography.cuerpo,

            color:
                colors.textSecondary,

            marginBottom: spacing.lg

        },


        birdRow: {

            flexDirection: 'row',

            alignItems: 'center'

        },


        birdPhoto: {

            width: 68,

            height: 68,

            borderRadius: 34,

            borderWidth: 3,

            borderColor:
                colors.white,

            backgroundColor:
                colors.primarySoft

        },


        birdInfo: {

            flex: 1,

            marginLeft: spacing.md

        },


        birdCode: {

            ...typography.titulo,

            color:
                colors.text

        },


        birdRaza: {

            ...typography.secundario,

            color:
                colors.textSecondary

        },


        chips: {

            flexDirection: 'row',

            flexWrap: 'wrap',

            marginTop: spacing.md

        },


        chip: {

            marginRight: spacing.sm,

            marginBottom: spacing.xs

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

            zIndex: 2

        },


        timelineLine: {

            width: 3,

            flex: 1,

            minHeight: 24,

            marginTop: 2,

            marginBottom: 2,

            borderRadius: 2,

            backgroundColor:
                colors.borderSoft

        },


        eventCard: {

            flex: 1,

            marginLeft: spacing.xs,

            padding: spacing.md

        },


        eventDate: {

            ...typography.chip,

            color:
                colors.textSecondary,

            marginBottom: 4

        },


        eventTitle: {

            ...typography.subtitulo,

            color:
                colors.text

        },


        eventDetail: {

            ...typography.cuerpo,

            marginTop: 6,

            color:
                colors.textSecondary

        },


        eventMetaRow: {

            flexDirection: 'row',

            alignItems: 'center',

            marginTop: spacing.sm

        },


        eventMetaIcono: {

            marginRight: spacing.xs

        },


        eventMeta: {

            ...typography.etiqueta,

            color:
                colors.text

        },


        characteristicsBox: {

            marginTop: spacing.sm,

            padding: spacing.sm,

            borderRadius: radii.sm,

            backgroundColor:
                colors.surfaceAlt

        },


        characteristicsLabel: {

            ...typography.chip,

            color:
                colors.textSecondary

        },


        characteristicsText: {

            ...typography.cuerpo,

            marginTop: 3,

            color:
                colors.text

        },


        eventPhoto: {

            marginTop: spacing.sm,

            width: 125,

            height: 125,

            borderRadius: radii.sm,

            backgroundColor:
                colors.surfaceAlt

        }

    });
