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
    colors,
    spacing,
    typography
} from '../theme';

import FondoPantalla from '../components/FondoPantalla';
import Tarjeta from '../components/Tarjeta';
import IconoCirculo from '../components/IconoCirculo';
import EstadoCarga from '../components/EstadoCarga';
import EstadoError from '../components/EstadoError';
import EstadoVacio from '../components/EstadoVacio';


// Presentación del tipo de evento (el dato no cambia): texto legible, icono y color de círculo.
const EVENTOS = {
    ALIMENTACION: { texto: 'Alimentación', icono: 'alimentacion', indice: 1 },
    BEBIDA: { texto: 'Bebida', icono: 'bebida', indice: 2 },
    SANIDAD: { texto: 'Sanidad', icono: 'sanidad', indice: 4 },
    INGRESO_AVE: { texto: 'Ingreso de ave', icono: 'enter-outline', indice: 1 },
    SALIDA_AVE: { texto: 'Salida de ave', icono: 'exit-outline', indice: 3 }
};


export default function HistorialJaulaScreen({
    route
}) {

    const { jaulaId } =
        route.params;

    const [historial, setHistorial] =
        useState([]);

    const [cargando, setCargando] =
        useState(true);

    const [error, setError] =
        useState(false);


    useFocusEffect(

        useCallback(() => {

            cargar();

        }, [jaulaId])

    );


    const cargar = async () => {

        try {

            setError(false);

            const data =
                await obtenerHistorialJaula(
                    jaulaId
                );

            setHistorial(data);

        }
        catch (err) {

            console.error(
                'Error cargando historial de jaula:',
                err
            );

            setError(true);

        }
        finally {

            setCargando(false);

        }

    };


    return (

        <FondoPantalla>

        <ScrollView
            style={styles.container}
            contentContainerStyle={styles.content}
        >

            {
                cargando
                    ? (
                        <EstadoCarga
                            mensaje="Cargando historial..."
                        />
                    )
                    : null
            }


            {
                !cargando && error
                    ? (
                        <EstadoError
                            mensaje="No se pudo cargar el historial de la jaula."
                            onReintentar={() => {
                                setCargando(true);
                                cargar();
                            }}
                        />
                    )
                    : null
            }


            {
                !cargando && !error && historial.length === 0
                    ? (
                        <EstadoVacio
                            icono="historial"
                            titulo="La jaula todavía no tiene eventos registrados."
                            testID="historial-vacio"
                        />
                    )
                    : null
            }


            {
                !cargando && !error &&
                historial.map(
                    item => {

                        const evento =
                            EVENTOS[item.tipo_evento];

                        return (

                            <Tarjeta
                                key={item.id}
                            >

                                <View style={styles.fila}>

                                    <IconoCirculo
                                        icono={
                                            evento
                                                ? evento.icono
                                                : 'historial'
                                        }
                                        indice={
                                            evento
                                                ? evento.indice
                                                : 0
                                        }
                                        tamano={44}
                                        style={styles.icono}
                                    />

                                    <View style={styles.info}>

                                        <Text style={styles.type}>
                                            {
                                                evento
                                                    ? evento.texto
                                                    : item.tipo_evento
                                            }
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

                                </View>

                            </Tarjeta>

                        );

                    }
                )
            }

        </ScrollView>

        </FondoPantalla>

    );

}


const styles =
    StyleSheet.create({

        container: {
            flex: 1
        },

        content: {
            padding: spacing.pantalla,
            paddingBottom: spacing.xxl
        },

        fila: {
            flexDirection: 'row',
            alignItems: 'flex-start'
        },

        icono: {
            marginRight: spacing.md
        },

        info: {
            flex: 1
        },

        type: {
            ...typography.subtitulo,
            color: colors.text
        },

        date: {
            ...typography.secundario,
            color: colors.textSecondary,
            marginVertical: 2
        },

        detail: {
            ...typography.cuerpo,
            color: colors.text
        }

    });
