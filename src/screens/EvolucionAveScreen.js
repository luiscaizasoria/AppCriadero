import React, {
    useCallback,
    useRef,
    useState
} from 'react';

import {
    View,
    Text,
    Image,
    ScrollView,
    StyleSheet,
    Alert,
    KeyboardAvoidingView,
    Platform
} from 'react-native';

import {
    useFocusEffect
} from '@react-navigation/native';

import {
    obtenerAvePorId
} from '../repositories/AveRepository';

import {
    registrarEvolucionAve
} from '../repositories/EvolucionAveRepository';

import {
    seleccionarFotoGaleria,
    tomarFotoCamara,
    guardarFotoAve
} from '../services/ImageService';

import FondoPantalla
    from '../components/FondoPantalla';

import Tarjeta
    from '../components/Tarjeta';

import TituloSeccion
    from '../components/TituloSeccion';

import IconoCirculo
    from '../components/IconoCirculo';

import CampoTexto
    from '../components/CampoTexto';

import Boton
    from '../components/Boton';

import BarraAccion
    from '../components/BarraAccion';

import Aviso
    from '../components/Aviso';

import useAvisoExito
    from '../components/useAvisoExito';

import useGuardaEnvio
    from '../components/useGuardaEnvio';

import useValidacion
    from '../components/useValidacion';

import EstadoCarga
    from '../components/EstadoCarga';

import EstadoError
    from '../components/EstadoError';

import EstadoVacio
    from '../components/EstadoVacio';

import {
    colors,
    radii,
    spacing,
    typography
} from '../theme';


export default function EvolucionAveScreen({
    route,
    navigation
}) {

    const {
        aveId
    } = route.params;


    const [
        ave,
        setAve
    ] = useState(null);


    const [
        fotoTemporal,
        setFotoTemporal
    ] = useState(null);


    const [
        caracteristicas,
        setCaracteristicas
    ] = useState('');


    const [
        observacion,
        setObservacion
    ] = useState('');


    const [
        pesoGramos,
        setPesoGramos
    ] = useState('');


    const [
        alturaCm,
        setAlturaCm
    ] = useState('');


    const [
        largoCm,
        setLargoCm
    ] = useState('');


    const [
        loading,
        setLoading
    ] = useState(true);


    const [
        errorCarga,
        setErrorCarga
    ] = useState(false);


    const [
        guardando,
        setGuardando
    ] = useState(false);


    const {
        aviso,
        mostrar: mostrarAviso,
        cerrar: cerrarAviso,
        saliendo
    } = useAvisoExito();


    const guardia = useGuardaEnvio();
    const scrollRef = useRef(null);
    const v = useValidacion(scrollRef);


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
                    await obtenerAvePorId(
                        aveId
                    );


                setAve(
                    data
                );


                setFotoTemporal(
                    data?.foto_uri ||
                    null
                );


                setCaracteristicas(
                    data
                        ?.caracteristicas
                    ||
                    ''
                );


                setPesoGramos('');
                setAlturaCm('');
                setLargoCm('');

            }
            catch (error) {

                console.error(
                    'Error cargando ave para evolución:',
                    error
                );


                setErrorCarga(
                    true
                );


                Alert.alert(
                    'Error',
                    'No fue posible cargar el ave.'
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
            [aveId]
        )

    );


    const seleccionarGaleria =
        async () => {

            try {

                const uri =
                    await seleccionarFotoGaleria();


                if (uri) {

                    setFotoTemporal(
                        uri
                    );

                }

            }
            catch (error) {

                manejarErrorFoto(
                    error
                );

            }

        };


    const tomarFoto =
        async () => {

            try {

                const uri =
                    await tomarFotoCamara();


                if (uri) {

                    setFotoTemporal(
                        uri
                    );

                }

            }
            catch (error) {

                manejarErrorFoto(
                    error
                );

            }

        };


    const guardar =
        async () => {

            if (!ave) {

                return;

            }


            const caracteristicasLimpias =
                caracteristicas
                    .trim();


            const observacionLimpia =
                observacion
                    .trim();


            const cambioFoto =
                fotoTemporal
                !==
                (
                    ave.foto_uri ||
                    null
                );


            const cambioCaracteristicas =
                caracteristicasLimpias
                !==
                (
                    ave.caracteristicas
                    ||
                    ''
                )
                    .trim();


            const pesoResultado =
                convertirMedidaOpcional(
                    pesoGramos
                );


            const alturaResultado =
                convertirMedidaOpcional(
                    alturaCm
                );


            const largoResultado =
                convertirMedidaOpcional(
                    largoCm
                );


            if (
                !pesoResultado.valido
                ||
                !alturaResultado.valido
                ||
                !largoResultado.valido
            ) {

                v.fallar(
                    !pesoResultado.valido
                        ? 'peso'
                        : !alturaResultado.valido
                            ? 'altura'
                            : 'largo',
                    'Peso, altura y largo son opcionales, pero cuando se ingresan deben ser números mayores a cero.'
                );

                Alert.alert(
                    'Medidas inválidas',
                    'Peso, altura y largo son opcionales, pero cuando se ingresan deben ser números mayores a cero.'
                );

                return;

            }


            const cambioPeso =
                pesoResultado.valor !== null
                &&
                !numerosIguales(
                    pesoResultado.valor,
                    ave.peso_gramos
                );


            const cambioAltura =
                alturaResultado.valor !== null
                &&
                !numerosIguales(
                    alturaResultado.valor,
                    ave.altura_cm
                );


            const cambioLargo =
                largoResultado.valor !== null
                &&
                !numerosIguales(
                    largoResultado.valor,
                    ave.largo_cm
                );


            if (
                !cambioFoto
                &&
                !cambioCaracteristicas
                &&
                !cambioPeso
                &&
                !cambioAltura
                &&
                !cambioLargo
                &&
                !observacionLimpia
            ) {

                v.fallar(
                    'observacion',
                    'Modifica la fotografía, características, alguna medida o agrega una observación.'
                );

                Alert.alert(
                    'Sin cambios',
                    'Modifica la fotografía, características, alguna medida o agrega una observación.'
                );

                return;

            }


            try {

                setGuardando(
                    true
                );


                let fotoFinal =
                    ave.foto_uri ||
                    null;


                if (
                    cambioFoto
                    &&
                    fotoTemporal
                ) {

                    fotoFinal =
                        await guardarFotoAve(
                            fotoTemporal,
                            ave.codigo
                        );

                }


                await registrarEvolucionAve({

                    aveId:
                        ave.id,

                    fotoUri:
                        fotoFinal,

                    pesoGramos:
                        pesoResultado.valor === null
                            ? undefined
                            : pesoResultado.valor,

                    alturaCm:
                        alturaResultado.valor === null
                            ? undefined
                            : alturaResultado.valor,

                    largoCm:
                        largoResultado.valor === null
                            ? undefined
                            : largoResultado.valor,

                    caracteristicas:
                        caracteristicasLimpias,

                    observacion:
                        observacionLimpia

                });


                // Antes: Alert con «Aceptar» que hacía goBack. Ahora: aviso y vuelve solo.
                mostrarAviso(

                    'Evolución registrada',

                    'La nueva información fue guardada y el estado anterior permanecerá en el historial.',

                    () =>
                        navigation.goBack()

                );

            }
            catch (error) {

                console.error(
                    'Error guardando evolución:',
                    error
                );


                Alert.alert(
                    'Error',
                    'No fue posible guardar la evolución del ave.'
                );

            }
            finally {

                setGuardando(
                    false
                );

            }

        };


    if (loading) {

        return (

            <FondoPantalla>

                <View
                    style={
                        styles.center
                    }
                >

                    <EstadoCarga
                        mensaje="Cargando ave..."
                    />

                </View>

            </FondoPantalla>

        );

    }


    if (!ave) {

        return (

            <FondoPantalla>

                <View
                    style={
                        styles.center
                    }
                >

                    {
                        errorCarga
                            ? (

                                <EstadoError
                                    titulo="No fue posible cargar el ave."
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


    return (

        <FondoPantalla>

        <KeyboardAvoidingView
            style={
                styles.container
            }
            behavior={
                Platform.OS === 'ios'
                    ? 'padding'
                    : undefined
            }
        >

        <ScrollView
            ref={scrollRef}
            style={
                styles.container
            }
            contentContainerStyle={
                styles.content
            }
            keyboardShouldPersistTaps="handled"
        >

            <Text
                style={
                    styles.title
                }
                accessibilityRole="header"
            >
                Evolución de {ave.codigo}
            </Text>


            <Text
                style={
                    styles.subtitle
                }
            >
                Guarda fotografías y cambios de características para mantener la trazabilidad del ciclo de vida.
            </Text>


            <Tarjeta>

                <View
                    style={
                        styles.photoContainer
                    }
                >

                    {
                        fotoTemporal
                            ? (

                                <Image
                                    source={{
                                        uri:
                                            fotoTemporal
                                    }}
                                    style={
                                        styles.photo
                                    }
                                    resizeMode="cover"
                                />

                            )
                            : (

                                <View
                                    style={
                                        styles.photoPlaceholder
                                    }
                                >

                                    <IconoCirculo
                                        icono="paw-outline"
                                        indice={1}
                                        tamano={72}
                                    />


                                    <Text
                                        style={
                                            styles.photoPlaceholderText
                                        }
                                    >
                                        Sin fotografía
                                    </Text>

                                </View>

                            )
                    }

                </View>


                <View
                    style={
                        styles.photoActions
                    }
                >

                    <Boton
                        titulo="Cámara"
                        icono="camera-outline"
                        variante="secundario"
                        onPress={
                            tomarFoto
                        }
                        testID="evolucion-camara"
                        style={
                            styles.photoButton
                        }
                    />


                    <Boton
                        titulo="Galería"
                        icono="galeria"
                        variante="secundario"
                        onPress={
                            seleccionarGaleria
                        }
                        testID="evolucion-galeria"
                        style={
                            styles.photoButton
                        }
                    />

                </View>

            </Tarjeta>


            <Tarjeta>

                <TituloSeccion
                    icono="resize-outline"
                    indice={2}
                >
                    Medidas actuales
                </TituloSeccion>


                <View
                    style={
                        styles.measurementsRow
                    }
                >

                    <MeasureCurrent
                        label="Peso"
                        value={
                            formatearMedidaActual(
                                ave.peso_gramos,
                                'g'
                            )
                        }
                    />

                    <MeasureCurrent
                        label="Altura"
                        value={
                            formatearMedidaActual(
                                ave.altura_cm,
                                'cm'
                            )
                        }
                    />

                    <MeasureCurrent
                        label="Largo"
                        value={
                            formatearMedidaActual(
                                ave.largo_cm,
                                'cm'
                            )
                        }
                    />

                </View>

            </Tarjeta>


            <Tarjeta>

                <CampoTexto
                    etiqueta="Nuevo peso en gramos (opcional)"
                    value={
                        pesoGramos
                    }
                    onChangeText={
                        setPesoGramos
                    }
                    keyboardType="decimal-pad"
                    placeholder="Ej. 850"
                    testID="evolucion-peso"
                    {...v.props('peso')}
                />


                <CampoTexto
                    etiqueta="Nueva altura en cm (opcional)"
                    value={
                        alturaCm
                    }
                    onChangeText={
                        setAlturaCm
                    }
                    keyboardType="decimal-pad"
                    placeholder="Ej. 24.5"
                    testID="evolucion-altura"
                    {...v.props('altura')}
                />


                <CampoTexto
                    etiqueta="Nuevo largo en cm (opcional)"
                    value={
                        largoCm
                    }
                    onChangeText={
                        setLargoCm
                    }
                    keyboardType="decimal-pad"
                    placeholder="Ej. 31"
                    testID="evolucion-largo"
                    {...v.props('largo')}
                    style={
                        styles.ultimoCampo
                    }
                />

            </Tarjeta>


            <Tarjeta>

                <CampoTexto
                    etiqueta="Características actuales"
                    value={
                        caracteristicas
                    }
                    onChangeText={
                        setCaracteristicas
                    }
                    multiline
                    placeholder="Plumaje, tamaño, color, comportamiento, condición física..."
                    testID="evolucion-caracteristicas"
                />


                <CampoTexto
                    etiqueta="Observación de esta actualización"
                    value={
                        observacion
                    }
                    onChangeText={
                        setObservacion
                    }
                    multiline
                    placeholder="Ej. Cambio notable de plumaje y desarrollo..."
                    testID="evolucion-observacion"
                    {...v.props('observacion')}
                    style={
                        styles.ultimoCampo
                    }
                />

            </Tarjeta>

        </ScrollView>


        <BarraAccion>

            <Boton
                titulo="Guardar evolución"
                icono="guardar"
                onPress={
                    guardia(guardar)
                }
                guardando={
                    guardando
                }
                atenuado={
                    saliendo
                }
                testID="guardar-evolucion"
            />

        </BarraAccion>

        </KeyboardAvoidingView>


        {aviso ? (
            <Aviso
                flotante
                tono="exito"
                duracion={0}
                titulo={aviso.titulo}
                mensaje={aviso.mensaje}
                onCerrar={cerrarAviso}
            />
        ) : null}

        </FondoPantalla>

    );

}


function MeasureCurrent({
    label,
    value
}) {

    return (

        <View
            style={
                styles.measurementItem
            }
        >

            <Text
                style={
                    styles.measurementLabel
                }
            >
                {label}
            </Text>

            <Text
                style={
                    styles.measurementValue
                }
            >
                {value}
            </Text>

        </View>

    );

}


function convertirMedidaOpcional(
    texto
) {

    const valorTexto =
        String(
            texto || ''
        )
            .trim();


    if (!valorTexto) {

        return {
            valido: true,
            valor: null
        };

    }


    const numero =
        Number(
            valorTexto
                .replace(',', '.')
        );


    if (
        !Number.isFinite(
            numero
        )
        ||
        numero <= 0
    ) {

        return {
            valido: false,
            valor: null
        };

    }


    return {
        valido: true,
        valor: numero
    };

}


function numerosIguales(
    a,
    b
) {

    if (
        (
            a === null
            ||
            a === undefined
            ||
            a === ''
        )
        &&
        (
            b === null
            ||
            b === undefined
            ||
            b === ''
        )
    ) {

        return true;

    }


    return Number(a) === Number(b);

}


function formatearMedidaActual(
    valor,
    unidad
) {

    if (
        valor === null
        ||
        valor === undefined
        ||
        valor === ''
    ) {

        return 'Sin dato';

    }


    return `${Number(valor)} ${unidad}`;

}


function manejarErrorFoto(
    error
) {

    const mensaje =
        String(
            error?.message ||
            ''
        );


    if (
        mensaje.includes(
            'PERMISO_CAMARA_DENEGADO'
        )
    ) {

        Alert.alert(
            'Permiso requerido',
            'Debes permitir el acceso a la cámara para tomar fotografías.'
        );

        return;

    }


    if (
        mensaje.includes(
            'PERMISO_GALERIA_DENEGADO'
        )
    ) {

        Alert.alert(
            'Permiso requerido',
            'Debes permitir el acceso a las fotografías del dispositivo.'
        );

        return;

    }


    console.error(
        'Error seleccionando fotografía:',
        error
    );


    Alert.alert(
        'Error',
        'No fue posible obtener la fotografía.'
    );

}


const styles =
    StyleSheet.create({

        container: {

            flex: 1

        },


        content: {

            padding: spacing.pantalla,

            paddingBottom: spacing.xl

        },


        center: {

            flex: 1,

            alignItems:
                'center',

            justifyContent:
                'center'

        },


        title: {

            ...typography.titulo,

            color:
                colors.primaryDark

        },


        subtitle: {

            ...typography.cuerpo,

            marginTop: spacing.xs,

            marginBottom: spacing.lg,

            color:
                colors.textSecondary

        },


        photoContainer: {

            alignItems:
                'center',

            marginBottom: spacing.md

        },


        photo: {

            width: 220,

            height: 220,

            borderRadius: radii.lg,

            backgroundColor:
                colors.surfaceAlt

        },


        photoPlaceholder: {

            width: 220,

            height: 220,

            borderRadius: radii.lg,

            backgroundColor:
                colors.surfaceAlt,

            alignItems:
                'center',

            justifyContent:
                'center'

        },


        photoPlaceholderText: {

            ...typography.secundario,

            marginTop: spacing.sm,

            color:
                colors.textSecondary

        },


        photoActions: {

            flexDirection:
                'row'

        },


        photoButton: {

            flex: 1,

            marginHorizontal: spacing.xs

        },


        measurementsRow: {

            flexDirection:
                'row'

        },


        measurementItem: {

            flex: 1,

            alignItems:
                'center',

            backgroundColor:
                colors.surfaceAlt,

            borderRadius: radii.md,

            paddingVertical: spacing.md,

            marginHorizontal: spacing.xs

        },


        measurementLabel: {

            ...typography.chip,

            color:
                colors.textSecondary

        },


        measurementValue: {

            ...typography.cuerpoFuerte,

            marginTop: spacing.xs,

            color:
                colors.text

        },


        ultimoCampo: {

            marginBottom: 0

        }

    });
