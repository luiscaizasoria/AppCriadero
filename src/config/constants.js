export const COLORS = {

    primary: '#3d8b8b',

    background: '#f5fafb',

    card: '#ffffff',

    success: '#52b788',

    danger: '#d9534f',

    warning: '#f4d35e',

    orange: '#f4a261',

    info: '#4ea8de',

    text: '#234',

    textSecondary: '#666',

    border: '#d9e2e5',

    white: '#ffffff'

};


export const APP_NAME =
    'Criadero Kikirikis';


export const JAULA_SANITARY_STATUS = {

    NORMAL: 'NORMAL',

    LIMPIEZA: 'LIMPIEZA',

    FUMIGACION: 'FUMIGACION',

    QUEMADURA: 'QUEMADURA',

    CUARENTENA: 'CUARENTENA'

};


export const JAULA_SANITARY_STATUS_STYLES = {

    NORMAL: {

        label: 'Normal',

        backgroundColor:
            COLORS.success,

        textColor:
            COLORS.white,

        borderColor:
            COLORS.success

    },


    LIMPIEZA: {

        label: 'Limpieza',

        backgroundColor:
            COLORS.info,

        textColor:
            COLORS.white,

        borderColor:
            COLORS.info

    },


    FUMIGACION: {

        label: 'Fumigación',

        backgroundColor:
            COLORS.warning,

        textColor:
            COLORS.text,

        borderColor:
            COLORS.warning

    },


    QUEMADURA: {

        label: 'Quemadura',

        backgroundColor:
            COLORS.orange,

        textColor:
            COLORS.white,

        borderColor:
            COLORS.orange

    },


    CUARENTENA: {

        label: 'Cuarentena',

        backgroundColor:
            COLORS.danger,

        textColor:
            COLORS.white,

        borderColor:
            COLORS.danger

    }

};


export function getJaulaSanitaryStatusStyle(
    status
) {

    const normalizedStatus =
        String(
            status || JAULA_SANITARY_STATUS.NORMAL
        )
            .trim()
            .toUpperCase();


    return (
        JAULA_SANITARY_STATUS_STYLES[
            normalizedStatus
        ]
        ||
        JAULA_SANITARY_STATUS_STYLES.NORMAL
    );

}