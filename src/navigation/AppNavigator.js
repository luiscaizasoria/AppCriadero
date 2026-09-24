import React from 'react';

import {
    createBottomTabNavigator
} from '@react-navigation/bottom-tabs';

import {
    Ionicons
} from '@expo/vector-icons';

import InicioScreen
from '../screens/InicioScreen';

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



function crearListenerRutaInicial(
    tabName,
    screenName
){

    return ({
        navigation
    }) => ({

        tabPress: (
            event
        ) => {

            /*
                Evitamos que React Navigation
                simplemente reactive el estado anterior
                del Stack de la pestaña.
            */

            event.preventDefault();


            navigation.navigate(
                tabName,
                {
                    screen:
                        screenName
                }
            );

        }

    });

}



export default function AppNavigator(){

    return(

        <Tab.Navigator

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
                    InicioScreen
                }

            />



            <Tab.Screen

                name="Jaulas"

                component={
                    JaulasStackNavigator
                }

                listeners={
                    crearListenerRutaInicial(
                        'Jaulas',
                        'ListaJaulas'
                    )
                }

            />



            <Tab.Screen

                name="Aves"

                component={
                    AvesStackNavigator
                }

                listeners={
                    crearListenerRutaInicial(
                        'Aves',
                        'ListaAves'
                    )
                }

            />



            <Tab.Screen

                name="Finanzas"

                component={
                    FinanzasStackNavigator
                }

                listeners={
                    crearListenerRutaInicial(
                        'Finanzas',
                        'FinanzasInicio'
                    )
                }

            />



            <Tab.Screen

                name="Más"

                component={
                    MasStackNavigator
                }

                listeners={
                    crearListenerRutaInicial(
                        'Más',
                        'MasMenu'
                    )
                }

            />


        </Tab.Navigator>

    );

}