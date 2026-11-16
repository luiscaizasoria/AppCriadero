import React from 'react';

import {
    createNativeStackNavigator
} from '@react-navigation/native-stack';

import InicioScreen
    from '../screens/InicioScreen';

import AlertasScreen
    from '../screens/AlertasScreen';

import NuevoMovimientoFinancieroScreen
    from '../screens/NuevoMovimientoFinancieroScreen';

import AvesScreen
    from '../screens/AvesScreen';

import JaulasScreen
    from '../screens/JaulasScreen';

import FinanzasScreen
    from '../screens/FinanzasScreen';

import EditarMovimientoFinancieroScreen
    from '../screens/EditarMovimientoFinancieroScreen';

import ProduccionHuevosScreen
    from '../screens/ProduccionHuevosScreen';

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

            <Stack.Screen
                name="Alertas"
                component={AlertasScreen}
            />

            <Stack.Screen
                name="NuevoMovimientoFinanciero"
                component={NuevoMovimientoFinancieroScreen}
            />

            {/* Destinos de las tarjetas de Inicio: se abren dentro de esta pestaña. */}
            <Stack.Screen
                name="ListaAves"
                component={AvesScreen}
            />

            <Stack.Screen
                name="ListaJaulas"
                component={JaulasScreen}
            />

            <Stack.Screen
                name="FinanzasInicio"
                component={FinanzasScreen}
            />

            <Stack.Screen
                name="EditarMovimientoFinanciero"
                component={EditarMovimientoFinancieroScreen}
            />

            <Stack.Screen
                name="ProduccionHuevos"
                component={ProduccionHuevosScreen}
            />

            {pantallasAve(Stack)}

            {pantallasJaula(Stack)}

        </Stack.Navigator>

    );

}
