import React, {
    useCallback,
    useState
} from 'react';

import {
    View,
    Text,
    StyleSheet,
    ScrollView
} from 'react-native';

import {
    useFocusEffect
} from '@react-navigation/native';

import {
    useSafeAreaInsets
} from 'react-native-safe-area-context';

import FondoPantalla from '../components/FondoPantalla';
import PantallaHeader from '../components/PantallaHeader';
import BarraEstado from '../components/BarraEstado';
import Pulsable from '../components/Pulsable';
import Icono from '../components/Icono';
import Chip from '../components/Chip';
import Fab from '../components/Fab';
import EstadoCarga from '../components/EstadoCarga';
import EstadoError from '../components/EstadoError';
import EstadoVacio from '../components/EstadoVacio';
import JaulaCard from '../components/JaulaCard';

import {
    obtenerJaulas,
    obtenerJaulasInactivas
} from '../repositories/JaulaRepository';

import {
    colors,
    radii,
    spacing,
    typography
} from '../theme';


const FILTROS = [
    {
        id: 'ACTIVAS',
        label: 'Activas',
        icono: 'home-outline'
    },
    {
        id: 'INACTIVAS',
        label: 'Inactivas',
        icono: 'archive-outline'
    }
];


export default function JaulasScreen({
    navigation
}) {

    const insets =
        useSafeAreaInsets();

    const [jaulas, setJaulas] = useState([]);
    const [tabActual, setTabActual] = useState('ACTIVAS');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);


    const cargarJaulas = async () => {

        try {

            setLoading(true);
            setError(null);

            const resultado =
                tabActual === 'ACTIVAS'
                    ? await obtenerJaulas()
                    : await obtenerJaulasInactivas();

            setJaulas(resultado);

        }
        catch (err) {

            console.error(
                'Error cargando jaulas:',
                err
            );

            setError(
                'No se pudieron cargar las jaulas.'
            );

        }
        finally {

            setLoading(false);

        }

    };


    useFocusEffect(

        useCallback(() => {

            cargarJaulas();

        }, [tabActual])

    );


    return (

        <FondoPantalla>

            <BarraEstado
                estilo="light"
                navigation={navigation}
            />

            <PantallaHeader
                titulo="Jaulas"
                insetSuperior={insets.top}
                testID="jaulas-cabecera"
            />

            <ScrollView
                contentContainerStyle={
                    styles.content
                }
            >

                <View
                    style={styles.tabs}
                    accessibilityRole="tablist"
                >

                    {
                        FILTROS.map(item => {

                            const activo =
                                tabActual === item.id;

                            return (

                                <Pulsable
                                    key={item.id}
                                    testID={`filtro-jaulas-${item.id.toLowerCase()}`}
                                    accessibilityRole="tab"
                                    accessibilityState={{
                                        selected: activo
                                    }}
                                    onPress={() =>
                                        setTabActual(item.id)
                                    }
                                    sinMinimo
                                    style={[
                                        styles.tab,
                                        activo &&
                                        styles.tabActive
                                    ]}
                                >

                                    <Icono
                                        nombre={item.icono}
                                        tamano={20}
                                        color={
                                            activo
                                                ? colors.white
                                                : colors.primaryDark
                                        }
                                        style={styles.tabIcono}
                                    />

                                    <Text
                                        style={[
                                            styles.tabText,
                                            activo &&
                                            styles.tabTextActive
                                        ]}
                                    >
                                        {item.label}
                                    </Text>

                                </Pulsable>

                            );

                        })
                    }

                </View>


                {
                    loading
                        ? (
                            <EstadoCarga
                                mensaje="Cargando jaulas..."
                            />
                        )
                        : null
                }


                {
                    !loading && error
                        ? (
                            <EstadoError
                                mensaje={error}
                                onReintentar={
                                    cargarJaulas
                                }
                            />
                        )
                        : null
                }


                {
                    !loading &&
                    !error &&
                    jaulas.length === 0
                        ? (
                            <EstadoVacio
                                icono={
                                    tabActual === 'ACTIVAS'
                                        ? 'home-outline'
                                        : 'archive-outline'
                                }
                                titulo={
                                    tabActual === 'ACTIVAS'
                                        ? 'No tienes jaulas registradas'
                                        : 'No tienes jaulas inactivas'
                                }
                                mensaje={
                                    tabActual === 'ACTIVAS'
                                        ? 'Crea tu primera jaula para comenzar a organizar las aves del criadero.'
                                        : 'Las jaulas desactivadas aparecerán aquí y conservarán su historial.'
                                }
                                testID="jaulas-vacio"
                            />
                        )
                        : null
                }


                {
                    !loading &&
                    !error &&
                    jaulas.map(
                        (jaula) => (

                            <View
                                key={jaula.id}
                            >

                                {
                                    tabActual === 'INACTIVAS'
                                    &&
                                    (
                                        <Chip
                                            texto="Inactiva · Solo lectura"
                                            tono="neutro"
                                            icono="lock-closed-outline"
                                            style={styles.inactiveBadge}
                                        />
                                    )
                                }

                                <JaulaCard
                                    jaula={jaula}
                                    testID={`lista-jaula-${jaula.codigo}`}
                                    onPress={() =>
                                        navigation.navigate(
                                            tabActual === 'ACTIVAS'
                                                ? 'DetalleJaula'
                                                : 'DetalleJaulaInactiva',
                                            {
                                                jaulaId:
                                                    jaula.id
                                            }
                                        )
                                    }
                                />

                            </View>

                        )
                    )
                }

            </ScrollView>


            {
                tabActual === 'ACTIVAS'
                &&
                (
                    <Fab
                        titulo="Nueva jaula"
                        icono="add"
                        testID="fab-nueva-jaula"
                        onPress={() =>
                            navigation.navigate(
                                'NuevaJaula'
                            )
                        }
                    />
                )
            }

        </FondoPantalla>

    );

}


const styles =
    StyleSheet.create({

        content: {
            padding: spacing.pantalla,
            paddingBottom: 112
        },

        tabs: {
            flexDirection: 'row',
            backgroundColor: colors.surface,
            borderRadius: radii.md,
            borderWidth: 1,
            borderColor: colors.borderSoft,
            padding: 4,
            marginBottom: spacing.lg
        },

        tab: {
            flex: 1,
            minHeight: spacing.touchMin,
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
            borderRadius: radii.sm
        },

        tabActive: {
            backgroundColor: colors.primary
        },

        tabIcono: {
            marginRight: spacing.xs
        },

        tabText: {
            ...typography.etiqueta,
            color: colors.primaryDark
        },

        tabTextActive: {
            color: colors.white
        },

        inactiveBadge: {
            marginBottom: spacing.xs
        }

    });
