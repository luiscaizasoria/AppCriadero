/**
 * GenealogiaRepository contra la API (modo API).
 *
 * Mismo algoritmo que GenealogiaRepository.sqlite.js (V1). Diferencias, solo
 * por el paso a online:
 *   - La lista de aves sale de tres lecturas (ACTIVA, VENDIDA, FALLECIDA) de
 *     GET /aves?estado=..., unidas y ordenadas por codigo en binario (como el
 *     ORDER BY codigo de SQLite) en vez del SELECT sin WHERE.
 *   - Number(id) pasa a String(id) (ids UUID v7; Number daria NaN).
 * Los errores de red o sesion (ApiError) se propagan sin traducir.
 */

import {
    apiFetch
} from '../api/apiClient';

import {
    rutaAves,
    aSnake
} from '../api/avesApi';


async function obtenerTodasLasAves() {

    const ruta = await rutaAves();

    const listas = await Promise.all(
        [
            'ACTIVA',
            'VENDIDA',
            'FALLECIDA'
        ].map(
            estado =>
                apiFetch(
                    `${ruta}?estado=${estado}`
                )
        )
    );

    const aves = [];

    for (const data of listas) {

        for (const item of data.aves) {

            const fila = aSnake(item);

            aves.push({
                id: fila.id,
                codigo: fila.codigo,
                raza: fila.raza,
                sexo: fila.sexo,
                foto_uri: fila.foto_uri,
                padre_id: fila.padre_id,
                madre_id: fila.madre_id,
                estado: fila.estado,
                estado_salud: fila.estado_salud,
                fecha_nacimiento: fila.fecha_nacimiento
            });

        }

    }

    // Comparacion binaria (colacion BINARY de SQLite), no localeCompare.
    aves.sort(
        (a, b) => {

            const x = a.codigo === null || a.codigo === undefined ? '' : String(a.codigo);
            const y = b.codigo === null || b.codigo === undefined ? '' : String(b.codigo);

            if (x < y) {
                return -1;
            }

            if (x > y) {
                return 1;
            }

            return 0;

        }
    );

    return aves;

}


export async function obtenerGenealogiaAve(
    aveId,
    generaciones = 3
) {

    const maxGeneraciones =
        Math.min(
            4,
            Math.max(
                1,
                Number(generaciones) || 3
            )
        );


    const aves =
        await obtenerTodasLasAves();


    const porId =
        new Map(
            aves.map(
                item => [
                    String(item.id),
                    item
                ]
            )
        );


    const raiz =
        porId.get(
            String(
                aveId
            )
        );


    if (!raiz) {

        return null;

    }


    const hijosPorPadre =
        new Map();


    for (
        const item
        of aves
    ) {

        const parentIds = [
            item.padre_id,
            item.madre_id
        ];


        for (
            const parentId
            of parentIds
        ) {

            if (
                parentId === null
                ||
                parentId === undefined
            ) {

                continue;

            }


            const key =
                String(
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
                    item
                );

        }

    }


    const relacionesInvalidas = [];


    let ancestros =
        construirAncestros(
            raiz,
            porId,
            0,
            maxGeneraciones,
            new Set(),
            relacionesInvalidas
        );


    let descendientes =
        construirDescendientes(
            raiz,
            hijosPorPadre,
            0,
            maxGeneraciones,
            new Set(),
            relacionesInvalidas
        );


    const idsAncestros =
        obtenerIdsAncestros(
            ancestros
        );


    const idsDescendientes =
        obtenerIdsDescendientes(
            descendientes
        );


    const idsCruzados =
        new Set(
            [
                ...idsAncestros
            ]
                .filter(
                    id =>
                        idsDescendientes.has(
                            id
                        )
                )
        );


    if (
        idsCruzados.size > 0
    ) {

        for (
            const id
            of idsCruzados
        ) {

            const aveInvolucrada =
                porId.get(
                    String(id)
                );


            registrarRelacionInvalida(
                relacionesInvalidas,
                `Relación circular detectada entre ${raiz.codigo} y ${aveInvolucrada?.codigo || id}. Un ave no puede aparecer a la vez como ancestro y descendiente de la misma ave.`
            );

        }


        ancestros =
            filtrarAncestrosInvalidos(
                ancestros,
                idsCruzados
            );


        descendientes =
            filtrarDescendientesInvalidos(
                descendientes,
                idsCruzados
            );

    }


    return {
        ave:
            mapearAve(
                raiz
            ),
        generaciones:
            maxGeneraciones,
        ancestros,
        descendientes,
        relacionesInvalidas
    };

}



function construirAncestros(
    ave,
    porId,
    nivel,
    maxGeneraciones,
    camino,
    relacionesInvalidas
) {

    const nodo =
        mapearAve(
            ave
        );


    if (
        nivel >= maxGeneraciones
    ) {

        return {
            ...nodo,
            padres: []
        };

    }


    const id =
        String(
            ave.id
        );


    const nuevoCamino =
        new Set(
            camino
        );


    nuevoCamino.add(
        id
    );


    const padres = [];


    agregarAncestro({
        ave,
        parentId:
            ave.padre_id,
        relacion:
            nivel === 0
                ? 'Padre'
                : 'Ancestro paterno',
        porId,
        nivel,
        maxGeneraciones,
        nuevoCamino,
        padres,
        relacionesInvalidas
    });


    agregarAncestro({
        ave,
        parentId:
            ave.madre_id,
        relacion:
            nivel === 0
                ? 'Madre'
                : 'Ancestro materno',
        porId,
        nivel,
        maxGeneraciones,
        nuevoCamino,
        padres,
        relacionesInvalidas
    });


    return {
        ...nodo,
        padres
    };

}



function agregarAncestro({
    ave,
    parentId,
    relacion,
    porId,
    nivel,
    maxGeneraciones,
    nuevoCamino,
    padres,
    relacionesInvalidas
}) {

    if (
        parentId === null
        ||
        parentId === undefined
    ) {

        return;

    }


    const idPadre =
        String(
            parentId
        );


    const padre =
        porId.get(
            idPadre
        );


    if (!padre) {

        return;

    }


    if (
        nuevoCamino.has(
            idPadre
        )
    ) {

        const codigosCamino =
            [
                ...nuevoCamino,
                idPadre
            ]
                .map(
                    id =>
                        porId.get(
                            String(id)
                        )?.codigo
                        ||
                        id
                )
                .join(
                    ' → '
                );


        registrarRelacionInvalida(
            relacionesInvalidas,
            `Relación circular detectada en ancestros: ${codigosCamino}.`
        );

        return;

    }


    padres.push({
        relacion,
        nodo:
            construirAncestros(
                padre,
                porId,
                nivel + 1,
                maxGeneraciones,
                nuevoCamino,
                relacionesInvalidas
            )
    });

}



function construirDescendientes(
    ave,
    hijosPorPadre,
    nivel,
    maxGeneraciones,
    camino,
    relacionesInvalidas
) {

    const nodo =
        mapearAve(
            ave
        );


    if (
        nivel >= maxGeneraciones
    ) {

        return {
            ...nodo,
            hijos: []
        };

    }


    const id =
        String(
            ave.id
        );


    const nuevoCamino =
        new Set(
            camino
        );


    nuevoCamino.add(
        id
    );


    const hijos = [];


    for (
        const item
        of (
            hijosPorPadre.get(
                id
            )
            ||
            []
        )
    ) {

        const hijoId =
            String(
                item.id
            );


        if (
            nuevoCamino.has(
                hijoId
            )
        ) {

            registrarRelacionInvalida(
                relacionesInvalidas,
                `Relación circular detectada en descendientes entre ${ave.codigo} y ${item.codigo}.`
            );

            continue;

        }


        hijos.push(
            construirDescendientes(
                item,
                hijosPorPadre,
                nivel + 1,
                maxGeneraciones,
                nuevoCamino,
                relacionesInvalidas
            )
        );

    }


    hijos.sort(
        (a, b) =>
            String(
                a.codigo || ''
            )
                .localeCompare(
                    String(
                        b.codigo || ''
                    )
                )
    );


    return {
        ...nodo,
        hijos
    };

}



function obtenerIdsAncestros(
    nodo
) {

    const ids =
        new Set();


    for (
        const item
        of (
            nodo?.padres
            ||
            []
        )
    ) {

        ids.add(
            String(
                item.nodo.id
            )
        );


        for (
            const id
            of obtenerIdsAncestros(
                item.nodo
            )
        ) {

            ids.add(
                String(id)
            );

        }

    }


    return ids;

}



function obtenerIdsDescendientes(
    nodo
) {

    const ids =
        new Set();


    for (
        const item
        of (
            nodo?.hijos
            ||
            []
        )
    ) {

        ids.add(
            String(
                item.id
            )
        );


        for (
            const id
            of obtenerIdsDescendientes(
                item
            )
        ) {

            ids.add(
                String(id)
            );

        }

    }


    return ids;

}



function filtrarAncestrosInvalidos(
    nodo,
    idsInvalidos
) {

    return {
        ...nodo,
        padres:
            (
                nodo?.padres
                ||
                []
            )
                .filter(
                    item =>
                        !idsInvalidos.has(
                            String(
                                item.nodo.id
                            )
                        )
                )
                .map(
                    item => ({
                        ...item,
                        nodo:
                            filtrarAncestrosInvalidos(
                                item.nodo,
                                idsInvalidos
                            )
                    })
                )
    };

}



function filtrarDescendientesInvalidos(
    nodo,
    idsInvalidos
) {

    return {
        ...nodo,
        hijos:
            (
                nodo?.hijos
                ||
                []
            )
                .filter(
                    item =>
                        !idsInvalidos.has(
                            String(
                                item.id
                            )
                        )
                )
                .map(
                    item =>
                        filtrarDescendientesInvalidos(
                            item,
                            idsInvalidos
                        )
                )
    };

}



function registrarRelacionInvalida(
    lista,
    detalle
) {

    if (
        lista.some(
            item =>
                item.detalle ===
                detalle
        )
    ) {

        return;

    }


    lista.push({
        tipo:
            'PARENTESCO_CIRCULAR',
        detalle
    });

}



function mapearAve(
    ave
) {

    return {
        id:
            ave.id,
        codigo:
            ave.codigo,
        raza:
            ave.raza,
        sexo:
            ave.sexo,
        foto_uri:
            ave.foto_uri,
        estado:
            ave.estado,
        estado_salud:
            ave.estado_salud,
        fecha_nacimiento:
            ave.fecha_nacimiento
    };

}
