import { getDatabase } from '../database/database';

import {
    registrarHistorialJaula
} from './HistorialRepository';


export async function obtenerTiposAlimentos(){

    const db =
        await getDatabase();

    return await db.getAllAsync(
        `
        SELECT
            ci.id,
            ci.codigo,
            ci.nombre

        FROM catalogo_items ci

        INNER JOIN catalogos c
            ON c.id = ci.catalogo_id

        WHERE c.codigo = 'ALIMENTOS'
        AND ci.activo = 1

        ORDER BY ci.nombre
        `
    );

}



export async function registrarAlimentacion({
    jaulaId,
    fecha,
    tipo,
    cantidad,
    detalle
}) {

    const db =
        await getDatabase();


    await db.withTransactionAsync(
        async () => {

            await db.runAsync(
                `
                INSERT INTO alimentacion_jaula
                (
                    jaula_id,
                    fecha,
                    tipo,
                    cantidad,
                    detalle
                )
                VALUES (?, ?, ?, ?, ?)
                `,
                [
                    jaulaId,
                    fecha,
                    tipo,
                    cantidad || null,
                    detalle || null
                ]
            );


            await registrarHistorialJaula({

                jaulaId,

                tipoEvento:'ALIMENTACION',

                fecha,

                detalle:
                    `Alimentación: ${tipo}`,

                db

            });

        }
    );

}



export async function obtenerAlimentacionJaula(
    jaulaId
){

    const db =
        await getDatabase();

    return await db.getAllAsync(
        `
        SELECT *

        FROM alimentacion_jaula

        WHERE jaula_id = ?

        ORDER BY fecha DESC
        `,
        [
            jaulaId
        ]
    );

}
