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
    ActivityIndicator,
    Alert
} from 'react-native';

import {
    useFocusEffect
} from '@react-navigation/native';

import {
    obtenerAvesParaAsignarJaula,
    cambiarJaulaAve
} from '../repositories/AveRepository';

import FondoPantalla
    from '../components/FondoPantalla';

import Tarjeta
    from '../components/Tarjeta';

import Avatar
    from '../components/Avatar';

import Chip
    from '../components/Chip';

import Icono
    from '../components/Icono';

import Aviso
    from '../components/Aviso';

import useAvisoExito
    from '../components/useAvisoExito';

import EstadoCarga
    from '../components/EstadoCarga';

import EstadoError
    from '../components/EstadoError';

import EstadoVacio
    from '../components/EstadoVacio';

import {
    propsAvatar
} from '../components/aveVisual';

import {
    colors,
    spacing,
    typography
} from '../theme';


export default function SeleccionarAveJaulaScreen({
    route,
    navigation
}) {

    const {
        jaulaId,
        jaulaCodigo
    } = route.params;


    const [
        aves,
        setAves
    ] = useState([]);


    const [
        loading,
        setLoading
    ] = useState(true);


    const [
        errorCarga,
        setErrorCarga
    ] = useState(false);


    const [
        procesandoId,
        setProcesandoId
    ] = useState(null);


    const {
        aviso,
        mostrar: mostrarAviso,
        cerrar: cerrarAviso,
        saliendo
    } = useAvisoExito();


    const cargar =
        async () => {

            try {

                setLoading(
                    true
                );

                setErrorCarga(
                    false
                );


                const data =
                    await obtenerAvesParaAsignarJaula(
                        jaulaId
                    );


                setAves(
                    data
                );

            }
            catch (error) {

                console.error(
                    'Error cargando aves disponibles:',
                    error
                );


                setErrorCarga(
                    true
                );


                Alert.alert(
                    'Error',
                    'No fue posible cargar las aves disponibles.'
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
            [jaulaId]
        )

    );


    const confirmarAsignacion =
        ave => {

            if (
                procesandoId !== null
                ||
                saliendo
            ) {

                return;

            }


            const mensaje =
                ave.jaula_actual_id
                    ? `El ave ${ave.codigo} actualmente pertenece a la jaula ${ave.jaula_codigo}. ¿Deseas moverla a ${jaulaCodigo}?`
                    : `¿Deseas agregar el ave ${ave.codigo} a la jaula ${jaulaCodigo}?`;


            Alert.alert(

                'Asignar ave',

                mensaje,

                [
                    {
                        text:
                            'Cancelar',

                        style:
                            'cancel'
                    },

                    {
                        text:
                            ave.jaula_actual_id
                                ? 'Mover'
                                : 'Agregar',

                        onPress: () =>
                            asignarAve(
                                ave
                            )
                    }
                ]

            );

        };


    const asignarAve =
        async ave => {

            try {

                setProcesandoId(
                    ave.id
                );


                await cambiarJaulaAve({

                    aveId:
                        ave.id,

                    jaulaAnteriorId:
                        ave.jaula_actual_id
                        ||
                        null,

                    nuevaJaulaId:
                        jaulaId,

                    codigoAve:
                        ave.codigo

                });


                // Antes: Alert con «Aceptar» que hacía goBack. Ahora: aviso y vuelve solo.
                mostrarAviso(

                    'Ave asignada',

                    `El ave ${ave.codigo} ahora pertenece a la jaula ${jaulaCodigo}.`,

                    () =>
                        navigation.goBack()

                );

            }
            catch (error) {

                console.error(
                    'Error asignando ave:',
                    error
                );


                Alert.alert(
                    'Error',
                    'No fue posible asignar el ave a la jaula.'
                );

            }
            finally {

                setProcesandoId(
                    null
                );

            }

        };


    const avisoExito = aviso
        ? (
            <Aviso
                flotante
                tono="exito"
                duracion={0}
                titulo={aviso.titulo}
                mensaje={aviso.mensaje}
                onCerrar={cerrarAviso}
            />
        )
        : null;


    if (loading) {

        return (

            <FondoPantalla>

                <View
                    style={
                        styles.center
                    }
                >

                    <EstadoCarga
                        mensaje="Buscando aves..."
                    />

                </View>

                {avisoExito}

            </FondoPantalla>

        );

    }


    if (errorCarga) {

        return (

            <FondoPantalla>

                <View
                    style={
                        styles.center
                    }
                >

                    <EstadoError
                        titulo="No fue posible cargar las aves disponibles."
                        onReintentar={
                            cargar
                        }
                    />

                </View>

                {avisoExito}

            </FondoPantalla>

        );

    }


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
                Selecciona un ave para asignarla a la jaula {jaulaCodigo}.
            </Text>


            {
                aves.length === 0
                    ? (

                        <Tarjeta>

                            <EstadoVacio
                                titulo="No hay aves disponibles"
                                mensaje="Todas las aves activas ya pertenecen a esta jaula o no existen más aves registradas."
                            />

                        </Tarjeta>

                    )
                    : aves.map(
                        ave => (

                            <Tarjeta
                                key={
                                    ave.id
                                }
                                testID={
                                    `asignar-ave-${ave.codigo}`
                                }
                                onPress={() =>
                                    confirmarAsignacion(
                                        ave
                                    )
                                }
                            >

                                <View
                                    style={
                                        styles.fila
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
                                                        styles.avatarPhoto
                                                    }
                                                />

                                            )
                                            : (

                                                <Avatar
                                                    icono="paw-outline"
                                                    tamano={56}
                                                    {...propsAvatar(ave)}
                                                />

                                            )
                                    }


                                    <View
                                        style={
                                            styles.info
                                        }
                                    >

                                        <Text
                                            style={
                                                styles.codigo
                                            }
                                            numberOfLines={1}
                                        >
                                            {ave.codigo}
                                        </Text>


                                        <Text
                                            style={
                                                styles.raza
                                            }
                                            numberOfLines={1}
                                        >
                                            {
                                                ave.raza
                                                ||
                                                'Raza no especificada'
                                            }
                                        </Text>


                                        <Chip
                                            texto={
                                                ave.jaula_codigo
                                                    ? `Actualmente: Jaula ${ave.jaula_codigo}`
                                                    : 'Actualmente: Sin jaula'
                                            }
                                            tono={
                                                ave.jaula_codigo
                                                    ? 'primario'
                                                    : 'neutro'
                                            }
                                            icono="grid-outline"
                                            style={
                                                styles.chip
                                            }
                                        />

                                    </View>


                                    {
                                        procesandoId ===
                                        ave.id
                                            ? (

                                                <ActivityIndicator
                                                    color={
                                                        colors.primary
                                                    }
                                                />

                                            )
                                            : (

                                                <Icono
                                                    nombre="siguiente"
                                                    tamano={22}
                                                    color={
                                                        colors.textSecondary
                                                    }
                                                />

                                            )
                                    }

                                </View>

                            </Tarjeta>

                        )
                    )
            }

        </ScrollView>

        {avisoExito}

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

            paddingBottom: 40

        },


        center: {

            flex: 1,

            justifyContent:
                'center',

            alignItems:
                'center'

        },


        subtitle: {

            ...typography.cuerpo,

            color:
                colors.textSecondary,

            marginBottom: spacing.lg

        },


        fila: {

            flexDirection:
                'row',

            alignItems:
                'center'

        },


        avatarPhoto: {

            width: 56,

            height: 56,

            borderRadius: 28,

            borderWidth: 3,

            borderColor:
                colors.white,

            backgroundColor:
                colors.primarySoft

        },


        info: {

            flex: 1,

            marginHorizontal: spacing.md

        },


        codigo: {

            ...typography.subtitulo,

            color:
                colors.text

        },


        raza: {

            ...typography.secundario,

            color:
                colors.textSecondary,

            marginTop: 2

        },


        chip: {

            marginTop: spacing.sm

        }

    });
