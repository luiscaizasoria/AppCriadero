import { getDatabase } from '../database/database';


export async function registrarHistorialJaula({
    jaulaId,
    aveId = null,
    tipoEvento,
    fecha,
    detalle,
    db = null
}) {

    const database =
        db || await getDatabase();


    await database.runAsync(
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
            jaulaId,
            aveId,
            tipoEvento,
            fecha,
            detalle || null
        ]
    );

}


export async function obtenerHistorialJaula(
    jaulaId
) {

    const db = await getDatabase();

    return await db.getAllAsync(
        `
        SELECT
            id,
            jaula_id,
            ave_id,
            tipo_evento,
            fecha,
            detalle,
            fecha_creacion
        FROM jaula_historial
        WHERE jaula_id = ?
        ORDER BY
            fecha DESC,
            id DESC
        `,
        [jaulaId]
    );

}