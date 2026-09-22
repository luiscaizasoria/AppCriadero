import React from 'react';

import {
View,
Text,
StyleSheet
} from 'react-native';


export default function StatusBadge({
text,
color='#52b788'
}){


return (

<View style={[
styles.badge,
{backgroundColor:color}
]}>

<Text style={styles.text}>
{text}
</Text>


</View>

);


}


const styles=StyleSheet.create({

badge:{
paddingHorizontal:12,
paddingVertical:6,
borderRadius:20,
margin:4
},


text:{
color:'#fff',
fontWeight:'bold'
}

});