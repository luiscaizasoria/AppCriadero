import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { colors, spacing, typography } from '../theme';
import AveOpcion from './AveOpcion';

// Selector de ítems de catálogo (raza, sexo) para Nueva/Editar ave. Misma interfaz que
// SelectorCatalogo (items, selectedId, onSelect(item), emptyText) pero con iconos Ionicons en lugar
// del emoji. `iconoPara(item)` (opcional) elige el icono de cada ítem.
export default function AveSelectorCatalogo({
    items,
    selectedId,
    onSelect,
    emptyText = 'No existen opciones disponibles.',
    iconoPara,
    testIDPrefijo = 'opcion'
}) {
    if (!items || items.length === 0) {
        return <Text style={estilos.vacio}>{emptyText}</Text>;
    }

    return (
        <View style={estilos.contenedor}>
            {items.map(item => (
                <AveOpcion
                    key={item.id}
                    texto={item.nombre}
                    icono={iconoPara ? iconoPara(item) : 'paw-outline'}
                    seleccionado={selectedId === item.id}
                    onPress={() => onSelect(item)}
                    testID={`${testIDPrefijo}-${String(item.nombre || item.id).toLowerCase().replace(/\s+/g, '-')}`}
                />
            ))}
        </View>
    );
}

const estilos = StyleSheet.create({
    contenedor: { flexDirection: 'row', flexWrap: 'wrap' },
    vacio: { ...typography.cuerpo, color: colors.textSecondary, marginBottom: spacing.sm }
});
