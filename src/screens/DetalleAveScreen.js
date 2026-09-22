import React, {
    useCallback,
    useState
} from 'react';


import {
    View,
    Text,
    Image,
    ScrollView,
    TouchableOpacity,
    StyleSheet,
    ActivityIndicator
} from 'react-native';


import {
    useFocusEffect
} from '@react-navigation/native';


import Card
    from '../components/Card';



import {
    obtenerAvePorId,
    obtenerBajaAve
} from '../repositories/AveRepository';


import {
    obtenerHuevosAve
} from '../repositories/HuevoRepository';



import {
    COLORS
} from '../config/constants';



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
        baja,
        setBaja
    ] = useState(null);


    const [
        huevos,
        setHuevos
    ] = useState([]);



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
            catch(error) {


                console.error(
                    'Error cargando ave:',
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
            [
                aveId
            ]

        )

    );





    if(loading){


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


                <Text>
                    Cargando ave...
                </Text>


            </View>

        );

    }




    if(!ave){


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

                        <View
                            style={
                                styles.photoEmpty
                            }
                        >

                            <Text
                                style={
                                    styles.photoText
                                }
                            >
                                🐔
                            </Text>

                        </View>

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


                    <View

                        style={[
                            styles.healthBadge,

                            {
                                backgroundColor:
                                    obtenerColorSalud(
                                        ave.estado_salud
                                    )
                            }

                        ]}

                    >

                        <Text
                            style={
                                styles.healthText
                            }
                        >
                            {
                                obtenerTextoSalud(
                                    ave.estado_salud
                                )
                            }
                        </Text>


                    </View>


                </View>


            </View>






            <Card>


                <Text
                    style={
                        styles.sectionTitle
                    }
                >
                    🐔 Información del ave
                </Text>



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
                        obtenerTextoSexo(
                            ave.sexo
                        )
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



            </Card>







            {
                ave.estado !== 'ACTIVA'
                &&
                (
                    <Card>

                        <Text
                            style={
                                styles.sectionTitle
                            }
                        >
                            {
                                ave.estado === 'VENDIDA'
                                ? '💰 Información de venta'
                                : '⚰ Información de fallecimiento'
                            }
                        </Text>


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

                    </Card>
                )
            }







            <Card>


                <View
                    style={
                        styles.sectionHeader
                    }
                >

                    <Text
                        style={
                            styles.sectionTitle
                        }
                    >
                        🥚 Huevos registrados
                    </Text>


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

                                <Text
                                    style={
                                        styles.eggCode
                                    }
                                >
                                    {item.codigo}
                                </Text>

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

            </Card>







            <Card>


                <Text
                    style={
                        styles.sectionTitle
                    }
                >
                    Acciones
                </Text>


                <View
                    style={
                        styles.actionsGrid
                    }
                >


                    {
                        ave.estado === 'ACTIVA'
                        &&
                        (
                            <TouchableOpacity

                                style={[
                                    styles.actionButton,
                                    styles.editButton
                                ]}

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

                            >

                                <Text
                                    style={
                                        styles.actionText
                                    }
                                >
                                    ✏️ Editar
                                </Text>

                            </TouchableOpacity>
                        )
                    }


                    {
                        ave.estado === 'ACTIVA'
                        &&
                        (
                            <TouchableOpacity

                                style={[
                                    styles.actionButton,
                                    styles.primaryButton
                                ]}

                                onPress={() =>
                                    navigation.navigate(
                                        'EvolucionAve',
                                        {
                                            aveId
                                        }
                                    )
                                }

                            >

                                <Text
                                    style={
                                        styles.actionText
                                    }
                                >
                                    📸 Evolución
                                </Text>

                            </TouchableOpacity>
                        )
                    }


                    {
                        ave.estado === 'ACTIVA'
                        &&
                        (
                            <TouchableOpacity

                                style={[
                                    styles.actionButton,
                                    styles.healthButton
                                ]}

                                onPress={() =>
                                    navigation.navigate(
                                        'SaludAve',
                                        {
                                            aveId
                                        }
                                    )
                                }

                            >

                                <Text
                                    style={
                                        styles.actionText
                                    }
                                >
                                    🩺 Salud
                                </Text>

                            </TouchableOpacity>
                        )
                    }


                    {
                        ave.estado === 'ACTIVA'
                        &&
                        (
                            <TouchableOpacity

                                style={[
                                    styles.actionButton,
                                    styles.eggButton
                                ]}

                                onPress={() =>
                                    navigation.navigate(
                                        'RegistrarHuevo',
                                        {
                                            aveId
                                        }
                                    )
                                }

                            >

                                <Text
                                    style={
                                        styles.actionTextDark
                                    }
                                >
                                    🥚 Registrar huevo
                                </Text>

                            </TouchableOpacity>
                        )
                    }


                    <TouchableOpacity

                        style={[
                            styles.actionButton,
                            styles.lifeCycleButton
                        ]}

                        onPress={() =>
                            navigation.navigate(
                                'CicloVidaAve',
                                {
                                    aveId
                                }
                            )
                        }

                    >

                        <Text
                            style={
                                styles.actionTextDark
                            }
                        >
                            🌿 Ciclo de vida
                        </Text>

                    </TouchableOpacity>


                    <TouchableOpacity

                        style={[
                            styles.actionButton,
                            styles.genealogyButton
                        ]}

                        onPress={() =>
                            navigation.navigate(
                                'GenealogiaAve',
                                {
                                    aveId
                                }
                            )
                        }

                    >

                        <Text
                            style={
                                styles.actionText
                            }
                        >
                            🌳 Genealogía
                        </Text>

                    </TouchableOpacity>


                    {
                        ave.estado === 'ACTIVA'
                        &&
                        (
                            <TouchableOpacity

                                style={[
                                    styles.actionButton,
                                    styles.dangerButton
                                ]}

                                onPress={() =>
                                    navigation.navigate(
                                        'BajaAve',
                                        {
                                            aveId
                                        }
                                    )
                                }

                            >

                                <Text
                                    style={
                                        styles.actionText
                                    }
                                >
                                    ⚫ Dar de baja
                                </Text>

                            </TouchableOpacity>
                        )
                    }


                </View>


            </Card>




        </ScrollView>

    );

}




function Info({
    label,
    value,
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


            <Text
                style={
                    styles.value
                }
            >
                {valorMostrar}
            </Text>


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

            return '🐓 Macho';


        case 'HEMBRA':

            return '🐔 Hembra';


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





function obtenerColorSalud(
    estado
){

    switch(
        estado
    ){

        case 'EN_TRATAMIENTO':

            return '#fff0b3';


        case 'ENFERMA':

            return '#f7d7d7';


        default:

            return '#d9f2e4';

    }

}





function obtenerTextoSalud(
    estado
){


    switch(
        estado
    ){

        case 'EN_TRATAMIENTO':

            return '🟡 En tratamiento';


        case 'ENFERMA':

            return '🔴 Enferma';


        default:

            return '🟢 Sana';


    }


}




const styles =
    StyleSheet.create({


        container: {

            flex:1,

            backgroundColor:
                COLORS.background

        },


        content: {

            padding:16,

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
                'center',

            marginBottom: 14

        },


        photo: {

            width:74,

            height:74,

            borderRadius:37

        },


        photoEmpty: {

            width:74,

            height:74,

            borderRadius:37,

            backgroundColor:'#e7f5f5',

            justifyContent:'center',

            alignItems:'center'

        },


        photoText: {

            fontSize:36

        },


        headerInfo: {

            flex:1,

            marginLeft:15

        },


        title: {

            fontSize:28,

            fontWeight:'bold',

            color:
                COLORS.primary

        },


        subtitle: {

            color:
                COLORS.textSecondary,

            marginTop:1,

            fontSize:15

        },


        healthBadge: {

            alignSelf:
                'flex-start',

            marginTop:6,

            paddingHorizontal:9,

            paddingVertical:4,

            borderRadius:12

        },


        healthText: {

            color:'#000000',

            fontWeight:'700',

            fontSize:13,

            lineHeight:18

        },


        sectionTitle: {

            fontSize:19,

            fontWeight:'bold',

            color:
                COLORS.text

        },


        sectionHeader: {

            flexDirection:
                'row',

            alignItems:
                'center',

            justifyContent:
                'space-between',

            marginBottom:4

        },


        countBadge: {

            minWidth:30,

            height:30,

            borderRadius:15,

            backgroundColor:'#e7f5f5',

            alignItems:'center',

            justifyContent:'center',

            paddingHorizontal:8

        },


        countBadgeText: {

            color:
                COLORS.primary,

            fontWeight:'bold',

            fontSize:13

        },


        infoRow: {

            flexDirection:
                'row',

            justifyContent:
                'space-between',

            alignItems:
                'flex-start',

            paddingVertical:10,

            borderBottomWidth:1,

            borderColor:
                COLORS.border

        },


        label: {

            flex:0.42,

            color:
                COLORS.textSecondary,

            fontSize:13,

            paddingRight:10

        },


        value: {

            flex:0.58,

            fontSize:15,

            color:
                COLORS.text,

            textAlign:'right',

            fontWeight:'500'

        },


        eggRow: {

            flexDirection:
                'row',

            justifyContent:
                'space-between',

            alignItems:
                'center',

            paddingVertical:10,

            borderBottomWidth:1,

            borderColor:
                COLORS.border

        },


        eggCode: {

            color:
                COLORS.text,

            fontSize:15,

            fontWeight:'600'

        },


        eggDate: {

            color:
                COLORS.textSecondary,

            fontSize:13

        },


        emptyText: {

            color:
                COLORS.textSecondary,

            marginTop:10

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

            marginTop:12

        },


        actionButton: {

            width:'48.5%',

            minHeight:46,

            borderRadius:12,

            paddingHorizontal:8,

            paddingVertical:10,

            alignItems:'center',

            justifyContent:'center',

            marginBottom:10

        },


        editButton: {

            backgroundColor:
                '#6c757d'

        },


        primaryButton: {

            backgroundColor:
                COLORS.primary

        },


        healthButton: {

            backgroundColor:
                '#4ea8de'

        },


        dangerButton: {

            backgroundColor:
                '#d9534f'

        },


        lifeCycleButton: {

            backgroundColor:
                '#58c7b4'

        },


        genealogyButton: {

            backgroundColor:
                '#5b8f72'

        },


        eggButton: {

            backgroundColor:
                '#e9c46a'

        },


        actionText: {

            color:'#fff',

            fontWeight:'bold',

            fontSize:13,

            textAlign:'center'

        },


        actionTextDark: {

            color:'#5c4a00',

            fontWeight:'bold',

            fontSize:13,

            textAlign:'center'

        }


    });
