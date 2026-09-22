import {
    getDatabase
} from '../database/database';


export async function obtenerReporteAves(){

    const db =
        await getDatabase();

    return await db.getFirstAsync(
        `
        SELECT
            COALESCE(SUM(CASE WHEN estado='ACTIVA' THEN 1 ELSE 0 END), 0) AS activas,
            COALESCE(SUM(CASE WHEN estado='VENDIDA' THEN 1 ELSE 0 END), 0) AS vendidas,
            COALESCE(SUM(CASE WHEN estado='FALLECIDA' THEN 1 ELSE 0 END), 0) AS fallecidas
        FROM aves
        `
    );

}


export async function obtenerReporteSalud(){

    const db =
        await getDatabase();

    const estado =
        await db.getFirstAsync(
            `
            SELECT
                COALESCE(SUM(CASE WHEN estado_salud='EN_TRATAMIENTO' THEN 1 ELSE 0 END), 0) AS tratamiento,
                COALESCE(SUM(CASE WHEN estado_salud='ENFERMA' THEN 1 ELSE 0 END), 0) AS enfermas
            FROM aves
            WHERE estado='ACTIVA'
            `
        );

    const enfermedades =
        await db.getAllAsync(
            `
            SELECT
                enfermedad,
                COUNT(*) AS cantidad
            FROM diagnosticos_ave
            GROUP BY enfermedad
            ORDER BY cantidad DESC
            LIMIT 5
            `
        );

    return {
        estado,
        enfermedades
    };

}


export async function obtenerReporteProduccion(){

    const db =
        await getDatabase();

    const huevos =
        await db.getFirstAsync(
            `
            SELECT
                COALESCE(SUM(CASE WHEN date(fecha)=date('now') THEN 1 ELSE 0 END), 0) AS hoy,
                COALESCE(SUM(CASE WHEN strftime('%Y-%m',fecha)=strftime('%Y-%m','now') THEN 1 ELSE 0 END), 0) AS mes
            FROM huevos
            `
        );

    const mejor =
        await db.getFirstAsync(
            `
            SELECT
                a.codigo,
                COUNT(h.id) AS cantidad
            FROM huevos h
            INNER JOIN aves a
                ON a.id=h.ave_id
            GROUP BY a.id, a.codigo
            ORDER BY cantidad DESC
            LIMIT 1
            `
        );

    return {
        huevos,
        mejor
    };

}


export async function obtenerReporteFinanzas(){

    const db =
        await getDatabase();

    const resultado =
        await db.getFirstAsync(
            `
            SELECT
                COALESCE(SUM(CASE WHEN tipo='INGRESO' THEN valor ELSE 0 END), 0) AS ingresos,
                COALESCE(SUM(CASE WHEN tipo='EGRESO' THEN valor ELSE 0 END), 0) AS egresos
            FROM movimientos_financieros
            `
        );

    return {
        ingresos:Number(resultado?.ingresos || 0),
        egresos:Number(resultado?.egresos || 0),
        utilidad:
            Number(resultado?.ingresos || 0)
            -
            Number(resultado?.egresos || 0)
    };

}


export async function obtenerExportacionAves(){

    const db =
        await getDatabase();

    return await db.getAllAsync(
        `
        SELECT
            a.codigo AS Codigo,
            a.raza AS Raza,
            a.sexo AS Sexo,
            a.estado AS Estado,
            a.estado_salud AS EstadoSalud,
            a.fecha_nacimiento AS FechaNacimiento,
            a.peso_gramos AS PesoGramos,
            a.altura_cm AS AlturaCm,
            a.largo_cm AS LargoCm,
            p.codigo AS Padre,
            m.codigo AS Madre,
            j.codigo AS Jaula,
            a.origen AS Origen,
            a.caracteristicas AS Caracteristicas
        FROM aves a
        LEFT JOIN aves p
            ON p.id = a.padre_id
        LEFT JOIN aves m
            ON m.id = a.madre_id
        LEFT JOIN jaulas j
            ON j.id = a.jaula_actual_id
        ORDER BY a.codigo
        `
    );

}


export async function obtenerExportacionVentas(){

    const db =
        await getDatabase();

    return await db.getAllAsync(
        `
        SELECT
            a.codigo AS Ave,
            b.fecha AS Fecha,
            b.celular AS Celular,
            b.comprador AS Nombre,
            b.ciudad_destino AS CiudadDestino,
            b.cooperativa_envio AS Cooperativa,
            b.valor_venta AS ValorAve,
            b.valor_envio AS ValorEnvio,
            b.detalle AS Detalle
        FROM bajas_ave b
        INNER JOIN aves a
            ON a.id = b.ave_id
        WHERE b.tipo = 'VENTA'
        ORDER BY b.fecha DESC
        `
    );

}


export async function obtenerExportacionClientes(){

    const db =
        await getDatabase();

    return await db.getAllAsync(
        `
        SELECT
            b.celular AS Celular,
            MAX(NULLIF(TRIM(b.comprador), '')) AS Nombre,
            MAX(NULLIF(TRIM(b.ciudad_destino), '')) AS Ciudad,
            COUNT(*) AS Compras,
            COALESCE(SUM(b.valor_venta), 0) AS TotalAves,
            COALESCE(SUM(b.valor_envio), 0) AS TotalEnvios,
            MAX(b.fecha) AS UltimaCompra
        FROM bajas_ave b
        WHERE b.tipo = 'VENTA'
        AND b.celular IS NOT NULL
        AND TRIM(b.celular) <> ''
        GROUP BY b.celular
        ORDER BY UltimaCompra DESC
        `
    );

}


export async function obtenerExportacionFinanzas(){

    const db =
        await getDatabase();

    return await db.getAllAsync(
        `
        SELECT
            mf.fecha AS Fecha,
            mf.tipo AS Tipo,
            mf.categoria AS Categoria,
            mf.valor AS Valor,
            mf.detalle AS Detalle,
            a.codigo AS Ave,
            mf.origen_tipo AS Origen,
            mf.origen_id AS OrigenId
        FROM movimientos_financieros mf
        LEFT JOIN aves a
            ON a.id = mf.ave_id
        ORDER BY mf.fecha DESC, mf.id DESC
        `
    );

}


export async function obtenerExportacionHuevos(){

    const db =
        await getDatabase();

    return await db.getAllAsync(
        `
        SELECT
            h.codigo AS Codigo,
            h.fecha AS Fecha,
            a.codigo AS Ave,
            j.codigo AS Jaula,
            h.estado AS Estado,
            h.observacion AS Observacion
        FROM huevos h
        LEFT JOIN aves a
            ON a.id = h.ave_id
        LEFT JOIN jaulas j
            ON j.id = h.jaula_id
        ORDER BY h.fecha DESC, h.id DESC
        `
    );

}


export async function obtenerExportacionJaulas(){

    const db =
        await getDatabase();

    return await db.getAllAsync(
        `
        SELECT
            j.codigo AS Codigo,
            j.nombre AS Nombre,
            j.ubicacion AS Ubicacion,
            j.tipo AS Tipo,
            j.estado_sanitario AS EstadoSanitario,
            CASE WHEN j.activa = 1 THEN 'ACTIVA' ELSE 'INACTIVA' END AS Estado,
            j.fecha_creacion AS FechaCreacion,
            j.fecha_desactivacion AS FechaDesactivacion
        FROM jaulas j
        ORDER BY j.codigo
        `
    );

}
