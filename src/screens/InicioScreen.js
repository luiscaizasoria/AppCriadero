import React,{
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



import FondoPantalla
    from '../components/FondoPantalla';

import PantallaHeader
    from '../components/PantallaHeader';

import BarraEstado
    from '../components/BarraEstado';

import Tarjeta
    from '../components/Tarjeta';

import TituloSeccion
    from '../components/TituloSeccion';

import MetricCard
    from '../components/MetricCard';

import AlertCard
    from '../components/AlertCard';

import ResumenAlertas
    from '../components/ResumenAlertas';

import AccesoRapido
    from '../components/AccesoRapido';

import IconoCirculo
    from '../components/IconoCirculo';

import Icono
    from '../components/Icono';

import EstadoCarga
    from '../components/EstadoCarga';

import EstadoError
    from '../components/EstadoError';

import EstadoVacio
    from '../components/EstadoVacio';


import ProductionMetricCard
    from '../components/ProductionMetricCard';


import ProductionInfoCard
    from '../components/ProductionInfoCard';


import ProgressBar
    from '../components/charts/ProgressBar';


import ProduccionBarChart
    from '../components/charts/ProduccionBarChart';


import FinanzasBarChart
    from '../components/charts/FinanzasBarChart';



import {
    colors,
    spacing,
    typography
} from '../theme';



import {
    obtenerDashboard
} from '../repositories/DashboardRepository';



import {
    obtenerTodasLasAlertas,
    obtenerResumenAlertas
} from '../repositories/AlertasRepository';






export default function InicioScreen({
    navigation
}){


    const insets =
        useSafeAreaInsets();


    const [
        data,
        setData
    ] = useState(null);



    const [
        alertas,
        setAlertas
    ] = useState([]);



    const [
        loading,
        setLoading
    ] = useState(true);


    // Solo para mostrar el estado de error con reintento (la carga no cambia).
    const [
        error,
        setError
    ] = useState(null);


    const [
        resumenAlertas,
        setResumenAlertas
    ] = useState({
        total:0,
        criticas:0,
        advertencias:0
    });






    const cargar =
        async()=>{


            try{


                setLoading(true);

                setError(null);



                const [

                    dashboard,

                    alertasData,

                    resumenAlertasData

                ] =
                await Promise.all([


                    obtenerDashboard(),


                    obtenerTodasLasAlertas(),


                    obtenerResumenAlertas()

                ]);



                setData(
                    dashboard
                );



                setAlertas(
                    alertasData
                );



                setResumenAlertas(
                    resumenAlertasData
                );



            }
            catch(error){

                console.error(
                    'Error dashboard:',
                    error
                );

                setError(
                    error
                );

            }
            finally{

                setLoading(false);

            }


        };







    useFocusEffect(

        useCallback(()=>{

            cargar();

        },[])

    );






    // Misma navegación de siempre: cada alerta abre su pantalla dentro de esta pestaña.
    const abrirAlerta = item => {

        if(
            item.accionDestino === 'DETALLE_AVE'
        ){

            navigation.navigate(
                'DetalleAve',
                {
                    aveId:item.entidadId
                }
            );

        }



        if(
            item.accionDestino === 'BEBIDA_JAULA'
        ){

            navigation.navigate(
                'BebidaJaula',
                {
                    jaulaId:item.entidadId
                }
            );

        }



        if(
            item.accionDestino === 'ALIMENTACION_JAULA'
        ){

            navigation.navigate(
                'AlimentacionJaula',
                {
                    jaulaId:item.entidadId
                }
            );

        }



        if(
            item.accionDestino === 'DETALLE_JAULA'
        ){

            navigation.navigate(
                'DetalleJaula',
                {
                    jaulaId:item.entidadId
                }
            );

        }

    };






    if(loading){

        return(

            <FondoPantalla>

                <BarraEstado
                    estilo="dark"
                    navigation={navigation}
                />

                <View style={styles.center}>

                    <EstadoCarga />

                </View>

            </FondoPantalla>

        );

    }



    if(
        error
        &&
        !data
    ){

        return(

            <FondoPantalla>

                <BarraEstado
                    estilo="dark"
                    navigation={navigation}
                />

                <View style={styles.center}>

                    <EstadoError
                        mensaje={
                            error?.message
                        }
                        onReintentar={
                            cargar
                        }
                    />

                </View>

            </FondoPantalla>

        );

    }





    const totalAlertas =
        alertas.length;



    return(

        <FondoPantalla>

            <BarraEstado
                estilo="light"
                navigation={navigation}
            />


            <PantallaHeader

                titulo="Criadero Kikirikis"

                insetSuperior={
                    insets.top
                }

                testID="inicio-cabecera"

            />



            <ScrollView

                style={styles.container}

                contentContainerStyle={
                    styles.content
                }

            >



                {
                    totalAlertas > 0
                    ?
                    <Tarjeta

                        onPress={() =>
                            navigation.navigate(
                                'Alertas'
                            )
                        }

                        franja={
                            colors.warning
                        }

                        testID="inicio-aviso-alertas"

                    >

                        <View style={styles.aviso}>

                            <IconoCirculo
                                icono="alertas"
                                color={
                                    colors.warningSoft
                                }
                                colorIcono={
                                    colors.warningText
                                }
                                tamano={40}
                            />

                            <Text style={styles.avisoTexto}>
                                {
                                    totalAlertas === 1
                                    ?
                                    '1 alerta por atender'
                                    :
                                    `${totalAlertas} alertas por atender`
                                }
                            </Text>

                            <Icono
                                nombre="siguiente"
                                tamano={22}
                                color={
                                    colors.primaryDark
                                }
                            />

                        </View>

                    </Tarjeta>
                    :
                    null
                }



                <TituloSeccion
                    icono="aves"
                    indice={0}
                >
                    Tus aves registradas
                </TituloSeccion>



                <View style={styles.row}>


                    <MetricCard

                        icono="aves"

                        indice={0}

                        title="Activas"

                        value={
                            String(
                                data?.aves?.activas || 0
                            )
                        }

                    />


                    <View style={styles.separador} />


                    <MetricCard

                        icono="venta"

                        indice={1}

                        title="Vendidas"

                        value={
                            String(
                                data?.aves?.vendidas || 0
                            )
                        }

                    />


                </View>



                <View style={styles.row}>


                    <MetricCard

                        icono="fallecimiento"

                        indice={2}

                        title="Fallecidas"

                        value={
                            String(
                                data?.aves?.fallecidas || 0
                            )
                        }

                    />


                    <View style={styles.separador} />


                    <MetricCard

                        icono="salud"

                        indice={3}

                        title="Tratamiento"

                        value={
                            String(
                                data?.salud?.tratamiento || 0
                            )
                        }

                    />


                </View>



                <TituloSeccion
                    icono="flash-outline"
                    indice={4}
                >
                    Accesos rápidos
                </TituloSeccion>



                <View style={styles.accesos}>


                    <AccesoRapido

                        icono="anadir"

                        indice={0}

                        titulo="Nueva ave"

                        testID="acceso-nueva-ave"

                        onPress={() =>
                            navigation.navigate(
                                'NuevaAve'
                            )
                        }

                    />


                    <AccesoRapido

                        icono="finanzas"

                        indice={1}

                        titulo="Nuevo movimiento"

                        testID="acceso-nuevo-movimiento"

                        onPress={() =>
                            navigation.navigate(
                                'NuevoMovimientoFinanciero'
                            )
                        }

                    />


                    <AccesoRapido

                        icono="alertas"

                        indice={3}

                        titulo="Alertas"

                        testID="acceso-alertas"

                        onPress={() =>
                            navigation.navigate(
                                'Alertas'
                            )
                        }

                    />


                </View>






                <TituloSeccion
                    icono="aves"
                    indice={2}
                >
                    Distribución por raza
                </TituloSeccion>



                <Tarjeta>


                    <Text style={styles.razaResumen}>

                        Razas presentes:
                        {' '}
                        {
                            data?.totalRazas || 0
                        }

                    </Text>


                    <Text style={styles.razaResumen}>

                        Aves activas:
                        {' '}
                        {
                            data?.aves?.activas || 0
                        }

                    </Text>



                    {
                        Array.isArray(
                            data?.avesPorRaza
                        )
                        &&
                        data.avesPorRaza.length > 0

                        ?

                        data.avesPorRaza.map(
                            item => (

                                <View

                                    key={
                                        item.raza
                                    }

                                    style={
                                        styles.razaItem
                                    }

                                >


                                    <View
                                        style={
                                            styles.razaCabecera
                                        }
                                    >

                                        <Text
                                            style={
                                                styles.razaNombre
                                            }
                                        >
                                            {item.raza}
                                        </Text>


                                        <Text
                                            style={
                                                styles.razaCantidad
                                            }
                                        >
                                            {
                                                item.cantidad
                                            }
                                            {' '}
                                            {
                                                Number(
                                                    item.cantidad
                                                ) === 1
                                                ?
                                                'ave'
                                                :
                                                'aves'
                                            }
                                        </Text>

                                    </View>


                                    <ProgressBar

                                        label={
                                            item.raza
                                        }

                                        value={
                                            Number(
                                                item.porcentaje || 0
                                            )
                                        }

                                        suffix="%"

                                    />


                                </View>

                            )
                        )

                        :

                        <Text
                            style={
                                styles.razaSinDatos
                            }
                        >
                            Sin información de razas.
                        </Text>

                    }


                </Tarjeta>






                <TituloSeccion
                    icono="huevo"
                    indice={1}
                >
                    Producción
                </TituloSeccion>



                <Tarjeta>


                    <View style={styles.productionRow}>


                        <ProductionMetricCard

                            icono="huevo"

                            indice={2}

                            title="Hoy"

                            value={
                                data?.huevos?.hoy || 0
                            }

                        />


                        <ProductionMetricCard

                            icono="calendar-outline"

                            indice={0}

                            title="Este mes"

                            value={
                                data?.huevos?.mes || 0
                            }

                        />


                    </View>



                    <ProductionInfoCard

                        icono="trophy-outline"

                        indice={4}

                        title="Mejor ponedora"

                        value={
                            data?.mejorPonedora?.codigo ||
                            'Sin datos'
                        }

                    />



                    <ProductionInfoCard

                        icono="time-outline"

                        indice={3}

                        title="Mayor postura"

                        value={
                            data?.horaPico?.hora
                            ?
                            `${data.horaPico.hora}:00`
                            :
                            'Sin datos'
                        }

                    />


                </Tarjeta>






                <TituloSeccion
                    icono="produccion"
                    indice={0}
                >
                    Indicadores
                </TituloSeccion>



                <Tarjeta>


                    <View style={styles.indicadorFila}>

                        <Icono
                            nombre="huevo"
                            tamano={20}
                            color={colors.primaryDark}
                        />

                        <Text style={styles.indicadorTexto}>
                            Promedio huevos diarios
                        </Text>

                    </View>


                    <Text
                        style={styles.money}
                        maxFontSizeMultiplier={1.3}
                    >

                        {
                            data?.promedioHuevos || 0
                        }

                    </Text>



                    <ProgressBar

                        label="Ocupación de jaulas"

                        value={
                            data?.ocupacionJaulas?.porcentaje || 0
                        }

                        suffix="%"

                    />


                </Tarjeta>






                <TituloSeccion
                    icono="reportes"
                    indice={2}
                >
                    Producción últimos días
                </TituloSeccion>



                <Tarjeta>


                    {
                        data?.produccionSemana?.length > 0

                        ?

                        <ProduccionBarChart

                            data={
                                data.produccionSemana
                            }

                        />


                        :

                        <Text style={styles.cuerpo}>
                            Sin información de producción.
                        </Text>

                    }


                </Tarjeta>






                <TituloSeccion
                    icono="alertas"
                    indice={3}
                >
                    Alertas
                </TituloSeccion>



                <ResumenAlertas

                    criticas={
                        resumenAlertas.criticas
                    }

                    advertencias={
                        resumenAlertas.advertencias
                    }

                    total={
                        resumenAlertas.total
                    }

                />



                {
                    alertas.length === 0

                    ?

                    <Tarjeta>

                        <EstadoVacio
                            titulo="No existen alertas pendientes."
                            testID="inicio-alertas-vacio"
                        />

                    </Tarjeta>


                    :

                    alertas.map(

                        (item,index)=>(


                            <AlertCard

                                key={
                                    index
                                }


                                testID={
                                    `inicio-alerta-${index}`
                                }


                                nivel={
                                    item.nivel
                                }


                                tipo={
                                    item.tipo
                                }


                                titulo={
                                    item.titulo
                                }


                                mensaje={
                                    item.mensaje
                                }


                                accionDestino={
                                    item.accionDestino
                                }


                                onPress={() =>
                                    abrirAlerta(
                                        item
                                    )
                                }

                            />


                        )

                    )

                }






                <TituloSeccion
                    icono="finanzas"
                    indice={4}
                >
                    Finanzas del mes
                </TituloSeccion>



                <Tarjeta>


                    <FinanzasBarChart

                        ingresos={
                            data?.finanzas?.ingresos || 0
                        }


                        egresos={
                            data?.finanzas?.egresos || 0
                        }


                        utilidad={
                            data?.finanzas?.utilidad || 0
                        }


                    />


                </Tarjeta>






                <TituloSeccion
                    icono="jaulas"
                    indice={1}
                >
                    Jaulas
                </TituloSeccion>



                <Tarjeta>


                    <View style={styles.indicadorFila}>

                        <Icono
                            nombre="jaulas"
                            tamano={20}
                            color={colors.primaryDark}
                        />

                        <Text style={styles.indicadorTexto}>

                            Total:
                            {' '}
                            {
                                data?.jaulas?.total || 0
                            }

                        </Text>

                    </View>



                    <View style={[styles.indicadorFila, styles.jaulaTexto]}>

                        <Icono
                            nombre="aves"
                            tamano={20}
                            color={colors.primaryDark}
                        />

                        <Text style={styles.indicadorTexto}>

                            Ocupadas:
                            {' '}
                            {
                                data?.jaulas?.ocupadas || 0
                            }

                        </Text>

                    </View>



                    <ProgressBar

                        label="Ocupación"

                        value={
                            data?.ocupacionJaulas?.porcentaje || 0
                        }

                        suffix="%"

                    />


                </Tarjeta>



            </ScrollView>

        </FondoPantalla>

    );

}









const styles =
StyleSheet.create({


    container:{
        flex:1
    },


    content:{
        padding:spacing.pantalla,
        paddingTop:spacing.md,
        paddingBottom:spacing.xxl
    },


    row:{
        flexDirection:'row',
        marginBottom:spacing.md
    },


    separador:{
        width:spacing.md
    },


    accesos:{
        flexDirection:'row',
        marginRight:-spacing.sm,
        marginBottom:spacing.md
    },


    aviso:{
        flexDirection:'row',
        alignItems:'center'
    },


    avisoTexto:{
        ...typography.subtitulo,
        flex:1,
        color:colors.text,
        marginHorizontal:spacing.md
    },


    productionRow:{
        flexDirection:'row',
        marginHorizontal:-spacing.xs
    },


    indicadorFila:{
        flexDirection:'row',
        alignItems:'center'
    },


    indicadorTexto:{
        ...typography.cuerpoFuerte,
        color:colors.text,
        marginLeft:spacing.sm
    },


    money:{
        ...typography.display,
        color:colors.primaryDark,
        marginTop:spacing.xs,
        marginBottom:spacing.md
    },


    jaulaTexto:{
        marginTop:spacing.sm,
        marginBottom:spacing.md
    },


    cuerpo:{
        ...typography.cuerpo,
        color:colors.text
    },


    razaResumen:{
        ...typography.cuerpo,
        color:colors.text,
        marginBottom:6
    },


    razaItem:{
        marginTop:spacing.md
    },


    razaCabecera:{
        flexDirection:'row',
        justifyContent:'space-between',
        alignItems:'center',
        marginBottom:4
    },


    razaNombre:{
        ...typography.cuerpoFuerte,
        color:colors.text
    },


    razaCantidad:{
        ...typography.secundario,
        color:colors.textSecondary
    },


    razaSinDatos:{
        ...typography.cuerpo,
        marginTop:spacing.md,
        color:colors.textSecondary
    },


    center:{
        flex:1,
        justifyContent:'center',
        alignItems:'center'
    }


});
