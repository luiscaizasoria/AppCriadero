import React from 'react';
import { StyleSheet, View } from 'react-native';
import FondoPantalla from '../components/FondoPantalla';
import EstadoVacio from '../components/EstadoVacio';


// Pantalla huérfana (no está registrada en ninguna pila): solo restilizada, sin lógica.
export default function SaludScreen(){

return(

<FondoPantalla>

<View style={styles.center}>

<EstadoVacio
icono="salud"
titulo="Salud"
/>

</View>

</FondoPantalla>

);

}

const styles = StyleSheet.create({
center:{
flex:1,
justifyContent:'center'
}
});
