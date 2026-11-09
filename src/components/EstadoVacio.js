import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { colors, spacing, typography } from '../theme';
import Boton from './Boton';
import IconoCirculo from './IconoCirculo';
import Mascota from './Mascota';

// Uso: <EstadoVacio titulo="Aún no hay aves" mensaje="Registra la primera." accionTitulo="Nueva ave" onAccion={fn} />
// Muestra la mascota (96 px); si se pasa `icono`, un círculo de icono en su lugar.
export default function EstadoVacio({
    icono,
    titulo,
    mensaje,
    accionTitulo,
    onAccion,
    testID = 'estado-vacio'
}) {
    return (
        <View style={estilos.contenedor} testID={testID}>
            {icono ? <IconoCirculo icono={icono} tamano={72} /> : <Mascota tamano={96} />}
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
    titulo: { ...typography.subtitulo, color: colors.text, marginTop: spacing.md, textAlign: 'center' },
    mensaje: { ...typography.cuerpo, color: colors.textSecondary, marginTop: spacing.sm, textAlign: 'center' },
    boton: { marginTop: spacing.lg, alignSelf: 'stretch' }
});
