import React, {
    useEffect,
    useState
} from 'react';

import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    StyleSheet,
    Alert,
    ScrollView
} from 'react-native';


import {
    registrarIngreso,
    registrarEgreso
} from '../repositories/FinanzasRepository';


import {
    obtenerItemsCatalogo,
    obtenerCatalogoPorCodigo
} from '../repositories/ConfiguracionRepository';


import {
    COLORS
} from '../config/constants';



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


                Alert.alert(
                    'Movimiento guardado',
                    'El movimiento financiero fue registrado correctamente.',
                    [
                        {
                            text:'Aceptar',
                            onPress:
                                ()=>navigation.goBack()
                        }
                    ]
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
            item => {

                if(tipo==='INGRESO'){

                    return [
                        'VENTA_AVE',
                        'VENTA_HUEVOS',
                        'OTRO'
                    ]
                    .includes(item.codigo);

                }


                return [
                    'ALIMENTO',
                    'MEDICAMENTO',
                    'INFRAESTRUCTURA',
                    'COMPRA_AVE',
                    'OTRO'
                ]
                .includes(item.codigo);

            }
        );



    return (

        <ScrollView
            style={styles.container}
            contentContainerStyle={styles.content}
        >

            <Text style={styles.title}>
                💰 Nuevo movimiento
            </Text>


            <Text style={styles.label}>
                Tipo
            </Text>


            <View style={styles.row}>

                {
                    ['INGRESO','EGRESO']
                    .map(item=>(

                        <TouchableOpacity
                            key={item}
                            style={[
                                styles.option,
                                tipo===item &&
                                styles.selected
                            ]}
                            onPress={()=>setTipo(item)}
                        >

                            <Text
                                style={[
                                    styles.optionText,
                                    tipo===item &&
                                    styles.selectedText
                                ]}
                            >
                                {
                                    item==='INGRESO'
                                    ?
                                    '🟢 Ingreso'
                                    :
                                    '🔴 Egreso'
                                }
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
                    categoriasFiltradas.map(item=>(

                        <TouchableOpacity

                            key={item.id}

                            style={[
                                styles.option,
                                categoria?.id===item.id &&
                                styles.selected
                            ]}

                            onPress={()=>
                                setCategoria(item)
                            }

                        >

                            <Text
                                style={[
                                    styles.optionText,
                                    categoria?.id===item.id &&
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
                keyboardType="numeric"
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
                onPress={guardar}
                disabled={guardando}
            >

                <Text style={styles.buttonText}>
                    💾 Guardar movimiento
                </Text>

            </TouchableOpacity>


        </ScrollView>

    );

}



const styles=StyleSheet.create({

container:{
    flex:1,
    backgroundColor:COLORS.background
},

content:{
    padding:20
},

title:{
    fontSize:26,
    fontWeight:'bold',
    color:COLORS.primary
},

label:{
    marginTop:20,
    marginBottom:8,
    fontWeight:'600'
},

row:{
    flexDirection:'row',
    flexWrap:'wrap'
},

option:{
    backgroundColor:'#e8eeee',
    padding:12,
    borderRadius:20,
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
    minHeight:100,
    textAlignVertical:'top'
},

button:{
    backgroundColor:COLORS.primary,
    padding:16,
    borderRadius:14,
    marginTop:30,
    alignItems:'center'
},

buttonText:{
    color:'#fff',
    fontWeight:'bold'
}

});
