import React, {
    useEffect,
    useState
} from 'react';


import {
    View,
    Text,
    ActivityIndicator,
    StyleSheet
} from 'react-native';


import {
    NavigationContainer
} from '@react-navigation/native';


import * as NavigationBar
from 'expo-navigation-bar';


import AppNavigator
from './src/navigation/AppNavigator';


import {
    initDatabase
} from './src/database/sqlite';


import {
    COLORS
} from './src/config/constants';


import {
    USAR_API
} from './src/config/dataSource';


// Modo API (EXPO_PUBLIC_DATA_SOURCE=api): inicio de sesion y seleccion de
// criadero. En modo SQLite (por defecto) estos modulos ni se cargan.
const useSesion =
    USAR_API
        ? require('./src/api/useSesion').useSesion
        : () => ({
            cargando: false,
            token: null,
            criaderoId: null
        });


const AccesoNavigator =
    USAR_API
        ? require('./src/navigation/AccesoNavigator').default
        : null;




export default function App() {


    const [
        databaseReady,
        setDatabaseReady
    ] = useState(false);



    const [
        databaseError,
        setDatabaseError
    ] = useState(null);



    const sesion = useSesion();





    useEffect(()=>{


        initialize();


    },[]);






    async function initialize(){


        try{


            try{


                if(
                    NavigationBar &&
                    NavigationBar.setVisibilityAsync
                ){

                    await NavigationBar.setVisibilityAsync(
                        'hidden'
                    );

                }


            }
            catch(error){


                console.log(
                    'No fue posible ocultar barra Android:',
                    error
                );


            }





            await initDatabase();



            setDatabaseReady(
                true
            );


        }
        catch(error){


            console.error(
                'Error inicializando aplicación:',
                error
            );


            setDatabaseError(
                error.message
            );


        }


    }








    if(databaseError){


        return (

            <View
                style={
                    styles.center
                }
            >


                <Text
                    style={
                        styles.errorTitle
                    }
                >
                    Error de aplicación
                </Text>



                <Text>
                    {databaseError}
                </Text>


            </View>

        );

    }








    if(!databaseReady){


        return (

            <View
                style={
                    styles.center
                }
            >


                <ActivityIndicator

                    size="large"

                    color={
                        COLORS.primary
                    }

                />



                <Text
                    style={
                        styles.loadingText
                    }
                >

                    Preparando Criadero Kikirikis...

                </Text>


            </View>

        );

    }








    if(USAR_API){


        if(sesion.cargando){

            return (

                <View
                    style={
                        styles.center
                    }
                >

                    <ActivityIndicator
                        size="large"
                        color={
                            COLORS.primary
                        }
                    />

                </View>

            );

        }


        if(!sesion.token || !sesion.criaderoId){

            return (

                <NavigationContainer>

                    <AccesoNavigator
                        autenticado={
                            Boolean(sesion.token)
                        }
                    />

                </NavigationContainer>

            );

        }


    }





    return (

        <NavigationContainer>


            <AppNavigator />


        </NavigationContainer>

    );

}





const styles =
StyleSheet.create({


    center:{


        flex:1,


        alignItems:'center',


        justifyContent:'center',


        padding:20,


        backgroundColor:
            COLORS.background


    },



    loadingText:{


        marginTop:15,


        color:
            COLORS.textSecondary


    },



    errorTitle:{


        fontSize:20,


        fontWeight:'bold',


        color:
            COLORS.danger,


        marginBottom:10


    }


});