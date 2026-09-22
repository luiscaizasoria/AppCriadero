import React, {
    useState
} from 'react';

import {
    View,
    Text,
    TextInput,
    ScrollView,
    TouchableOpacity,
    StyleSheet,
    Alert,
    KeyboardAvoidingView,
    Platform
} from 'react-native';

import {
    crearJaula
} from '../repositories/JaulaRepository';

import {
    COLORS
} from '../config/constants';


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


            Alert.alert(

                'Jaula creada',

                `La jaula ${codigo.trim().toUpperCase()} fue registrada correctamente.`,

                [
                    {
                        text: 'Aceptar',

                        onPress: () =>
                            navigation.goBack()
                    }
                ]

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

            <ScrollView
                contentContainerStyle={
                    styles.content
                }
                keyboardShouldPersistTaps="handled"
            >

                <Text style={styles.title}>
                    🏠 Nueva jaula
                </Text>

                <Text style={styles.subtitle}>
                    Registra un nuevo espacio del criadero.
                </Text>


                <Text style={styles.label}>
                    Código *
                </Text>

                <TextInput
                    style={styles.input}
                    placeholder="Ej. J001"
                    value={codigo}
                    onChangeText={
                        setCodigo
                    }
                    autoCapitalize="characters"
                    maxLength={20}
                />


                <Text style={styles.label}>
                    Nombre
                </Text>

                <TextInput
                    style={styles.input}
                    placeholder="Ej. Reproductores Sebright"
                    value={nombre}
                    onChangeText={
                        setNombre
                    }
                />


                <Text style={styles.label}>
                    Ubicación
                </Text>

                <TextInput
                    style={styles.input}
                    placeholder="Ej. Sector A"
                    value={ubicacion}
                    onChangeText={
                        setUbicacion
                    }
                />


                <Text style={styles.label}>
                    Tipo de jaula
                </Text>


                <View
                    style={
                        styles.typeContainer
                    }
                >

                    {
                        TIPOS_JAULA.map(
                            item => (

                                <TouchableOpacity
                                    key={item}
                                    style={[
                                        styles.typeButton,

                                        tipo === item &&
                                        styles.typeSelected
                                    ]}
                                    onPress={() =>
                                        setTipo(item)
                                    }
                                >

                                    <Text
                                        style={[
                                            styles.typeText,

                                            tipo === item &&
                                            styles.typeTextSelected
                                        ]}
                                    >
                                        {item}
                                    </Text>

                                </TouchableOpacity>

                            )
                        )
                    }

                </View>


                <TouchableOpacity
                    style={[
                        styles.saveButton,

                        guardando &&
                        styles.disabledButton
                    ]}
                    onPress={guardar}
                    disabled={
                        guardando
                    }
                >

                    <Text
                        style={
                            styles.saveButtonText
                        }
                    >
                        {
                            guardando
                                ? 'Guardando...'
                                : '💾 Guardar jaula'
                        }
                    </Text>

                </TouchableOpacity>


            </ScrollView>

        </KeyboardAvoidingView>

    );

}


const styles =
    StyleSheet.create({

        container: {

            flex: 1,

            backgroundColor:
                COLORS.background

        },


        content: {

            padding: 20,

            paddingBottom: 40

        },


        title: {

            fontSize: 26,

            fontWeight: 'bold',

            color:
                COLORS.primary

        },


        subtitle: {

            color:
                COLORS.textSecondary,

            marginTop: 5,

            marginBottom: 25

        },


        label: {

            fontSize: 15,

            fontWeight: '600',

            color:
                COLORS.text,

            marginBottom: 6,

            marginTop: 12

        },


        input: {

            backgroundColor:
                COLORS.card,

            borderWidth: 1,

            borderColor: '#d9e2e5',

            borderRadius: 12,

            paddingHorizontal: 14,

            paddingVertical: 13,

            fontSize: 16

        },


        typeContainer: {

            flexDirection: 'row',

            flexWrap: 'wrap'

        },


        typeButton: {

            backgroundColor: '#e8eeee',

            borderRadius: 20,

            paddingHorizontal: 14,

            paddingVertical: 9,

            marginRight: 8,

            marginBottom: 8

        },


        typeSelected: {

            backgroundColor:
                COLORS.primary

        },


        typeText: {

            color:
                COLORS.text

        },


        typeTextSelected: {

            color: '#fff',

            fontWeight: 'bold'

        },


        saveButton: {

            backgroundColor:
                COLORS.primary,

            borderRadius: 14,

            paddingVertical: 15,

            alignItems: 'center',

            marginTop: 30

        },


        disabledButton: {

            opacity: 0.6

        },


        saveButtonText: {

            color: '#fff',

            fontWeight: 'bold',

            fontSize: 17

        }

    });