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


        logBackup(
            `Columnas ${tabla}`,
            columnas
        );


        if(
            columnas.length === 0
        ){

            logBackup(
                `Tabla ${tabla} sin columnas. Se omite.`
            );

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



async function seleccionarCarpetaDestino(){

    logBackup(
        'Validando StorageAccessFramework',
        {
            existe:
                !!StorageAccessFramework,

            requestDirectoryPermissionsAsync:
                typeof StorageAccessFramework
                    ?.requestDirectoryPermissionsAsync,

            createFileAsync:
                typeof StorageAccessFramework
                    ?.createFileAsync
        }
    );


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


    logBackup(
        'Resultado permiso carpeta',
        permiso
    );


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


    logBackup(
        'Creando archivo SAF',
        {
            directoryUri,
            nombreArchivo
        }
    );


    const archivoUri =
        await StorageAccessFramework
            .createFileAsync(
                directoryUri,
                nombreArchivo,
                'text/plain'
            );


    logBackup(
        'Archivo SAF creado',
        archivoUri
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
    contenidoSql
){

    validarFuncion(
        'FileSystem.writeAsStringAsync',
        FileSystem
            ?.writeAsStringAsync
    );


    logBackup(
        'Escribiendo contenido del respaldo',
        {
            archivoUri,

            longitud:
                contenidoSql.length
        }
    );


    await FileSystem
        .writeAsStringAsync(
            archivoUri,
            contenidoSql,
            {
                encoding:
                    FileSystem
                        .EncodingType
                        .UTF8
            }
        );


    logBackup(
        'Escritura finalizada'
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


    logBackup(
        'Verificación de respaldo',
        {
            esperado:
                contenidoSql.length,

            guardado:
                verificacion?.length || 0
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


    return true;

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


    validarFuncion(
        'FileSystem.copyAsync',
        FileSystem
            ?.copyAsync
    );


    const extension =
        String(
            archivo.name || ''
        )
        .toLowerCase()
        .endsWith(
            '.txt'
        )
        ?
        '.txt'
        :
        '.sql';


    const nombreTemporal =
        `restauracion_criadero_${Date.now()}${extension}`;


    const rutaTemporal =
        `${FileSystem.documentDirectory}${nombreTemporal}`;


    logBackup(
        'Preparando copia local del respaldo',
        {
            origen:
                archivo.uri,

            destino:
                rutaTemporal,

            name:
                archivo.name,

            size:
                archivo.size,

            mimeType:
                archivo.mimeType
        }
    );


    /*
        Si quedó un archivo temporal anterior con
        exactamente el mismo nombre, se elimina.
    */

    try{


        const info =
            await FileSystem
                .getInfoAsync(
                    rutaTemporal
                );


        if(
            info?.exists
        ){

            await FileSystem
                .deleteAsync(
                    rutaTemporal,
                    {
                        idempotent:
                            true
                    }
                );

        }


    }
    catch(errorInfo){


        console.log(
            '[BACKUP] No fue necesario limpiar temporal:',
            errorInfo?.message
        );


    }



    await FileSystem
        .copyAsync(
            {
                from:
                    archivo.uri,

                to:
                    rutaTemporal
            }
        );


    logBackup(
        'Archivo copiado a almacenamiento interno'
    );


    const infoCopiado =
        await FileSystem
            .getInfoAsync(
                rutaTemporal,
                {
                    size:
                        true
                }
            );


    logBackup(
        'Información archivo temporal',
        infoCopiado
    );


    if(
        !infoCopiado?.exists
    ){

        throw new Error(
            'NO_SE_PUDO_COPIAR_RESPALDO'
        );

    }


    if(
        Number(
            infoCopiado?.size || 0
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


        logBackup(
            'Archivo temporal eliminado',
            rutaTemporal
        );


    }
    catch(error){


        console.warn(
            '[BACKUP] No fue posible eliminar temporal:',
            error?.message
        );


    }

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


        const db =
            await getDatabase();


        logBackup(
            'Base de datos obtenida',
            {
                existe:
                    !!db,

                getAllAsync:
                    typeof db?.getAllAsync,

                execAsync:
                    typeof db?.execAsync
            }
        );


        const contenidoSql =
            await generarSqlRespaldo(
                db
            );


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
            contenidoSql
        );


        logBackup(
            'Respaldo guardado correctamente',
            archivoUri
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



export async function compartirBackup(
    rutaArchivo
){

    logBackup(
        '===== INICIO COMPARTIR BACKUP =====',
        rutaArchivo
    );


    try{


        if(
            !rutaArchivo
        ){

            throw new Error(
                'RUTA_RESPALDO_REQUERIDA'
            );

        }


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


        let rutaCompartir =
            rutaArchivo;


        if(
            String(
                rutaArchivo
            )
            .startsWith(
                'content://'
            )
        ){

            const contenido =
                await FileSystem
                    .readAsStringAsync(
                        rutaArchivo,
                        {
                            encoding:
                                FileSystem
                                    .EncodingType
                                    .UTF8
                        }
                    );


            rutaCompartir =
                `${FileSystem.cacheDirectory}respaldo_compartir_${formatearFechaArchivo()}.sql`;


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


        /*
            IMPORTANTE:

            No dejamos que DocumentPicker copie el
            documento a su propio cache.

            En Expo Go ese cache nos devolvió una URI
            que no resultó legible.

            Conservamos la URI original del proveedor
            de documentos y posteriormente utilizamos
            FileSystem.copyAsync().
        */

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


        logBackup(
            'Resultado selector respaldo',
            resultado
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

                mimeType:
                    archivo.mimeType,

                uri:
                    archivo.uri
            }
        );


        /*
            Ahora retornamos el asset completo, no solamente
            la URI, porque nos sirve para las trazas.
        */

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



export async function restaurarBackup(
    archivo
){

    logBackup(
        '===== INICIO RESTAURAR BACKUP =====',
        archivo
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


        validarFuncion(
            'getDatabase',
            getDatabase
        );


        const db =
            await getDatabase();


        /*
            PASO 1:
            copiamos el content:// seleccionado a un
            archivo file:// controlado por nuestra app.
        */

        rutaTemporal =
            await prepararArchivoParaLectura(
                archivo
            );


        /*
            PASO 2:
            ahora sí leemos desde nuestro almacenamiento.
        */

        validarFuncion(
            'FileSystem.readAsStringAsync',
            FileSystem
                ?.readAsStringAsync
        );


        logBackup(
            'Leyendo copia local del respaldo',
            rutaTemporal
        );


        const contenidoSql =
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


        logBackup(
            'Archivo leído correctamente',
            {
                longitud:
                    contenidoSql
                        ?.length
                    ||
                    0
            }
        );


        if(
            !contenidoSql ||
            !contenidoSql.trim()
        ){

            throw new Error(
                'RESPALDO_VACIO'
            );

        }


        /*
            Validación básica para evitar que se seleccione
            cualquier archivo .txt.
        */

        const sqlMayuscula =
            contenidoSql
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


        logBackup(
            'Ejecutando restauración SQLite'
        );


        await db.execAsync(
            contenidoSql
        );


        logBackup(
            'Restauración SQLite finalizada'
        );


        logBackup(
            '===== FIN RESTAURAR BACKUP OK ====='
        );


        return true;


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