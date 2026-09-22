import {
DATABASE_VERSION,
migrationV1
} from './migrations';

import {
DATABASE_VERSION_V2,
migrationV2
} from './migrationV2';

import {
DATABASE_VERSION_V3,
migrationV3
} from './migrationV3';

import {
DATABASE_VERSION_V4,
migrationV4
} from './migrationV4';

import {
DATABASE_VERSION_V5,
migrationV5
} from './migrationV5';

import {
DATABASE_VERSION_V6,
migrationV6
} from './migrationV6';

import {
ejecutarSeeders
} from './seeders';

import {
getDatabase
} from './database';



export async function initDatabase() {

    const db =
        await getDatabase();


    await db.execAsync(`
        PRAGMA journal_mode = WAL;
        PRAGMA foreign_keys = ON;
    `);


    const versionResult =
        await db.getFirstAsync(
            'PRAGMA user_version;'
        );


    let versionActual =
        versionResult?.user_version ?? 0;


    console.log(
        'DEBUG VERSIONES:',
        {
            actual: versionActual,
            V1: DATABASE_VERSION,
            V2: DATABASE_VERSION_V2,
            V3: DATABASE_VERSION_V3,
            V4: DATABASE_VERSION_V4,
            V5: DATABASE_VERSION_V5,
            V6: DATABASE_VERSION_V6
        }
    );


    if(
        versionActual < DATABASE_VERSION
    ) {

        console.log(
            'SQLite - ejecutando migración V1'
        );


        await db.execAsync(`
            BEGIN TRANSACTION;

            ${migrationV1}

            PRAGMA user_version =
                ${DATABASE_VERSION};

            COMMIT;
        `);


        versionActual =
            DATABASE_VERSION;


        console.log(
            'SQLite - migración V1 completada'
        );

    }


    if(
        versionActual < DATABASE_VERSION_V2
    ) {

        console.log(
            'SQLite - ejecutando migración V2'
        );


        await db.execAsync(`
            BEGIN TRANSACTION;

            ${migrationV2}

            PRAGMA user_version =
                ${DATABASE_VERSION_V2};

            COMMIT;
        `);


        versionActual =
            DATABASE_VERSION_V2;


        console.log(
            'SQLite - migración V2 completada'
        );

    }


    if(
        versionActual < DATABASE_VERSION_V3
    ) {

        console.log(
            'SQLite - ejecutando migración V3'
        );


        await db.execAsync(`
            BEGIN TRANSACTION;

            ${migrationV3}

            PRAGMA user_version =
                ${DATABASE_VERSION_V3};

            COMMIT;
        `);


        versionActual =
            DATABASE_VERSION_V3;


        console.log(
            'SQLite - migración V3 completada'
        );

    }


    if(
        versionActual < DATABASE_VERSION_V4
    ) {

        console.log(
            'SQLite - ejecutando migración V4'
        );


        await db.execAsync(`
            BEGIN TRANSACTION;

            ${migrationV4}

            PRAGMA user_version =
                ${DATABASE_VERSION_V4};

            COMMIT;
        `);


        versionActual =
            DATABASE_VERSION_V4;


        console.log(
            'SQLite - migración V4 completada'
        );

    }


    if(
        versionActual < DATABASE_VERSION_V5
    ) {

        console.log(
            'SQLite - ejecutando migración V5'
        );


        await db.execAsync(`
            BEGIN TRANSACTION;

            ${migrationV5}

            PRAGMA user_version =
                ${DATABASE_VERSION_V5};

            COMMIT;
        `);


        versionActual =
            DATABASE_VERSION_V5;


        console.log(
            'SQLite - migración V5 completada'
        );

    }


    if(
        versionActual < DATABASE_VERSION_V6
    ) {

        console.log(
            'SQLite - ejecutando migración V6'
        );


        await db.execAsync(`
            BEGIN TRANSACTION;

            ${migrationV6}

            PRAGMA user_version =
                ${DATABASE_VERSION_V6};

            COMMIT;
        `);


        versionActual =
            DATABASE_VERSION_V6;


        console.log(
            'SQLite - migración V6 completada'
        );

    }


    await ejecutarSeeders();


    console.log(
        'SQLite - versión final:',
        versionActual
    );


    console.log(
        'Base Criadero Kikirikis lista'
    );

}
