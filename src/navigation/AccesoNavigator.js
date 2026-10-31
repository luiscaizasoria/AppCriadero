import React from 'react';

import {
    createNativeStackNavigator
} from '@react-navigation/native-stack';

import LoginScreen
from '../screens/acceso/LoginScreen';

import RegistroScreen
from '../screens/acceso/RegistroScreen';

import SeleccionCriaderoScreen
from '../screens/acceso/SeleccionCriaderoScreen';


const Stack =
    createNativeStackNavigator();


/**
 * Flujo de acceso del modo API: inicio de sesion o registro y, con la
 * sesion iniciada, seleccion o creacion del criadero. Solo se muestra
 * cuando la app usa la API y falta la sesion o el criadero.
 */
export default function AccesoNavigator({
    autenticado
}) {

    return (

        <Stack.Navigator
            screenOptions={{
                headerShown: false
            }}
        >

            {
                autenticado
                    ? (

                        <Stack.Screen
                            name="SeleccionCriadero"
                            component={SeleccionCriaderoScreen}
                        />

                    )
                    : (

                        <>

                            <Stack.Screen
                                name="Login"
                                component={LoginScreen}
                            />

                            <Stack.Screen
                                name="Registro"
                                component={RegistroScreen}
                            />

                        </>

                    )
            }

        </Stack.Navigator>

    );

}
