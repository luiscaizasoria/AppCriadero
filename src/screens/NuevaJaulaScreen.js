import React, {
    useState
} from 'react';

import {
    View,
    Text,
    ScrollView,
    StyleSheet,
    Alert,
    KeyboardAvoidingView,
    Platform
} from 'react-native';

import {
    crearJaula
} from '../repositories/JaulaRepository';

import {
    colors,
    radii,
    spacing,
    typography
} from '../theme';

import FondoPantalla from '../components/FondoPantalla';
import Tarjeta from '../components/Tarjeta';
import CampoTexto from '../components/CampoTexto';
import Boton from '../components/Boton';
import Pulsable from '../components/Pulsable';
import Icono from '../components/Icono';
import JaulaBarraAccion from '../components/JaulaBarraAccion';
import JaulaAviso, {
    useAvisoExito
} from '../components/JaulaAviso';


const TIPOS_JAULA = [
    'Reproducción',
    'Crecimiento',
    'Postura',
    'Cuarentena',
    'General'
];


export default function NuevaJaulaScreen({
    navigation
}) {

    const [codigo, setCodigo] =
        useState('');

    const [nombre, setNombre] =
        useState('');

    const [ubicacion, setUbicacion] =
        useState('');

    const [tipo, setTipo] =
        useState('General');

    const [guardando, setGuardando] =
        useState(false);

    const {
        aviso,
        mostrar: mostrarAviso,
        cerrar: cerrarAviso,
        saliendo
    } = useAvisoExito();


    const guardar = async () => {

        if (!codigo.trim()) {

            Alert.alert(
                'Código requerido',
                'Ingresa un código para la jaula.'
            );

            return;

        }


        try {

            setGuardando(true);


            await crearJaula({

                codigo,

                nombre,

                ubicacion,

                tipo

            });


            // Antes: Alert con «Aceptar» que hacía goBack. Ahora: aviso y vuelve solo.
            mostrarAviso(

                'Jaula creada',

                `La jaula ${codigo.trim().toUpperCase()} fue registrada correctamente.`,

                () =>
                    navigation.goBack()

            );

        }
        catch (error) {

            console.error(
                'Error creando jaula:',
                error
            );


            if (
                error.message
                    ?.toLowerCase()
                    .includes('unique')
            ) {

                Alert.alert(
                    'Código duplicado',
                    'Ya existe una jaula con ese código.'
                );

            }
            else {

                Alert.alert(
                    'Error',
                    'No fue posible guardar la jaula.'
                );

            }

        }
        finally {

            setGuardando(false);

        }

    };


    return (

        <KeyboardAvoidingView
            style={styles.container}
            behavior={
                Platform.OS === 'ios'
                    ? 'padding'
                    : undefined
            }
        >

            <FondoPantalla>

                <ScrollView
                    contentContainerStyle={
                        styles.content
                    }
                    keyboardShouldPersistTaps="handled"
                >

                    <Text style={styles.subtitle}>
                        Registra un nuevo espacio del criadero.
                    </Text>


                    <Tarjeta>

                        <CampoTexto
                            etiqueta="Código *"
                            icono="grid-outline"
                            placeholder="Ej. J001"
                            value={codigo}
                            onChangeText={
                                setCodigo
                            }
                            autoCapitalize="characters"
                            maxLength={20}
                            testID="jaula-codigo"
                        />


                        <CampoTexto
                            etiqueta="Nombre"
                            icono="create-outline"
                            placeholder="Ej. Reproductores Sebright"
                            value={nombre}
                            onChangeText={
                                setNombre
                            }
                            testID="jaula-nombre"
                        />


                        <CampoTexto
                            etiqueta="Ubicación"
                            icono="location-outline"
                            placeholder="Ej. Sector A"
                            value={ubicacion}
                            onChangeText={
                                setUbicacion
                            }
                            testID="jaula-ubicacion"
                        />


                        <Text style={styles.label}>
                            Tipo de jaula
                        </Text>


                        <View
                            style={
                                styles.typeContainer
                            }
                            accessibilityRole="radiogroup"
                        >

                            {
                                TIPOS_JAULA.map(
                                    item => {

                                        const activo =
                                            tipo === item;

                                        return (

                                            <Pulsable
                                                key={item}
                                                testID={`jaula-tipo-${item}`}
                                                accessibilityRole="radio"
                                                accessibilityState={{
                                                    selected: activo
                                                }}
                                                onPress={() =>
                                                    setTipo(item)
                                                }
                                                sinMinimo
                                                style={[
                                                    styles.typeButton,
                                                    activo &&
                                                    styles.typeSelected
                                                ]}
                                            >

                                                {
                                                    activo
                                                        ? (
                                                            <Icono
                                                                nombre="checkmark"
                                                                tamano={18}
                                                                color={colors.white}
                                                                style={styles.typeIcono}
                                                            />
                                                        )
                                                        : null
                                                }

                                                <Text
                                                    style={[
                                                        styles.typeText,
                                                        activo &&
                                                        styles.typeTextSelected
                                                    ]}
                                                >
                                                    {item}
                                                </Text>

                                            </Pulsable>

                                        );

                                    }
                                )
                            }

                        </View>

                    </Tarjeta>

                </ScrollView>


                <JaulaBarraAccion>

                    <Boton
                        titulo={
                            guardando
                                ? 'Guardando...'
                                : 'Guardar jaula'
                        }
                        icono={
                            guardando
                                ? undefined
                                : 'guardar'
                        }
                        onPress={guardar}
                        atenuado={
                            guardando || saliendo
                        }
                        testID="guardar-jaula"
                    />

                </JaulaBarraAccion>


                <JaulaAviso
                    aviso={aviso}
                    onCerrar={cerrarAviso}
                />

            </FondoPantalla>

        </KeyboardAvoidingView>

    );

}


const styles =
    StyleSheet.create({

        container: {
            flex: 1
        },

        content: {
            padding: spacing.pantalla,
            paddingBottom: spacing.xl
        },

        subtitle: {
            ...typography.cuerpo,
            color: colors.textSecondary,
            marginBottom: spacing.lg
        },

        label: {
            ...typography.etiqueta,
            color: colors.text,
            marginBottom: spacing.xs
        },

        typeContainer: {
            flexDirection: 'row',
            flexWrap: 'wrap'
        },

        typeButton: {
            minHeight: spacing.touchMin,
            flexDirection: 'row',
            alignItems: 'center',
            backgroundColor: colors.surface,
            borderWidth: 2,
            borderColor: colors.border,
            borderRadius: radii.pill,
            paddingHorizontal: spacing.lg,
            marginRight: spacing.sm,
            marginBottom: spacing.sm
        },

        typeSelected: {
            backgroundColor: colors.primary,
            borderColor: colors.primary
        },

        typeIcono: {
            marginRight: spacing.xs
        },

        typeText: {
            ...typography.cuerpo,
            color: colors.text
        },

        typeTextSelected: {
            ...typography.cuerpoFuerte,
            color: colors.white
        }

    });
