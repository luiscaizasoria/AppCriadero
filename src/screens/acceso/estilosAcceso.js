import {
    StyleSheet
} from 'react-native';

import {
    COLORS
} from '../../config/constants';


export const estilosAcceso =
StyleSheet.create({

    container: {

        flex: 1,

        backgroundColor:
            COLORS.background

    },

    content: {

        padding: 20,

        paddingTop: 50,

        paddingBottom: 40

    },

    title: {

        fontSize: 26,

        fontWeight: 'bold',

        color: COLORS.text

    },

    subtitle: {

        color: COLORS.textSecondary,

        marginTop: 5,

        marginBottom: 20

    },

    label: {

        fontSize: 15,

        fontWeight: '600',

        color: COLORS.text,

        marginBottom: 6,

        marginTop: 12

    },

    input: {

        backgroundColor: COLORS.card,

        borderWidth: 1,

        borderColor: COLORS.border,

        borderRadius: 12,

        paddingHorizontal: 14,

        paddingVertical: 13,

        fontSize: 16

    },

    primaryButton: {

        backgroundColor: COLORS.primary,

        borderRadius: 14,

        paddingVertical: 15,

        alignItems: 'center',

        marginTop: 26

    },

    primaryButtonText: {

        color: '#fff',

        fontWeight: 'bold',

        fontSize: 17

    },

    disabledButton: {

        opacity: 0.6

    },

    linkButton: {

        alignItems: 'center',

        marginTop: 18,

        padding: 8

    },

    linkText: {

        color: COLORS.primary,

        fontWeight: '600'

    },

    errorText: {

        color: COLORS.danger,

        marginTop: 14

    },

    card: {

        backgroundColor: COLORS.card,

        borderRadius: 14,

        padding: 16,

        marginTop: 10,

        borderWidth: 1,

        borderColor: COLORS.border

    },

    cardTitle: {

        fontSize: 17,

        fontWeight: 'bold',

        color: COLORS.text

    },

    cardSubtitle: {

        color: COLORS.textSecondary,

        marginTop: 3

    },

    center: {

        flex: 1,

        alignItems: 'center',

        justifyContent: 'center',

        padding: 20,

        backgroundColor: COLORS.background

    },

    sectionTitle: {

        fontSize: 18,

        fontWeight: 'bold',

        color: COLORS.text,

        marginTop: 26

    }

});
