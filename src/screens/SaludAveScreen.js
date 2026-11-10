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
    obtenerAvePorId
} from '../repositories/AveRepository';



import {
    obtenerEnfermedades,
    obtenerMedicamentos,
    registrarDiagnostico,
    obtenerHistorialSaludAve
} from '../repositories/SaludRepository';



import FondoPantalla
    from '../components/FondoPantalla';

import Tarjeta
    from '../components/Tarjeta';

import TituloSeccion
    from '../components/TituloSeccion';

import IconoCirculo
    from '../components/IconoCirculo';

import Chip
    from '../components/Chip';

import CampoTexto
    from '../components/CampoTexto';

import AveOpcion
    from '../components/AveOpcion';

import Boton
    from '../components/Boton';

import BarraAccion
    from '../components/BarraAccion';

import Aviso
    from '../components/Aviso';

import useAvisoExito
    from '../components/useAvisoExito';

import EstadoCarga
    from '../components/EstadoCarga';

import EstadoError
    from '../components/EstadoError';

import { visualSalud }
    from '../components/aveVisual';

import {
    colors,
    spacing,
    typography
} from '../theme';





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



    const {
        aviso,
        mostrar: mostrarAviso,
        cerrar: cerrarAviso
    } = useAvisoExito();





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

                Alert.alert(
                    'Error',
                    'No fue posible cargar los datos de salud.'
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



                // Antes: Alert «Registro guardado» con «Aceptar» que recargaba los datos.
                // Ahora: aviso no bloqueante (mismo título y mensaje) y recarga inmediata.
                mostrarAviso(

                    'Registro guardado',

                    'El tratamiento fue registrado correctamente.'

                );

                cargarDatos();


            }
            catch(error){


                console.error(
                    error
                );

                Alert.alert(
                    'Error',
                    'No fue posible guardar el registro.'
                );


            }
            finally{

                setGuardando(
                    false
                );

            }


        };





    const avisoExito = aviso
        ? (
            <Aviso
                flotante
                tono="exito"
                duracion={0}
                titulo={aviso.titulo}
                mensaje={aviso.mensaje}
                onCerrar={cerrarAviso}
            />
        )
        : null;



    if(loading){


        return (

            <FondoPantalla>

                <View
                    style={
                        styles.center
                    }
                >

                    <EstadoCarga
                        mensaje="Cargando datos de salud..."
                    />

                </View>

                {avisoExito}

            </FondoPantalla>

        );

    }

    if(!ave){

        // Antes: `return null`. Ahora un estado de error con «Reintentar» (el Alert del catch se mantiene).
        return (

            <FondoPantalla>

                <View
                    style={
                        styles.center
                    }
                >

                    <EstadoError
                        titulo="No fue posible cargar los datos de salud."
                        onReintentar={
                            cargarDatos
                        }
                    />

                </View>

                {avisoExito}

            </FondoPantalla>

        );

    }



    const estadoSalud =
        visualSalud(
            ave.estado_salud
        );



    return (

        <FondoPantalla>

            <ScrollView

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
                            icono="salud"
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

                                Salud

                            </Text>

                            <Chip
                                texto={estadoSalud.texto}
                                tono={estadoSalud.tono}
                                icono={estadoSalud.icono}
                                testID="salud-estado"
                            />

                        </View>

                    </View>


                    {
                        ave.estado_salud ===
                        'EN_TRATAMIENTO'
                        &&

                        (

                            <Boton
                                titulo="Finalizar tratamiento"
                                icono="checkmark-circle-outline"
                                variante="secundario"
                                testID="finalizar-tratamiento"
                                style={
                                    styles.botonFinalizar
                                }
                                onPress={() =>
                                    navigation.navigate(
                                        'FinalizarTratamiento',
                                        {
                                            aveId
                                        }
                                    )
                                }
                            />

                        )

                    }

                </Tarjeta>



                <Tarjeta>

                    <TituloSeccion
                        icono="alert-circle-outline"
                        indice={3}
                    >
                        Enfermedad
                    </TituloSeccion>


                    <View
                        style={
                            styles.options
                        }
                    >

                        {
                            enfermedades.map(
                                item => (

                                    <AveOpcion
                                        key={
                                            item.id
                                        }
                                        texto={
                                            item.nombre
                                        }
                                        seleccionado={
                                            enfermedadSeleccionada?.id
                                            ===
                                            item.id
                                        }
                                        onPress={() =>
                                            setEnfermedadSeleccionada(
                                                item
                                            )
                                        }
                                    />

                                )
                            )
                        }

                    </View>


                    <CampoTexto
                        multiline
                        value={
                            sintomas
                        }
                        onChangeText={
                            setSintomas
                        }
                        placeholder="Síntomas"
                        accessibilityLabel="Síntomas"
                        icono="create-outline"
                        style={
                            styles.campo
                        }
                    />

                </Tarjeta>



                <Tarjeta>

                    <TituloSeccion
                        icono="medical-outline"
                        indice={2}
                    >
                        Medicamento
                    </TituloSeccion>


                    <View
                        style={
                            styles.options
                        }
                    >

                        {
                            medicamentos.map(
                                item => (

                                    <AveOpcion
                                        key={
                                            item.id
                                        }
                                        texto={
                                            item.nombre
                                        }
                                        seleccionado={
                                            medicamentoSeleccionado?.id
                                            ===
                                            item.id
                                        }
                                        onPress={() =>
                                            setMedicamentoSeleccionado(
                                                item
                                            )
                                        }
                                    />

                                )
                            )
                        }

                    </View>


                    <CampoTexto
                        value={
                            dosis
                        }
                        onChangeText={
                            setDosis
                        }
                        placeholder="Dosis"
                        accessibilityLabel="Dosis"
                        icono="medical-outline"
                        style={
                            styles.campo
                        }
                    />

                </Tarjeta>



                <TituloSeccion
                    icono="historial"
                    indice={1}
                >
                    Historial sanitario
                </TituloSeccion>


                {
                    historial.length === 0
                    &&
                    (
                        <Text
                            style={
                                styles.vacio
                            }
                        >
                            Aún no hay registros sanitarios de esta ave.
                        </Text>
                    )
                }


                {
                    historial.map(
                        item => (

                            <Tarjeta
                                key={
                                    item.id
                                }
                                franja={colors.danger}
                            >

                                <Text
                                    style={
                                        styles.historyTitle
                                    }
                                >

                                    {item.enfermedad}

                                </Text>


                                <Text
                                    style={
                                        styles.historyText
                                    }
                                >

                                    {
                                        item.medicamento
                                        ||
                                        'Sin medicamento'
                                    }

                                </Text>


                                <Text
                                    style={
                                        styles.historyText
                                    }
                                >

                                    {
                                        item.dosis
                                        ||
                                        ''
                                    }

                                </Text>


                            </Tarjeta>

                        )
                    )
                }



            </ScrollView>



            <BarraAccion>

                <Boton
                    titulo="Guardar diagnóstico"
                    icono="guardar"
                    onPress={
                        guardar
                    }
                    atenuado={
                        guardando
                    }
                    testID="guardar-diagnostico"
                />

            </BarraAccion>


            {avisoExito}

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
        paddingBottom:spacing.xl
    },


    center:{
        flex:1,
        justifyContent:'center',
        alignItems:'center'
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
            colors.primaryDark,
        marginBottom:spacing.xs
    },


    botonFinalizar:{
        marginTop:spacing.md
    },


    options:{
        flexDirection:'row',
        flexWrap:'wrap'
    },


    campo:{
        marginTop:spacing.sm,
        marginBottom:0
    },


    vacio:{
        ...typography.cuerpo,
        color:
            colors.textSecondary,
        marginBottom:spacing.md
    },


    historyTitle:{
        ...typography.subtitulo,
        color:
            colors.text
    },


    historyText:{
        ...typography.cuerpo,
        color:
            colors.textSecondary
    }

});
