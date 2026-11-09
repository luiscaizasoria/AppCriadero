// Tokens de color de la variante 1 «Pajarera tropical»
// (documents/ux/propuesta-visual-v2.md, secciones 1.1, 1.4 y 1.5).
// Regla: los acentos claros (turquesa) nunca son color de texto; solo fondo con texto oscuro
// o forma decorativa. El verde solo existe como color de estado (exito).
// Los pares de contraste de cada token se indican en la propuesta (peor punto >= 5,0:1 con blanco).
export const colors = {
    // Marca
    primary: '#6D3BD2', // blanco encima 6,6:1 (botones, pestaña activa, inicio del degradado)
    primaryDark: '#3F1D8F', // texto de énfasis y enlaces (9,8:1 sobre el peor fondo)
    primarySoft: '#EAE4F9', // primario al 14 % sobre blanco (chips, selección)
    secondary: '#C2188F', // fin del degradado de cabecera; blanco encima 5,5:1
    turquesa: '#19C3C9', // decoración y mascota; texto oscuro encima 8,0:1
    coral: '#CC312A', // botón flotante; blanco encima 5,2:1 (antes #D6362E, 4,7:1)
    turquesaProfundo: '#007782', // tarjeta «Fallecidas»; blanco 5,3:1 (antes #00808C, 4,7:1)

    // Fondos y superficies
    fondoA: '#FFE3EC',
    fondoB: '#EFE6FF', // el más oscuro de los tres (L = 0,82)
    fondoC: '#DDF6F7',
    background: '#EFE6FF', // color liso cuando no se usa el degradado
    surface: '#FFFFFF',
    surfaceAlt: '#F1ECFA',
    border: '#8A7FB0', // borde de campo: 3,7:1 sobre blanco (componente, mínimo 3:1)
    borderSoft: '#E4DDF5', // borde de 1 px de las tarjetas

    // Texto
    text: '#1B1636', // 17,3:1 sobre blanco, 14,4:1 sobre el peor fondo
    textSecondary: '#5A5278', // 7,2:1 sobre blanco, 6,0:1 sobre el peor fondo
    white: '#FFFFFF',

    // Estados (siempre icono + texto, nunca solo color)
    success: '#12803C', // blanco 5,0:1
    successText: '#0B5A2A', // sobre successSoft 7,4:1
    successSoft: '#DFF6E5',
    warning: '#E8780A',
    warningSolid: '#B45309', // tarjeta de contador «Advertencias:»; blanco 5,0:1
    warningText: '#8A3B00', // sobre warningSoft 6,7:1
    warningSoft: '#FFEBD6',
    danger: '#C0182B', // blanco 6,1:1
    dangerText: '#9B1220', // sobre dangerSoft 6,9:1
    dangerSoft: '#FDE3E6',
    info: '#1D5FB8',
    infoText: '#123F7A', // sobre infoSoft 8,8:1
    infoSoft: '#E0EDFF',

    // Botón deshabilitado (texto 5,1:1; antes #6B6780, 4,3:1)
    disabledBg: '#E6E3EE',
    disabledText: '#5F5B73',
    disabledBorder: '#B9B4CC',

    // Otros
    accent: '#19C3C9',
    accentText: '#1B1636',
    kinship: '#7B5EA7', // parentesco en Genealogía
    overlay: 'rgba(0,0,0,0.4)',

    // Degradados (máx. 2 por pantalla: fondo único + cabecera)
    gradienteCabecera: ['#6D3BD2', '#C2188F'],
    gradienteFondo: ['#FFE3EC', '#EFE6FF', '#DDF6F7']
};

// Colores de círculo de icono (c1 a c4) con el color del icono que garantiza contraste.
export const acentos = [
    { fondo: '#6D3BD2', icono: '#FFFFFF' },
    { fondo: '#19C3C9', icono: '#1B1636' },
    { fondo: '#007782', icono: '#FFFFFF' },
    { fondo: '#CC312A', icono: '#FFFFFF' },
    { fondo: '#C2188F', icono: '#FFFFFF' }
];
