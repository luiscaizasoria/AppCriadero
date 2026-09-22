import React from 'react';

import {
    View,
    Text,
    TouchableOpacity,
    StyleSheet
} from 'react-native';

import {
    COLORS,
    getJaulaSanitaryStatusStyle
} from '../config/constants';


export default function JaulaCard({
    jaula,
    onPress
}) {

    const cantidadAves =
        Number(
            jaula.cantidad_aves
        ) || 0;


    const ocupada =
        cantidadAves > 0;


    const sanitaryStyle =
        getJaulaSanitaryStatusStyle(
            jaula.estado_sanitario
        );


    return (

        <TouchableOpacity
            style={[
                styles.card,
                {
                    borderLeftColor:
                        sanitaryStyle.borderColor
                }
            ]}
            onPress={onPress}
            activeOpacity={0.8}
        >

            <View style={styles.header}>


                <Text style={styles.codigo}>
                    🏠 {jaula.codigo}
                </Text>


                <View
                    style={[
                        styles.occupancyBadge,
                        {
                            backgroundColor:
                                ocupada
                                    ? COLORS.primary
                                    : COLORS.textSecondary
                        }
                    ]}
                >

                    <Text
                        style={
                            styles.occupancyText
                        }
                    >

                        {
                            ocupada
                                ? 'Ocupada'
                                : 'Vacía'
                        }

                    </Text>

                </View>


            </View>


            {
                jaula.nombre
                ? (
                    <Text style={styles.nombre}>
                        {jaula.nombre}
                    </Text>
                )
                : null
            }


            <Text style={styles.info}>
                🐔 {cantidadAves} {
                    cantidadAves === 1
                        ? 'ave'
                        : 'aves'
                }
            </Text>


            {
                jaula.ubicacion
                ? (
                    <Text style={styles.info}>
                        📍 {jaula.ubicacion}
                    </Text>
                )
                : null
            }


            {
                jaula.tipo
                ? (
                    <Text style={styles.info}>
                        🏷️ {jaula.tipo}
                    </Text>
                )
                : null
            }


            <View style={styles.sanitaryContainer}>

                <Text
                    style={
                        styles.sanitaryLabel
                    }
                >
                    Estado sanitario
                </Text>


                <View
                    style={[
                        styles.sanitaryBadge,
                        {
                            backgroundColor:
                                sanitaryStyle
                                    .backgroundColor
                        }
                    ]}
                >

                    <Text
                        style={[
                            styles.sanitaryText,
                            {
                                color:
                                    sanitaryStyle
                                        .textColor
                            }
                        ]}
                    >
                        {
                            sanitaryStyle.label
                        }
                    </Text>

                </View>

            </View>


        </TouchableOpacity>

    );

}


const styles = StyleSheet.create({

    card: {

        backgroundColor:
            COLORS.card,

        borderRadius: 16,

        padding: 16,

        marginBottom: 12,

        borderLeftWidth: 6,

        elevation: 3

    },


    header: {

        flexDirection: 'row',

        justifyContent:
            'space-between',

        alignItems:
            'center'

    },


    codigo: {

        fontSize: 20,

        fontWeight: 'bold',

        color:
            COLORS.text

    },


    nombre: {

        fontSize: 16,

        marginTop: 8,

        color:
            COLORS.text

    },


    info: {

        fontSize: 15,

        color:
            COLORS.textSecondary,

        marginTop: 6

    },


    occupancyBadge: {

        paddingHorizontal: 10,

        paddingVertical: 5,

        borderRadius: 15

    },


    occupancyText: {

        color:
            COLORS.white,

        fontWeight: 'bold',

        fontSize: 12

    },


    sanitaryContainer: {

        flexDirection: 'row',

        justifyContent:
            'space-between',

        alignItems:
            'center',

        marginTop: 14,

        paddingTop: 12,

        borderTopWidth: 1,

        borderTopColor:
            COLORS.border

    },


    sanitaryLabel: {

        fontSize: 13,

        color:
            COLORS.textSecondary

    },


    sanitaryBadge: {

        paddingHorizontal: 12,

        paddingVertical: 6,

        borderRadius: 15

    },


    sanitaryText: {

        fontWeight: 'bold',

        fontSize: 12

    }

});