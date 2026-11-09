import React from 'react';

import {
    createBottomTabNavigator
} from '@react-navigation/bottom-tabs';

import {
    Ionicons
} from '@expo/vector-icons';

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

import {
    COLORS
} from '../config/constants';



const Tab =
createBottomTabNavigator();



/*
    Comportamiento estándar de las pestañas (sin interceptar tabPress):
    - Cambiar de pestaña y volver restaura la pila donde estabas.
    - Tocar la pestaña activa vuelve a la raíz de su pila.
    - "Atrás" del teléfono vuelve a la pestaña anterior (backBehavior="history").
*/

export default function AppNavigator(){

    return(

        <Tab.Navigator

            backBehavior="history"

            screenOptions={({
                route
            })=>({

                headerShown:
                    false,


                tabBarActiveTintColor:
                    COLORS.primary,


                tabBarInactiveTintColor:
                    COLORS.textSecondary,


                tabBarStyle:{

                    height:
                        64,

                    paddingTop:
                        5,

                    paddingBottom:
                        7

                },


                tabBarLabelStyle:{

                    fontSize:
                        11,

                    fontWeight:
                        '600'

                },


                tabBarIcon:({
                    color,
                    size
                })=>{


                    let iconName =
                        'ellipse';


                    if(
                        route.name ===
                        'Inicio'
                    ){

                        iconName =
                            'home';

                    }
                    else if(
                        route.name ===
                        'Jaulas'
                    ){

                        iconName =
                            'grid';

                    }
                    else if(
                        route.name ===
                        'Aves'
                    ){

                        iconName =
                            'paw';

                    }
                    else if(
                        route.name ===
                        'Finanzas'
                    ){

                        iconName =
                            'cash';

                    }
                    else if(
                        route.name ===
                        'Más'
                    ){

                        iconName =
                            'settings';

                    }


                    return(

                        <Ionicons

                            name={
                                iconName
                            }

                            size={
                                size
                            }

                            color={
                                color
                            }

                        />

                    );

                }

            })}

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