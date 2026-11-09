import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { colors, spacing, typography } from '../../theme';

// Barras de huevos por día (Inicio y Producción de huevos). Misma lógica y textos de siempre.
export default function ProduccionBarChart({ data = [] }) {
    const maximo = Math.max(...data.map(item => Number(item.cantidad || 0)), 1);

    return (
        <View>
            {data.map(item => {
                const porcentaje = (Number(item.cantidad || 0) / maximo) * 100;

                return (
                    <View key={item.dia} style={estilos.item}>
                        <View style={estilos.cabecera}>
                            <Text style={estilos.etiqueta}>{item.dia}</Text>
                            <Text style={estilos.valor}>
                                {item.cantidad}
                                {' '}
                                huevos
                            </Text>
                        </View>
                        <View style={estilos.fondo}>
                            <View style={[estilos.barra, { width: `${porcentaje}%` }]} />
                        </View>
                    </View>
                );
            })}
        </View>
    );
}

const estilos = StyleSheet.create({
    item: { marginBottom: spacing.md },
    cabecera: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
    etiqueta: { ...typography.etiqueta, color: colors.text },
    valor: { ...typography.etiqueta, color: colors.warningText },
    fondo: { height: 14, backgroundColor: colors.primarySoft, borderRadius: 7, overflow: 'hidden' },
    barra: { height: '100%', backgroundColor: colors.warning, borderRadius: 7 }
});
