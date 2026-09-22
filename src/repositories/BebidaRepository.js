import { getDatabase } from '../database/database';

import {
    registrarHistorialJaula
} from './HistorialRepository';



export async function obtenerTiposBebidas(){

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

        WHERE c.codigo = 'BEBIDAS'
        AND ci.activo = 1

        ORDER BY ci.nombre
        `
    );

}



export async function registrarBebida({
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
                INSERT INTO bebida_jaula
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

                tipoEvento:'BEBIDA',

                fecha,

                detalle:
                    `Bebida: ${tipo}`,

                db

            });

        }
    );

}
