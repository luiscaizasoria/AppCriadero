import { useEffect, useRef, useState } from 'react';

// Hook del aviso de ÉXITO no bloqueante (sustituye al Alert de éxito; los Alert de error y de
// confirmación se conservan). Se muestra con <Aviso flotante titulo mensaje tono="exito" duracion={0} />.
//
// const { aviso, mostrar, cerrar, saliendo } = useAvisoExito();
//   mostrar(titulo, mensaje)           -> se ve 4 s y se cierra solo
//   mostrar(titulo, mensaje, despues)  -> se ve 1,8 s y luego ejecuta `despues` (la navegación que
//                                         antes hacía el «Aceptar»); `saliendo` pasa a true para que
//                                         el botón no acepte otro toque mientras tanto.
const DURACION_VISIBLE = 4000;
const DURACION_ANTES_DE_SALIR = 1800;

export default function useAvisoExito() {
    const [aviso, setAviso] = useState(null);
    const [saliendo, setSaliendo] = useState(false);
    const temporizador = useRef(null);

    useEffect(
        () => () => {
            if (temporizador.current) clearTimeout(temporizador.current);
        },
        []
    );

    const mostrar = (titulo, mensaje, despues) => {
        if (temporizador.current) clearTimeout(temporizador.current);
        setAviso({ titulo, mensaje });
        if (despues) {
            setSaliendo(true);
            temporizador.current = setTimeout(despues, DURACION_ANTES_DE_SALIR);
        } else {
            temporizador.current = setTimeout(() => setAviso(null), DURACION_VISIBLE);
        }
    };

    const cerrar = () => setAviso(null);

    return { aviso, mostrar, cerrar, saliendo };
}
