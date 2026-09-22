import React from 'react';
import { View, StyleSheet } from 'react-native';
import { COLORS } from '../config/constants';

export default function Card({children}){

    return (

        <View style={styles.card}>
            {children}
        </View>

    );

}


const styles = StyleSheet.create({

    card:{
        backgroundColor: COLORS.card,
        borderRadius:16,
        padding:16,
        marginVertical:8,
        shadowColor:'#000',
        shadowOpacity:0.1,
        shadowRadius:6,
        elevation:3
    }

});