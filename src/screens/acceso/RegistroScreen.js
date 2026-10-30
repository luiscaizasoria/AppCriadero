import React, {
    useState
} from 'react';

import {
    Text,
    TextInput,
    ScrollView,
    TouchableOpacity,
    KeyboardAvoidingView,
    Platform
} from 'react-native';

import {
    registrarUsuario
} from '../../api/accesoApi';

import {
    estilosAcceso as styles
} from './estilosAcceso';


export default function RegistroScreen({
    navigation
}) {

    const [nombre, setNombre] =
        useState('');

    const [email, setEmail] =
        useState('');

    const [password, setPassword] =
        useState('');

    const [procesando, setProcesando] =
        useState(false);

    const [error, setError] =
        useState(null);


    const registrar = async () => {

        if (!nombre.trim() || !email.trim() || !password) {

            setError('Completa tu nombre, correo y contraseña.');

            return;

        }

        try {

            setProcesando(true);

            setError(null);

            await registrarUsuario({
                nombre: nombre.trim(),
                email: email.trim(),
                password
            });

        }
        catch (err) {

            setError(
                err?.message ||
                'No fue posible crear la cuenta.'
            );

        }
        finally {

            setProcesando(false);

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
                contentContainerStyle={styles.content}
                keyboardShouldPersistTaps="handled"
            >

                <Text style={styles.title}>
                    Crear cuenta
                </Text>

                <Text style={styles.subtitle}>
                    Tu información se guarda en la nube, asociada a tu cuenta.
                </Text>

                <Text style={styles.label}>
                    Nombre
                </Text>

                <TextInput
                    style={styles.input}
                    value={nombre}
                    onChangeText={setNombre}
                    placeholder="Tu nombre"
                />

                <Text style={styles.label}>
                    Correo
                </Text>

                <TextInput
                    style={styles.input}
                    value={email}
                    onChangeText={setEmail}
                    placeholder="correo@ejemplo.com"
                    autoCapitalize="none"
                    autoCorrect={false}
                    keyboardType="email-address"
                />

                <Text style={styles.label}>
                    Contraseña
                </Text>

                <TextInput
                    style={styles.input}
                    value={password}
                    onChangeText={setPassword}
                    placeholder="Contraseña"
                    secureTextEntry
                    autoCapitalize="none"
                />

                {
                    error &&
                    <Text style={styles.errorText}>
                        {error}
                    </Text>
                }

                <TouchableOpacity
                    style={[
                        styles.primaryButton,
                        procesando && styles.disabledButton
                    ]}
                    onPress={registrar}
                    disabled={procesando}
                >

                    <Text style={styles.primaryButtonText}>
                        {procesando ? 'Creando...' : 'Crear cuenta'}
                    </Text>

                </TouchableOpacity>

                <TouchableOpacity
                    style={styles.linkButton}
                    onPress={() => navigation.navigate('Login')}
                >

                    <Text style={styles.linkText}>
                        Ya tengo una cuenta
                    </Text>

                </TouchableOpacity>

            </ScrollView>

        </KeyboardAvoidingView>

    );

}
