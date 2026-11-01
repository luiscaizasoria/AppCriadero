import {
    getDatabase
} from '../database/database';


export async function obtenerCicloVidaAve(
    aveId
) {

    const db =
        await getDatabase();


    const ave =
        await db.getFirstAsync(
            `
            SELECT
                id,
                codigo,
                origen,
                fecha_nacimiento,
                fecha_ingreso,
                fecha_creacion,
                estado
            FROM aves
            WHERE id = ?
            `,
            [
                aveId
            ]
        );


    if (!ave) {

        return [];

    }


    const historial =
        await db.getAllAsync(
            `
            SELECT
                h.id,
                h.tipo_evento,
                h.fecha,
                h.detalle,
                h.jaula_id,
                j.codigo AS jaula_codigo
            FROM ave_historial h
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


    const evoluciones =
        await db.getAllAsync(
            `
            SELECT
                id,
                fecha,
                foto_uri,
                peso_gramos,
                altura_cm,
                largo_cm,
                caracteristicas,
                observacion
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


    const diagnosticos =
        await db.getAllAsync(
            `
            SELECT
                d.id AS diagnostico_id,
                d.fecha,
                d.enfermedad,
                d.sintomas,
                d.observacion AS diagnostico_observacion,
                d.estado AS diagnostico_estado,
                t.medicamento,
                t.dosis,
                t.observacion AS tratamiento_observacion
            FROM diagnosticos_ave d
            LEFT JOIN tratamientos_ave t
                ON t.diagnostico_id = d.id
            WHERE d.ave_id = ?
            ORDER BY
                d.fecha DESC,
                d.id DESC
            `,
            [
                aveId
            ]
        );


    const huevos =
        await db.getAllAsync(
            `
            SELECT
                date(h.fecha) AS fecha_dia,
                MIN(h.fecha) AS fecha,
                COUNT(*) AS cantidad,
                GROUP_CONCAT(h.codigo, ', ') AS codigos
            FROM huevos h
            WHERE h.ave_id = ?
            GROUP BY date(h.fecha)
            ORDER BY fecha_dia DESC
            `,
            [
                aveId
            ]
        );


    const bajas =
        await db.getAllAsync(
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
            ORDER BY
                fecha DESC,
                id DESC
            `,
            [
                aveId
            ]
        );


    const eventos = [];


    if (
        ave.origen === 'COMPRADA'
        &&
        ave.fecha_ingreso
    ) {

        eventos.push({
            id: `llegada-${ave.id}`,
            tipo: 'LLEGADA',
            fecha: ave.fecha_ingreso,
            titulo: 'Llegada al criadero',
            detalle: 'El ave ingresó al criadero.'
        });

    }
    else if (
        ave.fecha_nacimiento
    ) {

        eventos.push({
            id: `nacimiento-${ave.id}`,
            tipo: 'NACIMIENTO',
            fecha: ave.fecha_nacimiento,
            titulo: 'Nacimiento',
            detalle: 'Fecha de nacimiento registrada para el ave.'
        });

    }


    for (
        const item
        of historial
    ) {

        const tipo =
            String(
                item.tipo_evento || ''
            )
                .toUpperCase();


        if (
            tipo === 'SALUD'
            ||
            tipo === 'POSTURA_HUEVO'
            ||
            tipo === 'EVOLUCION'
            ||
            tipo === 'VENTA'
            ||
            tipo === 'MUERTE'
            ||
            tipo === 'BAJA'
        ) {

            continue;

        }


        eventos.push({
            id: `hist-${item.id}`,
            tipo: tipo || 'HISTORIAL',
            fecha: item.fecha,
            titulo:
                obtenerTituloHistorial(
                    tipo
                ),
            detalle:
                item.detalle ||
                'Actualización registrada.',
            jaulaCodigo:
                item.jaula_codigo ||
                null
        });

    }


    const evolucionesCronologicas =
        [
            ...evoluciones
        ]
            .sort(
                (a, b) =>
                    obtenerTimestamp(
                        a.fecha
                    )
                    -
                    obtenerTimestamp(
                        b.fecha
                    )
            );


    let evolucionAnterior =
        null;


    for (
        const item
        of evolucionesCronologicas
    ) {

        const observacion =
            String(
                item.observacion || ''
            )
                .trim();


        if (
            observacion.toLowerCase()
            ===
            'registro inicial'
        ) {

            evolucionAnterior =
                item;

            continue;

        }


        const detalleEvolucion = [];


        agregarCambioMedida(
            detalleEvolucion,
            'Peso',
            evolucionAnterior?.peso_gramos,
            item.peso_gramos,
            'g'
        );


        agregarCambioMedida(
            detalleEvolucion,
            'Altura',
            evolucionAnterior?.altura_cm,
            item.altura_cm,
            'cm'
        );


        agregarCambioMedida(
            detalleEvolucion,
            'Largo',
            evolucionAnterior?.largo_cm,
            item.largo_cm,
            'cm'
        );


        if (
            normalizarTexto(
                evolucionAnterior?.foto_uri
            )
            !==
            normalizarTexto(
                item.foto_uri
            )
        ) {

            detalleEvolucion.push(
                'Fotografía actualizada.'
            );

        }


        if (
            normalizarTexto(
                evolucionAnterior?.caracteristicas
            )
            !==
            normalizarTexto(
                item.caracteristicas
            )
            &&
            item.caracteristicas
        ) {

            detalleEvolucion.push(
                `Características: ${item.caracteristicas}`
            );

        }


        if (
            observacion
        ) {

            detalleEvolucion.push(
                `Observación: ${observacion}`
            );

        }


        eventos.push({
            id: `evolucion-${item.id}`,
            tipo: 'EVOLUCION',
            fecha: item.fecha,
            titulo: 'Evolución registrada',
            detalle:
                detalleEvolucion.length > 0
                    ? detalleEvolucion.join('\n')
                    : 'Se actualizó la evolución del ave.',
            fotoUri:
                item.foto_uri ||
                null,
            caracteristicas:
                item.caracteristicas ||
                null
        });


        evolucionAnterior =
            item;

    }



    const diagnosticosAgrupados =
        new Map();


    for (
        const item
        of diagnosticos
    ) {

        if (
            !diagnosticosAgrupados.has(
                item.diagnostico_id
            )
        ) {

            diagnosticosAgrupados.set(
                item.diagnostico_id,
                {
                    id:
                        item.diagnostico_id,
                    fecha:
                        item.fecha,
                    enfermedad:
                        item.enfermedad,
                    sintomas:
                        item.sintomas,
                    observacion:
                        item.diagnostico_observacion,
                    estado:
                        item.diagnostico_estado,
                    tratamientos: []
                }
            );

        }


        if (
            item.medicamento
            ||
            item.dosis
            ||
            item.tratamiento_observacion
        ) {

            diagnosticosAgrupados
                .get(
                    item.diagnostico_id
                )
                .tratamientos
                .push({
                    medicamento:
                        item.medicamento,
                    dosis:
                        item.dosis,
                    observacion:
                        item.tratamiento_observacion
                });

        }

    }


    for (
        const item
        of diagnosticosAgrupados.values()
    ) {

        const partes = [];


        if (
            item.sintomas
        ) {

            partes.push(
                `Síntomas: ${item.sintomas}`
            );

        }


        if (
            item.observacion
        ) {

            partes.push(
                `Observación: ${item.observacion}`
            );

        }


        for (
            const tratamiento
            of item.tratamientos
        ) {

            if (
                tratamiento.medicamento
            ) {

                let texto =
                    `Medicamento: ${tratamiento.medicamento}`;


                if (
                    tratamiento.dosis
                ) {

                    texto +=
                        ` · Dosis: ${tratamiento.dosis}`;

                }


                partes.push(
                    texto
                );

            }

        }


        eventos.push({
            id: `salud-${item.id}`,
            tipo: 'SALUD',
            fecha: item.fecha,
            titulo:
                item.enfermedad
                    ? `Diagnóstico: ${item.enfermedad}`
                    : 'Diagnóstico de salud',
            detalle:
                partes.length > 0
                    ? partes.join('\n')
                    : 'Se registró un diagnóstico de salud.'
        });

    }


    for (
        const item
        of huevos
    ) {

        const cantidad =
            Number(
                item.cantidad || 0
            );


        eventos.push({
            id: `huevos-${item.fecha_dia}`,
            tipo: 'POSTURA_HUEVO',
            fecha: item.fecha,
            titulo:
                cantidad === 1
                    ? 'Huevo registrado'
                    : `${cantidad} huevos registrados`,
            detalle:
                item.codigos
                    ? `Códigos: ${item.codigos}`
                    : null
        });

    }


    for (
        const item
        of bajas
    ) {

        if (
            item.tipo === 'VENTA'
        ) {

            const detalleVenta = [];


            if (
                item.comprador
            ) {

                detalleVenta.push(
                    `Comprador: ${item.comprador}`
                );

            }


            if (
                item.celular
            ) {

                detalleVenta.push(
                    `Celular: ${item.celular}`
                );

            }


            if (
                item.ciudad_destino
            ) {

                detalleVenta.push(
                    `Destino: ${item.ciudad_destino}`
                );

            }


            if (
                item.cooperativa_envio
            ) {

                detalleVenta.push(
                    `Cooperativa: ${item.cooperativa_envio}`
                );

            }


            if (
                item.valor_venta !== null
                &&
                item.valor_venta !== undefined
            ) {

                detalleVenta.push(
                    `Valor: $${Number(item.valor_venta).toFixed(2)}`
                );

            }


            if (
                item.valor_envio !== null
                &&
                item.valor_envio !== undefined
            ) {

                detalleVenta.push(
                    `Envío: $${Number(item.valor_envio).toFixed(2)}`
                );

            }


            if (
                item.detalle
            ) {

                detalleVenta.push(
                    item.detalle
                );

            }


            eventos.push({
                id: `venta-${item.id}`,
                tipo: 'VENTA',
                fecha: item.fecha,
                titulo: 'Ave vendida',
                detalle:
                    detalleVenta.length > 0
                        ? detalleVenta.join('\n')
                        : 'El ave fue registrada como vendida.'
            });

        }
        else if (
            item.tipo === 'MUERTE'
        ) {

            const detalleMuerte = [];


            if (
                item.causa
            ) {

                detalleMuerte.push(
                    `Causa: ${item.causa}`
                );

            }


            if (
                item.detalle
            ) {

                detalleMuerte.push(
                    item.detalle
                );

            }


            eventos.push({
                id: `muerte-${item.id}`,
                tipo: 'MUERTE',
                fecha: item.fecha,
                titulo: 'Fallecimiento',
                detalle:
                    detalleMuerte.length > 0
                        ? detalleMuerte.join('\n')
                        : 'El ave fue registrada como fallecida.'
            });

        }

    }


    eventos.sort(
        (a, b) =>
            obtenerTimestamp(
                b.fecha
            )
            -
            obtenerTimestamp(
                a.fecha
            )
    );


    return eventos;

}


export async function registrarEventoCicloVida({
    aveId,
    tipoEvento,
    detalle,
    fecha = null
}) {

    const db =
        await getDatabase();


    const fechaEvento =
        fecha ||
        new Date()
            .toISOString();


    await db.runAsync(
        `
        INSERT INTO ave_historial
        (
            ave_id,
            tipo_evento,
            fecha,
            detalle
        )
        VALUES (?, ?, ?, ?)
        `,
        [
            aveId,
            tipoEvento,
            fechaEvento,
            detalle || null
        ]
    );

}


function agregarCambioMedida(
    destino,
    label,
    anterior,
    actual,
    unidad
) {

    const anteriorVacio =
        anterior === null
        ||
        anterior === undefined
        ||
        anterior === '';


    const actualVacio =
        actual === null
        ||
        actual === undefined
        ||
        actual === '';


    if (
        anteriorVacio
        &&
        actualVacio
    ) {

        return;

    }


    if (
        !anteriorVacio
        &&
        !actualVacio
        &&
        Number(anterior) === Number(actual)
    ) {

        return;

    }


    if (
        anteriorVacio
        &&
        !actualVacio
    ) {

        destino.push(
            `${label}: ${Number(actual)} ${unidad}`
        );

        return;

    }


    if (
        !anteriorVacio
        &&
        actualVacio
    ) {

        destino.push(
            `${label}: ${Number(anterior)} ${unidad} → sin dato`
        );

        return;

    }


    destino.push(
        `${label}: ${Number(anterior)} ${unidad} → ${Number(actual)} ${unidad}`
    );

}


function normalizarTexto(
    valor
) {

    return String(
        valor || ''
    )
        .trim();

}


function obtenerTituloHistorial(
    tipo
) {

    switch (
        tipo
    ) {

        case 'ALTA':

            return 'Registro inicial';


        case 'CAMBIO_JAULA':

            return 'Cambio de jaula';


        case 'DATOS_ACTUALIZADOS':

            return 'Datos actualizados';


        case 'RECUPERACION':

            return 'Ave recuperada';


        default:

            return 'Actualización';

    }

}


function obtenerTimestamp(
    fecha
) {

    if (!fecha) {

        return 0;

    }


    const texto =
        String(
            fecha
        )
            .trim()
            .replace(
                ' ',
                'T'
            );


    const fechaNormalizada =
        /^\d{4}-\d{2}-\d{2}$/.test(
            texto
        )
            ? `${texto}T00:00:00`
            : texto;


    const valor =
        Date.parse(
            fechaNormalizada
        );


    return Number.isFinite(
        valor
    )
        ? valor
        : 0;

}
