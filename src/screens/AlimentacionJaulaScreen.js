import React, {
    useEffect,
    useState
} from 'react';

import {
    Text,
    ScrollView,
    StyleSheet,
    Alert
} from 'react-native';

import {
    obtenerTiposAlimentos,
    registrarAlimentacion
} from '../repositories/AlimentacionRepository';

import {
    colors,
    spacing,
    typography
} from '../theme';

import FondoPantalla from '../components/FondoPantalla';
import Boton from '../components/Boton';
import EstadoCarga from '../components/EstadoCarga';
import EstadoError from '../components/EstadoError';
import EstadoVacio from '../components/EstadoVacio';
import BarraAccion from '../components/BarraAccion';
import JaulaOpcion from '../components/JaulaOpcion';
import Aviso from '../components/Aviso';
import useAvisoExito from '../components/useAvisoExito';


export default function AlimentacionJaulaScreen({
    route,
    navigation
}) {

    const {
        jaulaId
    } = route.params;


    const [
        tipos,
        setTipos
    ] = useState([]);


    const [
        tipo,
        setTipo
    ] = useState(null);


    const [
        cargando,
        setCargando
    ] = useState(true);


    const [
        errorCarga,
        setErrorCarga
    ] = useState(false);


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


    useEffect(() => {

        cargar();

    }, []);



    const cargar = async () => {

        try {

            setCargando(true);
            setErrorCarga(false);

            const data =
                await obtenerTiposAlimentos();

            setTipos(data);

        }
        catch (error) {

            console.error(
                error
            );

            setErrorCarga(true);

        }
        finally {

            setCargando(false);

        }

    };



    const guardar = async () => {


        if(!tipo){

            Alert.alert(
                'Seleccione alimento',
                'Debe seleccionar un tipo de alimento.'
            );

            return;

        }



        try {

            setGuardando(true);

            await registrarAlimentacion({

                jaulaId,

                fecha:
                    new Date()
                    .toISOString(),

                tipo:
                    tipo.nombre

            });

        }
        catch (error) {

            console.error(
                error
            );

            setGuardando(false);

            Alert.alert(
                'Error',
                'No fue posible guardar el registro.'
            );

            return;

        }


        setGuardando(false);


        // Antes: Alert con «Aceptar» que hacía goBack. Ahora: aviso y vuelve solo.
        mostrarAviso(
            'Alimentación registrada',
            'El registro fue guardado correctamente.',
            () => navigation.goBack()
        );

    };



    return (

        <FondoPantalla>

            <ScrollView
                contentContainerStyle={styles.content}
                keyboardShouldPersistTaps="handled"
            >

                <Text style={styles.intro}>
                    Selecciona el tipo de alimento que recibió la jaula.
                </Text>


                {
                    cargando
                        ? (
                            <EstadoCarga
                                mensaje="Cargando tipos de alimento..."
                            />
                        )
                        : null
                }


                {
                    !cargando && errorCarga
                        ? (
                            <EstadoError
                                mensaje="No se pudieron cargar los tipos de alimento."
                                onReintentar={cargar}
                            />
                        )
                        : null
                }


                {
                    !cargando &&
                    !errorCarga &&
                    tipos.length === 0
                        ? (
                            <EstadoVacio
                                icono="alimentacion"
                                titulo="No hay tipos de alimento"
                                mensaje="Aún no hay tipos de alimento disponibles para registrar."
                                testID="alimentacion-vacio"
                            />
                        )
                        : null
                }


                {
                    !cargando &&
                    !errorCarga &&
                    tipos.map(item => (

                        <JaulaOpcion
                            key={item.id}
                            texto={item.nombre}
                            icono="alimentacion"
                            seleccionado={tipo?.id === item.id}
                            onPress={() =>
                                setTipo(item)
                            }
                            testID={`alimento-${item.id}`}
                        />

                    ))
                }

            </ScrollView>


            <BarraAccion>

                <Boton
                    titulo="Guardar"
                    icono="guardar"
                    onPress={guardar}
                    atenuado={
                        guardando || saliendo
                    }
                    testID="guardar-alimentacion"
                />

            </BarraAccion>


            {aviso ? (
                <Aviso
                    flotante
                    tono="exito"
                    duracion={0}
                    titulo={aviso.titulo}
                    mensaje={aviso.mensaje}
                    onCerrar={cerrarAviso}
                />
            ) : null}

        </FondoPantalla>

    );

}


const styles = StyleSheet.create({

    content: {
        padding: spacing.pantalla,
        paddingBottom: spacing.xl
    },

    intro: {
        ...typography.cuerpo,
        color: colors.textSecondary,
        marginBottom: spacing.lg
    }

});
