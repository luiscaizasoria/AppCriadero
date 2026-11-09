import React, { useEffect, useState } from 'react';
import { StatusBar } from 'expo-status-bar';

// Barra de estado del sistema solo mientras la pantalla está enfocada (así una pantalla con
// cabecera violeta, de estilo "light", no deja la barra clara sobre un fondo claro al cambiar
// de pestaña). `estilo`: "light" (iconos blancos, sobre degradado violeta/fucsia) o "dark".
// Uso: <BarraEstado estilo="light" navigation={navigation} />
export default function BarraEstado({ estilo = 'light', navigation }) {
    const [enfocada, setEnfocada] = useState(() =>
        navigation && navigation.isFocused ? navigation.isFocused() : true
    );

    useEffect(() => {
        if (!navigation || !navigation.addListener) return undefined;
        setEnfocada(navigation.isFocused());
        const alEnfocar = navigation.addListener('focus', () => setEnfocada(true));
        const alDesenfocar = navigation.addListener('blur', () => setEnfocada(false));
        return () => {
            alEnfocar();
            alDesenfocar();
        };
    }, [navigation]);

    return enfocada ? <StatusBar style={estilo} /> : null;
}
