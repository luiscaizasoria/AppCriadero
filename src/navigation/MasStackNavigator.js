import React from 'react';

import {
    createNativeStackNavigator
} from '@react-navigation/native-stack';


import MasMenuScreen
from '../screens/MasMenuScreen';

import ConfiguracionScreen
from '../screens/ConfiguracionScreen';

import CatalogoScreen
from '../screens/CatalogoScreen';

import EditarCatalogoItemScreen
from '../screens/EditarCatalogoItemScreen';

import ProduccionHuevosScreen
from '../screens/ProduccionHuevosScreen';

import ClientesScreen
from '../screens/ClientesScreen';

import DetalleClienteScreen
from '../screens/DetalleClienteScreen';

import ReportesScreen
from '../screens/ReportesScreen';

import BackupScreen
from '../screens/BackupScreen';

import AlertasScreen
from '../screens/AlertasScreen';


import {
    COLORS
} from '../config/constants';


const Stack =
createNativeStackNavigator();



export default function MasStackNavigator(){

    return (

        <Stack.Navigator

            initialRouteName="MasMenu"

            screenOptions={{

                headerTintColor:
                    COLORS.primary

            }}

        >


            <Stack.Screen

                name="MasMenu"

                component={
                    MasMenuScreen
                }

                options={{

                    headerShown:false

                }}

            />


            <Stack.Screen

                name="Configuracion"

                component={
                    ConfiguracionScreen
                }

                options={{

                    title:
                        'Configuración'

                }}

            />


            <Stack.Screen

                name="Catalogo"

                component={
                    CatalogoScreen
                }

                options={({route})=>({

                    title:
                        route.params?.titulo
                        ||
                        'Catálogo'

                })}

            />


            <Stack.Screen

                name="EditarCatalogoItem"

                component={
                    EditarCatalogoItemScreen
                }

                options={{

                    title:
                        'Elemento'

                }}

            />


            <Stack.Screen

                name="ProduccionHuevos"

                component={
                    ProduccionHuevosScreen
                }

                options={{

                    title:
                        'Producción de huevos'

                }}

            />


            <Stack.Screen

                name="Clientes"

                component={
                    ClientesScreen
                }

                options={{

                    title:
                        'Clientes'

                }}

            />


            <Stack.Screen

                name="DetalleCliente"

                component={
                    DetalleClienteScreen
                }

                options={{

                    title:
                        'Detalle del cliente'

                }}

            />


            <Stack.Screen

                name="Reportes"

                component={
                    ReportesScreen
                }

                options={{

                    title:
                        'Reportes'

                }}

            />


            <Stack.Screen

                name="Backup"

                component={
                    BackupScreen
                }

                options={{

                    title:
                        'Respaldo'

                }}

            />


            <Stack.Screen

                name="Alertas"

                component={
                    AlertasScreen
                }

                options={{

                    title:
                        'Alertas'

                }}

            />


        </Stack.Navigator>

    );

}
