import React, {
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



import {
    obtenerResumenProduccion,
    obtenerRankingPonedoras,
    obtenerProduccionPorDia,
    obtenerProduccionPorJaula
} from '../repositories/ProduccionRepository';



import {
    obtenerProduccionPorHora
} from '../repositories/HuevoRepository';



import Header
    from '../components/Header';


import Card
    from '../components/Card';


import SectionTitle
    from '../components/SectionTitle';


import ProduccionBarChart
    from '../components/charts/ProduccionBarChart';


import ProduccionJaulaBarChart
    from '../components/charts/ProduccionJaulaBarChart';


import RankingCard
    from '../components/RankingCard';



import {
    COLORS
} from '../config/constants';





export default function ProduccionHuevosScreen(){


    const [
        resumen,
        setResumen
    ] = useState(null);



    const [
        ponedoras,
        setPonedoras
    ] = useState([]);



    const [
        dias,
        setDias
    ] = useState([]);



    const [
        horas,
        setHoras
    ] = useState([]);



    const [
        jaulas,
        setJaulas
    ] = useState([]);



    const [
        loading,
        setLoading
    ] = useState(true);






    const cargar =
        async()=>{


            try{


                setLoading(true);



                const [

                    resumenData,

                    ponedorasData,

                    diasData,

                    horasData,

                    jaulasData

                ] =
                await Promise.all([


                    obtenerResumenProduccion(),


                    obtenerRankingPonedoras(),


                    obtenerProduccionPorDia(),


                    obtenerProduccionPorHora(),


                    obtenerProduccionPorJaula()


                ]);



                setResumen(
                    resumenData
                );



                setPonedoras(
                    ponedorasData
                );



                setDias(
                    diasData
                );



                setHoras(
                    horasData
                );



                setJaulas(
                    jaulasData
                );


            }
            catch(error){

                console.error(
                    'Error cargando producción:',
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

            <View
                style={styles.center}
            >

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

                title="Producción"

                subtitle="Análisis avanzado de postura de huevos"

            />









            <SectionTitle>
                🥚 Resumen
            </SectionTitle>




            <Card>


                <Text>
                    🥚 Hoy
                </Text>


                <Text style={styles.big}>

                    {
                        resumen?.hoy || 0
                    }

                </Text>




                <Text>
                    📅 Semana
                </Text>


                <Text style={styles.big}>

                    {
                        resumen?.semana || 0
                    }

                </Text>




                <Text>
                    🥚 Mes
                </Text>


                <Text style={styles.big}>

                    {
                        resumen?.mes || 0
                    }

                </Text>


            </Card>









            <SectionTitle>
                📊 Producción últimos días
            </SectionTitle>




            <Card>


                <ProduccionBarChart

                    data={
                        dias
                    }

                />


            </Card>









            <SectionTitle>
                🏆 Mejores ponedoras
            </SectionTitle>




            <Card>


                {
                    ponedoras.map(

                        (item,index)=>(


                            <RankingCard

                                key={
                                    item.id
                                }


                                posicion={
                                    index + 1
                                }


                                codigo={
                                    item.codigo
                                }


                                cantidad={
                                    item.cantidad
                                }


                            />


                        )

                    )
                }


            </Card>









            <SectionTitle>
                ⏰ Horario de postura
            </SectionTitle>




            <Card>


                {
                    horas.map(

                        item=>(

                            <Text

                                key={
                                    item.hora
                                }

                                style={
                                    styles.item
                                }

                            >

                                {
                                    item.hora
                                }
                                :00

                                {' - '}

                                {
                                    item.cantidad
                                }

                                {' huevos'}

                            </Text>

                        )

                    )
                }


            </Card>









            <SectionTitle>
                🏠 Producción por jaula
            </SectionTitle>




            <Card>


                <ProduccionJaulaBarChart

                    data={
                        jaulas
                    }

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

        padding:16,

        paddingBottom:40

    },



    center:{

        flex:1,

        justifyContent:'center',

        alignItems:'center'

    },



    big:{

        fontSize:35,

        fontWeight:'bold',

        color:
            COLORS.primary,

        marginBottom:15

    },



    item:{

        fontSize:16,

        marginBottom:10

    }


});