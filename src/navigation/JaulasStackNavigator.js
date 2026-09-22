import React from 'react';

import {
    createNativeStackNavigator
} from '@react-navigation/native-stack';

import JaulasScreen
    from '../screens/JaulasScreen';

import NuevaJaulaScreen
    from '../screens/NuevaJaulaScreen';

import DetalleJaulaScreen
    from '../screens/DetalleJaulaScreen';

import DetalleJaulaInactivaScreen
    from '../screens/DetalleJaulaInactivaScreen';

import AlimentacionJaulaScreen
    from '../screens/AlimentacionJaulaScreen';

import BebidaJaulaScreen
    from '../screens/BebidaJaulaScreen';

import SanidadJaulaScreen
    from '../screens/SanidadJaulaScreen';

import HistorialJaulaScreen
    from '../screens/HistorialJaulaScreen';

import SeleccionarAveJaulaScreen
    from '../screens/SeleccionarAveJaulaScreen';

import {
    COLORS
} from '../config/constants';


const Stack =
    createNativeStackNavigator();


export default function JaulasStackNavigator() {

    return (

        <Stack.Navigator
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
                name="ListaJaulas"
                component={
                    JaulasScreen
                }
                options={{
                    headerShown:
                        false
                }}
            />

            <Stack.Screen
                name="NuevaJaula"
                component={
                    NuevaJaulaScreen
                }
                options={{
                    title:
                        'Nueva jaula'
                }}
            />

            <Stack.Screen
                name="DetalleJaula"
                component={
                    DetalleJaulaScreen
                }
                options={{
                    title:
                        'Detalle de jaula'
                }}
            />

            <Stack.Screen
                name="DetalleJaulaInactiva"
                component={
                    DetalleJaulaInactivaScreen
                }
                options={{
                    title:
                        'Historial de jaula'
                }}
            />

            <Stack.Screen
                name="SeleccionarAveJaula"
                component={
                    SeleccionarAveJaulaScreen
                }
                options={{
                    title:
                        'Agregar ave'
                }}
            />

            <Stack.Screen
                name="AlimentacionJaula"
                component={
                    AlimentacionJaulaScreen
                }
                options={{
                    title:
                        'Alimentación'
                }}
            />

            <Stack.Screen
                name="BebidaJaula"
                component={
                    BebidaJaulaScreen
                }
                options={{
                    title:
                        'Bebida'
                }}
            />

            <Stack.Screen
                name="SanidadJaula"
                component={
                    SanidadJaulaScreen
                }
                options={{
                    title:
                        'Sanidad'
                }}
            />

            <Stack.Screen
                name="HistorialJaula"
                component={
                    HistorialJaulaScreen
                }
                options={{
                    title:
                        'Historial'
                }}
            />

        </Stack.Navigator>

    );

}
