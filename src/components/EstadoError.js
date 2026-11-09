import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { colors, spacing, typography } from '../theme';
import Icono from './Icono';
import Boton from './Boton';

// Uso: <EstadoError mensaje={error} onReintentar={cargar} />
export default function EstadoError({
    titulo = 'No se pudo cargar',
    mensaje,
    onReintentar,
    testID = 'estado-error'
}) {
    return (
        <View style={estilos.contenedor} testID={testID} accessibilityRole="alert">
            <Icono nombre="error" tamano={48} color={colors.danger} />
            <Text style={estilos.titulo}>{titulo}</Text>
            {mensaje ? <Text style={estilos.mensaje}>{mensaje}</Text> : null}
            {onReintentar ? (
                <Boton
                    titulo="Reintentar"
                    icono="reintentar"
                    variante="contorno"
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
    titulo: { ...typography.tituloTarjeta, color: colors.text, marginTop: spacing.md, textAlign: 'center' },
    mensaje: { ...typography.cuerpo, color: colors.textSecondary, marginTop: spacing.sm, textAlign: 'center' },
    boton: { marginTop: spacing.lg }
});
