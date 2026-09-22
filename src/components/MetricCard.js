import React from 'react';
import { COLORS } from '../config/constants';
import {
View,
Text,
StyleSheet
} from 'react-native';


export default function MetricCard({
icon,
title,
value
}){


return (

<View style={styles.container}>

<Text style={styles.icon}>
{icon}
</Text>


<Text style={styles.value}>
{value}
</Text>


<Text style={styles.title}>
{title}
</Text>


</View>

);


}



const styles=StyleSheet.create({

container:{

backgroundColor:'#ffffff',

borderRadius:16,

padding:15,

width:'45%',

alignItems:'center',

margin:8,

elevation:3

},


icon:{
fontSize:30
},


value:{
fontSize:26,
fontWeight:'bold',
color:COLORS.primary
},


title:{
fontSize:14,
color:'#555'
}


});