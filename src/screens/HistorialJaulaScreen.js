import React, {
    useCallback,
    useState
} from 'react';

import {
    ScrollView,
    Text,
    View,
    StyleSheet
} from 'react-native';

import {
    useFocusEffect
} from '@react-navigation/native';

import {
    obtenerHistorialJaula
} from '../repositories/HistorialRepository';

import {
    COLORS
} from '../config/constants';


export default function HistorialJaulaScreen({
    route
}) {

    const { jaulaId } =
        route.params;

    const [historial, setHistorial] =
        useState([]);


    useFocusEffect(

        useCallback(() => {

            cargar();

        }, [jaulaId])

    );


    const cargar = async () => {

        const data =
            await obtenerHistorialJaula(
                jaulaId
            );

        setHistorial(data);

    };


    return (

        <ScrollView
            style={styles.container}
            contentContainerStyle={styles.content}
        >

            <Text style={styles.title}>
                📖 Historial
            </Text>


            {
                historial.length === 0
                    ? (
                        <Text style={styles.empty}>
                            La jaula todavía no tiene eventos registrados.
                        </Text>
                    )
                    : historial.map(
                        item => (

                            <View
                                key={item.id}
                                style={styles.event}
                            >

                                <Text style={styles.type}>
                                    {item.tipo_evento}
                                </Text>

                                <Text style={styles.date}>
                                    {
                                        new Date(
                                            item.fecha
                                        ).toLocaleString()
                                    }
                                </Text>

                                <Text style={styles.detail}>
                                    {item.detalle}
                                </Text>

                            </View>

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
            padding: 20
        },

        title: {
            fontSize: 26,
            fontWeight: 'bold',
            color:
                COLORS.primary,
            marginBottom: 20
        },

        event: {
            backgroundColor:
                COLORS.card,
            borderRadius: 14,
            padding: 15,
            marginBottom: 12,
            borderLeftWidth: 4,
            borderLeftColor:
                COLORS.primary
        },

        type: {
            fontWeight: 'bold',
            fontSize: 16
        },

        date: {
            color:
                COLORS.textSecondary,
            fontSize: 12,
            marginVertical: 5
        },

        detail: {
            color:
                COLORS.text
        },

        empty: {
            color:
                COLORS.textSecondary,
            textAlign: 'center',
            marginTop: 40
        }

    });