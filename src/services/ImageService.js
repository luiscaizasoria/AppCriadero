import * as ImagePicker
    from 'expo-image-picker';

import * as FileSystem
    from 'expo-file-system/legacy';


export async function seleccionarFotoGaleria() {

    const permission =
        await ImagePicker
            .requestMediaLibraryPermissionsAsync();


    if (!permission.granted) {

        throw new Error(
            'PERMISO_GALERIA_DENEGADO'
        );

    }


    const result =
        await ImagePicker
            .launchImageLibraryAsync({

                mediaTypes: [
                    'images'
                ],

                allowsEditing: true,

                aspect: [
                    1,
                    1
                ],

                quality: 0.85

            });


    if (result.canceled) {

        return null;

    }


    return result.assets[0].uri;

}


export async function tomarFotoCamara() {

    const permission =
        await ImagePicker
            .requestCameraPermissionsAsync();


    if (!permission.granted) {

        throw new Error(
            'PERMISO_CAMARA_DENEGADO'
        );

    }


    const result =
        await ImagePicker
            .launchCameraAsync({

                mediaTypes: [
                    'images'
                ],

                allowsEditing: true,

                aspect: [
                    1,
                    1
                ],

                quality: 0.85

            });


    if (result.canceled) {

        return null;

    }


    return result.assets[0].uri;

}


export async function guardarFotoAve(
    uriTemporal,
    codigoAve
) {

    if (!uriTemporal) {

        return null;

    }


    if (!FileSystem.documentDirectory) {

        throw new Error(
            'DIRECTORIO_DOCUMENTOS_NO_DISPONIBLE'
        );

    }


    const codigoSeguro =
        limpiarNombre(
            codigoAve
        );


    const directorio =
        `${FileSystem.documentDirectory}` +
        `kikirikis/aves/` +
        `${codigoSeguro}/`;


    await FileSystem
        .makeDirectoryAsync(
            directorio,
            {
                intermediates: true
            }
        );


    const extension =
        obtenerExtension(
            uriTemporal
        );


    const nombreArchivo =
        `foto_${Date.now()}_` +
        `${Math.random()
            .toString(36)
            .substring(2, 8)}` +
        `.${extension}`;


    const destino =
        `${directorio}${nombreArchivo}`;


    await FileSystem.copyAsync({

        from:
            uriTemporal,

        to:
            destino

    });


    return destino;

}


function limpiarNombre(
    value
) {

    return String(
        value || 'AVE'
    )
        .trim()
        .replace(
            /[^a-zA-Z0-9_-]/g,
            '_'
        );

}


function obtenerExtension(
    uri
) {

    const limpio =
        String(uri)
            .split('?')[0];


    const match =
        limpio.match(
            /\.([a-zA-Z0-9]+)$/
        );


    if (!match) {

        return 'jpg';

    }


    const extension =
        match[1]
            .toLowerCase();


    const permitidas = [

        'jpg',
        'jpeg',
        'png',
        'webp'

    ];


    return permitidas.includes(
        extension
    )
        ? extension
        : 'jpg';

}