import React from 'react';

import NuevaAveScreen from '../screens/NuevaAveScreen';
import DetalleAveScreen from '../screens/DetalleAveScreen';
import EvolucionAveScreen from '../screens/EvolucionAveScreen';
import SaludAveScreen from '../screens/SaludAveScreen';
import FinalizarTratamientoScreen from '../screens/FinalizarTratamientoScreen';
import BajaAveScreen from '../screens/BajaAveScreen';
import RegistrarHuevoScreen from '../screens/RegistrarHuevoScreen';
import CicloVidaAveScreen from '../screens/CicloVidaAveScreen';
import GenealogiaAveScreen from '../screens/GenealogiaAveScreen';

import NuevaJaulaScreen from '../screens/NuevaJaulaScreen';
import DetalleJaulaScreen from '../screens/DetalleJaulaScreen';
import DetalleJaulaInactivaScreen from '../screens/DetalleJaulaInactivaScreen';
import SeleccionarAveJaulaScreen from '../screens/SeleccionarAveJaulaScreen';
import AlimentacionJaulaScreen from '../screens/AlimentacionJaulaScreen';
import BebidaJaulaScreen from '../screens/BebidaJaulaScreen';
import SanidadJaulaScreen from '../screens/SanidadJaulaScreen';
import HistorialJaulaScreen from '../screens/HistorialJaulaScreen';

import { idAve, idJaula } from './opcionesPila';

// Grupos de pantallas que se registran en varias pilas (Inicio, Jaulas, Aves, Más)
// para abrir fichas dentro de la misma pestaña y que "atrás" vuelva al origen.
// Se llaman como funciones dentro del navegador: {pantallasAve(Stack)}.

export function pantallasAve(Stack) {
    return (
        <>
            <Stack.Screen name="NuevaAve" component={NuevaAveScreen} />
            <Stack.Screen name="DetalleAve" component={DetalleAveScreen} getId={idAve} />
            <Stack.Screen name="EvolucionAve" component={EvolucionAveScreen} />
            <Stack.Screen name="SaludAve" component={SaludAveScreen} />
            <Stack.Screen name="FinalizarTratamiento" component={FinalizarTratamientoScreen} />
            <Stack.Screen name="BajaAve" component={BajaAveScreen} />
            <Stack.Screen name="RegistrarHuevo" component={RegistrarHuevoScreen} />
            <Stack.Screen name="CicloVidaAve" component={CicloVidaAveScreen} />
            <Stack.Screen name="GenealogiaAve" component={GenealogiaAveScreen} getId={idAve} />
        </>
    );
}

export function pantallasJaula(Stack) {
    return (
        <>
            <Stack.Screen name="NuevaJaula" component={NuevaJaulaScreen} />
            <Stack.Screen name="DetalleJaula" component={DetalleJaulaScreen} getId={idJaula} />
            <Stack.Screen name="DetalleJaulaInactiva" component={DetalleJaulaInactivaScreen} getId={idJaula} />
            <Stack.Screen name="SeleccionarAveJaula" component={SeleccionarAveJaulaScreen} />
            <Stack.Screen name="AlimentacionJaula" component={AlimentacionJaulaScreen} />
            <Stack.Screen name="BebidaJaula" component={BebidaJaulaScreen} />
            <Stack.Screen name="SanidadJaula" component={SanidadJaulaScreen} />
            <Stack.Screen name="HistorialJaula" component={HistorialJaulaScreen} />
        </>
    );
}
