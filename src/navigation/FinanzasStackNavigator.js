import React from 'react';

import {
    createNativeStackNavigator
} from '@react-navigation/native-stack';

import FinanzasScreen
    from '../screens/FinanzasScreen';

import NuevoMovimientoFinancieroScreen
    from '../screens/NuevoMovimientoFinancieroScreen';

import EditarMovimientoFinancieroScreen
    from '../screens/EditarMovimientoFinancieroScreen';

import {
    COLORS
} from '../config/constants';


const Stack =
    createNativeStackNavigator();


export default function FinanzasStackNavigator() {

    return (
        <Stack.Navigator
            initialRouteName="FinanzasInicio"
            screenOptions={{
                headerTintColor:
                    COLORS.primary,
                headerTitleStyle: {
                    fontWeight:
                        'bold'
                }
            }}
        >

            <Stack.Screen
                name="FinanzasInicio"
                component={FinanzasScreen}
                options={{
                    headerShown:false
                }}
            />

            <Stack.Screen
                name="NuevoMovimientoFinanciero"
                component={NuevoMovimientoFinancieroScreen}
                options={{
                    title:'Nuevo movimiento'
                }}
            />

            <Stack.Screen
                name="EditarMovimientoFinanciero"
                component={EditarMovimientoFinancieroScreen}
                options={{
                    title:'Movimiento financiero'
                }}
            />

        </Stack.Navigator>
    );

}
