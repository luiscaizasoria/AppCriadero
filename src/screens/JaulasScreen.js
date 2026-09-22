import React, {
    useCallback,
    useState
} from 'react';

import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    ActivityIndicator
} from 'react-native';

import {
    useFocusEffect
} from '@react-navigation/native';

import Header from '../components/Header';
import JaulaCard from '../components/JaulaCard';

import {
    obtenerJaulas,
    obtenerJaulasInactivas
} from '../repositories/JaulaRepository';

import {
    COLORS
} from '../config/constants';


export default function JaulasScreen({
    navigation
}) {

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

        <View style={styles.container}>

            <ScrollView
                contentContainerStyle={
                    styles.content
                }
            >

                <Header
                    title="Jaulas"
                    subtitle="Administración de espacios del criadero"
                />


                <View style={styles.tabs}>

                    {
                        [
                            {
                                id:'ACTIVAS',
                                label:'🏠 Activas'
                            },
                            {
                                id:'INACTIVAS',
                                label:'📦 Inactivas'
                            }
                        ].map(item => (

                            <TouchableOpacity
                                key={item.id}
                                style={[
                                    styles.tab,
                                    tabActual === item.id &&
                                    styles.tabActive
                                ]}
                                onPress={() =>
                                    setTabActual(item.id)
                                }
                            >
                                <Text
                                    style={[
                                        styles.tabText,
                                        tabActual === item.id &&
                                        styles.tabTextActive
                                    ]}
                                >
                                    {item.label}
                                </Text>
                            </TouchableOpacity>

                        ))
                    }

                </View>


                {
                    tabActual === 'ACTIVAS'
                    &&
                    (
                        <TouchableOpacity
                            style={styles.newButton}
                            onPress={() =>
                                navigation.navigate(
                                    'NuevaJaula'
                                )
                            }
                        >

                            <Text
                                style={
                                    styles.newButtonText
                                }
                            >
                                ＋ Nueva jaula
                            </Text>

                        </TouchableOpacity>
                    )
                }


                {
                    loading
                        ? (
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
                                    Cargando jaulas...
                                </Text>

                            </View>
                        )
                        : null
                }


                {
                    !loading && error
                        ? (
                            <View
                                style={
                                    styles.messageCard
                                }
                            >

                                <Text
                                    style={
                                        styles.errorText
                                    }
                                >
                                    {error}
                                </Text>

                                <TouchableOpacity
                                    style={
                                        styles.retryButton
                                    }
                                    onPress={
                                        cargarJaulas
                                    }
                                >

                                    <Text
                                        style={
                                            styles.retryText
                                        }
                                    >
                                        Reintentar
                                    </Text>

                                </TouchableOpacity>

                            </View>
                        )
                        : null
                }


                {
                    !loading &&
                    !error &&
                    jaulas.length === 0
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
                                    {tabActual === 'ACTIVAS' ? '🏠' : '📦'}
                                </Text>

                                <Text
                                    style={
                                        styles.emptyTitle
                                    }
                                >
                                    {
                                        tabActual === 'ACTIVAS'
                                            ? 'No tienes jaulas registradas'
                                            : 'No tienes jaulas inactivas'
                                    }
                                </Text>

                                <Text
                                    style={
                                        styles.emptyText
                                    }
                                >
                                    {
                                        tabActual === 'ACTIVAS'
                                            ? 'Crea tu primera jaula para comenzar a organizar las aves del criadero.'
                                            : 'Las jaulas desactivadas aparecerán aquí y conservarán su historial.'
                                    }
                                </Text>

                            </View>
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
                                style={styles.cardWrapper}
                            >

                                {
                                    tabActual === 'INACTIVAS'
                                    &&
                                    (
                                        <View style={styles.inactiveBadge}>
                                            <Text style={styles.inactiveBadgeText}>
                                                Inactiva · Solo lectura
                                            </Text>
                                        </View>
                                    )
                                }

                                <JaulaCard
                                    jaula={jaula}
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

        </View>

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
            padding: 16,
            paddingBottom: 40
        },

        tabs:{
            flexDirection:'row',
            backgroundColor:COLORS.card,
            borderRadius:14,
            padding:4,
            marginBottom:16
        },

        tab:{
            flex:1,
            paddingVertical:10,
            alignItems:'center',
            borderRadius:11
        },

        tabActive:{
            backgroundColor:COLORS.primary
        },

        tabText:{
            color:COLORS.textSecondary,
            fontWeight:'600'
        },

        tabTextActive:{
            color:'#fff'
        },

        newButton: {
            backgroundColor:
                COLORS.primary,
            paddingVertical: 14,
            borderRadius: 14,
            alignItems: 'center',
            marginBottom: 18
        },

        newButtonText: {
            color: '#fff',
            fontSize: 17,
            fontWeight: 'bold'
        },

        center: {
            alignItems: 'center',
            marginTop: 40
        },

        loadingText: {
            color:
                COLORS.textSecondary,
            marginTop: 10
        },

        emptyCard: {
            backgroundColor:
                COLORS.card,
            borderRadius: 18,
            padding: 25,
            alignItems: 'center',
            elevation: 2
        },

        emptyIcon: {
            fontSize: 42
        },

        emptyTitle: {
            fontSize: 19,
            fontWeight: 'bold',
            color:
                COLORS.text,
            marginTop: 10
        },

        emptyText: {
            textAlign: 'center',
            color:
                COLORS.textSecondary,
            marginTop: 8,
            lineHeight: 20
        },

        messageCard: {
            backgroundColor:
                COLORS.card,
            padding: 20,
            borderRadius: 15
        },

        errorText: {
            color:
                COLORS.danger,
            textAlign: 'center'
        },

        retryButton: {
            marginTop: 15,
            alignSelf: 'center',
            backgroundColor:
                COLORS.primary,
            paddingHorizontal: 20,
            paddingVertical: 10,
            borderRadius: 10
        },

        retryText: {
            color: '#fff',
            fontWeight: 'bold'
        },

        cardWrapper:{
            position:'relative'
        },

        inactiveBadge:{
            alignSelf:'flex-start',
            backgroundColor:'#eceff1',
            borderRadius:12,
            paddingHorizontal:9,
            paddingVertical:4,
            marginBottom:5
        },

        inactiveBadgeText:{
            color:'#59636a',
            fontSize:12,
            fontWeight:'600'
        }

    });
