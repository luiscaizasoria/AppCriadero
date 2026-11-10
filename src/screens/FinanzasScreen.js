import React, {
    useCallback,
    useState
} from 'react';

import {
    View,
    Text,
    ScrollView,
    StyleSheet
} from 'react-native';

import {
    useFocusEffect
} from '@react-navigation/native';

import {
    useSafeAreaInsets
} from 'react-native-safe-area-context';

import {
    obtenerResumenFinanciero,
    obtenerMovimientosFinancieros,
    obtenerConsolidadoCategorias,
    obtenerConsolidadoMensual
} from '../repositories/FinanzasRepository';

import FondoPantalla from '../components/FondoPantalla';
import PantallaHeader from '../components/PantallaHeader';
import BarraEstado from '../components/BarraEstado';
import Tarjeta from '../components/Tarjeta';
import TituloSeccion from '../components/TituloSeccion';
import Chip from '../components/Chip';
import Icono from '../components/Icono';
import Pulsable from '../components/Pulsable';
import Fab from '../components/Fab';
import EstadoCarga from '../components/EstadoCarga';
import EstadoError from '../components/EstadoError';
import EstadoVacio from '../components/EstadoVacio';

import {
    colors,
    radii,
    spacing,
    typography
} from '../theme';


const PERIODOS = [
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
];


const FILTROS = [
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
];


export default function FinanzasScreen({
    navigation
}) {

    const insets =
        useSafeAreaInsets();


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


    const [
        errorCarga,
        setErrorCarga
    ] = useState(false);



    const cargar =
        async () => {

            try {

                setLoading(
                    true
                );

                setErrorCarga(
                    false
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

                setErrorCarga(
                    true
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


    const contenido = () => {

        if(
            loading
        ){

            return (

                <EstadoCarga
                    mensaje="Cargando finanzas..."
                />

            );

        }


        if(
            errorCarga
        ){

            return (

                <EstadoError
                    titulo="No fue posible cargar las finanzas."
                    mensaje="Revisa tu conexión e inténtalo de nuevo."
                    onReintentar={
                        cargar
                    }
                />

            );

        }


        return (

            <>

                <View
                    style={
                        styles.summaryRow
                    }
                >

                    <SummaryCard

                        label="Ingresos"

                        icono="trending-up-outline"

                        fondo={
                            colors.success
                        }

                        value={
                            resumen.ingresos
                        }

                        testID="finanzas-ingresos"

                    />


                    <SummaryCard

                        label="Egresos"

                        icono="trending-down-outline"

                        fondo={
                            colors.danger
                        }

                        value={
                            resumen.egresos
                        }

                        testID="finanzas-egresos"

                    />

                </View>



                <View
                    style={
                        styles.balanceCard
                    }
                    testID="finanzas-balance"
                >

                    <View
                        style={
                            styles.balanceEtiqueta
                        }
                    >

                        <Icono
                            nombre="wallet-outline"
                            tamano={22}
                            color={colors.white}
                            style={
                                styles.iconoEtiqueta
                            }
                        />

                        <Text
                            style={
                                styles.cardLabel
                            }
                        >
                            Balance
                        </Text>

                    </View>


                    <Text
                        style={
                            styles.balanceValor
                        }
                        maxFontSizeMultiplier={1.3}
                    >
                        {
                            `$${
                                Number(
                                    resumen.utilidad || 0
                                )
                                .toFixed(
                                    2
                                )
                            }`
                        }
                    </Text>

                </View>



                <TituloSeccion
                    icono="bar-chart-outline"
                    indice={0}
                >
                    Consolidado por categoría
                </TituloSeccion>


                <Tarjeta>

                    <View
                        style={
                            styles.grupoTitulo
                        }
                    >

                        <Icono
                            nombre="trending-up-outline"
                            tamano={20}
                            color={colors.successText}
                            style={
                                styles.iconoEtiqueta
                            }
                        />

                        <Text
                            style={[
                                styles.consolidatedHeading,
                                {
                                    color:
                                        colors.successText
                                }
                            ]}
                        >
                            Ingresos
                        </Text>

                    </View>


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

                                        maximo={
                                            maximoGrupo(
                                                ingresosCategorias
                                            )
                                        }

                                        color={
                                            colors.success
                                        }

                                    />

                                )
                            )
                    }



                    <View
                        style={[
                            styles.grupoTitulo,
                            styles.egressHeading
                        ]}
                    >

                        <Icono
                            nombre="trending-down-outline"
                            tamano={20}
                            color={colors.dangerText}
                            style={
                                styles.iconoEtiqueta
                            }
                        />

                        <Text
                            style={[
                                styles.consolidatedHeading,
                                {
                                    color:
                                        colors.dangerText
                                }
                            ]}
                        >
                            Egresos
                        </Text>

                    </View>


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

                                        maximo={
                                            maximoGrupo(
                                                egresosCategorias
                                            )
                                        }

                                        color={
                                            colors.danger
                                        }

                                    />

                                )
                            )
                    }

                </Tarjeta>



                <TituloSeccion
                    icono="calendar-outline"
                    indice={1}
                >
                    Últimos meses
                </TituloSeccion>


                <Tarjeta>

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


                                            <View
                                                style={
                                                    styles.monthValor
                                                }
                                            >

                                                <Icono
                                                    nombre={
                                                        balance >= 0
                                                            ?
                                                            'trending-up-outline'
                                                            :
                                                            'trending-down-outline'
                                                    }
                                                    tamano={18}
                                                    color={
                                                        balance >= 0
                                                            ?
                                                            colors.successText
                                                            :
                                                            colors.dangerText
                                                    }
                                                    style={
                                                        styles.iconoEtiqueta
                                                    }
                                                />

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
                                                        `${
                                                            balance >= 0
                                                                ?
                                                                '+'
                                                                :
                                                                '-'
                                                        }$${
                                                            Math.abs(
                                                                balance
                                                            )
                                                            .toFixed(
                                                                2
                                                            )
                                                        }`
                                                    }
                                                </Text>

                                            </View>

                                        </View>

                                    );

                                }
                            )
                    }

                </Tarjeta>



                <View
                    style={
                        styles.tabs
                    }
                    accessibilityRole="tablist"
                >

                    {
                        FILTROS.map(
                            item => {

                                const activo =
                                    filtro === item.id;

                                return (

                                    <Pulsable

                                        key={
                                            item.id
                                        }

                                        testID={
                                            `finanzas-filtro-${item.id.toLowerCase()}`
                                        }

                                        accessibilityRole="tab"

                                        accessibilityState={{
                                            selected: activo
                                        }}

                                        sinMinimo

                                        style={[
                                            styles.tab,

                                            activo &&
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

                                                activo &&
                                                styles.tabTextActive
                                            ]}
                                        >

                                            {item.text}

                                        </Text>

                                    </Pulsable>

                                );

                            }
                        )
                    }

                </View>



                {
                    lista.length === 0
                        ?
                        (
                            <EstadoVacio
                                icono="receipt-outline"
                                titulo={
                                    movimientos.length === 0
                                        ?
                                        'Aún no hay movimientos'
                                        :
                                        'Sin movimientos de este tipo'
                                }
                                mensaje={
                                    movimientos.length === 0
                                        ?
                                        'Registra tu primer ingreso o egreso con el botón de abajo.'
                                        :
                                        'Prueba con otro filtro.'
                                }
                                testID="finanzas-vacio"
                            />
                        )
                        :
                        null
                }


                {
                    lista.map(
                        item => (

                            <Tarjeta

                                key={
                                    item.id
                                }

                                testID={
                                    `movimiento-${item.id}`
                                }

                                franja={
                                    item.tipo === 'INGRESO'
                                        ?
                                        colors.success
                                        :
                                        colors.danger
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
                                                <Chip
                                                    texto="Venta"
                                                    tono="info"
                                                    icono="link-outline"
                                                />
                                            )
                                            :
                                            null
                                    }

                                </View>



                                <View
                                    style={
                                        styles.categoryRow
                                    }
                                >

                                    <Icono
                                        nombre={
                                            item.tipo === 'INGRESO'
                                                ?
                                                'trending-up-outline'
                                                :
                                                'trending-down-outline'
                                        }
                                        tamano={20}
                                        color={
                                            item.tipo === 'INGRESO'
                                                ?
                                                colors.successText
                                                :
                                                colors.dangerText
                                        }
                                        style={
                                            styles.iconoEtiqueta
                                        }
                                    />

                                    <Text
                                        style={
                                            styles.category
                                        }
                                    >

                                        {
                                            nombreCategoria(
                                                item.categoria
                                            )
                                        }

                                    </Text>

                                </View>



                                {
                                    item.ave_codigo
                                        ?
                                        (
                                            <Text
                                                style={
                                                    styles.aveLinkText
                                                }
                                            >

                                                {`Ave: ${item.ave_codigo}`}

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

                                        maxFontSizeMultiplier={1.3}

                                    >

                                        {
                                            `${
                                                item.tipo === 'INGRESO'
                                                    ?
                                                    '+'
                                                    :
                                                    '-'
                                            }$${
                                                Number(
                                                    item.valor
                                                )
                                                .toFixed(
                                                    2
                                                )
                                            }`
                                        }

                                    </Text>


                                    <View
                                        style={
                                            styles.editHintRow
                                        }
                                    >

                                        <Text
                                            style={
                                                styles.editHint
                                            }
                                        >
                                            Ver / corregir
                                        </Text>

                                        <Icono
                                            nombre="siguiente"
                                            tamano={16}
                                            color={colors.textSecondary}
                                        />

                                    </View>

                                </View>

                            </Tarjeta>

                        )
                    )
                }

            </>

        );

    };



    return (

        <FondoPantalla>

            <BarraEstado
                estilo="light"
                navigation={navigation}
            />

            <PantallaHeader
                titulo="Finanzas"
                insetSuperior={insets.top}
                testID="finanzas-cabecera"
            />

            <ScrollView
                contentContainerStyle={
                    styles.content
                }
            >

                <View
                    style={
                        styles.periodTabs
                    }
                    accessibilityRole="tablist"
                >

                    {
                        PERIODOS
                        .map(
                            item => {

                                const activo =
                                    periodo === item.id;

                                return (

                                    <Pulsable

                                        key={
                                            item.id
                                        }

                                        testID={
                                            `finanzas-periodo-${item.id.toLowerCase()}`
                                        }

                                        accessibilityRole="tab"

                                        accessibilityState={{
                                            selected: activo
                                        }}

                                        sinMinimo

                                        style={[
                                            styles.periodTab,

                                            activo &&
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

                                                activo &&
                                                styles.periodTabTextActive
                                            ]}
                                        >

                                            {item.label}

                                        </Text>

                                    </Pulsable>

                                );

                            }
                        )
                    }

                </View>


                {contenido()}

            </ScrollView>


            <Fab
                titulo="Nuevo movimiento"
                icono="add"
                testID="fab-nuevo-movimiento"
                onPress={() =>
                    navigation.navigate(
                        'NuevoMovimientoFinanciero'
                    )
                }
            />

        </FondoPantalla>

    );

}



function SummaryCard({
    label,
    icono,
    fondo,
    value,
    testID
}){

    return (

        <View
            style={[
                styles.summaryCard,
                {
                    backgroundColor:
                        fondo
                }
            ]}
            testID={testID}
        >

            <View
                style={
                    styles.balanceEtiqueta
                }
            >

                <Icono
                    nombre={icono}
                    tamano={20}
                    color={colors.white}
                    style={
                        styles.iconoEtiqueta
                    }
                />

                <Text
                    style={
                        styles.cardLabel
                    }
                >
                    {label}
                </Text>

            </View>


            <Text
                style={
                    styles.summaryValue
                }
                maxFontSizeMultiplier={1.3}
                numberOfLines={1}
                adjustsFontSizeToFit
            >

                {
                    `$${
                        Number(
                            value || 0
                        )
                        .toFixed(
                            2
                        )
                    }`
                }

            </Text>

        </View>

    );

}



function maximoGrupo(
    grupo
){

    return Math.max(
        1,
        ...grupo.map(
            item =>
                Number(
                    item.total || 0
                )
        )
    );

}



function ConsolidatedRow({
    label,
    value,
    maximo,
    color
}){

    const proporcion =
        Math.min(
            1,
            Math.max(
                0,
                Number(
                    value || 0
                )
                /
                maximo
            )
        );


    return (

        <View
            style={
                styles.consolidatedRow
            }
        >

            <View
                style={
                    styles.consolidatedTexto
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

                    {
                        `$${
                            Number(
                                value || 0
                            )
                            .toFixed(
                                2
                            )
                        }`
                    }

                </Text>

            </View>


            <View
                style={
                    styles.barraFondo
                }
            >

                <View
                    style={[
                        styles.barra,
                        {
                            width:
                                `${(proporcion * 100).toFixed(2)}%`,
                            backgroundColor:
                                color
                        }
                    ]}
                />

            </View>

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

    content:{

        padding:spacing.pantalla,

        paddingBottom:112

    },


    periodTabs:{

        flexDirection:'row',

        backgroundColor:
            colors.surface,

        borderRadius:radii.md,

        borderWidth:1,

        borderColor:
            colors.borderSoft,

        padding:4,

        marginBottom:spacing.lg

    },


    periodTab:{

        flex:1,

        minHeight:spacing.touchMin,

        alignItems:'center',

        justifyContent:'center',

        borderRadius:radii.sm

    },


    periodTabActive:{

        backgroundColor:
            colors.primary

    },


    periodTabText:{

        ...typography.etiqueta,

        color:
            colors.primaryDark

    },


    periodTabTextActive:{

        color:
            colors.white

    },


    summaryRow:{

        flexDirection:'row',

        justifyContent:'space-between',

        marginBottom:spacing.md

    },


    summaryCard:{

        width:'48.5%',

        padding:spacing.lg,

        borderRadius:radii.lg

    },


    summaryValue:{

        ...typography.cifra,

        fontSize:28,

        lineHeight:34,

        color:
            colors.white,

        marginTop:spacing.xs

    },


    balanceCard:{

        backgroundColor:
            colors.primary,

        padding:spacing.lg,

        borderRadius:radii.lg,

        marginBottom:spacing.sm

    },


    balanceEtiqueta:{

        flexDirection:'row',

        alignItems:'center'

    },


    balanceValor:{

        ...typography.cifra,

        color:
            colors.white,

        marginTop:spacing.xs

    },


    iconoEtiqueta:{

        marginRight:spacing.xs

    },


    cardLabel:{

        ...typography.etiqueta,

        color:
            colors.white

    },


    grupoTitulo:{

        flexDirection:'row',

        alignItems:'center',

        marginBottom:spacing.xs

    },


    consolidatedHeading:{

        ...typography.subtitulo

    },


    egressHeading:{

        marginTop:spacing.lg

    },


    consolidatedRow:{

        paddingVertical:spacing.sm

    },


    consolidatedTexto:{

        flexDirection:'row',

        justifyContent:'space-between',

        alignItems:'center'

    },


    consolidatedLabel:{

        ...typography.cuerpo,

        color:
            colors.text,

        flex:1

    },


    consolidatedValue:{

        ...typography.cuerpoFuerte,

        color:
            colors.text

    },


    barraFondo:{

        height:8,

        borderRadius:4,

        backgroundColor:
            colors.primarySoft,

        marginTop:spacing.xs,

        overflow:'hidden'

    },


    barra:{

        height:'100%',

        borderRadius:4

    },


    emptyLine:{

        ...typography.cuerpo,

        color:
            colors.textSecondary,

        paddingVertical:spacing.xs

    },


    monthRow:{

        flexDirection:'row',

        justifyContent:'space-between',

        alignItems:'center',

        minHeight:spacing.touchMin,

        borderBottomWidth:1,

        borderBottomColor:
            colors.borderSoft

    },


    monthValor:{

        flexDirection:'row',

        alignItems:'center'

    },


    monthLabel:{

        ...typography.cuerpo,

        color:
            colors.text

    },


    monthPositive:{

        ...typography.cuerpoFuerte,

        color:
            colors.successText

    },


    monthNegative:{

        ...typography.cuerpoFuerte,

        color:
            colors.dangerText

    },


    tabs:{

        flexDirection:'row',

        backgroundColor:
            colors.surface,

        borderRadius:radii.md,

        borderWidth:1,

        borderColor:
            colors.borderSoft,

        padding:4,

        marginVertical:spacing.lg

    },


    tab:{

        flex:1,

        minHeight:spacing.touchMin,

        alignItems:'center',

        justifyContent:'center',

        borderRadius:radii.sm

    },


    tabActive:{

        backgroundColor:
            colors.primary

    },


    tabText:{

        ...typography.etiqueta,

        color:
            colors.primaryDark

    },


    tabTextActive:{

        color:
            colors.white

    },


    movementHeader:{

        flexDirection:'row',

        justifyContent:'space-between',

        alignItems:'center'

    },


    date:{

        ...typography.secundario,

        color:
            colors.textSecondary

    },


    categoryRow:{

        flexDirection:'row',

        alignItems:'center',

        marginTop:spacing.xs

    },


    category:{

        ...typography.subtitulo,

        color:
            colors.text,

        flex:1

    },


    aveLinkText:{

        ...typography.etiqueta,

        color:
            colors.primaryDark,

        marginTop:spacing.xs

    },


    detail:{

        ...typography.cuerpo,

        color:
            colors.text,

        marginTop:spacing.xs

    },


    movementBottom:{

        flexDirection:'row',

        justifyContent:'space-between',

        alignItems:'flex-end',

        marginTop:spacing.sm

    },


    movementIncome:{

        ...typography.subtitulo,

        fontSize:22,

        color:
            colors.successText

    },


    movementExpense:{

        ...typography.subtitulo,

        fontSize:22,

        color:
            colors.dangerText

    },


    editHintRow:{

        flexDirection:'row',

        alignItems:'center'

    },


    editHint:{

        ...typography.secundario,

        color:
            colors.textSecondary

    }

});
