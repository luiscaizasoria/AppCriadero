import React from 'react';

import {
    View,
    Text,
    StyleSheet
} from 'react-native';

import {
    colors,
    spacing,
    typography
} from '../theme';

import Tarjeta from './Tarjeta';
import Chip from './Chip';
import Icono from './Icono';

import {
    estadoSanitarioJaula
} from './JaulaEstado';


// Tarjeta de jaula de la lista. La franja lateral CONSERVA el significado de V1: el estado sanitario
// (Normal, Limpieza, Fumigación, Quemadura, Cuarentena), repetido en un chip con icono + texto.
// «N aves» es el número real de aves (V1 no tiene capacidad de jaula).
export default function JaulaCard({
    jaula,
    onPress,
    testID
}) {

    const cantidadAves =
        Number(
            jaula.cantidad_aves
        ) || 0;


    const ocupada =
        cantidadAves > 0;


    const estado =
        estadoSanitarioJaula(
            jaula.estado_sanitario
        );


    return (

        <Tarjeta
            franja={estado.franja}
            onPress={onPress}
            testID={testID}
        >

            <View style={styles.header}>

                <Text
                    style={styles.codigo}
                    numberOfLines={1}
                >
                    {jaula.codigo}
                </Text>

                <Chip
                    texto={
                        ocupada
                            ? 'Ocupada'
                            : 'Vacía'
                    }
                    tono={
                        ocupada
                            ? 'primario'
                            : 'neutro'
                    }
                    icono={
                        ocupada
                            ? 'paw'
                            : 'ellipse-outline'
                    }
                />

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


            <Dato icono="paw-outline">
                {cantidadAves} {
                    cantidadAves === 1
                        ? 'ave'
                        : 'aves'
                }
            </Dato>


            {
                jaula.ubicacion
                ? (
                    <Dato icono="location-outline">
                        {jaula.ubicacion}
                    </Dato>
                )
                : null
            }


            {
                jaula.tipo
                ? (
                    <Dato icono="pricetag-outline">
                        {jaula.tipo}
                    </Dato>
                )
                : null
            }


            <View style={styles.sanitaryContainer}>

                <Text style={styles.sanitaryLabel}>
                    Estado sanitario
                </Text>

                <Chip
                    texto={estado.label}
                    tono={estado.tono}
                    icono={estado.icono}
                />

            </View>

        </Tarjeta>

    );

}


function Dato({
    icono,
    children
}) {

    return (

        <View style={styles.dato}>

            <Icono
                nombre={icono}
                tamano={18}
                color={colors.textSecondary}
                style={styles.datoIcono}
            />

            <Text style={styles.datoTexto}>
                {children}
            </Text>

        </View>

    );

}


const styles = StyleSheet.create({

    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center'
    },

    codigo: {
        ...typography.titulo,
        color: colors.text,
        flex: 1,
        marginRight: spacing.sm
    },

    nombre: {
        ...typography.cuerpoFuerte,
        color: colors.text,
        marginTop: spacing.xs
    },

    dato: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: spacing.sm
    },

    datoIcono: {
        marginRight: spacing.sm
    },

    datoTexto: {
        ...typography.secundario,
        color: colors.textSecondary,
        flex: 1
    },

    sanitaryContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginTop: spacing.md,
        paddingTop: spacing.md,
        borderTopWidth: 1,
        borderTopColor: colors.borderSoft
    },

    sanitaryLabel: {
        ...typography.secundario,
        color: colors.textSecondary
    }

});
