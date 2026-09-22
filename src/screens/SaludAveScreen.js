import React, {
    useCallback,
    useState
} from 'react';


import {
    View,
    Text,
    TextInput,
    ScrollView,
    TouchableOpacity,
    StyleSheet,
    ActivityIndicator,
    Alert
} from 'react-native';



import {
    useFocusEffect
} from '@react-navigation/native';



import {
    obtenerAvePorId
} from '../repositories/AveRepository';



import {
    obtenerEnfermedades,
    obtenerMedicamentos,
    registrarDiagnostico,
    obtenerHistorialSaludAve
} from '../repositories/SaludRepository';



import {
    COLORS
} from '../config/constants';





export default function SaludAveScreen({
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
        enfermedades,
        setEnfermedades
    ] = useState([]);



    const [
        medicamentos,
        setMedicamentos
    ] = useState([]);



    const [
        historial,
        setHistorial
    ] = useState([]);



    const [
        enfermedadSeleccionada,
        setEnfermedadSeleccionada
    ] = useState(null);



    const [
        medicamentoSeleccionado,
        setMedicamentoSeleccionado
    ] = useState(null);



    const [
        sintomas,
        setSintomas
    ] = useState('');



    const [
        dosis,
        setDosis
    ] = useState('');



    const [
        observacion,
        setObservacion
    ] = useState('');



    const [
        loading,
        setLoading
    ] = useState(true);



    const [
        guardando,
        setGuardando
    ] = useState(false);





    useFocusEffect(

        useCallback(
            () => {

                cargarDatos();

            },
            []
        )

    );





    const cargarDatos =
        async () => {


            try {


                setLoading(
                    true
                );


                const [

                    aveData,

                    enfermedadesData,

                    medicamentosData,

                    historialData

                ]
                =
                await Promise.all([


                    obtenerAvePorId(
                        aveId
                    ),


                    obtenerEnfermedades(),


                    obtenerMedicamentos(),


                    obtenerHistorialSaludAve(
                        aveId
                    )


                ]);



                setAve(
                    aveData
                );


                setEnfermedades(
                    enfermedadesData
                );


                setMedicamentos(
                    medicamentosData
                );


                setHistorial(
                    historialData
                );



            }
            catch(error){

                console.error(
                    error
                );

            }
            finally{

                setLoading(
                    false
                );

            }


        };





    const guardar =
        async () => {


            if(
                !enfermedadSeleccionada
            ){

                Alert.alert(
                    'Enfermedad requerida',
                    'Selecciona una enfermedad.'
                );

                return;

            }



            try{


                setGuardando(
                    true
                );



                await registrarDiagnostico({

                    aveId,

                    enfermedad:
                        enfermedadSeleccionada.nombre,


                    sintomas:
                        sintomas.trim(),


                    observacion:
                        observacion.trim(),


                    medicamento:
                        medicamentoSeleccionado
                        ?
                        medicamentoSeleccionado.nombre
                        :
                        null,


                    dosis:
                        dosis.trim(),


                    fecha:
                        new Date()
                        .toISOString()

                });



                Alert.alert(

                    'Registro guardado',

                    'El tratamiento fue registrado correctamente.',

                    [
                        {
                            text:
                                'Aceptar',

                            onPress:
                                cargarDatos

                        }
                    ]

                );


            }
            catch(error){


                console.error(
                    error
                );


            }
            finally{

                setGuardando(
                    false
                );

            }


        };





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



            <Text
                style={
                    styles.title
                }
            >

                🩺 Salud {ave.codigo}

            </Text>





            <View
                style={[
                    styles.status,

                    {
                        backgroundColor:
                            colorEstado(
                                ave.estado_salud
                            )
                    }

                ]}
            >

                <Text
                    style={
                        styles.statusText
                    }
                >

                    {
                        textoEstado(
                            ave.estado_salud
                        )
                    }

                </Text>


            </View>





            {
                ave.estado_salud ===
                'EN_TRATAMIENTO'
                &&

                (

                    <TouchableOpacity

                        style={
                            styles.recoveryButton
                        }

                        onPress={() =>
                            navigation.navigate(
                                'FinalizarTratamiento',
                                {
                                    aveId
                                }
                            )
                        }

                    >

                        <Text
                            style={
                                styles.buttonText
                            }
                        >

                            ✅ Finalizar tratamiento

                        </Text>


                    </TouchableOpacity>

                )

            }







            <Text
                style={
                    styles.sectionTitle
                }
            >

                Enfermedad

            </Text>





            <View
                style={
                    styles.options
                }
            >

                {
                    enfermedades.map(
                        item => (

                            <TouchableOpacity

                                key={
                                    item.id
                                }

                                style={[
                                    styles.option,

                                    enfermedadSeleccionada?.id
                                    ===
                                    item.id
                                    &&
                                    styles.selected

                                ]}

                                onPress={() =>
                                    setEnfermedadSeleccionada(
                                        item
                                    )
                                }

                            >

                                <Text
                                    style={[
                                        styles.optionText,

                                        enfermedadSeleccionada?.id
                                        ===
                                        item.id
                                        &&
                                        styles.selectedText
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





            <TextInput

                style={[
                    styles.input,

                    styles.textArea
                ]}

                multiline

                value={
                    sintomas
                }

                onChangeText={
                    setSintomas
                }

                placeholder="Síntomas"

            />





            <Text
                style={
                    styles.sectionTitle
                }
            >

                Medicamento

            </Text>





            <View
                style={
                    styles.options
                }
            >

                {
                    medicamentos.map(
                        item => (

                            <TouchableOpacity

                                key={
                                    item.id
                                }

                                style={[
                                    styles.option,

                                    medicamentoSeleccionado?.id
                                    ===
                                    item.id
                                    &&
                                    styles.selected

                                ]}

                                onPress={() =>
                                    setMedicamentoSeleccionado(
                                        item
                                    )
                                }

                            >

                                <Text
                                    style={[
                                        styles.optionText,

                                        medicamentoSeleccionado?.id
                                        ===
                                        item.id
                                        &&
                                        styles.selectedText
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





            <TextInput

                style={
                    styles.input
                }

                value={
                    dosis
                }

                onChangeText={
                    setDosis
                }

                placeholder="Dosis"

            />





            <TouchableOpacity

                style={
                    styles.saveButton
                }

                onPress={
                    guardar
                }

            >

                <Text
                    style={
                        styles.buttonText
                    }
                >

                    💾 Guardar diagnóstico

                </Text>


            </TouchableOpacity>







            <Text
                style={
                    styles.sectionTitle
                }
            >

                Historial sanitario

            </Text>




            {
                historial.map(
                    item => (

                        <View
                            key={
                                item.id
                            }
                            style={
                                styles.history
                            }
                        >

                            <Text
                                style={
                                    styles.historyTitle
                                }
                            >

                                🔴 {item.enfermedad}

                            </Text>


                            <Text>

                                {
                                    item.medicamento
                                    ||
                                    'Sin medicamento'
                                }

                            </Text>


                            <Text>

                                {
                                    item.dosis
                                    ||
                                    ''
                                }

                            </Text>


                        </View>

                    )
                )
            }



        </ScrollView>

    );

}




function colorEstado(
    estado
){

    if(
        estado ===
        'EN_TRATAMIENTO'
    ){

        return '#f4d35e';

    }


    if(
        estado ===
        'ENFERMA'
    ){

        return '#d9534f';

    }


    return '#52b788';

}





function textoEstado(
    estado
){

    if(
        estado ===
        'EN_TRATAMIENTO'
    ){

        return '🟡 En tratamiento';

    }


    if(
        estado ===
        'ENFERMA'
    ){

        return '🔴 Enferma';

    }


    return '🟢 Sana';

}





const styles =
StyleSheet.create({

    container:{
        flex:1,
        backgroundColor:
            COLORS.background
    },


    content:{
        padding:20
    },


    center:{
        flex:1,
        justifyContent:'center',
        alignItems:'center'
    },


    title:{
        fontSize:26,
        fontWeight:'bold',
        color:
            COLORS.primary
    },


    status:{
        padding:15,
        borderRadius:14,
        marginTop:20
    },


    statusText:{
        fontWeight:'bold'
    },


    recoveryButton:{
        backgroundColor:'#52b788',
        padding:15,
        borderRadius:14,
        marginTop:15,
        alignItems:'center'
    },


    sectionTitle:{
        fontSize:20,
        fontWeight:'bold',
        marginTop:25,
        marginBottom:10
    },


    options:{
        flexDirection:'row',
        flexWrap:'wrap'
    },


    option:{
        backgroundColor:'#e8eeee',
        padding:10,
        borderRadius:20,
        marginRight:8
    },


    selected:{
        backgroundColor:
            COLORS.primary
    },


    optionText:{
        color:
            COLORS.text
    },


    selectedText:{
        color:'#fff'
    },


    input:{
        backgroundColor:
            COLORS.card,
        borderWidth:1,
        borderColor:
            COLORS.border,
        borderRadius:12,
        padding:13,
        marginTop:10
    },


    textArea:{
        minHeight:100
    },


    saveButton:{
        backgroundColor:
            COLORS.primary,
        padding:15,
        borderRadius:14,
        marginTop:25,
        alignItems:'center'
    },


    buttonText:{
        color:'#fff',
        fontWeight:'bold'
    },


    history:{
        backgroundColor:
            COLORS.card,
        padding:15,
        borderRadius:12,
        marginBottom:10
    },


    historyTitle:{
        fontWeight:'bold',
        fontSize:16
    }


});