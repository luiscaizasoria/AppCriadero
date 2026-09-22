import React from 'react';

import {
    View,
    Text,
    Image,
    TouchableOpacity,
    StyleSheet
} from 'react-native';

import {
    COLORS
} from '../config/constants';


export default function AveCard({
    ave,
    onPress
}) {

    const edad =
        obtenerEdad(
            ave.fecha_nacimiento
        );


    const textoSexo =
        obtenerTextoSexo(
            ave.sexo
        );


    const estadoVisual =
        obtenerEstadoVisual(
            ave.estado
        );


    return (

        <TouchableOpacity
            style={
                styles.card
            }
            onPress={
                onPress
            }
            activeOpacity={
                0.8
            }
        >

            <View
                style={
                    styles.row
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
                                    styles.photo
                                }
                            />

                        )
                        : (

                            <View
                                style={
                                    styles.photoEmpty
                                }
                            >

                                <Text
                                    style={
                                        styles.photoEmptyIcon
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
                            styles.code
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
                            ave.raza ||
                            'Sin raza'
                        }
                    </Text>

                </View>


                <View
                    style={
                        styles.badges
                    }
                >

                    <View
                        style={
                            styles.sexBadge
                        }
                    >

                        <Text
                            style={
                                styles.sexText
                            }
                        >
                            {textoSexo}
                        </Text>

                    </View>


                    <View
                        style={[
                            styles.stateBadge,
                            {
                                backgroundColor:
                                    estadoVisual.backgroundColor
                            }
                        ]}
                    >

                        <Text
                            style={[
                                styles.stateText,
                                {
                                    color:
                                        estadoVisual.textColor
                                }
                            ]}
                        >
                            {estadoVisual.texto}
                        </Text>

                    </View>

                </View>

            </View>


            <View
                style={
                    styles.dataGrid
                }
            >

                <View
                    style={
                        styles.dataItem
                    }
                >

                    <Text
                        style={
                            styles.dataLabel
                        }
                    >
                        {
                            ave.origen === 'COMPRADA'
                                ? 'Edad aprox.'
                                : 'Edad'
                        }
                    </Text>

                    <Text
                        style={
                            styles.dataValue
                        }
                    >
                        {edad}
                    </Text>

                </View>


                <View
                    style={
                        styles.dataItem
                    }
                >

                    <Text
                        style={
                            styles.dataLabel
                        }
                    >
                        Jaula
                    </Text>

                    <Text
                        style={
                            styles.dataValue
                        }
                    >
                        {
                            ave.jaula_codigo
                                ? ave.jaula_codigo
                                : 'Sin jaula'
                        }
                    </Text>

                </View>

            </View>


            <View
                style={
                    styles.parentsRow
                }
            >

                <Text
                    style={
                        styles.parentText
                    }
                    numberOfLines={1}
                >
                    🐓 Padre: {
                        ave.padre_codigo ||
                        'No registrado'
                    }
                </Text>


                <Text
                    style={
                        styles.parentText
                    }
                    numberOfLines={1}
                >
                    🐔 Madre: {
                        ave.madre_codigo ||
                        'No registrado'
                    }
                </Text>

            </View>


            {
                ave.estado === 'ACTIVA'
                    ? (

                        <View
                            style={[
                                styles.health,
                                {
                                    backgroundColor:
                                        getColorSalud(
                                            ave.estado_salud
                                        )
                                }
                            ]}
                        >

                            <Text
                                style={
                                    styles.healthText
                                }
                            >
                                {
                                    getTextSalud(
                                        ave.estado_salud
                                    )
                                }
                            </Text>

                        </View>

                    )
                    : null
            }

        </TouchableOpacity>

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


    return 'Sexo sin registrar';

}


function obtenerEstadoVisual(
    estado
) {

    if (
        estado === 'VENDIDA'
    ) {

        return {
            texto: 'Vendida',
            backgroundColor: '#d9f2e4',
            textColor: '#1f6f46'
        };

    }


    if (
        estado === 'FALLECIDA'
    ) {

        return {
            texto: 'Fallecida',
            backgroundColor: '#ececec',
            textColor: '#555555'
        };

    }


    return {
        texto: 'Activa',
        backgroundColor: '#d9f2e4',
        textColor: '#1f6f46'
    };

}


function obtenerEdad(
    fechaNacimiento
) {

    if (!fechaNacimiento) {

        return 'No registrada';

    }


    const partes =
        String(
            fechaNacimiento
        )
            .substring(0, 10)
            .split('-')
            .map(
                Number
            );


    if (
        partes.length !== 3
        ||
        partes.some(
            valor =>
                !Number.isFinite(
                    valor
                )
        )
    ) {

        return 'No registrada';

    }


    const [
        anio,
        mes,
        dia
    ] = partes;


    const nacimiento =
        new Date(
            anio,
            mes - 1,
            dia
        );


    const hoy =
        new Date();


    if (
        nacimiento > hoy
    ) {

        return 'Fecha inválida';

    }


    let anios =
        hoy.getFullYear()
        -
        nacimiento.getFullYear();


    let meses =
        hoy.getMonth()
        -
        nacimiento.getMonth();


    let dias =
        hoy.getDate()
        -
        nacimiento.getDate();


    if (
        dias < 0
    ) {

        meses -= 1;


        const ultimoDiaMesAnterior =
            new Date(
                hoy.getFullYear(),
                hoy.getMonth(),
                0
            )
                .getDate();


        dias +=
            ultimoDiaMesAnterior;

    }


    if (
        meses < 0
    ) {

        anios -= 1;
        meses += 12;

    }


    if (
        anios > 0
    ) {

        const textoAnios =
            `${anios} ${anios === 1 ? 'año' : 'años'}`;


        if (
            meses > 0
        ) {

            return `${textoAnios} ${meses} ${meses === 1 ? 'mes' : 'meses'}`;

        }


        return textoAnios;

    }


    if (
        meses > 0
    ) {

        return `${meses} ${meses === 1 ? 'mes' : 'meses'}`;

    }


    return `${Math.max(dias, 0)} ${dias === 1 ? 'día' : 'días'}`;

}


function getColorSalud(
    estado
) {

    if (
        estado === 'EN_TRATAMIENTO'
    ) {

        return '#fff0b3';

    }


    if (
        estado === 'ENFERMA'
    ) {

        return '#f7d7d7';

    }


    return '#d9f2e4';

}


function getTextSalud(
    estado
) {

    if (
        estado === 'EN_TRATAMIENTO'
    ) {

        return '🟡 En tratamiento';

    }


    if (
        estado === 'ENFERMA'
    ) {

        return '🔴 Enferma';

    }


    return '🟢 Sana';

}


const styles =
    StyleSheet.create({

        card: {

            backgroundColor:
                COLORS.card,

            borderRadius: 16,

            padding: 15,

            marginBottom: 12,

            elevation: 3

        },


        row: {

            flexDirection: 'row',

            alignItems: 'center'

        },


        photo: {

            width: 64,

            height: 64,

            borderRadius: 32

        },


        photoEmpty: {

            width: 64,

            height: 64,

            borderRadius: 32,

            backgroundColor: '#e7f5f5',

            alignItems: 'center',

            justifyContent: 'center'

        },


        photoEmptyIcon: {

            fontSize: 28

        },


        info: {

            flex: 1,

            marginLeft: 12,

            marginRight: 8

        },


        code: {

            fontSize: 20,

            fontWeight: 'bold',

            color:
                COLORS.text

        },


        raza: {

            marginTop: 3,

            color:
                COLORS.textSecondary,

            fontSize: 14

        },


        badges: {

            alignItems: 'flex-end'

        },


        sexBadge: {

            backgroundColor: '#e7f5f5',

            paddingHorizontal: 9,

            paddingVertical: 5,

            borderRadius: 12,

            maxWidth: 125

        },


        sexText: {

            color:
                COLORS.text,

            fontSize: 11,

            fontWeight: '700'

        },


        stateBadge: {

            marginTop: 6,

            paddingHorizontal: 9,

            paddingVertical: 4,

            borderRadius: 12

        },


        stateText: {

            fontWeight: '700',

            fontSize: 11

        },


        dataGrid: {

            flexDirection: 'row',

            marginTop: 13,

            borderTopWidth: 1,

            borderTopColor:
                COLORS.border,

            paddingTop: 11

        },


        dataItem: {

            flex: 1

        },


        dataLabel: {

            color:
                COLORS.textSecondary,

            fontSize: 11

        },


        dataValue: {

            marginTop: 2,

            color:
                COLORS.text,

            fontSize: 14,

            fontWeight: '600'

        },


        parentsRow: {

            flexDirection: 'row',

            marginTop: 10

        },


        parentText: {

            flex: 1,

            color:
                COLORS.textSecondary,

            fontSize: 12,

            marginRight: 6

        },


        health: {

            marginTop: 10,

            alignSelf: 'flex-start',

            paddingHorizontal: 10,

            paddingVertical: 5,

            borderRadius: 13

        },


        healthText: {

            color: '#000000',

            fontWeight: '700',

            fontSize: 12

        }

    });
