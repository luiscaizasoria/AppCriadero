import React, {
    useEffect,
    useRef,
    useState
} from 'react';

import {
    View,
    Text,
    StyleSheet
} from 'react-native';

import {
    listarCriaderos,
    crearCriadero,
    seleccionarCriadero
} from '../../api/accesoApi';

import {
    cerrarSesion
} from '../../api/sesion';

import {
    colors,
    spacing,
    typography
} from '../../theme';

import Boton from '../../components/Boton';
import CampoTexto from '../../components/CampoTexto';
import Tarjeta from '../../components/Tarjeta';
import Icono from '../../components/Icono';
import IconoCirculo from '../../components/IconoCirculo';
import EstadoCarga from '../../components/EstadoCarga';
import FondoPantalla from '../../components/FondoPantalla';
import useGuardaEnvio from '../../components/useGuardaEnvio';
import useValidacion from '../../components/useValidacion';

import {
    PantallaAcceso,
    MensajeError
} from './componentesAcceso';


const FORMULARIO_VACIO = {
    nombre: '',
    pais: 'Ecuador',
    provincia: '',
    ciudad: '',
    telefono: '',
    correoContacto: ''
};


const ICONOS_CAMPO = {
    nombre: 'home-outline',
    pais: 'earth-outline',
    provincia: 'map-outline',
    ciudad: 'location-outline',
    telefono: 'call-outline',
    correoContacto: 'correo'
};


export default function SeleccionCriaderoScreen() {

    const [criaderos, setCriaderos] =
        useState(null);

    const [formulario, setFormulario] =
        useState(FORMULARIO_VACIO);

    const [creando, setCreando] =
        useState(false);

    const [procesando, setProcesando] =
        useState(false);

    const [error, setError] =
        useState(null);

    // Criadero que se está abriendo (retroalimentación visual en su tarjeta)
    const [eligiendoId, setEligiendoId] =
        useState(null);

    const guardia = useGuardaEnvio();
    const scrollRef = useRef(null);
    const v = useValidacion(scrollRef);


    const cargar = async () => {

        try {

            setError(null);

            setCriaderos(null);

            const lista = await listarCriaderos();

            setCriaderos(lista);

            setCreando(lista.length === 0);

        }
        catch (err) {

            setCriaderos([]);

            setError(
                err?.message ||
                'No fue posible cargar tus criaderos.'
            );

        }

    };


    useEffect(() => {

        cargar();

    }, []);


    const elegir = async (criaderoId) => {

        setEligiendoId(criaderoId);

        try {

            await seleccionarCriadero(criaderoId);

        }
        finally {

            setEligiendoId(null);

        }

    };


    const cambiar = (campo, valor) => {

        setFormulario(actual => ({
            ...actual,
            [campo]: valor
        }));

    };


    const crear = async () => {

        const datos = {
            nombre: formulario.nombre.trim(),
            pais: formulario.pais.trim(),
            provincia: formulario.provincia.trim(),
            ciudad: formulario.ciudad.trim(),
            telefono: formulario.telefono.trim(),
            correoContacto: formulario.correoContacto.trim()
        };

        if (Object.values(datos).some(valor => !valor)) {

            // Mismo mensaje de antes, ahora bajo el primer campo vacío (borde rojo, scroll y foco).
            setError(null);

            v.fallar(
                Object.keys(datos).find(clave => !datos[clave]),
                'Completa todos los datos del criadero.'
            );

            return;

        }

        try {

            setProcesando(true);

            setError(null);

            const criaderoId = await crearCriadero(datos);

            await seleccionarCriadero(criaderoId);

        }
        catch (err) {

            setError(
                err?.message ||
                'No fue posible crear el criadero.'
            );

            setProcesando(false);

        }

    };


    if (criaderos === null) {

        return (

            <FondoPantalla>

                <View
                    style={estilos.centro}
                    testID="seleccion-cargando"
                >

                    <EstadoCarga mensaje="Cargando tus criaderos..." />

                </View>

            </FondoPantalla>

        );

    }


    const campos = [
        ['nombre', 'Nombre del criadero', 'default'],
        ['pais', 'País', 'default'],
        ['provincia', 'Provincia', 'default'],
        ['ciudad', 'Ciudad', 'default'],
        ['telefono', 'Teléfono', 'phone-pad'],
        ['correoContacto', 'Correo de contacto', 'email-address']
    ];


    return (

        <PantallaAcceso
            titulo="Tu criadero"
            subtitulo={
                criaderos.length > 0
                    ? 'Elige el criadero con el que quieres trabajar.'
                    : 'Crea tu primer criadero para empezar.'
            }
            compacta
            scrollRef={scrollRef}
            testID="pantalla-seleccion-criadero"
        >

            {
                criaderos.map(criadero => (

                    <Tarjeta
                        key={criadero.id}
                        onPress={() => guardia(elegir)(criadero.id)}
                        testID={`criadero-${criadero.id}`}
                        style={estilos.criadero}
                    >

                        <View style={estilos.fila}>

                            <IconoCirculo
                                icono="home-outline"
                                indice={1}
                                tamano={48}
                            />

                            <View style={estilos.textos}>

                                <Text style={estilos.nombre}>
                                    {criadero.nombre}
                                </Text>

                                <Text style={estilos.entrar}>
                                    {
                                        eligiendoId === criadero.id
                                            ? 'Entrando...'
                                            : 'Toca para entrar'
                                    }
                                </Text>

                            </View>

                            <Icono
                                nombre="siguiente"
                                tamano={24}
                                color={colors.primaryDark}
                            />

                        </View>

                    </Tarjeta>

                ))
            }

            {
                criaderos.length > 0 && !creando &&
                <Boton
                    titulo="Crear otro criadero"
                    variante="secundario"
                    icono="anadir"
                    onPress={() => setCreando(true)}
                    testID="seleccion-crear-otro"
                    style={estilos.separado}
                />
            }

            {
                creando &&
                <View>

                    <Text style={estilos.seccion}>
                        Nuevo criadero
                    </Text>

                    {
                        campos.map(([campo, etiqueta, teclado]) => (

                            <CampoTexto
                                key={campo}
                                etiqueta={etiqueta}
                                icono={ICONOS_CAMPO[campo]}
                                value={formulario[campo]}
                                onChangeText={
                                    valor => cambiar(campo, valor)
                                }
                                keyboardType={teclado}
                                autoCapitalize={
                                    campo === 'correoContacto'
                                        ? 'none'
                                        : 'sentences'
                                }
                                testID={`criadero-campo-${campo}`}
                                {...v.props(campo)}
                            />

                        ))
                    }

                    <MensajeError mensaje={error} />

                    <Boton
                        titulo="Crear criadero"
                        onPress={guardia(crear)}
                        guardando={procesando}
                        tituloGuardando="Creando..."
                        testID="seleccion-crear-criadero"
                        style={estilos.separado}
                    />

                </View>
            }

            {
                !creando &&
                <MensajeError mensaje={error} />
            }

            {
                error && criaderos.length === 0 && !creando &&
                <Boton
                    titulo="Reintentar"
                    variante="secundario"
                    icono="reintentar"
                    onPress={cargar}
                    testID="seleccion-reintentar"
                />
            }

            {
                /* Borra token y criadero guardados y vuelve al login. */
            }
            <View style={estilos.cerrar}>

                <Boton
                    titulo="Cerrar sesión"
                    variante="terciario"
                    icono="cerrarSesion"
                    onPress={cerrarSesion}
                    disabled={procesando}
                    testID="seleccion-cerrar-sesion"
                />

            </View>

        </PantallaAcceso>

    );

}


const estilos = StyleSheet.create({

    centro: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        padding: spacing.xl
    },

    criadero: {
        marginBottom: spacing.md
    },

    fila: {
        flexDirection: 'row',
        alignItems: 'center'
    },

    textos: {
        flex: 1,
        marginHorizontal: spacing.md
    },

    nombre: {
        ...typography.subtitulo,
        color: colors.text
    },

    entrar: {
        ...typography.secundario,
        color: colors.textSecondary,
        marginTop: 2
    },

    seccion: {
        ...typography.subtitulo,
        color: colors.text,
        marginTop: spacing.md,
        marginBottom: spacing.md
    },

    separado: {
        marginTop: spacing.sm
    },

    cerrar: {
        marginTop: spacing.lg
    }

});
