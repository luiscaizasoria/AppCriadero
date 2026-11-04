import {
    getDatabase
} from '../database/database';



export async function registrarMuerteAve({
    aveId,
    causa,
    detalle
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

                    estado = 'FALLECIDA',

                    fecha_actualizacion = ?

                WHERE id = ?

                `,
                [
                    fecha,

                    aveId
                ]
            );



            await db.runAsync(
                `
                INSERT INTO bajas_ave
                (
                    ave_id,
                    tipo,
                    fecha,
                    causa,
                    detalle
                )

                VALUES
                (
                    ?,
                    ?,
                    ?,
                    ?,
                    ?
                )

                `,
                [
                    aveId,

                    'MUERTE',

                    fecha,

                    causa ||
                    null,

                    detalle ||
                    null
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

                    'MUERTE',

                    fecha,

                    detalle ||
                    'Ave dada de baja por fallecimiento.'
                ]
            );


        }

    );

}



export async function registrarVentaAve({
    aveId,
    fechaVenta,
    celular,
    ciudadDestino,
    cooperativaEnvio,
    comprador,
    valorVenta,
    valorEnvio,
    detalle
}) {

    const db =
        await getDatabase();



    const fecha =
        fechaVenta
        ||
        new Date()
            .toISOString();


    const celularNormalizado =
        normalizarCelular(
            celular
        );


    if(
        !celularNormalizado
    ){

        throw new Error(
            'CELULAR_COMPRADOR_REQUERIDO'
        );

    }


    const valorVentaGuardar =
        numeroNoNegativo(
            valorVenta
        );


    const valorEnvioGuardar =
        numeroNoNegativo(
            valorEnvio
        );



    await db.withTransactionAsync(

        async () => {


            await db.runAsync(
                `
                UPDATE aves

                SET

                    estado = 'VENDIDA',

                    fecha_actualizacion = ?

                WHERE id = ?

                `,
                [
                    fecha,

                    aveId
                ]
            );



            const baja =
                await db.runAsync(
                    `
                    INSERT INTO bajas_ave
                    (
                        ave_id,
                        tipo,
                        fecha,
                        celular,
                        ciudad_destino,
                        cooperativa_envio,
                        comprador,
                        valor_venta,
                        valor_envio,
                        detalle
                    )

                    VALUES
                    (
                        ?,
                        ?,
                        ?,
                        ?,
                        ?,
                        ?,
                        ?,
                        ?,
                        ?,
                        ?
                    )

                    `,
                    [
                        aveId,

                        'VENTA',

                        fecha,

                        celularNormalizado,

                        ciudadDestino ||
                        null,

                        cooperativaEnvio ||
                        null,

                        comprador ||
                        null,

                        valorVentaGuardar,

                        valorEnvioGuardar,

                        detalle ||
                        null
                    ]
                );



            await db.runAsync(
                `
                INSERT INTO movimientos_financieros
                (
                    tipo,
                    categoria,
                    fecha,
                    valor,
                    detalle,
                    ave_id,
                    origen_tipo,
                    origen_id
                )

                VALUES
                (
                    ?,
                    ?,
                    ?,
                    ?,
                    ?,
                    ?,
                    ?,
                    ?
                )

                `,
                [
                    'INGRESO',

                    'VENTA_AVE',

                    fecha,

                    valorVentaGuardar ??
                    0,

                    comprador
                        ? `Venta de ave ${aveId} a ${comprador}`
                        : `Venta de ave ${aveId}`,

                    aveId,

                    'VENTA_AVE',

                    baja.lastInsertRowId
                ]
            );


            await db.runAsync(
                `
                INSERT INTO movimientos_financieros
                (
                    tipo,
                    categoria,
                    fecha,
                    valor,
                    detalle,
                    ave_id,
                    origen_tipo,
                    origen_id
                )
                VALUES
                (?, ?, ?, ?, ?, ?, ?, ?)
                `,
                [
                    'INGRESO',
                    'ENVIO_AVE',
                    fecha,
                    valorEnvioGuardar ?? 0,
                    comprador
                        ? `Envío de venta de ave ${aveId} a ${comprador}`
                        : `Envío de venta de ave ${aveId}`,
                    aveId,
                    'VENTA_AVE',
                    baja.lastInsertRowId
                ]
            );



            const partesHistorial = [
                'Ave vendida.',
                `Celular: ${celularNormalizado}`
            ];


            if(
                comprador
            ){

                partesHistorial.push(
                    `Comprador: ${comprador}`
                );

            }


            if(
                ciudadDestino
            ){

                partesHistorial.push(
                    `Destino: ${ciudadDestino}`
                );

            }


            if(
                detalle
            ){

                partesHistorial.push(
                    detalle
                );

            }



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

                    'VENTA',

                    fecha,

                    partesHistorial.join(' ')
                ]
            );


        }

    );

}



export async function obtenerBajasAve(
    aveId
) {

    const db =
        await getDatabase();



    return await db.getAllAsync(
        `
        SELECT

            id,

            tipo,

            fecha,

            causa,

            celular,

            ciudad_destino,

            cooperativa_envio,

            comprador,

            valor_venta,

            valor_envio,

            detalle


        FROM bajas_ave


        WHERE ave_id = ?


        ORDER BY fecha DESC

        `,
        [
            aveId
        ]
    );

}



function normalizarCelular(
    celular
) {

    let digitos =
        String(
            celular || ''
        )
            .replace(
                /\D/g,
                ''
            );


    if(
        digitos.length === 12
        &&
        digitos.startsWith(
            '593'
        )
    ){

        digitos =
            `0${digitos.slice(3)}`;

    }
    else if(
        digitos.length === 9
        &&
        digitos.startsWith(
            '9'
        )
    ){

        digitos =
            `0${digitos}`;

    }


    return digitos;

}



function numeroNoNegativo(
    valor
) {

    if(
        valor === null
        ||
        valor === undefined
        ||
        String(valor)
            .trim() === ''
    ){

        return null;

    }


    const numero =
        Number(
            valor
        );


    if(
        !Number.isFinite(
            numero
        )
        ||
        numero < 0
    ){

        return null;

    }


    return numero;

}
