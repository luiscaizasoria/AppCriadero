import React from 'react';

import {
    View,
    Text,
    Image,
    StyleSheet
} from 'react-native';

import {
    colors,
    spacing,
    typography
} from '../theme';

import Tarjeta
    from './Tarjeta';

import Avatar
    from './Avatar';

import Chip
    from './Chip';

import Icono
    from './Icono';

import {
    visualSalud,
    visualSexo,
    visualEstadoAve,
    propsAvatar
} from './aveVisual';


// Tarjeta de una ave en la lista: avatar (foto o icono en círculo de color por sexo/estado),
// código y raza, chips de sexo / estado / salud (icono + texto), edad, jaula y padres.
// Memoizada: al escribir en el buscador de la lista solo se vuelven a dibujar las tarjetas cuyo `ave`
// cambió. `onAbrir(ave)` (estable) evita crear un `onPress` nuevo por tarjeta; `onPress` sigue admitido.
function AveCard({
    ave,
    onPress,
    onAbrir
}) {

    const alPulsar =
        onAbrir
            ? () => onAbrir(ave)
            : onPress;

    const edad =
        obtenerEdad(
            ave.fecha_nacimiento
        );

    const sexo =
        visualSexo(
            ave.sexo
        );

    const estadoVisual =
        visualEstadoAve(
            ave.estado
        );

    const salud =
        visualSalud(
            ave.estado_salud
        );


    return (

        <Tarjeta
            onPress={alPulsar}
            testID={`lista-ave-${ave.codigo}`}
            accessibilityLabel={
                `${ave.codigo}, ${ave.raza || 'Sin raza'}`
            }
        >

            <View style={styles.row}>

                {
                    ave.foto_uri
                        ? (
                            <Image
                                source={{
                                    uri: ave.foto_uri
                                }}
                                style={styles.photo}
                            />
                        )
                        : (
                            <Avatar
                                icono="paw-outline"
                                tamano={64}
                                {...propsAvatar(ave)}
                            />
                        )
                }

                <View style={styles.info}>

                    <Text
                        style={styles.code}
                        numberOfLines={1}
                    >
                        {ave.codigo}
                    </Text>

                    <Text
                        style={styles.raza}
                        numberOfLines={1}
                    >
                        {
                            ave.raza ||
                            'Sin raza'
                        }
                    </Text>

                </View>

                <Icono
                    nombre="siguiente"
                    tamano={22}
                    color={colors.textSecondary}
                />

            </View>


            <View style={styles.chips}>

                <Chip
                    texto={sexo.texto}
                    icono={sexo.icono}
                    tono="neutro"
                    style={styles.chip}
                />

                <Chip
                    texto={estadoVisual.texto}
                    icono={estadoVisual.icono}
                    tono={estadoVisual.tono}
                    style={styles.chip}
                />

                {
                    ave.estado === 'ACTIVA'
                        ? (
                            <Chip
                                texto={salud.texto}
                                icono={salud.icono}
                                tono={salud.tono}
                                style={styles.chip}
                            />
                        )
                        : null
                }

            </View>


            <View style={styles.dataGrid}>

                <View style={styles.dataItem}>

                    <Text style={styles.dataLabel}>
                        {
                            ave.origen === 'COMPRADA'
                                ? 'Edad aprox.'
                                : 'Edad'
                        }
                    </Text>

                    <Text style={styles.dataValue}>
                        {edad}
                    </Text>

                </View>

                <View style={styles.dataItem}>

                    <Text style={styles.dataLabel}>
                        Jaula
                    </Text>

                    <Text style={styles.dataValue}>
                        {
                            ave.jaula_codigo
                                ? ave.jaula_codigo
                                : 'Sin jaula'
                        }
                    </Text>

                </View>

            </View>


            <View style={styles.parentsRow}>

                <View style={styles.parent}>

                    <Icono
                        nombre="male-outline"
                        tamano={16}
                        color={colors.textSecondary}
                        style={styles.parentIcon}
                    />

                    <Text
                        style={styles.parentText}
                        numberOfLines={1}
                    >
                        Padre: {
                            ave.padre_codigo ||
                            'No registrado'
                        }
                    </Text>

                </View>

                <View style={styles.parent}>

                    <Icono
                        nombre="female-outline"
                        tamano={16}
                        color={colors.textSecondary}
                        style={styles.parentIcon}
                    />

                    <Text
                        style={styles.parentText}
                        numberOfLines={1}
                    >
                        Madre: {
                            ave.madre_codigo ||
                            'No registrado'
                        }
                    </Text>

                </View>

            </View>

        </Tarjeta>

    );

}


export default React.memo(AveCard);


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


const styles =
    StyleSheet.create({

        row: {
            flexDirection: 'row',
            alignItems: 'center'
        },

        photo: {
            width: 64,
            height: 64,
            borderRadius: 32,
            borderWidth: 3,
            borderColor: colors.white,
            backgroundColor: colors.primarySoft
        },

        info: {
            flex: 1,
            marginLeft: spacing.md,
            marginRight: spacing.sm
        },

        code: {
            ...typography.subtitulo,
            color: colors.text
        },

        raza: {
            ...typography.secundario,
            color: colors.textSecondary,
            marginTop: 2
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

        dataGrid: {
            flexDirection: 'row',
            marginTop: spacing.sm,
            borderTopWidth: 1,
            borderTopColor: colors.borderSoft,
            paddingTop: spacing.md
        },

        dataItem: {
            flex: 1
        },

        dataLabel: {
            ...typography.chip,
            color: colors.textSecondary
        },

        dataValue: {
            ...typography.etiqueta,
            marginTop: 2,
            color: colors.text
        },

        parentsRow: {
            flexDirection: 'row',
            marginTop: spacing.md
        },

        parent: {
            flex: 1,
            flexDirection: 'row',
            alignItems: 'center',
            marginRight: spacing.sm
        },

        parentIcon: {
            marginRight: spacing.xs
        },

        parentText: {
            ...typography.secundario,
            flex: 1,
            color: colors.textSecondary
        }

    });
