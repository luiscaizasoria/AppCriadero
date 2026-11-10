import React, {
    useCallback,
    useEffect,
    useState
} from 'react';

import {
    View,
    Text,
    ScrollView,
    StyleSheet,
    Alert,
    KeyboardAvoidingView,
    Platform
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

import FondoPantalla from '../components/FondoPantalla';
import Tarjeta from '../components/Tarjeta';
import TituloSeccion from '../components/TituloSeccion';
import CampoTexto from '../components/CampoTexto';
import OpcionPildora from '../components/OpcionPildora';
import Boton from '../components/Boton';
import BarraAccion from '../components/BarraAccion';
import Aviso from '../components/Aviso';
import useAvisoExito from '../components/useAvisoExito';
import EstadoCarga from '../components/EstadoCarga';
import EstadoError from '../components/EstadoError';
import EstadoVacio from '../components/EstadoVacio';

import {
    colors,
    spacing,
    typography
} from '../theme';


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
    const [errorCarga, setErrorCarga] = useState(false);
    const [guardando, setGuardando] = useState(false);

    const {
        aviso,
        mostrar: mostrarAviso,
        cerrar: cerrarAviso,
        saliendo
    } = useAvisoExito();


    const cargar = async () => {

        try {

            setLoading(true);

            setErrorCarga(false);

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
            setErrorCarga(true);
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

            // Antes: Alert con «Aceptar» que hacía goBack. Ahora: aviso y vuelve solo.
            mostrarAviso(
                'Movimiento actualizado',
                'Los cambios fueron guardados y quedaron registrados en el historial de correcciones.',
                () =>
                    navigation.goBack()
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

            mostrarAviso(
                'Venta corregida',
                'Se actualizaron la venta y sus movimientos financieros relacionados.',
                () =>
                    navigation.goBack()
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
            <FondoPantalla>
                <EstadoCarga
                    mensaje="Cargando movimiento..."
                />
            </FondoPantalla>
        );
    }


    if(errorCarga){
        return (
            <FondoPantalla>
                <EstadoError
                    titulo="No fue posible cargar el movimiento."
                    mensaje="Revisa tu conexión e inténtalo de nuevo."
                    onReintentar={cargar}
                />
            </FondoPantalla>
        );
    }


    if(!movimiento){
        return (
            <FondoPantalla>
                <EstadoVacio
                    icono="search-outline"
                    titulo="Movimiento no encontrado."
                    testID="movimiento-no-encontrado"
                />
            </FondoPantalla>
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
        <KeyboardAvoidingView
            style={styles.container}
            behavior={
                Platform.OS === 'ios'
                    ? 'padding'
                    : undefined
            }
        >

            <FondoPantalla>

                <ScrollView
                    contentContainerStyle={styles.content}
                    keyboardShouldPersistTaps="handled"
                >

                    <TituloSeccion
                        icono={
                            automaticoVenta
                                ? 'link-outline'
                                : 'create-outline'
                        }
                    >
                        {automaticoVenta ? 'Corregir venta' : 'Editar movimiento'}
                    </TituloSeccion>

                    <Tarjeta>
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
                    </Tarjeta>

                    {
                        automaticoVenta
                        ? (
                            <>
                                <View style={styles.ayuda}>
                                    <Aviso
                                        tono="info"
                                        duracion={0}
                                        mensaje="Este movimiento fue generado por una venta. Para mantener la contabilidad consistente, la corrección modifica la venta y los dos movimientos relacionados: valor del ave y valor de envío."
                                    />
                                </View>

                                <Tarjeta>

                                    <CampoTexto
                                        etiqueta="Valor del ave"
                                        accessibilityLabel="Valor del ave en dólares"
                                        icono="cash-outline"
                                        value={valorVenta}
                                        onChangeText={setValorVenta}
                                        keyboardType="decimal-pad"
                                        testID="venta-valor-ave"
                                    />

                                    <CampoTexto
                                        etiqueta="Valor de envío"
                                        accessibilityLabel="Valor de envío en dólares"
                                        icono="cart-outline"
                                        value={valorEnvio}
                                        onChangeText={setValorEnvio}
                                        keyboardType="decimal-pad"
                                        testID="venta-valor-envio"
                                    />

                                </Tarjeta>

                                <Tarjeta>
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
                                </Tarjeta>
                            </>
                        )
                        : (
                            <Tarjeta>

                                <Text style={styles.label}>
                                    Tipo
                                </Text>

                                <View
                                    style={styles.row}
                                    accessibilityRole="radiogroup"
                                >
                                    {
                                        ['INGRESO', 'EGRESO'].map(item => (
                                            <OpcionPildora
                                                key={item}
                                                testID={`movimiento-tipo-${item.toLowerCase()}`}
                                                texto={item === 'INGRESO' ? 'Ingreso' : 'Egreso'}
                                                icono={
                                                    item === 'INGRESO'
                                                        ? 'trending-up-outline'
                                                        : 'trending-down-outline'
                                                }
                                                activo={tipo === item}
                                                onPress={() => {
                                                    setTipo(item);
                                                    setCategoria(null);
                                                }}
                                            />
                                        ))
                                    }
                                </View>

                                <Text style={styles.label}>
                                    Categoría
                                </Text>

                                <View
                                    style={styles.row}
                                    accessibilityRole="radiogroup"
                                >
                                    {
                                        categoriasFiltradas.map(item => (
                                            <OpcionPildora
                                                key={item.id}
                                                testID={`movimiento-categoria-${item.codigo}`}
                                                texto={item.nombre}
                                                activo={categoria?.codigo === item.codigo}
                                                onPress={() =>
                                                    setCategoria(item)
                                                }
                                            />
                                        ))
                                    }
                                </View>

                                <CampoTexto
                                    etiqueta="Valor"
                                    accessibilityLabel="Valor del movimiento"
                                    icono="cash-outline"
                                    value={valor}
                                    onChangeText={setValor}
                                    keyboardType="decimal-pad"
                                    testID="movimiento-valor"
                                />

                                <CampoTexto
                                    etiqueta="Detalle"
                                    accessibilityLabel="Detalle del movimiento"
                                    icono="create-outline"
                                    value={detalle}
                                    onChangeText={setDetalle}
                                    multiline
                                    testID="movimiento-detalle"
                                />

                            </Tarjeta>
                        )
                    }


                    <TituloSeccion
                        icono="time-outline"
                        indice={1}
                    >
                        Historial de correcciones
                    </TituloSeccion>

                    {
                        historial.length === 0
                            ? (
                                <Text style={styles.historyEmpty}>
                                    Este movimiento todavía no tiene correcciones registradas.
                                </Text>
                            )
                            : historial.map(item => (
                                <Tarjeta
                                    key={item.id}
                                    franja={colors.primary}
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
                                </Tarjeta>
                            ))
                    }

                </ScrollView>


                <BarraAccion>
                    {
                        automaticoVenta
                            ? (
                                <Boton
                                    titulo={guardando ? 'Guardando...' : 'Guardar corrección'}
                                    icono={guardando ? undefined : 'guardar'}
                                    onPress={guardarVenta}
                                    atenuado={guardando || saliendo}
                                    testID="guardar-correccion-venta"
                                />
                            )
                            : (
                                <Boton
                                    titulo={guardando ? 'Guardando...' : 'Guardar cambios'}
                                    icono={guardando ? undefined : 'guardar'}
                                    onPress={guardarManual}
                                    atenuado={guardando || saliendo}
                                    testID="guardar-cambios-movimiento"
                                />
                            )
                    }
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

        </KeyboardAvoidingView>
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
        flex:1
    },
    content:{
        padding:spacing.pantalla,
        paddingBottom:spacing.xl
    },
    ayuda:{
        marginBottom:spacing.md
    },
    originTitle:{
        ...typography.secundario,
        color:colors.textSecondary
    },
    originText:{
        ...typography.subtitulo,
        color:colors.text,
        marginTop:2
    },
    originDate:{
        ...typography.secundario,
        color:colors.textSecondary,
        marginTop:spacing.xs
    },
    label:{
        ...typography.etiqueta,
        color:colors.text,
        marginBottom:spacing.xs
    },
    row:{
        flexDirection:'row',
        flexWrap:'wrap',
        marginBottom:spacing.sm
    },
    saleInfoTitle:{
        ...typography.subtitulo,
        color:colors.text
    },
    saleInfoText:{
        ...typography.cuerpo,
        color:colors.text,
        marginTop:spacing.xs
    },
    historyEmpty:{
        ...typography.cuerpo,
        color:colors.textSecondary,
        marginBottom:spacing.md
    },
    historyAction:{
        ...typography.cuerpoFuerte,
        color:colors.text
    },
    historyDate:{
        ...typography.secundario,
        color:colors.textSecondary,
        marginTop:2
    },
    historyText:{
        ...typography.cuerpo,
        color:colors.text,
        marginTop:spacing.xs
    }
});
