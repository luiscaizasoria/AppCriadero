import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { colors, spacing, typography } from '../theme';
import Icono from './Icono';
import Boton from './Boton';

// Uso: <EstadoVacio titulo="Sin aves" mensaje="Registra la primera." accionTitulo="Nueva ave" onAccion={fn} />
export default function EstadoVacio({
    icono = 'info',
    titulo,
    mensaje,
    accionTitulo,
    onAccion,
    testID = 'estado-vacio'
}) {
    return (
        <View style={estilos.contenedor} testID={testID}>
            <Icono nombre={icono} tamano={48} color={colors.primary} />
            {titulo ? <Text style={estilos.titulo}>{titulo}</Text> : null}
            {mensaje ? <Text style={estilos.mensaje}>{mensaje}</Text> : null}
            {accionTitulo && onAccion ? (
                <Boton titulo={accionTitulo} onPress={onAccion} testID={`${testID}-accion`} style={estilos.boton} />
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
