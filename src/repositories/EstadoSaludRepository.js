import {
    getDatabase
} from '../database/database';



export async function finalizarTratamiento({
    aveId,
    observacion
}) {

    const db =
        await getDatabase();


    const fecha =
        new Date()
            .toISOString();



    await db.withTransactionAsync(
        async () => {


            await db.runAsync(
                `
                UPDATE aves

                SET

                    estado_salud =
                        'SANA',

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
                UPDATE diagnosticos_ave

                SET

                    estado =
                        'CERRADO'

                WHERE ave_id = ?

                AND estado =
                    'ACTIVO'

                `,
                [
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
                (
                    ?,
                    ?,
                    ?,
                    ?
                )

                `,
                [
                    aveId,

                    'SALUD',

                    fecha,

                    observacion
                        ?
                        `Recuperación registrada: ${observacion}`
                        :
                        'Ave recuperada y tratamiento finalizado.'
                ]
            );


        }
    );

}