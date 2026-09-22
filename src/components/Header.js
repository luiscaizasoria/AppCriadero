import React from 'react';

import {
    View,
    Text,
    StyleSheet
} from 'react-native';


import { COLORS } from '../config/constants';


export default function Header({
    title,
    subtitle
}) {


    return (

        <View style={styles.container}>

            <Text style={styles.title}>
                🐔 {title}
            </Text>


            {
                subtitle &&
                <Text style={styles.subtitle}>
                    {subtitle}
                </Text>
            }

        </View>

    );

}



const styles = StyleSheet.create({

    container: {

        marginBottom: 15

    },


    title: {

        fontSize: 28,

        fontWeight: 'bold',

        color: COLORS.primary

    },


    subtitle: {

        fontSize: 16,

        color: COLORS.textSecondary,

        marginTop: 5

    }

});