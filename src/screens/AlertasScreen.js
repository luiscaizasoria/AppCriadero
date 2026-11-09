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
    obtenerTodasLasAlertas
} from '../repositories/AlertasRepository';



import AlertCard
    from '../components/AlertCard';


import FondoPantalla
    from '../components/FondoPantalla';


import Tarjeta
    from '../components/Tarjeta';


import TituloSeccion
    from '../components/TituloSeccion';


import ResumenAlertas
    from '../components/ResumenAlertas';


import Pulsable
    from '../components/Pulsable';


import Icono
    from '../components/Icono';


import EstadoCarga
    from '../components/EstadoCarga';


import EstadoError
    from '../components/EstadoError';


import EstadoVacio
    from '../components/EstadoVacio';



import {
    colors,
    radii,
    spacing,
    typography
} from '../theme';





const FILTROS = [

    {
        codigo:'TODAS',
        nombre:'Todas',
        icono:'filtros'
    },

    {
        codigo:'SALUD',
        nombre:'Salud',
        icono:'salud'
    },

    {
        codigo:'JAULA',
        nombre:'Jaulas',
        icono:'jaulas'
    },

    {
        codigo:'PRODUCCION',
        nombre:'Producción',
        icono:'huevo'
    },

    {
        codigo:'FINANZAS',
        nombre:'Finanzas',
        icono:'finanzas'
    }

];







export default function AlertasScreen({

    navigation

}) {



    const [

        alertas,

        setAlertas

    ] = useState([]);



    const [

        filtro,

        setFiltro

    ] = useState('TODAS');



    const [

        loading,

        setLoading

    ] = useState(true);


    // Solo para mostrar el estado de error con reintento (la carga no cambia).
    const [

        error,

        setError

    ] = useState(null);








    const cargar =
        async()=>{


            try{


                setLoading(true);

                setError(null);



                const data =

                    await obtenerTodasLasAlertas();



                setAlertas(
                    data
                );


            }
            catch(error){


                console.error(

                    'Error cargando alertas:',

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









    const alertasFiltradas =

        filtro === 'TODAS'

        ?

        alertas

        :

        alertas.filter(

            item =>

                item.tipo === filtro

        );







    const criticas =

        alertasFiltradas.filter(

            item =>

                item.nivel === 'ALTO'

        ).length;






    const advertencias =

        alertasFiltradas.filter(

            item =>

                item.nivel === 'MEDIO'

        ).length;








    if(loading){

        return (

            <FondoPantalla>

                <View
                    style={styles.center}
                >

                    <EstadoCarga />

                </View>

            </FondoPantalla>

        );

    }



    if(
        error
        &&
        alertas.length === 0
    ){

        return (

            <FondoPantalla>

                <View
                    style={styles.center}
                >

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


            <TituloSeccion
                icono="filtros"
                indice={0}
            >

                Filtros

            </TituloSeccion>





            <View

                style={
                    styles.filters
                }

            >


                {
                    FILTROS.map(

                        item => (


                            <Pulsable

                                key={
                                    item.codigo
                                }

                                testID={
                                    `filtro-${item.codigo.toLowerCase()}`
                                }

                                accessibilityRole="button"

                                accessibilityState={{
                                    selected:
                                        filtro === item.codigo
                                }}

                                style={[

                                    styles.filter,

                                    filtro === item.codigo

                                    &&

                                    styles.filterActive

                                ]}


                                onPress={()=>

                                    setFiltro(
                                        item.codigo
                                    )

                                }

                            >


                                <Icono

                                    nombre={
                                        item.icono
                                    }

                                    tamano={18}

                                    color={
                                        filtro === item.codigo
                                        ?
                                        colors.white
                                        :
                                        colors.primaryDark
                                    }

                                    style={
                                        styles.filterIcono
                                    }

                                />


                                <Text

                                    style={[

                                        styles.filterText,

                                        filtro === item.codigo

                                        &&

                                        styles.filterTextActive

                                    ]}

                                >

                                    {
                                        item.nombre
                                    }

                                </Text>


                            </Pulsable>


                        )

                    )

                }


            </View>






            <TituloSeccion
                icono="reportes"
                indice={2}
            >

                Resumen

            </TituloSeccion>





            <ResumenAlertas

                criticas={
                    criticas
                }

                advertencias={
                    advertencias
                }

                total={
                    alertasFiltradas.length
                }

            />






            <TituloSeccion
                icono="alertas"
                indice={3}
            >

                Alertas pendientes

            </TituloSeccion>






            {

                alertasFiltradas.length === 0


                ?


                <Tarjeta>

                    <EstadoVacio
                        titulo="No existen alertas."
                        testID="alertas-vacio"
                    />

                </Tarjeta>



                :



                alertasFiltradas.map(

                    (item,index)=>(


                        <AlertCard

                            key={
                                index
                            }


                            testID={
                                `alerta-${index}`
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



                            onPress={()=>{



                                if(
                                    item.accionDestino === 'DETALLE_AVE'
                                ){

                                    navigation.navigate(

                                        'DetalleAve',

                                        {
                                            aveId:
                                                item.entidadId
                                        }

                                    );

                                }




                                if(
                                    item.accionDestino === 'BEBIDA_JAULA'
                                ){

                                    navigation.navigate(

                                        'BebidaJaula',

                                        {
                                            jaulaId:
                                                item.entidadId
                                        }

                                    );

                                }




                                if(
                                    item.accionDestino === 'ALIMENTACION_JAULA'
                                ){

                                    navigation.navigate(

                                        'AlimentacionJaula',

                                        {
                                            jaulaId:
                                                item.entidadId
                                        }

                                    );

                                }




                                if(
                                    item.accionDestino === 'DETALLE_JAULA'
                                ){

                                    navigation.navigate(

                                        'DetalleJaula',

                                        {
                                            jaulaId:
                                                item.entidadId
                                        }

                                    );

                                }


                            }}


                        />


                    )

                )

            }





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

        paddingBottom:spacing.xxl

    },



    subtitulo:{

        ...typography.cuerpoFuerte,

        color:colors.textSecondary

    },



    filters:{

        flexDirection:'row',

        flexWrap:'wrap',

        marginBottom:spacing.sm

    },



    filter:{

        flexDirection:'row',

        alignItems:'center',

        minHeight:44,

        backgroundColor:colors.primarySoft,

        paddingHorizontal:spacing.md,

        borderRadius:radii.pill,

        marginRight:spacing.sm,

        marginBottom:spacing.sm

    },



    filterActive:{

        backgroundColor:
            colors.primary

    },



    filterIcono:{

        marginRight:6

    },



    filterText:{

        ...typography.etiqueta,

        color:
            colors.primaryDark

    },



    filterTextActive:{

        color:colors.white

    },



    center:{

        flex:1,

        justifyContent:'center',

        alignItems:'center'

    }


});
