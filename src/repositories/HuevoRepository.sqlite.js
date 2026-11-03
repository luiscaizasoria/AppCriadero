import {
    getDatabase
} from '../database/database';



export async function generarCodigoHuevo() {

    const db =
        await getDatabase();


    const resultado =
        await db.getFirstAsync(
            `
            SELECT
                COUNT(*) AS total
            FROM huevos
            `
        );


    const numero =
        Number(resultado?.total || 0) + 1;


    return (
        'H' +
        String(numero)
            .padStart(6, '0')
    );

}




export async function registrarHuevo({

    aveId,
    jaulaId,
    fecha,
    observacion

}) {

    const db =
        await getDatabase();


    const codigo =
        await generarCodigoHuevo();


    const fechaRegistro =
        fecha ||
        new Date().toISOString();



    await db.withTransactionAsync(

        async () => {


            await db.runAsync(
                `
                INSERT INTO huevos
                (
                    codigo,
                    ave_id,
                    jaula_id,
                    fecha,
                    estado,
                    observacion
                )
                VALUES (?, ?, ?, ?, ?, ?)
                `,
                [
                    codigo,
                    aveId,
                    jaulaId || null,
                    fechaRegistro,
                    'REGISTRADO',
                    observacion || null
                ]
            );



            await db.runAsync(
                `
                INSERT INTO ave_historial
                (
                    ave_id,
                    jaula_id,
                    tipo_evento,
                    fecha,
                    detalle
                )
                VALUES (?, ?, ?, ?, ?)
                `,
                [
                    aveId,
                    jaulaId || null,
                    'POSTURA_HUEVO',
                    fechaRegistro,
                    `Registró huevo ${codigo}`
                ]
            );


        }

    );


    return codigo;

}




export async function obtenerHuevosAve(
    aveId
) {

    const db =
        await getDatabase();


    return await db.getAllAsync(
        `
        SELECT

            h.id,
            h.codigo,
            h.fecha,
            h.estado,
            h.observacion,
            j.codigo AS jaula_codigo

        FROM huevos h

        LEFT JOIN jaulas j
            ON j.id = h.jaula_id

        WHERE h.ave_id = ?

        ORDER BY
            h.fecha DESC,
            h.id DESC
        `,
        [
            aveId
        ]
    );

}




export async function obtenerProduccionHuevos() {

    const db =
        await getDatabase();


    return await db.getFirstAsync(
        `
        SELECT

            COUNT(*) AS total,

            SUM(
                CASE
                    WHEN date(fecha)=date('now')
                    THEN 1
                    ELSE 0
                END
            ) AS hoy,

            SUM(
                CASE
                    WHEN strftime('%Y-%m', fecha)
                         =
                         strftime('%Y-%m','now')
                    THEN 1
                    ELSE 0
                END
            ) AS mes

        FROM huevos
        `
    );

}




export async function obtenerTopPonedoras() {

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




export async function obtenerProduccionPorDia() {

    const db =
        await getDatabase();


    return await db.getAllAsync(
        `
        SELECT

            CASE strftime('%w', fecha)
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

        GROUP BY
            strftime('%w', fecha)

        ORDER BY
            cantidad DESC
        `
    );

}




export async function obtenerProduccionPorHora() {

    const db =
        await getDatabase();


    return await db.getAllAsync(
        `
        SELECT

            strftime('%H', fecha) AS hora,

            COUNT(*) AS cantidad

        FROM huevos

        GROUP BY
            strftime('%H', fecha)

        ORDER BY
            cantidad DESC
        `
    );

}




export async function obtenerProduccionPorJaula() {

    const db =
        await getDatabase();


    return await db.getAllAsync(
        `
        SELECT

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
