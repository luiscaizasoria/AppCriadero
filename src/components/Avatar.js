import React from 'react';
import IconoCirculo from './IconoCirculo';

// Avatar de 56 px (72 en fichas) con borde blanco de 3 px. Es un IconoCirculo con borde.
// Uso: <Avatar icono="paw" indice={2} />
export default function Avatar({ icono = 'aves', tamano = 56, ...resto }) {
    return <IconoCirculo icono={icono} tamano={tamano} borde {...resto} />;
}
