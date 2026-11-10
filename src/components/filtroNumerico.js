// Filtro de texto para campos de importe (solo presentación; no cambia la validación al guardar).
// Deja solo dígitos y un único separador decimal; la coma se convierte en punto.
export function filtrarDecimal(texto) {
    const limpio = String(texto ?? '')
        .replace(/,/g, '.')
        .replace(/[^0-9.]/g, '');
    const i = limpio.indexOf('.');
    if (i === -1) return limpio;
    return limpio.slice(0, i + 1) + limpio.slice(i + 1).replace(/\./g, '');
}

// Códigos fijos de categoría por tipo (V1) y los que se muestran en ambos tipos: los creados por el
// usuario (código que no pertenece a ninguna de las dos listas fijas).
export const CATEGORIAS_INGRESO = ['VENTA_AVE', 'VENTA_HUEVOS', 'OTRO'];
export const CATEGORIAS_EGRESO = ['ALIMENTO', 'MEDICAMENTO', 'INFRAESTRUCTURA', 'COMPRA_AVE', 'OTRO'];

export function categoriaVisible(codigo, tipo) {
    const fijas = tipo === 'INGRESO' ? CATEGORIAS_INGRESO : CATEGORIAS_EGRESO;
    if (fijas.includes(codigo)) return true;
    return !CATEGORIAS_INGRESO.includes(codigo) && !CATEGORIAS_EGRESO.includes(codigo);
}
