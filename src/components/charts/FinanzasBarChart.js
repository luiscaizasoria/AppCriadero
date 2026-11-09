import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { colors, spacing, typography } from '../../theme';
import Icono from '../Icono';

// Barras de Ingresos, Egresos y Utilidad del mes. Cada barra lleva icono y texto (el color no es
// el único canal). Los importes se muestran como antes: "$0.00".
export default function FinanzasBarChart({ ingresos = 0, egresos = 0, utilidad = 0 }) {
    const maximo = Math.max(ingresos, egresos, utilidad, 1);

    const calcularAncho = valor => `${((valor / maximo) * 100).toFixed(2)}%`;

    const renderBarra = (titulo, icono, valor, color) => (
        <View style={estilos.item}>
            <View style={estilos.cabecera}>
                <View style={estilos.titulo}>
                    <Icono nombre={icono} tamano={20} color={color} style={estilos.icono} />
                    <Text style={estilos.etiqueta}>{titulo}</Text>
                </View>
                <Text style={[estilos.valor, { color }]}>${valor.toFixed(2)}</Text>
            </View>
            <View style={estilos.fondo}>
                <View style={[estilos.barra, { width: calcularAncho(valor), backgroundColor: color }]} />
            </View>
        </View>
    );

    return (
        <View>
            {renderBarra('Ingresos', 'trending-up-outline', ingresos, colors.success)}
            {renderBarra('Egresos', 'trending-down-outline', egresos, colors.danger)}
            {renderBarra('Utilidad', 'finanzas', utilidad, colors.primary)}
        </View>
    );
}

const estilos = StyleSheet.create({
    item: { marginBottom: spacing.md },
    cabecera: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
    titulo: { flexDirection: 'row', alignItems: 'center' },
    icono: { marginRight: spacing.xs },
    etiqueta: { ...typography.etiqueta, color: colors.text },
    valor: { ...typography.subtitulo },
    fondo: { height: 14, backgroundColor: colors.primarySoft, borderRadius: 7, overflow: 'hidden' },
    barra: { height: '100%', borderRadius: 7 }
});
