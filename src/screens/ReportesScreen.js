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
    obtenerReporteAves,
    obtenerReporteSalud,
    obtenerReporteProduccion,
    obtenerReporteFinanzas,
    obtenerExportacionAves,
    obtenerExportacionVentas,
    obtenerExportacionClientes,
    obtenerExportacionFinanzas,
    obtenerExportacionHuevos,
    obtenerExportacionJaulas
} from '../repositories/ReportesRepository';

import {
    exportarCsv
} from '../services/ExportService';

import FondoPantalla from '../components/FondoPantalla';
import Tarjeta from '../components/Tarjeta';
import TituloSeccion from '../components/TituloSeccion';
import IconoCirculo from '../components/IconoCirculo';
import Icono from '../components/Icono';
import EstadoCarga from '../components/EstadoCarga';
import EstadoError from '../components/EstadoError';

import {
    colors,
    spacing,
    typography
} from '../theme';


export default function ReportesScreen(){

    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [errorCarga, setErrorCarga] = useState(false);
    const [exportando, setExportando] = useState(null);


    const cargar = async () => {

        try {
            setLoading(true);
            setErrorCarga(false);

            const [
                aves,
                salud,
                produccion,
                finanzas
            ] = await Promise.all([
                obtenerReporteAves(),
                obtenerReporteSalud(),
                obtenerReporteProduccion(),
                obtenerReporteFinanzas()
            ]);

            setData({
                aves,
                salud,
                produccion,
                finanzas
            });
        }
        catch(error){
            console.error(
                'Error cargando reportes:',
                error
            );
            setErrorCarga(true);
        }
        finally{
            setLoading(false);
        }

    };


    useFocusEffect(
        useCallback(
            () => {
                cargar();
            },
            []
        )
    );


    const ejecutarExportacion = async ({
        id,
        nombre,
        obtener
    }) => {

        try{
            setExportando(id);

            const filas =
                await obtener();

            if(
                !filas
                ||
                filas.length === 0
            ){
                Alert.alert(
                    'Sin datos',
                    'No hay información para exportar.'
                );
                return;
            }

            await exportarCsv({
                nombre,
                filas
            });
        }
        catch(error){
            console.error(
                'Error exportando:',
                error
            );
            Alert.alert(
                'Error',
                'No fue posible generar la exportación.'
            );
        }
        finally{
            setExportando(null);
        }

    };


    if(loading){
        return (
            <FondoPantalla>
                <EstadoCarga
                    mensaje="Cargando reportes..."
                />
            </FondoPantalla>
        );
    }


    const exportaciones = [
        {id:'AVES', icono:'paw-outline', label:'Aves', nombre:'Aves', obtener:obtenerExportacionAves},
        {id:'VENTAS', icono:'cart-outline', label:'Ventas', nombre:'Ventas', obtener:obtenerExportacionVentas},
        {id:'CLIENTES', icono:'people-outline', label:'Clientes', nombre:'Clientes', obtener:obtenerExportacionClientes},
        {id:'FINANZAS', icono:'bar-chart-outline', label:'Finanzas', nombre:'Finanzas', obtener:obtenerExportacionFinanzas},
        {id:'HUEVOS', icono:'egg-outline', label:'Huevos', nombre:'Huevos', obtener:obtenerExportacionHuevos},
        {id:'JAULAS', icono:'grid-outline', label:'Jaulas', nombre:'Jaulas', obtener:obtenerExportacionJaulas}
    ];


    return (
        <FondoPantalla>

            <ScrollView
                contentContainerStyle={styles.content}
            >

                <Text style={styles.subtitle}>
                    {'Resumen y exportación del criadero'}
                </Text>

                {
                    errorCarga
                        ? (
                            <EstadoError
                                titulo="No fue posible cargar los reportes."
                                mensaje="Revisa tu conexión e inténtalo de nuevo."
                                onReintentar={cargar}
                            />
                        )
                        : (
                            <>

                                <TituloSeccion
                                    icono="paw-outline"
                                    indice={0}
                                >
                                    Aves
                                </TituloSeccion>

                                <Tarjeta>
                                    <Dato icono="checkmark-circle-outline">
                                        {`Activas: ${data?.aves?.activas || 0}`}
                                    </Dato>
                                    <Dato icono="cart-outline">
                                        {`Vendidas: ${data?.aves?.vendidas || 0}`}
                                    </Dato>
                                    <Dato icono="skull-outline">
                                        {`Fallecidas: ${data?.aves?.fallecidas || 0}`}
                                    </Dato>
                                </Tarjeta>

                                <TituloSeccion
                                    icono="medkit-outline"
                                    indice={2}
                                >
                                    Salud
                                </TituloSeccion>

                                <Tarjeta>
                                    <Dato icono="medkit-outline">
                                        {`En tratamiento: ${data?.salud?.estado?.tratamiento || 0}`}
                                    </Dato>
                                    <Dato icono="alert-circle-outline">
                                        {`Enfermas: ${data?.salud?.estado?.enfermas || 0}`}
                                    </Dato>
                                    {
                                        data?.salud?.enfermedades?.map(item => (
                                            <Dato
                                                key={item.enfermedad}
                                                icono="alert-circle"
                                                colorIcono={colors.danger}
                                            >
                                                {`${item.enfermedad} (${item.cantidad})`}
                                            </Dato>
                                        ))
                                    }
                                </Tarjeta>

                                <TituloSeccion
                                    icono="egg-outline"
                                    indice={1}
                                >
                                    Producción
                                </TituloSeccion>

                                <Tarjeta>
                                    <Dato icono="egg-outline">
                                        {`Hoy: ${data?.produccion?.huevos?.hoy || 0} huevos`}
                                    </Dato>
                                    <Dato icono="calendar-outline">
                                        {`Mes: ${data?.produccion?.huevos?.mes || 0} huevos`}
                                    </Dato>
                                    <Dato icono="trophy-outline">
                                        {`Mejor ponedora: ${data?.produccion?.mejor?.codigo || 'Sin datos'}`}
                                    </Dato>
                                </Tarjeta>

                                <TituloSeccion
                                    icono="cash-outline"
                                    indice={4}
                                >
                                    Finanzas
                                </TituloSeccion>

                                <Tarjeta>
                                    <Dato icono="trending-up-outline">
                                        {`Ingresos: $${Number(data?.finanzas?.ingresos || 0).toFixed(2)}`}
                                    </Dato>
                                    <Dato icono="trending-down-outline">
                                        {`Egresos: $${Number(data?.finanzas?.egresos || 0).toFixed(2)}`}
                                    </Dato>
                                    <Dato icono="wallet-outline">
                                        {`Utilidad: $${Number(data?.finanzas?.utilidad || 0).toFixed(2)}`}
                                    </Dato>
                                </Tarjeta>

                            </>
                        )
                }


                <TituloSeccion
                    icono="share-outline"
                    indice={3}
                >
                    Exportaciones CSV
                </TituloSeccion>

                <Text style={styles.exportHelp}>
                    {'Los archivos CSV se generan con codificación UTF-8 y se pueden abrir directamente en Excel o compartir desde el teléfono.'}
                </Text>

                <View style={styles.exportGrid}>
                    {
                        exportaciones.map((item, indice) => (
                            <Tarjeta
                                key={item.id}
                                testID={`exportar-${item.id.toLowerCase()}`}
                                style={styles.exportButton}
                                onPress={() => {
                                    if(!exportando){
                                        ejecutarExportacion(item);
                                    }
                                }}
                            >
                                <IconoCirculo
                                    icono={item.icono}
                                    indice={indice}
                                    tamano={48}
                                />
                                <Text style={styles.exportText}>
                                    {
                                        exportando === item.id
                                            ? 'Generando...'
                                            : `Exportar ${item.label}`
                                    }
                                </Text>
                            </Tarjeta>
                        ))
                    }
                </View>

            </ScrollView>

        </FondoPantalla>
    );

}


// Fila de dato: icono + un solo Text (los flujos buscan «Activas: 2», «Ingresos: $0.00»...).
function Dato({
    icono,
    colorIcono = colors.primary,
    children
}){
    return (
        <View style={styles.dato}>
            <Icono
                nombre={icono}
                tamano={20}
                color={colorIcono}
                style={styles.datoIcono}
            />
            <Text style={styles.datoTexto}>
                {children}
            </Text>
        </View>
    );
}


const styles = StyleSheet.create({
    content:{
        padding:spacing.pantalla,
        paddingBottom:spacing.xl
    },
    subtitle:{
        ...typography.cuerpo,
        color:colors.textSecondary,
        marginBottom:spacing.sm
    },
    dato:{
        flexDirection:'row',
        alignItems:'center',
        minHeight:32
    },
    datoIcono:{
        marginRight:spacing.sm
    },
    datoTexto:{
        ...typography.cuerpo,
        color:colors.text,
        flex:1
    },
    exportHelp:{
        ...typography.cuerpo,
        color:colors.textSecondary,
        marginBottom:spacing.md
    },
    exportGrid:{
        flexDirection:'row',
        flexWrap:'wrap',
        justifyContent:'space-between'
    },
    exportButton:{
        width:'48.5%',
        minHeight:112,
        alignItems:'center',
        justifyContent:'center',
        paddingHorizontal:spacing.sm
    },
    exportText:{
        ...typography.etiqueta,
        marginTop:spacing.sm,
        color:colors.primaryDark,
        textAlign:'center'
    }
});
