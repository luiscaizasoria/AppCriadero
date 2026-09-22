import React from 'react';

import {
    View,
    Text,
    StyleSheet
} from 'react-native';

import {
    COLORS
} from '../config/constants';


export default function ProductionMetricCard({
    icon,
    title,
    value,
    suffix='huevos'
}) {

    return (

        <View style={styles.container}>

            <Text style={styles.icon}>
                {icon}
            </Text>

            <View style={styles.content}>

                <Text style={styles.title}>
                    {title}
                </Text>

                <Text style={styles.value}>
                    {value}
                    {' '}
                    <Text style={styles.suffix}>
                        {suffix}
                    </Text>
                </Text>

            </View>

        </View>

    );

}


const styles = StyleSheet.create({

    container:{
        flex:1,
        backgroundColor:'#f7fafa',
        borderRadius:12,
        padding:10,
        flexDirection:'row',
        alignItems:'center',
        marginHorizontal:5
    },

    icon:{
        fontSize:20,
        marginRight:8
    },

    content:{
        flex:1
    },

    title:{
        fontSize:13,
        color:COLORS.textSecondary,
        fontWeight:'600'
    },

    value:{
        fontSize:22,
        fontWeight:'bold',
        color:COLORS.primary
    },

    suffix:{
        fontSize:12,
        fontWeight:'normal',
        color:COLORS.textSecondary
    }

});
