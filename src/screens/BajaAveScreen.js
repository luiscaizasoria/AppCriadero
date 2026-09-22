import React, {
    useState
} from 'react';


import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    StyleSheet,
    Alert,
    ScrollView
} from 'react-native';


import {
    registrarMuerteAve,
    registrarVentaAve
} from '../repositories/BajaAveRepository';


import {
    COLORS
} from '../config/constants';



export default function BajaAveScreen({
    route,
    navigation
}) {


    const {
        aveId
    } = route.params;



    const [
        tipo,
        setTipo
    ] = useState(null);



    const [
        causa,
        setCausa
    ] = useState('');



    const [
        ciudadDestino,
        setCiudadDestino
    ] = useState('');



    const [
        cooperativaEnvio,
        setCooperativaEnvio
    ] = useState('');



    const [
        comprador,
        setComprador
    ] = useState('');



    const [
        celular,
        setCelular
    ] = useState('');



    const [
        valorVenta,
        setValorVenta
    ] = useState('');



    const [
        valorEnvio,
        setValorEnvio
    ] = useState('');



    const [
        detalle,
        setDetalle
    ] = useState('');



    const [
        guardando,
        setGuardando
    ] = useState(false);





    const guardar =
        async () => {


            if(
                !tipo
            ){

                Alert.alert(
                    'Seleccione una opción',
                    'Debe seleccionar si es venta o fallecimiento.'
                );

                return;

            }



            try {


                setGuardando(
                    true
                );



                if(
                    tipo === 'MUERTE'
                ){

                    await registrarMuerteAve({

                        aveId,

                        causa:
                            causa.trim(),

                        detalle:
                            detalle.trim()

                    });


                }
                else {


                    if(
                        !celular.trim()
                    ){

                        Alert.alert(
                            'Celular requerido',
                            'Ingrese el número celular del comprador.'
                        );

                        return;

                    }


                    const valorVentaResultado =
                        convertirValorOpcional(
                            valorVenta
                        );


                    const valorEnvioResultado =
                        convertirValorOpcional(
                            valorEnvio
                        );


                    if(
                        !valorVentaResultado.valido
                        ||
                        !valorEnvioResultado.valido
                    ){

                        Alert.alert(
                            'Valor inválido',
                            'El valor de venta y el valor de envío son opcionales, pero si se ingresan deben ser números mayores o iguales a cero.'
                        );

                        return;

                    }



                    await registrarVentaAve({

                        aveId,

                        fechaVenta:
                            new Date()
                            .toISOString(),


                        celular:
                            celular.trim(),


                        ciudadDestino:
                            ciudadDestino.trim(),


                        cooperativaEnvio:
                            cooperativaEnvio.trim(),


                        comprador:
                            comprador.trim(),


                        valorVenta:
                            valorVentaResultado.valor,


                        valorEnvio:
                            valorEnvioResultado.valor,


                        detalle:
                            detalle.trim()

                    });


                }




                Alert.alert(

                    'Proceso completado',

                    tipo === 'VENTA'
                    ?
                    'El ave fue registrada como vendida.'
                    :
                    'El ave fue registrada como fallecida.',

                    [
                        {
                            text:
                                'Aceptar',

                            onPress:
                                () =>
                                navigation.popToTop()
                        }
                    ]

                );


            }
            catch(error){


                console.error(
                    'Error dando de baja ave:',
                    error
                );


                Alert.alert(
                    'Error',
                    'No fue posible completar la baja del ave.'
                );


            }
            finally{

                setGuardando(
                    false
                );

            }


        };





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
                ⚫ Baja del ave
            </Text>



            <Text
                style={
                    styles.subtitle
                }
            >
                Selecciona el motivo de salida del ave.
            </Text>




            <View
                style={
                    styles.options
                }
            >


                <TouchableOpacity

                    style={[
                        styles.option,

                        tipo === 'MUERTE'
                        &&
                        styles.selected

                    ]}

                    onPress={() =>
                        setTipo(
                            'MUERTE'
                        )
                    }

                >

                    <Text
                        style={[
                            styles.optionText,

                            tipo === 'MUERTE'
                            &&
                            styles.selectedText

                        ]}
                    >
                        ⚰ Fallecimiento
                    </Text>


                </TouchableOpacity>





                <TouchableOpacity

                    style={[
                        styles.option,

                        tipo === 'VENTA'
                        &&
                        styles.selected

                    ]}

                    onPress={() =>
                        setTipo(
                            'VENTA'
                        )
                    }

                >

                    <Text
                        style={[
                            styles.optionText,

                            tipo === 'VENTA'
                            &&
                            styles.selectedText

                        ]}
                    >
                        💰 Venta
                    </Text>


                </TouchableOpacity>


            </View>





            {
                tipo === 'MUERTE'

                ?

                (

                    <>

                        <Text
                            style={
                                styles.label
                            }
                        >
                            Causa
                        </Text>


                        <TextInput

                            style={
                                styles.input
                            }

                            value={
                                causa
                            }

                            onChangeText={
                                setCausa
                            }

                            placeholder="Ej. Enfermedad"

                        />


                    </>

                )

                :

                null

            }






            {
                tipo === 'VENTA'

                ?

                (

                    <>

                        <Text
                            style={
                                styles.label
                            }
                        >
                            Celular *
                        </Text>


                        <TextInput

                            style={
                                styles.input
                            }

                            keyboardType="phone-pad"

                            value={
                                celular
                            }

                            onChangeText={
                                setCelular
                            }

                            placeholder="Ej. 0991234567"

                        />



                        <Text
                            style={
                                styles.label
                            }
                        >
                            Nombre
                        </Text>


                        <TextInput

                            style={
                                styles.input
                            }

                            value={
                                comprador
                            }

                            onChangeText={
                                setComprador
                            }

                            placeholder="Nombre del comprador"

                        />



                        <Text
                            style={
                                styles.label
                            }
                        >
                            Ciudad destino
                        </Text>


                        <TextInput

                            style={
                                styles.input
                            }

                            value={
                                ciudadDestino
                            }

                            onChangeText={
                                setCiudadDestino
                            }

                        />



                        <Text
                            style={
                                styles.label
                            }
                        >
                            Cooperativa de envío
                        </Text>


                        <TextInput

                            style={
                                styles.input
                            }

                            value={
                                cooperativaEnvio
                            }

                            onChangeText={
                                setCooperativaEnvio
                            }

                        />



                        <Text
                            style={
                                styles.label
                            }
                        >
                            Valor venta
                        </Text>


                        <TextInput

                            style={
                                styles.input
                            }

                            keyboardType="decimal-pad"

                            value={
                                valorVenta
                            }

                            onChangeText={
                                setValorVenta
                            }

                            placeholder="Opcional"

                        />



                        <Text
                            style={
                                styles.label
                            }
                        >
                            Valor de envío
                        </Text>


                        <TextInput

                            style={
                                styles.input
                            }

                            keyboardType="decimal-pad"

                            value={
                                valorEnvio
                            }

                            onChangeText={
                                setValorEnvio
                            }

                            placeholder="Opcional"

                        />


                    </>

                )

                :

                null

            }






            <Text
                style={
                    styles.label
                }
            >
                Detalle
            </Text>


            <TextInput

                style={[
                    styles.input,

                    styles.textArea

                ]}

                multiline

                value={
                    detalle
                }

                onChangeText={
                    setDetalle
                }

                placeholder="Información adicional..."

            />






            <TouchableOpacity

                style={
                    styles.button
                }

                onPress={
                    guardar
                }

                disabled={
                    guardando
                }

            >

                <Text
                    style={
                        styles.buttonText
                    }
                >
                    {
                        guardando
                        ?
                        'Guardando...'
                        :
                        '💾 Confirmar baja'
                    }
                </Text>


            </TouchableOpacity>



        </ScrollView>

    );

}



function convertirValorOpcional(
    texto
) {

    const valorTexto =
        String(
            texto || ''
        )
            .trim();


    if (!valorTexto) {

        return {
            valido: true,
            valor: null
        };

    }


    const numero =
        Number(
            valorTexto
                .replace(',', '.')
        );


    if (
        !Number.isFinite(
            numero
        )
        ||
        numero < 0
    ) {

        return {
            valido: false,
            valor: 0
        };

    }


    return {
        valido: true,
        valor: numero
    };

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


    title:{
        fontSize:26,
        fontWeight:'bold',
        color:
            COLORS.primary
    },


    subtitle:{
        marginTop:8,
        color:
            COLORS.textSecondary
    },


    options:{
        flexDirection:'row',
        marginTop:25
    },


    option:{
        backgroundColor:'#e8eeee',
        padding:14,
        borderRadius:20,
        marginRight:10
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
        color:'#fff',
        fontWeight:'bold'
    },


    label:{
        marginTop:20,
        marginBottom:6,
        fontWeight:'600'
    },


    input:{
        backgroundColor:
            COLORS.card,
        borderWidth:1,
        borderColor:
            COLORS.border,
        borderRadius:12,
        padding:13
    },


    textArea:{
        minHeight:100,
        textAlignVertical:'top'
    },


    button:{
        marginTop:30,
        backgroundColor:
            COLORS.primary,
        padding:16,
        borderRadius:14,
        alignItems:'center'
    },


    buttonText:{
        color:'#fff',
        fontWeight:'bold'
    }

});