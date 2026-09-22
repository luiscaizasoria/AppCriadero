import React from 'react';

import {
    createNativeStackNavigator
} from '@react-navigation/native-stack';

import AvesScreen from '../screens/AvesScreen';
import NuevaAveScreen from '../screens/NuevaAveScreen';
import DetalleAveScreen from '../screens/DetalleAveScreen';
import EvolucionAveScreen from '../screens/EvolucionAveScreen';
import SaludAveScreen from '../screens/SaludAveScreen';
import FinalizarTratamientoScreen from '../screens/FinalizarTratamientoScreen';
import BajaAveScreen from '../screens/BajaAveScreen';
import RegistrarHuevoScreen from '../screens/RegistrarHuevoScreen';
import CicloVidaAveScreen from '../screens/CicloVidaAveScreen';
import GenealogiaAveScreen from '../screens/GenealogiaAveScreen';

import {
    COLORS
} from '../config/constants';

const Stack = createNativeStackNavigator();

export default function AvesStackNavigator(){

    return (

        <Stack.Navigator
            initialRouteName="ListaAves"
            screenOptions={{
                headerTintColor: COLORS.primary
            }}
        >

            <Stack.Screen
                name="ListaAves"
                component={AvesScreen}
                options={{headerShown:false}}
            />

            <Stack.Screen
                name="NuevaAve"
                component={NuevaAveScreen}
            />

            <Stack.Screen
                name="DetalleAve"
                component={DetalleAveScreen}
            />

            <Stack.Screen
                name="EvolucionAve"
                component={EvolucionAveScreen}
            />

            <Stack.Screen
                name="SaludAve"
                component={SaludAveScreen}
            />

            <Stack.Screen
                name="FinalizarTratamiento"
                component={FinalizarTratamientoScreen}
            />

            <Stack.Screen
                name="BajaAve"
                component={BajaAveScreen}
            />

            <Stack.Screen
                name="RegistrarHuevo"
                component={RegistrarHuevoScreen}
            />

            <Stack.Screen
                name="CicloVidaAve"
                component={CicloVidaAveScreen}
                options={{ title: 'Ciclo de vida' }}
            />

            <Stack.Screen
                name="GenealogiaAve"
                component={GenealogiaAveScreen}
                options={{ title: 'Árbol genealógico' }}
            />

        </Stack.Navigator>

    );
}
