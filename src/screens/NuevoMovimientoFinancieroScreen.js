import React, {
    useEffect,
    useRef,
    useState
} from 'react';

import {
    View,
    Text,
    StyleSheet,
    Alert,
    ScrollView,
    KeyboardAvoidingView,
    Platform
} from 'react-native';


import {
    registrarIngreso,
    registrarEgreso
} from '../repositories/FinanzasRepository';


import {
    obtenerItemsCatalogo,
    obtenerCatalogoPorCodigo
} from '../repositories/ConfiguracionRepository';


import FondoPantalla from '../components/FondoPantalla';
import Tarjeta from '../components/Tarjeta';
import CampoTexto from '../components/CampoTexto';
import OpcionPildora from '../components/OpcionPildora';
import Boton from '../components/Boton';
import BarraAccion from '../components/BarraAccion';
import Aviso from '../components/Aviso';
import {
    filtrarDecimal,
    categoriaVisible
} from '../components/filtroNumerico';
import useAvisoExito from '../components/useAvisoExito';
import useGuardaEnvio from '../components/useGuardaEnvio';
import useValidacion from '../components/useValidacion';
import CampoGrupo from '../components/CampoGrupo';


import {
    colors,
    spacing,
    typography
} from '../theme';



export default function NuevoMovimientoFinancieroScreen({
    navigation
}) {


    const [tipo,setTipo] =
        useState('INGRESO');

    const [categorias,setCategorias] =
        useState([]);

    const [categoria,setCategoria] =
        useState(null);

    const [valor,setValor] =
        useState('');

    const [detalle,setDetalle] =
        useState('');

    const [guardando,setGuardando] =
        useState(false);

    const {
        aviso,
        mostrar: mostrarAviso,
        cerrar: cerrarAviso,
        saliendo
    } = useAvisoExito();

    const guardia = useGuardaEnvio();
    const scrollRef = useRef(null);
    const v = useValidacion(scrollRef);



    useEffect(()=>{

        cargarCategorias();

    },[]);



    useEffect(()=>{

        setCategoria(null);

    },[tipo]);



    const cargarCategorias =
        async()=>{

            const catalogo =
                await obtenerCatalogoPorCodigo(
                    'CATEGORIAS_FINANCIERAS'
                );


            if(catalogo){

                const items =
                    await obtenerItemsCatalogo(
                        catalogo.id
                    );

                setCategorias(items);

            }

        };



    const guardar =
        async()=>{


            if(!categoria){

                v.fallar(
                    'categoria',
                    'Seleccione una categoría.'
                );

                Alert.alert(
                    'Categoría requerida',
                    'Seleccione una categoría.'
                );

                return;

            }


            if(
                !valor ||
                Number(valor)<=0
            ){

                v.fallar(
                    'valor',
                    'Ingrese un valor mayor a cero.'
                );

                Alert.alert(
                    'Valor inválido',
                    'Ingrese un valor mayor a cero.'
                );

                return;

            }


            try{

                setGuardando(true);


                const movimiento = {

                    categoria:
                        categoria.codigo,

                    valor:
                        Number(valor),

                    detalle:
                        detalle.trim(),

                    fecha:
                        new Date()
                        .toISOString()

                };


                if(tipo==='INGRESO'){

                    await registrarIngreso(
                        movimiento
                    );

                }
                else{

                    await registrarEgreso(
                        movimiento
                    );

                }


                // Antes: Alert con «Aceptar» que hacía goBack. Ahora: aviso y vuelve solo.
                mostrarAviso(
                    'Movimiento guardado',
                    'El movimiento financiero fue registrado correctamente.',
                    ()=>navigation.goBack()
                );


            }
            catch(error){

                console.error(
                    'Error guardando movimiento:',
                    error
                );

            }
            finally{

                setGuardando(false);

            }

        };



    const categoriasFiltradas =
        categorias.filter(
            // Excepción aprobada a la paridad de V1: además de los códigos fijos de cada tipo,
            // se muestran en ambos tipos las categorías creadas por el usuario.
            item => categoriaVisible(item.codigo,tipo)
        );

    const acento =
        tipo==='INGRESO'
        ?
        colors.success
        :
        colors.danger;

    const acentoTexto =
        tipo==='INGRESO'
        ?
        colors.successText
        :
        colors.dangerText;



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
                    ref={scrollRef}
                    contentContainerStyle={styles.content}
                    keyboardShouldPersistTaps="handled"
                >

                    <Tarjeta style={{borderColor:acento,borderWidth:2}}>

                        <Text style={[styles.label,{color:acentoTexto}]}>
                            Tipo
                        </Text>


                        <View
                            style={styles.row}
                            accessibilityRole="radiogroup"
                        >

                            {
                                ['INGRESO','EGRESO']
                                .map(item=>(

                                    <OpcionPildora
                                        key={item}
                                        testID={`movimiento-tipo-${item.toLowerCase()}`}
                                        texto={
                                            item==='INGRESO'
                                            ?
                                            'Ingreso'
                                            :
                                            'Egreso'
                                        }
                                        icono={
                                            item==='INGRESO'
                                            ?
                                            'trending-up-outline'
                                            :
                                            'trending-down-outline'
                                        }
                                        activo={tipo===item}
                                        acento={acento}
                                        onPress={()=>setTipo(item)}
                                    />

                                ))
                            }

                        </View>


                        <Text style={[styles.label,{color:acentoTexto}]}>
                            Categoría
                        </Text>


                        <CampoGrupo {...v.grupo('categoria')}>
                        <View
                            style={styles.row}
                            accessibilityRole="radiogroup"
                        >

                            {
                                categoriasFiltradas.map(item=>(

                                    <OpcionPildora
                                        key={item.id}
                                        testID={`movimiento-categoria-${item.codigo}`}
                                        texto={item.nombre}
                                        activo={categoria?.id===item.id}
                                        acento={acento}
                                        onPress={()=>{
                                            v.limpiar('categoria');
                                            setCategoria(item);
                                        }}
                                    />

                                ))
                            }

                        </View>
                        </CampoGrupo>


                        <CampoTexto
                            etiqueta="Valor"
                            accessibilityLabel="Valor del movimiento"
                            icono="cash-outline"
                            value={valor}
                            onChangeText={texto=>setValor(filtrarDecimal(texto))}
                            keyboardType="decimal-pad"
                            acento={acento}
                            testID="movimiento-valor"
                            {...v.props('valor')}
                        />


                        <CampoTexto
                            etiqueta="Detalle"
                            accessibilityLabel="Detalle del movimiento"
                            icono="create-outline"
                            value={detalle}
                            onChangeText={setDetalle}
                            acento={acento}
                            multiline
                            testID="movimiento-detalle"
                        />

                    </Tarjeta>

                </ScrollView>


                <BarraAccion>

                    <Boton
                        titulo="Guardar movimiento"
                        icono="guardar"
                        onPress={guardia(guardar)}
                        acento={acento}
                        guardando={guardando}
                        atenuado={saliendo}
                        testID="guardar-movimiento"
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

        </KeyboardAvoidingView>

    );

}



const styles=StyleSheet.create({

container:{
    flex:1
},

content:{
    padding:spacing.pantalla,
    paddingBottom:spacing.xl
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
}

});
