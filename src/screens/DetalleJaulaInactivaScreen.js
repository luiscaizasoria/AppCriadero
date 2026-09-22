import React, {
    useCallback,
    useState
} from 'react';

import {
    View,
    Text,
    Image,
    ScrollView,
    TouchableOpacity,
    ActivityIndicator,
    StyleSheet,
    Alert
} from 'react-native';

import {
    useFocusEffect
} from '@react-navigation/native';

import {
    obtenerJaulaPorId,
    obtenerAvesHistoricasJaula,
    obtenerHistorialCompletoJaula
} from '../repositories/JaulaRepository';

import {
    COLORS
} from '../config/constants';

import Card from '../components/Card';


export default function DetalleJaulaInactivaScreen({
    route,
    navigation
}) {

    const {
        jaulaId
    } = route.params;

    const [jaula, setJaula] = useState(null);
    const [aves, setAves] = useState([]);
    const [historial, setHistorial] = useState([]);
    const [loading, setLoading] = useState(true);


    const cargar = async () => {

        try {

            setLoading(true);

            const [
                jaulaData,
                avesData,
                historialData
            ] = await Promise.all([
                obtenerJaulaPorId(jaulaId),
                obtenerAvesHistoricasJaula(jaulaId),
                obtenerHistorialCompletoJaula(jaulaId)
            ]);

            setJaula(jaulaData);
            setAves(avesData);
            setHistorial(historialData);

        }
        catch(error){

            console.error(
                'Error cargando jaula inactiva:',
                error
            );

        }
        finally{

            setLoading(false);

        }

    };


    useFocusEffect(
        useCallback(() => {
            cargar();
        }, [jaulaId])
    );


    const abrirAve = aveId => {

        const tabNavigation =
            navigation.getParent();

        if(!tabNavigation){
            Alert.alert(
                'Error',
                'No fue posible abrir el detalle del ave.'
            );
            return;
        }

        tabNavigation.navigate(
            'Aves',
            {
                screen:'DetalleAve',
                params:{
                    aveId
                }
            }
        );

    };


    if(loading){
        return (
            <View style={styles.center}>
                <ActivityIndicator
                    size="large"
                    color={COLORS.primary}
                />
                <Text style={styles.loadingText}>
                    Cargando historial de la jaula...
                </Text>
            </View>
        );
    }


    if(!jaula){
        return (
            <View style={styles.center}>
                <Text style={styles.emptyText}>
                    Jaula no encontrada.
                </Text>
            </View>
        );
    }


    return (
        <ScrollView
            style={styles.container}
            contentContainerStyle={styles.content}
        >

            <View style={styles.headerRow}>
                <View style={styles.headerMain}>
                    <Text style={styles.title}>
                        {jaula.codigo}
                    </Text>
                    <Text style={styles.name}>
                        {jaula.nombre || 'Sin nombre'}
                    </Text>
                </View>

                <View style={styles.inactiveBadge}>
                    <Text style={styles.inactiveBadgeText}>
                        Inactiva
                    </Text>
                </View>
            </View>

            <Text style={styles.readOnlyText}>
                Esta jaula est谩 desactivada. La informaci贸n se conserva 煤nicamente para consulta hist贸rica.
            </Text>


            <Card>
                <Text style={styles.sectionTitle}>
                    馃彔 Informaci贸n
                </Text>

                <Info label="C贸digo" value={jaula.codigo} />
                <Info label="Nombre" value={jaula.nombre} />
                <Info label="Ubicaci贸n" value={jaula.ubicacion} />
                <Info label="Tipo" value={jaula.tipo} />
                <Info label="Estado sanitario" value={jaula.estado_sanitario} />
                <Info label="Creaci贸n" value={formatearFecha(jaula.fecha_creacion)} />
                <Info
                    label="Desactivaci贸n"
                    value={
                        formatearFecha(
                            jaula.fecha_desactivacion ||
                            jaula.fecha_actualizacion
                        )
                    }
                    last
                />
            </Card>


            <Card>
                <View style={styles.sectionHeader}>
                    <Text style={styles.sectionTitle}>
                        馃悢 Aves que estuvieron aqu铆
                    </Text>
                    <Text style={styles.counter}>
                        {aves.length}
                    </Text>
                </View>

                {
                    aves.length === 0
                        ? (
                            <Text style={styles.emptyText}>
                                No hay aves registradas en el historial de esta jaula.
                            </Text>
                        )
                        : aves.map(item => (
                            <TouchableOpacity
                                key={item.id}
                                style={styles.birdRow}
                                onPress={() =>
                                    abrirAve(item.id)
                                }
                            >
                                {
                                    item.foto_uri
                                        ? (
                                            <Image
                                                source={{uri:item.foto_uri}}
                                                style={styles.birdPhoto}
                                            />
                                        )
                                        : (
                                            <View style={styles.birdPhotoEmpty}>
                                                <Text>
                                                    {item.sexo === 'MACHO' ? '馃悡' : '馃悢'}
                                                </Text>
                                            </View>
                                        )
                                }

                                <View style={styles.birdInfo}>
                                    <Text style={styles.birdCode}>
                                        {item.codigo}
                                    </Text>
                                    <Text style={styles.birdDetail}>
                                        {item.raza || 'Sin raza'} 路 {textoSexo(item.sexo)}
                                    </Text>
                                </View>

                                <Text style={styles.arrow}>
                                    鈥?                                </Text>
                            </TouchableOpacity>
                        ))
                }
            </Card>


            <Card>
                <View style={styles.sectionHeader}>
                    <Text style={styles.sectionTitle}>
                        馃摉 Historial
                    </Text>
                    <Text style={styles.counter}>
                        {historial.length}
                    </Text>
                </View>

                {
                    historial.length === 0
                        ? (
                            <Text style={styles.emptyText}>
                                La jaula no tiene eventos registrados.
                            </Text>
                        )
                        : historial.map(item => (
                            <View
                                key={item.id}
                                style={styles.event}
                            >
                                <Text style={styles.eventType}>
                                    {textoEvento(item.tipo_evento)}
                                </Text>
                                <Text style={styles.eventDate}>
                                    {formatearFecha(item.fecha)}
                                </Text>
                                {
                                    item.ave_codigo
                                    ? (
                                        <Text style={styles.eventBird}>
                                            Ave: {item.ave_codigo}
                                        </Text>
                                    )
                                    : null
                                }
                                <Text style={styles.eventDetail}>
                                    {item.detalle || 'Sin detalle'}
                                </Text>
                            </View>
                        ))
                }
            </Card>

        </ScrollView>
    );

}


function Info({
    label,
    value,
    last = false
}){
    return (
        <View style={[
            styles.infoRow,
            last && styles.infoRowLast
        ]}>
            <Text style={styles.infoLabel}>
                {label}
            </Text>
            <Text style={styles.infoValue}>
                {
                    value === null ||
                    value === undefined ||
                    String(value).trim() === ''
                        ? 'No registrado'
                        : String(value)
                }
            </Text>
        </View>
    );
}


function textoSexo(sexo){
    if(sexo === 'MACHO') return 'Macho';
    if(sexo === 'HEMBRA') return 'Hembra';
    return 'Sexo no registrado';
}


function textoEvento(tipo){
    if(tipo === 'INGRESO_AVE') return '猬囷笍 Ingreso de ave';
    if(tipo === 'SALIDA_AVE') return '猬嗭笍 Salida de ave';
    return tipo || 'Evento';
}


function formatearFecha(fecha){
    if(!fecha) return 'No registrado';
    const date = new Date(fecha);
    if(Number.isNaN(date.getTime())) return String(fecha);
    return date.toLocaleString();
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
        alignItems:'center',
        justifyContent:'center',
        backgroundColor:COLORS.background,
        padding:20
    },
    loadingText:{
        marginTop:10,
        color:COLORS.textSecondary
    },
    headerRow:{
        flexDirection:'row',
        alignItems:'flex-start',
        marginBottom:8
    },
    headerMain:{
        flex:1
    },
    title:{
        fontSize:28,
        fontWeight:'bold',
        color:COLORS.primary
    },
    name:{
        color:COLORS.textSecondary,
        marginTop:3
    },
    inactiveBadge:{
        backgroundColor:'#e9ecef',
        paddingHorizontal:12,
        paddingVertical:6,
        borderRadius:14
    },
    inactiveBadgeText:{
        color:'#59636a',
        fontWeight:'bold',
        fontSize:12
    },
    readOnlyText:{
        color:COLORS.textSecondary,
        lineHeight:19,
        marginBottom:14
    },
    sectionHeader:{
        flexDirection:'row',
        alignItems:'center',
        justifyContent:'space-between'
    },
    sectionTitle:{
        fontSize:18,
        fontWeight:'bold',
        color:COLORS.text
    },
    counter:{
        color:COLORS.textSecondary,
        fontWeight:'bold'
    },
    infoRow:{
        flexDirection:'row',
        justifyContent:'space-between',
        borderBottomWidth:1,
        borderBottomColor:COLORS.border,
        paddingVertical:10
    },
    infoRowLast:{
        borderBottomWidth:0
    },
    infoLabel:{
        color:COLORS.textSecondary,
        flex:1
    },
    infoValue:{
        color:COLORS.text,
        fontWeight:'600',
        flex:1,
        textAlign:'right'
    },
    birdRow:{
        flexDirection:'row',
        alignItems:'center',
        paddingVertical:11,
        borderBottomWidth:1,
        borderBottomColor:COLORS.border
    },
    birdPhoto:{
        width:42,
        height:42,
        borderRadius:21
    },
    birdPhotoEmpty:{
        width:42,
        height:42,
        borderRadius:21,
        backgroundColor:'#e7f5f5',
        alignItems:'center',
        justifyContent:'center'
    },
    birdInfo:{
        flex:1,
        marginLeft:10
    },
    birdCode:{
        fontWeight:'bold',
        color:COLORS.text
    },
    birdDetail:{
        marginTop:2,
        color:COLORS.textSecondary,
        fontSize:12
    },
    arrow:{
        fontSize:28,
        color:COLORS.primary
    },
    event:{
        borderLeftWidth:3,
        borderLeftColor:'#8ec9b8',
        paddingLeft:12,
        paddingVertical:9,
        marginTop:8
    },
    eventType:{
        fontWeight:'bold',
        color:COLORS.text
    },
    eventDate:{
        color:COLORS.textSecondary,
        fontSize:12,
        marginTop:2
    },
    eventBird:{
        color:COLORS.primary,
        fontSize:12,
        marginTop:3,
        fontWeight:'600'
    },
    eventDetail:{
        color:COLORS.text,
        marginTop:4,
        lineHeight:18
    },
    emptyText:{
        color:COLORS.textSecondary,
        textAlign:'center',
        paddingVertical:16
    }
});
