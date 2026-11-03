import {
    getDatabase
} from '../database/database';





export async function obtenerResumenProduccion(){

    const db =
        await getDatabase();



    const resultado =
        await db.getFirstAsync(
            `
            SELECT


                COUNT(
                    CASE

                        WHEN date(fecha)=date('now')

                        THEN 1

                    END
                ) AS hoy,



                COUNT(
                    CASE

                        WHEN fecha >= date('now','-6 day')

                        THEN 1

                    END
                ) AS semana,



                COUNT(
                    CASE

                        WHEN strftime('%Y-%m',fecha)
                            =
                            strftime('%Y-%m','now')

                        THEN 1

                    END
                ) AS mes



            FROM huevos

            `
        );



    return {

        hoy:
            Number(
                resultado?.hoy || 0
            ),


        semana:
            Number(
                resultado?.semana || 0
            ),


        mes:
            Number(
                resultado?.mes || 0
            )

    };

}







export async function obtenerRankingPonedoras(){

    const db =
        await getDatabase();



    return await db.getAllAsync(
        `
        SELECT


            a.id,

            a.codigo,

            a.raza,

            COUNT(h.id) AS cantidad



        FROM huevos h



        INNER JOIN aves a

            ON a.id = h.ave_id



        GROUP BY

            a.id,

            a.codigo,

            a.raza



        ORDER BY

            cantidad DESC



        LIMIT 10

        `
    );

}







export async function obtenerProduccionPorDia(){

    const db =
        await getDatabase();



    return await db.getAllAsync(
        `
        SELECT


            CASE strftime('%w',fecha)

                WHEN '0'
                THEN 'Domingo'

                WHEN '1'
                THEN 'Lunes'

                WHEN '2'
                THEN 'Martes'

                WHEN '3'
                THEN 'Miércoles'

                WHEN '4'
                THEN 'Jueves'

                WHEN '5'
                THEN 'Viernes'

                WHEN '6'
                THEN 'Sábado'

            END AS dia,



            COUNT(*) AS cantidad



        FROM huevos



        WHERE fecha >= date('now','-6 day')



        GROUP BY

            strftime('%w',fecha)



        ORDER BY

            strftime('%w',fecha)

        `
    );

}







export async function obtenerProduccionPorJaula(){

    const db =
        await getDatabase();



    return await db.getAllAsync(
        `
        SELECT


            j.id,

            j.codigo,

            COUNT(h.id) AS cantidad



        FROM huevos h



        INNER JOIN jaulas j

            ON j.id = h.jaula_id



        GROUP BY

            j.id,

            j.codigo



        ORDER BY

            cantidad DESC



        `
    );

}







export async function obtenerProduccionPorAve(){

    const db =
        await getDatabase();



    return await db.getAllAsync(
        `
        SELECT


            a.id,

            a.codigo,

            COUNT(h.id) AS cantidad



        FROM huevos h



        INNER JOIN aves a

            ON a.id = h.ave_id



        GROUP BY

            a.id,

            a.codigo



        ORDER BY

            cantidad DESC



        LIMIT 20

        `
    );

}