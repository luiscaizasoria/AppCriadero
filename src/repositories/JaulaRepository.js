import { getDatabase } from '../database/database';

export async function obtenerJaulas() {

    const db = await getDatabase();

    return await db.getAllAsync(`
        SELECT
            j.id,
            j.codigo,
            j.nombre,
            j.ubicacion,
            j.tipo,
            j.estado_sanitario,
            j.activa,
            j.fecha_creacion,
            COUNT(a.id) AS cantidad_aves
        FROM jaulas j

        LEFT JOIN aves a
            ON a.jaula_actual_id = j.id
            AND a.estado = 'ACTIVA'

        WHERE j.activa = 1

        GROUP BY
            j.id,
            j.codigo,
            j.nombre,
            j.ubicacion,
            j.tipo,
            j.estado_sanitario,
            j.activa,
            j.fecha_creacion

        ORDER BY j.codigo;
    `);

}

export async function obtenerJaulasInactivas() {

    const db = await getDatabase();

    return await db.getAllAsync(`
        SELECT
            j.id,
            j.codigo,
            j.nombre,
            j.ubicacion,
            j.tipo,
            j.estado_sanitario,
            j.activa,
            j.fecha_creacion,
            j.fecha_actualizacion,
            j.fecha_desactivacion,
            COUNT(DISTINCT h.ave_id) AS cantidad_aves
        FROM jaulas j
        LEFT JOIN jaula_historial h
            ON h.jaula_id = j.id
        WHERE j.activa = 0
        GROUP BY
            j.id,
            j.codigo,
            j.nombre,
            j.ubicacion,
            j.tipo,
            j.estado_sanitario,
            j.activa,
            j.fecha_creacion,
            j.fecha_actualizacion,
            j.fecha_desactivacion
        ORDER BY
            COALESCE(
                j.fecha_desactivacion,
                j.fecha_actualizacion,
                j.fecha_creacion
            ) DESC,
            j.codigo;
    `);

}


export async function obtenerAvesHistoricasJaula(
    jaulaId
) {

    const db = await getDatabase();

    return await db.getAllAsync(
        `
        SELECT DISTINCT
            a.id,
            a.codigo,
            a.raza,
            a.sexo,
            a.estado,
            a.foto_uri
        FROM jaula_historial h
        INNER JOIN aves a
            ON a.id = h.ave_id
        WHERE h.jaula_id = ?
        ORDER BY a.codigo
        `,
        [jaulaId]
    );

}


export async function obtenerHistorialCompletoJaula(
    jaulaId
) {

    const db = await getDatabase();

    return await db.getAllAsync(
        `
        SELECT
            h.id,
            h.jaula_id,
            h.ave_id,
            h.tipo_evento,
            h.fecha,
            h.detalle,
            a.codigo AS ave_codigo
        FROM jaula_historial h
        LEFT JOIN aves a
            ON a.id = h.ave_id
        WHERE h.jaula_id = ?
        ORDER BY
            h.fecha DESC,
            h.id DESC
        `,
        [jaulaId]
    );

}


export async function obtenerJaulaPorId(id) {

    const db = await getDatabase();

    return await db.getFirstAsync(
        `
        SELECT *
        FROM jaulas
        WHERE id = ?
        `,
        [id]
    );

}

export async function crearJaula({
    codigo,
    nombre,
    ubicacion,
    tipo
}) {

    const db = await getDatabase();

    const result = await db.runAsync(
        `
        INSERT INTO jaulas
        (
            codigo,
            nombre,
            ubicacion,
            tipo,
            estado_sanitario,
            activa
        )
        VALUES (?, ?, ?, ?, 'NORMAL', 1)
        `,
        [
            codigo.trim(),
            nombre?.trim() || null,
            ubicacion?.trim() || null,
            tipo?.trim() || null
        ]
    );

    return result.lastInsertRowId;

}

export async function actualizarJaula({
    id,
    codigo,
    nombre,
    ubicacion,
    tipo
}) {

    const db = await getDatabase();

    await db.runAsync(
        `
        UPDATE jaulas
        SET
            codigo = ?,
            nombre = ?,
            ubicacion = ?,
            tipo = ?,
            fecha_actualizacion = CURRENT_TIMESTAMP
        WHERE id = ?
        `,
        [
            codigo.trim(),
            nombre?.trim() || null,
            ubicacion?.trim() || null,
            tipo?.trim() || null,
            id
        ]
    );

}

export async function desactivarJaula(id) {

    const db =
        await getDatabase();


    const fecha =
        new Date()
            .toISOString();


    let cantidadAvesLiberadas =
        0;


    await db.withTransactionAsync(
        async () => {

            const jaula =
                await db.getFirstAsync(
                    `
                    SELECT
                        id,
                        codigo,
                        nombre,
                        activa
                    FROM jaulas
                    WHERE id = ?
                    `,
                    [
                        id
                    ]
                );


            if (!jaula) {

                throw new Error(
                    'JAULA_NO_ENCONTRADA'
                );

            }


            if (
                Number(
                    jaula.activa
                ) !== 1
            ) {

                return;

            }


            const avesAsignadas =
                await db.getAllAsync(
                    `
                    SELECT
                        id,
                        codigo
                    FROM aves
                    WHERE jaula_actual_id = ?
                    ORDER BY codigo
                    `,
                    [
                        id
                    ]
                );


            cantidadAvesLiberadas =
                avesAsignadas.length;


            for (
                const ave
                of avesAsignadas
            ) {

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
                        ave.id,

                        null,

                        'CAMBIO_JAULA',

                        fecha,

                        `La jaula ${jaula.codigo} fue eliminada. El ave quedó sin jaula asignada.`
                    ]
                );


                await db.runAsync(
                    `
                    INSERT INTO jaula_historial
                    (
                        jaula_id,
                        ave_id,
                        tipo_evento,
                        fecha,
                        detalle
                    )
                    VALUES (?, ?, ?, ?, ?)
                    `,
                    [
                        id,

                        ave.id,

                        'SALIDA_AVE',

                        fecha,

                        `Ave ${ave.codigo} salió de la jaula porque la jaula fue eliminada.`
                    ]
                );

            }


            await db.runAsync(
                `
                UPDATE aves
                SET
                    jaula_actual_id = NULL,
                    fecha_actualizacion = CURRENT_TIMESTAMP
                WHERE jaula_actual_id = ?
                `,
                [
                    id
                ]
            );


            await db.runAsync(
                `
                UPDATE jaulas
                SET
                    activa = 0,
                    fecha_desactivacion = ?,
                    fecha_actualizacion = CURRENT_TIMESTAMP
                WHERE id = ?
                `,
                [
                    fecha,
                    id
                ]
            );

        }
    );


    return {
        cantidadAvesLiberadas
    };

}
