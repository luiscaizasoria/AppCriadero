import {
    getDatabase
} from '../database/database';



export async function obtenerClientes() {

    const db =
        await getDatabase();


    return await db.getAllAsync(
        `
        SELECT

            b.celular,

            COALESCE(
                (
                    SELECT b2.comprador
                    FROM bajas_ave b2
                    WHERE
                        b2.tipo = 'VENTA'
                        AND b2.celular = b.celular
                        AND TRIM(
                            COALESCE(
                                b2.comprador,
                                ''
                            )
                        ) <> ''
                    ORDER BY
                        b2.fecha DESC,
                        b2.id DESC
                    LIMIT 1
                ),
                'Sin nombre'
            ) AS nombre,

            COALESCE(
                (
                    SELECT b3.ciudad_destino
                    FROM bajas_ave b3
                    WHERE
                        b3.tipo = 'VENTA'
                        AND b3.celular = b.celular
                        AND TRIM(
                            COALESCE(
                                b3.ciudad_destino,
                                ''
                            )
                        ) <> ''
                    ORDER BY
                        b3.fecha DESC,
                        b3.id DESC
                    LIMIT 1
                ),
                ''
            ) AS ciudad,

            COUNT(*) AS total_compras,

            COALESCE(
                SUM(
                    b.valor_venta
                ),
                0
            ) AS total_ventas,

            COALESCE(
                SUM(
                    b.valor_envio
                ),
                0
            ) AS total_envios,

            MAX(
                b.fecha
            ) AS ultima_compra

        FROM bajas_ave b

        WHERE
            b.tipo = 'VENTA'
            AND b.celular IS NOT NULL
            AND TRIM(b.celular) <> ''

        GROUP BY
            b.celular

        ORDER BY
            ultima_compra DESC,
            b.celular ASC
        `
    );

}



export async function obtenerClientePorCelular(
    celular
) {

    const db =
        await getDatabase();


    return await db.getFirstAsync(
        `
        SELECT

            b.celular,

            COALESCE(
                (
                    SELECT b2.comprador
                    FROM bajas_ave b2
                    WHERE
                        b2.tipo = 'VENTA'
                        AND b2.celular = b.celular
                        AND TRIM(
                            COALESCE(
                                b2.comprador,
                                ''
                            )
                        ) <> ''
                    ORDER BY
                        b2.fecha DESC,
                        b2.id DESC
                    LIMIT 1
                ),
                'Sin nombre'
            ) AS nombre,

            COALESCE(
                (
                    SELECT b3.ciudad_destino
                    FROM bajas_ave b3
                    WHERE
                        b3.tipo = 'VENTA'
                        AND b3.celular = b.celular
                        AND TRIM(
                            COALESCE(
                                b3.ciudad_destino,
                                ''
                            )
                        ) <> ''
                    ORDER BY
                        b3.fecha DESC,
                        b3.id DESC
                    LIMIT 1
                ),
                ''
            ) AS ciudad,

            COUNT(*) AS total_compras,

            COALESCE(
                SUM(
                    b.valor_venta
                ),
                0
            ) AS total_ventas,

            COALESCE(
                SUM(
                    b.valor_envio
                ),
                0
            ) AS total_envios,

            MAX(
                b.fecha
            ) AS ultima_compra

        FROM bajas_ave b

        WHERE
            b.tipo = 'VENTA'
            AND b.celular = ?

        GROUP BY
            b.celular
        `,
        [
            celular
        ]
    );

}



export async function obtenerComprasCliente(
    celular
) {

    const db =
        await getDatabase();


    return await db.getAllAsync(
        `
        SELECT

            b.id AS venta_id,
            b.fecha,
            b.celular,
            b.comprador,
            b.ciudad_destino,
            b.cooperativa_envio,
            b.valor_venta,
            b.valor_envio,
            b.detalle,

            a.id AS ave_id,
            a.codigo AS ave_codigo,
            a.raza AS ave_raza,
            a.sexo AS ave_sexo,
            a.foto_uri AS ave_foto_uri

        FROM bajas_ave b

        INNER JOIN aves a
            ON a.id = b.ave_id

        WHERE
            b.tipo = 'VENTA'
            AND b.celular = ?

        ORDER BY
            b.fecha DESC,
            b.id DESC
        `,
        [
            celular
        ]
    );

}
