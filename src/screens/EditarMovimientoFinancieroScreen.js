import React, {
    useCallback,
    useEffect,
    useState
} from 'react';

import {
    View,
    Text,
    TextInput,
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
    obtenerMovimientoPorId,
    obtenerVentaPorBajaId,
    actualizarMovimientoManual,
    corregirVentaFinanciera,
    obtenerHistorialMovimiento
} from '../repositories/FinanzasRepository';

import {
    obtenerItemsCatalogo,
    obtenerCatalogoPorCodigo
} from '../repositories/ConfiguracionRepository';

import {
    COLORS
} from '../config/constants';


export default function EditarMovimientoFinancieroScreen({
    route,
    navigation
}) {

    const {
        movimientoId
    } = route.params;

    const [movimiento, setMovimiento] = useState(null);
    const [venta, setVenta] = useState(null);
    const [historial, setHistorial] = useState([]);
    const [categorias, setCategorias] = useState([]);
    const [tipo, setTipo] = useState('INGRESO');
    const [categoria, setCategoria] = useState(null);
    const [valor, setValor] = useState('');
    const [detalle, setDetalle] = useState('');
    const [valorVenta, setValorVenta] = useState('');
    const [valorEnvio, setValorEnvio] = useState('');
    const [loading, setLoading] = useState(true);
    const [guardando, setGuardando] = useState(false);


    const cargar = async () => {

        try {

            setLoading(true);

            const mov =
                await obtenerMovimientoPorId(
                    movimientoId
                );

            if(!mov){
                setMovimiento(null);
                return;
            }

            setMovimiento(mov);
            setTipo(mov.tipo || 'INGRESO');
            setValor(String(mov.valor ?? ''));
            setDetalle(mov.detalle || '');

            const catalogo =
                await obtenerCatalogoPorCodigo(
                    'CATEGORIAS_FINANCIERAS'
                );

            let items = [];

            if(catalogo){
                items =
                    await obtenerItemsCatalogo(
                        catalogo.id
                    );
            }

            setCategorias(items);
            setCategoria(
                items.find(
                    item =>
                        item.codigo === mov.categoria
                ) ||
                {
                    id:mov.categoria,
                    codigo:mov.categoria,
                    nombre:mov.categoria
                }
            );

            const hist =
                await obtenerHistorialMovimiento(
                    movimientoId
                );

            setHistorial(hist);

            if(
                mov.origen_tipo === 'VENTA_AVE'
                &&
                mov.origen_id
            ){
                const ventaData =
                    await obtenerVentaPorBajaId(
                        mov.origen_id
                    );

                setVenta(ventaData);
                setValorVenta(
                    String(
                        ventaData?.valor_venta ?? 0
                    )
                );
                setValorEnvio(
                    String(
                        ventaData?.valor_envio ?? 0
                    )
                );
            }
            else{
                setVenta(null);
            }

        }
        catch(error){
            console.error(
                'Error cargando movimiento:',
                error
            );
            Alert.alert(
                'Error',
                'No fue posible cargar el movimiento.'
            );
        }
        finally{
            setLoading(false);
        }

    };


    useFocusEffect(
        useCallback(() => {
            cargar();
        }, [movimientoId])
    );


    useEffect(() => {
        if(
            movimiento
            &&
            categorias.length > 0
        ){
            const actual =
                categorias.find(
                    item =>
                        item.codigo === movimiento.categoria
                );
            if(actual){
                setCategoria(actual);
            }
        }
    }, [categorias, movimiento]);


    const guardarManual = async () => {

        if(!categoria){
            Alert.alert(
                'Categoría requerida',
                'Seleccione una categoría.'
            );
            return;
        }

        const valorNumero =
            Number(
                String(valor)
                    .replace(',', '.')
            );

        if(
            !Number.isFinite(valorNumero)
            ||
            valorNumero <= 0
        ){
            Alert.alert(
                'Valor inválido',
                'Ingrese un valor mayor a cero.'
            );
            return;
        }

        try{
            setGuardando(true);

            await actualizarMovimientoManual({
                id:movimiento.id,
                tipo,
                categoria:categoria.codigo,
                valor:valorNumero,
                detalle:detalle.trim(),
                fecha:movimiento.fecha
            });

            Alert.alert(
                'Movimiento actualizado',
                'Los cambios fueron guardados y quedaron registrados en el historial de correcciones.',
                [
                    {
                        text:'Aceptar',
                        onPress:() =>
                            navigation.goBack()
                    }
                ]
            );
        }
        catch(error){
            console.error(error);
            Alert.alert(
                'Error',
                'No fue posible actualizar el movimiento.'
            );
        }
        finally{
            setGuardando(false);
        }

    };


    const guardarVenta = async () => {

        const ventaNumero =
            parseNoNegativo(
                valorVenta
            );

        const envioNumero =
            parseNoNegativo(
                valorEnvio
            );

        if(
            ventaNumero === null
            ||
            envioNumero === null
        ){
            Alert.alert(
                'Valor inválido',
                'El valor del ave y el valor de envío deben ser números mayores o iguales a cero.'
            );
            return;
        }

        try{
            setGuardando(true);

            await corregirVentaFinanciera({
                bajaId:venta.id,
                valorVenta:ventaNumero,
                valorEnvio:envioNumero
            });

            Alert.alert(
                'Venta corregida',
                'Se actualizaron la venta y sus movimientos financieros relacionados.',
                [
                    {
                        text:'Aceptar',
                        onPress:() =>
                            navigation.goBack()
                    }
                ]
            );
        }
        catch(error){
            console.error(error);
            Alert.alert(
                'Error',
                'No fue posible corregir la venta.'
            );
        }
        finally{
            setGuardando(false);
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


    if(!movimiento){
        return (
            <View style={styles.center}>
                <Text>
                    Movimiento no encontrado.
                </Text>
            </View>
        );
    }


    const automaticoVenta =
        movimiento.origen_tipo === 'VENTA_AVE'
        &&
        !!venta;


    const categoriasFiltradas =
        categorias.filter(item => {
            if(tipo === 'INGRESO'){
                return [
                    'VENTA_AVE',
                    'ENVIO_AVE',
                    'VENTA_HUEVOS',
                    'OTRO'
                ].includes(item.codigo);
            }

            return [
                'ALIMENTO',
                'MEDICAMENTO',
                'INFRAESTRUCTURA',
                'COMPRA_AVE',
                'OTRO'
            ].includes(item.codigo);
        });


    return (
        <ScrollView
            style={styles.container}
            contentContainerStyle={styles.content}
            keyboardShouldPersistTaps="handled"
        >

            <Text style={styles.title}>
                {automaticoVenta ? '🔗 Corregir venta' : '✏️ Editar movimiento'}
            </Text>

            <View style={styles.originCard}>
                <Text style={styles.originTitle}>
                    Origen
                </Text>
                <Text style={styles.originText}>
                    {
                        automaticoVenta
                            ? `Venta de ave ${venta?.ave_codigo || movimiento.ave_codigo || ''}`
                            : 'Movimiento manual'
                    }
                </Text>
                <Text style={styles.originDate}>
                    {new Date(movimiento.fecha).toLocaleString()}
                </Text>
            </View>

            {
                automaticoVenta
                ? (
                    <>
                        <Text style={styles.helpText}>
                            Este movimiento fue generado por una venta. Para mantener la contabilidad consistente, la corrección modifica la venta y los dos movimientos relacionados: valor del ave y valor de envío.
                        </Text>

                        <Text style={styles.label}>
                            Valor del ave
                        </Text>
                        <TextInput
                            style={styles.input}
                            value={valorVenta}
                            onChangeText={setValorVenta}
                            keyboardType="decimal-pad"
                        />

                        <Text style={styles.label}>
                            Valor de envío
                        </Text>
                        <TextInput
                            style={styles.input}
                            value={valorEnvio}
                            onChangeText={setValorEnvio}
                            keyboardType="decimal-pad"
                        />

                        <View style={styles.saleInfoCard}>
                            <Text style={styles.saleInfoTitle}>
                                Datos de la venta
                            </Text>
                            <Text style={styles.saleInfoText}>
                                Cliente: {venta?.comprador || 'No registrado'}
                            </Text>
                            <Text style={styles.saleInfoText}>
                                Celular: {venta?.celular || 'No registrado'}
                            </Text>
                            <Text style={styles.saleInfoText}>
                                Destino: {venta?.ciudad_destino || 'No registrado'}
                            </Text>
                        </View>

                        <TouchableOpacity
                            style={styles.button}
                            onPress={guardarVenta}
                            disabled={guardando}
                        >
                            <Text style={styles.buttonText}>
                                {guardando ? 'Guardando...' : '💾 Guardar corrección'}
                            </Text>
                        </TouchableOpacity>
                    </>
                )
                : (
                    <>
                        <Text style={styles.label}>
                            Tipo
                        </Text>

                        <View style={styles.row}>
                            {
                                ['INGRESO', 'EGRESO'].map(item => (
                                    <TouchableOpacity
                                        key={item}
                                        style={[
                                            styles.option,
                                            tipo === item &&
                                            styles.selected
                                        ]}
                                        onPress={() => {
                                            setTipo(item);
                                            setCategoria(null);
                                        }}
                                    >
                                        <Text
                                            style={[
                                                styles.optionText,
                                                tipo === item &&
                                                styles.selectedText
                                            ]}
                                        >
                                            {item === 'INGRESO' ? '🟢 Ingreso' : '🔴 Egreso'}
                                        </Text>
                                    </TouchableOpacity>
                                ))
                            }
                        </View>

                        <Text style={styles.label}>
                            Categoría
                        </Text>

                        <View style={styles.row}>
                            {
                                categoriasFiltradas.map(item => (
                                    <TouchableOpacity
                                        key={item.id}
                                        style={[
                                            styles.option,
                                            categoria?.codigo === item.codigo &&
                                            styles.selected
                                        ]}
                                        onPress={() =>
                                            setCategoria(item)
                                        }
                                    >
                                        <Text
                                            style={[
                                                styles.optionText,
                                                categoria?.codigo === item.codigo &&
                                                styles.selectedText
                                            ]}
                                        >
                                            {item.nombre}
                                        </Text>
                                    </TouchableOpacity>
                                ))
                            }
                        </View>

                        <Text style={styles.label}>
                            Valor
                        </Text>
                        <TextInput
                            style={styles.input}
                            value={valor}
                            onChangeText={setValor}
                            keyboardType="decimal-pad"
                        />

                        <Text style={styles.label}>
                            Detalle
                        </Text>
                        <TextInput
                            style={[
                                styles.input,
                                styles.area
                            ]}
                            value={detalle}
                            onChangeText={setDetalle}
                            multiline
                        />

                        <TouchableOpacity
                            style={styles.button}
                            onPress={guardarManual}
                            disabled={guardando}
                        >
                            <Text style={styles.buttonText}>
                                {guardando ? 'Guardando...' : '💾 Guardar cambios'}
                            </Text>
                        </TouchableOpacity>
                    </>
                )
            }


            <Text style={styles.historyTitle}>
                Historial de correcciones
            </Text>

            {
                historial.length === 0
                    ? (
                        <Text style={styles.historyEmpty}>
                            Este movimiento todavía no tiene correcciones registradas.
                        </Text>
                    )
                    : historial.map(item => (
                        <View
                            key={item.id}
                            style={styles.historyCard}
                        >
                            <Text style={styles.historyAction}>
                                {item.accion}
                            </Text>
                            <Text style={styles.historyDate}>
                                {new Date(item.fecha).toLocaleString()}
                            </Text>
                            <Text style={styles.historyText}>
                                Valor: {formatoDinero(item.valor_anterior)} → {formatoDinero(item.valor_nuevo)}
                            </Text>
                            {
                                item.categoria_anterior !== item.categoria_nueva
                                ? (
                                    <Text style={styles.historyText}>
                                        Categoría: {item.categoria_anterior || '-'} → {item.categoria_nueva || '-'}
                                    </Text>
                                )
                                : null
                            }
                        </View>
                    ))
            }

        </ScrollView>
    );

}


function parseNoNegativo(valor){
    const text = String(valor ?? '').trim();
    if(!text) return 0;
    const number = Number(text.replace(',', '.'));
    if(!Number.isFinite(number) || number < 0) return null;
    return number;
}


function formatoDinero(valor){
    if(valor === null || valor === undefined) return '-';
    const number = Number(valor);
    if(!Number.isFinite(number)) return '-';
    return `$${number.toFixed(2)}`;
}


const styles = StyleSheet.create({
    container:{
        flex:1,
        backgroundColor:COLORS.background
    },
    content:{
        padding:20,
        paddingBottom:45
    },
    center:{
        flex:1,
        alignItems:'center',
        justifyContent:'center',
        backgroundColor:COLORS.background
    },
    title:{
        fontSize:26,
        fontWeight:'bold',
        color:COLORS.primary
    },
    originCard:{
        backgroundColor:COLORS.card,
        borderRadius:14,
        padding:14,
        marginTop:16
    },
    originTitle:{
        color:COLORS.textSecondary,
        fontSize:12
    },
    originText:{
        color:COLORS.text,
        fontWeight:'bold',
        marginTop:3
    },
    originDate:{
        color:COLORS.textSecondary,
        fontSize:12,
        marginTop:4
    },
    helpText:{
        marginTop:15,
        color:COLORS.textSecondary,
        lineHeight:19
    },
    label:{
        marginTop:20,
        marginBottom:8,
        fontWeight:'600',
        color:COLORS.text
    },
    row:{
        flexDirection:'row',
        flexWrap:'wrap'
    },
    option:{
        backgroundColor:'#e8eeee',
        padding:11,
        borderRadius:18,
        marginRight:8,
        marginBottom:8
    },
    selected:{
        backgroundColor:COLORS.primary
    },
    optionText:{
        color:COLORS.text
    },
    selectedText:{
        color:'#fff',
        fontWeight:'bold'
    },
    input:{
        backgroundColor:COLORS.card,
        borderWidth:1,
        borderColor:COLORS.border,
        borderRadius:12,
        padding:13
    },
    area:{
        minHeight:95,
        textAlignVertical:'top'
    },
    button:{
        backgroundColor:COLORS.primary,
        borderRadius:14,
        padding:16,
        alignItems:'center',
        marginTop:28
    },
    buttonText:{
        color:'#fff',
        fontWeight:'bold'
    },
    saleInfoCard:{
        backgroundColor:'#edf7f5',
        borderRadius:12,
        padding:13,
        marginTop:18
    },
    saleInfoTitle:{
        fontWeight:'bold',
        color:COLORS.text
    },
    saleInfoText:{
        color:COLORS.textSecondary,
        marginTop:4
    },
    historyTitle:{
        marginTop:30,
        fontSize:18,
        fontWeight:'bold',
        color:COLORS.text
    },
    historyEmpty:{
        marginTop:10,
        color:COLORS.textSecondary
    },
    historyCard:{
        backgroundColor:COLORS.card,
        borderRadius:12,
        padding:13,
        marginTop:10,
        borderLeftWidth:3,
        borderLeftColor:'#8ec9b8'
    },
    historyAction:{
        fontWeight:'bold',
        color:COLORS.text
    },
    historyDate:{
        color:COLORS.textSecondary,
        fontSize:12,
        marginTop:3
    },
    historyText:{
        color:COLORS.text,
        marginTop:5
    }
});
