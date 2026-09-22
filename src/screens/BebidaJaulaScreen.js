import React, {
    useEffect,
    useState
} from 'react';

import {
    View,
    Text,
    TouchableOpacity,
    StyleSheet,
    Alert
} from 'react-native';

import {
    obtenerTiposBebidas,
    registrarBebida
} from '../repositories/BebidaRepository';

import {
    COLORS
} from '../config/constants';


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



    useEffect(() => {

        cargar();

    }, []);



    const cargar = async () => {

        const data =
            await obtenerTiposBebidas();

        setTipos(data);

    };



    const guardar = async () => {


        if(!tipo){

            Alert.alert(
                'Seleccione bebida',
                'Debe seleccionar un tipo de bebida.'
            );

            return;

        }



        await registrarBebida({

            jaulaId,

            fecha:
                new Date()
                .toISOString(),

            tipo:
                tipo.nombre

        });



        Alert.alert(
            'Bebida registrada',
            'El registro fue guardado correctamente.',
            [
                {
                    text:'Aceptar',
                    onPress:
                        () => navigation.goBack()
                }
            ]
        );

    };



    return (

        <View style={styles.container}>

            <Text style={styles.title}>
                💧 Bebida
            </Text>


            {
                tipos.map(item => (

                    <TouchableOpacity

                        key={item.id}

                        style={[
                            styles.option,

                            tipo?.id === item.id
                            &&
                            styles.selected
                        ]}

                        onPress={() =>
                            setTipo(item)
                        }

                    >

                        <Text
                            style={[
                                styles.optionText,

                                tipo?.id === item.id
                                &&
                                styles.selectedText
                            ]}
                        >
                            {item.nombre}
                        </Text>


                    </TouchableOpacity>

                ))
            }



            <TouchableOpacity
                style={styles.save}
                onPress={guardar}
            >

                <Text style={styles.saveText}>
                    💾 Guardar
                </Text>

            </TouchableOpacity>


        </View>

    );

}



const styles = StyleSheet.create({

    container:{
        flex:1,
        backgroundColor:COLORS.background,
        padding:20
    },

    title:{
        fontSize:26,
        fontWeight:'bold',
        color:COLORS.primary
    },

    option:{
        padding:15,
        backgroundColor:'#e8eeee',
        borderRadius:12,
        marginTop:10
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

    save:{
        marginTop:30,
        backgroundColor:COLORS.primary,
        padding:15,
        borderRadius:12,
        alignItems:'center'
    },

    saveText:{
        color:'#fff',
        fontWeight:'bold'
    }

});
