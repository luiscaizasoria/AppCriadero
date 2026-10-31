import {
    useEffect,
    useState
} from 'react';

import {
    USAR_API
} from '../config/dataSource';

import {
    cargarSesion,
    obtenerEstado,
    suscribir
} from './sesion';


/**
 * Estado de la sesion para App.js. En modo SQLite no hace nada: devuelve
 * un estado neutro y no toca el almacenamiento seguro.
 */
export function useSesion() {

    const [estado, setEstado] =
        useState(
            USAR_API
                ? obtenerEstado()
                : {
                    cargando: false,
                    token: null,
                    expiraEn: 0,
                    criaderoId: null
                }
        );

    useEffect(() => {

        if (!USAR_API) {

            return undefined;

        }

        const cancelar = suscribir(setEstado);

        cargarSesion();

        return cancelar;

    }, []);

    return estado;

}
