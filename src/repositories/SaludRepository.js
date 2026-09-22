import {
    getDatabase
} from '../database/database';



export async function obtenerEnfermedades() {

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


        WHERE

            c.codigo = 'ENFERMEDADES'

        AND ci.activo = 1


        ORDER BY

            ci.nombre

        `
    );

}




export async function obtenerMedicamentos() {

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


        WHERE

            c.codigo = 'MEDICAMENTOS'

        AND ci.activo = 1


        ORDER BY

            ci.nombre

        `
    );

}




export async function registrarDiagnostico({

    aveId,

    enfermedad,

    sintomas,

    observacion,

    medicamento,

    dosis,

    fecha

}) {


    const db =
        await getDatabase();



    await db.withTransactionAsync(

        async () => {


            const diagnostico =

                await db.runAsync(
                    `
                    INSERT INTO diagnosticos_ave
                    (
                        ave_id,
                        fecha,
                        enfermedad,
                        sintomas,
                        observacion,
                        estado
                    )

                    VALUES

                    (?, ?, ?, ?, ?, 'ACTIVO')

                    `,
                    [

                        aveId,

                        fecha,

                        enfermedad,

                        sintomas || null,

                        observacion || null

                    ]
                );



            const diagnosticoId =
                diagnostico.lastInsertRowId;



            if(medicamento){


                await db.runAsync(
                    `
                    INSERT INTO tratamientos_ave
                    (
                        diagnostico_id,
                        ave_id,
                        fecha,
                        medicamento,
                        dosis,
                        observacion
                    )

                    VALUES

                    (?, ?, ?, ?, ?, ?)

                    `,
                    [

                        diagnosticoId,

                        aveId,

                        fecha,

                        medicamento,

                        dosis || null,

                        observacion || null

                    ]
                );


            }



            await db.runAsync(
                `
                UPDATE aves

                SET

                    estado_salud =
                        'EN_TRATAMIENTO',

                    fecha_ultimo_control_salud =
                        ?

                WHERE id = ?

                `,
                [

                    fecha,

                    aveId

                ]
            );



            await db.runAsync(
                `
                INSERT INTO ave_historial
                (
                    ave_id,

                    tipo_evento,

                    fecha,

                    detalle

                )

                VALUES

                (?, ?, ?, ?)

                `,
                [

                    aveId,

                    'SALUD',

                    fecha,

                    `Diagnóstico registrado: ${enfermedad}`

                ]
            );


        }

    );

}





export async function obtenerHistorialSaludAve(
    aveId
) {


    const db =
        await getDatabase();



    return await db.getAllAsync(
        `
        SELECT

            d.id,

            d.fecha,

            d.enfermedad,

            d.sintomas,

            d.observacion,

            t.medicamento,

            t.dosis


        FROM diagnosticos_ave d


        LEFT JOIN tratamientos_ave t

            ON t.diagnostico_id = d.id


        WHERE d.ave_id = ?


        ORDER BY

            d.fecha DESC

        `,
        [
            aveId
        ]
    );

}





export async function actualizarEstadoSaludAve({

    aveId,

    estado

}) {


    const db =
        await getDatabase();



    await db.runAsync(
        `
        UPDATE aves

        SET

            estado_salud = ?,

            fecha_ultimo_control_salud =
                CURRENT_TIMESTAMP


        WHERE id = ?

        `,
        [

            estado,

            aveId

        ]
    );

}
