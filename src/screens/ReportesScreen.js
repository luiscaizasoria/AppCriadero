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
    TouchableOpacity,
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

import Card
    from '../components/Card';

import SectionTitle
    from '../components/SectionTitle';

import Header
    from '../components/Header';

import {
    COLORS
} from '../config/constants';


export default function ReportesScreen(){

    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [exportando, setExportando] = useState(null);


    const cargar = async () => {

        try {
            setLoading(true);

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
                    'No hay informaci\u00F3n para exportar.'
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
                'No fue posible generar la exportaci\u00F3n.'
            );
        }
        finally{
            setExportando(null);
        }

    };


    if(loading){
        return (
            <View style={styles.center}>
                <ActivityIndicator
                    size="large"
                    color={COLORS.primary}
                />
            </View>
        );
    }


    const exportaciones = [
        {id:'AVES', icon:'\uD83D\uDC14', label:'Aves', nombre:'Aves', obtener:obtenerExportacionAves},
        {id:'VENTAS', icon:'\uD83D\uDCB0', label:'Ventas', nombre:'Ventas', obtener:obtenerExportacionVentas},
        {id:'CLIENTES', icon:'\uD83D\uDC65', label:'Clientes', nombre:'Clientes', obtener:obtenerExportacionClientes},
        {id:'FINANZAS', icon:'\uD83D\uDCCA', label:'Finanzas', nombre:'Finanzas', obtener:obtenerExportacionFinanzas},
        {id:'HUEVOS', icon:'\uD83E\uDD5A', label:'Huevos', nombre:'Huevos', obtener:obtenerExportacionHuevos},
        {id:'JAULAS', icon:'\uD83C\uDFE0', label:'Jaulas', nombre:'Jaulas', obtener:obtenerExportacionJaulas}
    ];


    return (
        <ScrollView
            style={styles.container}
            contentContainerStyle={styles.content}
        >

            <Header
                title="Reportes"
                subtitle={'Resumen y exportaci\u00F3n del criadero'}
            />

            <SectionTitle>
                {'\uD83D\uDC14 Aves'}
            </SectionTitle>

            <Card>
                <Text>
                    Activas: {data?.aves?.activas || 0}
                </Text>
                <Text>
                    Vendidas: {data?.aves?.vendidas || 0}
                </Text>
                <Text>
                    Fallecidas: {data?.aves?.fallecidas || 0}
                </Text>
            </Card>

            <SectionTitle>
                {'\uD83E\uDE7A Salud'}
            </SectionTitle>

            <Card>
                <Text>
                    En tratamiento: {data?.salud?.estado?.tratamiento || 0}
                </Text>
                <Text>
                    Enfermas: {data?.salud?.estado?.enfermas || 0}
                </Text>
                {
                    data?.salud?.enfermedades?.map(item => (
                        <Text key={item.enfermedad}>
                            {'\uD83D\uDD34 '} {item.enfermedad} ({item.cantidad})
                        </Text>
                    ))
                }
            </Card>

            <SectionTitle>
                {'\uD83E\uDD5A Producci\u00F3n'}
            </SectionTitle>

            <Card>
                <Text>
                    Hoy: {data?.produccion?.huevos?.hoy || 0} huevos
                </Text>
                <Text>
                    Mes: {data?.produccion?.huevos?.mes || 0} huevos
                </Text>
                <Text>
                    Mejor ponedora: {data?.produccion?.mejor?.codigo || 'Sin datos'}
                </Text>
            </Card>

            <SectionTitle>
                {'\uD83D\uDCB0 Finanzas'}
            </SectionTitle>

            <Card>
                <Text>
                    Ingresos: ${Number(data?.finanzas?.ingresos || 0).toFixed(2)}
                </Text>
                <Text>
                    Egresos: ${Number(data?.finanzas?.egresos || 0).toFixed(2)}
                </Text>
                <Text>
                    Utilidad: ${Number(data?.finanzas?.utilidad || 0).toFixed(2)}
                </Text>
            </Card>


            <SectionTitle>
                {'\uD83D\uDCE4 Exportaciones CSV'}
            </SectionTitle>

            <Text style={styles.exportHelp}>
                {'Los archivos CSV se generan con codificaci\u00F3n UTF-8 y se pueden abrir directamente en Excel o compartir desde el tel\u00E9fono.'}
            </Text>

            <View style={styles.exportGrid}>
                {
                    exportaciones.map(item => (
                        <TouchableOpacity
                            key={item.id}
                            style={styles.exportButton}
                            disabled={!!exportando}
                            onPress={() =>
                                ejecutarExportacion(item)
                            }
                        >
                            <Text style={styles.exportIcon}>
                                {item.icon}
                            </Text>
                            <Text style={styles.exportText}>
                                {
                                    exportando === item.id
                                        ? 'Generando...'
                                        : `Exportar ${item.label}`
                                }
                            </Text>
                        </TouchableOpacity>
                    ))
                }
            </View>

        </ScrollView>
    );

}


const styles = StyleSheet.create({
    container:{
        flex:1,
        backgroundColor:COLORS.background
    },
    content:{
        padding:16,
        paddingBottom:40
    },
    center:{
        flex:1,
        justifyContent:'center',
        alignItems:'center',
        backgroundColor:COLORS.background
    },
    exportHelp:{
        color:COLORS.textSecondary,
        lineHeight:19,
        marginBottom:12
    },
    exportGrid:{
        flexDirection:'row',
        flexWrap:'wrap',
        justifyContent:'space-between'
    },
    exportButton:{
        width:'48.5%',
        backgroundColor:COLORS.card,
        borderWidth:1,
        borderColor:COLORS.border,
        borderRadius:14,
        padding:15,
        marginBottom:10,
        alignItems:'center'
    },
    exportIcon:{
        fontSize:28
    },
    exportText:{
        marginTop:6,
        color:COLORS.primary,
        fontWeight:'bold',
        textAlign:'center'
    }
});
