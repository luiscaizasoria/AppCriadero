import React, {
    useCallback,
    useState
} from 'react';

import {
    View,
    Text,
    Image,
    ScrollView,
    TouchableOpacity,
    ActivityIndicator,
    StyleSheet
} from 'react-native';

import {
    useFocusEffect
} from '@react-navigation/native';

import {
    obtenerGenealogiaAve
} from '../repositories/GenealogiaRepository';

import {
    COLORS
} from '../config/constants';



export default function GenealogiaAveScreen({
    route,
    navigation
}) {

    const {
        aveId
    } = route.params;


    const [
        generaciones,
        setGeneraciones
    ] = useState(3);


    const [
        data,
        setData
    ] = useState(null);


    const [
        loading,
        setLoading
    ] = useState(true);


    const cargar =
        async () => {

            try {

                setLoading(
                    true
                );


                const resultado =
                    await obtenerGenealogiaAve(
                        aveId,
                        generaciones
                    );


                setData(
                    resultado
                );

            }
            catch(error){

                console.error(
                    'Error cargando genealog\u00eda:',
                    error
                );

            }
            finally{

                setLoading(
                    false
                );

            }

        };


    useFocusEffect(

        useCallback(
            () => {

                cargar();

            },
            [
                aveId,
                generaciones
            ]
        )

    );


    if(
        loading
    ){

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
                    {'Construyendo \u00e1rbol geneal\u00f3gico...'}
                </Text>

            </View>

        );

    }


    if(
        !data
    ){

        return (

            <View
                style={
                    styles.center
                }
            >

                <Text
                    style={
                        styles.emptyText
                    }
                >
                    No fue posible encontrar el ave.
                </Text>

            </View>

        );

    }


    const tieneAncestros =
        data.ancestros?.padres
        &&
        data.ancestros.padres.length > 0;


    const tieneDescendientes =
        data.descendientes?.hijos
        &&
        data.descendientes.hijos.length > 0;


    const consanguinidad =
        analizarConsanguinidad(
            data
        );


    return (

        <ScrollView
            style={
                styles.container
            }
            contentContainerStyle={
                styles.content
            }
        >

            <Text
                style={
                    styles.title
                }
            >
                {'\uD83C\uDF33 \u00c1rbol geneal\u00f3gico'}
            </Text>


            <Text
                style={
                    styles.subtitle
                }
            >
                {'Ancestros arriba y descendientes abajo. Toca cualquier ejemplar para abrir su detalle; al regresar volverás a este mismo árbol.'}
            </Text>


            {
                data.relacionesInvalidas?.length > 0
                &&
                (
                    <View
                        style={
                            styles.warningCard
                        }
                    >

                        <Text
                            style={
                                styles.warningTitle
                            }
                        >
                            {'\u26A0\uFE0F Relaci\u00f3n geneal\u00f3gica inv\u00e1lida'}
                        </Text>


                        <Text
                            style={
                                styles.warningText
                            }
                        >
                            {'Se detect\u00f3 un parentesco circular. Los ejemplares involucrados se ocultaron del \u00e1rbol para no mostrar una relaci\u00f3n imposible. Corrige el padre o la madre desde Editar ave.'}
                        </Text>


                        {
                            data.relacionesInvalidas.map(
                                (item, index) => (

                                    <Text
                                        key={
                                            `${item.tipo}-${index}`
                                        }
                                        style={
                                            styles.warningDetail
                                        }
                                    >
                                        {'\u2022 '}{item.detalle}
                                    </Text>

                                )
                            )
                        }

                    </View>
                )
            }


            {
                consanguinidad
                &&
                (
                    <View
                        style={
                            styles.consanguinityCard
                        }
                    >

                        <Text
                            style={
                                styles.consanguinityTitle
                            }
                        >
                            {'\uD83E\uDDEC Consanguinidad detectada'}
                        </Text>

                        <Text
                            style={
                                styles.consanguinityType
                            }
                        >
                            {consanguinidad.tipo}
                        </Text>

                        <Text
                            style={
                                styles.consanguinityText
                            }
                        >
                            {consanguinidad.detalle}
                        </Text>

                        {
                            consanguinidad.ancestrosComunes.length > 0
                            &&
                            (
                                <Text
                                    style={
                                        styles.consanguinityCommon
                                    }
                                >
                                    {'Ancestros comunes: '}
                                    {
                                        consanguinidad.ancestrosComunes
                                            .map(item => item.codigo)
                                            .join(', ')
                                    }
                                </Text>
                            )
                        }

                        <Text
                            style={
                                styles.consanguinityNote
                            }
                        >
                            Informativo: el sistema no bloquea este cruce. Los ancestros comunes se resaltan en morado.
                        </Text>

                    </View>
                )
            }


            <View
                style={
                    styles.generationSelector
                }
            >

                <Text
                    style={
                        styles.selectorLabel
                    }
                >
                    Generaciones
                </Text>


                <View
                    style={
                        styles.selectorOptions
                    }
                >

                    {
                        [
                            2,
                            3,
                            4
                        ].map(
                            item => (

                                <TouchableOpacity
                                    key={
                                        item
                                    }
                                    style={[
                                        styles.generationButton,

                                        generaciones === item
                                        &&
                                        styles.generationButtonActive
                                    ]}
                                    onPress={() =>
                                        setGeneraciones(
                                            item
                                        )
                                    }
                                >

                                    <Text
                                        style={[
                                            styles.generationText,

                                            generaciones === item
                                            &&
                                            styles.generationTextActive
                                        ]}
                                    >
                                        {item}
                                    </Text>

                                </TouchableOpacity>

                            )
                        )
                    }

                </View>

            </View>


            <ScrollView
                horizontal
                showsHorizontalScrollIndicator
                contentContainerStyle={
                    styles.horizontalContent
                }
            >

                <View
                    style={
                        styles.treeCanvas
                    }
                >

                    <Text
                        style={
                            styles.directionTitle
                        }
                    >
                        {'\u2191 Ancestros'}
                    </Text>


                    {
                        tieneAncestros
                        ?
                        (
                            <View
                                style={
                                    styles.ancestorForest
                                }
                            >

                                <View
                                    style={
                                        styles.branchRow
                                    }
                                >

                                    {
                                        data.ancestros.padres.map(
                                            item => (

                                                <AncestorBranch
                                                    key={
                                                        `${item.relacion}-${item.nodo.id}`
                                                    }
                                                    relation={
                                                        item.relacion
                                                    }
                                                    node={
                                                        item.nodo
                                                    }
                                                    navigation={
                                                        navigation
                                                    }
                                                    currentAveId={
                                                        aveId
                                                    }
                                                    highlightIds={
                                                        consanguinidad?.idsComunes ||
                                                        new Set()
                                                    }
                                                />

                                            )
                                        )
                                    }

                                </View>


                                <View
                                    style={
                                        styles.verticalConnector
                                    }
                                />

                            </View>
                        )
                        :
                        (
                            <Text
                                style={
                                    styles.noRelations
                                }
                            >
                                Sin ancestros registrados
                            </Text>
                        )
                    }


                    <NodeCard
                        node={
                            data.ave
                        }
                        relation="Ave seleccionada"
                        central
                        onPress={() =>
                            navigation.push(
                                'DetalleAve',
                                {
                                    aveId:
                                        aveId,
                                    desdeGenealogia:
                                        true
                                }
                            )
                        }
                    />


                    <View
                        style={
                            styles.verticalConnector
                        }
                    />


                    <Text
                        style={
                            styles.directionTitle
                        }
                    >
                        {'\u2193 Descendientes'}
                    </Text>


                    {
                        tieneDescendientes
                        ?
                        (
                            <View
                                style={
                                    styles.descendantForest
                                }
                            >

                                <View
                                    style={
                                        styles.branchRow
                                    }
                                >

                                    {
                                        data.descendientes.hijos.map(
                                            item => (

                                                <DescendantBranch
                                                    key={
                                                        item.id
                                                    }
                                                    node={
                                                        item
                                                    }
                                                    navigation={
                                                        navigation
                                                    }
                                                    currentAveId={
                                                        aveId
                                                    }
                                                />

                                            )
                                        )
                                    }

                                </View>

                            </View>
                        )
                        :
                        (
                            <Text
                                style={
                                    styles.noRelations
                                }
                            >
                                Sin descendientes registrados
                            </Text>
                        )
                    }

                </View>

            </ScrollView>

        </ScrollView>

    );

}



function AncestorBranch({
    relation,
    node,
    navigation,
    currentAveId,
    highlightIds
}) {

    const padres =
        node.padres ||
        [];


    return (

        <View
            style={
                styles.branch
            }
        >

            {
                padres.length > 0
                &&
                (
                    <>
                        <View
                            style={
                                styles.branchRow
                            }
                        >

                            {
                                padres.map(
                                    item => (

                                        <AncestorBranch
                                            key={
                                                `${item.relacion}-${item.nodo.id}`
                                            }
                                            relation={
                                                item.relacion
                                            }
                                            node={
                                                item.nodo
                                            }
                                            navigation={
                                                navigation
                                            }
                                            currentAveId={
                                                currentAveId
                                            }
                                            highlightIds={
                                                highlightIds
                                            }
                                        />

                                    )
                                )
                            }

                        </View>

                        <View
                            style={
                                styles.verticalConnector
                            }
                        />
                    </>
                )
            }


            <NodeCard
                node={
                    node
                }
                relation={
                    relation
                }
                highlight={
                    highlightIds?.has(
                        Number(node.id)
                    )
                }
                onPress={() =>
                    abrirAve(
                        navigation,
                        currentAveId,
                        node.id
                    )
                }
            />

        </View>

    );

}



function DescendantBranch({
    node,
    navigation,
    currentAveId
}) {

    const hijos =
        node.hijos ||
        [];


    return (

        <View
            style={
                styles.branch
            }
        >

            <NodeCard
                node={
                    node
                }
                relation="Descendiente"
                onPress={() =>
                    abrirAve(
                        navigation,
                        currentAveId,
                        node.id
                    )
                }
            />


            {
                hijos.length > 0
                &&
                (
                    <>
                        <View
                            style={
                                styles.verticalConnector
                            }
                        />

                        <View
                            style={
                                styles.branchRow
                            }
                        >

                            {
                                hijos.map(
                                    item => (

                                        <DescendantBranch
                                            key={
                                                item.id
                                            }
                                            node={
                                                item
                                            }
                                            navigation={
                                                navigation
                                            }
                                            currentAveId={
                                                currentAveId
                                            }
                                        />

                                    )
                                )
                            }

                        </View>
                    </>
                )
            }

        </View>

    );

}



function NodeCard({
    node,
    relation,
    central = false,
    highlight = false,
    onPress = null
}) {

    const contenido = (

        <View
            style={[
                styles.nodeCard,

                node.sexo === 'MACHO'
                &&
                styles.nodeMale,

                node.sexo === 'HEMBRA'
                &&
                styles.nodeFemale,

                central
                &&
                styles.nodeCardCentral,

                highlight
                &&
                styles.nodeCardConsanguineous,

                node.estado === 'FALLECIDA'
                &&
                styles.nodeCardInactive
            ]}
        >

            <Text
                style={
                    styles.relation
                }
            >
                {relation}
            </Text>


            {
                node.foto_uri
                ?
                (
                    <Image
                        source={{
                            uri:
                                node.foto_uri
                        }}
                        style={
                            styles.nodePhoto
                        }
                    />
                )
                :
                (
                    <View
                        style={
                            styles.nodePhotoEmpty
                        }
                    >

                        <Text
                            style={
                                styles.nodePhotoIcon
                            }
                        >
                            {
                                node.sexo === 'MACHO'
                                    ? '\uD83D\uDC13'
                                    : '\uD83D\uDC14'
                            }
                        </Text>

                    </View>
                )
            }


            <Text
                style={
                    styles.nodeCode
                }
            >
                {node.codigo}
            </Text>


            <Text
                style={
                    styles.nodeRaza
                }
                numberOfLines={1}
            >
                {
                    node.raza ||
                    'Sin raza'
                }
            </Text>


            <Text
                style={
                    styles.nodeSex
                }
            >
                {
                    textoSexo(
                        node.sexo
                    )
                }
            </Text>


            {
                node.estado !== 'ACTIVA'
                &&
                (
                    <Text
                        style={
                            styles.nodeStatus
                        }
                    >
                        {
                            node.estado === 'VENDIDA'
                                ? '\uD83D\uDCB0 Vendida'
                                : '\u26B0\uFE0F Fallecida'
                        }
                    </Text>
                )
            }

        </View>

    );


    if(
        !onPress
    ){

        return contenido;

    }


    return (

        <TouchableOpacity
            activeOpacity={0.8}
            onPress={
                onPress
            }
        >
            {contenido}
        </TouchableOpacity>

    );

}



function abrirAve(
    navigation,
    currentAveId,
    newAveId
) {

    if(
        Number(currentAveId)
        ===
        Number(newAveId)
    ){

        return;

    }


    navigation.push(
        'DetalleAve',
        {
            aveId:
                newAveId,
            desdeGenealogia:
                true
        }
    );

}



function analizarConsanguinidad(
    data
) {

    const padres =
        data?.ancestros?.padres ||
        [];


    if (
        padres.length < 2
    ) {

        return null;

    }


    const primero =
        padres[0]?.nodo;

    const segundo =
        padres[1]?.nodo;


    if (
        !primero
        ||
        !segundo
    ) {

        return null;

    }


    const mapaPrimero =
        obtenerMapaAncestros(
            primero
        );

    const mapaSegundo =
        obtenerMapaAncestros(
            segundo
        );


    const idsComunes =
        new Set(
            [
                ...mapaPrimero.keys()
            ]
                .filter(
                    id =>
                        mapaSegundo.has(
                            id
                        )
                )
        );


    if (
        idsComunes.size === 0
    ) {

        return null;

    }


    const ancestrosComunes =
        [
            ...idsComunes
        ]
            .map(
                id =>
                    mapaPrimero.get(id)?.node
                    ||
                    mapaSegundo.get(id)?.node
            )
            .filter(Boolean)
            .sort(
                (a, b) =>
                    String(a.codigo || '')
                        .localeCompare(
                            String(b.codigo || '')
                        )
            );


    const profundidadPrimeroEnSegundo =
        mapaSegundo.get(
            Number(primero.id)
        )?.depth;

    const profundidadSegundoEnPrimero =
        mapaPrimero.get(
            Number(segundo.id)
        )?.depth;


    let tipo =
        'Ancestro común detectado';

    let detalle =
        `Los progenitores ${primero.codigo} y ${segundo.codigo} comparten ascendencia.`;


    if (
        profundidadPrimeroEnSegundo
        &&
        profundidadPrimeroEnSegundo > 0
    ) {

        const parentesco =
            describirCruceAscendente(
                primero,
                segundo,
                profundidadPrimeroEnSegundo
            );

        tipo =
            parentesco.tipo;

        detalle =
            parentesco.detalle;

    }
    else if (
        profundidadSegundoEnPrimero
        &&
        profundidadSegundoEnPrimero > 0
    ) {

        const parentesco =
            describirCruceAscendente(
                segundo,
                primero,
                profundidadSegundoEnPrimero
            );

        tipo =
            parentesco.tipo;

        detalle =
            parentesco.detalle;

    }
    else {

        const padresPrimero =
            new Set(
                (primero.padres || [])
                    .map(
                        item =>
                            Number(item.nodo?.id)
                    )
                    .filter(Number.isFinite)
            );

        const padresSegundo =
            new Set(
                (segundo.padres || [])
                    .map(
                        item =>
                            Number(item.nodo?.id)
                    )
                    .filter(Number.isFinite)
            );

        const padresComunes =
            [
                ...padresPrimero
            ]
                .filter(
                    id =>
                        padresSegundo.has(id)
                );


        if (
            padresComunes.length > 0
        ) {

            tipo =
                padresComunes.length >= 2
                    ? 'Cruce entre hermanos'
                    : 'Cruce entre medio hermanos';

            detalle =
                `${primero.codigo} y ${segundo.codigo} comparten ${padresComunes.length >= 2 ? 'ambos progenitores' : 'un progenitor'}.`;

        }

    }


    return {
        tipo,
        detalle,
        idsComunes,
        ancestrosComunes
    };

}


function obtenerMapaAncestros(
    root
) {

    const result =
        new Map();


    const visitar =
        (
            node,
            depth
        ) => {

            if (
                !node
                ||
                node.id === null
                ||
                node.id === undefined
            ) {

                return;

            }


            const id =
                Number(node.id);


            const existente =
                result.get(id);


            if (
                !existente
                ||
                depth < existente.depth
            ) {

                result.set(
                    id,
                    {
                        node,
                        depth
                    }
                );

            }


            for (
                const item
                of (
                    node.padres ||
                    []
                )
            ) {

                visitar(
                    item.nodo,
                    depth + 1
                );

            }

        };


    visitar(
        root,
        0
    );


    return result;

}


function describirCruceAscendente(
    ancestro,
    descendiente,
    profundidad
) {

    let tipo =
        'Cruce entre ancestro y descendiente';


    if (
        profundidad === 1
    ) {

        if (
            ancestro.sexo === 'MACHO'
            &&
            descendiente.sexo === 'HEMBRA'
        ) {

            tipo =
                'Cruce padre × hija';

        }
        else if (
            ancestro.sexo === 'HEMBRA'
            &&
            descendiente.sexo === 'MACHO'
        ) {

            tipo =
                'Cruce madre × hijo';

        }
        else {

            tipo =
                'Cruce progenitor × descendiente';

        }

    }
    else if (
        profundidad === 2
    ) {

        if (
            ancestro.sexo === 'MACHO'
            &&
            descendiente.sexo === 'HEMBRA'
        ) {

            tipo =
                'Cruce abuelo × nieta';

        }
        else if (
            ancestro.sexo === 'HEMBRA'
            &&
            descendiente.sexo === 'MACHO'
        ) {

            tipo =
                'Cruce abuela × nieto';

        }
        else {

            tipo =
                'Cruce abuelo/a × nieto/a';

        }

    }


    return {
        tipo,
        detalle:
            `${ancestro.codigo} es ancestro de ${descendiente.codigo}. El cruce se mantiene permitido y se muestra únicamente como información genealógica.`
    };

}


function textoSexo(
    sexo
) {

    if(
        sexo === 'MACHO'
    ){

        return '\uD83D\uDC13 Macho';

    }


    if(
        sexo === 'HEMBRA'
    ){

        return '\uD83D\uDC14 Hembra';

    }


    return 'Sexo no registrado';

}



const styles =
StyleSheet.create({

    container:{

        flex:1,

        backgroundColor:
            COLORS.background

    },


    content:{

        padding:16,

        paddingBottom:40

    },


    center:{

        flex:1,

        justifyContent:'center',

        alignItems:'center',

        backgroundColor:
            COLORS.background,

        padding:20

    },


    loadingText:{

        marginTop:10,

        color:
            COLORS.textSecondary

    },


    emptyText:{

        color:
            COLORS.textSecondary

    },


    title:{

        fontSize:27,

        fontWeight:'bold',

        color:
            COLORS.primary

    },


    subtitle:{

        marginTop:6,

        color:
            COLORS.textSecondary,

        lineHeight:20

    },


    consanguinityCard:{

        backgroundColor:'#f4edff',

        borderWidth:1,

        borderColor:'#9b72cf',

        borderRadius:14,

        padding:14,

        marginTop:16

    },


    consanguinityTitle:{

        fontSize:16,

        fontWeight:'bold',

        color:'#6d45a2'

    },


    consanguinityType:{

        marginTop:6,

        fontWeight:'bold',

        color:'#4d2d73'

    },


    consanguinityText:{

        marginTop:5,

        color:COLORS.text,

        lineHeight:19

    },


    consanguinityCommon:{

        marginTop:7,

        color:'#6d45a2',

        fontWeight:'600'

    },


    consanguinityNote:{

        marginTop:8,

        color:COLORS.textSecondary,

        fontSize:12,

        lineHeight:17

    },


    warningCard:{

        backgroundColor:'#fff4d6',

        borderWidth:1,

        borderColor:'#e4b84c',

        borderRadius:14,

        padding:14,

        marginTop:16

    },


    warningTitle:{

        fontSize:16,

        fontWeight:'bold',

        color:'#6d5200'

    },


    warningText:{

        marginTop:6,

        color:'#6d5200',

        lineHeight:19

    },


    warningDetail:{

        marginTop:7,

        color:'#6d5200',

        lineHeight:18

    },


    generationSelector:{

        marginTop:18,

        marginBottom:14,

        backgroundColor:
            COLORS.card,

        borderRadius:14,

        padding:12,

        flexDirection:'row',

        alignItems:'center',

        justifyContent:'space-between'

    },


    selectorLabel:{

        fontWeight:'600',

        color:
            COLORS.text

    },


    selectorOptions:{

        flexDirection:'row'

    },


    generationButton:{

        width:38,

        height:34,

        borderRadius:10,

        alignItems:'center',

        justifyContent:'center',

        marginLeft:7,

        backgroundColor:'#edf1f1'

    },


    generationButtonActive:{

        backgroundColor:
            COLORS.primary

    },


    generationText:{

        color:
            COLORS.text,

        fontWeight:'bold'

    },


    generationTextActive:{

        color:
            COLORS.white

    },


    horizontalContent:{

        paddingHorizontal:8,

        paddingBottom:20

    },


    treeCanvas:{

        minWidth:560,

        alignItems:'center',

        paddingHorizontal:20,

        paddingVertical:10

    },


    directionTitle:{

        fontSize:16,

        fontWeight:'bold',

        color:'#4f7f69',

        marginVertical:8

    },


    ancestorForest:{

        alignItems:'center'

    },


    descendantForest:{

        alignItems:'center'

    },


    branchRow:{

        flexDirection:'row',

        alignItems:'flex-end',

        justifyContent:'center'

    },


    branch:{

        alignItems:'center',

        marginHorizontal:8

    },


    verticalConnector:{

        width:3,

        height:28,

        backgroundColor:'#8ec9b8',

        borderRadius:2

    },


    noRelations:{

        color:
            COLORS.textSecondary,

        fontStyle:'italic',

        marginVertical:10

    },


    nodeCard:{

        width:142,

        minHeight:178,

        backgroundColor:
            COLORS.card,

        borderWidth:1,

        borderColor:'#b8d8ce',

        borderRadius:16,

        padding:10,

        alignItems:'center',

        marginVertical:4,

        elevation:2

    },


    nodeMale:{

        backgroundColor:'#eef6ff'

    },


    nodeFemale:{

        backgroundColor:'#fff1f6'

    },


    nodeCardCentral:{

        width:158,

        borderWidth:2,

        borderColor:
            COLORS.primary

    },


    nodeCardConsanguineous:{

        borderWidth:3,

        borderColor:'#8b5fc0',

        backgroundColor:'#f3ebff'

    },


    nodeCardInactive:{

        opacity:0.72

    },


    relation:{

        fontSize:11,

        fontWeight:'bold',

        color:'#4f7f69',

        marginBottom:6,

        textAlign:'center'

    },


    nodePhoto:{

        width:58,

        height:58,

        borderRadius:29

    },


    nodePhotoEmpty:{

        width:58,

        height:58,

        borderRadius:29,

        backgroundColor:'#e7f5f5',

        alignItems:'center',

        justifyContent:'center'

    },


    nodePhotoIcon:{

        fontSize:27

    },


    nodeCode:{

        marginTop:7,

        fontSize:16,

        fontWeight:'bold',

        color:
            COLORS.text

    },


    nodeRaza:{

        marginTop:2,

        maxWidth:120,

        color:
            COLORS.textSecondary,

        fontSize:12

    },


    nodeSex:{

        marginTop:4,

        color:
            COLORS.text,

        fontSize:12

    },


    nodeStatus:{

        marginTop:4,

        fontSize:11,

        color:
            COLORS.textSecondary

    }

});
