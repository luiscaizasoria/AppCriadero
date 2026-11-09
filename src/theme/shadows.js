// Sombras con tinte del color primario. Elevación SOLO en tarjetas de resumen, botón flotante,
// barra inferior de pestañas y barra fija de «Guardar» (propuesta §8). Sin sombra por fila.
export const shadows = {
    none: {},
    resumen: {
        shadowColor: '#6D3BD2',
        shadowOpacity: 0.25,
        shadowRadius: 8,
        shadowOffset: { width: 0, height: 4 },
        elevation: 3
    },
    flotante: {
        shadowColor: '#6D3BD2',
        shadowOpacity: 0.35,
        shadowRadius: 12,
        shadowOffset: { width: 0, height: 6 },
        elevation: 8
    },
    barra: {
        shadowColor: '#6D3BD2',
        shadowOpacity: 0.3,
        shadowRadius: 10,
        shadowOffset: { width: 0, height: -3 },
        elevation: 8
    }
};
