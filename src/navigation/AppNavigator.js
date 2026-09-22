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





export default function AppNavigator(){


    return(


        <Tab.Navigator


            screenOptions={({route})=>({


                headerShown:false,


                tabBarActiveTintColor:
                    COLORS.primary,


                tabBarInactiveTintColor:
                    COLORS.textSecondary,


                tabBarStyle:{

                    height:64,

                    paddingTop:5,

                    paddingBottom:7

                },


                tabBarLabelStyle:{

                    fontSize:11,

                    fontWeight:'600'

                },



                tabBarIcon:({

                    color,

                    size

                })=>{


                    let iconName =
                        'ellipse';




                    if(route.name === 'Inicio'){

                        iconName =
                            'home';

                    }

                    else if(route.name === 'Jaulas'){

                        iconName =
                            'grid';

                    }

                    else if(route.name === 'Aves'){

                        iconName =
                            'paw';

                    }

                    else if(route.name === 'Finanzas'){

                        iconName =
                            'cash';

                    }

                    else if(route.name === 'Más'){

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


                options={{

                    unmountOnBlur:true

                }}

            />







            <Tab.Screen

                name="Aves"

                component={
                    AvesStackNavigator
                }


                options={{

                    unmountOnBlur:true

                }}

            />







            <Tab.Screen

                name="Finanzas"

                component={
                    FinanzasStackNavigator
                }


                options={{

                    unmountOnBlur:true

                }}

            />







            <Tab.Screen

                name="Más"

                component={
                    MasStackNavigator
                }


                options={{

                    unmountOnBlur:true

                }}

            />




        </Tab.Navigator>


    );

}