import React from 'react';

import {
    createNativeStackNavigator
} from '@react-navigation/native-stack';

import JaulasScreen
    from '../screens/JaulasScreen';

import { opcionesPila, SIN_CABECERA } from './opcionesPila';
import { pantallasAve, pantallasJaula } from './pantallasCompartidas';


const Stack =
    createNativeStackNavigator();


export default function JaulasStackNavigator() {

    return (

        <Stack.Navigator
            screenOptions={opcionesPila('Jaulas')}
        >

            <Stack.Screen
                name="ListaJaulas"
                component={
                    JaulasScreen
                }
                options={SIN_CABECERA}
            />

            {pantallasJaula(Stack)}

            {pantallasAve(Stack)}

        </Stack.Navigator>

    );

}
