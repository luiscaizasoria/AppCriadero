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
    Alert
} from 'react-native';

import {
    useFocusEffect
} from '@react-navigation/native';

import {
    obtenerJaulaPorId,
    actualizarJaula,
    desactivarJaula
} from '../repositories/JaulaRepository';

import {
    obtenerAvesPorJaula,
    cambiarJaulaAve
} from '../repositories/AveRepository';

import {
    colors,
    radii,
    spacing,
    typography
} from '../theme';

import FondoPantalla from '../components/FondoPantalla';
import Tarjeta from '../components/Tarjeta';
import TituloSeccion from '../components/TituloSeccion';
import IconoCirculo from '../components/IconoCirculo';
import Icono from '../components/Icono';
import Chip from '../components/Chip';
import Boton from '../components/Boton';
import Pulsable from '../components/Pulsable';
import CampoTexto from '../components/CampoTexto';
import EstadoCarga from '../components/EstadoCarga';
import EstadoVacio from '../components/EstadoVacio';
import BarraAccion from '../components/BarraAccion';
import Aviso from '../components/Aviso';
import useAvisoExito from '../components/useAvisoExito';

import {
    estadoSanitarioJaula
} from '../components/JaulaEstado';

import {
    useContextoPantalla
} from '../navigation/contextoPantalla';


export default function DetalleJaulaScreen({
    route,
    navigation
}) {

    const {
        jaulaId
    } = route.params;


    const [
        jaula,
        setJaula
    ] = useState(null);


    // Migas: las pantallas hijas muestran "Jaulas › {código}"
    useContextoPantalla(
        route.key,
        jaula?.codigo
    );


    const [
        aves,
        setAves
    ] = useState([]);


    const [
        loading,
        setLoading
    ] = useState(true);


    const [
        editando,
        setEditando
    ] = useState(false);


    const [
        codigoEdit,
        setCodigoEdit
    ] = useState('');


    const [
        nombreEdit,
        setNombreEdit
    ] = useState('');


    const [
        ubicacionEdit,
        setUbicacionEdit
    ] = useState('');


    const [
        tipoEdit,
        setTipoEdit
    ] = useState('');


    const [
        procesandoJaula,
        setProcesandoJaula
    ] = useState(false);


    // Aviso de éxito no bloqueante (sustituye a los Alert de éxito)
    const {
        aviso,
        mostrar: mostrarAviso,
        cerrar: cerrarAviso,
        saliendo
    } = useAvisoExito();


    const ocupado =
        procesandoJaula || saliendo;


    const cargar =
        async () => {

            try {

                setLoading(
                    true
                );


                const [
                    jaulaData,
                    avesData
                ] =
                    await Promise.all([

                        obtenerJaulaPorId(
                            jaulaId
                        ),

                        obtenerAvesPorJaula(
                            jaulaId
                        )

                    ]);


                setJaula(
                    jaulaData
                );


                if (jaulaData) {

                    setCodigoEdit(
                        jaulaData.codigo || ''
                    );

                    setNombreEdit(
                        jaulaData.nombre || ''
                    );

                    setUbicacionEdit(
                        jaulaData.ubicacion || ''
                    );

                    setTipoEdit(
                        jaulaData.tipo || ''
                    );

                }


                setAves(
                    avesData
                );

            }
            catch (error) {

                console.error(
                    'Error cargando jaula:',
                    error
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


    const abrirAve =
        aveId => {

            // DetalleAve está registrada en esta misma pila: "atrás" vuelve a la jaula.
            navigation.navigate(
                'DetalleAve',
                {
                    aveId
                }
            );

        };


    const confirmarQuitarAve =
        ave => {

            Alert.alert(

                'Quitar ave',

                `¿Deseas retirar el ave ${ave.codigo} de la jaula ${jaula.codigo}?`,

                [
                    {
                        text:
                            'Cancelar',

                        style:
                            'cancel'
                    },

                    {
                        text:
                            'Quitar',

                        style:
                            'destructive',

                        onPress: () =>
                            quitarAve(
                                ave
                            )
                    }
                ]

            );

        };


    const quitarAve =
        async ave => {

            try {

                await cambiarJaulaAve({

                    aveId:
                        ave.id,

                    jaulaAnteriorId:
                        jaulaId,

                    nuevaJaulaId:
                        null,

                    codigoAve:
                        ave.codigo

                });


                await cargar();


                mostrarAviso(
                    'Ave retirada',
                    `El ave ${ave.codigo} quedó sin jaula asignada.`
                );

            }
            catch (error) {

                console.error(
                    'Error quitando ave de la jaula:',
                    error
                );


                Alert.alert(
                    'Error',
                    'No fue posible retirar el ave de la jaula.'
                );

            }

        };


    const iniciarEdicion =
        () => {

            setCodigoEdit(
                jaula.codigo || ''
            );

            setNombreEdit(
                jaula.nombre || ''
            );

            setUbicacionEdit(
                jaula.ubicacion || ''
            );

            setTipoEdit(
                jaula.tipo || ''
            );

            setEditando(
                true
            );

        };


    const cancelarEdicion =
        () => {

            setCodigoEdit(
                jaula.codigo || ''
            );

            setNombreEdit(
                jaula.nombre || ''
            );

            setUbicacionEdit(
                jaula.ubicacion || ''
            );

            setTipoEdit(
                jaula.tipo || ''
            );

            setEditando(
                false
            );

        };


    const guardarEdicion =
        async () => {

            const codigoLimpio =
                codigoEdit.trim();


            if (!codigoLimpio) {

                Alert.alert(
                    'Código requerido',
                    'Ingresa un código para la jaula.'
                );

                return;

            }


            try {

                setProcesandoJaula(
                    true
                );


                await actualizarJaula({

                    id:
                        jaulaId,

                    codigo:
                        codigoLimpio,

                    nombre:
                        nombreEdit,

                    ubicacion:
                        ubicacionEdit,

                    tipo:
                        tipoEdit

                });


                setEditando(
                    false
                );


                await cargar();


                mostrarAviso(
                    'Jaula actualizada',
                    'Los datos de la jaula fueron actualizados correctamente.'
                );

            }
            catch (error) {

                const mensaje =
                    String(
                        error?.message ||
                        ''
                    )
                        .toLowerCase();


                if (
                    mensaje.includes(
                        'unique'
                    )
                    &&
                    mensaje.includes(
                        'jaulas.codigo'
                    )
                ) {

                    Alert.alert(
                        'Código duplicado',
                        'Ya existe una jaula con ese código.'
                    );

                    return;

                }


                console.error(
                    'Error actualizando jaula:',
                    error
                );


                Alert.alert(
                    'Error',
                    'No fue posible actualizar la jaula.'
                );

            }
            finally {

                setProcesandoJaula(
                    false
                );

            }

        };


    const confirmarEliminarJaula =
        () => {

            const cantidad =
                aves.length;


            const mensajeAves =
                cantidad === 0
                    ? 'La jaula está vacía.'
                    : cantidad === 1
                        ? 'El ave asignada será retirada y quedará sin jaula.'
                        : `Las ${cantidad} aves asignadas serán retiradas y quedarán sin jaula.`;


            Alert.alert(

                'Eliminar jaula',

                `¿Estás seguro de eliminar la jaula ${jaula.codigo}?\n\n${mensajeAves}\n\nLa jaula dejará de aparecer como activa, pero su información histórica se conservará.`,

                [
                    {
                        text:
                            'Cancelar',

                        style:
                            'cancel'
                    },

                    {
                        text:
                            'Eliminar',

                        style:
                            'destructive',

                        onPress:
                            eliminarJaula
                    }
                ]

            );

        };


    const eliminarJaula =
        async () => {

            try {

                setProcesandoJaula(
                    true
                );


                const resultado =
                    await desactivarJaula(
                        jaulaId
                    );


                const cantidadLiberada =
                    Number(
                        resultado?.cantidadAvesLiberadas || 0
                    );


                // Antes: Alert con «Aceptar» que hacía goBack. Ahora: aviso y vuelve solo.
                mostrarAviso(

                    'Jaula eliminada',

                    cantidadLiberada === 0
                        ? 'La jaula fue eliminada correctamente.'
                        : cantidadLiberada === 1
                            ? 'La jaula fue eliminada y el ave asignada quedó sin jaula.'
                            : `La jaula fue eliminada y ${cantidadLiberada} aves quedaron sin jaula.`,

                    () =>
                        navigation.goBack()

                );

            }
            catch (error) {

                console.error(
                    'Error eliminando jaula:',
                    error
                );


                Alert.alert(
                    'Error',
                    'No fue posible eliminar la jaula.'
                );

            }
            finally {

                setProcesandoJaula(
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
                        mensaje="Cargando jaula..."
                    />

                </View>

            </FondoPantalla>

        );

    }


    if (!jaula) {

        return (

            <FondoPantalla>

                <View
                    style={
                        styles.center
                    }
                >

                    <EstadoVacio
                        icono="home-outline"
                        titulo="Jaula no encontrada."
                        testID="jaula-no-encontrada"
                    />

                </View>

            </FondoPantalla>

        );

    }


    const estado =
        estadoSanitarioJaula(
            jaula.estado_sanitario
        );


    const ACCIONES = [
        {
            id: 'AlimentacionJaula',
            texto: 'Alimentación',
            icono: 'alimentacion',
            indice: 1,
            testID: 'accion-alimentacion'
        },
        {
            id: 'BebidaJaula',
            texto: 'Bebida',
            icono: 'bebida',
            indice: 2,
            testID: 'accion-bebida'
        },
        {
            id: 'SanidadJaula',
            texto: 'Sanidad',
            icono: 'sanidad',
            indice: 4,
            testID: 'accion-sanidad'
        },
        {
            id: 'HistorialJaula',
            texto: 'Historial',
            icono: 'historial',
            indice: 0,
            testID: 'accion-historial'
        }
    ];


    return (

        <FondoPantalla>

            <ScrollView
                style={
                    styles.container
                }
                contentContainerStyle={
                    styles.content
                }
                keyboardShouldPersistTaps="handled"
            >

                <Tarjeta
                    franja={estado.franja}
                    testID="jaula-encabezado"
                >

                    <Text
                        style={
                            styles.title
                        }
                    >
                        {jaula.codigo}
                    </Text>


                    {
                        jaula.nombre
                            ? (

                                <Text
                                    style={
                                        styles.name
                                    }
                                >
                                    {jaula.nombre}
                                </Text>

                            )
                            : null
                    }

                </Tarjeta>


                {
                    !editando
                        ? (

                            <View
                                style={
                                    styles.managementActions
                                }
                            >

                                <Boton
                                    titulo="Editar jaula"
                                    icono="editar"
                                    variante="secundario"
                                    onPress={
                                        iniciarEdicion
                                    }
                                    disabled={
                                        ocupado
                                    }
                                    testID="editar-jaula"
                                    style={
                                        styles.managementButton
                                    }
                                />

                                <Boton
                                    titulo="Eliminar"
                                    icono="eliminar"
                                    variante="peligro"
                                    onPress={
                                        confirmarEliminarJaula
                                    }
                                    disabled={
                                        ocupado
                                    }
                                    testID="eliminar-jaula"
                                    style={
                                        styles.managementButton
                                    }
                                />

                            </View>

                        )
                        : null
                }


                {
                    editando
                        ? (

                            <Tarjeta>

                                <TituloSeccion
                                    icono="editar"
                                    indice={0}
                                >
                                    Editar jaula
                                </TituloSeccion>


                                <CampoTexto
                                    etiqueta="Código *"
                                    value={
                                        codigoEdit
                                    }
                                    onChangeText={
                                        setCodigoEdit
                                    }
                                    autoCapitalize="characters"
                                    maxLength={30}
                                    editable={
                                        !ocupado
                                    }
                                    testID="editar-codigo"
                                />


                                <CampoTexto
                                    etiqueta="Nombre"
                                    value={
                                        nombreEdit
                                    }
                                    onChangeText={
                                        setNombreEdit
                                    }
                                    placeholder="Nombre de la jaula"
                                    editable={
                                        !ocupado
                                    }
                                    testID="editar-nombre"
                                />


                                <CampoTexto
                                    etiqueta="Ubicación"
                                    value={
                                        ubicacionEdit
                                    }
                                    onChangeText={
                                        setUbicacionEdit
                                    }
                                    placeholder="Ubicación de la jaula"
                                    editable={
                                        !ocupado
                                    }
                                    testID="editar-ubicacion"
                                />


                                <CampoTexto
                                    etiqueta="Tipo"
                                    value={
                                        tipoEdit
                                    }
                                    onChangeText={
                                        setTipoEdit
                                    }
                                    placeholder="Tipo de jaula"
                                    editable={
                                        !ocupado
                                    }
                                    testID="editar-tipo"
                                />

                            </Tarjeta>

                        )
                        : null
                }


                <Tarjeta>

                    <Dato
                        icono="location-outline"
                        etiqueta="Ubicación"
                    >
                        {
                            jaula.ubicacion
                            ||
                            'Sin ubicación'
                        }
                    </Dato>


                    <Dato
                        icono="pricetag-outline"
                        etiqueta="Tipo"
                    >
                        {
                            jaula.tipo
                            ||
                            'Sin tipo'
                        }
                    </Dato>


                    <Text
                        style={
                            styles.label
                        }
                    >
                        Estado sanitario
                    </Text>


                    <Chip
                        texto={
                            estado.label
                        }
                        tono={
                            estado.tono
                        }
                        icono={
                            estado.icono
                        }
                        style={
                            styles.statusChip
                        }
                    />

                </Tarjeta>


                <Tarjeta>

                    <View
                        style={
                            styles.sectionHeader
                        }
                    >

                        <View
                            style={
                                styles.sectionMain
                            }
                        >

                            <TituloSeccion
                                icono="aves"
                                indice={2}
                            >
                                Aves
                            </TituloSeccion>


                            <Text
                                style={
                                    styles.counter
                                }
                            >
                                {
                                    aves.length
                                } {
                                    aves.length === 1
                                        ? 'ave'
                                        : 'aves'
                                }
                            </Text>

                        </View>


                        <Boton
                            titulo="Agregar"
                            icono="add"
                            variante="secundario"
                            testID="agregar-ave-jaula"
                            onPress={() =>
                                navigation.navigate(
                                    'SeleccionarAveJaula',
                                    {
                                        jaulaId:
                                            jaula.id,

                                        jaulaCodigo:
                                            jaula.codigo
                                    }
                                )
                            }
                        />

                    </View>


                    {
                        aves.length === 0
                            ? (

                                <EstadoVacio
                                    icono="aves"
                                    titulo="Jaula vacía"
                                    mensaje="No existen aves asignadas actualmente a esta jaula."
                                    testID="jaula-sin-aves"
                                />

                            )
                            : aves.map(
                                ave => (

                                    <View
                                        key={
                                            ave.id
                                        }
                                        style={
                                            styles.birdRow
                                        }
                                    >

                                        <Pulsable
                                            style={
                                                styles.birdMain
                                            }
                                            testID={`ave-jaula-${ave.codigo}`}
                                            accessibilityRole="button"
                                            onPress={() =>
                                                abrirAve(
                                                    ave.id
                                                )
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
                                                                styles.birdPhoto
                                                            }
                                                        />

                                                    )
                                                    : (

                                                        <IconoCirculo
                                                            icono="aves"
                                                            indice={2}
                                                            tamano={48}
                                                        />

                                                    )
                                            }


                                            <View
                                                style={
                                                    styles.birdInfo
                                                }
                                            >

                                                <Text
                                                    style={
                                                        styles.birdCode
                                                    }
                                                >
                                                    {
                                                        ave.codigo
                                                    }
                                                </Text>


                                                <Text
                                                    style={
                                                        styles.birdBreed
                                                    }
                                                >
                                                    {
                                                        ave.raza
                                                        ||
                                                        'Raza no especificada'
                                                    }
                                                </Text>

                                            </View>

                                        </Pulsable>


                                        <Pulsable
                                            style={
                                                styles.removeBirdButton
                                            }
                                            testID={`quitar-ave-${ave.codigo}`}
                                            accessibilityRole="button"
                                            onPress={() =>
                                                confirmarQuitarAve(
                                                    ave
                                                )
                                            }
                                        >

                                            <Text
                                                style={
                                                    styles.removeBirdText
                                                }
                                            >
                                                Quitar
                                            </Text>

                                        </Pulsable>

                                    </View>

                                )
                            )
                    }

                </Tarjeta>


                <TituloSeccion
                    icono="filtros"
                    indice={4}
                >
                    Acciones de la jaula
                </TituloSeccion>


                <View
                    style={
                        styles.actionsGrid
                    }
                >

                    {
                        ACCIONES.map(
                            accion => (

                                <Tarjeta
                                    key={
                                        accion.id
                                    }
                                    testID={
                                        accion.testID
                                    }
                                    style={
                                        styles.actionTile
                                    }
                                    onPress={() =>
                                        navigation.navigate(
                                            accion.id,
                                            {
                                                jaulaId
                                            }
                                        )
                                    }
                                >

                                    <IconoCirculo
                                        icono={
                                            accion.icono
                                        }
                                        indice={
                                            accion.indice
                                        }
                                        tamano={48}
                                    />

                                    <Text
                                        style={
                                            styles.actionText
                                        }
                                    >
                                        {accion.texto}
                                    </Text>

                                </Tarjeta>

                            )
                        )
                    }

                </View>

            </ScrollView>


            {
                editando
                    ? (

                        <BarraAccion
                            fila
                            testID="barra-guardar-edicion"
                        >

                            <Boton
                                titulo="Cancelar"
                                variante="contorno"
                                onPress={
                                    cancelarEdicion
                                }
                                disabled={
                                    ocupado
                                }
                                testID="cancelar-edicion"
                                style={
                                    styles.barButtonSecondary
                                }
                            />

                            <Boton
                                titulo={
                                    procesandoJaula
                                        ? 'Guardando...'
                                        : 'Guardar cambios'
                                }
                                icono={
                                    procesandoJaula
                                        ? undefined
                                        : 'guardar'
                                }
                                onPress={
                                    guardarEdicion
                                }
                                atenuado={
                                    ocupado
                                }
                                testID="guardar-cambios-jaula"
                                style={
                                    styles.barButtonPrimary
                                }
                            />

                        </BarraAccion>

                    )
                    : null
            }


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


function Dato({
    icono,
    etiqueta,
    children
}) {

    return (

        <View style={styles.dato}>

            <Icono
                nombre={icono}
                tamano={22}
                color={colors.primary}
                style={styles.datoIcono}
            />

            <View style={styles.datoTextos}>

                <Text style={styles.label}>
                    {etiqueta}
                </Text>

                <Text style={styles.value}>
                    {children}
                </Text>

            </View>

        </View>

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

        center: {
            flex: 1,
            justifyContent: 'center',
            alignItems: 'center',
            padding: spacing.xl
        },

        title: {
            ...typography.display,
            color: colors.primaryDark
        },

        name: {
            ...typography.cuerpo,
            color: colors.textSecondary,
            marginTop: spacing.xs
        },

        managementActions: {
            flexDirection: 'row',
            marginBottom: spacing.md
        },

        managementButton: {
            flex: 1,
            marginHorizontal: spacing.xs
        },

        barButtonSecondary: {
            flex: 1,
            marginRight: spacing.sm
        },

        barButtonPrimary: {
            flex: 2
        },

        dato: {
            flexDirection: 'row',
            alignItems: 'center',
            marginBottom: spacing.md
        },

        datoIcono: {
            marginRight: spacing.md
        },

        datoTextos: {
            flex: 1
        },

        label: {
            ...typography.secundario,
            color: colors.textSecondary
        },

        value: {
            ...typography.cuerpoFuerte,
            color: colors.text
        },

        statusChip: {
            marginTop: spacing.xs
        },

        sectionHeader: {
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center'
        },

        sectionMain: {
            flex: 1,
            marginRight: spacing.sm
        },

        counter: {
            ...typography.secundario,
            color: colors.textSecondary,
            marginLeft: 40
        },

        birdRow: {
            flexDirection: 'row',
            alignItems: 'center',
            borderTopWidth: 1,
            borderTopColor: colors.borderSoft,
            paddingVertical: spacing.md
        },

        birdMain: {
            flex: 1,
            flexDirection: 'row',
            alignItems: 'center',
            minHeight: spacing.touchMin
        },

        birdPhoto: {
            width: 48,
            height: 48,
            borderRadius: 24,
            backgroundColor: colors.surfaceAlt
        },

        birdInfo: {
            flex: 1,
            marginLeft: spacing.md
        },

        birdCode: {
            ...typography.cuerpoFuerte,
            color: colors.text
        },

        birdBreed: {
            ...typography.secundario,
            color: colors.textSecondary
        },

        removeBirdButton: {
            backgroundColor: colors.dangerSoft,
            minHeight: spacing.touchMin,
            paddingHorizontal: spacing.md,
            borderRadius: radii.md,
            alignItems: 'center',
            justifyContent: 'center',
            marginLeft: spacing.sm
        },

        removeBirdText: {
            ...typography.etiqueta,
            color: colors.dangerText
        },

        actionsGrid: {
            flexDirection: 'row',
            flexWrap: 'wrap',
            justifyContent: 'space-between'
        },

        actionTile: {
            width: '48%',
            alignItems: 'center',
            paddingVertical: spacing.lg
        },

        actionText: {
            ...typography.subtitulo,
            color: colors.text,
            marginTop: spacing.sm,
            textAlign: 'center'
        }

    });
