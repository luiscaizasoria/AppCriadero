import * as SQLite from 'expo-sqlite';

let database = null;

export async function getDatabase() {

    if (!database) {

        database = await SQLite.openDatabaseAsync(
            'criadero_kikirikis.db'
        );

    }

    return database;
}
