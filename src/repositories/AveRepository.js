import {
    getDatabase
} from '../database/database';


export async function obtenerAves() {

    const db =
        await getDatabase();


    return await db.getAllAsync(
        `
        SELECT
            a.id,
            a.codigo,
            a.origen,
            a.fecha_nacimiento,
            a.edad_meses_compra,
            a.fecha_ingreso,
            a.criadero_origen,
            a.metodo_envio,
            a.raza,
            a.sexo,
            a.peso_gramos,
            a.altura_cm,
            a.largo_cm,
            a.caracteristicas,
            a.foto_uri,
            a.padre_id,
            a.madre_id,
            a.jaula_actual_id,
            a.estado,
            a.estado_salud,
            a.fecha_creacion,

            j.codigo AS jaula_codigo,
            j.nombre AS jaula_nombre,

            p.codigo AS padre_codigo,
            m.codigo AS madre_codigo

        FROM aves a

        LEFT JOIN jaulas j
            ON j.id = a.jaula_actual_id

        LEFT JOIN aves p
            ON p.id = a.padre_id

        LEFT JOIN aves m
            ON m.id = a.madre_id

        WHERE a.estado = 'ACTIVA'

        ORDER BY a.codigo
        `
    );

}

export async function obtenerAvesPorJaula(
    jaulaId
) {

    const db =
        await getDatabase();


    return await db.getAllAsync(
        `
        SELECT
            a.id,
            a.codigo,
            a.origen,
            a.fecha_nacimiento,
            a.raza,
            a.caracteristicas,
            a.foto_uri,
            a.jaula_actual_id,
            a.estado

        FROM aves a

        WHERE
            a.estado = 'ACTIVA'
            AND a.jaula_actual_id = ?

        ORDER BY a.codigo
        `,
        [
            jaulaId
        ]
    );

}


export async function obtenerAvesParaAsignarJaula(
    jaulaId
) {

    const db =
        await getDatabase();


    return await db.getAllAsync(
        `
        SELECT
            a.id,
            a.codigo,
            a.raza,
            a.foto_uri,
            a.jaula_actual_id,
            j.codigo AS jaula_codigo

        FROM aves a

        LEFT JOIN jaulas j
            ON j.id = a.jaula_actual_id

        WHERE
            a.estado = 'ACTIVA'
            AND
            (
                a.jaula_actual_id IS NULL
                OR a.jaula_actual_id <> ?
            )

        ORDER BY a.codigo
        `,
        [
            jaulaId
        ]
    );

}


export async function obtenerAvePorId(
    id
) {

    const db =
        await getDatabase();


    return await db.getFirstAsync(
        `
        SELECT
            a.*,

            j.codigo AS jaula_codigo,

            j.nombre AS jaula_nombre,

            p.codigo AS padre_codigo,

            m.codigo AS madre_codigo

        FROM aves a

        LEFT JOIN jaulas j
            ON j.id = a.jaula_actual_id

        LEFT JOIN aves p
            ON p.id = a.padre_id

        LEFT JOIN aves m
            ON m.id = a.madre_id

        WHERE a.id = ?
        `,
        [
            id
        ]
    );

}


export async function obtenerAvesActivasParaPadres(
    aveIdActual = null
) {

    const db =
        await getDatabase();


    const aves =
        await db.getAllAsync(
            `
            SELECT
                id,
                codigo,
                raza,
                sexo

            FROM aves

            WHERE estado = 'ACTIVA'

            ORDER BY codigo
            `
        );


    if (!aveIdActual) {

        return aves;

    }


    const relaciones =
        await db.getAllAsync(
            `
            SELECT
                id,
                padre_id,
                madre_id

            FROM aves
            `
        );


    const idsDescendientes =
        obtenerIdsDescendientesRelaciones(
            relaciones,
            Number(
                aveIdActual
            )
        );


    return aves.filter(
        item => {

            const id =
                Number(
                    item.id
                );


            return (
                id !==
                Number(
                    aveIdActual
                )
                &&
                !idsDescendientes.has(
                    id
                )
            );

        }
    );

}


function obtenerIdsDescendientesRelaciones(
    relaciones,
    aveId
) {

    const hijosPorPadre =
        new Map();


    for (
        const item
        of relaciones
    ) {

        for (
            const parentId
            of [
                item.padre_id,
                item.madre_id
            ]
        ) {

            if (
                parentId === null
                ||
                parentId === undefined
            ) {

                continue;

            }


            const key =
                Number(
                    parentId
                );


            if (
                !hijosPorPadre.has(
                    key
                )
            ) {

                hijosPorPadre.set(
                    key,
                    []
                );

            }


            hijosPorPadre
                .get(
                    key
                )
                .push(
                    Number(
                        item.id
                    )
                );

        }

    }


    const visitados =
        new Set();


    const pendientes =
        [
            Number(
                aveId
            )
        ];


    while (
        pendientes.length > 0
    ) {

        const actual =
            pendientes.shift();


        const hijos =
            hijosPorPadre.get(
                actual
            )
            ||
            [];


        for (
            const hijoId
            of hijos
        ) {

            if (
                hijoId ===
                Number(
                    aveId
                )
                ||
                visitados.has(
                    hijoId
                )
            ) {

                continue;

            }


            visitados.add(
                hijoId
            );


            pendientes.push(
                hijoId
            );

        }

    }


    return visitados;

}


async function validarRelacionPadres({
    db,
    aveId = null,
    padreId = null,
    madreId = null
}) {

    const idAve =
        aveId === null
        ||
        aveId === undefined
            ? null
            : Number(
                aveId
            );


    const idPadre =
        padreId
            ? Number(
                padreId
            )
            : null;


    const idMadre =
        madreId
            ? Number(
                madreId
            )
            : null;


    if (
        idAve
        &&
        idPadre === idAve
    ) {

        throw new Error(
            'PADRE_ES_MISMA_AVE'
        );

    }


    if (
        idAve
        &&
        idMadre === idAve
    ) {

        throw new Error(
            'MADRE_ES_MISMA_AVE'
        );

    }


    if (
        idPadre
        &&
        idMadre
        &&
        idPadre === idMadre
    ) {

        throw new Error(
            'PADRES_IGUALES'
        );

    }


    if (idPadre) {

        const padre =
            await db.getFirstAsync(
                `
                SELECT
                    id,
                    codigo,
                    sexo

                FROM aves

                WHERE id = ?
                `,
                [
                    idPadre
                ]
            );


        if (!padre) {

            throw new Error(
                'PADRE_NO_ENCONTRADO'
            );

        }


        if (
            padre.sexo
            &&
            padre.sexo !==
            'MACHO'
        ) {

            throw new Error(
                'PADRE_NO_MACHO'
            );

        }

    }


    if (idMadre) {

        const madre =
            await db.getFirstAsync(
                `
                SELECT
                    id,
                    codigo,
                    sexo

                FROM aves

                WHERE id = ?
                `,
                [
                    idMadre
                ]
            );


        if (!madre) {

            throw new Error(
                'MADRE_NO_ENCONTRADA'
            );

        }


        if (
            madre.sexo
            &&
            madre.sexo !==
            'HEMBRA'
        ) {

            throw new Error(
                'MADRE_NO_HEMBRA'
            );

        }

    }


    if (!idAve) {

        return;

    }


    const relaciones =
        await db.getAllAsync(
            `
            SELECT
                id,
                padre_id,
                madre_id

            FROM aves
            `
        );


    const descendientes =
        obtenerIdsDescendientesRelaciones(
            relaciones,
            idAve
        );


    if (
        idPadre
        &&
        descendientes.has(
            idPadre
        )
    ) {

        throw new Error(
            'PARENTESCO_CIRCULAR_PADRE'
        );

    }


    if (
        idMadre
        &&
        descendientes.has(
            idMadre
        )
    ) {

        throw new Error(
            'PARENTESCO_CIRCULAR_MADRE'
        );

    }

}


export async function obtenerJaulasActivas() {

    const db =
        await getDatabase();


    return await db.getAllAsync(
        `
        SELECT
            id,
            codigo,
            nombre

        FROM jaulas

        WHERE activa = 1

        ORDER BY codigo
        `
    );

}


export async function existeAvePorCodigo(
    codigo,
    excluirAveId = null
) {


    const db =
        await getDatabase();


    const codigoLimpio =
        String(
            codigo || ''
        )
            .trim()
            .toUpperCase();


    if(!codigoLimpio){

        return false;

    }


    let resultado;


    if(excluirAveId){

        resultado =
            await db.getFirstAsync(
                `
                SELECT
                    id

                FROM aves

                WHERE UPPER(TRIM(codigo)) = ?
                    AND id <> ?

                LIMIT 1
                `,
                [
                    codigoLimpio,
                    excluirAveId
                ]
            );

    }
    else {

        resultado =
            await db.getFirstAsync(
                `
                SELECT
                    id

                FROM aves

                WHERE UPPER(TRIM(codigo)) = ?

                LIMIT 1
                `,
                [
                    codigoLimpio
                ]
            );

    }


    return !!resultado;

}



export async function crearAve({
    codigo,
    origen,
    fechaNacimiento,
    edadMesesCompra,
    fechaIngreso,
    criaderoOrigen,
    metodoEnvio,
    raza,
    sexo,
    pesoGramos,
    alturaCm,
    largoCm,
    caracteristicas,
    fotoUri,
    padreId,
    madreId,
    jaulaId
}) {

    const db =
        await getDatabase();


    let aveId =
        null;


    const fechaAlta =
        new Date()
            .toISOString();


    await db.withTransactionAsync(
        async () => {

            await validarRelacionPadres({
                db,
                padreId,
                madreId
            });


            const result =
                await db.runAsync(
                    `
                    INSERT INTO aves
                    (
                        codigo,
                        origen,
                        fecha_nacimiento,
                        edad_meses_compra,
                        fecha_ingreso,
                        criadero_origen,
                        metodo_envio,
                        raza,
                        sexo,
                        peso_gramos,
                        altura_cm,
                        largo_cm,
                        caracteristicas,
                        foto_uri,
                        padre_id,
                        madre_id,
                        jaula_actual_id,
                        estado
                    )
                    VALUES
                    (
                        ?, ?, ?, ?, ?, ?, ?,
                        ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'ACTIVA'
                    )
                    `,
                    [
                        codigo
                            .trim()
                            .toUpperCase(),

                        origen,

                        fechaNacimiento ||
                            null,

                        edadMesesCompra ??
                            null,

                        fechaIngreso ||
                            null,

                        criaderoOrigen
                            ?.trim() ||
                            null,

                        metodoEnvio
                            ?.trim() ||
                            null,

                        raza
                            ?.trim() ||
                            null,

                        sexo ||
                            null,

                        pesoGramos ??
                            null,

                        alturaCm ??
                            null,

                        largoCm ??
                            null,

                        caracteristicas
                            ?.trim() ||
                            null,

                        fotoUri ||
                            null,

                        padreId ||
                            null,

                        madreId ||
                            null,

                        jaulaId ||
                            null
                    ]
                );


            aveId =
                result.lastInsertRowId;


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

                    fechaAlta,

                    fotoUri ||
                        null,

                    pesoGramos ??
                        null,

                    alturaCm ??
                        null,

                    largoCm ??
                        null,

                    caracteristicas
                        ?.trim() ||
                        null,

                    'Registro inicial'
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

                    jaulaId ||
                        null,

                    'ALTA',

                    fechaAlta,

                    origen ===
                    'NACIDA_CRIADERO'

                        ? 'Ave registrada como nacida en el criadero.'

                        : 'Ave registrada como comprada.'
                ]
            );


            if (jaulaId) {

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
                        jaulaId,

                        aveId,

                        'INGRESO_AVE',

                        fechaAlta,

                        `Ave ${
                            codigo
                                .trim()
                                .toUpperCase()
                        } ingresó a la jaula.`
                    ]
                );

            }

        }
    );


    return aveId;

}


export async function actualizarAve({
    id,
    codigo,
    origen,
    fechaNacimiento,
    edadMesesCompra,
    fechaIngreso,
    criaderoOrigen,
    metodoEnvio,
    raza,
    sexo,
    pesoGramos,
    alturaCm,
    largoCm,
    caracteristicas,
    fotoUri,
    padreId,
    madreId
}) {

    const db =
        await getDatabase();


    const fecha =
        new Date()
            .toISOString();


    await db.withTransactionAsync(
        async () => {

            const anterior =
                await db.getFirstAsync(
                    `
                    SELECT
                        *

                    FROM aves

                    WHERE id = ?
                    `,
                    [
                        id
                    ]
                );


            if(!anterior){

                throw new Error(
                    'AVE_NO_ENCONTRADA'
                );

            }


            if(
                anterior.estado !==
                'ACTIVA'
            ){

                throw new Error(
                    'AVE_NO_ACTIVA'
                );

            }


            if(
                padreId
                &&
                Number(padreId) ===
                Number(id)
            ){

                throw new Error(
                    'PADRE_ES_MISMA_AVE'
                );

            }


            if(
                madreId
                &&
                Number(madreId) ===
                Number(id)
            ){

                throw new Error(
                    'MADRE_ES_MISMA_AVE'
                );

            }


            if(
                padreId
                &&
                madreId
                &&
                Number(padreId) ===
                Number(madreId)
            ){

                throw new Error(
                    'PADRES_IGUALES'
                );

            }


            await validarRelacionPadres({
                db,
                aveId:
                    id,
                padreId,
                madreId
            });


            const codigoLimpio =
                String(
                    codigo || ''
                )
                    .trim()
                    .toUpperCase();


            const duplicado =
                await db.getFirstAsync(
                    `
                    SELECT
                        id

                    FROM aves

                    WHERE UPPER(TRIM(codigo)) = ?
                        AND id <> ?

                    LIMIT 1
                    `,
                    [
                        codigoLimpio,
                        id
                    ]
                );


            if(duplicado){

                throw new Error(
                    'CODIGO_AVE_DUPLICADO'
                );

            }


            const padreGuardar =
                origen ===
                'NACIDA_CRIADERO'
                    ? padreId || null
                    : null;


            const madreGuardar =
                origen ===
                'NACIDA_CRIADERO'
                    ? madreId || null
                    : null;


            await db.runAsync(
                `
                UPDATE aves

                SET
                    codigo = ?,
                    origen = ?,
                    fecha_nacimiento = ?,
                    edad_meses_compra = ?,
                    fecha_ingreso = ?,
                    criadero_origen = ?,
                    metodo_envio = ?,
                    raza = ?,
                    sexo = ?,
                    peso_gramos = ?,
                    altura_cm = ?,
                    largo_cm = ?,
                    caracteristicas = ?,
                    foto_uri = ?,
                    padre_id = ?,
                    madre_id = ?,
                    fecha_actualizacion =
                        CURRENT_TIMESTAMP

                WHERE id = ?
                    AND estado = 'ACTIVA'
                `,
                [
                    codigoLimpio,

                    origen,

                    fechaNacimiento ||
                        null,

                    edadMesesCompra ??
                        null,

                    fechaIngreso ||
                        null,

                    criaderoOrigen
                        ?.trim() ||
                        null,

                    metodoEnvio
                        ?.trim() ||
                        null,

                    raza
                        ?.trim() ||
                        null,

                    sexo ||
                        null,

                    pesoGramos ??
                        null,

                    alturaCm ??
                        null,

                    largoCm ??
                        null,

                    caracteristicas
                        ?.trim() ||
                        null,

                    fotoUri ||
                        null,

                    padreGuardar,

                    madreGuardar,

                    id
                ]
            );


            const normalizar =
                valor =>
                    valor === null
                    ||
                    valor === undefined

                        ? ''

                        : String(valor)
                            .trim();


            const cambios = [];


            if(
                normalizar(
                    anterior.codigo
                )
                    .toUpperCase()
                !==
                codigoLimpio
            ){

                cambios.push(
                    'código'
                );

            }


            if(
                normalizar(
                    anterior.origen
                )
                !==
                normalizar(
                    origen
                )
            ){

                cambios.push(
                    'origen'
                );

            }


            if(
                normalizar(
                    anterior.fecha_nacimiento
                )
                !==
                normalizar(
                    fechaNacimiento
                )
            ){

                cambios.push(
                    'fecha de nacimiento'
                );

            }


            if(
                normalizar(
                    anterior.edad_meses_compra
                )
                !==
                normalizar(
                    edadMesesCompra
                )
            ){

                cambios.push(
                    'edad de ingreso'
                );

            }


            if(
                normalizar(
                    anterior.fecha_ingreso
                )
                !==
                normalizar(
                    fechaIngreso
                )
            ){

                cambios.push(
                    'fecha de ingreso'
                );

            }


            if(
                normalizar(
                    anterior.criadero_origen
                )
                !==
                normalizar(
                    criaderoOrigen
                )
            ){

                cambios.push(
                    'criadero de origen'
                );

            }


            if(
                normalizar(
                    anterior.metodo_envio
                )
                !==
                normalizar(
                    metodoEnvio
                )
            ){

                cambios.push(
                    'método de envío'
                );

            }


            if(
                normalizar(
                    anterior.raza
                )
                !==
                normalizar(
                    raza
                )
            ){

                cambios.push(
                    'raza'
                );

            }


            if(
                normalizar(
                    anterior.sexo
                )
                !==
                normalizar(
                    sexo
                )
            ){

                cambios.push(
                    'sexo'
                );

            }


            if(
                normalizar(
                    anterior.peso_gramos
                )
                !==
                normalizar(
                    pesoGramos
                )
            ){

                cambios.push(
                    'peso'
                );

            }


            if(
                normalizar(
                    anterior.altura_cm
                )
                !==
                normalizar(
                    alturaCm
                )
            ){

                cambios.push(
                    'altura'
                );

            }


            if(
                normalizar(
                    anterior.largo_cm
                )
                !==
                normalizar(
                    largoCm
                )
            ){

                cambios.push(
                    'largo'
                );

            }


            if(
                normalizar(
                    anterior.caracteristicas
                )
                !==
                normalizar(
                    caracteristicas
                )
            ){

                cambios.push(
                    'características'
                );

            }


            if(
                normalizar(
                    anterior.foto_uri
                )
                !==
                normalizar(
                    fotoUri
                )
            ){

                cambios.push(
                    'fotografía'
                );

            }


            if(
                normalizar(
                    anterior.padre_id
                )
                !==
                normalizar(
                    padreGuardar
                )
            ){

                cambios.push(
                    'padre'
                );

            }


            if(
                normalizar(
                    anterior.madre_id
                )
                !==
                normalizar(
                    madreGuardar
                )
            ){

                cambios.push(
                    'madre'
                );

            }


            const detalle =
                cambios.length > 0

                    ? `Datos generales actualizados: ${cambios.join(', ')}.`

                    : 'Se guardó la edición de los datos generales sin cambios visibles.';


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
                    id,

                    anterior.jaula_actual_id ||
                        null,

                    'DATOS_ACTUALIZADOS',

                    fecha,

                    detalle
                ]
            );

        }
    );

}


export async function cambiarJaulaAve({
    aveId,
    jaulaAnteriorId,
    nuevaJaulaId,
    codigoAve
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
                    jaula_actual_id = ?,
                    fecha_actualizacion =
                        CURRENT_TIMESTAMP

                WHERE id = ?
                `,
                [
                    nuevaJaulaId ||
                        null,

                    aveId
                ]
            );


            let detalleAve;


            if (
                jaulaAnteriorId
                &&
                nuevaJaulaId
            ) {

                detalleAve =
                    'El ave fue movida de una jaula a otra.';

            }
            else if (
                nuevaJaulaId
            ) {

                detalleAve =
                    'El ave fue asignada a una jaula.';

            }
            else {

                detalleAve =
                    'El ave fue retirada de su jaula.';

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

                    nuevaJaulaId ||
                        null,

                    'CAMBIO_JAULA',

                    fecha,

                    detalleAve
                ]
            );


            if (
                jaulaAnteriorId
            ) {

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
                        jaulaAnteriorId,

                        aveId,

                        'SALIDA_AVE',

                        fecha,

                        `Ave ${codigoAve} salió de la jaula.`
                    ]
                );

            }


            if (
                nuevaJaulaId
            ) {

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
                        nuevaJaulaId,

                        aveId,

                        'INGRESO_AVE',

                        fecha,

                        `Ave ${codigoAve} ingresó a la jaula.`
                    ]
                );

            }

        }
    );

}


export async function obtenerHistorialAve(
    aveId
) {

    const db =
        await getDatabase();


    return await db.getAllAsync(
        `
        SELECT
            h.*,

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

}

export async function obtenerAvesActivas() {

    return await obtenerAves();

}



export async function obtenerAvesVendidas() {

    const db =
        await getDatabase();


    return await db.getAllAsync(
        `
        SELECT

            a.id,
            a.codigo,
            a.origen,
            a.fecha_nacimiento,
            a.edad_meses_compra,
            a.fecha_ingreso,
            a.raza,
            a.sexo,
            a.peso_gramos,
            a.altura_cm,
            a.largo_cm,
            a.caracteristicas,
            a.foto_uri,
            a.padre_id,
            a.madre_id,
            a.jaula_actual_id,
            a.estado,
            a.estado_salud,

            j.codigo AS jaula_codigo,
            j.nombre AS jaula_nombre,

            p.codigo AS padre_codigo,
            m.codigo AS madre_codigo,

            b.fecha AS fecha_venta,
            b.celular,
            b.ciudad_destino,
            b.cooperativa_envio,
            b.comprador,
            b.valor_venta,
            b.valor_envio,
            b.detalle

        FROM aves a

        INNER JOIN bajas_ave b
            ON b.ave_id = a.id
            AND b.tipo = 'VENTA'

        LEFT JOIN jaulas j
            ON j.id = a.jaula_actual_id

        LEFT JOIN aves p
            ON p.id = a.padre_id

        LEFT JOIN aves m
            ON m.id = a.madre_id

        WHERE a.estado = 'VENDIDA'

        ORDER BY b.fecha DESC

        `
    );

}

export async function obtenerAvesFallecidas() {

    const db =
        await getDatabase();


    return await db.getAllAsync(
        `
        SELECT

            a.id,
            a.codigo,
            a.origen,
            a.fecha_nacimiento,
            a.edad_meses_compra,
            a.fecha_ingreso,
            a.raza,
            a.sexo,
            a.peso_gramos,
            a.altura_cm,
            a.largo_cm,
            a.caracteristicas,
            a.foto_uri,
            a.padre_id,
            a.madre_id,
            a.jaula_actual_id,
            a.estado,
            a.estado_salud,

            j.codigo AS jaula_codigo,
            j.nombre AS jaula_nombre,

            p.codigo AS padre_codigo,
            m.codigo AS madre_codigo,

            b.fecha AS fecha_fallecimiento,
            b.causa,
            b.detalle

        FROM aves a

        INNER JOIN bajas_ave b
            ON b.ave_id = a.id
            AND b.tipo = 'MUERTE'

        LEFT JOIN jaulas j
            ON j.id = a.jaula_actual_id

        LEFT JOIN aves p
            ON p.id = a.padre_id

        LEFT JOIN aves m
            ON m.id = a.madre_id

        WHERE a.estado = 'FALLECIDA'

        ORDER BY b.fecha DESC

        `
    );

}

export async function obtenerBajaAve(
    aveId
) {

    const db =
        await getDatabase();


    return await db.getFirstAsync(
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

        LIMIT 1

        `,
        [
            aveId
        ]
    );

}

