import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { colors, radii, typography } from '../theme';
import Icono from './Icono';

const TONOS = {
    neutro: { fondo: colors.surfaceAlt, texto: colors.text },
    primario: { fondo: colors.primarySoft, texto: colors.primaryDark },
    exito: { fondo: colors.successSoft, texto: colors.successText },
    peligro: { fondo: colors.dangerSoft, texto: colors.dangerText },
    advertencia: { fondo: colors.warningSoft, texto: colors.warningText },
    info: { fondo: colors.infoSoft, texto: colors.infoText },
    acento: { fondo: colors.turquesa, texto: colors.accentText }
};

// Chip de estado: pill de 28 px con icono (16) + texto (13/700). El color nunca es el único canal:
// pasar `icono` (p. ej. "exito", "advertencia", "error", "info" o un glifo de Ionicons).
// Uso: <Chip texto="Sana" tono="exito" icono="checkmark-circle" testID="chip-estado" />
export default function Chip({ texto, tono = 'neutro', icono, testID, style }) {
    const t = TONOS[tono] || TONOS.neutro;
    return (
        <View testID={testID} style={[estilos.chip, { backgroundColor: t.fondo }, style]}>
            {icono ? <Icono nombre={icono} tamano={16} color={t.texto} style={estilos.icono} /> : null}
            <Text style={[estilos.texto, { color: t.texto }]}>{texto}</Text>
        </View>
    );
}

const estilos = StyleSheet.create({
    chip: {
        alignSelf: 'flex-start',
        flexDirection: 'row',
        alignItems: 'center',
        height: 28,
        paddingHorizontal: 10,
        borderRadius: radii.pill
    },
    icono: { marginRight: 4 },
    texto: { ...typography.chip }
});
