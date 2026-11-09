import React from 'react';
import { StackActions } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import PantallaHeader from '../components/PantallaHeader';
import BarraEstado from '../components/BarraEstado';
import { tituloRuta } from './titulos';
import { useContextos } from './contextoPantalla';

// Cabecera única de las pilas: flecha "atrás", migas tocables ("Aves › A-12") y título.
// La primera miga es la sección (pestaña) y lleva a la raíz de la pila; las demás
// son las pantallas anteriores de la pila y cada una vuelve a esa pantalla.
export default function CabeceraPila({ navigation, route, options, seccion }) {
    const insets = useSafeAreaInsets();
    const contextos = useContextos();

    const rutas = navigation.getState().routes;
    const indice = Math.max(0, rutas.findIndex(r => r.key === route.key));

    const migas = rutas.slice(0, indice).map((r, i) => ({
        texto: i === 0
            ? seccion
            : (contextos.get(r.key) || tituloRuta(r.name, r.params)),
        onPress: () => navigation.dispatch(StackActions.pop(indice - i))
    }));

    const titulo = (options && options.title) || tituloRuta(route.name, route.params);

    return (
        <>
            <BarraEstado estilo="light" navigation={navigation} />
            <PantallaHeader
                titulo={titulo}
                migas={migas}
                onAtras={indice > 0 ? () => navigation.goBack() : undefined}
                insetSuperior={insets.top}
                testID="cabecera"
            />
        </>
    );
}
