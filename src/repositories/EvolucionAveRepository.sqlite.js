import {
    getDatabase
} from '../database/database';


export async function obtenerEvolucionAve(
    aveId
) {

    const db =
        await getDatabase();


    return await db.getAllAsync(
        `
        SELECT
            id,
            ave_id,
            fecha,
            foto_uri,
            peso_gramos,
            altura_cm,
            largo_cm,
            caracteristicas,
            observacion,
            fecha_creacion

        FROM ave_evolucion

        WHERE ave_id = ?

        ORDER BY
            fecha DESC,
            id DESC
        `,
        [
            aveId
        ]
    );

}


export async function registrarEvolucionAve({
    aveId,
    fotoUri,
    pesoGramos,
    alturaCm,
    largoCm,
    caracteristicas,
    observacion
}) {

    const db =
        await getDatabase();


    const fechaActual =
        new Date()
            .toISOString();


    await db.withTransactionAsync(
        async () => {

            const aveActual =
                await db.getFirstAsync(
                    `
                    SELECT
                        id,
                        codigo,
                        foto_uri,
                        peso_gramos,
                        altura_cm,
                        largo_cm,
                        caracteristicas,
                        jaula_actual_id,
                        fecha_creacion,
                        fecha_actualizacion

                    FROM aves

                    WHERE id = ?
                    `,
                    [
                        aveId
                    ]
                );


            if (!aveActual) {

                throw new Error(
                    'AVE_NO_ENCONTRADA'
                );

            }


            const totalResult =
                await db.getFirstAsync(
                    `
                    SELECT
                        COUNT(*) AS total

                    FROM ave_evolucion

                    WHERE ave_id = ?
                    `,
                    [
                        aveId
                    ]
                );


            const total =
                Number(
                    totalResult?.total || 0
                );


            if (total === 0) {

                await db.runAsync(
                    `
                    INSERT INTO ave_evolucion
                    (
                        ave_id,
                        fecha,
                        foto_uri,
                        peso_gramos,
                        altura_cm,
                        largo_cm,
                        caracteristicas,
                        observacion
                    )
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
                    `,
                    [
                        aveId,

                        aveActual
                            .fecha_creacion
                        ||
                        fechaActual,

                        aveActual
                            .foto_uri
                        ||
                        null,

                        numeroOActual(
                            undefined,
                            aveActual.peso_gramos
                        ),

                        numeroOActual(
                            undefined,
                            aveActual.altura_cm
                        ),

                        numeroOActual(
                            undefined,
                            aveActual.largo_cm
                        ),

                        aveActual
                            .caracteristicas
                        ||
                        null,

                        'Registro inicial'
                    ]
                );

            }


            const pesoFinal =
                numeroOActual(
                    pesoGramos,
                    aveActual.peso_gramos
                );


            const alturaFinal =
                numeroOActual(
                    alturaCm,
                    aveActual.altura_cm
                );


            const largoFinal =
                numeroOActual(
                    largoCm,
                    aveActual.largo_cm
                );


            await db.runAsync(
                `
                UPDATE aves

                SET
                    foto_uri = ?,
                    peso_gramos = ?,
                    altura_cm = ?,
                    largo_cm = ?,
                    caracteristicas = ?,
                    fecha_actualizacion =
                        CURRENT_TIMESTAMP

                WHERE id = ?
                `,
                [
                    fotoUri ||
                        null,

                    pesoFinal,

                    alturaFinal,

                    largoFinal,

                    caracteristicas ||
                        null,

                    aveId
                ]
            );


            await db.runAsync(
                `
                INSERT INTO ave_evolucion
                (
                    ave_id,
                    fecha,
                    foto_uri,
                    peso_gramos,
                    altura_cm,
                    largo_cm,
                    caracteristicas,
                    observacion
                )
                VALUES (?, ?, ?, ?, ?, ?, ?, ?)
                `,
                [
                    aveId,

                    fechaActual,

                    fotoUri ||
                        null,

                    pesoFinal,

                    alturaFinal,

                    largoFinal,

                    caracteristicas ||
                        null,

                    observacion ||
                        null
                ]
            );


            const cambios = [];


            if (
                fueMedidaInformada(
                    pesoGramos
                )
                &&
                !numerosIguales(
                    aveActual.peso_gramos,
                    pesoFinal
                )
            ) {

                cambios.push(
                    `Peso: ${formatearMedida(aveActual.peso_gramos, 'g')} → ${formatearMedida(pesoFinal, 'g')}`
                );

            }


            if (
                fueMedidaInformada(
                    alturaCm
                )
                &&
                !numerosIguales(
                    aveActual.altura_cm,
                    alturaFinal
                )
            ) {

                cambios.push(
                    `Altura: ${formatearMedida(aveActual.altura_cm, 'cm')} → ${formatearMedida(alturaFinal, 'cm')}`
                );

            }


            if (
                fueMedidaInformada(
                    largoCm
                )
                &&
                !numerosIguales(
                    aveActual.largo_cm,
                    largoFinal
                )
            ) {

                cambios.push(
                    `Largo: ${formatearMedida(aveActual.largo_cm, 'cm')} → ${formatearMedida(largoFinal, 'cm')}`
                );

            }


            if (
                normalizarTexto(
                    aveActual.foto_uri
                )
                !==
                normalizarTexto(
                    fotoUri
                )
            ) {

                cambios.push(
                    'Fotografía actualizada'
                );

            }


            if (
                normalizarTexto(
                    aveActual.caracteristicas
                )
                !==
                normalizarTexto(
                    caracteristicas
                )
            ) {

                cambios.push(
                    'Características actualizadas'
                );

            }


            let detalle =
                cambios.length > 0
                    ? `Evolución registrada. ${cambios.join('. ')}.`
                    : 'Se actualizó la evolución del ave.';


            if (
                observacion
                &&
                String(observacion)
                    .trim()
            ) {

                detalle +=
                    ` ${String(observacion).trim()}`;

            }


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

                    aveActual.jaula_actual_id ||
                        null,

                    'EVOLUCION',

                    fechaActual,

                    detalle
                ]
            );

        }
    );

}


function fueMedidaInformada(
    valor
) {

    return !(
        valor === undefined
        ||
        valor === null
        ||
        String(valor)
            .trim() === ''
    );

}


function numeroOActual(
    nuevoValor,
    valorActual
) {

    if (
        !fueMedidaInformada(
            nuevoValor
        )
    ) {

        return valorActual === null
            ||
            valorActual === undefined

            ? null

            : Number(valorActual);

    }


    const numero =
        Number(
            String(nuevoValor)
                .replace(',', '.')
        );


    return Number.isFinite(
        numero
    )
        ? numero
        : (
            valorActual === null
            ||
            valorActual === undefined

                ? null
                : Number(valorActual)
        );

}


function numerosIguales(
    a,
    b
) {

    const aVacio =
        a === null
        ||
        a === undefined
        ||
        a === '';


    const bVacio =
        b === null
        ||
        b === undefined
        ||
        b === '';


    if (
        aVacio
        &&
        bVacio
    ) {

        return true;

    }


    return Number(a) === Number(b);

}


function formatearMedida(
    valor,
    unidad
) {

    if (
        valor === null
        ||
        valor === undefined
        ||
        valor === ''
    ) {

        return 'No registrado';

    }


    return `${Number(valor)} ${unidad}`;

}


function normalizarTexto(
    valor
) {

    return String(
        valor || ''
    )
        .trim();

}
