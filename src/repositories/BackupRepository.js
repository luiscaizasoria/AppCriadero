import * as FileSystem
from 'expo-file-system/legacy';

import * as Sharing
from 'expo-sharing';

import * as DocumentPicker
from 'expo-document-picker';

import {
    getDatabase
} from '../database/database';



const StorageAccessFramework =
    FileSystem.StorageAccessFramework;


const MEDIA_INICIO =
    '-- KIKIRIKIS_MEDIA_BEGIN';


const MEDIA_FIN =
    '-- KIKIRIKIS_MEDIA_END';





function logBackup(
    paso,
    data = null
){

    if(
        data === null ||
        data === undefined
    ){

        console.log(
            `[BACKUP] ${paso}`
        );

        return;

    }


    console.log(
        `[BACKUP] ${paso}`,
        data
    );

}





function logBackupError(
    paso,
    error
){

    console.error(
        `[BACKUP][ERROR] ${paso}`,
        {
            message:
                error?.message,

            name:
                error?.name,

            stack:
                error?.stack,

            error
        }
    );

}





function validarFuncion(
    nombre,
    funcion
){

    const tipo =
        typeof funcion;


    logBackup(
        `Validando función ${nombre}`,
        tipo
    );


    if(
        tipo !== 'function'
    ){

        throw new Error(
            `FUNCION_NO_DISPONIBLE:${nombre}:${tipo}`
        );

    }

}





function formatearFechaArchivo(
    fecha = new Date()
){

    const yyyy =
        String(
            fecha.getFullYear()
        );


    const mm =
        String(
            fecha.getMonth() + 1
        )
        .padStart(
            2,
            '0'
        );


    const dd =
        String(
            fecha.getDate()
        )
        .padStart(
            2,
            '0'
        );


    const hh =
        String(
            fecha.getHours()
        )
        .padStart(
            2,
            '0'
        );


    const mi =
        String(
            fecha.getMinutes()
        )
        .padStart(
            2,
            '0'
        );


    const ss =
        String(
            fecha.getSeconds()
        )
        .padStart(
            2,
            '0'
        );


    return (
        `${yyyy}${mm}${dd}_${hh}${mi}${ss}`
    );

}





function convertirValorSql(
    valor
){

    if(
        valor === null ||
        valor === undefined
    ){

        return 'NULL';

    }


    if(
        typeof valor === 'number'
    ){

        return (
            Number.isFinite(
                valor
            )
            ?
            String(
                valor
            )
            :
            'NULL'
        );

    }


    if(
        typeof valor === 'boolean'
    ){

        return (
            valor
            ?
            '1'
            :
            '0'
        );

    }


    return (
        `'${String(valor)
            .replace(
                /'/g,
                "''"
            )}'`
    );

}





function escaparNombreSql(
    nombre
){

    return String(
        nombre
    )
    .replace(
        /"/g,
        '""'
    );

}





function obtenerExtensionImagen(
    uri
){

    const limpio =
        String(
            uri || ''
        )
        .split('?')[0];


    const match =
        limpio.match(
            /\.([a-zA-Z0-9]+)$/
        );


    if(
        !match
    ){

        return 'jpg';

    }


    const extension =
        match[1]
        .toLowerCase();


    const permitidas = [
        'jpg',
        'jpeg',
        'png',
        'webp'
    ];


    return (
        permitidas.includes(
            extension
        )
        ?
        extension
        :
        'jpg'
    );

}





function obtenerMimeImagen(
    extension
){

    switch(
        String(
            extension || ''
        )
        .toLowerCase()
    ){

        case 'png':
            return 'image/png';


        case 'webp':
            return 'image/webp';


        case 'jpeg':
        case 'jpg':
        default:
            return 'image/jpeg';

    }

}





function generarMediaKey(
    indice,
    extension
){

    return (
        `media_${Date.now()}_${indice}_` +
        `${Math.random()
            .toString(36)
            .substring(2, 8)}` +
        `.${extension}`
    );

}





async function obtenerTablasUsuario(
    db
){

    logBackup(
        'Consultando tablas de usuario'
    );


    validarFuncion(
        'db.getAllAsync',
        db?.getAllAsync
    );


    const tablas =
        await db.getAllAsync(
            `
            SELECT
                name

            FROM sqlite_master

            WHERE
                type = 'table'

            AND name NOT LIKE 'sqlite_%'

            AND name <> 'android_metadata'

            ORDER BY
                name
            `
        );


    logBackup(
        'Tablas encontradas',
        tablas.map(
            item =>
                item.name
        )
    );


    return tablas.map(
        item =>
            item.name
    );

}





async function generarSqlRespaldo(
    db
){

    logBackup(
        'Iniciando generación SQL'
    );


    const tablas =
        await obtenerTablasUsuario(
            db
        );


    const bloques = [

        'PRAGMA foreign_keys = OFF;',

        'BEGIN TRANSACTION;'

    ];



    for(
        const tabla
        of tablas
    ){

        const tablaSegura =
            escaparNombreSql(
                tabla
            );


        logBackup(
            `Procesando tabla ${tabla}`
        );


        const columnasInfo =
            await db.getAllAsync(
                `
                PRAGMA table_info(
                    "${tablaSegura}"
                )
                `
            );


        const columnas =
            columnasInfo.map(
                columna =>
                    columna.name
            );


        if(
            columnas.length === 0
        ){

            continue;

        }


        const filas =
            await db.getAllAsync(
                `
                SELECT
                    *

                FROM "${tablaSegura}"
                `
            );


        logBackup(
            `Filas ${tabla}`,
            filas.length
        );


        bloques.push(
            `DELETE FROM "${tablaSegura}";`
        );


        for(
            const fila
            of filas
        ){

            const columnasSql =
                columnas
                .map(
                    columna =>
                        `"${escaparNombreSql(columna)}"`
                )
                .join(
                    ', '
                );


            const valoresSql =
                columnas
                .map(
                    columna =>
                        convertirValorSql(
                            fila[columna]
                        )
                )
                .join(
                    ', '
                );


            bloques.push(
                `INSERT INTO "${tablaSegura}" (${columnasSql}) VALUES (${valoresSql});`
            );

        }

    }


    bloques.push(
        'COMMIT;'
    );


    bloques.push(
        'PRAGMA foreign_keys = ON;'
    );


    const resultado =
        bloques.join(
            '\n'
        );


    logBackup(
        'SQL generado correctamente',
        {
            longitud:
                resultado.length,

            tablas:
                tablas.length
        }
    );


    return resultado;

}





async function obtenerReferenciasImagenes(
    db
){

    const referencias =
        [];


    const aves =
        await db.getAllAsync(
            `
            SELECT
                id,
                codigo,
                foto_uri

            FROM aves

            WHERE foto_uri IS NOT NULL

            AND TRIM(foto_uri) <> ''
            `
        );


    for(
        const ave
        of aves
    ){

        referencias.push({

            tabla:
                'aves',

            id:
                ave.id,

            codigoAve:
                ave.codigo,

            uri:
                ave.foto_uri

        });

    }



    const evoluciones =
        await db.getAllAsync(
            `
            SELECT
                e.id,
                e.ave_id,
                e.foto_uri,
                a.codigo AS codigo_ave

            FROM ave_evolucion e

            LEFT JOIN aves a
                ON a.id = e.ave_id

            WHERE e.foto_uri IS NOT NULL

            AND TRIM(e.foto_uri) <> ''
            `
        );


    for(
        const evolucion
        of evoluciones
    ){

        referencias.push({

            tabla:
                'ave_evolucion',

            id:
                evolucion.id,

            aveId:
                evolucion.ave_id,

            codigoAve:
                evolucion.codigo_ave,

            uri:
                evolucion.foto_uri

        });

    }


    return referencias;

}





async function generarManifestImagenes(
    db
){

    logBackup(
        'Iniciando respaldo de imágenes'
    );


    const referencias =
        await obtenerReferenciasImagenes(
            db
        );


    const porUri =
        new Map();


    for(
        const referencia
        of referencias
    ){

        const uri =
            referencia.uri;


        if(
            !porUri.has(
                uri
            )
        ){

            porUri.set(
                uri,
                {
                    uri,
                    referencias:[]
                }
            );

        }


        porUri
            .get(
                uri
            )
            .referencias
            .push({

                tabla:
                    referencia.tabla,

                id:
                    referencia.id,

                aveId:
                    referencia.aveId || null,

                codigoAve:
                    referencia.codigoAve || null

            });

    }



    const imagenes =
        [];


    let indice =
        0;


    for(
        const item
        of porUri.values()
    ){

        indice += 1;


        try{


            const info =
                await FileSystem
                    .getInfoAsync(
                        item.uri
                    );


            if(
                !info?.exists
            ){

                console.warn(
                    '[BACKUP] Imagen no encontrada, se omite:',
                    item.uri
                );

                continue;

            }


            const base64 =
                await FileSystem
                    .readAsStringAsync(
                        item.uri,
                        {
                            encoding:
                                FileSystem
                                    .EncodingType
                                    .Base64
                        }
                    );


            if(
                !base64
            ){

                console.warn(
                    '[BACKUP] Imagen vacía, se omite:',
                    item.uri
                );

                continue;

            }


            const extension =
                obtenerExtensionImagen(
                    item.uri
                );


            const mediaKey =
                generarMediaKey(
                    indice,
                    extension
                );


            imagenes.push({

                key:
                    mediaKey,

                extension,

                mimeType:
                    obtenerMimeImagen(
                        extension
                    ),

                referencias:
                    item.referencias,

                data:
                    base64

            });


            logBackup(
                'Imagen agregada al respaldo',
                {
                    key:
                        mediaKey,

                    referencias:
                        item.referencias.length,

                    bytesBase64:
                        base64.length
                }
            );


        }
        catch(error){


            console.warn(
                '[BACKUP] No fue posible respaldar imagen:',
                {
                    uri:
                        item.uri,

                    error:
                        error?.message
                }
            );


        }

    }



    const manifest = {

        version:
            1,

        fecha:
            new Date()
                .toISOString(),

        cantidad:
            imagenes.length,

        imagenes

    };


    logBackup(
        'Respaldo de imágenes preparado',
        {
            referencias:
                referencias.length,

            imagenesUnicas:
                imagenes.length
        }
    );


    return manifest;

}





function agregarManifestAlSql(
    contenidoSql,
    manifest
){

    if(
        !manifest ||
        !Array.isArray(
            manifest.imagenes
        ) ||
        manifest.imagenes.length === 0
    ){

        return contenidoSql;

    }


    const json =
        JSON.stringify(
            manifest
        );


    return (
        `${contenidoSql}\n\n` +
        `${MEDIA_INICIO}\n` +
        `-- ${json}\n` +
        `${MEDIA_FIN}\n`
    );

}





function extraerManifestDelRespaldo(
    contenido
){

    const indiceInicio =
        contenido.indexOf(
            MEDIA_INICIO
        );


    const indiceFin =
        contenido.indexOf(
            MEDIA_FIN
        );


    if(
        indiceInicio < 0 ||
        indiceFin < 0 ||
        indiceFin <= indiceInicio
    ){

        return {

            sql:
                contenido,

            manifest:
                null

        };

    }


    const inicioContenido =
        indiceInicio +
        MEDIA_INICIO.length;


    let bloqueManifest =
        contenido
            .substring(
                inicioContenido,
                indiceFin
            )
            .trim();


    bloqueManifest =
        bloqueManifest
            .split('\n')
            .map(
                linea => {

                    const limpia =
                        linea.trim();


                    if(
                        limpia.startsWith(
                            '--'
                        )
                    ){

                        return limpia
                            .substring(
                                2
                            )
                            .trim();

                    }


                    return limpia;

                }
            )
            .join(
                ''
            );


    let manifest =
        null;


    try{


        manifest =
            JSON.parse(
                bloqueManifest
            );


        logBackup(
            'Manifest de imágenes encontrado',
            {
                version:
                    manifest?.version,

                cantidad:
                    manifest?.imagenes?.length || 0
            }
        );


    }
    catch(error){


        logBackupError(
            'No se pudo interpretar manifest de imágenes',
            error
        );


        throw new Error(
            'MANIFEST_IMAGENES_INVALIDO'
        );


    }



    const sql =
        (
            contenido.substring(
                0,
                indiceInicio
            )
            +
            contenido.substring(
                indiceFin +
                MEDIA_FIN.length
            )
        )
        .trim();


    return {

        sql,

        manifest

    };

}





async function seleccionarCarpetaDestino(){

    if(
        !StorageAccessFramework
    ){

        throw new Error(
            'STORAGE_ACCESS_FRAMEWORK_NO_DISPONIBLE'
        );

    }


    validarFuncion(
        'StorageAccessFramework.requestDirectoryPermissionsAsync',
        StorageAccessFramework
            .requestDirectoryPermissionsAsync
    );


    logBackup(
        'Solicitando carpeta al usuario'
    );


    const permiso =
        await StorageAccessFramework
            .requestDirectoryPermissionsAsync();


    if(
        !permiso?.granted
    ){

        throw new Error(
            'OPERACION_CANCELADA'
        );

    }


    if(
        !permiso?.directoryUri
    ){

        throw new Error(
            'DIRECTORIO_NO_RECIBIDO'
        );

    }


    return permiso.directoryUri;

}





async function crearArchivoDestino(
    directoryUri,
    nombreArchivo
){

    validarFuncion(
        'StorageAccessFramework.createFileAsync',
        StorageAccessFramework
            ?.createFileAsync
    );


    const archivoUri =
        await StorageAccessFramework
            .createFileAsync(
                directoryUri,
                nombreArchivo,
                'text/plain'
            );


    if(
        !archivoUri
    ){

        throw new Error(
            'ARCHIVO_DESTINO_NO_CREADO'
        );

    }


    return archivoUri;

}





async function escribirRespaldo(
    archivoUri,
    contenido
){

    validarFuncion(
        'FileSystem.writeAsStringAsync',
        FileSystem
            ?.writeAsStringAsync
    );


    await FileSystem
        .writeAsStringAsync(
            archivoUri,
            contenido,
            {
                encoding:
                    FileSystem
                        .EncodingType
                        .UTF8
            }
        );


    const verificacion =
        await FileSystem
            .readAsStringAsync(
                archivoUri,
                {
                    encoding:
                        FileSystem
                            .EncodingType
                            .UTF8
                }
            );


    if(
        !verificacion ||
        verificacion.length === 0
    ){

        throw new Error(
            'RESPALDO_GENERADO_VACIO'
        );

    }


    logBackup(
        'Respaldo verificado',
        {
            longitud:
                verificacion.length
        }
    );

}





async function generarContenidoBackup(){

    const db =
        await getDatabase();


    const sql =
        await generarSqlRespaldo(
            db
        );


    const manifest =
        await generarManifestImagenes(
            db
        );


    return agregarManifestAlSql(
        sql,
        manifest
    );

}





export async function crearBackup(){

    logBackup(
        '===== INICIO CREAR BACKUP ====='
    );


    try{


        validarFuncion(
            'getDatabase',
            getDatabase
        );


        const contenido =
            await generarContenidoBackup();


        const directoryUri =
            await seleccionarCarpetaDestino();


        const nombreArchivo =
            `respaldo_criadero_kikirikis_${formatearFechaArchivo()}.sql`;


        const archivoUri =
            await crearArchivoDestino(
                directoryUri,
                nombreArchivo
            );


        await escribirRespaldo(
            archivoUri,
            contenido
        );


        logBackup(
            'Respaldo guardado correctamente',
            {
                uri:
                    archivoUri,

                longitud:
                    contenido.length
            }
        );


        logBackup(
            '===== FIN CREAR BACKUP OK ====='
        );


        return archivoUri;


    }
    catch(error){


        logBackupError(
            'crearBackup',
            error
        );


        throw error;


    }

}





async function crearBackupTemporal(){

    logBackup(
        'Creando respaldo temporal para compartir'
    );


    if(
        !FileSystem.cacheDirectory
    ){

        throw new Error(
            'CACHE_NO_DISPONIBLE'
        );

    }


    const contenido =
        await generarContenidoBackup();


    const ruta =
        `${FileSystem.cacheDirectory}` +
        `respaldo_criadero_kikirikis_` +
        `${formatearFechaArchivo()}.sql`;


    await FileSystem
        .writeAsStringAsync(
            ruta,
            contenido,
            {
                encoding:
                    FileSystem
                        .EncodingType
                        .UTF8
            }
        );


    return ruta;

}





export async function compartirBackup(
    rutaArchivo = null
){

    logBackup(
        '===== INICIO COMPARTIR BACKUP ====='
    );


    let rutaCompartir =
        rutaArchivo;


    let temporalCreado =
        false;


    try{


        validarFuncion(
            'Sharing.isAvailableAsync',
            Sharing
                ?.isAvailableAsync
        );


        const disponible =
            await Sharing
                .isAvailableAsync();


        if(
            !disponible
        ){

            throw new Error(
                'COMPARTIR_NO_DISPONIBLE'
            );

        }



        if(
            !rutaCompartir
        ){

            rutaCompartir =
                await crearBackupTemporal();


            temporalCreado =
                true;

        }
        else if(
            String(
                rutaCompartir
            )
            .startsWith(
                'content://'
            )
        ){

            const contenido =
                await FileSystem
                    .readAsStringAsync(
                        rutaCompartir,
                        {
                            encoding:
                                FileSystem
                                    .EncodingType
                                    .UTF8
                        }
                    );


            rutaCompartir =
                `${FileSystem.cacheDirectory}` +
                `respaldo_compartir_` +
                `${formatearFechaArchivo()}.sql`;


            await FileSystem
                .writeAsStringAsync(
                    rutaCompartir,
                    contenido,
                    {
                        encoding:
                            FileSystem
                                .EncodingType
                                .UTF8
                    }
                );


            temporalCreado =
                true;

        }


        validarFuncion(
            'Sharing.shareAsync',
            Sharing
                ?.shareAsync
        );


        await Sharing
            .shareAsync(
                rutaCompartir,
                {
                    mimeType:
                        'text/plain',

                    dialogTitle:
                        'Compartir respaldo del criadero'
                }
            );


        logBackup(
            '===== FIN COMPARTIR BACKUP OK ====='
        );


    }
    catch(error){


        logBackupError(
            'compartirBackup',
            error
        );


        throw error;


    }
    finally{


        if(
            temporalCreado &&
            rutaCompartir
        ){

            try{


                await FileSystem
                    .deleteAsync(
                        rutaCompartir,
                        {
                            idempotent:
                                true
                        }
                    );


            }
            catch(error){


                console.warn(
                    '[BACKUP] No se pudo eliminar respaldo temporal:',
                    error?.message
                );


            }

        }


    }

}





export async function seleccionarBackup(){

    logBackup(
        '===== INICIO SELECCIONAR BACKUP ====='
    );


    try{


        validarFuncion(
            'DocumentPicker.getDocumentAsync',
            DocumentPicker
                ?.getDocumentAsync
        );


        const resultado =
            await DocumentPicker
                .getDocumentAsync(
                    {
                        multiple:
                            false,

                        copyToCacheDirectory:
                            false,

                        type:[
                            'text/plain',
                            'application/sql',
                            'application/octet-stream',
                            '*/*'
                        ]
                    }
                );


        if(
            resultado?.canceled
        ){

            return null;

        }


        const archivo =
            resultado
                ?.assets
                ?.[0];


        if(
            !archivo?.uri
        ){

            throw new Error(
                'ARCHIVO_SELECCIONADO_SIN_URI'
            );

        }


        logBackup(
            'Archivo seleccionado',
            {
                name:
                    archivo.name,

                size:
                    archivo.size,

                uri:
                    archivo.uri
            }
        );


        return archivo;


    }
    catch(error){


        logBackupError(
            'seleccionarBackup',
            error
        );


        throw error;


    }

}





async function prepararArchivoParaLectura(
    archivo
){

    if(
        !archivo?.uri
    ){

        throw new Error(
            'ARCHIVO_SELECCIONADO_SIN_URI'
        );

    }


    if(
        !FileSystem.documentDirectory
    ){

        throw new Error(
            'DIRECTORIO_DOCUMENTOS_NO_DISPONIBLE'
        );

    }


    validarFuncion(
        'FileSystem.copyAsync',
        FileSystem
            ?.copyAsync
    );


    const rutaTemporal =
        `${FileSystem.documentDirectory}` +
        `restauracion_criadero_${Date.now()}.txt`;


    await FileSystem
        .copyAsync(
            {
                from:
                    archivo.uri,

                to:
                    rutaTemporal
            }
        );


    const info =
        await FileSystem
            .getInfoAsync(
                rutaTemporal,
                {
                    size:
                        true
                }
            );


    if(
        !info?.exists
    ){

        throw new Error(
            'NO_SE_PUDO_COPIAR_RESPALDO'
        );

    }


    if(
        Number(
            info?.size || 0
        ) <= 0
    ){

        throw new Error(
            'RESPALDO_COPIADO_VACIO'
        );

    }


    return rutaTemporal;

}





async function eliminarTemporal(
    rutaTemporal
){

    if(
        !rutaTemporal
    ){

        return;

    }


    try{


        await FileSystem
            .deleteAsync(
                rutaTemporal,
                {
                    idempotent:
                        true
                }
            );


    }
    catch(error){


        console.warn(
            '[BACKUP] No se pudo eliminar temporal:',
            error?.message
        );


    }

}





async function prepararDirectorioImagenesRestauradas(){

    if(
        !FileSystem.documentDirectory
    ){

        throw new Error(
            'DIRECTORIO_DOCUMENTOS_NO_DISPONIBLE'
        );

    }


    const directorio =
        `${FileSystem.documentDirectory}` +
        'kikirikis/aves/restauradas/';


    await FileSystem
        .makeDirectoryAsync(
            directorio,
            {
                intermediates:
                    true
            }
        );


    return directorio;

}





async function restaurarImagenes(
    db,
    manifest
){

    if(
        !manifest ||
        !Array.isArray(
            manifest.imagenes
        ) ||
        manifest.imagenes.length === 0
    ){

        logBackup(
            'El respaldo no contiene imágenes.'
        );


        return {

            restauradas:
                0,

            omitidas:
                0

        };

    }


    logBackup(
        'Iniciando restauración de imágenes',
        {
            cantidad:
                manifest.imagenes.length
        }
    );


    const directorio =
        await prepararDirectorioImagenesRestauradas();


    let restauradas =
        0;


    let omitidas =
        0;


    for(
        let indice = 0;
        indice < manifest.imagenes.length;
        indice += 1
    ){

        const imagen =
            manifest.imagenes[
                indice
            ];


        try{


            if(
                !imagen?.data
            ){

                omitidas += 1;

                continue;

            }


            const extension =
                obtenerExtensionImagen(
                    imagen.key
                );


            const nombre =
                `restaurada_${Date.now()}_${indice}_` +
                `${Math.random()
                    .toString(36)
                    .substring(2, 8)}.` +
                `${extension}`;


            const nuevaUri =
                `${directorio}${nombre}`;


            await FileSystem
                .writeAsStringAsync(
                    nuevaUri,
                    imagen.data,
                    {
                        encoding:
                            FileSystem
                                .EncodingType
                                .Base64
                    }
                );


            const info =
                await FileSystem
                    .getInfoAsync(
                        nuevaUri,
                        {
                            size:
                                true
                        }
                    );


            if(
                !info?.exists ||
                Number(
                    info?.size || 0
                ) <= 0
            ){

                throw new Error(
                    'IMAGEN_RESTAURADA_VACIA'
                );

            }



            for(
                const referencia
                of (
                    imagen.referencias || []
                )
            ){

                if(
                    referencia.tabla ===
                    'aves'
                ){

                    await db.runAsync(
                        `
                        UPDATE aves

                        SET
                            foto_uri = ?,

                            fecha_actualizacion =
                                CURRENT_TIMESTAMP

                        WHERE id = ?
                        `,
                        [
                            nuevaUri,
                            referencia.id
                        ]
                    );

                }


                if(
                    referencia.tabla ===
                    'ave_evolucion'
                ){

                    await db.runAsync(
                        `
                        UPDATE ave_evolucion

                        SET
                            foto_uri = ?

                        WHERE id = ?
                        `,
                        [
                            nuevaUri,
                            referencia.id
                        ]
                    );

                }

            }


            restauradas += 1;


            logBackup(
                'Imagen restaurada',
                {
                    uri:
                        nuevaUri,

                    referencias:
                        imagen.referencias?.length || 0
                }
            );


        }
        catch(error){


            omitidas += 1;


            console.warn(
                '[BACKUP] Error restaurando imagen:',
                {
                    key:
                        imagen?.key,

                    error:
                        error?.message
                }
            );


        }

    }


    logBackup(
        'Restauración de imágenes finalizada',
        {
            restauradas,
            omitidas
        }
    );


    return {

        restauradas,

        omitidas

    };

}





export async function restaurarBackup(
    archivo
){

    logBackup(
        '===== INICIO RESTAURAR BACKUP ====='
    );


    let rutaTemporal =
        null;


    try{


        if(
            !archivo?.uri
        ){

            throw new Error(
                'ARCHIVO_RESPALDO_REQUERIDO'
            );

        }


        const db =
            await getDatabase();


        rutaTemporal =
            await prepararArchivoParaLectura(
                archivo
            );


        const contenidoCompleto =
            await FileSystem
                .readAsStringAsync(
                    rutaTemporal,
                    {
                        encoding:
                            FileSystem
                                .EncodingType
                                .UTF8
                    }
                );


        if(
            !contenidoCompleto ||
            !contenidoCompleto.trim()
        ){

            throw new Error(
                'RESPALDO_VACIO'
            );

        }



        const {
            sql,
            manifest
        } =
            extraerManifestDelRespaldo(
                contenidoCompleto
            );



        const sqlMayuscula =
            sql
                .toUpperCase();


        if(
            !sqlMayuscula.includes(
                'BEGIN TRANSACTION'
            )
            ||
            !sqlMayuscula.includes(
                'COMMIT'
            )
        ){

            throw new Error(
                'ARCHIVO_NO_ES_RESPALDO_VALIDO'
            );

        }



        validarFuncion(
            'db.execAsync',
            db?.execAsync
        );


        /*
            Primero restauramos exactamente el SQL,
            conservando el mecanismo que ya funcionaba.
        */

        logBackup(
            'Ejecutando restauración SQLite'
        );


        await db.execAsync(
            sql
        );


        logBackup(
            'Restauración SQLite finalizada'
        );



        /*
            Después restauramos imágenes y sustituimos
            solamente las foto_uri por rutas válidas de
            esta instalación.
        */

        const resultadoImagenes =
            await restaurarImagenes(
                db,
                manifest
            );


        logBackup(
            '===== FIN RESTAURAR BACKUP OK =====',
            resultadoImagenes
        );


        return {

            ok:
                true,

            imagenes:
                resultadoImagenes

        };


    }
    catch(error){


        logBackupError(
            'restaurarBackup',
            error
        );


        throw error;


    }
    finally{


        await eliminarTemporal(
            rutaTemporal
        );


    }

}