import React, {
    useEffect,
    useState
} from 'react';

import {
    View,
    Text,
    TextInput,
    ScrollView,
    TouchableOpacity,
    ActivityIndicator,
    KeyboardAvoidingView,
    Platform
} from 'react-native';

import {
    listarCriaderos,
    crearCriadero,
    seleccionarCriadero
} from '../../api/accesoApi';

import {
    COLORS
} from '../../config/constants';

import {
    estilosAcceso as styles
} from './estilosAcceso';


const FORMULARIO_VACIO = {
    nombre: '',
    pais: 'Ecuador',
    provincia: '',
    ciudad: '',
    telefono: '',
    correoContacto: ''
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

        await seleccionarCriadero(criaderoId);

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

            setError('Completa todos los datos del criadero.');

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

            <View style={styles.center}>

                <ActivityIndicator
                    size="large"
                    color={COLORS.primary}
                />

            </View>

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

        <KeyboardAvoidingView
            style={styles.container}
            behavior={
                Platform.OS === 'ios'
                    ? 'padding'
                    : undefined
            }
        >

            <ScrollView
                contentContainerStyle={styles.content}
                keyboardShouldPersistTaps="handled"
            >

                <Text style={styles.title}>
                    Tu criadero
                </Text>

                <Text style={styles.subtitle}>
                    {
                        criaderos.length > 0
                            ? 'Elige el criadero con el que quieres trabajar.'
                            : 'Crea tu primer criadero para empezar.'
                    }
                </Text>

                {
                    criaderos.map(criadero => (

                        <TouchableOpacity
                            key={criadero.id}
                            style={styles.card}
                            onPress={() => elegir(criadero.id)}
                        >

                            <Text style={styles.cardTitle}>
                                {criadero.nombre}
                            </Text>

                            <Text style={styles.cardSubtitle}>
                                Toca para entrar
                            </Text>

                        </TouchableOpacity>

                    ))
                }

                {
                    criaderos.length > 0 && !creando &&
                    <TouchableOpacity
                        style={styles.linkButton}
                        onPress={() => setCreando(true)}
                    >

                        <Text style={styles.linkText}>
                            Crear otro criadero
                        </Text>

                    </TouchableOpacity>
                }

                {
                    creando &&
                    <View>

                        <Text style={styles.sectionTitle}>
                            Nuevo criadero
                        </Text>

                        {
                            campos.map(([campo, etiqueta, teclado]) => (

                                <View key={campo}>

                                    <Text style={styles.label}>
                                        {etiqueta}
                                    </Text>

                                    <TextInput
                                        style={styles.input}
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
                                    />

                                </View>

                            ))
                        }

                        <TouchableOpacity
                            style={[
                                styles.primaryButton,
                                procesando && styles.disabledButton
                            ]}
                            onPress={crear}
                            disabled={procesando}
                        >

                            <Text style={styles.primaryButtonText}>
                                {procesando ? 'Creando...' : 'Crear criadero'}
                            </Text>

                        </TouchableOpacity>

                    </View>
                }

                {
                    error &&
                    <Text style={styles.errorText}>
                        {error}
                    </Text>
                }

                {
                    error && criaderos.length === 0 && !creando &&
                    <TouchableOpacity
                        style={styles.linkButton}
                        onPress={cargar}
                    >

                        <Text style={styles.linkText}>
                            Reintentar
                        </Text>

                    </TouchableOpacity>
                }

            </ScrollView>

        </KeyboardAvoidingView>

    );

}
