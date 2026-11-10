import { getJaulaSanitaryStatusStyle } from '../config/constants';
import { colors } from '../theme';

// Estado sanitario de la jaula presentado con el tema. CONSERVA el significado de V1
// (`getJaulaSanitaryStatusStyle`): el texto sale de allí y cada estado conserva su "familia" de color
// (Normal éxito, Limpieza información, Fumigación advertencia, Quemadura y Cuarentena error);
// el color nunca va solo: cada estado lleva un icono distinto.
const MAPA = {
    NORMAL: { tono: 'exito', icono: 'checkmark-circle', franja: colors.success },
    LIMPIEZA: { tono: 'info', icono: 'sparkles', franja: colors.info },
    FUMIGACION: { tono: 'advertencia', icono: 'cloud', franja: colors.warning },
    QUEMADURA: { tono: 'peligro', icono: 'flame', franja: colors.danger },
    CUARENTENA: { tono: 'peligro', icono: 'ban', franja: colors.danger }
};

export function estadoSanitarioJaula(estado) {
    const clave = String(estado || 'NORMAL').trim().toUpperCase();
    const base = MAPA[clave] || MAPA.NORMAL;
    return { ...base, label: getJaulaSanitaryStatusStyle(estado).label };
}

// Iconos de los tipos de sanidad que se eligen en SanidadJaulaScreen (texto del tipo -> icono).
export const ICONO_TIPO_SANIDAD = {
    Normal: 'checkmark-circle-outline',
    Limpieza: 'sparkles-outline',
    Fumigación: 'cloud-outline',
    Quemadura: 'flame-outline',
    Cuarentena: 'ban-outline'
};
