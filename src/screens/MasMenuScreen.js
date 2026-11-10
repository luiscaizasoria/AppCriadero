import React, {
    useCallback,
    useState
} from 'react';

import {
    ScrollView,
    StyleSheet,
    Alert
} from 'react-native';

import {
    useFocusEffect
} from '@react-navigation/native';

import {
    useSafeAreaInsets
} from 'react-native-safe-area-context';


import {
    USAR_API
} from '../config/dataSource';


import {
    obtenerResumenAlertas
} from '../repositories/AlertasRepository';


import FondoPantalla from '../components/FondoPantalla';
import PantallaHeader from '../components/PantallaHeader';
import BarraEstado from '../components/BarraEstado';
import MasFila from '../components/MasFila';
import AlertBadge from '../components/AlertBadge';

import {
    colors,
    spacing
} from '../theme';



export default function MasMenuScreen({
    navigation
}) {

    const insets =
        useSafeAreaInsets();


    const [

        resumenAlertas,

        setResumenAlertas

    ] = useState({

        total:0

    });



    const [
        cerrando,
        setCerrando
    ] = useState(false);


    const cargarAlertas =
        async()=>{


            try{


                const resumen =

                    await obtenerResumenAlertas();



                setResumenAlertas(

                    resumen

                );


            }
            catch(error){


                console.error(

                    'Error cargando resumen alertas:',

                    error

                );


            }


        };



    useFocusEffect(

        useCallback(()=>{


            cargarAlertas();


        },[])

    );



    return (

        <FondoPantalla>

            <BarraEstado
                estilo="light"
                navigation={navigation}
            />

            <PantallaHeader
                titulo="Más"
                subtitulo="Administración y análisis del criadero"
                insetSuperior={insets.top}
                testID="mas-cabecera"
            />

            <ScrollView
                contentContainerStyle={
                    styles.content
                }
            >

                <MasFila
                    icono="settings-outline"
                    indice={0}
                    titulo="Configuración"
                    descripcion="Catálogos y parámetros del criadero"
                    testID="mas-configuracion"
                    onPress={() =>
                        navigation.navigate(
                            'Configuracion'
                        )
                    }
                />


                <MasFila
                    icono="egg-outline"
                    indice={1}
                    titulo="Producción de huevos"
                    descripcion="Estadísticas de postura y producción"
                    testID="mas-produccion"
                    onPress={() =>
                        navigation.navigate(
                            'ProduccionHuevos'
                        )
                    }
                />


                <MasFila
                    icono="people-outline"
                    indice={2}
                    titulo="Clientes"
                    descripcion="Compradores e historial de ventas por celular"
                    testID="mas-clientes"
                    onPress={() =>
                        navigation.navigate(
                            'Clientes'
                        )
                    }
                />


                <MasFila
                    icono="bar-chart-outline"
                    indice={4}
                    titulo="Reportes"
                    descripcion="Indicadores y estadísticas del criadero"
                    testID="mas-reportes"
                    onPress={() =>
                        navigation.navigate(
                            'Reportes'
                        )
                    }
                />


                {
                    /* Respaldo (SQLite local): solo en modo SQLite; en modo API no aplica (aprobado por el usuario). */
                    !USAR_API &&
                    <MasFila
                        icono="archive-outline"
                        indice={0}
                        titulo="Respaldo"
                        descripcion="Crear y compartir copia de seguridad"
                        testID="mas-respaldo"
                        onPress={() =>
                            navigation.navigate(
                                'Backup'
                            )
                        }
                    />
                }


                <MasFila
                    icono="notifications-outline"
                    indice={3}
                    titulo="Alertas"
                    descripcion="Estado y pendientes del criadero"
                    testID="mas-alertas"
                    onPress={() =>
                        navigation.navigate(
                            'Alertas'
                        )
                    }
                    derecha={
                        <AlertBadge
                            cantidad={
                                resumenAlertas.total
                            }
                        />
                    }
                />


                {
                    /* Solo en modo API (excepcion aprobada a la regla de no tocar V1). */
                    USAR_API &&
                    <MasFila
                        icono="log-out-outline"
                        color={colors.danger}
                        titulo={
                            cerrando
                                ? 'Cerrando...'
                                : 'Cerrar sesión'
                        }
                        descripcion="Salir de la cuenta en este teléfono"
                        testID="mas-cerrar-sesion"
                        onPress={
                            cerrando
                                ? undefined
                                : () => confirmarCerrarSesion(
                                    setCerrando
                                )
                        }
                    />
                }

            </ScrollView>

        </FondoPantalla>

    );

}



function confirmarCerrarSesion(setCerrando){

    Alert.alert(
        'Cerrar sesión',
        '¿Quieres cerrar la sesión en este teléfono?',
        [
            {
                text:'Cancelar',
                style:'cancel'
            },
            {
                text:'Cerrar sesión',
                style:'destructive',
                onPress:async()=>{

                    setCerrando(true);

                    try{

                        // require diferido: en modo SQLite el modulo de sesion no se carga.
                        await require('../api/sesion')
                            .cerrarSesion();

                    }
                    finally{

                        setCerrando(false);

                    }

                }
            }
        ]
    );

}



const styles =
StyleSheet.create({

    content:{

        padding:spacing.pantalla,

        paddingBottom:spacing.xl

    }

});
