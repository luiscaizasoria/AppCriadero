import React from 'react';


import {
    View,
    Text,
    TouchableOpacity,
    StyleSheet
} from 'react-native';


import {
    COLORS
} from '../config/constants';



export default function SelectorCatalogo({

    items,

    selectedId,

    onSelect,

    emptyText = 'No existen opciones disponibles.'

}) {


    if(!items || items.length === 0){

        return (

            <Text style={styles.empty}>

                {emptyText}

            </Text>

        );

    }



    return (

        <View style={styles.container}>


            {
                items.map(item => (

                    <TouchableOpacity

                        key={item.id}

                        style={[

                            styles.option,

                            selectedId === item.id
                            &&
                            styles.selected

                        ]}


                        onPress={() =>
                            onSelect(item)
                        }

                    >

                        <Text

                            style={[

                                styles.text,

                                selectedId === item.id
                                &&
                                styles.selectedText

                            ]}

                        >

                            🐔 {item.nombre}

                        </Text>


                    </TouchableOpacity>

                ))
            }


        </View>

    );

}



const styles = StyleSheet.create({

    container:{

        flexDirection:'row',

        flexWrap:'wrap'

    },

    option:{

        backgroundColor:'#e8eeee',

        paddingHorizontal:12,

        paddingVertical:9,

        borderRadius:18,

        marginRight:8,

        marginBottom:8

    },

    selected:{

        backgroundColor:COLORS.primary

    },

    text:{

        color:COLORS.text

    },

    selectedText:{

        color:'#fff',

        fontWeight:'bold'

    },

    empty:{

        color:COLORS.textSecondary

    }

});
