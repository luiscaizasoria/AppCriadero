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

import { opcionesPila, SIN_CABECERA } from './opcionesPila';


const Stack =
    createNativeStackNavigator();


export default function FinanzasStackNavigator() {

    return (
        <Stack.Navigator
            initialRouteName="FinanzasInicio"
            screenOptions={opcionesPila('Finanzas')}
        >

            <Stack.Screen
                name="FinanzasInicio"
                component={FinanzasScreen}
                options={SIN_CABECERA}
            />

            <Stack.Screen
                name="NuevoMovimientoFinanciero"
                component={NuevoMovimientoFinancieroScreen}
            />

            <Stack.Screen
                name="EditarMovimientoFinanciero"
                component={EditarMovimientoFinancieroScreen}
            />

        </Stack.Navigator>
    );

}
