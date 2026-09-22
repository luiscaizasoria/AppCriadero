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
    TouchableOpacity,
    TextInput,
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
    COLORS,
    getJaulaSanitaryStatusStyle
} from '../config/constants';

import Card
    from '../components/Card';


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

            const tabNavigation =
                navigation.getParent();


            if (!tabNavigation) {

                Alert.alert(
                    'Error',
                    'No fue posible abrir el detalle del ave.'
                );

                return;

            }


            tabNavigation.navigate(
                'Aves',
                {
                    screen:
                        'DetalleAve',

                    params: {
                        aveId
                    }
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


                Alert.alert(
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


                Alert.alert(
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


                Alert.alert(

                    'Jaula eliminada',

                    cantidadLiberada === 0
                        ? 'La jaula fue eliminada correctamente.'
                        : cantidadLiberada === 1
                            ? 'La jaula fue eliminada y el ave asignada quedó sin jaula.'
                            : `La jaula fue eliminada y ${cantidadLiberada} aves quedaron sin jaula.`,

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
                    Cargando jaula...
                </Text>

            </View>

        );

    }


    if (!jaula) {

        return (

            <View
                style={
                    styles.center
                }
            >

                <Text
                    style={
                        styles.notFoundText
                    }
                >
                    Jaula no encontrada.
                </Text>

            </View>

        );

    }


    const sanitaryStyle =
        getJaulaSanitaryStatusStyle(
            jaula.estado_sanitario
        );


    return (

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
                    styles.title
                }
            >
                🏠 {jaula.codigo}
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


            {
                !editando
                    ? (

                        <View
                            style={
                                styles.managementActions
                            }
                        >

                            <TouchableOpacity
                                style={[
                                    styles.editJaulaButton,

                                    procesandoJaula
                                    &&
                                    styles.disabledManagementButton
                                ]}
                                onPress={
                                    iniciarEdicion
                                }
                                disabled={
                                    procesandoJaula
                                }
                            >

                                <Text
                                    style={
                                        styles.editJaulaButtonText
                                    }
                                >
                                    ✏️ Editar jaula
                                </Text>

                            </TouchableOpacity>


                            <TouchableOpacity
                                style={[
                                    styles.deleteJaulaButton,

                                    procesandoJaula
                                    &&
                                    styles.disabledManagementButton
                                ]}
                                onPress={
                                    confirmarEliminarJaula
                                }
                                disabled={
                                    procesandoJaula
                                }
                            >

                                <Text
                                    style={
                                        styles.deleteJaulaButtonText
                                    }
                                >
                                    🗑️ Eliminar
                                </Text>

                            </TouchableOpacity>

                        </View>

                    )
                    : null
            }


            {
                editando
                    ? (

                        <Card>

                            <Text
                                style={
                                    styles.editTitle
                                }
                            >
                                ✏️ Editar jaula
                            </Text>


                            <Text
                                style={
                                    styles.label
                                }
                            >
                                Código *
                            </Text>


                            <TextInput
                                style={
                                    styles.input
                                }
                                value={
                                    codigoEdit
                                }
                                onChangeText={
                                    setCodigoEdit
                                }
                                autoCapitalize="characters"
                                maxLength={30}
                                editable={
                                    !procesandoJaula
                                }
                            />


                            <Text
                                style={
                                    styles.label
                                }
                            >
                                Nombre
                            </Text>


                            <TextInput
                                style={
                                    styles.input
                                }
                                value={
                                    nombreEdit
                                }
                                onChangeText={
                                    setNombreEdit
                                }
                                placeholder="Nombre de la jaula"
                                editable={
                                    !procesandoJaula
                                }
                            />


                            <Text
                                style={
                                    styles.label
                                }
                            >
                                Ubicación
                            </Text>


                            <TextInput
                                style={
                                    styles.input
                                }
                                value={
                                    ubicacionEdit
                                }
                                onChangeText={
                                    setUbicacionEdit
                                }
                                placeholder="Ubicación de la jaula"
                                editable={
                                    !procesandoJaula
                                }
                            />


                            <Text
                                style={
                                    styles.label
                                }
                            >
                                Tipo
                            </Text>


                            <TextInput
                                style={
                                    styles.input
                                }
                                value={
                                    tipoEdit
                                }
                                onChangeText={
                                    setTipoEdit
                                }
                                placeholder="Tipo de jaula"
                                editable={
                                    !procesandoJaula
                                }
                            />


                            <View
                                style={
                                    styles.editActions
                                }
                            >

                                <TouchableOpacity
                                    style={[
                                        styles.saveEditButton,

                                        procesandoJaula
                                        &&
                                        styles.disabledManagementButton
                                    ]}
                                    onPress={
                                        guardarEdicion
                                    }
                                    disabled={
                                        procesandoJaula
                                    }
                                >

                                    <Text
                                        style={
                                            styles.saveEditButtonText
                                        }
                                    >
                                        {
                                            procesandoJaula
                                                ? 'Guardando...'
                                                : '💾 Guardar cambios'
                                        }
                                    </Text>

                                </TouchableOpacity>


                                <TouchableOpacity
                                    style={[
                                        styles.cancelEditButton,

                                        procesandoJaula
                                        &&
                                        styles.disabledManagementButton
                                    ]}
                                    onPress={
                                        cancelarEdicion
                                    }
                                    disabled={
                                        procesandoJaula
                                    }
                                >

                                    <Text
                                        style={
                                            styles.cancelEditButtonText
                                        }
                                    >
                                        Cancelar
                                    </Text>

                                </TouchableOpacity>

                            </View>

                        </Card>

                    )
                    : null
            }


            <Card>

                <Text
                    style={
                        styles.label
                    }
                >
                    Ubicación
                </Text>


                <Text
                    style={
                        styles.value
                    }
                >
                    {
                        jaula.ubicacion
                        ||
                        'Sin ubicación'
                    }
                </Text>


                <Text
                    style={
                        styles.label
                    }
                >
                    Tipo
                </Text>


                <Text
                    style={
                        styles.value
                    }
                >
                    {
                        jaula.tipo
                        ||
                        'Sin tipo'
                    }
                </Text>


                <Text
                    style={
                        styles.label
                    }
                >
                    Estado sanitario
                </Text>


                <View
                    style={[
                        styles.statusBadge,

                        {
                            backgroundColor:
                                sanitaryStyle
                                    .backgroundColor
                        }
                    ]}
                >

                    <Text
                        style={[
                            styles.statusText,

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

            </Card>


            <Card>

                <View
                    style={
                        styles.sectionHeader
                    }
                >

                    <View>

                        <Text
                            style={
                                styles.sectionTitle
                            }
                        >
                            🐔 Aves
                        </Text>


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


                    <TouchableOpacity
                        style={
                            styles.addBirdButton
                        }
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
                    >

                        <Text
                            style={
                                styles.addBirdText
                            }
                        >
                            ＋ Agregar
                        </Text>

                    </TouchableOpacity>

                </View>


                {
                    aves.length === 0
                        ? (

                            <View
                                style={
                                    styles.emptyBirds
                                }
                            >

                                <Text
                                    style={
                                        styles.emptyBirdIcon
                                    }
                                >
                                    🐔
                                </Text>


                                <Text
                                    style={
                                        styles.emptyBirdTitle
                                    }
                                >
                                    Jaula vacía
                                </Text>


                                <Text
                                    style={
                                        styles.description
                                    }
                                >
                                    No existen aves asignadas actualmente a esta jaula.
                                </Text>

                            </View>

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

                                    <TouchableOpacity
                                        style={
                                            styles.birdMain
                                        }
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

                                                    <View
                                                        style={
                                                            styles.birdAvatar
                                                        }
                                                    >

                                                        <Text
                                                            style={
                                                                styles.birdAvatarText
                                                            }
                                                        >
                                                            🐔
                                                        </Text>

                                                    </View>

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

                                    </TouchableOpacity>


                                    <TouchableOpacity
                                        style={
                                            styles.removeBirdButton
                                        }
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

                                    </TouchableOpacity>

                                </View>

                            )
                        )
                }

            </Card>


            <Card>

                <Text
                    style={
                        styles.sectionTitle
                    }
                >
                    Acciones de la jaula
                </Text>


                <TouchableOpacity
                    style={
                        styles.actionButton
                    }
                    onPress={() =>
                        navigation.navigate(
                            'AlimentacionJaula',
                            {
                                jaulaId
                            }
                        )
                    }
                >

                    <Text
                        style={
                            styles.actionText
                        }
                    >
                        🍚 Alimentación
                    </Text>

                </TouchableOpacity>


                <TouchableOpacity
                    style={
                        styles.actionButton
                    }
                    onPress={() =>
                        navigation.navigate(
                            'BebidaJaula',
                            {
                                jaulaId
                            }
                        )
                    }
                >

                    <Text
                        style={
                            styles.actionText
                        }
                    >
                        💧 Bebida
                    </Text>

                </TouchableOpacity>


                <TouchableOpacity
                    style={
                        styles.actionButton
                    }
                    onPress={() =>
                        navigation.navigate(
                            'SanidadJaula',
                            {
                                jaulaId
                            }
                        )
                    }
                >

                    <Text
                        style={
                            styles.actionText
                        }
                    >
                        🧼 Sanidad
                    </Text>

                </TouchableOpacity>


                <TouchableOpacity
                    style={
                        styles.actionButton
                    }
                    onPress={() =>
                        navigation.navigate(
                            'HistorialJaula',
                            {
                                jaulaId
                            }
                        )
                    }
                >

                    <Text
                        style={
                            styles.actionText
                        }
                    >
                        📖 Historial
                    </Text>

                </TouchableOpacity>

            </Card>

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

            padding: 16,

            paddingBottom: 40

        },


        managementActions: {

            flexDirection:
                'row',

            justifyContent:
                'space-between',

            marginTop: 16,

            marginBottom: 4

        },


        editJaulaButton: {

            width:
                '48%',

            backgroundColor:
                COLORS.primary,

            paddingVertical: 12,

            borderRadius: 12,

            alignItems:
                'center'

        },


        editJaulaButtonText: {

            color:
                COLORS.white,

            fontWeight:
                'bold',

            fontSize: 15

        },


        deleteJaulaButton: {

            width:
                '48%',

            backgroundColor:
                '#fde9e7',

            paddingVertical: 12,

            borderRadius: 12,

            alignItems:
                'center',

            borderWidth: 1,

            borderColor:
                COLORS.danger

        },


        deleteJaulaButtonText: {

            color:
                COLORS.danger,

            fontWeight:
                'bold',

            fontSize: 15

        },


        disabledManagementButton: {

            opacity: 0.55

        },


        editTitle: {

            fontSize: 19,

            fontWeight:
                'bold',

            color:
                COLORS.text,

            marginBottom: 4

        },


        input: {

            backgroundColor:
                COLORS.card,

            borderWidth: 1,

            borderColor:
                COLORS.border,

            borderRadius: 12,

            paddingHorizontal: 14,

            paddingVertical: 12,

            fontSize: 16,

            color:
                COLORS.text,

            marginTop: 5

        },


        editActions: {

            marginTop: 18

        },


        saveEditButton: {

            backgroundColor:
                COLORS.primary,

            paddingVertical: 13,

            borderRadius: 12,

            alignItems:
                'center'

        },


        saveEditButtonText: {

            color:
                COLORS.white,

            fontWeight:
                'bold',

            fontSize: 15

        },


        cancelEditButton: {

            backgroundColor:
                '#e8eeee',

            paddingVertical: 12,

            borderRadius: 12,

            alignItems:
                'center',

            marginTop: 9

        },


        cancelEditButtonText: {

            color:
                COLORS.text,

            fontWeight:
                'bold',

            fontSize: 15

        },


        center: {

            flex: 1,

            justifyContent:
                'center',

            alignItems:
                'center',

            padding: 20,

            backgroundColor:
                COLORS.background

        },


        loadingText: {

            marginTop: 10,

            color:
                COLORS.textSecondary

        },


        notFoundText: {

            fontSize: 17,

            color:
                COLORS.textSecondary

        },


        title: {

            fontSize: 28,

            fontWeight:
                'bold',

            color:
                COLORS.primary

        },


        name: {

            fontSize: 17,

            color:
                COLORS.textSecondary,

            marginTop: 4,

            marginBottom: 15

        },


        label: {

            fontSize: 13,

            color:
                COLORS.textSecondary,

            marginTop: 12

        },


        value: {

            fontSize: 17,

            color:
                COLORS.text,

            marginTop: 3

        },


        statusBadge: {

            alignSelf:
                'flex-start',

            marginTop: 7,

            paddingHorizontal: 14,

            paddingVertical: 7,

            borderRadius: 18

        },


        statusText: {

            fontSize: 14,

            fontWeight:
                'bold'

        },


        sectionHeader: {

            flexDirection:
                'row',

            justifyContent:
                'space-between',

            alignItems:
                'center',

            marginBottom: 10

        },


        sectionTitle: {

            fontSize: 19,

            fontWeight:
                'bold',

            color:
                COLORS.text

        },


        counter: {

            color:
                COLORS.textSecondary,

            marginTop: 3

        },


        addBirdButton: {

            backgroundColor:
                COLORS.primary,

            paddingHorizontal: 13,

            paddingVertical: 9,

            borderRadius: 18

        },


        addBirdText: {

            color:
                COLORS.white,

            fontWeight:
                'bold'

        },


        emptyBirds: {

            alignItems:
                'center',

            paddingVertical: 20

        },


        emptyBirdIcon: {

            fontSize: 36

        },


        emptyBirdTitle: {

            marginTop: 7,

            fontSize: 17,

            fontWeight:
                'bold',

            color:
                COLORS.text

        },


        description: {

            color:
                COLORS.textSecondary,

            lineHeight: 20,

            textAlign:
                'center',

            marginTop: 5

        },


        birdRow: {

            flexDirection:
                'row',

            alignItems:
                'center',

            borderTopWidth: 1,

            borderTopColor:
                COLORS.border,

            paddingVertical: 12

        },


        birdMain: {

            flex: 1,

            flexDirection:
                'row',

            alignItems:
                'center'

        },


        birdAvatar: {

            width: 50,

            height: 50,

            borderRadius: 25,

            backgroundColor:
                '#e7f5f5',

            alignItems:
                'center',

            justifyContent:
                'center'

        },


        birdPhoto: {

            width: 50,

            height: 50,

            borderRadius: 25,

            backgroundColor:
                '#e7f5f5'

        },


        birdAvatarText: {

            fontSize: 26

        },


        birdInfo: {

            flex: 1,

            marginLeft: 11

        },


        birdCode: {

            fontSize: 17,

            fontWeight:
                'bold',

            color:
                COLORS.text

        },


        birdBreed: {

            marginTop: 3,

            color:
                COLORS.textSecondary

        },


        removeBirdButton: {

            backgroundColor:
                '#fde9e7',

            paddingHorizontal: 11,

            paddingVertical: 8,

            borderRadius: 12

        },


        removeBirdText: {

            color:
                COLORS.danger,

            fontWeight:
                'bold',

            fontSize: 12

        },


        actionButton: {

            backgroundColor:
                COLORS.primary,

            padding: 14,

            borderRadius: 12,

            marginTop: 10

        },


        actionText: {

            color:
                COLORS.white,

            fontWeight:
                'bold',

            fontSize: 16,

            textAlign:
                'center'

        }

    });