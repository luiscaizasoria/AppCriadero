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

import { opcionesPila, SIN_CABECERA } from './opcionesPila';
import { pantallasAve, pantallasJaula } from './pantallasCompartidas';


const Stack =
createNativeStackNavigator();



export default function MasStackNavigator(){

    return (

        <Stack.Navigator

            initialRouteName="MasMenu"

            screenOptions={opcionesPila('Más')}

        >


            <Stack.Screen

                name="MasMenu"

                component={
                    MasMenuScreen
                }

                options={SIN_CABECERA}

            />


            <Stack.Screen
                name="Configuracion"
                component={ConfiguracionScreen}
            />


            <Stack.Screen
                name="Catalogo"
                component={CatalogoScreen}
            />


            <Stack.Screen
                name="EditarCatalogoItem"
                component={EditarCatalogoItemScreen}
            />


            <Stack.Screen
                name="ProduccionHuevos"
                component={ProduccionHuevosScreen}
            />


            <Stack.Screen
                name="Clientes"
                component={ClientesScreen}
            />


            <Stack.Screen
                name="DetalleCliente"
                component={DetalleClienteScreen}
            />


            <Stack.Screen
                name="Reportes"
                component={ReportesScreen}
            />


            <Stack.Screen
                name="Backup"
                component={BackupScreen}
            />


            <Stack.Screen
                name="Alertas"
                component={AlertasScreen}
            />


            {pantallasAve(Stack)}

            {pantallasJaula(Stack)}


        </Stack.Navigator>

    );

}
