// Escala tipográfica (documents/ux/propuesta-visual-v2.md, sección 2).
// Fredoka: títulos, botones y cifras. Nunito: cuerpo. Los nombres de familia coinciden con los
// registrados en src/theme/fuentes.js. No se usa fontWeight: cada peso es su propia familia (con
// fontWeight Android sintetizaría negrita encima). Si las fuentes no cargan, la familia no existe
// y RN usa la fuente del sistema con los mismos tamaños.
export const fuentes = {
    titulo600: 'Fredoka_600SemiBold',
    titulo700: 'Fredoka_700Bold',
    cuerpo400: 'Nunito_400Regular',
    cuerpo600: 'Nunito_600SemiBold',
    cuerpo700: 'Nunito_700Bold'
};

export const typography = {
    cifra: { fontFamily: fuentes.titulo700, fontSize: 38, lineHeight: 42 },
    display: { fontFamily: fuentes.titulo700, fontSize: 30, lineHeight: 36 },
    titulo: { fontFamily: fuentes.titulo600, fontSize: 24, lineHeight: 30 },
    subtitulo: { fontFamily: fuentes.titulo600, fontSize: 18, lineHeight: 22 },
    boton: { fontFamily: fuentes.titulo600, fontSize: 19, lineHeight: 22 },
    cuerpo: { fontFamily: fuentes.cuerpo400, fontSize: 16, lineHeight: 23 },
    cuerpoFuerte: { fontFamily: fuentes.cuerpo700, fontSize: 16, lineHeight: 23 },
    etiqueta: { fontFamily: fuentes.cuerpo700, fontSize: 14, lineHeight: 18 },
    secundario: { fontFamily: fuentes.cuerpo600, fontSize: 14, lineHeight: 19 },
    chip: { fontFamily: fuentes.cuerpo700, fontSize: 13, lineHeight: 17 },
    pestana: { fontFamily: fuentes.cuerpo700, fontSize: 12.5, lineHeight: 16 },
    // Alias de C0 (siguen existiendo por compatibilidad)
    tituloTarjeta: { fontFamily: fuentes.titulo600, fontSize: 18, lineHeight: 22 },
    micro: { fontFamily: fuentes.cuerpo600, fontSize: 13, lineHeight: 17 }
};
