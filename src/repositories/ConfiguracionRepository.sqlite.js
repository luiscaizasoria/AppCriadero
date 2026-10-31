import {
    getDatabase
} from '../database/database';



export async function obtenerCatalogos() {


    const db =
        await getDatabase();



    return await db.getAllAsync(
        `
        SELECT

            id,

            codigo,

            nombre,

            activo


        FROM catalogos


        WHERE activo = 1


        ORDER BY nombre

        `
    );

}




export async function obtenerCatalogoPorCodigo(
    codigo
) {


    const db =
        await getDatabase();



    return await db.getFirstAsync(
        `
        SELECT

            id,

            codigo,

            nombre


        FROM catalogos


        WHERE codigo = ?


        `,
        [
            codigo
        ]
    );

}




export async function obtenerItemsCatalogo(
    catalogoId
) {


    const db =
        await getDatabase();



    return await db.getAllAsync(
        `
        SELECT

            id,

            codigo,

            nombre,

            descripcion,

            activo,

            orden


        FROM catalogo_items


        WHERE catalogo_id = ?


        AND activo = 1


        ORDER BY

            orden,

            nombre

        `,
        [
            catalogoId
        ]
    );

}




export async function crearItemCatalogo({

    catalogoId,

    codigo,

    nombre,

    descripcion

}) {


    const db =
        await getDatabase();



    await db.runAsync(
        `
        INSERT INTO catalogo_items
        (
            catalogo_id,

            codigo,

            nombre,

            descripcion,

            activo

        )

        VALUES
        (
            ?,

            ?,

            ?,

            ?,

            1

        )

        `,
        [

            catalogoId,

            codigo,

            nombre,

            descripcion ||
            null

        ]
    );

}




export async function actualizarItemCatalogo({

    id,

    nombre,

    descripcion

}) {


    const db =
        await getDatabase();



    await db.runAsync(
        `
        UPDATE catalogo_items


        SET

            nombre = ?,

            descripcion = ?


        WHERE id = ?

        `,
        [

            nombre,

            descripcion ||
            null,

            id

        ]
    );

}




export async function eliminarItemCatalogo(
    id
) {


    const db =
        await getDatabase();



    await db.runAsync(
        `
        UPDATE catalogo_items


        SET

            activo = 0


        WHERE id = ?

        `,
        [
            id
        ]
    );

}