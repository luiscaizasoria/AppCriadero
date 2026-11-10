import React from 'react';


import {
    ScrollView,
    Text,
    StyleSheet
} from 'react-native';


import FondoPantalla from '../components/FondoPantalla';
import MasFila from '../components/MasFila';


import {
    colors,
    spacing,
    typography
} from '../theme';



export default function ConfiguracionScreen({
    navigation
}) {


    // Los emojis de los títulos pasan a iconos (el `titulo` que recibe Catálogo ya no lleva emoji).
    const opciones = [

        {
            titulo:'Razas',
            codigo:'RAZAS',
            icono:'paw-outline'
        },

        {
            titulo:'Enfermedades',
            codigo:'ENFERMEDADES',
            icono:'medkit-outline'
        },

        {
            titulo:'Medicamentos',
            codigo:'MEDICAMENTOS',
            icono:'medical-outline'
        },

        {
            titulo:'Alimentos',
            codigo:'ALIMENTOS',
            icono:'nutrition-outline'
        },

        {
            titulo:'Bebidas',
            codigo:'BEBIDAS',
            icono:'water-outline'
        },

        {
            titulo:'Categorías financieras',
            codigo:'CATEGORIAS_FINANCIERAS',
            icono:'cash-outline'
        }

    ];



    return (

        <FondoPantalla>

            <ScrollView
                contentContainerStyle={
                    styles.content
                }
            >

                <Text
                    style={
                        styles.subtitle
                    }
                >
                    Administración de catálogos del criadero
                </Text>


                {
                    opciones.map(
                        (item, indice) => (

                            <MasFila

                                key={
                                    item.codigo
                                }

                                icono={
                                    item.icono
                                }

                                indice={
                                    indice
                                }

                                titulo={
                                    item.titulo
                                }

                                testID={
                                    `config-${item.codigo.toLowerCase()}`
                                }

                                onPress={() =>
                                    navigation.navigate(
                                        'Catalogo',
                                        {
                                            codigo:
                                                item.codigo,

                                            titulo:
                                                item.titulo
                                        }
                                    )
                                }

                            />

                        )
                    )
                }

            </ScrollView>

        </FondoPantalla>

    );

}



const styles =
StyleSheet.create({

    content:{

        padding:spacing.pantalla,

        paddingBottom:spacing.xl

    },


    subtitle:{

        ...typography.cuerpo,

        color:
            colors.textSecondary,

        marginBottom:spacing.lg

    }

});
