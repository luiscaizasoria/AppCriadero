import React from 'react';

import {
Text,
StyleSheet
} from 'react-native';


export default function SectionTitle({children}){


return (

<Text style={styles.title}>
{children}
</Text>

);


}


const styles=StyleSheet.create({

title:{
fontSize:20,
fontWeight:'bold',
marginVertical:10,
color:'#234'
}

});