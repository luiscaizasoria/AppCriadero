import React, {
    useState
} from 'react';

import {
    Text,
    ScrollView,
    StyleSheet,
    Alert
} from 'react-native';


import {
    registrarSanidadJaula
} from '../repositories/SanidadJaulaRepository';


import {
    colors,
    spacing,
    typography
} from '../theme';

import FondoPantalla from '../components/FondoPantalla';
import Boton from '../components/Boton';
import CampoTexto from '../components/CampoTexto';
import JaulaBarraAccion from '../components/JaulaBarraAccion';
import JaulaOpcion from '../components/JaulaOpcion';
import JaulaAviso, {
    useAvisoExito
} from '../components/JaulaAviso';

import {
    ICONO_TIPO_SANIDAD
} from '../components/JaulaEstado';



const TIPOS = [
    'Normal',
    'Limpieza',
    'Fumigación',
    'Quemadura',
    'Cuarentena'
];



export default function SanidadJaulaScreen({
    route,
    navigation
}) {


    const {
        jaulaId
    } = route.params;



    const [
        tipo,
        setTipo
    ] = useState('Normal');



    const [
        detalle,
        setDetalle
    ] = useState('');



    const [
        guardando,
        setGuardando
    ] = useState(false);



    const {
        aviso,
        mostrar: mostrarAviso,
        cerrar: cerrarAviso,
        saliendo
    } = useAvisoExito();




    const guardar =
        async () => {


            try {

                setGuardando(true);


                await registrarSanidadJaula({

                    jaulaId,

                    fecha:
                        new Date()
                        .toISOString(),

                    tipo,

                    detalle:
                        detalle.trim()

                });


                // Antes: Alert con «Aceptar» que hacía goBack. Ahora: aviso y vuelve solo.
                mostrarAviso(

                    'Sanidad registrada',

                    `La jaula quedó en estado ${tipo}.`,

                    () =>
                        navigation.goBack()

                );


            }
            catch(error){


                console.error(
                    error
                );


                Alert.alert(

                    'Error',

                    'No fue posible guardar el registro sanitario.'

                );


            }
            finally {

                setGuardando(false);

            }


        };





    return (

        <FondoPantalla>

            <ScrollView

                contentContainerStyle={
                    styles.content
                }

                keyboardShouldPersistTaps="handled"

            >


                <Text
                    style={
                        styles.subtitle
                    }
                >
                    Seleccione el estado sanitario actual de la jaula.
                </Text>



                {
                    TIPOS.map(

                        item => (

                            <JaulaOpcion

                                key={
                                    item
                                }

                                texto={
                                    item
                                }

                                icono={
                                    ICONO_TIPO_SANIDAD[item]
                                }

                                seleccionado={
                                    tipo === item
                                }

                                onPress={() =>
                                    setTipo(item)
                                }

                                testID={`sanidad-${item}`}

                            />

                        )

                    )
                }



                <CampoTexto

                    etiqueta="Detalle"

                    style={
                        styles.detalle
                    }

                    multiline

                    value={
                        detalle
                    }

                    onChangeText={
                        setDetalle
                    }

                    placeholder="Detalle de la actividad sanitaria..."

                    testID="sanidad-detalle"

                />


            </ScrollView>



            <JaulaBarraAccion>

                <Boton

                    titulo="Guardar sanidad"

                    icono="guardar"

                    onPress={
                        guardar
                    }

                    atenuado={
                        guardando || saliendo
                    }

                    testID="guardar-sanidad"

                />

            </JaulaBarraAccion>



            <JaulaAviso
                aviso={aviso}
                onCerrar={cerrarAviso}
            />

        </FondoPantalla>

    );

}




const styles =
StyleSheet.create({

    content:{
        padding:spacing.pantalla,
        paddingBottom:spacing.xl
    },


    subtitle:{
        ...typography.cuerpo,
        color:colors.textSecondary,
        marginBottom:spacing.lg
    },


    detalle:{
        marginTop:spacing.md
    }

});
