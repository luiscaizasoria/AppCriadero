import React, {
    useCallback,
    useState
} from 'react';


import {
    View,
    Text,
    ScrollView,
    StyleSheet,
    ActivityIndicator,
    TouchableOpacity
} from 'react-native';


import {
    useFocusEffect
} from '@react-navigation/native';



import {
    obtenerTodasLasAlertas
} from '../repositories/AlertasRepository';



import AlertCard
    from '../components/AlertCard';


import Card
    from '../components/Card';


import Header
    from '../components/Header';


import SectionTitle
    from '../components/SectionTitle';



import {
    COLORS
} from '../config/constants';





const FILTROS = [

    {
        codigo:'TODAS',
        nombre:'Todas'
    },

    {
        codigo:'SALUD',
        nombre:'🩺 Salud'
    },

    {
        codigo:'JAULA',
        nombre:'🏠 Jaulas'
    },

    {
        codigo:'PRODUCCION',
        nombre:'🥚 Producción'
    },

    {
        codigo:'FINANZAS',
        nombre:'💰 Finanzas'
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








    const cargar =
        async()=>{


            try{


                setLoading(true);



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









    return (

        <ScrollView

            style={
                styles.container
            }

            contentContainerStyle={
                styles.content
            }

        >



            <Header

                title="Alertas"

                subtitle="Estado y pendientes del criadero"

            />









            <SectionTitle>

                Filtros

            </SectionTitle>





            <View

                style={
                    styles.filters
                }

            >


                {
                    FILTROS.map(

                        item => (


                            <TouchableOpacity

                                key={
                                    item.codigo
                                }

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


                            </TouchableOpacity>


                        )

                    )

                }


            </View>









            <SectionTitle>

                Resumen

            </SectionTitle>





            <Card>



                <Text style={styles.summary}>

                    🔴 Críticas:

                    {' '}

                    {
                        criticas
                    }

                </Text>




                <Text style={styles.summary}>

                    🟡 Advertencias:

                    {' '}

                    {
                        advertencias
                    }

                </Text>




                <Text style={styles.summary}>

                    🔔 Total:

                    {' '}

                    {
                        alertasFiltradas.length
                    }

                </Text>


            </Card>









            <SectionTitle>

                Alertas pendientes

            </SectionTitle>







            <Card>



                {

                    alertasFiltradas.length === 0


                    ?


                    <Text>

                        ✅ No existen alertas.

                    </Text>



                    :



                    alertasFiltradas.map(

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



                                onPress={()=>{



                                    if(
                                        item.accionDestino === 'DETALLE_AVE'
                                    ){

                                        navigation.navigate(

                                            'Aves',

                                            {
                                                screen:
                                                    'DetalleAve',

                                                params:{

                                                    aveId:
                                                        item.entidadId

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
                                                screen:
                                                    'BebidaJaula',

                                                params:{

                                                    jaulaId:
                                                        item.entidadId

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
                                                screen:
                                                    'AlimentacionJaula',

                                                params:{

                                                    jaulaId:
                                                        item.entidadId

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
                                                screen:
                                                    'DetalleJaula',

                                                params:{

                                                    jaulaId:
                                                        item.entidadId

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



    filters:{

        flexDirection:'row',

        flexWrap:'wrap',

        marginBottom:10

    },



    filter:{

        backgroundColor:'#e8eeee',

        paddingHorizontal:14,

        paddingVertical:9,

        borderRadius:20,

        marginRight:8,

        marginBottom:8

    },



    filterActive:{

        backgroundColor:
            COLORS.primary

    },



    filterText:{

        color:
            COLORS.text

    },



    filterTextActive:{

        color:'#fff',

        fontWeight:'bold'

    },



    summary:{

        fontSize:17,

        marginBottom:10,

        color:
            COLORS.text

    },



    center:{

        flex:1,

        justifyContent:'center',

        alignItems:'center'

    }


});
export async function obtenerResumenAlertas(){

    const alertas =
        await obtenerTodasLasAlertas();


    return {

        total:
            alertas.length,


        criticas:
            alertas.filter(
                x =>
                x.nivel === 'ALTO'
            ).length,


        advertencias:
            alertas.filter(
                x =>
                x.nivel === 'MEDIO'
            ).length

    };

}