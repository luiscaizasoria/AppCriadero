import * as FileSystem from 'expo-file-system/legacy';

import * as Sharing from 'expo-sharing';

import * as DocumentPicker from 'expo-document-picker';


import {
    getDatabase
} from '../database/database';



function convertirValor(valor){

    if(valor === null || valor === undefined){
        return 'NULL';
    }

    if(typeof valor === 'number'){
        return String(valor);
    }

    return `'${String(valor).replace(/'/g,"''")}'`;

}




export async function crearBackup(){

    const db =
        await getDatabase();


    const tablas =
        await db.getAllAsync(`
            SELECT name
            FROM sqlite_master
            WHERE type='table'
            AND name NOT LIKE 'sqlite_%'
        `);



    let script =
        'PRAGMA foreign_keys=OFF;\nBEGIN TRANSACTION;\n';



    for(const tabla of tablas){

        const filas =
            await db.getAllAsync(
                `SELECT * FROM ${tabla.name}`
            );


        for(const fila of filas){

            const columnas =
                Object.keys(fila);


            script +=
            `
INSERT INTO ${tabla.name}
(${columnas.join(',')})
VALUES
(${columnas.map(x=>convertirValor(fila[x])).join(',')});
`;

        }

    }


    script +=
        '\nCOMMIT;\nPRAGMA foreign_keys=ON;';



    const archivo =
        `${FileSystem.documentDirectory}backup_criadero_${Date.now()}.sql`;



    await FileSystem.writeAsStringAsync(
        archivo,
        script
    );


    return archivo;

}





export async function crearYCompartirBackup(){

    const archivo =
        await crearBackup();


    await Sharing.shareAsync(
        archivo,
        {
            mimeType:'text/plain',
            dialogTitle:'Guardar respaldo del criadero'
        }
    );


    return archivo;

}





export async function compartirBackup(
    ruta
){

    await Sharing.shareAsync(
        ruta
    );

}





export async function seleccionarBackup(){

    const resultado =
        await DocumentPicker.getDocumentAsync({

            multiple:false,

            copyToCacheDirectory:true,

            type:[
                'text/plain',
                'application/sql',
                'application/octet-stream',
                '*/*'
            ]

        });



    if(resultado.canceled){

        return null;

    }



    return resultado.assets?.[0] || null;

}





async function leerRespaldo(asset){

    try{

        return await FileSystem.readAsStringAsync(
            asset.uri
        );

    }
    catch(error){

        throw new Error(
            `NO_SE_PUDO_LEER_ARCHIVO: ${asset.name || 'sin nombre'}`
        );

    }

}





export async function restaurarBackup(
    asset
){

    if(!asset){

        throw new Error(
            'ARCHIVO_NO_SELECCIONADO'
        );

    }



    const db =
        await getDatabase();



    const contenido =
        await leerRespaldo(
            asset
        );



    const comandos =
        contenido
        .split(';')
        .map(x=>x.trim())
        .filter(x=>x.length>0)
        .filter(
            x =>
            !x.toUpperCase()
            .startsWith('CREATE TABLE')
        );



    await db.withTransactionAsync(
        async()=>{


            const tablas =
                await db.getAllAsync(`
                    SELECT name
                    FROM sqlite_master
                    WHERE type='table'
                    AND name NOT LIKE 'sqlite_%'
                `);



            for(const tabla of tablas){

                await db.runAsync(
                    `DELETE FROM ${tabla.name}`
                );

            }



            for(const comando of comandos){

                await db.execAsync(
                    comando
                );

            }

        }
    );



    return true;

}
