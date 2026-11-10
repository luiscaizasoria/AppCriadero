import React, {
    useCallback,
    useState
} from 'react';


import {
    View,
    Text,
    Image,
    ScrollView,
    StyleSheet
} from 'react-native';


import {
    useFocusEffect
} from '@react-navigation/native';


import Tarjeta
    from '../components/Tarjeta';

import TituloSeccion
    from '../components/TituloSeccion';

import Chip
    from '../components/Chip';

import Avatar
    from '../components/Avatar';

import Icono
    from '../components/Icono';

import AveAccion
    from '../components/AveAccion';

import FondoPantalla
    from '../components/FondoPantalla';

import EstadoCarga
    from '../components/EstadoCarga';

import EstadoError
    from '../components/EstadoError';

import EstadoVacio
    from '../components/EstadoVacio';

import {
    visualSalud,
    visualEstadoAve,
    propsAvatar
} from '../components/aveVisual';

import {
    useContextoPantalla
} from '../navigation/contextoPantalla';



import {
    obtenerAvePorId,
    obtenerBajaAve
} from '../repositories/AveRepository';


import {
    obtenerHuevosAve
} from '../repositories/HuevoRepository';


import {
    colors,
    spacing,
    typography
} from '../theme';



export default function DetalleAveScreen({
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
        loading,
        setLoading
    ] = useState(true);


    const [
        error,
        setError
    ] = useState(null);


    const [
        baja,
        setBaja
    ] = useState(null);


    const [
        huevos,
        setHuevos
    ] = useState([]);


    // Migas: las pantallas hijas muestran "Aves › {código}"
    useContextoPantalla(
        route.key,
        ave?.codigo
    );



    const cargar =
        async () => {


            try {


                setLoading(
                    true
                );


                setError(
                    null
                );


                const data =
                    await obtenerAvePorId(
                        aveId
                    );


                setAve(
                    data
                );


                const bajaData =
                    await obtenerBajaAve(
                        aveId
                    );


                setBaja(
                    bajaData
                );


                const huevosData =
                    await obtenerHuevosAve(
                        aveId
                    );


                setHuevos(
                    huevosData
                );


            }
            catch(err) {


                console.error(
                    'Error cargando ave:',
                    err
                );


                setError(
                    err
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
            [
                aveId
            ]

        )

    );





    if(loading){


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




    if(!ave){


        // Fallo de carga (red u otro): estado de error con «Reintentar» (misma carga).
        if(error){

            return (

                <FondoPantalla>

                    <View
                        style={
                            styles.center
                        }
                    >

                        <EstadoError
                            titulo="No fue posible cargar el ave."
                            onReintentar={
                                cargar
                            }
                        />

                    </View>

                </FondoPantalla>

            );

        }


        return (

            <FondoPantalla>

                <View
                    style={
                        styles.center
                    }
                >

                    <EstadoVacio
                        titulo="Ave no encontrada."
                    />

                </View>

            </FondoPantalla>

        );

    }



    const salud =
        visualSalud(
            ave.estado_salud
        );


    const estadoVisual =
        visualEstadoAve(
            ave.estado
        );


    const sexoTexto =
        obtenerTextoSexo(
            ave.sexo
        );


    const iconoSexo =
        ave.sexo === 'MACHO'
            ? 'male-outline'
            : ave.sexo === 'HEMBRA'
                ? 'female-outline'
                : null;



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


            <Tarjeta
                testID="ficha-ave-cabecera"
            >

                <View
                    style={
                        styles.header
                    }
                >


                    {
                        ave.foto_uri

                        ?

                        (

                            <Image

                                source={{
                                    uri:
                                        ave.foto_uri
                                }}

                                style={
                                    styles.photo
                                }

                            />

                        )

                        :

                        (

                            <Avatar
                                icono="paw-outline"
                                tamano={72}
                                {...propsAvatar(ave)}
                            />

                        )

                    }


                    <View
                        style={
                            styles.headerInfo
                        }
                    >


                        <Text
                            style={
                                styles.title
                            }
                            numberOfLines={1}
                        >
                            {ave.codigo}
                        </Text>


                        <Text
                            style={
                                styles.subtitle
                            }
                        >
                            {
                                ave.raza ||
                                'Sin raza'
                            }
                        </Text>


                    </View>


                </View>


                <View
                    style={
                        styles.chips
                    }
                >

                    <Chip
                        texto={salud.texto}
                        icono={salud.icono}
                        tono={salud.tono}
                        style={styles.chip}
                        testID="ficha-ave-salud"
                    />

                    <Chip
                        texto={estadoVisual.texto}
                        icono={estadoVisual.icono}
                        tono={estadoVisual.tono}
                        style={styles.chip}
                    />

                </View>


            </Tarjeta>






            <Tarjeta>


                <TituloSeccion
                    icono="paw-outline"
                    indice={0}
                >
                    Información del ave
                </TituloSeccion>



                <Info
                    label="Estado"
                    value={
                        obtenerTextoEstadoAve(
                            ave.estado
                        )
                    }
                />



                <Info
                    label="Sexo"
                    value={
                        sexoTexto
                    }
                    icono={
                        iconoSexo
                    }
                />



                <Info
                    label="Peso"
                    value={
                        formatearMedida(
                            ave.peso_gramos,
                            'g'
                        )
                    }
                />



                <Info
                    label="Altura"
                    value={
                        formatearMedida(
                            ave.altura_cm,
                            'cm'
                        )
                    }
                />



                <Info
                    label="Largo"
                    value={
                        formatearMedida(
                            ave.largo_cm,
                            'cm'
                        )
                    }
                />



                <Info
                    label="Origen"
                    value={
                        ave.origen ===
                        'NACIDA_CRIADERO'

                        ?

                        'Nacida en criadero'

                        :

                        'Comprada'
                    }
                />



                <Info
                    label="Fecha nacimiento"
                    value={
                        ave.fecha_nacimiento
                    }
                />



                {
                    ave.origen ===
                    'COMPRADA'
                    &&
                    (
                        <>

                            <Info
                                label="Edad al ingresar"
                                value={
                                    ave.edad_meses_compra !==
                                    null
                                    &&
                                    ave.edad_meses_compra !==
                                    undefined

                                    ?

                                    `${ave.edad_meses_compra} meses`

                                    :

                                    null
                                }
                            />


                            <Info
                                label="Fecha de ingreso"
                                value={
                                    ave.fecha_ingreso
                                }
                            />


                            <Info
                                label="Criadero de origen"
                                value={
                                    ave.criadero_origen
                                }
                            />


                            <Info
                                label="Método de envío"
                                value={
                                    ave.metodo_envio
                                }
                            />

                        </>
                    )
                }



                <Info
                    label="Padre"
                    value={
                        ave.padre_codigo
                    }
                />



                <Info
                    label="Madre"
                    value={
                        ave.madre_codigo
                    }
                />



                <Info
                    label="Jaula"
                    value={
                        ave.jaula_codigo
                        ?
                        ave.jaula_codigo
                        :
                        'Sin jaula'
                    }
                />



                <Info
                    label="Características"
                    value={
                        ave.caracteristicas
                        ||
                        'Sin información'
                    }
                    last
                />



            </Tarjeta>







            {
                ave.estado !== 'ACTIVA'
                &&
                (
                    <Tarjeta>

                        <TituloSeccion
                            icono={
                                ave.estado === 'VENDIDA'
                                ? 'cash-outline'
                                : 'skull-outline'
                            }
                            indice={
                                ave.estado === 'VENDIDA'
                                ? 2
                                : 3
                            }
                        >
                            {
                                ave.estado === 'VENDIDA'
                                ? 'Información de venta'
                                : 'Información de fallecimiento'
                            }
                        </TituloSeccion>


                        <Info
                            label="Fecha"
                            value={
                                baja?.fecha
                            }
                        />


                        {
                            ave.estado === 'VENDIDA'
                            &&
                            (
                                <>
                                    <Info
                                        label="Nombre"
                                        value={
                                            baja?.comprador
                                        }
                                    />

                                    <Info
                                        label="Celular"
                                        value={
                                            baja?.celular
                                        }
                                    />

                                    <Info
                                        label="Ciudad destino"
                                        value={
                                            baja?.ciudad_destino
                                        }
                                    />

                                    <Info
                                        label="Cooperativa"
                                        value={
                                            baja?.cooperativa_envio
                                        }
                                    />

                                    <Info
                                        label="Valor venta"
                                        value={
                                            formatearDinero(
                                                baja?.valor_venta
                                            )
                                        }
                                    />

                                    <Info
                                        label="Valor envío"
                                        value={
                                            formatearDinero(
                                                baja?.valor_envio
                                            )
                                        }
                                    />
                                </>
                            )
                        }


                        {
                            ave.estado !== 'VENDIDA'
                            &&
                            (
                                <Info
                                    label="Causa"
                                    value={
                                        baja?.causa
                                    }
                                />
                            )
                        }


                        <Info
                            label="Detalle"
                            value={
                                baja?.detalle
                            }
                            last
                        />

                    </Tarjeta>
                )
            }







            <Tarjeta>


                <View
                    style={
                        styles.sectionHeader
                    }
                >

                    <View
                        style={
                            styles.sectionTitle
                        }
                    >

                        <TituloSeccion
                            icono="huevo"
                            indice={4}
                        >
                            Huevos registrados
                        </TituloSeccion>

                    </View>


                    <View
                        style={
                            styles.countBadge
                        }
                    >

                        <Text
                            style={
                                styles.countBadgeText
                            }
                        >
                            {huevos.length}
                        </Text>

                    </View>

                </View>


                {
                    huevos.length === 0

                    ?

                    <Text
                        style={
                            styles.emptyText
                        }
                    >
                        No existen huevos registrados.
                    </Text>

                    :

                    huevos.map(
                        (
                            item,
                            index
                        ) => (

                            <View
                                key={
                                    item.id
                                }
                                style={[
                                    styles.eggRow,

                                    index ===
                                    huevos.length - 1
                                    &&
                                    styles.lastRow
                                ]}
                            >

                                <View
                                    style={
                                        styles.eggLeft
                                    }
                                >

                                    <Icono
                                        nombre="huevo"
                                        tamano={18}
                                        color={
                                            colors.textSecondary
                                        }
                                        style={
                                            styles.eggIcon
                                        }
                                    />

                                    <Text
                                        style={
                                            styles.eggCode
                                        }
                                    >
                                        {item.codigo}
                                    </Text>

                                </View>

                                <Text
                                    style={
                                        styles.eggDate
                                    }
                                >
                                    {
                                        new Date(
                                            item.fecha
                                        )
                                            .toLocaleDateString()
                                    }
                                </Text>

                            </View>

                        )
                    )
                }

            </Tarjeta>







            <Tarjeta>


                <TituloSeccion
                    icono="apps-outline"
                    indice={0}
                >
                    Acciones
                </TituloSeccion>


                <View
                    style={
                        styles.actionsGrid
                    }
                >


                    {
                        ave.estado === 'ACTIVA'
                        &&
                        (
                            <AveAccion
                                texto="Editar"
                                icono="editar"
                                indice={0}
                                testID="accion-editar-ave"
                                onPress={() =>
                                    navigation.navigate(
                                        'NuevaAve',
                                        {
                                            aveId,
                                            modoEdicion:
                                                true
                                        }
                                    )
                                }
                            />
                        )
                    }


                    {
                        ave.estado === 'ACTIVA'
                        &&
                        (
                            <AveAccion
                                texto="Evolución"
                                icono="evolucion"
                                indice={1}
                                testID="accion-evolucion-ave"
                                onPress={() =>
                                    navigation.navigate(
                                        'EvolucionAve',
                                        {
                                            aveId
                                        }
                                    )
                                }
                            />
                        )
                    }


                    {
                        ave.estado === 'ACTIVA'
                        &&
                        (
                            <AveAccion
                                texto="Salud"
                                icono="salud"
                                indice={2}
                                testID="accion-salud-ave"
                                onPress={() =>
                                    navigation.navigate(
                                        'SaludAve',
                                        {
                                            aveId
                                        }
                                    )
                                }
                            />
                        )
                    }


                    {
                        ave.estado === 'ACTIVA'
                        &&
                        (
                            <AveAccion
                                texto="Registrar huevo"
                                icono="huevo"
                                indice={4}
                                testID="accion-registrar-huevo"
                                onPress={() =>
                                    navigation.navigate(
                                        'RegistrarHuevo',
                                        {
                                            aveId
                                        }
                                    )
                                }
                            />
                        )
                    }


                    <AveAccion
                        texto="Ciclo de vida"
                        icono="cicloVida"
                        indice={1}
                        testID="accion-ciclo-vida"
                        onPress={() =>
                            navigation.navigate(
                                'CicloVidaAve',
                                {
                                    aveId
                                }
                            )
                        }
                    />


                    <AveAccion
                        texto="Genealogía"
                        icono="genealogia"
                        indice={0}
                        testID="accion-genealogia"
                        onPress={() =>
                            navigation.navigate(
                                'GenealogiaAve',
                                {
                                    aveId
                                }
                            )
                        }
                    />


                    {
                        ave.estado === 'ACTIVA'
                        &&
                        (
                            <AveAccion
                                texto="Dar de baja"
                                icono="baja"
                                indice={3}
                                testID="accion-dar-de-baja"
                                onPress={() =>
                                    navigation.navigate(
                                        'BajaAve',
                                        {
                                            aveId
                                        }
                                    )
                                }
                            />
                        )
                    }


                </View>


            </Tarjeta>




        </ScrollView>

        </FondoPantalla>

    );

}




function Info({
    label,
    value,
    icono,
    last = false
}) {


    const valorMostrar =

        value === null
        ||
        value === undefined
        ||
        value === ''

        ?

        'No registrado'

        :

        String(
            value
        );


    return (

        <View
            style={[
                styles.infoRow,

                last
                &&
                styles.lastRow
            ]}
        >

            <Text
                style={
                    styles.label
                }
            >
                {label}
            </Text>


            <View
                style={
                    styles.valueBox
                }
            >

                {
                    icono
                    &&
                    valorMostrar !== 'No registrado'
                    &&
                    (
                        <Icono
                            nombre={icono}
                            tamano={16}
                            color={colors.textSecondary}
                            style={styles.valueIcon}
                        />
                    )
                }

                <Text
                    style={
                        styles.value
                    }
                >
                    {valorMostrar}
                </Text>

            </View>


        </View>

    );

}





function obtenerTextoSexo(
    sexo
) {

    switch(
        sexo
    ) {

        case 'MACHO':

            return 'Macho';


        case 'HEMBRA':

            return 'Hembra';


        default:

            return null;

    }

}



function formatearMedida(
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

        return null;

    }


    const numero =
        Number(
            valor
        );


    if (
        !Number.isFinite(
            numero
        )
    ) {

        return null;

    }


    return `${numero} ${unidad}`;

}



function formatearDinero(
    valor
) {

    if (
        valor === null
        ||
        valor === undefined
        ||
        valor === ''
    ) {

        return null;

    }


    const numero =
        Number(
            valor
        );


    if (
        !Number.isFinite(
            numero
        )
    ) {

        return null;

    }


    return `$${numero.toFixed(2)}`;

}




function obtenerTextoEstadoAve(
    estado
) {


    switch(
        estado
    ) {

        case 'VENDIDA':

            return 'Vendida';


        case 'FALLECIDA':

            return 'Fallecida';


        default:

            return 'Activa';

    }

}




const styles =
    StyleSheet.create({


        container: {

            flex:1

        },


        content: {

            padding:spacing.pantalla,

            paddingBottom:40

        },


        center: {

            flex:1,

            justifyContent:
                'center',

            alignItems:
                'center'

        },


        header: {

            flexDirection:
                'row',

            alignItems:
                'center'

        },


        photo: {

            width:72,

            height:72,

            borderRadius:36,

            borderWidth:3,

            borderColor:
                colors.white,

            backgroundColor:
                colors.primarySoft

        },


        headerInfo: {

            flex:1,

            marginLeft:spacing.md

        },


        title: {

            ...typography.display,

            color:
                colors.primaryDark

        },


        subtitle: {

            ...typography.cuerpo,

            color:
                colors.textSecondary

        },


        chips: {

            flexDirection:
                'row',

            flexWrap:
                'wrap',

            marginTop:spacing.md

        },


        chip: {

            marginRight:spacing.sm,

            marginBottom:spacing.xs

        },


        sectionHeader: {

            flexDirection:
                'row',

            alignItems:
                'center',

            justifyContent:
                'space-between'

        },


        sectionTitle: {

            flex:1

        },


        countBadge: {

            minWidth:32,

            height:32,

            borderRadius:16,

            backgroundColor:
                colors.primarySoft,

            alignItems:'center',

            justifyContent:'center',

            paddingHorizontal:spacing.sm

        },


        countBadgeText: {

            ...typography.chip,

            color:
                colors.primaryDark

        },


        infoRow: {

            flexDirection:
                'row',

            justifyContent:
                'space-between',

            alignItems:
                'flex-start',

            paddingVertical:spacing.md,

            borderBottomWidth:1,

            borderColor:
                colors.borderSoft

        },


        label: {

            ...typography.secundario,

            flex:0.42,

            color:
                colors.textSecondary,

            paddingRight:spacing.sm

        },


        valueBox: {

            flex:0.58,

            flexDirection:
                'row',

            alignItems:
                'center',

            justifyContent:
                'flex-end'

        },


        valueIcon: {

            marginRight:spacing.xs

        },


        value: {

            ...typography.etiqueta,

            fontSize:15,

            color:
                colors.text,

            textAlign:'right',

            flexShrink:1

        },


        eggRow: {

            flexDirection:
                'row',

            justifyContent:
                'space-between',

            alignItems:
                'center',

            paddingVertical:spacing.md,

            borderBottomWidth:1,

            borderColor:
                colors.borderSoft

        },


        eggLeft: {

            flexDirection:
                'row',

            alignItems:
                'center'

        },


        eggIcon: {

            marginRight:spacing.sm

        },


        eggCode: {

            ...typography.etiqueta,

            color:
                colors.text

        },


        eggDate: {

            ...typography.secundario,

            color:
                colors.textSecondary

        },


        emptyText: {

            ...typography.cuerpo,

            color:
                colors.textSecondary,

            marginTop:spacing.sm

        },


        lastRow: {

            borderBottomWidth:0

        },


        actionsGrid: {

            flexDirection:
                'row',

            flexWrap:
                'wrap',

            justifyContent:
                'space-between',

            marginTop:spacing.sm

        }


    });
