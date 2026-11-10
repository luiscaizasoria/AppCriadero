import React, {
    useRef,
    useState
} from 'react';


import {
    View,
    Text,
    StyleSheet,
    Alert,
    ScrollView,
    KeyboardAvoidingView,
    Platform
} from 'react-native';


import {
    registrarMuerteAve,
    registrarVentaAve
} from '../repositories/BajaAveRepository';


import FondoPantalla
    from '../components/FondoPantalla';

import Tarjeta
    from '../components/Tarjeta';

import TituloSeccion
    from '../components/TituloSeccion';

import IconoCirculo
    from '../components/IconoCirculo';

import AveOpcion
    from '../components/AveOpcion';

import CampoTexto
    from '../components/CampoTexto';

import Boton
    from '../components/Boton';

import BarraAccion
    from '../components/BarraAccion';

import useGuardaEnvio
    from '../components/useGuardaEnvio';

import useValidacion
    from '../components/useValidacion';

import CampoGrupo
    from '../components/CampoGrupo';

import {
    colors,
    spacing,
    typography
} from '../theme';



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



    const guardia = useGuardaEnvio();
    const scrollRef = useRef(null);
    const v = useValidacion(scrollRef);


    const guardar =
        async () => {


            if(
                !tipo
            ){

                v.fallar(
                    'tipo',
                    'Debe seleccionar si es venta o fallecimiento.'
                );

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

                        v.fallar(
                            'celular',
                            'Ingrese el número celular del comprador.'
                        );

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

                        v.fallar(
                            valorVentaResultado.valido
                                ? 'valorEnvio'
                                : 'valorVenta',
                            'El valor de venta y el valor de envío son opcionales, pero si se ingresan deben ser números mayores o iguales a cero.'
                        );

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




                // Acción irreversible: diálogo con «Aceptar» (como en V1).
                Alert.alert(

                    'Proceso completado',

                    tipo === 'VENTA'
                    ?
                    'El ave fue registrada como vendida.'
                    :
                    'El ave fue registrada como fallecida.',

                    [
                        {
                            text: 'Aceptar',
                            onPress: () =>
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

        <FondoPantalla>

        <KeyboardAvoidingView

            style={
                styles.container
            }

            behavior={
                Platform.OS === 'ios'
                    ? 'padding'
                    : undefined
            }

        >

        <ScrollView

            ref={scrollRef}

            style={
                styles.container
            }

            contentContainerStyle={
                styles.content
            }

            keyboardShouldPersistTaps="handled"

        >


            <Tarjeta>

                <View
                    style={
                        styles.cabecera
                    }
                >

                    <IconoCirculo
                        icono="baja"
                        indice={3}
                        tamano={52}
                    />

                    <View
                        style={
                            styles.cabeceraTextos
                        }
                    >

                        <Text
                            style={
                                styles.title
                            }
                            accessibilityRole="header"
                        >
                            Baja del ave
                        </Text>

                        <Text
                            style={
                                styles.subtitle
                            }
                        >
                            Selecciona el motivo de salida del ave.
                        </Text>

                    </View>

                </View>


                <CampoGrupo {...v.grupo('tipo')}>
                <View
                    style={
                        styles.options
                    }
                >

                    <AveOpcion
                        texto="Fallecimiento"
                        icono="skull-outline"
                        seleccionado={
                            tipo === 'MUERTE'
                        }
                        onPress={() => {
                            v.limpiar('tipo');
                            setTipo(
                                'MUERTE'
                            );
                        }}
                        testID="baja-fallecimiento"
                    />


                    <AveOpcion
                        texto="Venta"
                        icono="cart-outline"
                        seleccionado={
                            tipo === 'VENTA'
                        }
                        onPress={() => {
                            v.limpiar('tipo');
                            setTipo(
                                'VENTA'
                            );
                        }}
                        testID="baja-venta"
                    />

                </View>
                </CampoGrupo>

            </Tarjeta>





            {
                tipo === 'MUERTE'

                ?

                (

                    <Tarjeta>

                        <CampoTexto
                            etiqueta="Causa"
                            icono="skull-outline"
                            value={
                                causa
                            }
                            onChangeText={
                                setCausa
                            }
                            placeholder="Ej. Enfermedad"
                            style={
                                styles.campo
                            }
                        />

                    </Tarjeta>

                )

                :

                null

            }






            {
                tipo === 'VENTA'

                ?

                (

                    <Tarjeta>

                        <TituloSeccion
                            icono="cart-outline"
                            indice={2}
                        >
                            Datos del comprador
                        </TituloSeccion>


                        <CampoTexto
                            etiqueta="Celular *"
                            icono="call-outline"
                            keyboardType="phone-pad"
                            value={
                                celular
                            }
                            onChangeText={
                                setCelular
                            }
                            placeholder="Ej. 0991234567"
                            {...v.props('celular')}
                        />


                        <CampoTexto
                            etiqueta="Nombre"
                            icono="person-circle-outline"
                            value={
                                comprador
                            }
                            onChangeText={
                                setComprador
                            }
                            placeholder="Nombre del comprador"
                        />


                        <CampoTexto
                            etiqueta="Ciudad destino"
                            icono="location-outline"
                            value={
                                ciudadDestino
                            }
                            onChangeText={
                                setCiudadDestino
                            }
                        />


                        <CampoTexto
                            etiqueta="Cooperativa de envío"
                            icono="exit-outline"
                            value={
                                cooperativaEnvio
                            }
                            onChangeText={
                                setCooperativaEnvio
                            }
                        />


                        <CampoTexto
                            etiqueta="Valor venta"
                            icono="cash-outline"
                            keyboardType="decimal-pad"
                            value={
                                valorVenta
                            }
                            onChangeText={
                                setValorVenta
                            }
                            placeholder="Opcional"
                            {...v.props('valorVenta')}
                        />


                        <CampoTexto
                            etiqueta="Valor de envío"
                            icono="cash-outline"
                            keyboardType="decimal-pad"
                            value={
                                valorEnvio
                            }
                            onChangeText={
                                setValorEnvio
                            }
                            placeholder="Opcional"
                            {...v.props('valorEnvio')}
                            style={
                                styles.campo
                            }
                        />

                    </Tarjeta>

                )

                :

                null

            }






            <Tarjeta>

                <CampoTexto
                    etiqueta="Detalle"
                    icono="create-outline"
                    multiline
                    value={
                        detalle
                    }
                    onChangeText={
                        setDetalle
                    }
                    placeholder="Información adicional..."
                    style={
                        styles.campo
                    }
                />

            </Tarjeta>


        </ScrollView>



        <BarraAccion>

            <Boton
                titulo="Confirmar baja"
                icono="baja"
                variante="peligro"
                onPress={
                    guardia(guardar)
                }
                guardando={
                    guardando
                }
                testID="confirmar-baja"
            />

        </BarraAccion>

        </KeyboardAvoidingView>


        </FondoPantalla>

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
        flex:1
    },


    content:{
        padding:spacing.pantalla,
        paddingBottom:spacing.xl
    },


    cabecera:{
        flexDirection:'row',
        alignItems:'center'
    },


    cabeceraTextos:{
        flex:1,
        marginLeft:spacing.md
    },


    title:{
        ...typography.titulo,
        color:
            colors.primaryDark
    },


    subtitle:{
        ...typography.secundario,
        color:
            colors.textSecondary
    },


    options:{
        flexDirection:'row',
        flexWrap:'wrap',
        marginTop:spacing.lg
    },


    campo:{
        marginBottom:0
    }

});
