import React, {
    useCallback,
    useState
} from 'react';

import {
    View,
    Text,
    ScrollView,
    TouchableOpacity,
    StyleSheet,
    ActivityIndicator
} from 'react-native';

import {
    useFocusEffect
} from '@react-navigation/native';

import {
    obtenerResumenFinanciero,
    obtenerMovimientosFinancieros,
    obtenerConsolidadoCategorias,
    obtenerConsolidadoMensual
} from '../repositories/FinanzasRepository';

import {
    COLORS
} from '../config/constants';


export default function FinanzasScreen({
    navigation
}) {

    const [
        resumen,
        setResumen
    ] = useState({
        ingresos:0,
        egresos:0,
        utilidad:0
    });


    const [
        movimientos,
        setMovimientos
    ] = useState([]);


    const [
        consolidado,
        setConsolidado
    ] = useState([]);


    const [
        mensual,
        setMensual
    ] = useState([]);


    const [
        filtro,
        setFiltro
    ] = useState('TODOS');


    const [
        periodo,
        setPeriodo
    ] = useState('MES');


    const [
        loading,
        setLoading
    ] = useState(true);



    const cargar =
        async () => {

            try {

                setLoading(
                    true
                );


                const [
                    resumenData,
                    movimientosData,
                    consolidadoData,
                    mensualData
                ] =
                    await Promise.all([

                        obtenerResumenFinanciero(
                            periodo
                        ),

                        obtenerMovimientosFinancieros(),

                        obtenerConsolidadoCategorias(
                            periodo
                        ),

                        obtenerConsolidadoMensual(
                            12
                        )

                    ]);


                setResumen(
                    resumenData
                );


                setMovimientos(
                    movimientosData
                );


                setConsolidado(
                    consolidadoData
                );


                setMensual(
                    mensualData
                );

            }
            catch(error){

                console.error(
                    'Error cargando finanzas:',
                    error
                );

            }
            finally{

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
                periodo
            ]
        )

    );



    if(
        loading
    ){

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
                    Cargando finanzas...
                </Text>

            </View>

        );

    }



    const lista =
        filtro === 'TODOS'
            ?
            movimientos
            :
            movimientos.filter(
                item =>
                    item.tipo === filtro
            );


    const ingresosCategorias =
        consolidado.filter(
            item =>
                item.tipo === 'INGRESO'
        );


    const egresosCategorias =
        consolidado.filter(
            item =>
                item.tipo === 'EGRESO'
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
                💰 Finanzas
            </Text>



            <View
                style={
                    styles.periodTabs
                }
            >

                {
                    [
                        {
                            id:'MES',
                            label:'Este mes'
                        },
                        {
                            id:'ANIO',
                            label:'Este año'
                        },
                        {
                            id:'TODO',
                            label:'Todo'
                        }
                    ]
                    .map(
                        item => (

                            <TouchableOpacity

                                key={
                                    item.id
                                }

                                style={[
                                    styles.periodTab,

                                    periodo === item.id &&
                                    styles.periodTabActive
                                ]}

                                onPress={() =>
                                    setPeriodo(
                                        item.id
                                    )
                                }

                            >

                                <Text
                                    style={[
                                        styles.periodTabText,

                                        periodo === item.id &&
                                        styles.periodTabTextActive
                                    ]}
                                >

                                    {item.label}

                                </Text>

                            </TouchableOpacity>

                        )
                    )
                }

            </View>



            <View
                style={
                    styles.summaryRow
                }
            >

                <SummaryCard

                    label="Ingresos"

                    value={
                        resumen.ingresos
                    }

                    valueStyle={
                        styles.income
                    }

                />


                <SummaryCard

                    label="Egresos"

                    value={
                        resumen.egresos
                    }

                    valueStyle={
                        styles.expense
                    }

                />

            </View>



            <View
                style={
                    styles.card
                }
            >

                <Text
                    style={
                        styles.cardLabel
                    }
                >
                    Balance
                </Text>


                <Text
                    style={
                        styles.utility
                    }
                >

                    $
                    {
                        Number(
                            resumen.utilidad || 0
                        )
                        .toFixed(
                            2
                        )
                    }

                </Text>

            </View>



            <Text
                style={
                    styles.sectionTitle
                }
            >
                Consolidado por categoría
            </Text>



            <View
                style={
                    styles.consolidatedCard
                }
            >

                <Text
                    style={
                        styles.consolidatedHeading
                    }
                >
                    Ingresos
                </Text>


                {
                    ingresosCategorias.length === 0
                        ?
                        (
                            <Text
                                style={
                                    styles.emptyLine
                                }
                            >
                                Sin ingresos en el período.
                            </Text>
                        )
                        :
                        ingresosCategorias.map(
                            item => (

                                <ConsolidatedRow

                                    key={
                                        `I-${item.categoria}`
                                    }

                                    label={
                                        nombreCategoria(
                                            item.categoria
                                        )
                                    }

                                    value={
                                        item.total
                                    }

                                />

                            )
                        )
                }



                <Text
                    style={[
                        styles.consolidatedHeading,
                        styles.egressHeading
                    ]}
                >
                    Egresos
                </Text>


                {
                    egresosCategorias.length === 0
                        ?
                        (
                            <Text
                                style={
                                    styles.emptyLine
                                }
                            >
                                Sin egresos en el período.
                            </Text>
                        )
                        :
                        egresosCategorias.map(
                            item => (

                                <ConsolidatedRow

                                    key={
                                        `E-${item.categoria}`
                                    }

                                    label={
                                        nombreCategoria(
                                            item.categoria
                                        )
                                    }

                                    value={
                                        item.total
                                    }

                                />

                            )
                        )
                }

            </View>



            <TouchableOpacity

                style={
                    styles.button
                }

                onPress={() =>
                    navigation.navigate(
                        'NuevoMovimientoFinanciero'
                    )
                }

            >

                <Text
                    style={
                        styles.buttonText
                    }
                >
                    ＋ Nuevo movimiento
                </Text>

            </TouchableOpacity>



            <Text
                style={
                    styles.sectionTitle
                }
            >
                Últimos meses
            </Text>



            <View
                style={
                    styles.consolidatedCard
                }
            >

                {
                    mensual.length === 0
                        ?
                        (
                            <Text
                                style={
                                    styles.emptyLine
                                }
                            >
                                Sin datos mensuales.
                            </Text>
                        )
                        :
                        mensual.map(
                            item => {

                                const balance =
                                    Number(
                                        item.ingresos || 0
                                    )
                                    -
                                    Number(
                                        item.egresos || 0
                                    );


                                return (

                                    <View

                                        key={
                                            item.periodo
                                        }

                                        style={
                                            styles.monthRow
                                        }

                                    >

                                        <Text
                                            style={
                                                styles.monthLabel
                                            }
                                        >
                                            {item.periodo}
                                        </Text>


                                        <Text
                                            style={
                                                balance >= 0
                                                    ?
                                                    styles.monthPositive
                                                    :
                                                    styles.monthNegative
                                            }
                                        >

                                            {
                                                balance >= 0
                                                    ?
                                                    '+'
                                                    :
                                                    '-'
                                            }

                                            $

                                            {
                                                Math.abs(
                                                    balance
                                                )
                                                .toFixed(
                                                    2
                                                )
                                            }

                                        </Text>

                                    </View>

                                );

                            }
                        )
                }

            </View>



            <View
                style={
                    styles.tabs
                }
            >

                {
                    [
                        {
                            id:'TODOS',
                            text:'Todos'
                        },
                        {
                            id:'INGRESO',
                            text:'Ingresos'
                        },
                        {
                            id:'EGRESO',
                            text:'Egresos'
                        }
                    ]
                    .map(
                        item => (

                            <TouchableOpacity

                                key={
                                    item.id
                                }

                                style={[
                                    styles.tab,

                                    filtro === item.id &&
                                    styles.tabActive
                                ]}

                                onPress={() =>
                                    setFiltro(
                                        item.id
                                    )
                                }

                            >

                                <Text
                                    style={[
                                        styles.tabText,

                                        filtro === item.id &&
                                        styles.tabTextActive
                                    ]}
                                >

                                    {item.text}

                                </Text>

                            </TouchableOpacity>

                        )
                    )
                }

            </View>



            {
                lista.map(
                    item => (

                        <TouchableOpacity

                            key={
                                item.id
                            }

                            style={
                                styles.movement
                            }

                            activeOpacity={
                                0.8
                            }

                            onPress={() =>
                                navigation.navigate(
                                    'EditarMovimientoFinanciero',
                                    {
                                        movimientoId:
                                            item.id
                                    }
                                )
                            }

                        >

                            <View
                                style={
                                    styles.movementHeader
                                }
                            >

                                <Text
                                    style={
                                        styles.date
                                    }
                                >

                                    {
                                        new Date(
                                            item.fecha
                                        )
                                        .toLocaleString()
                                    }

                                </Text>


                                {
                                    item.origen_tipo ===
                                    'VENTA_AVE'
                                        ?
                                        (
                                            <View
                                                style={
                                                    styles.linkedBadge
                                                }
                                            >

                                                <Text
                                                    style={
                                                        styles.linkedBadgeText
                                                    }
                                                >
                                                    🔗 Venta
                                                </Text>

                                            </View>
                                        )
                                        :
                                        null
                                }

                            </View>



                            <Text
                                style={
                                    styles.category
                                }
                            >

                                {
                                    item.tipo === 'INGRESO'
                                        ?
                                        '💰 '
                                        :
                                        '💸 '
                                }

                                {
                                    nombreCategoria(
                                        item.categoria
                                    )
                                }

                            </Text>



                            {
                                item.ave_codigo
                                    ?
                                    (
                                        <Text
                                            style={
                                                styles.aveLinkText
                                            }
                                        >

                                            Ave: {item.ave_codigo}

                                        </Text>
                                    )
                                    :
                                    null
                            }



                            <Text
                                style={
                                    styles.detail
                                }
                            >

                                {
                                    item.detalle
                                    ||
                                    'Sin detalle'
                                }

                            </Text>



                            <View
                                style={
                                    styles.movementBottom
                                }
                            >

                                <Text

                                    style={
                                        item.tipo === 'INGRESO'
                                            ?
                                            styles.movementIncome
                                            :
                                            styles.movementExpense
                                    }

                                >

                                    {
                                        item.tipo === 'INGRESO'
                                            ?
                                            '+'
                                            :
                                            '-'
                                    }

                                    $

                                    {
                                        Number(
                                            item.valor
                                        )
                                        .toFixed(
                                            2
                                        )
                                    }

                                </Text>


                                <Text
                                    style={
                                        styles.editHint
                                    }
                                >
                                    Ver / corregir ›
                                </Text>

                            </View>

                        </TouchableOpacity>

                    )
                )
            }

        </ScrollView>

    );

}



function SummaryCard({
    label,
    value,
    valueStyle
}){

    return (

        <View
            style={
                styles.summaryCard
            }
        >

            <Text
                style={
                    styles.cardLabel
                }
            >
                {label}
            </Text>


            <Text
                style={
                    valueStyle
                }
            >

                $

                {
                    Number(
                        value || 0
                    )
                    .toFixed(
                        2
                    )
                }

            </Text>

        </View>

    );

}



function ConsolidatedRow({
    label,
    value
}){

    return (

        <View
            style={
                styles.consolidatedRow
            }
        >

            <Text
                style={
                    styles.consolidatedLabel
                }
            >
                {label}
            </Text>


            <Text
                style={
                    styles.consolidatedValue
                }
            >

                $

                {
                    Number(
                        value || 0
                    )
                    .toFixed(
                        2
                    )
                }

            </Text>

        </View>

    );

}



function nombreCategoria(
    categoria
){

    const map = {

        VENTA_AVE:
            'Venta de aves',

        ENVIO_AVE:
            'Envíos de aves',

        VENTA_HUEVOS:
            'Venta de huevos',

        ALIMENTO:
            'Alimento',

        MEDICAMENTO:
            'Medicamentos',

        INFRAESTRUCTURA:
            'Infraestructura',

        COMPRA_AVE:
            'Compra de aves',

        OTRO:
            'Otros'

    };


    return (
        map[categoria]
        ||
        categoria
        ||
        'Otro'
    );

}



const styles =
StyleSheet.create({

    container:{

        flex:1,

        backgroundColor:
            COLORS.background

    },


    content:{

        padding:16,

        paddingBottom:40

    },


    center:{

        flex:1,

        justifyContent:'center',

        alignItems:'center',

        backgroundColor:
            COLORS.background

    },


    loadingText:{

        marginTop:10,

        color:
            COLORS.textSecondary

    },


    title:{

        fontSize:28,

        fontWeight:'bold',

        color:
            COLORS.primary,

        marginBottom:14

    },


    periodTabs:{

        flexDirection:'row',

        backgroundColor:
            COLORS.card,

        borderRadius:13,

        padding:4,

        marginBottom:14

    },


    periodTab:{

        flex:1,

        alignItems:'center',

        paddingVertical:9,

        borderRadius:10

    },


    periodTabActive:{

        backgroundColor:
            COLORS.primary

    },


    periodTabText:{

        color:
            COLORS.textSecondary,

        fontSize:12

    },


    periodTabTextActive:{

        color:'#fff',

        fontWeight:'bold'

    },


    summaryRow:{

        flexDirection:'row',

        justifyContent:'space-between'

    },


    summaryCard:{

        width:'48.5%',

        backgroundColor:
            COLORS.card,

        padding:16,

        borderRadius:16,

        marginBottom:12

    },


    card:{

        backgroundColor:
            COLORS.card,

        padding:18,

        borderRadius:16,

        marginBottom:12

    },


    cardLabel:{

        color:
            COLORS.textSecondary

    },


    income:{

        color:'#2a9d8f',

        fontSize:21,

        fontWeight:'bold',

        marginTop:4

    },


    expense:{

        color:'#d9534f',

        fontSize:21,

        fontWeight:'bold',

        marginTop:4

    },


    utility:{

        color:
            COLORS.primary,

        fontSize:24,

        fontWeight:'bold',

        marginTop:4

    },


    sectionTitle:{

        fontSize:18,

        fontWeight:'bold',

        color:
            COLORS.text,

        marginTop:12,

        marginBottom:8

    },


    consolidatedCard:{

        backgroundColor:
            COLORS.card,

        borderRadius:14,

        padding:14

    },


    consolidatedHeading:{

        fontWeight:'bold',

        color:'#2a9d8f',

        marginBottom:5

    },


    egressHeading:{

        color:'#d9534f',

        marginTop:13

    },


    consolidatedRow:{

        flexDirection:'row',

        justifyContent:'space-between',

        paddingVertical:6,

        borderBottomWidth:1,

        borderBottomColor:
            COLORS.border

    },


    consolidatedLabel:{

        color:
            COLORS.text

    },


    consolidatedValue:{

        color:
            COLORS.text,

        fontWeight:'600'

    },


    emptyLine:{

        color:
            COLORS.textSecondary,

        paddingVertical:5

    },


    monthRow:{

        flexDirection:'row',

        justifyContent:'space-between',

        paddingVertical:7,

        borderBottomWidth:1,

        borderBottomColor:
            COLORS.border

    },


    monthLabel:{

        color:
            COLORS.text

    },


    monthPositive:{

        color:'#2a9d8f',

        fontWeight:'bold'

    },


    monthNegative:{

        color:'#d9534f',

        fontWeight:'bold'

    },


    tabs:{

        flexDirection:'row',

        backgroundColor:
            COLORS.card,

        borderRadius:14,

        padding:4,

        marginVertical:15

    },


    tab:{

        flex:1,

        padding:12,

        alignItems:'center',

        borderRadius:12

    },


    tabActive:{

        backgroundColor:
            COLORS.primary

    },


    tabText:{

        color:
            COLORS.textSecondary

    },


    tabTextActive:{

        color:'#fff',

        fontWeight:'bold'

    },


    movement:{

        backgroundColor:
            COLORS.card,

        padding:15,

        borderRadius:14,

        marginBottom:12

    },


    movementHeader:{

        flexDirection:'row',

        justifyContent:'space-between',

        alignItems:'center'

    },


    date:{

        color:
            COLORS.textSecondary,

        fontSize:12

    },


    linkedBadge:{

        backgroundColor:'#e1f3ef',

        paddingHorizontal:8,

        paddingVertical:3,

        borderRadius:10

    },


    linkedBadgeText:{

        color:'#347d70',

        fontSize:11,

        fontWeight:'bold'

    },


    category:{

        fontWeight:'bold',

        fontSize:16,

        marginTop:5,

        color:
            COLORS.text

    },


    aveLinkText:{

        color:
            COLORS.primary,

        fontSize:12,

        marginTop:3,

        fontWeight:'600'

    },


    detail:{

        color:
            COLORS.text,

        marginTop:5

    },


    movementBottom:{

        flexDirection:'row',

        justifyContent:'space-between',

        alignItems:'flex-end',

        marginTop:8

    },


    movementIncome:{

        color:'#2a9d8f',

        fontSize:20,

        fontWeight:'bold'

    },


    movementExpense:{

        color:'#d9534f',

        fontSize:20,

        fontWeight:'bold'

    },


    editHint:{

        color:
            COLORS.textSecondary,

        fontSize:12

    },


    button:{

        backgroundColor:
            COLORS.primary,

        padding:16,

        borderRadius:14,

        alignItems:'center',

        marginTop:15,

        marginBottom:4

    },


    buttonText:{

        color:'#fff',

        fontWeight:'bold'

    }

});