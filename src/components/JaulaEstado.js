import { colors } from '../theme';

// Estado sanitario de la jaula presentado con el tema. Mismos estados y textos que V1
// (`JAULA_SANITARY_STATUS_STYLES` de config/constants: Normal, Limpieza, Fumigación, Quemadura,
// Cuarentena; cualquier otro valor o vacío cae en Normal). Cada estado conserva su "familia" de
// color (Normal éxito, Limpieza información, Fumigación advertencia, Quemadura y Cuarentena error);
// el texto del chip usa los pares *Text/*Soft del tema (contraste >= 4,5:1) y el color nunca va
// solo: cada estado lleva un icono distinto.
const MAPA = {
    NORMAL: { label: 'Normal', tono: 'exito', icono: 'checkmark-circle', franja: colors.success },
    LIMPIEZA: { label: 'Limpieza', tono: 'info', icono: 'sparkles', franja: colors.info },
    FUMIGACION: { label: 'Fumigación', tono: 'advertencia', icono: 'cloud', franja: colors.warning },
    QUEMADURA: { label: 'Quemadura', tono: 'peligro', icono: 'flame', franja: colors.danger },
    CUARENTENA: { label: 'Cuarentena', tono: 'peligro', icono: 'ban', franja: colors.danger }
};

export function estadoSanitarioJaula(estado) {
    const clave = String(estado || 'NORMAL').trim().toUpperCase();
    return { ...(MAPA[clave] || MAPA.NORMAL) };
}

// Iconos de los tipos de sanidad que se eligen en SanidadJaulaScreen (texto del tipo -> icono).
export const ICONO_TIPO_SANIDAD = {
    Normal: 'checkmark-circle-outline',
    Limpieza: 'sparkles-outline',
    Fumigación: 'cloud-outline',
    Quemadura: 'flame-outline',
    Cuarentena: 'ban-outline'
};
