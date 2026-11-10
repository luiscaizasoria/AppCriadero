import React, {
    useEffect,
    useMemo,
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


import AveSelectorCatalogo
    from '../components/AveSelectorCatalogo';

import AveOpcion
    from '../components/AveOpcion';

import FondoPantalla
    from '../components/FondoPantalla';

import Tarjeta
    from '../components/Tarjeta';

import TituloSeccion
    from '../components/TituloSeccion';

import useValidacion
    from '../components/useValidacion';

import CampoGrupo
    from '../components/CampoGrupo';

import CampoTexto
    from '../components/CampoTexto';

import Boton
    from '../components/Boton';

import Aviso
    from '../components/Aviso';
import BarraAccion
    from '../components/BarraAccion';

import Icono
    from '../components/Icono';

import IconoCirculo
    from '../components/IconoCirculo';

import Pulsable
    from '../components/Pulsable';

import EstadoCarga
    from '../components/EstadoCarga';

import {
    colors,
    radii,
    spacing,
    typography
} from '../theme';


const ORIGEN_NACIDA =
    'NACIDA_CRIADERO';

const ORIGEN_COMPRADA =
    'COMPRADA';

// Espera antes de navegar para que se vea el aviso de éxito (sustituye al Alert de éxito)
const ESPERA_AVISO_MS =
    1500;


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


    // Aviso de éxito (no bloqueante) y bloqueo de nuevos envíos hasta navegar
    const [
        aviso,
        setAviso
    ] = useState(null);


    const [
        guardado,
        setGuardado
    ] = useState(false);


    const enviandoRef =
        useRef(false);


    const scrollRef =
        useRef(null);


    const v =
        useValidacion(
            scrollRef
        );


    const temporizadorRef =
        useRef(null);


    useEffect(() => {

        cargarDatos();

    }, [
        aveIdEdicion
    ]);


    useEffect(() => {

        return () => {

            if(temporizadorRef.current){

                clearTimeout(
                    temporizadorRef.current
                );

            }

        };

    }, []);


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


    // Muestra el aviso de éxito y, pasado un instante, hace la navegación que antes hacía «Aceptar»
    const avisarYNavegar =
        (
            titulo,
            mensaje,
            destino
        ) => {

            setAviso({
                titulo,
                mensaje
            });

            setGuardado(
                true
            );

            temporizadorRef.current =
                setTimeout(
                    destino,
                    ESPERA_AVISO_MS
                );

        };


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

            // Sin doble toque mientras se envía o se muestra el aviso de éxito
            if (enviandoRef.current) {

                return;

            }


            const codigoLimpio =
                codigo
                    .trim()
                    .toUpperCase();


            if (!codigoLimpio) {

                v.fallar(
                    'codigo',
                    'Ingresa un código para el ave.'
                );

                Alert.alert(
                    'Código requerido',
                    'Ingresa un código para el ave.'
                );

                return;

            }


            if (!razaSeleccionada) {

                v.fallar(
                    'raza',
                    'Selecciona la raza del ave.'
                );

                Alert.alert(
                    'Raza requerida',
                    'Selecciona la raza del ave.'
                );

                return;

            }


            if (!sexoSeleccionado) {

                v.fallar(
                    'sexo',
                    'Selecciona si el ave es macho o hembra.'
                );

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

                v.fallar(
                    'peso',
                    'El peso debe ser un número mayor a cero o dejarse vacío.'
                );

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

                v.fallar(
                    'altura',
                    'La altura debe ser un número mayor a cero o dejarse vacía.'
                );

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

                v.fallar(
                    'largo',
                    'El largo debe ser un número mayor a cero o dejarse vacío.'
                );

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

                v.fallar(
                    ['padre', 'madre'],
                    [
                        'El padre y la madre no pueden ser la misma ave.',
                        'El padre y la madre no pueden ser la misma ave.'
                    ]
                );

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

                    v.fallar(
                        'edad',
                        'Ingresa la edad del ave en meses usando un número entero igual o mayor a cero.'
                    );

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

                    v.fallar(
                        'criaderoOrigen',
                        'Ingresa el nombre del criadero de origen.'
                    );

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

                    v.fallar(
                        'metodoEnvio',
                        'Ingresa el método de envío o traslado del ave.'
                    );

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


            let exito =
                false;


            try {

                enviandoRef.current =
                    true;


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

                    v.fallar(
                        'codigo',
                        'Ya existe un ave con ese código.'
                    );

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


                    exito =
                        true;


                    avisarYNavegar(

                        'Ave actualizada',

                        `Los datos del ave ${codigoLimpio} fueron actualizados correctamente.`,

                        () =>
                            navigation.goBack()

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


                exito =
                    true;


                // «Ver ave» directo: tras registrar, navega a la ficha (mismo destino que la
                // acción «Ver ave» del Alert anterior) después de mostrar el aviso.
                avisarYNavegar(

                    'Ave registrada',

                    `El ave ${codigoLimpio} fue registrada correctamente.`,

                    () =>
                        navigation.replace(
                            'DetalleAve',
                            {
                                aveId
                            }
                        )

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

                    v.fallar(
                        ['padre', 'madre'],
                        'El padre y la madre no pueden ser la misma ave.'
                    );

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

                if(!exito){

                    enviandoRef.current =
                        false;

                }


                setGuardando(
                    false
                );

            }

        };


    if (cargandoDatos) {

        return (

            <FondoPantalla>

                <View
                    style={
                        styles.center
                    }
                >

                    <EstadoCarga
                        mensaje={
                            modoEdicion
                                ? 'Cargando datos del ave...'
                                : 'Preparando formulario...'
                        }
                    />

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
                contentContainerStyle={
                    styles.content
                }
                keyboardShouldPersistTaps="handled"
            >

                <Text
                    style={
                        styles.intro
                    }
                >
                    {
                        modoEdicion
                            ? 'Actualiza los datos generales del ave. La jaula, salud, huevos y bajas se administran desde sus procesos correspondientes.'
                            : 'Registra el origen y los datos iniciales del ave.'
                    }
                </Text>


                <Tarjeta>

                    <CampoTexto
                        etiqueta="Código *"
                        accessibilityLabel="Código del ave"
                        icono="paw-outline"
                        style={
                            styles.campoUltimo
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
                        testID="codigo-ave"
                        {...v.props('codigo')}
                    />

                </Tarjeta>


                <Tarjeta>

                    <TituloSeccion
                        icono="camera-outline"
                        indice={1}
                    >
                        Fotografía
                    </TituloSeccion>


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

                                        <IconoCirculo
                                            icono="paw-outline"
                                            indice={0}
                                            tamano={64}
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
                            testID="foto-camara"
                            style={[
                                styles.photoButton,
                                styles.photoButtonLeft
                            ]}
                        />


                        <Boton
                            titulo="Galería"
                            icono="galeria"
                            variante="secundario"
                            onPress={
                                seleccionarGaleria
                            }
                            testID="foto-galeria"
                            style={
                                styles.photoButton
                            }
                        />

                    </View>

                </Tarjeta>


                <Tarjeta>

                    <TituloSeccion
                        icono="sparkles-outline"
                        indice={2}
                    >
                        Origen del ave
                    </TituloSeccion>


                    <View
                        style={
                            styles.options
                        }
                    >

                        <AveOpcion
                            texto="Nacida en criadero"
                            icono="sparkles-outline"
                            seleccionado={
                                origen ===
                                ORIGEN_NACIDA
                            }
                            onPress={() =>
                                setOrigen(
                                    ORIGEN_NACIDA
                                )
                            }
                            testID="origen-nacida"
                        />


                        <AveOpcion
                            texto="Comprada"
                            icono="venta"
                            seleccionado={
                                origen ===
                                ORIGEN_COMPRADA
                            }
                            onPress={() =>
                                setOrigen(
                                    ORIGEN_COMPRADA
                                )
                            }
                            testID="origen-comprada"
                        />

                    </View>


                    {
                        origen ===
                        ORIGEN_NACIDA
                            ? (

                                <>

                                    <CampoFecha
                                        etiqueta="Fecha de nacimiento *"
                                        valor={
                                            fechaNacimiento
                                                .toLocaleDateString()
                                        }
                                        onPress={() =>
                                            setMostrarFechaNacimiento(
                                                true
                                            )
                                        }
                                        testID="fecha-nacimiento"
                                    />


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

                                </>

                            )
                            : (

                                <>

                                    <CampoTexto
                                        etiqueta="Edad al ingresar en meses *"
                                        icono="time-outline"
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
                                        testID="edad-meses-compra"
                                        {...v.props('edad')}
                                    />


                                    <CampoFecha
                                        etiqueta="Fecha de ingreso *"
                                        valor={
                                            fechaIngreso
                                                .toLocaleDateString()
                                        }
                                        onPress={() =>
                                            setMostrarFechaIngreso(
                                                true
                                            )
                                        }
                                        testID="fecha-ingreso"
                                    />


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


                                    <CampoTexto
                                        etiqueta="Criadero de origen *"
                                        icono="home-outline"
                                        value={
                                            criaderoOrigen
                                        }
                                        onChangeText={
                                            setCriaderoOrigen
                                        }
                                        placeholder="Nombre del criadero"
                                        testID="criadero-origen"
                                        {...v.props('criaderoOrigen')}
                                    />


                                    <CampoTexto
                                        etiqueta="Método de envío / traslado *"
                                        icono="car-outline"
                                        style={
                                            styles.campoUltimo
                                        }
                                        value={
                                            metodoEnvio
                                        }
                                        onChangeText={
                                            setMetodoEnvio
                                        }
                                        placeholder="Ej. Cooperativa, vehículo propio..."
                                        testID="metodo-envio"
                                        {...v.props('metodoEnvio')}
                                    />

                                </>

                            )
                    }

                </Tarjeta>


                {
                    origen ===
                    ORIGEN_NACIDA
                    &&
                    (

                        <Tarjeta>

                            <TituloSeccion
                                icono="genealogia"
                                indice={0}
                            >
                                Padres
                            </TituloSeccion>


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


                            <CampoGrupo {...v.grupo('padre')}>
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
                                        valor => {
                                            v.limpiar('padre');
                                            v.limpiar('madre');
                                            setPadreId(valor);
                                        }
                                    }
                                    emptyText="Todavía no existen aves disponibles para seleccionar como padre."
                                />
                            </CampoGrupo>


                            <Text
                                style={
                                    styles.label
                                }
                            >
                                Madre
                            </Text>


                            <CampoGrupo {...v.grupo('madre')}>
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
                                        valor => {
                                            v.limpiar('padre');
                                            v.limpiar('madre');
                                            setMadreId(valor);
                                        }
                                    }
                                    emptyText="Todavía no existen aves disponibles para seleccionar como madre."
                                />
                            </CampoGrupo>

                        </Tarjeta>

                    )
                }


                <Tarjeta>

                    <TituloSeccion
                        icono="paw-outline"
                        indice={4}
                    >
                        Datos generales
                    </TituloSeccion>


                    <Text
                        style={
                            styles.label
                        }
                    >
                        Raza *
                    </Text>


                    <CampoGrupo {...v.grupo('raza')}>
                    <AveSelectorCatalogo

                        items={
                            razas
                        }

                        selectedId={
                            razaSeleccionada?.id
                        }

                        onSelect={item=>{

                            v.limpiar('raza');

                            setRazaSeleccionada(
                                item
                            );

                            setRaza(
                                item.nombre
                            );

                        }}

                        iconoPara={() =>
                            'paw-outline'
                        }

                        testIDPrefijo="raza"

                    />
                    </CampoGrupo>


                    <Text
                        style={
                            styles.label
                        }
                    >
                        Sexo *
                    </Text>


                    <CampoGrupo {...v.grupo('sexo')}>
                    <AveSelectorCatalogo
                        items={
                            sexos
                        }
                        selectedId={
                            sexoSeleccionado?.id
                        }
                        onSelect={item=>{

                            v.limpiar('sexo');

                            setSexoSeleccionado(
                                item
                            );

                            setSexo(
                                item.codigo
                            );

                        }}
                        iconoPara={item =>
                            String(item.codigo || '').toUpperCase() === 'MACHO'
                                ? 'male-outline'
                                : String(item.codigo || '').toUpperCase() === 'HEMBRA'
                                    ? 'female-outline'
                                    : 'paw-outline'
                        }
                        testIDPrefijo="sexo"
                    />
                    </CampoGrupo>

                </Tarjeta>


                <Tarjeta>

                    <TituloSeccion
                        icono="resize-outline"
                        indice={2}
                    >
                        Medidas actuales
                    </TituloSeccion>


                    <Text
                        style={
                            styles.helpText
                        }
                    >
                        Son opcionales. Puedes completarlas ahora o agregarlas posteriormente al editar el ave.
                    </Text>


                    <CampoTexto
                        etiqueta="Peso en gramos"
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
                        testID="peso-gramos"
                        {...v.props('peso')}
                    />


                    <CampoTexto
                        etiqueta="Altura en centímetros"
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
                        testID="altura-cm"
                        {...v.props('altura')}
                    />


                    <CampoTexto
                        etiqueta="Largo en centímetros"
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
                        testID="largo-cm"
                        {...v.props('largo')}
                    />


                    <CampoTexto
                        etiqueta="Características"
                        style={
                            styles.campoUltimo
                        }
                        value={
                            caracteristicas
                        }
                        onChangeText={
                            setCaracteristicas
                        }
                        multiline
                        placeholder="Color, plumaje, comportamiento, tamaño u otras características..."
                        testID="caracteristicas"
                    />

                </Tarjeta>


                {
                    !modoEdicion
                    &&
                    (
                        <Tarjeta>

                            <TituloSeccion
                                icono="jaulas"
                                indice={3}
                            >
                                Jaula inicial
                            </TituloSeccion>


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

                        </Tarjeta>
                    )
                }

            </ScrollView>


            <BarraAccion>

                {
                    aviso
                    &&
                    (
                        <View
                            style={
                                styles.avisoContenedor
                            }
                        >

                            <Aviso
                                titulo={
                                    aviso.titulo
                                }
                                mensaje={
                                    aviso.mensaje
                                }
                                tono="exito"
                                duracion={0}
                                testID="aviso-ave"
                            />

                        </View>
                    )
                }


                <Boton
                    titulo={
                        modoEdicion
                            ? 'Guardar cambios'
                            : 'Guardar ave'
                    }
                    icono="guardar"
                    onPress={
                        guardar
                    }
                    guardando={
                        guardando
                    }
                    atenuado={
                        guardado
                    }
                    testID="guardar-ave"
                />

            </BarraAccion>

        </KeyboardAvoidingView>

        </FondoPantalla>

    );

}


// Campo de fecha: abre el selector de fecha (misma lógica; solo cambia el aspecto)
function CampoFecha({
    etiqueta,
    valor,
    onPress,
    testID
}) {

    return (

        <View
            style={
                styles.campoFecha
            }
        >

            <Text
                style={
                    styles.label
                }
            >
                {etiqueta}
            </Text>


            <Pulsable
                onPress={
                    onPress
                }
                testID={
                    testID
                }
                accessibilityRole="button"
                accessibilityLabel={
                    `${etiqueta} ${valor}`
                }
                sinMinimo
                style={
                    styles.fechaCaja
                }
            >

                <Icono
                    nombre="calendar-outline"
                    tamano={22}
                    color={
                        colors.primary
                    }
                    style={
                        styles.fechaIcono
                    }
                />


                <Text
                    style={
                        styles.fechaTexto
                    }
                >
                    {valor}
                </Text>

            </Pulsable>

        </View>

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

            <AveOpcion
                texto="Sin seleccionar"
                seleccionado={
                    selectedId === null
                }
                onPress={() =>
                    onSelect(
                        null
                    )
                }
            />


            {
                aves.map(
                    ave => (

                        <AveOpcion
                            key={
                                ave.id
                            }
                            texto={
                                ave.codigo
                            }
                            icono="paw-outline"
                            seleccionado={
                                selectedId ===
                                ave.id
                            }
                            onPress={() =>
                                onSelect(
                                    ave.id
                                )
                            }
                        />

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

            <AveOpcion
                texto="Sin jaula"
                seleccionado={
                    selectedId === null
                }
                onPress={() =>
                    onSelect(
                        null
                    )
                }
            />


            {
                jaulas.map(
                    jaula => (

                        <AveOpcion
                            key={
                                jaula.id
                            }
                            texto={
                                jaula.codigo
                            }
                            icono="jaulas"
                            seleccionado={
                                selectedId ===
                                jaula.id
                            }
                            onPress={() =>
                                onSelect(
                                    jaula.id
                                )
                            }
                        />

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


        intro: {

            ...typography.cuerpo,

            color:
                colors.text,

            marginBottom: spacing.md

        },


        label: {

            ...typography.etiqueta,

            color:
                colors.text,

            marginTop: spacing.sm,

            marginBottom: spacing.sm

        },


        helpText: {

            ...typography.secundario,

            color:
                colors.textSecondary,

            marginBottom: spacing.sm

        },


        campoUltimo: {

            marginBottom: 0

        },


        photoContainer: {

            alignItems:
                'center',

            marginTop: spacing.xs,

            marginBottom: spacing.lg

        },


        photo: {

            width: 176,

            height: 176,

            borderRadius: radii.lg,

            borderWidth: 3,

            borderColor:
                colors.white,

            backgroundColor:
                colors.primarySoft

        },


        photoPlaceholder: {

            width: 176,

            height: 176,

            borderRadius: radii.lg,

            backgroundColor:
                colors.primarySoft,

            alignItems:
                'center',

            justifyContent:
                'center'

        },


        photoPlaceholderText: {

            ...typography.secundario,

            color:
                colors.textSecondary,

            marginTop: spacing.sm

        },


        photoActions: {

            flexDirection:
                'row'

        },


        photoButton: {

            flex: 1

        },


        photoButtonLeft: {

            marginRight: spacing.sm

        },


        options: {

            flexDirection:
                'row',

            flexWrap:
                'wrap',

            marginTop: spacing.xs

        },


        campoFecha: {

            marginBottom: spacing.md

        },


        fechaCaja: {

            minHeight: 54,

            flexDirection:
                'row',

            alignItems:
                'center',

            backgroundColor:
                colors.surface,

            borderWidth: 2,

            borderColor:
                colors.border,

            borderRadius:
                radii.md,

            paddingHorizontal:
                spacing.md

        },


        fechaIcono: {

            marginRight:
                spacing.sm

        },


        fechaTexto: {

            ...typography.cuerpo,

            color:
                colors.text

        },


        calculatedCard: {

            backgroundColor:
                colors.primarySoft,

            borderRadius:
                radii.md,

            padding:
                spacing.md,

            marginBottom:
                spacing.md

        },


        calculatedLabel: {

            ...typography.secundario,

            color:
                colors.textSecondary

        },


        calculatedValue: {

            ...typography.subtitulo,

            color:
                colors.primaryDark,

            marginTop: spacing.xs

        },


        barraGuardar: {

            backgroundColor:
                colors.surface,

            borderTopWidth: 1,

            borderTopColor:
                colors.borderSoft,

            paddingHorizontal:
                spacing.pantalla,

            paddingTop:
                spacing.md,

            paddingBottom:
                spacing.md

        },


        avisoContenedor: {

            marginBottom:
                spacing.sm

        }

    });
