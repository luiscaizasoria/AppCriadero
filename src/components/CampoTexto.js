import React, { useState } from 'react';
import { StyleSheet, Text, TextInput, View } from 'react-native';
import { colors, radii, spacing, typography } from '../theme';
import Icono from './Icono';

// Uso: <CampoTexto etiqueta="Nombre" icono="correo" value={v} onChangeText={set} error={msg} testID="campo-nombre" />
// `icono` (opcional) va a la izquierda, en color primario; `accion` (opcional) a la derecha
// (por ejemplo el ojo de la contraseña, con Pulsable). Acepta el resto de props de TextInput.
// Foco: borde primario + halo del 22 %. Error: borde rojo + icono + mensaje.
export default function CampoTexto({
    etiqueta,
    error,
    ayuda,
    icono,
    accion,
    testID,
    style,
    inputStyle,
    onFocus,
    onBlur,
    ...resto
}) {
    const [enfocado, setEnfocado] = useState(false);
    const multilinea = !!resto.multiline;

    return (
        <View style={[estilos.contenedor, style]}>
            {etiqueta ? <Text style={estilos.etiqueta}>{etiqueta}</Text> : null}
            <View style={[estilos.halo, enfocado && !error && estilos.haloActivo]}>
                <View
                    style={[
                        estilos.caja,
                        multilinea && estilos.cajaMultilinea,
                        enfocado && estilos.cajaEnfocada,
                        error ? estilos.cajaError : null
                    ]}
                >
                    {icono ? (
                        <Icono
                            nombre={icono}
                            tamano={22}
                            color={error ? colors.danger : colors.primary}
                            style={estilos.icono}
                        />
                    ) : null}
                    <TextInput
                        testID={testID}
                        accessibilityLabel={resto.accessibilityLabel || etiqueta}
                        placeholderTextColor={colors.textSecondary}
                        selectionColor={colors.primary}
                        style={[estilos.input, multilinea && estilos.inputMultilinea, inputStyle]}
                        {...resto}
                        onFocus={e => {
                            setEnfocado(true);
                            if (onFocus) onFocus(e);
                        }}
                        onBlur={e => {
                            setEnfocado(false);
                            if (onBlur) onBlur(e);
                        }}
                    />
                    {accion || null}
                </View>
            </View>
            {error ? (
                <View style={estilos.mensajeFila}>
                    <Icono nombre="error" tamano={16} color={colors.dangerText} style={estilos.mensajeIcono} />
                    <Text style={estilos.error} accessibilityLiveRegion="polite">{error}</Text>
                </View>
            ) : ayuda ? (
                <Text style={estilos.ayuda}>{ayuda}</Text>
            ) : null}
        </View>
    );
}

const estilos = StyleSheet.create({
    contenedor: { marginBottom: spacing.md },
    etiqueta: { ...typography.etiqueta, color: colors.text, marginBottom: spacing.xs },
    halo: { borderRadius: radii.md + 3, borderWidth: 3, borderColor: 'transparent' },
    haloActivo: { borderColor: 'rgba(109,59,210,0.22)' },
    caja: {
        minHeight: 54,
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: colors.surface,
        borderWidth: 2,
        borderColor: colors.border,
        borderRadius: radii.md,
        paddingHorizontal: spacing.md
    },
    cajaMultilinea: { alignItems: 'flex-start', paddingVertical: spacing.sm },
    cajaEnfocada: { borderColor: colors.primary },
    cajaError: { borderColor: colors.danger },
    icono: { marginRight: spacing.sm },
    input: { ...typography.cuerpo, flex: 1, color: colors.text, paddingVertical: spacing.sm },
    inputMultilinea: { minHeight: 90, textAlignVertical: 'top' },
    mensajeFila: { flexDirection: 'row', alignItems: 'center', marginTop: spacing.xs },
    mensajeIcono: { marginRight: spacing.xs },
    error: { ...typography.secundario, color: colors.dangerText, flex: 1 },
    ayuda: { ...typography.secundario, color: colors.textSecondary, marginTop: spacing.xs }
});
