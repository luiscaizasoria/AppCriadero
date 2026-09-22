import {
    getDatabase
} from './database';


export async function ejecutarSeeders() {

    const db =
        await getDatabase();


    // Los datos iniciales de catálogos
    // se mantienen aquí para evitar ciclos
    // de importación con sqlite.js.

    return db;
}
