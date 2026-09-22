import React,{
    useCallback,
    useState
} from 'react';


import {
    View,
    Text,
    ScrollView,
    StyleSheet,
    ActivityIndicator
} from 'react-native';


import {
    useFocusEffect
} from '@react-navigation/native';



import Header
    from '../components/Header';

import Card
    from '../components/Card';

import SectionTitle
    from '../components/SectionTitle';

import MetricCard
    from '../components/MetricCard';

import AlertCard
    from '../components/AlertCard';


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
    COLORS
} from '../config/constants';



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







    if(loading){

        return(

            <View style={styles.center}>

                <ActivityIndicator

                    size="large"

                    color={
                        COLORS.primary
                    }

                />

            </View>

        );

    }








    return(

        <ScrollView

            style={styles.container}

            contentContainerStyle={
                styles.content
            }

        >



            <Header

                title="Criadero Kikirikis"

                subtitle="Estado general del criadero"

            />








            <SectionTitle>
                Aves
            </SectionTitle>



            <View style={styles.row}>


                <MetricCard

                    icon="🐔"

                    title="Activas"

                    value={
                        String(
                            data?.aves?.activas || 0
                        )
                    }

                />



                <MetricCard

                    icon="💰"

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

                    icon="⚰"

                    title="Fallecidas"

                    value={
                        String(
                            data?.aves?.fallecidas || 0
                        )
                    }

                />



                <MetricCard

                    icon="🟡"

                    title="Tratamiento"

                    value={
                        String(
                            data?.salud?.tratamiento || 0
                        )
                    }

                />


            </View>












            <SectionTitle>
                🐔 Distribución por raza
            </SectionTitle>



            <Card>


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


            </Card>











            <SectionTitle>
                🥚 Producción
            </SectionTitle>



            <Card>


                <View style={styles.productionRow}>


                    <ProductionMetricCard

                        icon="🥚"

                        title="Hoy"

                        value={
                            data?.huevos?.hoy || 0
                        }

                    />


                    <ProductionMetricCard

                        icon="📅"

                        title="Este mes"

                        value={
                            data?.huevos?.mes || 0
                        }

                    />


                </View>




                <ProductionInfoCard

                    icon="🏆"

                    title="Mejor ponedora"

                    value={
                        data?.mejorPonedora?.codigo ||
                        'Sin datos'
                    }

                />



                <ProductionInfoCard

                    icon="⏰"

                    title="Mayor postura"

                    value={
                        data?.horaPico?.hora
                        ?
                        `${data.horaPico.hora}:00`
                        :
                        'Sin datos'
                    }

                />


            </Card>











            <SectionTitle>
                📈 Indicadores
            </SectionTitle>



            <Card>


                <Text>
                    🥚 Promedio huevos diarios
                </Text>


                <Text style={styles.money}>

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


            </Card>











            <SectionTitle>
                📊 Producción últimos días
            </SectionTitle>



            <Card>


                {
                    data?.produccionSemana?.length > 0

                    ?

                    <ProduccionBarChart

                        data={
                            data.produccionSemana
                        }

                    />


                    :

                    <Text>
                        Sin información de producción.
                    </Text>

                }


            </Card>











            <SectionTitle>
                🔔 Alertas
            </SectionTitle>




            <Card>


                <Text style={styles.alertResumen}>
                    🔴 Críticas:
                    {' '}
                    {resumenAlertas.criticas}
                </Text>


                <Text style={styles.alertResumen}>
                    🟡 Advertencias:
                    {' '}
                    {resumenAlertas.advertencias}
                </Text>


                <Text style={styles.alertResumen}>
                    🔔 Total:
                    {' '}
                    {resumenAlertas.total}
                </Text>


            </Card>



            <Card>


                {
                    alertas.length === 0

                    ?

                    <Text>
                        ✅ No existen alertas pendientes.
                    </Text>


                    :

                    alertas.map(

                        (item,index)=>(


                            <AlertCard

                                key={
                                    index
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


                                onPress={() => {

                                    if(
                                        item.accionDestino === 'DETALLE_AVE'
                                    ){

                                        navigation.navigate(
                                            'Aves',
                                            {
                                                screen:'DetalleAve',
                                                params:{
                                                    aveId:item.entidadId
                                                }
                                            }
                                        );

                                    }



                                    if(
                                        item.accionDestino === 'BEBIDA_JAULA'
                                    ){

                                        navigation.navigate(
                                            'Jaulas',
                                            {
                                                screen:'BebidaJaula',
                                                params:{
                                                    jaulaId:item.entidadId
                                                }
                                            }
                                        );

                                    }



                                    if(
                                        item.accionDestino === 'ALIMENTACION_JAULA'
                                    ){

                                        navigation.navigate(
                                            'Jaulas',
                                            {
                                                screen:'AlimentacionJaula',
                                                params:{
                                                    jaulaId:item.entidadId
                                                }
                                            }
                                        );

                                    }



                                    if(
                                        item.accionDestino === 'DETALLE_JAULA'
                                    ){

                                        navigation.navigate(
                                            'Jaulas',
                                            {
                                                screen:'DetalleJaula',
                                                params:{
                                                    jaulaId:item.entidadId
                                                }
                                            }
                                        );

                                    }

                                }}

                            />


                        )

                    )

                }


            </Card>











            <SectionTitle>
                💰 Finanzas del mes
            </SectionTitle>




            <Card>


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


            </Card>











            <SectionTitle>
                🏠 Jaulas
            </SectionTitle>




            <Card>


                <Text>

                    🏠 Total:
                    {' '}
                    {
                        data?.jaulas?.total || 0
                    }

                </Text>




                <Text style={styles.jaulaTexto}>

                    🐔 Ocupadas:
                    {' '}
                    {
                        data?.jaulas?.ocupadas || 0
                    }

                </Text>



                <ProgressBar

                    label="Ocupación"

                    value={
                        data?.ocupacionJaulas?.porcentaje || 0
                    }

                    suffix="%"

                />


            </Card>





        </ScrollView>

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
        padding:16
    },


    row:{
        flexDirection:'row',
        justifyContent:'space-between'
    },


    money:{
        fontSize:24,
        fontWeight:'bold',
        color:
            COLORS.primary,
        marginBottom:10
    },


    jaulaTexto:{
        marginTop:10,
        marginBottom:15
    },


    razaResumen:{

        fontSize:15,

        color:
            COLORS.text,

        marginBottom:6

    },


    razaItem:{

        marginTop:14

    },


    razaCabecera:{

        flexDirection:'row',

        justifyContent:'space-between',

        alignItems:'center',

        marginBottom:4

    },


    razaNombre:{

        fontSize:16,

        fontWeight:'600',

        color:
            COLORS.text

    },


    razaCantidad:{

        fontSize:14,

        color:
            COLORS.textSecondary

    },


    razaSinDatos:{

        marginTop:12,

        color:
            COLORS.textSecondary

    },


    center:{
        flex:1,
        justifyContent:'center',
        alignItems:'center'
    }


});
