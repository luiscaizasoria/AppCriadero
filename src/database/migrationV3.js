export const DATABASE_VERSION_V3 = 3;



export const migrationV3 = `


    INSERT OR IGNORE INTO catalogos
    (
        codigo,
        nombre
    )
    VALUES
    (
        'RAZAS',
        'Razas de aves'
    );



    INSERT OR IGNORE INTO catalogo_items
    (
        catalogo_id,
        codigo,
        nombre,
        orden
    )

    SELECT

        id,
        'KIKIRIS',
        'Kikiris',
        1

    FROM catalogos

    WHERE codigo='RAZAS';



    INSERT OR IGNORE INTO catalogo_items
    (
        catalogo_id,
        codigo,
        nombre,
        orden
    )

    SELECT

        id,
        'KIKIRIKIS_MEJORADOS',
        'Kikirikis mejorados',
        2

    FROM catalogos

    WHERE codigo='RAZAS';



    INSERT OR IGNORE INTO catalogo_items
    (
        catalogo_id,
        codigo,
        nombre,
        orden
    )

    SELECT

        id,
        'AZTECAS',
        'Aztecas',
        3

    FROM catalogos

    WHERE codigo='RAZAS';



    INSERT OR IGNORE INTO catalogo_items
    (
        catalogo_id,
        codigo,
        nombre,
        orden
    )

    SELECT

        id,
        'SEBRING',
        'Sebring',
        4

    FROM catalogos

    WHERE codigo='RAZAS';



    INSERT OR IGNORE INTO catalogo_items
    (
        catalogo_id,
        codigo,
        nombre,
        orden
    )

    SELECT

        id,
        'NAGASAKI',
        'Nagasaki',
        5

    FROM catalogos

    WHERE codigo='RAZAS';



    INSERT OR IGNORE INTO catalogo_items
    (
        catalogo_id,
        codigo,
        nombre,
        orden
    )

    SELECT

        id,
        'KIRI',
        'Kiri',
        6

    FROM catalogos

    WHERE codigo='RAZAS';



    INSERT OR IGNORE INTO catalogo_items
    (
        catalogo_id,
        codigo,
        nombre,
        orden
    )

    SELECT

        id,
        'FANTASIA',
        'Fantasía',
        7

    FROM catalogos

    WHERE codigo='RAZAS';



    INSERT OR IGNORE INTO catalogo_items
    (
        catalogo_id,
        codigo,
        nombre,
        orden
    )

    SELECT

        id,
        'SERAMA',
        'Serama',
        8

    FROM catalogos

    WHERE codigo='RAZAS';



    INSERT OR IGNORE INTO catalogo_items
    (
        catalogo_id,
        codigo,
        nombre,
        orden
    )

    SELECT

        id,
        'OTRO',
        'Otro',
        9

    FROM catalogos

    WHERE codigo='RAZAS';


`;