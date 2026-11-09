import React from 'react';

import {
    createNativeStackNavigator
} from '@react-navigation/native-stack';

import AvesScreen from '../screens/AvesScreen';

import { opcionesPila, SIN_CABECERA } from './opcionesPila';
import { pantallasAve } from './pantallasCompartidas';

const Stack = createNativeStackNavigator();

export default function AvesStackNavigator(){

    return (

        <Stack.Navigator
            initialRouteName="ListaAves"
            screenOptions={opcionesPila('Aves')}
        >

            <Stack.Screen
                name="ListaAves"
                component={AvesScreen}
                options={SIN_CABECERA}
            />

            {pantallasAve(Stack)}

        </Stack.Navigator>

    );
}
