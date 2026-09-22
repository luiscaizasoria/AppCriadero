import React, {
    useCallback,
    useState
} from 'react';

import {
    View,
    Text,
    Image,
    ScrollView,
    TextInput,
    TouchableOpacity,
    StyleSheet,
    ActivityIndicator,
    Alert
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

import {
    COLORS
} from '../config/constants';


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
        guardando,
        setGuardando
    ] = useState(false);


    const cargar =
        async () => {

            try {

                setLoading(
                    true
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


                Alert.alert(

                    'Evolución registrada',

                    'La nueva información fue guardada y el estado anterior permanecerá en el historial.',

                    [
                        {
                            text:
                                'Aceptar',

                            onPress: () =>
                                navigation.goBack()
                        }
                    ]

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
                    Cargando ave...
                </Text>

            </View>

        );

    }


    if (!ave) {

        return (

            <View
                style={
                    styles.center
                }
            >

                <Text>
                    Ave no encontrada.
                </Text>

            </View>

        );

    }


    return (

        <ScrollView
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
            >
                📸 Evolución de {ave.codigo}
            </Text>


            <Text
                style={
                    styles.subtitle
                }
            >
                Guarda fotografías y cambios de características para mantener la trazabilidad del ciclo de vida.
            </Text>


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

                                <Text
                                    style={
                                        styles.photoPlaceholderIcon
                                    }
                                >
                                    🐔
                                </Text>


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

                <TouchableOpacity
                    style={
                        styles.photoButton
                    }
                    onPress={
                        tomarFoto
                    }
                >

                    <Text
                        style={
                            styles.photoButtonText
                        }
                    >
                        📷 Cámara
                    </Text>

                </TouchableOpacity>


                <TouchableOpacity
                    style={
                        styles.photoButton
                    }
                    onPress={
                        seleccionarGaleria
                    }
                >

                    <Text
                        style={
                            styles.photoButtonText
                        }
                    >
                        🖼️ Galería
                    </Text>

                </TouchableOpacity>

            </View>


            <View
                style={
                    styles.measurementsCard
                }
            >

                <Text
                    style={
                        styles.measurementsTitle
                    }
                >
                    📏 Medidas actuales
                </Text>


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

            </View>


            <Text
                style={
                    styles.label
                }
            >
                Nuevo peso en gramos (opcional)
            </Text>


            <TextInput
                style={
                    styles.input
                }
                value={
                    pesoGramos
                }
                onChangeText={
                    setPesoGramos
                }
                keyboardType="decimal-pad"
                placeholder="Ej. 850"
            />


            <Text
                style={
                    styles.label
                }
            >
                Nueva altura en cm (opcional)
            </Text>


            <TextInput
                style={
                    styles.input
                }
                value={
                    alturaCm
                }
                onChangeText={
                    setAlturaCm
                }
                keyboardType="decimal-pad"
                placeholder="Ej. 24.5"
            />


            <Text
                style={
                    styles.label
                }
            >
                Nuevo largo en cm (opcional)
            </Text>


            <TextInput
                style={
                    styles.input
                }
                value={
                    largoCm
                }
                onChangeText={
                    setLargoCm
                }
                keyboardType="decimal-pad"
                placeholder="Ej. 31"
            />


            <Text
                style={
                    styles.label
                }
            >
                Características actuales
            </Text>


            <TextInput
                style={[
                    styles.input,
                    styles.textArea
                ]}
                value={
                    caracteristicas
                }
                onChangeText={
                    setCaracteristicas
                }
                multiline
                placeholder="Plumaje, tamaño, color, comportamiento, condición física..."
            />


            <Text
                style={
                    styles.label
                }
            >
                Observación de esta actualización
            </Text>


            <TextInput
                style={[
                    styles.input,
                    styles.textArea
                ]}
                value={
                    observacion
                }
                onChangeText={
                    setObservacion
                }
                multiline
                placeholder="Ej. Cambio notable de plumaje y desarrollo..."
            />


            <TouchableOpacity
                style={[
                    styles.saveButton,

                    guardando
                    &&
                    styles.disabledButton
                ]}
                onPress={
                    guardar
                }
                disabled={
                    guardando
                }
            >

                <Text
                    style={
                        styles.saveButtonText
                    }
                >
                    {
                        guardando
                            ? 'Guardando...'
                            : '💾 Guardar evolución'
                    }
                </Text>

            </TouchableOpacity>

        </ScrollView>

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

            flex: 1,

            backgroundColor:
                COLORS.background

        },


        content: {

            padding: 20,

            paddingBottom: 50

        },


        center: {

            flex: 1,

            alignItems:
                'center',

            justifyContent:
                'center',

            backgroundColor:
                COLORS.background

        },


        loadingText: {

            marginTop: 10,

            color:
                COLORS.textSecondary

        },


        title: {

            fontSize: 26,

            fontWeight:
                'bold',

            color:
                COLORS.primary

        },


        subtitle: {

            marginTop: 6,

            marginBottom: 22,

            color:
                COLORS.textSecondary,

            lineHeight: 20

        },


        photoContainer: {

            alignItems:
                'center',

            marginBottom: 15

        },


        photo: {

            width: 220,

            height: 220,

            borderRadius: 22,

            backgroundColor:
                COLORS.card

        },


        photoPlaceholder: {

            width: 220,

            height: 220,

            borderRadius: 22,

            backgroundColor:
                '#e7f5f5',

            alignItems:
                'center',

            justifyContent:
                'center'

        },


        photoPlaceholderIcon: {

            fontSize: 65

        },


        photoPlaceholderText: {

            color:
                COLORS.textSecondary,

            marginTop: 8

        },


        photoActions: {

            flexDirection:
                'row',

            justifyContent:
                'space-between',

            marginBottom: 15

        },


        photoButton: {

            width:
                '48%',

            backgroundColor:
                COLORS.primary,

            paddingVertical: 13,

            borderRadius: 12,

            alignItems:
                'center'

        },


        photoButtonText: {

            color:
                COLORS.white,

            fontWeight:
                'bold'

        },


        measurementsCard: {

            backgroundColor:
                COLORS.card,

            borderWidth:1,

            borderColor:
                COLORS.border,

            borderRadius:14,

            padding:14,

            marginBottom:4

        },


        measurementsTitle: {

            fontSize:16,

            fontWeight:'bold',

            color:
                COLORS.text,

            marginBottom:12

        },


        measurementsRow: {

            flexDirection:'row',

            justifyContent:'space-between'

        },


        measurementItem: {

            width:'31%',

            alignItems:'center',

            backgroundColor:'#f6f9f9',

            borderRadius:10,

            paddingVertical:10,

            paddingHorizontal:5

        },


        measurementLabel: {

            fontSize:12,

            color:
                COLORS.textSecondary

        },


        measurementValue: {

            marginTop:4,

            fontSize:14,

            fontWeight:'bold',

            color:
                COLORS.text

        },


        label: {

            fontSize: 15,

            fontWeight:
                '600',

            color:
                COLORS.text,

            marginTop: 16,

            marginBottom: 6

        },


        input: {

            backgroundColor:
                COLORS.card,

            borderWidth: 1,

            borderColor:
                COLORS.border,

            borderRadius: 12,

            paddingHorizontal: 14,

            paddingVertical: 13,

            fontSize: 16

        },


        textArea: {

            minHeight: 105,

            textAlignVertical:
                'top'

        },


        saveButton: {

            backgroundColor:
                COLORS.primary,

            borderRadius: 14,

            paddingVertical: 16,

            alignItems:
                'center',

            marginTop: 30

        },


        disabledButton: {

            opacity: 0.6

        },


        saveButtonText: {

            color:
                COLORS.white,

            fontWeight:
                'bold',

            fontSize: 17

        }

    });