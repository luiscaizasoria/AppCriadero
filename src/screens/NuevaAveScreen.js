import React, {
    useEffect,
    useMemo,
    useState
} from 'react';

import {
    View,
    Text,
    Image,
    TextInput,
    ScrollView,
    TouchableOpacity,
    StyleSheet,
    Alert,
    ActivityIndicator,
    KeyboardAvoidingView,
    Platform
} from 'react-native';

import DateTimePicker
    from '@react-native-community/datetimepicker';

import {
    crearAve,
    actualizarAve,
    existeAvePorCodigo,
    obtenerAvePorId,
    obtenerAvesActivasParaPadres,
    obtenerJaulasActivas
} from '../repositories/AveRepository';

import {
    seleccionarFotoGaleria,
    tomarFotoCamara,
    guardarFotoAve
} from '../services/ImageService';

import {
    obtenerCatalogoPorCodigo,
    obtenerItemsCatalogo
} from '../repositories/ConfiguracionRepository';


import SelectorCatalogo
    from '../components/SelectorCatalogo';


import {
    COLORS
} from '../config/constants';


const ORIGEN_NACIDA =
    'NACIDA_CRIADERO';

const ORIGEN_COMPRADA =
    'COMPRADA';


export default function NuevaAveScreen({
    navigation,
    route
}) {

    const aveIdEdicion =
        route?.params?.aveId ||
        null;


    const modoEdicion =
        !!aveIdEdicion;

    const [
        codigo,
        setCodigo
    ] = useState('');


    const [
        origen,
        setOrigen
    ] = useState(
        ORIGEN_NACIDA
    );


    const [
        fotoTemporal,
        setFotoTemporal
    ] = useState(null);


    const [
        fotoOriginal,
        setFotoOriginal
    ] = useState(null);


    const [
        fechaNacimiento,
        setFechaNacimiento
    ] = useState(
        new Date()
    );


    const [
        mostrarFechaNacimiento,
        setMostrarFechaNacimiento
    ] = useState(false);


    const [
        fechaIngreso,
        setFechaIngreso
    ] = useState(
        new Date()
    );


    const [
        mostrarFechaIngreso,
        setMostrarFechaIngreso
    ] = useState(false);


    const [
        edadMesesCompra,
        setEdadMesesCompra
    ] = useState('');


    const [
        criaderoOrigen,
        setCriaderoOrigen
    ] = useState('');


    const [
        metodoEnvio,
        setMetodoEnvio
    ] = useState('');


    const [
        raza,
        setRaza
    ] = useState('');


    const [
        razas,
        setRazas
    ] = useState([]);


    const [
        razaSeleccionada,
        setRazaSeleccionada
    ] = useState(null);


    const [
        sexos,
        setSexos
    ] = useState([]);


    const [
        sexoSeleccionado,
        setSexoSeleccionado
    ] = useState(null);


    const [
        sexo,
        setSexo
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
        caracteristicas,
        setCaracteristicas
    ] = useState('');


    const [
        padreId,
        setPadreId
    ] = useState(null);


    const [
        madreId,
        setMadreId
    ] = useState(null);


    const [
        jaulaId,
        setJaulaId
    ] = useState(null);


    const [
        avesPadres,
        setAvesPadres
    ] = useState([]);


    const [
        jaulas,
        setJaulas
    ] = useState([]);


    const [
        cargandoDatos,
        setCargandoDatos
    ] = useState(true);


    const [
        guardando,
        setGuardando
    ] = useState(false);


    useEffect(() => {

        cargarDatos();

    }, [
        aveIdEdicion
    ]);


    const fechaNacimientoCalculada =
        useMemo(() => {

            if (
                origen !==
                ORIGEN_COMPRADA
            ) {

                return null;

            }


            const meses =
                Number(
                    edadMesesCompra
                );


            if (
                !Number.isInteger(
                    meses
                )
                ||
                meses < 0
            ) {

                return null;

            }


            return restarMeses(
                fechaIngreso,
                meses
            );

        }, [
            origen,
            edadMesesCompra,
            fechaIngreso
        ]);


    const cargarDatos =
        async () => {

            try {

                setCargandoDatos(
                    true
                );


                const [
                    padresData,
                    jaulasData,
                    catalogoRazas,
                    catalogoSexos,
                    aveData
                ] =
                    await Promise.all([

                        obtenerAvesActivasParaPadres(
                            modoEdicion
                                ? aveIdEdicion
                                : null
                        ),

                        obtenerJaulasActivas(),

                        obtenerCatalogoPorCodigo(
                            'RAZAS'
                        ),

                        obtenerCatalogoPorCodigo(
                            'SEXOS'
                        ),

                        modoEdicion
                            ? obtenerAvePorId(
                                aveIdEdicion
                            )
                            : Promise.resolve(
                                null
                            )

                    ]);


                let razasData = [];

                if(catalogoRazas){

                    razasData =
                        await obtenerItemsCatalogo(
                            catalogoRazas.id
                        );

                }


                setRazas(
                    razasData
                );


                let sexosData = [];

                if(catalogoSexos){

                    sexosData =
                        await obtenerItemsCatalogo(
                            catalogoSexos.id
                        );

                }


                setSexos(
                    sexosData
                );


                setAvesPadres(
                    modoEdicion
                        ? padresData.filter(
                            item =>
                                Number(item.id) !==
                                Number(aveIdEdicion)
                        )
                        : padresData
                );


                setJaulas(
                    jaulasData
                );


                if(modoEdicion){

                    if(!aveData){

                        throw new Error(
                            'AVE_NO_ENCONTRADA'
                        );

                    }


                    if(
                        aveData.estado !==
                        'ACTIVA'
                    ){

                        throw new Error(
                            'AVE_NO_ACTIVA'
                        );

                    }


                    setCodigo(
                        aveData.codigo ||
                        ''
                    );


                    setOrigen(
                        aveData.origen ||
                        ORIGEN_NACIDA
                    );


                    setFotoTemporal(
                        aveData.foto_uri ||
                        null
                    );


                    setFotoOriginal(
                        aveData.foto_uri ||
                        null
                    );


                    if(
                        aveData.fecha_nacimiento
                    ){

                        setFechaNacimiento(
                            fechaDesdeISO(
                                aveData.fecha_nacimiento
                            )
                        );

                    }


                    if(
                        aveData.fecha_ingreso
                    ){

                        setFechaIngreso(
                            fechaDesdeISO(
                                aveData.fecha_ingreso
                            )
                        );

                    }


                    setEdadMesesCompra(
                        aveData.edad_meses_compra ===
                        null
                        ||
                        aveData.edad_meses_compra ===
                        undefined

                            ? ''

                            : String(
                                aveData.edad_meses_compra
                            )
                    );


                    setCriaderoOrigen(
                        aveData.criadero_origen ||
                        ''
                    );


                    setMetodoEnvio(
                        aveData.metodo_envio ||
                        ''
                    );


                    setRaza(
                        aveData.raza ||
                        ''
                    );


                    const razaActual =
                        razasData.find(
                            item =>
                                String(
                                    item.nombre ||
                                    ''
                                )
                                    .trim()
                                    .toLowerCase()
                                ===
                                String(
                                    aveData.raza ||
                                    ''
                                )
                                    .trim()
                                    .toLowerCase()
                        )
                        ||
                        null;


                    setRazaSeleccionada(
                        razaActual
                    );


                    setSexo(
                        aveData.sexo ||
                        ''
                    );


                    const sexoActual =
                        sexosData.find(
                            item =>
                                String(
                                    item.codigo ||
                                    ''
                                )
                                    .trim()
                                    .toUpperCase()
                                ===
                                String(
                                    aveData.sexo ||
                                    ''
                                )
                                    .trim()
                                    .toUpperCase()
                        )
                        ||
                        null;


                    setSexoSeleccionado(
                        sexoActual
                    );


                    setPesoGramos(
                        aveData.peso_gramos === null
                        ||
                        aveData.peso_gramos === undefined
                            ? ''
                            : String(
                                aveData.peso_gramos
                            )
                    );


                    setAlturaCm(
                        aveData.altura_cm === null
                        ||
                        aveData.altura_cm === undefined
                            ? ''
                            : String(
                                aveData.altura_cm
                            )
                    );


                    setLargoCm(
                        aveData.largo_cm === null
                        ||
                        aveData.largo_cm === undefined
                            ? ''
                            : String(
                                aveData.largo_cm
                            )
                    );


                    setCaracteristicas(
                        aveData.caracteristicas ||
                        ''
                    );


                    setPadreId(
                        aveData.padre_id ||
                        null
                    );


                    setMadreId(
                        aveData.madre_id ||
                        null
                    );


                    setJaulaId(
                        aveData.jaula_actual_id ||
                        null
                    );

                }

            }
            catch (error) {

                console.error(
                    modoEdicion
                        ? 'Error cargando datos para editar ave:'
                        : 'Error cargando datos para nueva ave:',
                    error
                );


                const mensaje =
                    String(
                        error?.message ||
                        ''
                    );


                if(
                    mensaje.includes(
                        'AVE_NO_ACTIVA'
                    )
                ){

                    Alert.alert(
                        'Edición no disponible',
                        'Solo se pueden editar aves activas.',
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
                else {

                    Alert.alert(
                        'Error',
                        modoEdicion
                            ? 'No fue posible cargar los datos del ave.'
                            : 'No fue posible cargar las aves o jaulas disponibles.'
                    );

                }

            }
            finally {

                setCargandoDatos(
                    false
                );

            }

        };

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

            const codigoLimpio =
                codigo
                    .trim()
                    .toUpperCase();


            if (!codigoLimpio) {

                Alert.alert(
                    'Código requerido',
                    'Ingresa un código para el ave.'
                );

                return;

            }


            if (!razaSeleccionada) {

                Alert.alert(
                    'Raza requerida',
                    'Selecciona la raza del ave.'
                );

                return;

            }


            if (!sexoSeleccionado) {

                Alert.alert(
                    'Sexo requerido',
                    'Selecciona si el ave es macho o hembra.'
                );

                return;

            }


            const pesoResultado =
                convertirNumeroOpcional(
                    pesoGramos
                );


            if (!pesoResultado.valido) {

                Alert.alert(
                    'Peso inválido',
                    'El peso debe ser un número mayor a cero o dejarse vacío.'
                );

                return;

            }


            const alturaResultado =
                convertirNumeroOpcional(
                    alturaCm
                );


            if (!alturaResultado.valido) {

                Alert.alert(
                    'Altura inválida',
                    'La altura debe ser un número mayor a cero o dejarse vacía.'
                );

                return;

            }


            const largoResultado =
                convertirNumeroOpcional(
                    largoCm
                );


            if (!largoResultado.valido) {

                Alert.alert(
                    'Largo inválido',
                    'El largo debe ser un número mayor a cero o dejarse vacío.'
                );

                return;

            }


            if (
                padreId
                &&
                madreId
                &&
                padreId === madreId
            ) {

                Alert.alert(
                    'Padres inválidos',
                    'El padre y la madre no pueden ser la misma ave.'
                );

                return;

            }


            let fechaNacimientoGuardar =
                null;


            let edadMesesGuardar =
                null;


            let fechaIngresoGuardar =
                null;


            let criaderoOrigenGuardar =
                null;


            let metodoEnvioGuardar =
                null;


            if (
                origen ===
                ORIGEN_NACIDA
            ) {

                fechaNacimientoGuardar =
                    fechaLocalISO(
                        fechaNacimiento
                    );

            }
            else {

                const meses =
                    Number(
                        edadMesesCompra
                    );


                if (
                    !Number.isInteger(
                        meses
                    )
                    ||
                    meses < 0
                ) {

                    Alert.alert(
                        'Edad requerida',
                        'Ingresa la edad del ave en meses usando un número entero igual o mayor a cero.'
                    );

                    return;

                }


                if (
                    !criaderoOrigen
                        .trim()
                ) {

                    Alert.alert(
                        'Criadero requerido',
                        'Ingresa el nombre del criadero de origen.'
                    );

                    return;

                }


                if (
                    !metodoEnvio
                        .trim()
                ) {

                    Alert.alert(
                        'Método de envío requerido',
                        'Ingresa el método de envío o traslado del ave.'
                    );

                    return;

                }


                edadMesesGuardar =
                    meses;


                fechaIngresoGuardar =
                    fechaLocalISO(
                        fechaIngreso
                    );


                fechaNacimientoGuardar =
                    fechaNacimientoCalculada
                        ? fechaLocalISO(
                            fechaNacimientoCalculada
                        )
                        : null;


                criaderoOrigenGuardar =
                    criaderoOrigen
                        .trim();


                metodoEnvioGuardar =
                    metodoEnvio
                        .trim();

            }


            try {

                setGuardando(
                    true
                );


                const codigoExiste =
                    await existeAvePorCodigo(
                        codigoLimpio,
                        modoEdicion
                            ? aveIdEdicion
                            : null
                    );


                if(codigoExiste){

                    Alert.alert(
                        'Código duplicado',
                        'Ya existe un ave con ese código.'
                    );

                    return;

                }


                let fotoFinal =
                    fotoTemporal ||
                    null;


                if (
                    fotoTemporal
                    &&
                    (
                        !modoEdicion
                        ||
                        fotoTemporal !==
                        fotoOriginal
                    )
                ) {

                    fotoFinal =
                        await guardarFotoAve(
                            fotoTemporal,
                            codigoLimpio
                        );

                }


                if(modoEdicion){

                    await actualizarAve({

                        id:
                            aveIdEdicion,

                        codigo:
                            codigoLimpio,

                        origen,

                        fechaNacimiento:
                            fechaNacimientoGuardar,

                        edadMesesCompra:
                            edadMesesGuardar,

                        fechaIngreso:
                            fechaIngresoGuardar,

                        criaderoOrigen:
                            criaderoOrigenGuardar,

                        metodoEnvio:
                            metodoEnvioGuardar,

                        raza:
                            raza.trim(),

                        sexo:
                            sexo,

                        pesoGramos:
                            pesoResultado.valor,

                        alturaCm:
                            alturaResultado.valor,

                        largoCm:
                            largoResultado.valor,

                        caracteristicas:
                            caracteristicas
                                .trim(),

                        fotoUri:
                            fotoFinal,

                        padreId:
                            origen ===
                            ORIGEN_NACIDA
                                ? padreId
                                : null,

                        madreId:
                            origen ===
                            ORIGEN_NACIDA
                                ? madreId
                                : null

                    });


                    Alert.alert(

                        'Ave actualizada',

                        `Los datos del ave ${codigoLimpio} fueron actualizados correctamente.`,

                        [
                            {
                                text:
                                    'Aceptar',

                                onPress: () =>
                                    navigation.goBack()
                            }
                        ]

                    );


                    return;

                }


                const aveId =
                    await crearAve({

                        codigo:
                            codigoLimpio,

                        origen,

                        fechaNacimiento:
                            fechaNacimientoGuardar,

                        edadMesesCompra:
                            edadMesesGuardar,

                        fechaIngreso:
                            fechaIngresoGuardar,

                        criaderoOrigen:
                            criaderoOrigenGuardar,

                        metodoEnvio:
                            metodoEnvioGuardar,

                        raza:
                            raza.trim(),

                        sexo:
                            sexo,

                        pesoGramos:
                            pesoResultado.valor,

                        alturaCm:
                            alturaResultado.valor,

                        largoCm:
                            largoResultado.valor,

                        caracteristicas:
                            caracteristicas
                                .trim(),

                        fotoUri:
                            fotoFinal,

                        padreId:
                            origen ===
                            ORIGEN_NACIDA
                                ? padreId
                                : null,

                        madreId:
                            origen ===
                            ORIGEN_NACIDA
                                ? madreId
                                : null,

                        jaulaId

                    });


                Alert.alert(

                    'Ave registrada',

                    `El ave ${codigoLimpio} fue registrada correctamente.`,

                    [
                        {
                            text:
                                'Ver ave',

                            onPress: () =>
                                navigation.replace(
                                    'DetalleAve',
                                    {
                                        aveId
                                    }
                                )
                        }
                    ]

                );

            }
            catch (error) {

                const mensaje =
                    String(
                        error?.message ||
                        ''
                    )
                        .toLowerCase();


                const esCodigoDuplicado =
                    (
                        mensaje.includes(
                            'unique'
                        )
                        &&
                        mensaje.includes(
                            'aves.codigo'
                        )
                    )
                    ||
                    mensaje.includes(
                        'codigo_ave_duplicado'
                    );


                if(esCodigoDuplicado){

                    Alert.alert(
                        'Código duplicado',
                        'Ya existe un ave con ese código.'
                    );

                    return;

                }


                if(
                    mensaje.includes(
                        'parentesco_circular_padre'
                    )
                ){

                    Alert.alert(
                        'Relación genealógica inválida',
                        'El ave seleccionada como padre es descendiente de esta misma ave. Esto generaría un ciclo imposible en el árbol genealógico.'
                    );

                    return;

                }


                if(
                    mensaje.includes(
                        'parentesco_circular_madre'
                    )
                ){

                    Alert.alert(
                        'Relación genealógica inválida',
                        'El ave seleccionada como madre es descendiente de esta misma ave. Esto generaría un ciclo imposible en el árbol genealógico.'
                    );

                    return;

                }


                if(
                    mensaje.includes(
                        'padre_es_misma_ave'
                    )
                    ||
                    mensaje.includes(
                        'madre_es_misma_ave'
                    )
                ){

                    Alert.alert(
                        'Relación genealógica inválida',
                        'Un ave no puede registrarse a sí misma como padre o madre.'
                    );

                    return;

                }


                if(
                    mensaje.includes(
                        'padres_iguales'
                    )
                ){

                    Alert.alert(
                        'Padres inválidos',
                        'El padre y la madre no pueden ser la misma ave.'
                    );

                    return;

                }


                if(
                    mensaje.includes(
                        'padre_no_macho'
                    )
                    ||
                    mensaje.includes(
                        'madre_no_hembra'
                    )
                ){

                    Alert.alert(
                        'Sexo del progenitor inválido',
                        mensaje.includes(
                            'padre_no_macho'
                        )
                            ? 'El ejemplar seleccionado como padre debe estar registrado como macho.'
                            : 'El ejemplar seleccionado como madre debe estar registrado como hembra.'
                    );

                    return;

                }


                console.error(
                    'Error registrando ave:',
                    error
                );


                Alert.alert(
                    'Error',
                    modoEdicion
                        ? 'No fue posible actualizar el ave.'
                        : 'No fue posible registrar el ave.'
                );

            }
            finally {

                setGuardando(
                    false
                );

            }

        };


    if (cargandoDatos) {

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
                    {
                        modoEdicion
                            ? 'Cargando datos del ave...'
                            : 'Preparando formulario...'
                    }
                </Text>

            </View>

        );

    }


    return (

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
                    {
                        modoEdicion
                            ? '✏️ Editar ave'
                            : '🐔 Nueva ave'
                    }
                </Text>


                <Text
                    style={
                        styles.subtitle
                    }
                >
                    {
                        modoEdicion
                            ? 'Actualiza los datos generales del ave. La jaula, salud, huevos y bajas se administran desde sus procesos correspondientes.'
                            : 'Registra el origen y los datos iniciales del ave.'
                    }
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
                        codigo
                    }
                    onChangeText={
                        setCodigo
                    }
                    placeholder="Ej. K001"
                    autoCapitalize="characters"
                    maxLength={30}
                />


                <Text
                    style={
                        styles.sectionTitle
                    }
                >
                    Fotografía
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


                <Text
                    style={
                        styles.sectionTitle
                    }
                >
                    Origen del ave
                </Text>


                <View
                    style={
                        styles.options
                    }
                >

                    <TouchableOpacity
                        style={[
                            styles.originButton,

                            origen ===
                            ORIGEN_NACIDA
                            &&
                            styles.selected
                        ]}
                        onPress={() =>
                            setOrigen(
                                ORIGEN_NACIDA
                            )
                        }
                    >

                        <Text
                            style={[
                                styles.optionText,

                                origen ===
                                ORIGEN_NACIDA
                                &&
                                styles.selectedText
                            ]}
                        >
                            🐣 Nacida en criadero
                        </Text>

                    </TouchableOpacity>


                    <TouchableOpacity
                        style={[
                            styles.originButton,

                            origen ===
                            ORIGEN_COMPRADA
                            &&
                            styles.selected
                        ]}
                        onPress={() =>
                            setOrigen(
                                ORIGEN_COMPRADA
                            )
                        }
                    >

                        <Text
                            style={[
                                styles.optionText,

                                origen ===
                                ORIGEN_COMPRADA
                                &&
                                styles.selectedText
                            ]}
                        >
                            🛒 Comprada
                        </Text>

                    </TouchableOpacity>

                </View>


                {
                    origen ===
                    ORIGEN_NACIDA
                        ? (

                            <>

                                <Text
                                    style={
                                        styles.label
                                    }
                                >
                                    Fecha de nacimiento *
                                </Text>


                                <TouchableOpacity
                                    style={
                                        styles.input
                                    }
                                    onPress={() =>
                                        setMostrarFechaNacimiento(
                                            true
                                        )
                                    }
                                >

                                    <Text>
                                        {
                                            fechaNacimiento
                                                .toLocaleDateString()
                                        }
                                    </Text>

                                </TouchableOpacity>


                                {
                                    mostrarFechaNacimiento
                                    && (

                                        <DateTimePicker
                                            value={
                                                fechaNacimiento
                                            }
                                            mode="date"
                                            maximumDate={
                                                new Date()
                                            }
                                            onChange={(
                                                event,
                                                selectedDate
                                            ) => {

                                                setMostrarFechaNacimiento(
                                                    false
                                                );


                                                if (
                                                    event.type ===
                                                    'set'
                                                    &&
                                                    selectedDate
                                                ) {

                                                    setFechaNacimiento(
                                                        selectedDate
                                                    );

                                                }

                                            }}
                                        />

                                    )
                                }


                                <Text
                                    style={
                                        styles.sectionTitle
                                    }
                                >
                                    Padres
                                </Text>


                                <Text
                                    style={
                                        styles.helpText
                                    }
                                >
                                    Son opcionales. Selecciona únicamente si conoces la trazabilidad de los padres. Al editar, los descendientes de esta ave se excluyen para evitar relaciones circulares.
                                </Text>


                                <Text
                                    style={
                                        styles.label
                                    }
                                >
                                    Padre
                                </Text>


                                <SelectorAve
                                    aves={
                                        avesPadres.filter(
                                            item =>
                                                item.sexo === 'MACHO'
                                                ||
                                                Number(item.id) === Number(padreId)
                                        )
                                    }
                                    selectedId={
                                        padreId
                                    }
                                    onSelect={
                                        setPadreId
                                    }
                                    emptyText="Todavía no existen aves disponibles para seleccionar como padre."
                                />


                                <Text
                                    style={
                                        styles.label
                                    }
                                >
                                    Madre
                                </Text>


                                <SelectorAve
                                    aves={
                                        avesPadres.filter(
                                            item =>
                                                item.sexo === 'HEMBRA'
                                                ||
                                                Number(item.id) === Number(madreId)
                                        )
                                    }
                                    selectedId={
                                        madreId
                                    }
                                    onSelect={
                                        setMadreId
                                    }
                                    emptyText="Todavía no existen aves disponibles para seleccionar como madre."
                                />

                            </>

                        )
                        : (

                            <>

                                <Text
                                    style={
                                        styles.label
                                    }
                                >
                                    Edad al ingresar en meses *
                                </Text>


                                <TextInput
                                    style={
                                        styles.input
                                    }
                                    value={
                                        edadMesesCompra
                                    }
                                    onChangeText={
                                        text =>
                                            setEdadMesesCompra(
                                                text.replace(
                                                    /[^0-9]/g,
                                                    ''
                                                )
                                            )
                                    }
                                    keyboardType="numeric"
                                    placeholder="Ej. 8"
                                />


                                <Text
                                    style={
                                        styles.label
                                    }
                                >
                                    Fecha de ingreso *
                                </Text>


                                <TouchableOpacity
                                    style={
                                        styles.input
                                    }
                                    onPress={() =>
                                        setMostrarFechaIngreso(
                                            true
                                        )
                                    }
                                >

                                    <Text>
                                        {
                                            fechaIngreso
                                                .toLocaleDateString()
                                        }
                                    </Text>

                                </TouchableOpacity>


                                {
                                    mostrarFechaIngreso
                                    && (

                                        <DateTimePicker
                                            value={
                                                fechaIngreso
                                            }
                                            mode="date"
                                            maximumDate={
                                                new Date()
                                            }
                                            onChange={(
                                                event,
                                                selectedDate
                                            ) => {

                                                setMostrarFechaIngreso(
                                                    false
                                                );


                                                if (
                                                    event.type ===
                                                    'set'
                                                    &&
                                                    selectedDate
                                                ) {

                                                    setFechaIngreso(
                                                        selectedDate
                                                    );

                                                }

                                            }}
                                        />

                                    )
                                }


                                <View
                                    style={
                                        styles.calculatedCard
                                    }
                                >

                                    <Text
                                        style={
                                            styles.calculatedLabel
                                        }
                                    >
                                        Fecha de nacimiento estimada
                                    </Text>


                                    <Text
                                        style={
                                            styles.calculatedValue
                                        }
                                    >
                                        {
                                            fechaNacimientoCalculada
                                                ? fechaNacimientoCalculada
                                                    .toLocaleDateString()
                                                : 'Ingresa la edad en meses'
                                        }
                                    </Text>

                                </View>


                                <Text
                                    style={
                                        styles.label
                                    }
                                >
                                    Criadero de origen *
                                </Text>


                                <TextInput
                                    style={
                                        styles.input
                                    }
                                    value={
                                        criaderoOrigen
                                    }
                                    onChangeText={
                                        setCriaderoOrigen
                                    }
                                    placeholder="Nombre del criadero"
                                />


                                <Text
                                    style={
                                        styles.label
                                    }
                                >
                                    Método de envío / traslado *
                                </Text>


                                <TextInput
                                    style={
                                        styles.input
                                    }
                                    value={
                                        metodoEnvio
                                    }
                                    onChangeText={
                                        setMetodoEnvio
                                    }
                                    placeholder="Ej. Cooperativa, vehículo propio..."
                                />

                            </>

                        )
                }


                <Text
                    style={
                        styles.sectionTitle
                    }
                >
                    Datos generales
                </Text>


                <Text
                    style={
                        styles.label
                    }
                >
                    Raza *
                </Text>


                <SelectorCatalogo

                    items={
                        razas
                    }

                    selectedId={
                        razaSeleccionada?.id
                    }

                    onSelect={item=>{

                        setRazaSeleccionada(
                            item
                        );

                        setRaza(
                            item.nombre
                        );

                    }}

                />


                <Text
                    style={
                        styles.label
                    }
                >
                    Sexo *
                </Text>


                <SelectorCatalogo
                    items={
                        sexos
                    }
                    selectedId={
                        sexoSeleccionado?.id
                    }
                    onSelect={item=>{

                        setSexoSeleccionado(
                            item
                        );

                        setSexo(
                            item.codigo
                        );

                    }}
                />


                <Text
                    style={
                        styles.sectionTitle
                    }
                >
                    Medidas actuales
                </Text>


                <Text
                    style={
                        styles.helpText
                    }
                >
                    Son opcionales. Puedes completarlas ahora o agregarlas posteriormente al editar el ave.
                </Text>


                <Text
                    style={
                        styles.label
                    }
                >
                    Peso en gramos
                </Text>


                <TextInput
                    style={
                        styles.input
                    }
                    value={
                        pesoGramos
                    }
                    onChangeText={text =>
                        setPesoGramos(
                            normalizarEntradaDecimal(
                                text
                            )
                        )
                    }
                    keyboardType="decimal-pad"
                    placeholder="Ej. 850"
                />


                <Text
                    style={
                        styles.label
                    }
                >
                    Altura en centímetros
                </Text>


                <TextInput
                    style={
                        styles.input
                    }
                    value={
                        alturaCm
                    }
                    onChangeText={text =>
                        setAlturaCm(
                            normalizarEntradaDecimal(
                                text
                            )
                        )
                    }
                    keyboardType="decimal-pad"
                    placeholder="Ej. 24.5"
                />


                <Text
                    style={
                        styles.label
                    }
                >
                    Largo en centímetros
                </Text>


                <TextInput
                    style={
                        styles.input
                    }
                    value={
                        largoCm
                    }
                    onChangeText={text =>
                        setLargoCm(
                            normalizarEntradaDecimal(
                                text
                            )
                        )
                    }
                    keyboardType="decimal-pad"
                    placeholder="Ej. 31"
                />


                <Text
                    style={
                        styles.label
                    }
                >
                    Características
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
                    placeholder="Color, plumaje, comportamiento, tamaño u otras características..."
                />


                {
                    !modoEdicion
                    &&
                    (
                        <>

                                            <Text
                                                style={
                                                    styles.sectionTitle
                                                }
                                            >
                                                Jaula inicial
                                            </Text>


                                            <Text
                                                style={
                                                    styles.helpText
                                                }
                                            >
                                                Puedes asignarla ahora o dejar el ave sin jaula.
                                            </Text>


                                            <SelectorJaula
                                                jaulas={
                                                    jaulas
                                                }
                                                selectedId={
                                                    jaulaId
                                                }
                                                onSelect={
                                                    setJaulaId
                                                }
                                            />

                        </>
                    )
                }


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
                                : modoEdicion
                                    ? '💾 Guardar cambios'
                                    : '💾 Guardar ave'
                        }
                    </Text>

                </TouchableOpacity>

            </ScrollView>

        </KeyboardAvoidingView>

    );

}


function SelectorAve({
    aves,
    selectedId,
    onSelect,
    emptyText
}) {

    if (
        aves.length === 0
    ) {

        return (

            <Text
                style={
                    styles.helpText
                }
            >
                {emptyText}
            </Text>

        );

    }


    return (

        <View
            style={
                styles.options
            }
        >

            <TouchableOpacity
                style={[
                    styles.smallOption,

                    selectedId === null
                    &&
                    styles.selected
                ]}
                onPress={() =>
                    onSelect(
                        null
                    )
                }
            >

                <Text
                    style={[
                        styles.optionText,

                        selectedId === null
                        &&
                        styles.selectedText
                    ]}
                >
                    Sin seleccionar
                </Text>

            </TouchableOpacity>


            {
                aves.map(
                    ave => (

                        <TouchableOpacity
                            key={
                                ave.id
                            }
                            style={[
                                styles.smallOption,

                                selectedId ===
                                ave.id
                                &&
                                styles.selected
                            ]}
                            onPress={() =>
                                onSelect(
                                    ave.id
                                )
                            }
                        >

                            <Text
                                style={[
                                    styles.optionText,

                                    selectedId ===
                                    ave.id
                                    &&
                                    styles.selectedText
                                ]}
                            >
                                🐔 {ave.codigo}
                            </Text>

                        </TouchableOpacity>

                    )
                )
            }

        </View>

    );

}


function SelectorJaula({
    jaulas,
    selectedId,
    onSelect
}) {

    return (

        <View
            style={
                styles.options
            }
        >

            <TouchableOpacity
                style={[
                    styles.smallOption,

                    selectedId === null
                    &&
                    styles.selected
                ]}
                onPress={() =>
                    onSelect(
                        null
                    )
                }
            >

                <Text
                    style={[
                        styles.optionText,

                        selectedId === null
                        &&
                        styles.selectedText
                    ]}
                >
                    Sin jaula
                </Text>

            </TouchableOpacity>


            {
                jaulas.map(
                    jaula => (

                        <TouchableOpacity
                            key={
                                jaula.id
                            }
                            style={[
                                styles.smallOption,

                                selectedId ===
                                jaula.id
                                &&
                                styles.selected
                            ]}
                            onPress={() =>
                                onSelect(
                                    jaula.id
                                )
                            }
                        >

                            <Text
                                style={[
                                    styles.optionText,

                                    selectedId ===
                                    jaula.id
                                    &&
                                    styles.selectedText
                                ]}
                            >
                                🏠 {jaula.codigo}
                            </Text>

                        </TouchableOpacity>

                    )
                )
            }

        </View>

    );

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
            'Debes permitir el acceso a la cámara.'
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
            'Debes permitir el acceso a las fotografías.'
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


function fechaDesdeISO(
    valor
) {

    const texto =
        String(
            valor ||
            ''
        )
            .substring(
                0,
                10
            );


    const partes =
        texto
            .split(
                '-'
            )
            .map(
                Number
            );


    if(
        partes.length !== 3
        ||
        !partes[0]
        ||
        !partes[1]
        ||
        !partes[2]
    ){

        return new Date();

    }


    return new Date(
        partes[0],
        partes[1] - 1,
        partes[2]
    );

}


function normalizarEntradaDecimal(
    valor
) {

    const texto =
        String(
            valor || ''
        )
            .replace(
                ',',
                '.'
            )
            .replace(
                /[^0-9.]/g,
                ''
            );


    const partes =
        texto.split('.');


    if (
        partes.length <= 2
    ) {

        return texto;

    }


    return `${partes.shift()}.${partes.join('')}`;

}


function convertirNumeroOpcional(
    valor
) {

    const texto =
        String(
            valor || ''
        )
            .trim()
            .replace(
                ',',
                '.'
            );


    if (!texto) {

        return {
            valido: true,
            valor: null
        };

    }


    const numero =
        Number(
            texto
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


function fechaLocalISO(
    date
) {

    const year =
        date.getFullYear();


    const month =
        String(
            date.getMonth() + 1
        )
            .padStart(
                2,
                '0'
            );


    const day =
        String(
            date.getDate()
        )
            .padStart(
                2,
                '0'
            );


    return `${year}-${month}-${day}`;

}


function restarMeses(
    date,
    months
) {

    const result =
        new Date(
            date
        );


    const originalDay =
        result.getDate();


    result.setDate(
        1
    );


    result.setMonth(
        result.getMonth()
        -
        months
    );


    const lastDay =
        new Date(
            result.getFullYear(),
            result.getMonth() + 1,
            0
        )
            .getDate();


    result.setDate(
        Math.min(
            originalDay,
            lastDay
        )
    );


    return result;

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

            fontSize: 27,

            fontWeight:
                'bold',

            color:
                COLORS.primary

        },


        subtitle: {

            color:
                COLORS.textSecondary,

            marginTop: 5,

            marginBottom: 20

        },


        sectionTitle: {

            fontSize: 19,

            fontWeight:
                'bold',

            color:
                COLORS.text,

            marginTop: 24,

            marginBottom: 8

        },


        label: {

            fontSize: 15,

            fontWeight:
                '600',

            color:
                COLORS.text,

            marginTop: 14,

            marginBottom: 6

        },


        helpText: {

            color:
                COLORS.textSecondary,

            lineHeight: 20,

            marginBottom: 8

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

            minHeight: 110,

            textAlignVertical:
                'top'

        },


        photoContainer: {

            alignItems:
                'center',

            marginTop: 5,

            marginBottom: 15

        },


        photo: {

            width: 190,

            height: 190,

            borderRadius: 22,

            backgroundColor:
                '#e7f5f5'

        },


        photoPlaceholder: {

            width: 190,

            height: 190,

            borderRadius: 22,

            backgroundColor:
                '#e7f5f5',

            alignItems:
                'center',

            justifyContent:
                'center'

        },


        photoPlaceholderIcon: {

            fontSize: 56

        },


        photoPlaceholderText: {

            color:
                COLORS.textSecondary,

            marginTop: 7

        },


        photoActions: {

            flexDirection:
                'row',

            justifyContent:
                'space-between'

        },


        photoButton: {

            width:
                '48%',

            backgroundColor:
                COLORS.primary,

            borderRadius: 12,

            paddingVertical: 12,

            alignItems:
                'center'

        },


        photoButtonText: {

            color:
                COLORS.white,

            fontWeight:
                'bold'

        },


        options: {

            flexDirection:
                'row',

            flexWrap:
                'wrap',

            marginTop: 4

        },


        originButton: {

            backgroundColor:
                '#e8eeee',

            paddingHorizontal: 15,

            paddingVertical: 12,

            borderRadius: 20,

            marginRight: 8,

            marginBottom: 8

        },


        smallOption: {

            backgroundColor:
                '#e8eeee',

            paddingHorizontal: 12,

            paddingVertical: 9,

            borderRadius: 18,

            marginRight: 7,

            marginBottom: 8

        },


        selected: {

            backgroundColor:
                COLORS.primary

        },


        optionText: {

            color:
                COLORS.text

        },


        selectedText: {

            color:
                COLORS.white,

            fontWeight:
                'bold'

        },


        calculatedCard: {

            backgroundColor:
                '#e7f5f5',

            borderRadius: 12,

            padding: 14,

            marginTop: 14

        },


        calculatedLabel: {

            fontSize: 13,

            color:
                COLORS.textSecondary

        },


        calculatedValue: {

            fontSize: 18,

            fontWeight:
                'bold',

            color:
                COLORS.primary,

            marginTop: 4

        },


        saveButton: {

            backgroundColor:
                COLORS.primary,

            borderRadius: 14,

            paddingVertical: 16,

            alignItems:
                'center',

            marginTop: 35

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