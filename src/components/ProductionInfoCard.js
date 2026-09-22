import React from 'react';

import {
    View,
    Text,
    StyleSheet
} from 'react-native';

import {
    COLORS
} from '../config/constants';


export default function ProductionInfoCard({
    icon,
    title,
    value
}) {

    return (

        <View style={styles.container}>

            <Text style={styles.icon}>
                {icon}
            </Text>

            <Text style={styles.title}>
                {title}
            </Text>

            <Text style={styles.value}>
                {value}
            </Text>

        </View>

    );

}


const styles = StyleSheet.create({

    container:{
        backgroundColor:'#f7fafa',
        borderRadius:12,
        paddingVertical:10,
        paddingHorizontal:14,
        flexDirection:'row',
        alignItems:'center',
        marginTop:8
    },

    icon:{
        fontSize:22,
        marginRight:10
    },

    title:{
        flex:1,
        fontSize:14,
        fontWeight:'600',
        color:COLORS.text
    },

    value:{
        fontSize:18,
        fontWeight:'bold',
        color:COLORS.primary
    }

});
