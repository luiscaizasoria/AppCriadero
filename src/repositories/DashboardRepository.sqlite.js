import {
getDatabase
} from '../database/database';



export async function obtenerDashboard() {


const db =
    await getDatabase();






const aves =
    await db.getFirstAsync(`
        SELECT 

            COALESCE(
                SUM(
                    CASE 
                        WHEN estado='ACTIVA' 
                        THEN 1 
                        ELSE 0 
                    END
                ),
                0
            ) AS activas,


            COALESCE(
                SUM(
                    CASE 
                        WHEN estado='VENDIDA' 
                        THEN 1 
                        ELSE 0 
                    END
                ),
                0
            ) AS vendidas,


            COALESCE(
                SUM(
                    CASE 
                        WHEN estado='FALLECIDA' 
                        THEN 1 
                        ELSE 0 
                    END
                ),
                0
            ) AS fallecidas


        FROM aves
    `);






const salud =
    await db.getFirstAsync(`
        SELECT 

            COALESCE(
                SUM(
                    CASE 
                        WHEN estado_salud='SANA' 
                        THEN 1 
                        ELSE 0 
                    END
                ),
                0
            ) AS sanas,


            COALESCE(
                SUM(
                    CASE 
                        WHEN estado_salud='EN_TRATAMIENTO' 
                        THEN 1 
                        ELSE 0 
                    END
                ),
                0
            ) AS tratamiento,


            COALESCE(
                SUM(
                    CASE 
                        WHEN estado_salud='ENFERMA' 
                        THEN 1 
                        ELSE 0 
                    END
                ),
                0
            ) AS enfermas


        FROM aves

        WHERE estado='ACTIVA'
    `);






const finanzas =
    await db.getFirstAsync(`
        SELECT 

            COALESCE(
                SUM(
                    CASE 
                        WHEN tipo='INGRESO' 
                        THEN valor 
                        ELSE 0 
                    END
                ),
                0
            ) AS ingresos,


            COALESCE(
                SUM(
                    CASE 
                        WHEN tipo='EGRESO' 
                        THEN valor 
                        ELSE 0 
                    END
                ),
                0
            ) AS egresos


        FROM movimientos_financieros 


        WHERE strftime('%Y-%m', fecha)
            =
            strftime('%Y-%m','now')
    `);






const jaulas =
    await db.getFirstAsync(`
        SELECT 

            COUNT(*) AS total,


            COALESCE(
                SUM(
                    CASE 
                        WHEN EXISTS(
                            SELECT 1 
                            FROM aves a
                            WHERE a.jaula_actual_id=j.id
                            AND a.estado='ACTIVA'
                        )
                        THEN 1
                        ELSE 0
                    END
                ),
                0
            ) AS ocupadas


        FROM jaulas j


        WHERE activa=1
    `);






const huevos =
    await db.getFirstAsync(`
        SELECT


            COUNT(
                CASE
                    WHEN date(fecha)=date('now')
                    THEN 1
                END
            ) AS hoy,


            COUNT(
                CASE
                    WHEN strftime('%Y-%m',fecha)
                        =
                        strftime('%Y-%m','now')
                    THEN 1
                END
            ) AS mes


        FROM huevos
    `);






const mejorPonedora =
    await db.getFirstAsync(`
        SELECT

            a.codigo,

            COUNT(h.id) AS cantidad


        FROM huevos h


        INNER JOIN aves a

            ON a.id=h.ave_id


        GROUP BY

            a.id,

            a.codigo


        ORDER BY

            cantidad DESC


        LIMIT 1
    `);






const horaPico =
    await db.getFirstAsync(`
        SELECT

            strftime('%H', fecha) AS hora,

            COUNT(*) AS cantidad


        FROM huevos


        GROUP BY

            strftime('%H',fecha)


        ORDER BY

            cantidad DESC


        LIMIT 1
    `);







const produccionSemana =
    await db.getAllAsync(`
        SELECT


            CASE strftime('%w',fecha)

                WHEN '0' THEN 'Domingo'
                WHEN '1' THEN 'Lunes'
                WHEN '2' THEN 'Martes'
                WHEN '3' THEN 'Miércoles'
                WHEN '4' THEN 'Jueves'
                WHEN '5' THEN 'Viernes'
                WHEN '6' THEN 'Sábado'

            END AS dia,


            COUNT(*) AS cantidad


        FROM huevos


        WHERE fecha >= date('now','-6 day')


        GROUP BY

            strftime('%w',fecha)


        ORDER BY

            strftime('%w',fecha)

    `);







const promedioHuevos =
    await db.getFirstAsync(`
        SELECT


            ROUND(
                COUNT(*) / 7.0,
                2
            ) AS promedio


        FROM huevos


        WHERE fecha >= date('now','-6 day')

    `);







const avesPorRaza =
    await db.getAllAsync(`
        SELECT

            COALESCE(
                NULLIF(
                    TRIM(raza),
                    ''
                ),
                'Sin raza'
            ) AS raza,


            COUNT(*) AS cantidad,


            ROUND(
                COUNT(*) * 100.0
                /
                NULLIF(
                    (
                        SELECT COUNT(*)
                        FROM aves
                        WHERE estado='ACTIVA'
                    ),
                    0
                ),
                2
            ) AS porcentaje


        FROM aves


        WHERE estado='ACTIVA'


        GROUP BY

            COALESCE(
                NULLIF(
                    TRIM(raza),
                    ''
                ),
                'Sin raza'
            )


        ORDER BY

            cantidad DESC,

            raza ASC

    `);







const totalRazas =
    await db.getFirstAsync(`
        SELECT

            COUNT(
                DISTINCT
                COALESCE(
                    NULLIF(
                        TRIM(raza),
                        ''
                    ),
                    'Sin raza'
                )
            ) AS total


        FROM aves


        WHERE estado='ACTIVA'

    `);







const ocupacionJaulas = {

    porcentaje:

        jaulas?.total > 0

        ?

        Number(
            (
                (
                    Number(jaulas.ocupadas)
                    /
                    Number(jaulas.total)
                )
                *
                100
            ).toFixed(2)
        )

        :

        0

};






return {


    aves,


    salud,



    finanzas:{


        ingresos:
            Number(
                finanzas?.ingresos || 0
            ),



        egresos:
            Number(
                finanzas?.egresos || 0
            ),



        utilidad:
            Number(
                finanzas?.ingresos || 0
            )
            -
            Number(
                finanzas?.egresos || 0
            )

    },



    jaulas,



    ocupacionJaulas,



    huevos,



    mejorPonedora,



    horaPico,



    produccionSemana,



    avesPorRaza,



    totalRazas:
        Number(
            totalRazas?.total || 0
        ),



    promedioHuevos:
        Number(
            promedioHuevos?.promedio || 0
        )


};


}
