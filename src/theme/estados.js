import { colors } from './colors';

// Colores de tarjeta por estado (documents/ux/colores-estado.md). Solo presentación: el estado lo
// decide V1 y nunca el color solo; cada tarjeta repite el estado con icono + texto en un chip.
// Familias: neutro (estado normal o sano, no llama la atención), info (azul), advertencia (naranja)
// y peligro (rojo). Amarillo no se usa; el verde queda para el chip de estado positivo.
// Texto de la tarjeta: colors.text (>= 15,4:1) y colors.textSecondary (>= 6,4:1) sobre cada fondo.
export const coloresEstado = {
    neutro: { fondo: colors.surface, borde: colors.borderSoft, ancho: 1, franja: null },
    info: { fondo: '#EEF5FF', borde: colors.info, ancho: 2, franja: colors.info },
    advertencia: { fondo: '#FFF1E3', borde: colors.warningSolid, ancho: 2, franja: colors.warningSolid },
    peligro: { fondo: '#FFEEF0', borde: colors.danger, ancho: 2, franja: colors.danger }
};

// Devuelve el estilo de Tarjeta (fondo + borde) para un tono: 'neutro' | 'info' | 'advertencia' | 'peligro'.
export function estiloTarjetaEstado(tono) {
    const c = coloresEstado[tono] || coloresEstado.neutro;
    return { backgroundColor: c.fondo, borderColor: c.borde, borderWidth: c.ancho };
}

export function franjaEstado(tono) {
    return (coloresEstado[tono] || coloresEstado.neutro).franja;
}
