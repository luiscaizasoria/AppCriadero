import React from 'react';

import {
    createBottomTabNavigator
} from '@react-navigation/bottom-tabs';

import InicioStackNavigator
from './InicioStackNavigator';

import JaulasStackNavigator
from './JaulasStackNavigator';

import AvesStackNavigator
from './AvesStackNavigator';

import FinanzasStackNavigator
from './FinanzasStackNavigator';

import MasStackNavigator
from './MasStackNavigator';

import BarraPestanas
from './BarraPestanas';



const Tab =
createBottomTabNavigator();



/*
    Comportamiento estándar de las pestañas (sin interceptar tabPress):
    - Cambiar de pestaña y volver restaura la pila donde estabas.
    - Tocar la pestaña activa vuelve a la raíz de su pila.
    - "Atrás" del teléfono vuelve a la pestaña anterior (backBehavior="history").

    La barra inferior es BarraPestanas (ancho completo, mínimo 64 de alto, cinco pestañas
    iguales, cápsula en la activa e insignia de alertas pendientes en Más).
*/

export default function AppNavigator(){

    return(

        <Tab.Navigator

            backBehavior="history"

            tabBar={
                props => <BarraPestanas {...props} />
            }

            screenOptions={{

                headerShown:
                    false

            }}

        >


            <Tab.Screen

                name="Inicio"

                component={
                    InicioStackNavigator
                }

            />



            <Tab.Screen

                name="Jaulas"

                component={
                    JaulasStackNavigator
                }

            />



            <Tab.Screen

                name="Aves"

                component={
                    AvesStackNavigator
                }

            />



            <Tab.Screen

                name="Finanzas"

                component={
                    FinanzasStackNavigator
                }

            />



            <Tab.Screen

                name="Más"

                component={
                    MasStackNavigator
                }

            />


        </Tab.Navigator>

    );

}
