import { useCallback, useRef, useState } from 'react';
import { findNodeHandle } from 'react-native';

// Validación visual (solo presentación): el formulario sigue validando como antes y, además de su
// Alert o texto actual, llama a `fallar(campo, mensaje)` con el MISMO mensaje. Eso marca el campo con
// borde rojo y mensaje, desplaza el ScrollView hasta él y le da foco.
//
// Uso:
//   const scrollRef = useRef(null);
//   const v = useValidacion(scrollRef);
//   <ScrollView ref={scrollRef}> <CampoTexto {...v.props('codigo')} ... /> </ScrollView>
//   if (!codigo.trim()) { v.fallar('codigo', 'Ingresa un código...'); Alert.alert(...); return; }
// Para campos que no son de texto (selectores): <CampoGrupo {...v.grupo('tipo')}> ... </CampoGrupo>
// y `v.limpiar('tipo')` al elegir.
export default function useValidacion(scrollRef) {
    const [errores, setErrores] = useState({});
    const contenedores = useRef({});
    const inputs = useRef({});

    const limpiar = useCallback(nombre => {
        setErrores(previo => {
            if (!previo[nombre]) return previo;
            const copia = { ...previo };
            delete copia[nombre];
            return copia;
        });
    }, []);

    const limpiarTodo = useCallback(() => setErrores({}), []);

    const fallar = useCallback(
        (campos, mensaje) => {
            // `campos` puede ser un nombre o una lista: se marcan todos; scroll y foco al primero.
            const lista = Array.isArray(campos) ? campos : [campos];
            const nombre = lista[0];
            const marcados = {};
            lista.forEach(item => {
                marcados[item] = Array.isArray(mensaje) ? mensaje[lista.indexOf(item)] : mensaje;
            });
            setErrores(marcados);
            setTimeout(() => {
                const el = contenedores.current[nombre];
                const sv = scrollRef && scrollRef.current;
                if (el && sv && typeof sv.scrollTo === 'function') {
                    const interior =
                        typeof sv.getInnerViewRef === 'function' ? sv.getInnerViewRef() : findNodeHandle(sv);
                    if (interior) {
                        try {
                            el.measureLayout(
                                interior,
                                (_x, y) => sv.scrollTo({ y: Math.max(0, y - 24), animated: true }),
                                () => {}
                            );
                        } catch (e) {
                            // Sin scroll automático si la plataforma no puede medir: el borde rojo sigue visible.
                        }
                    }
                }
                const input = inputs.current[nombre];
                if (input && typeof input.focus === 'function') {
                    setTimeout(() => input.focus(), 350);
                }
            }, 60);
        },
        [scrollRef]
    );

    const props = nombre => ({
        error: errores[nombre],
        contenedorRef: el => {
            contenedores.current[nombre] = el;
        },
        inputRef: el => {
            inputs.current[nombre] = el;
        },
        alEditar: () => limpiar(nombre)
    });

    const grupo = nombre => ({
        error: errores[nombre],
        contenedorRef: el => {
            contenedores.current[nombre] = el;
        }
    });

    return { errores, props, grupo, fallar, limpiar, limpiarTodo };
}
