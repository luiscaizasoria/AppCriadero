import React, {
    useCallback,
    useState
} from 'react';

import {
    View,
    Text,
    Image,
    ScrollView,
    StyleSheet
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
    colors,
    spacing,
    typography
} from '../theme';

import FondoPantalla from '../components/FondoPantalla';
import Tarjeta from '../components/Tarjeta';
import TituloSeccion from '../components/TituloSeccion';
import IconoCirculo from '../components/IconoCirculo';
import Icono from '../components/Icono';
import Chip from '../components/Chip';
import Aviso from '../components/Aviso';
import Pulsable from '../components/Pulsable';
import EstadoCarga from '../components/EstadoCarga';
import EstadoVacio from '../components/EstadoVacio';

import { useContextoPantalla } from '../navigation/contextoPantalla';


export default function DetalleJaulaInactivaScreen({
    route,
    navigation
}) {

    const {
        jaulaId
    } = route.params;

    const [jaula, setJaula] = useState(null);

    // Migas: las pantallas hijas muestran "Jaulas › {código}"
    useContextoPantalla(route.key, jaula?.codigo);

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

        // DetalleAve está registrada en esta misma pila: "atrás" vuelve a la jaula.
        navigation.navigate(
            'DetalleAve',
            {
                aveId
            }
        );

    };


    if(loading){
        return (
            <FondoPantalla>
                <View style={styles.center}>
                    <EstadoCarga
                        mensaje="Cargando historial de la jaula..."
                    />
                </View>
            </FondoPantalla>
        );
    }


    if(!jaula){
        return (
            <FondoPantalla>
                <View style={styles.center}>
                    <EstadoVacio
                        icono="archive-outline"
                        titulo="Jaula no encontrada."
                        testID="jaula-no-encontrada"
                    />
                </View>
            </FondoPantalla>
        );
    }


    return (
        <FondoPantalla>
        <ScrollView
            style={styles.container}
            contentContainerStyle={styles.content}
        >

            <Tarjeta
                franja={colors.border}
                testID="jaula-encabezado"
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

                    <Chip
                        texto="Inactiva"
                        tono="neutro"
                        icono="lock-closed-outline"
                    />
                </View>
            </Tarjeta>

            <View style={styles.aviso}>
                <Aviso
                    tono="info"
                    duracion={0}
                    testID="jaula-solo-lectura"
                    mensaje="Esta jaula está desactivada. La información se conserva únicamente para consulta histórica."
                />
            </View>


            <Tarjeta>
                <TituloSeccion icono="home-outline" indice={0}>
                    Información
                </TituloSeccion>

                <Info label="Código" value={jaula.codigo} />
                <Info label="Nombre" value={jaula.nombre} />
                <Info label="Ubicación" value={jaula.ubicacion} />
                <Info label="Tipo" value={jaula.tipo} />
                <Info label="Estado sanitario" value={jaula.estado_sanitario} />
                <Info label="Creación" value={formatearFecha(jaula.fecha_creacion)} />
                <Info
                    label="Desactivación"
                    value={
                        formatearFecha(
                            jaula.fecha_desactivacion ||
                            jaula.fecha_actualizacion
                        )
                    }
                    last
                />
            </Tarjeta>


            <Tarjeta>
                <View style={styles.sectionHeader}>
                    <View style={styles.sectionTitulo}>
                        <TituloSeccion icono="aves" indice={2}>
                            Aves que estuvieron aquí
                        </TituloSeccion>
                    </View>
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
                            <Pulsable
                                key={item.id}
                                style={styles.birdRow}
                                testID={`ave-historica-${item.codigo}`}
                                accessibilityRole="button"
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
                                            <IconoCirculo
                                                icono="aves"
                                                indice={2}
                                                tamano={44}
                                            />
                                        )
                                }

                                <View style={styles.birdInfo}>
                                    <Text style={styles.birdCode}>
                                        {item.codigo}
                                    </Text>
                                    <Text style={styles.birdDetail}>
                                        {item.raza || 'Sin raza'} · {textoSexo(item.sexo)}
                                    </Text>
                                </View>

                                <Icono
                                    nombre="siguiente"
                                    tamano={22}
                                    color={colors.primary}
                                />
                            </Pulsable>
                        ))
                }
            </Tarjeta>


            <Tarjeta>
                <View style={styles.sectionHeader}>
                    <View style={styles.sectionTitulo}>
                        <TituloSeccion icono="historial" indice={0}>
                            Historial
                        </TituloSeccion>
                    </View>
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
                                <IconoCirculo
                                    icono={iconoEvento(item.tipo_evento)}
                                    indice={item.tipo_evento === 'SALIDA_AVE' ? 3 : 1}
                                    tamano={36}
                                    style={styles.eventIcono}
                                />
                                <View style={styles.eventInfo}>
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
                            </View>
                        ))
                }
            </Tarjeta>

        </ScrollView>
        </FondoPantalla>
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
    if(tipo === 'INGRESO_AVE') return 'Ingreso de ave';
    if(tipo === 'SALIDA_AVE') return 'Salida de ave';
    return tipo || 'Evento';
}


function iconoEvento(tipo){
    if(tipo === 'INGRESO_AVE') return 'enter-outline';
    if(tipo === 'SALIDA_AVE') return 'exit-outline';
    return 'historial';
}


function formatearFecha(fecha){
    if(!fecha) return 'No registrado';
    const date = new Date(fecha);
    if(Number.isNaN(date.getTime())) return String(fecha);
    return date.toLocaleString();
}


const styles = StyleSheet.create({
    container:{
        flex:1
    },
    content:{
        padding:spacing.pantalla,
        paddingBottom:spacing.xxl
    },
    center:{
        flex:1,
        alignItems:'center',
        justifyContent:'center',
        padding:spacing.xl
    },
    aviso:{
        marginBottom:spacing.md
    },
    headerRow:{
        flexDirection:'row',
        alignItems:'flex-start'
    },
    headerMain:{
        flex:1,
        marginRight:spacing.sm
    },
    title:{
        ...typography.display,
        color:colors.primaryDark
    },
    name:{
        ...typography.cuerpo,
        color:colors.textSecondary,
        marginTop:spacing.xs
    },
    sectionHeader:{
        flexDirection:'row',
        alignItems:'center',
        justifyContent:'space-between'
    },
    sectionTitulo:{
        flex:1
    },
    counter:{
        ...typography.cuerpoFuerte,
        color:colors.textSecondary,
        marginLeft:spacing.sm
    },
    infoRow:{
        flexDirection:'row',
        justifyContent:'space-between',
        borderBottomWidth:1,
        borderBottomColor:colors.borderSoft,
        paddingVertical:spacing.md
    },
    infoRowLast:{
        borderBottomWidth:0
    },
    infoLabel:{
        ...typography.secundario,
        color:colors.textSecondary,
        flex:1
    },
    infoValue:{
        ...typography.cuerpoFuerte,
        color:colors.text,
        flex:1,
        textAlign:'right'
    },
    birdRow:{
        flexDirection:'row',
        alignItems:'center',
        minHeight:56,
        paddingVertical:spacing.sm,
        borderTopWidth:1,
        borderTopColor:colors.borderSoft
    },
    birdPhoto:{
        width:44,
        height:44,
        borderRadius:22,
        backgroundColor:colors.surfaceAlt
    },
    birdInfo:{
        flex:1,
        marginLeft:spacing.md
    },
    birdCode:{
        ...typography.cuerpoFuerte,
        color:colors.text
    },
    birdDetail:{
        ...typography.secundario,
        color:colors.textSecondary
    },
    event:{
        flexDirection:'row',
        paddingVertical:spacing.md,
        borderTopWidth:1,
        borderTopColor:colors.borderSoft
    },
    eventIcono:{
        marginRight:spacing.md
    },
    eventInfo:{
        flex:1
    },
    eventType:{
        ...typography.cuerpoFuerte,
        color:colors.text
    },
    eventDate:{
        ...typography.secundario,
        color:colors.textSecondary
    },
    eventBird:{
        ...typography.etiqueta,
        color:colors.primaryDark,
        marginTop:2
    },
    eventDetail:{
        ...typography.cuerpo,
        color:colors.text,
        marginTop:2
    },
    emptyText:{
        ...typography.cuerpo,
        color:colors.textSecondary,
        textAlign:'center',
        paddingVertical:spacing.lg
    }
});
