import * as FileSystem
    from 'expo-file-system/legacy';

import * as Sharing
    from 'expo-sharing';


export async function exportarCsv({
    nombre,
    filas
}) {

    const datos =
        Array.isArray(filas)
            ? filas
            : [];

    if(datos.length === 0){
        throw new Error(
            'SIN_DATOS_EXPORTAR'
        );
    }

    const columnas =
        obtenerColumnas(
            datos
        );

    const lineas = [
        columnas
            .map(escaparCsv)
            .join(';')
    ];

    for(const fila of datos){
        lineas.push(
            columnas
                .map(columna =>
                    escaparCsv(
                        normalizarValor(
                            fila?.[columna]
                        )
                    )
                )
                .join(';')
        );
    }

    const contenido =
        `\uFEFF${lineas.join('\r\n')}`;

    const fecha =
        new Date()
            .toISOString()
            .slice(0, 10)
            .replace(/-/g, '');

    const nombreSeguro =
        String(nombre || 'Exportacion')
            .replace(/[^a-zA-Z0-9_-]/g, '_');

    const uri =
        `${FileSystem.cacheDirectory}${nombreSeguro}_${fecha}.csv`;

    await FileSystem.writeAsStringAsync(
        uri,
        contenido,
        {
            encoding:
                FileSystem.EncodingType.UTF8
        }
    );

    const disponible =
        await Sharing.isAvailableAsync();

    if(!disponible){
        return uri;
    }

    await Sharing.shareAsync(
        uri,
        {
            mimeType:'text/csv',
            dialogTitle:`Compartir ${nombreSeguro}`,
            UTI:'public.comma-separated-values-text'
        }
    );

    return uri;

}


function obtenerColumnas(filas){
    const columnas = [];
    const existentes = new Set();

    for(const fila of filas){
        for(const key of Object.keys(fila || {})){
            if(!existentes.has(key)){
                existentes.add(key);
                columnas.push(key);
            }
        }
    }

    return columnas;
}


function normalizarValor(valor){
    if(valor === null || valor === undefined){
        return '';
    }

    if(typeof valor === 'number'){
        return String(valor).replace('.', ',');
    }

    return String(valor);
}


function escaparCsv(valor){
    const texto =
        String(valor ?? '');

    if(
        texto.includes(';')
        ||
        texto.includes('"')
        ||
        texto.includes('\n')
        ||
        texto.includes('\r')
    ){
        return `"${texto.replace(/"/g, '""')}"`;
    }

    return texto;
}
