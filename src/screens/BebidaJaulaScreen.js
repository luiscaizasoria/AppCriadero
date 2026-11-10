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
    obtenerTiposBebidas,
    registrarBebida
} from '../repositories/BebidaRepository';

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
import JaulaBarraAccion from '../components/JaulaBarraAccion';
import JaulaOpcion from '../components/JaulaOpcion';
import JaulaAviso, {
    useAvisoExito
} from '../components/JaulaAviso';


export default function BebidaJaulaScreen({
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
                await obtenerTiposBebidas();

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
                'Seleccione bebida',
                'Debe seleccionar un tipo de bebida.'
            );

            return;

        }



        try {

            setGuardando(true);

            await registrarBebida({

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
            'Bebida registrada',
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
                    Selecciona el tipo de bebida que recibió la jaula.
                </Text>


                {
                    cargando
                        ? (
                            <EstadoCarga
                                mensaje="Cargando tipos de bebida..."
                            />
                        )
                        : null
                }


                {
                    !cargando && errorCarga
                        ? (
                            <EstadoError
                                mensaje="No se pudieron cargar los tipos de bebida."
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
                                icono="bebida"
                                titulo="No hay tipos de bebida"
                                mensaje="Aún no hay tipos de bebida disponibles para registrar."
                                testID="bebida-vacio"
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
                            icono="bebida"
                            seleccionado={tipo?.id === item.id}
                            onPress={() =>
                                setTipo(item)
                            }
                            testID={`bebida-${item.id}`}
                        />

                    ))
                }

            </ScrollView>


            <JaulaBarraAccion>

                <Boton
                    titulo="Guardar"
                    icono="guardar"
                    onPress={guardar}
                    atenuado={
                        guardando || saliendo
                    }
                    testID="guardar-bebida"
                />

            </JaulaBarraAccion>


            <JaulaAviso
                aviso={aviso}
                onCerrar={cerrarAviso}
            />

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
