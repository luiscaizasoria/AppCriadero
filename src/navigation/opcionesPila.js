import React from 'react';
import CabeceraPila from './CabeceraPila';

// screenOptions comunes de las pilas: cabecera única con migas.
// Las raíces (lista/menú/inicio) llevan headerShown:false y su propio título en el cuerpo.
export function opcionesPila(seccion) {
    return {
        header: props => <CabeceraPila {...props} seccion={seccion} />
    };
}

export const SIN_CABECERA = { headerShown: false };

// Evita duplicar fichas en la pila: navegar a una ficha ya abierta (mismo id) la trae al frente.
export const idAve = ({ params }) =>
    params && params.aveId !== undefined && params.aveId !== null
        ? String(params.aveId)
        : undefined;

export const idJaula = ({ params }) =>
    params && params.jaulaId !== undefined && params.jaulaId !== null
        ? String(params.jaulaId)
        : undefined;
