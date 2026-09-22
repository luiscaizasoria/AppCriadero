import React,{
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
    crearYCompartirBackup,
    seleccionarBackup,
    restaurarBackup
} from '../repositories/BackupRepository';


import {
    COLORS
} from '../config/constants';



export default function BackupScreen(){

    const [
        procesando,
        setProcesando
    ] = useState(false);



    const crear =
        async()=>{

            try{

                setProcesando(true);

                await crearYCompartirBackup();

                Alert.alert(
                    'Respaldo creado',
                    'Seleccione dónde guardar el archivo.'
                );

            }
            catch(error){

                console.error(error);

                Alert.alert(
                    'Error',
                    'No fue posible crear el respaldo.'
                );

            }
            finally{

                setProcesando(false);

            }

        };



    const restaurar =
        async()=>{

            const archivo =
                await seleccionarBackup();


            if(!archivo){

                return;

            }


            Alert.alert(
                'Restaurar respaldo',
                'Los datos actuales serán reemplazados.',
                [
                    {
                        text:'Cancelar'
                    },
                    {
                        text:'Restaurar',
                        onPress:async()=>{

                            try{

                                setProcesando(true);

                                await restaurarBackup(
                                    archivo
                                );

                                Alert.alert(
                                    'Restaurado',
                                    'Reinicie la aplicación para cargar la información.'
                                );

                            }
                            catch(error){

                                console.error(error);

                                Alert.alert(
                                    'Error',
                                    'No fue posible restaurar el respaldo.'
                                );

                            }
                            finally{

                                setProcesando(false);

                            }

                        }
                    }
                ]
            );

        };



    return (

        <View style={styles.container}>

            <Text style={styles.title}>
                💾 Respaldo
            </Text>


            <Text style={styles.text}>
                Crear o restaurar una copia de seguridad del criadero.
            </Text>



            <TouchableOpacity
                style={styles.button}
                onPress={crear}
                disabled={procesando}
            >

                <Text style={styles.buttonText}>
                    💾 Crear y guardar respaldo
                </Text>

            </TouchableOpacity>



            <TouchableOpacity
                style={styles.restore}
                onPress={restaurar}
                disabled={procesando}
            >

                <Text style={styles.buttonText}>
                    ♻️ Restaurar respaldo
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
    fontSize:28,
    fontWeight:'bold',
    color:COLORS.primary
},

text:{
    marginTop:20
},

button:{
    marginTop:30,
    backgroundColor:COLORS.primary,
    padding:16,
    borderRadius:14,
    alignItems:'center'
},

restore:{
    marginTop:20,
    backgroundColor:'#d9534f',
    padding:16,
    borderRadius:14,
    alignItems:'center'
},

buttonText:{
    color:'#fff',
    fontWeight:'bold'
}

});
