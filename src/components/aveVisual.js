import { colors } from '../theme';

// Presentación de las aves (C4-Aves). Solo mapea valores ya existentes a texto, icono y tono;
// no calcula ni decide nada de negocio. El color nunca es el único canal: siempre hay icono + texto.

// Estado de salud -> chip (texto, tono de Chip, icono)
export function visualSalud(estado) {
    if (estado === 'EN_TRATAMIENTO') {
        return { texto: 'En tratamiento', tono: 'advertencia', icono: 'medkit' };
    }
    if (estado === 'ENFERMA') {
        return { texto: 'Enferma', tono: 'peligro', icono: 'alert-circle' };
    }
    return { texto: 'Sana', tono: 'exito', icono: 'checkmark-circle' };
}

// Sexo -> texto e icono (el texto Macho/Hembra se mantiene)
export function visualSexo(sexo) {
    if (sexo === 'MACHO') return { texto: 'Macho', icono: 'male-outline' };
    if (sexo === 'HEMBRA') return { texto: 'Hembra', icono: 'female-outline' };
    return { texto: 'Sexo sin registrar', icono: 'help-circle-outline' };
}

// Estado del ave -> chip
export function visualEstadoAve(estado) {
    if (estado === 'VENDIDA') return { texto: 'Vendida', tono: 'info', icono: 'cart-outline' };
    if (estado === 'FALLECIDA') return { texto: 'Fallecida', tono: 'neutro', icono: 'skull-outline' };
    return { texto: 'Activa', tono: 'primario', icono: 'paw-outline' };
}

// Color del círculo del avatar sin foto: sexo si está activa; estado si no.
// Devuelve props de Avatar (indice de la paleta o color liso con icono blanco).
export function propsAvatar(ave) {
    if (ave.estado === 'VENDIDA') return { indice: 2 };
    if (ave.estado === 'FALLECIDA') return { color: colors.textSecondary };
    if (ave.sexo === 'MACHO') return { indice: 0 };
    if (ave.sexo === 'HEMBRA') return { indice: 4 };
    return { indice: 1 };
}
