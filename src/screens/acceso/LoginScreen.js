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
    iniciarSesion
} from '../../api/accesoApi';

import {
    estilosAcceso as styles
} from './estilosAcceso';


export default function LoginScreen({
    navigation
}) {

    const [email, setEmail] =
        useState('');

    const [password, setPassword] =
        useState('');

    const [procesando, setProcesando] =
        useState(false);

    const [error, setError] =
        useState(null);


    const entrar = async () => {

        if (!email.trim() || !password) {

            setError('Ingresa tu correo y tu contraseña.');

            return;

        }

        try {

            setProcesando(true);

            setError(null);

            await iniciarSesion({
                email: email.trim(),
                password
            });

        }
        catch (err) {

            setError(
                err?.message ||
                'No fue posible iniciar sesión.'
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
                    Iniciar sesión
                </Text>

                <Text style={styles.subtitle}>
                    Ingresa con tu cuenta para usar tus datos en la nube.
                </Text>

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
                    onPress={entrar}
                    disabled={procesando}
                >

                    <Text style={styles.primaryButtonText}>
                        {procesando ? 'Ingresando...' : 'Ingresar'}
                    </Text>

                </TouchableOpacity>

                <TouchableOpacity
                    style={styles.linkButton}
                    onPress={() => navigation.navigate('Registro')}
                >

                    <Text style={styles.linkText}>
                        Crear una cuenta
                    </Text>

                </TouchableOpacity>

            </ScrollView>

        </KeyboardAvoidingView>

    );

}
