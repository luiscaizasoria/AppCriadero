import React,{
    useCallback,
    useRef,
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

import TarjetaEnlace
    from '../components/TarjetaEnlace';

import Pulsable
    from '../components/Pulsable';

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



// Solo para localizar la ficha de la mejor ponedora por su código (el panel no trae el id).
import {
    obtenerAvesActivas,
    obtenerAvesVendidas,
    obtenerAvesFallecidas
} from '../repositories/AveRepository';



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






    // Destinos de las tarjetas: todo se abre dentro de la pestaña Inicio (la flecha vuelve aquí).
    const irAves = params =>
        navigation.navigate(
            'ListaAves',
            params
        );

    const irJaulas = () =>
        navigation.navigate(
            'ListaJaulas'
        );

    const irFinanzas = () =>
        navigation.navigate(
            'FinanzasInicio'
        );

    const irProduccion = () =>
        navigation.navigate(
            'ProduccionHuevos'
        );

    const irAlertas = () =>
        navigation.navigate(
            'Alertas'
        );


    const buscandoPonedora =
        useRef(false);

    const abrirMejorPonedora = async () => {

        const codigo =
            data?.mejorPonedora?.codigo;

        if(
            !codigo
            ||
            buscandoPonedora.current
        ){
            return;
        }

        buscandoPonedora.current = true;

        try{

            for(
                const leer of [
                    obtenerAvesActivas,
                    obtenerAvesVendidas,
                    obtenerAvesFallecidas
                ]
            ){

                const lista =
                    await leer();

                const ave =
                    lista.find(
                        item =>
                            item.codigo === codigo
                    );

                if(ave){

                    navigation.navigate(
                        'DetalleAve',
                        {
                            aveId:ave.id
                        }
                    );

                    return;

                }

            }

        }
        catch(error){

            console.error(
                'Error buscando la mejor ponedora:',
                error
            );

        }
        finally{

            buscandoPonedora.current = false;

        }

        // Si no se encontró la ficha, se abre la lista buscando por código.
        irAves({
            estado:'ACTIVAS',
            busqueda:codigo
        });

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

                        testID="inicio-aves-activas"

                        accessibilityLabel="Ver aves activas"

                        onPress={() =>
                            irAves({estado:'ACTIVAS'})
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

                        testID="inicio-aves-vendidas"

                        accessibilityLabel="Ver aves vendidas"

                        onPress={() =>
                            irAves({estado:'VENDIDAS'})
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

                        testID="inicio-aves-fallecidas"

                        accessibilityLabel="Ver aves fallecidas"

                        onPress={() =>
                            irAves({estado:'FALLECIDAS'})
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

                        testID="inicio-aves-tratamiento"

                        accessibilityLabel="Ver aves en tratamiento"

                        onPress={() =>
                            irAves({
                                estado:'ACTIVAS',
                                filtroSalud:'EN_TRATAMIENTO'
                            })
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

                                <Pulsable

                                    key={
                                        item.raza
                                    }

                                    style={
                                        styles.razaItem
                                    }

                                    escala={0.98}

                                    accessibilityRole="button"

                                    accessibilityLabel={
                                        `Ver aves de la raza ${item.raza}`
                                    }

                                    testID={
                                        `inicio-raza-${item.raza}`
                                    }

                                    onPress={() =>
                                        irAves({
                                            estado:'ACTIVAS',
                                            filtroRaza:item.raza
                                        })
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

                                        <Icono
                                            nombre="siguiente"
                                            tamano={20}
                                            color={
                                                colors.primaryDark
                                            }
                                            style={
                                                styles.chevronFila
                                            }
                                        />

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


                                </Pulsable>

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

                            testID="inicio-huevos-hoy"

                            accessibilityLabel="Ver producción de huevos de hoy"

                            onPress={irProduccion}

                        />


                        <ProductionMetricCard

                            icono="calendar-outline"

                            indice={0}

                            title="Este mes"

                            value={
                                data?.huevos?.mes || 0
                            }

                            testID="inicio-huevos-mes"

                            accessibilityLabel="Ver producción de huevos del mes"

                            onPress={irProduccion}

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

                        testID="inicio-mejor-ponedora"

                        accessibilityLabel={
                            `Abrir ficha de ${data?.mejorPonedora?.codigo}`
                        }

                        onPress={
                            data?.mejorPonedora?.codigo
                            ?
                            abrirMejorPonedora
                            :
                            undefined
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

                        testID="inicio-hora-pico"

                        accessibilityLabel="Ver producción de huevos por hora"

                        onPress={
                            data?.horaPico?.hora
                            ?
                            irProduccion
                            :
                            undefined
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


                    <Pulsable
                        testID="inicio-promedio-huevos"
                        accessibilityRole="button"
                        accessibilityLabel="Ver producción de huevos"
                        sinMinimo
                        escala={0.98}
                        style={styles.enlaceFila}
                        onPress={irProduccion}
                    >

                        <View style={styles.enlaceContenido}>

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

                        </View>

                        <Icono
                            nombre="siguiente"
                            tamano={22}
                            color={colors.primaryDark}
                        />

                    </Pulsable>



                    <Pulsable
                        testID="inicio-ocupacion-indicador"
                        accessibilityRole="button"
                        accessibilityLabel="Ver jaulas"
                        sinMinimo
                        escala={0.98}
                        style={styles.enlaceFila}
                        onPress={irJaulas}
                    >

                        <View style={styles.enlaceContenido}>

                            <ProgressBar

                                label="Ocupación de jaulas"

                                value={
                                    data?.ocupacionJaulas?.porcentaje || 0
                                }

                                suffix="%"

                            />

                        </View>

                        <Icono
                            nombre="siguiente"
                            tamano={22}
                            color={colors.primaryDark}
                        />

                    </Pulsable>


                </Tarjeta>






                <TituloSeccion
                    icono="reportes"
                    indice={2}
                >
                    Producción últimos días
                </TituloSeccion>



                {
                    data?.produccionSemana?.length > 0

                    ?

                    <TarjetaEnlace
                        testID="inicio-produccion-semana"
                        accessibilityLabel="Ver producción de huevos"
                        onPress={irProduccion}
                    >

                        <ProduccionBarChart

                            data={
                                data.produccionSemana
                            }

                        />

                    </TarjetaEnlace>

                    :

                    <Tarjeta>

                        <Text style={styles.cuerpo}>
                            Sin información de producción.
                        </Text>

                    </Tarjeta>

                }






                <TituloSeccion
                    icono="alertas"
                    indice={3}
                >
                    Alertas
                </TituloSeccion>



                <Pulsable
                    testID="inicio-resumen-alertas"
                    accessibilityRole="button"
                    accessibilityLabel="Abrir alertas"
                    sinMinimo
                    escala={0.98}
                    onPress={irAlertas}
                >

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

                </Pulsable>



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



                <TarjetaEnlace
                    testID="inicio-finanzas"
                    accessibilityLabel="Abrir finanzas"
                    onPress={irFinanzas}
                >


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


                </TarjetaEnlace>






                <TituloSeccion
                    icono="jaulas"
                    indice={1}
                >
                    Jaulas
                </TituloSeccion>



                <TarjetaEnlace
                    testID="inicio-jaulas"
                    accessibilityLabel="Abrir jaulas"
                    onPress={irJaulas}
                >


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


                </TarjetaEnlace>



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
        flex:1,
        color:colors.text
    },


    chevronFila:{
        marginLeft:spacing.xs
    },


    enlaceFila:{
        flexDirection:'row',
        alignItems:'center',
        minHeight:spacing.touchMin
    },


    enlaceContenido:{
        flex:1,
        minWidth:0
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
