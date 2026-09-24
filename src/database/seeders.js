import {
    getDatabase
} from './database';



export async function ejecutarSeeders() {

    const db =
        await getDatabase();



    console.log(
        'SQLite - verificando datos maestros'
    );



    await db.withTransactionAsync(
        async () => {



            await db.runAsync(
                `
                INSERT OR IGNORE INTO catalogos
                (
                    codigo,
                    nombre
                )
                VALUES
                (
                    'RAZAS',
                    'Razas de aves'
                )
                `
            );



            await db.runAsync(
                `
                INSERT OR IGNORE INTO catalogos
                (
                    codigo,
                    nombre
                )
                VALUES
                (
                    'SEXOS',
                    'Sexo de aves'
                )
                `
            );



            await db.runAsync(
                `
                INSERT OR IGNORE INTO catalogos
                (
                    codigo,
                    nombre
                )
                VALUES
                (
                    'ENFERMEDADES',
                    'Enfermedades'
                )
                `
            );



            await db.runAsync(
                `
                INSERT OR IGNORE INTO catalogos
                (
                    codigo,
                    nombre
                )
                VALUES
                (
                    'MEDICAMENTOS',
                    'Medicamentos'
                )
                `
            );



            await db.runAsync(
                `
                INSERT OR IGNORE INTO catalogos
                (
                    codigo,
                    nombre
                )
                VALUES
                (
                    'ALIMENTOS',
                    'Alimentos'
                )
                `
            );



            await db.runAsync(
                `
                INSERT OR IGNORE INTO catalogos
                (
                    codigo,
                    nombre
                )
                VALUES
                (
                    'BEBIDAS',
                    'Bebidas'
                )
                `
            );



            await db.runAsync(
                `
                INSERT OR IGNORE INTO catalogos
                (
                    codigo,
                    nombre
                )
                VALUES
                (
                    'CATEGORIAS_FINANCIERAS',
                    'Categorías financieras'
                )
                `
            );





            await insertarCategoriaFinanciera(
                db,
                'VENTA_AVE',
                'Venta de ave',
                1
            );


            await insertarCategoriaFinanciera(
                db,
                'VENTA_HUEVOS',
                'Venta de huevos',
                2
            );


            await insertarCategoriaFinanciera(
                db,
                'ALIMENTO',
                'Alimento',
                3
            );


            await insertarCategoriaFinanciera(
                db,
                'MEDICAMENTO',
                'Medicamento',
                4
            );


            await insertarCategoriaFinanciera(
                db,
                'INFRAESTRUCTURA',
                'Infraestructura',
                5
            );


            await insertarCategoriaFinanciera(
                db,
                'COMPRA_AVE',
                'Compra de ave',
                6
            );


            await insertarCategoriaFinanciera(
                db,
                'OTRO',
                'Otro',
                7
            );


        }
    );



    const catalogos =
        await db.getAllAsync(
            `
            SELECT
                codigo,
                nombre

            FROM catalogos

            WHERE codigo IN
            (
                'RAZAS',
                'SEXOS',
                'ENFERMEDADES',
                'MEDICAMENTOS',
                'ALIMENTOS',
                'BEBIDAS',
                'CATEGORIAS_FINANCIERAS'
            )

            ORDER BY codigo
            `
        );



    console.log(
        'SQLite - catálogos maestros verificados:',
        catalogos.map(
            item =>
                item.codigo
        )
    );



    return db;

}





async function insertarCategoriaFinanciera(
    db,
    codigo,
    nombre,
    orden
){

    await db.runAsync(
        `
        INSERT OR IGNORE INTO catalogo_items
        (
            catalogo_id,
            codigo,
            nombre,
            orden
        )

        SELECT
            id,
            ?,
            ?,
            ?

        FROM catalogos

        WHERE codigo =
            'CATEGORIAS_FINANCIERAS'
        `,
        [
            codigo,
            nombre,
            orden
        ]
    );

}