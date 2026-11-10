import React, {
    useCallback,
    useState
} from 'react';

import {
    View,
    Text,
    Image,
    ScrollView,
    StyleSheet
} from 'react-native';

import {
    useFocusEffect
} from '@react-navigation/native';

import {
    obtenerGenealogiaAve
} from '../repositories/GenealogiaRepository';

import FondoPantalla
    from '../components/FondoPantalla';

import Chip
    from '../components/Chip';

import Icono
    from '../components/Icono';

import IconoCirculo
    from '../components/IconoCirculo';

import Pulsable
    from '../components/Pulsable';

import EstadoCarga
    from '../components/EstadoCarga';

import EstadoError
    from '../components/EstadoError';

import {
    visualSexo,
    propsAvatar
} from '../components/aveVisual';

import {
    colors,
    radii,
    spacing,
    typography
} from '../theme';



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

            <FondoPantalla>

                <View
                    style={
                        styles.center
                    }
                >

                    <EstadoCarga
                        mensaje={'Construyendo \u00e1rbol geneal\u00f3gico...'}
                    />

                </View>

            </FondoPantalla>

        );

    }


    if(
        !data
    ){

        // Sin Alert (excepci\u00f3n aprobada): estado de error con \u00abReintentar\u00bb en lugar del texto suelto.
        return (

            <FondoPantalla>

                <View
                    style={
                        styles.center
                    }
                >

                    <EstadoError
                        titulo={'No fue posible cargar el \u00e1rbol geneal\u00f3gico.'}
                        onReintentar={
                            cargar
                        }
                    />

                </View>

            </FondoPantalla>

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

        <FondoPantalla>

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
                accessibilityRole="header"
            >
                {'\u00c1rbol geneal\u00f3gico'}
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
                        accessibilityRole="alert"
                    >

                        <View
                            style={
                                styles.cardTitleRow
                            }
                        >

                            <Icono
                                nombre="warning"
                                tamano={22}
                                color={
                                    colors.warningText
                                }
                                style={
                                    styles.cardTitleIcon
                                }
                            />

                        <Text
                            style={
                                styles.warningTitle
                            }
                        >
                            {'Relaci\u00f3n geneal\u00f3gica inv\u00e1lida'}
                        </Text>

                        </View>


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

                        <View
                            style={
                                styles.cardTitleRow
                            }
                        >

                            <Icono
                                nombre="link-outline"
                                tamano={22}
                                color={
                                    colors.primaryDark
                                }
                                style={
                                    styles.cardTitleIcon
                                }
                            />

                        <Text
                            style={
                                styles.consanguinityTitle
                            }
                        >
                            {'Consanguinidad detectada'}
                        </Text>

                        </View>

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

                                <Pulsable
                                    key={
                                        item
                                    }
                                    testID={
                                        `generaciones-${item}`
                                    }
                                    accessibilityRole="button"
                                    accessibilityLabel={
                                        `${item} generaciones`
                                    }
                                    accessibilityState={{
                                        selected:
                                            generaciones === item
                                    }}
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

                                </Pulsable>

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

                    <View
                        style={
                            styles.directionRow
                        }
                    >

                        <Icono
                            nombre="arrow-up-circle-outline"
                            tamano={22}
                            color={
                                colors.primaryDark
                            }
                            style={
                                styles.cardTitleIcon
                            }
                        />

                        <Text
                            style={
                                styles.directionTitle
                            }
                        >
                            Ancestros
                        </Text>

                    </View>


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
                            navigation.navigate(
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


                    <View
                        style={
                            styles.directionRow
                        }
                    >

                        <Icono
                            nombre="arrow-down-circle-outline"
                            tamano={22}
                            color={
                                colors.primaryDark
                            }
                            style={
                                styles.cardTitleIcon
                            }
                        />

                        <Text
                            style={
                                styles.directionTitle
                            }
                        >
                            Descendientes
                        </Text>

                    </View>


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

        </FondoPantalla>

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
                        String(node.id)
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

            <View
                style={
                    styles.relationRow
                }
            >

                {
                    highlight
                    &&
                    (
                        <Icono
                            nombre="link-outline"
                            tamano={14}
                            color={
                                colors.primaryDark
                            }
                            style={
                                styles.relationIcon
                            }
                        />
                    )
                }

                <Text
                    style={
                        styles.relation
                    }
                >
                    {relation}
                </Text>

            </View>


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
                    <IconoCirculo
                        icono="paw-outline"
                        tamano={58}
                        borde
                        {...propsAvatar(node)}
                    />
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


            <View
                style={
                    styles.nodeSexRow
                }
            >

                <Icono
                    nombre={
                        visualSexo(
                            node.sexo
                        ).icono
                    }
                    tamano={14}
                    color={
                        colors.textSecondary
                    }
                    style={
                        styles.relationIcon
                    }
                />

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

            </View>


            {
                node.estado !== 'ACTIVA'
                &&
                (
                    <Chip
                        texto={
                            node.estado === 'VENDIDA'
                                ? 'Vendida'
                                : 'Fallecida'
                        }
                        tono={
                            node.estado === 'VENDIDA'
                                ? 'info'
                                : 'neutro'
                        }
                        icono={
                            node.estado === 'VENDIDA'
                                ? 'cart-outline'
                                : 'skull-outline'
                        }
                        style={
                            styles.nodeStatus
                        }
                    />
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

        <Pulsable
            sinMinimo
            escala={0.98}
            accessibilityRole="button"
            accessibilityLabel={
                `${node.codigo}, ${relation}`
            }
            onPress={
                onPress
            }
        >
            {contenido}
        </Pulsable>

    );

}



function abrirAve(
    navigation,
    currentAveId,
    newAveId
) {

    if(
        String(currentAveId)
        ===
        String(newAveId)
    ){

        return;

    }


    navigation.navigate(
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
            String(primero.id)
        )?.depth;

    const profundidadSegundoEnPrimero =
        mapaPrimero.get(
            String(segundo.id)
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
                            item.nodo?.id
                    )
                    .filter(id => id !== undefined && id !== null)
            );

        const padresSegundo =
            new Set(
                (segundo.padres || [])
                    .map(
                        item =>
                            item.nodo?.id
                    )
                    .filter(id => id !== undefined && id !== null)
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
                String(node.id);


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

        return 'Macho';

    }


    if(
        sexo === 'HEMBRA'
    ){

        return 'Hembra';

    }


    return 'Sexo no registrado';

}



const styles =
StyleSheet.create({

    container:{

        flex:1

    },


    content:{

        padding:spacing.pantalla,

        paddingBottom:40

    },


    center:{

        flex:1,

        justifyContent:'center',

        alignItems:'center',

        padding:spacing.xl

    },


    title:{

        ...typography.titulo,

        color:
            colors.primaryDark

    },


    subtitle:{

        ...typography.cuerpo,

        marginTop:spacing.xs,

        color:
            colors.textSecondary

    },


    cardTitleRow:{

        flexDirection:'row',

        alignItems:'center'

    },


    cardTitleIcon:{

        marginRight:spacing.sm

    },


    // Aviso de consanguinidad: mismo contenido y lógica; colores del tema (morado de parentesco).
    // primaryDark sobre primarySoft >= 9,8:1; texto principal sobre primarySoft >= 14:1.
    consanguinityCard:{

        backgroundColor:
            colors.primarySoft,

        borderWidth:2,

        borderColor:
            colors.kinship,

        borderRadius:radii.md,

        padding:spacing.md,

        marginTop:spacing.lg

    },


    consanguinityTitle:{

        ...typography.subtitulo,

        flex:1,

        color:
            colors.primaryDark

    },


    consanguinityType:{

        ...typography.cuerpoFuerte,

        marginTop:6,

        color:
            colors.primaryDark

    },


    consanguinityText:{

        ...typography.cuerpo,

        marginTop:5,

        color:
            colors.text

    },


    consanguinityCommon:{

        ...typography.etiqueta,

        marginTop:7,

        color:
            colors.primaryDark

    },


    consanguinityNote:{

        ...typography.secundario,

        marginTop:8,

        color:
            colors.textSecondary

    },


    // Aviso de relación inválida: warningText sobre warningSoft 6,7:1
    warningCard:{

        backgroundColor:
            colors.warningSoft,

        borderWidth:2,

        borderColor:
            colors.warning,

        borderRadius:radii.md,

        padding:spacing.md,

        marginTop:spacing.lg

    },


    warningTitle:{

        ...typography.subtitulo,

        flex:1,

        color:
            colors.warningText

    },


    warningText:{

        ...typography.cuerpo,

        marginTop:6,

        color:
            colors.warningText

    },


    warningDetail:{

        ...typography.cuerpo,

        marginTop:7,

        color:
            colors.warningText

    },


    generationSelector:{

        marginTop:spacing.lg,

        marginBottom:spacing.md,

        backgroundColor:
            colors.surface,

        borderWidth:1,

        borderColor:
            colors.borderSoft,

        borderRadius:radii.lg,

        padding:spacing.md,

        flexDirection:'row',

        alignItems:'center',

        justifyContent:'space-between'

    },


    selectorLabel:{

        ...typography.etiqueta,

        color:
            colors.text

    },


    selectorOptions:{

        flexDirection:'row'

    },


    generationButton:{

        width:48,

        height:44,

        borderRadius:radii.sm,

        borderWidth:2,

        borderColor:
            colors.border,

        alignItems:'center',

        justifyContent:'center',

        marginLeft:spacing.sm,

        backgroundColor:
            colors.surfaceAlt

    },


    generationButtonActive:{

        backgroundColor:
            colors.primary,

        borderColor:
            colors.primary

    },


    generationText:{

        ...typography.cuerpoFuerte,

        color:
            colors.text

    },


    generationTextActive:{

        color:
            colors.white

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


    directionRow:{

        flexDirection:'row',

        alignItems:'center',

        marginVertical:spacing.sm

    },


    directionTitle:{

        ...typography.subtitulo,

        color:
            colors.primaryDark

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

        backgroundColor:
            colors.border,

        borderRadius:2

    },


    noRelations:{

        ...typography.secundario,

        color:
            colors.textSecondary,

        fontStyle:'italic',

        marginVertical:10

    },


    // Nodo: sin sombra (borde de 1 px); tintes suaves por sexo. Texto principal y
    // textSecondary sobre infoSoft/#FFE3EC/primarySoft >= 6,0:1.
    nodeCard:{

        width:148,

        minHeight:184,

        backgroundColor:
            colors.surface,

        borderWidth:1,

        borderColor:
            colors.borderSoft,

        borderRadius:radii.lg,

        padding:10,

        alignItems:'center',

        marginVertical:4

    },


    nodeMale:{

        backgroundColor:
            colors.infoSoft

    },


    nodeFemale:{

        backgroundColor:
            colors.fondoA

    },


    nodeCardCentral:{

        width:164,

        borderWidth:3,

        borderColor:
            colors.primary

    },


    // Ancestro común (consanguinidad): se conserva el resaltado en morado, con borde grueso,
    // fondo suave e icono de enlace en la etiqueta.
    nodeCardConsanguineous:{

        borderWidth:4,

        borderColor:
            colors.kinship,

        backgroundColor:
            colors.primarySoft

    },


    // Fallecida: borde discontinuo en lugar de opacidad (la opacidad 0,8 bajaba el texto
    // secundario a ~4,5:1; sin ella queda en >= 6,0:1 sobre los tintes del nodo).
    nodeCardInactive:{

        borderStyle:'dashed'

    },


    relationRow:{

        flexDirection:'row',

        alignItems:'center',

        justifyContent:'center',

        marginBottom:6

    },


    relationIcon:{

        marginRight:4

    },


    relation:{

        ...typography.chip,

        color:
            colors.primaryDark,

        textAlign:'center'

    },


    nodePhoto:{

        width:58,

        height:58,

        borderRadius:29,

        borderWidth:3,

        borderColor:
            colors.white

    },


    nodeCode:{

        ...typography.subtitulo,

        marginTop:7,

        color:
            colors.text

    },


    nodeRaza:{

        ...typography.secundario,

        marginTop:2,

        maxWidth:124,

        color:
            colors.textSecondary

    },


    nodeSexRow:{

        flexDirection:'row',

        alignItems:'center',

        marginTop:4

    },


    nodeSex:{

        ...typography.secundario,

        color:
            colors.text

    },


    nodeStatus:{

        alignSelf:'center',

        marginTop:6

    }

});
