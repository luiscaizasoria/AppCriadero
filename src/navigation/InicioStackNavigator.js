import React from 'react';

import {
    createNativeStackNavigator
} from '@react-navigation/native-stack';

import InicioScreen
    from '../screens/InicioScreen';

import { opcionesPila, SIN_CABECERA } from './opcionesPila';
import { pantallasAve, pantallasJaula } from './pantallasCompartidas';


const Stack =
    createNativeStackNavigator();


// Inicio es la raíz de su propia pila: las alertas abren fichas y acciones
// dentro de esta pestaña y "atrás" vuelve a Inicio.
export default function InicioStackNavigator() {

    return (

        <Stack.Navigator
            initialRouteName="InicioPrincipal"
            screenOptions={opcionesPila('Inicio')}
        >

            <Stack.Screen
                name="InicioPrincipal"
                component={
                    InicioScreen
                }
                options={SIN_CABECERA}
            />

            {pantallasAve(Stack)}

            {pantallasJaula(Stack)}

        </Stack.Navigator>

    );

}
