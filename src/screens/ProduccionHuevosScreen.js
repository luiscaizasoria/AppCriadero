import React, {
    useCallback,
    useState
} from 'react';


import {
    View,
    Text,
    ScrollView,
    StyleSheet,
    Alert
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



import FondoPantalla
    from '../components/FondoPantalla';


import Tarjeta
    from '../components/Tarjeta';


import TituloSeccion
    from '../components/TituloSeccion';


import IconoCirculo
    from '../components/IconoCirculo';


import Icono
    from '../components/Icono';


import EstadoCarga
    from '../components/EstadoCarga';


import EstadoError
    from '../components/EstadoError';


import HuevoRanking
    from '../components/HuevoRanking';


import ProduccionBarChart
    from '../components/charts/ProduccionBarChart';


import ProduccionJaulaBarChart
    from '../components/charts/ProduccionJaulaBarChart';



import {
    colors,
    spacing,
    typography
} from '../theme';





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



    const [
        errorCarga,
        setErrorCarga
    ] = useState(false);






    const cargar =
        async()=>{


            try{


                setLoading(true);

                setErrorCarga(false);



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

                setErrorCarga(true);

                Alert.alert(
                    'Error',
                    'No fue posible cargar la producción de huevos.'
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

            <FondoPantalla>

                <View
                    style={styles.center}
                >

                    <EstadoCarga
                        mensaje="Cargando producción..."
                    />

                </View>

            </FondoPantalla>

        );

    }



    if(errorCarga){

        return(

            <FondoPantalla>

                <View
                    style={styles.center}
                >

                    <EstadoError
                        titulo="No fue posible cargar la producción de huevos."
                        onReintentar={
                            cargar
                        }
                    />

                </View>

            </FondoPantalla>

        );

    }







    return(

        <FondoPantalla>

        <ScrollView

            style={styles.container}

            contentContainerStyle={
                styles.content
            }

        >


            <TituloSeccion
                icono="huevo"
                indice={1}
            >
                Resumen
            </TituloSeccion>


            <Tarjeta>

                <Metrica
                    icono="huevo"
                    indice={3}
                    etiqueta="Hoy"
                    valor={
                        resumen?.hoy || 0
                    }
                />


                <Metrica
                    icono="calendar-outline"
                    indice={0}
                    etiqueta="Semana"
                    valor={
                        resumen?.semana || 0
                    }
                />


                <Metrica
                    icono="huevo"
                    indice={2}
                    etiqueta="Mes"
                    valor={
                        resumen?.mes || 0
                    }
                    ultima
                />

            </Tarjeta>



            <TituloSeccion
                icono="bar-chart-outline"
                indice={0}
            >
                Producción últimos días
            </TituloSeccion>


            <Tarjeta>

                <ProduccionBarChart

                    data={
                        dias
                    }

                />

            </Tarjeta>



            <TituloSeccion
                icono="trophy-outline"
                indice={3}
            >
                Mejores ponedoras
            </TituloSeccion>


            <Tarjeta>

                {
                    ponedoras.length === 0
                    &&
                    (
                        <Text
                            style={styles.vacio}
                        >
                            Aún no hay huevos registrados.
                        </Text>
                    )
                }

                {
                    ponedoras.map(

                        (item,index)=>(

                            <HuevoRanking

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

            </Tarjeta>



            <TituloSeccion
                icono="time-outline"
                indice={1}
            >
                Horario de postura
            </TituloSeccion>


            <Tarjeta>

                {
                    horas.length === 0
                    &&
                    (
                        <Text
                            style={styles.vacio}
                        >
                            Aún no hay huevos registrados.
                        </Text>
                    )
                }

                {
                    horas.map(

                        item=>(

                            <View
                                key={
                                    item.hora
                                }
                                style={
                                    styles.horaFila
                                }
                            >

                                <Icono
                                    nombre="time-outline"
                                    tamano={20}
                                    color={colors.textSecondary}
                                    style={
                                        styles.horaIcono
                                    }
                                />

                                <Text
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

                            </View>

                        )

                    )
                }

            </Tarjeta>



            <TituloSeccion
                icono="grid-outline"
                indice={2}
            >
                Producción por jaula
            </TituloSeccion>


            <Tarjeta>

                <ProduccionJaulaBarChart

                    data={
                        jaulas
                    }

                />

            </Tarjeta>


        </ScrollView>

        </FondoPantalla>

    );

}



// Cifra del resumen: etiqueta y número apilados (los flujos buscan el número debajo de la etiqueta)
function Metrica({
    icono,
    indice,
    etiqueta,
    valor,
    ultima = false
}){

    return(

        <View
            style={[
                styles.metrica,
                ultima
                &&
                styles.metricaUltima
            ]}
        >

            <IconoCirculo
                icono={icono}
                indice={indice}
                tamano={48}
            />

            <View
                style={styles.metricaTextos}
            >

                <Text
                    style={styles.metricaEtiqueta}
                >
                    {etiqueta}
                </Text>


                <Text
                    style={styles.big}
                    maxFontSizeMultiplier={1.3}
                >
                    {valor}
                </Text>

            </View>

        </View>

    );

}







const styles =
StyleSheet.create({


    container:{

        flex:1

    },



    content:{

        padding:spacing.pantalla,

        paddingBottom:40

    },



    center:{

        flex:1,

        justifyContent:'center',

        alignItems:'center'

    },



    metrica:{

        flexDirection:'row',

        alignItems:'center',

        paddingBottom:spacing.md,

        marginBottom:spacing.md,

        borderBottomWidth:1,

        borderBottomColor:
            colors.borderSoft

    },



    metricaUltima:{

        paddingBottom:0,

        marginBottom:0,

        borderBottomWidth:0

    },



    metricaTextos:{

        flex:1,

        marginLeft:spacing.md

    },



    metricaEtiqueta:{

        ...typography.etiqueta,

        color:
            colors.textSecondary

    },



    big:{

        ...typography.cifra,

        color:
            colors.primaryDark

    },



    horaFila:{

        flexDirection:'row',

        alignItems:'center',

        marginBottom:spacing.sm

    },



    horaIcono:{

        marginRight:spacing.sm

    },



    item:{

        ...typography.cuerpo,

        color:
            colors.text

    },



    vacio:{

        ...typography.cuerpo,

        color:
            colors.textSecondary

    }


});
