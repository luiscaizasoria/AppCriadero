import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { colors, spacing, typography } from '../theme';
import Icono from './Icono';
import Boton from './Boton';

// Uso: <EstadoError mensaje={error} onReintentar={cargar} />
// `mensaje` es el que devuelva la API, tal cual. «Reintentar» debe llamar a la misma función de carga.
export default function EstadoError({
    titulo = 'No se pudo conectar',
    mensaje,
    onReintentar,
    testID = 'estado-error'
}) {
    return (
        <View style={estilos.contenedor} testID={testID} accessibilityRole="alert">
            <View style={estilos.circulo}>
                <Icono nombre="sinConexion" tamano={40} color={colors.dangerText} />
            </View>
            <Text style={estilos.titulo}>{titulo}</Text>
            {mensaje ? <Text style={estilos.mensaje}>{mensaje}</Text> : null}
            {onReintentar ? (
                <Boton
                    titulo="Reintentar"
                    icono="reintentar"
                    variante="secundario"
                    onPress={onReintentar}
                    testID={`${testID}-reintentar`}
                    style={estilos.boton}
                />
            ) : null}
        </View>
    );
}

const estilos = StyleSheet.create({
    contenedor: { alignItems: 'center', justifyContent: 'center', padding: spacing.xl },
    circulo: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: colors.dangerSoft,
        alignItems: 'center',
        justifyContent: 'center'
    },
    titulo: { ...typography.subtitulo, color: colors.text, marginTop: spacing.md, textAlign: 'center' },
    mensaje: { ...typography.cuerpo, color: colors.textSecondary, marginTop: spacing.sm, textAlign: 'center' },
    boton: { marginTop: spacing.lg, alignSelf: 'stretch' }
});
