import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { colors, radii, spacing, typography } from '../theme';
import Tarjeta from './Tarjeta';
import Chip from './Chip';
import Icono from './Icono';
import IconoCirculo from './IconoCirculo';

// Icono y nombre por tipo de alerta (las cuatro categorías se distinguen por icono, no por color).
const TIPOS = {
    SALUD: { icono: 'salud', nombre: 'Salud' },
    JAULA: { icono: 'jaulas', nombre: 'Jaula' },
    PRODUCCION: { icono: 'huevo', nombre: 'Producción' },
    FINANZAS: { icono: 'finanzas', nombre: 'Finanzas' }
};

// Acción de la tarjeta: mismo texto de siempre (sin emoji) con su icono.
function accionDe(accionDestino) {
    switch (accionDestino) {
        case 'BEBIDA_JAULA':
            return { icono: 'bebida', texto: 'Registrar bebida →' };
        case 'ALIMENTACION_JAULA':
            return { icono: 'alimentacion', texto: 'Registrar alimentación →' };
        case 'DETALLE_AVE':
            return { icono: 'aves', texto: 'Revisar ave →' };
        default:
            return { icono: 'siguiente', texto: 'Ver detalle →' };
    }
}

// Tarjeta de alerta con franja de color por nivel, chip (icono + texto), tipo con icono, título,
// mensaje y acción. Toda la tarjeta es pulsable (como antes). ALTO = crítica; el resto, advertencia.
export default function AlertCard({ nivel, tipo, titulo, mensaje, accionDestino, onPress, testID }) {
    const critica = nivel === 'ALTO';
    const franja = critica ? colors.danger : colors.warning;
    const fondoIcono = critica ? colors.dangerSoft : colors.warningSoft;
    const colorIcono = critica ? colors.dangerText : colors.warningText;
    const infoTipo = TIPOS[tipo] || { icono: 'alertas', nombre: tipo };
    const accion = accionDe(accionDestino);

    return (
        <Tarjeta onPress={onPress} franja={franja} testID={testID}>
            <View style={estilos.cabecera}>
                <IconoCirculo icono={infoTipo.icono} color={fondoIcono} colorIcono={colorIcono} tamano={44} />
                <View style={estilos.cabeceraTexto}>
                    <Chip
                        texto={critica ? 'Crítica' : 'Advertencia'}
                        tono={critica ? 'peligro' : 'advertencia'}
                        icono={critica ? 'error' : 'advertencia'}
                    />
                    <Text style={estilos.tipo}>{infoTipo.nombre}</Text>
                </View>
            </View>

            <Text style={estilos.titulo}>{titulo}</Text>
            <Text style={estilos.mensaje}>{mensaje}</Text>

            {onPress ? (
                <View style={estilos.accion}>
                    <Icono nombre={accion.icono} tamano={22} color={colors.primaryDark} style={estilos.accionIcono} />
                    <Text style={estilos.accionTexto}>{accion.texto}</Text>
                </View>
            ) : null}
        </Tarjeta>
    );
}

const estilos = StyleSheet.create({
    cabecera: { flexDirection: 'row', alignItems: 'center' },
    cabeceraTexto: { marginLeft: spacing.md, flex: 1 },
    tipo: { ...typography.secundario, color: colors.textSecondary, marginTop: 4 },
    titulo: { ...typography.subtitulo, color: colors.text, marginTop: spacing.md },
    mensaje: { ...typography.cuerpo, color: colors.textSecondary, marginTop: spacing.xs },
    accion: {
        marginTop: spacing.md,
        minHeight: 48,
        borderRadius: radii.md,
        borderWidth: 2.5,
        borderColor: colors.primary,
        backgroundColor: colors.surface,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: spacing.md
    },
    accionIcono: { marginRight: spacing.sm },
    accionTexto: { ...typography.boton, fontSize: 17, color: colors.primaryDark }
});
