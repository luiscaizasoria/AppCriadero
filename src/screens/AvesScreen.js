import React, {
    useCallback,
    useMemo,
    useState
} from 'react';

import {
    View,
    Text,
    TextInput,
    ScrollView,
    TouchableOpacity,
    ActivityIndicator,
    StyleSheet
} from 'react-native';

import {
    useFocusEffect
} from '@react-navigation/native';

import Header
    from '../components/Header';

import AveCard
    from '../components/AveCard';

import {
    obtenerAvesActivas,
    obtenerAvesVendidas,
    obtenerAvesFallecidas
} from '../repositories/AveRepository';

import {
    COLORS
} from '../config/constants';


export default function AvesScreen({
    navigation
}) {

    const [aves, setAves] = useState([]);
    const [tabActual, setTabActual] = useState('ACTIVAS');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const [busqueda, setBusqueda] = useState('');
    const [mostrarFiltros, setMostrarFiltros] = useState(false);
    const [filtroRaza, setFiltroRaza] = useState('TODAS');
    const [filtroSexo, setFiltroSexo] = useState('TODOS');
    const [filtroSalud, setFiltroSalud] = useState('TODAS');
    const [filtroJaula, setFiltroJaula] = useState('TODAS');
    const [edadDesde, setEdadDesde] = useState('');
    const [edadHasta, setEdadHasta] = useState('');


    const cargarAves =
        async () => {

            try {

                setLoading(true);
                setError(null);

                let data = [];

                if (tabActual === 'ACTIVAS') {
                    data = await obtenerAvesActivas();
                }
                else if (tabActual === 'VENDIDAS') {
                    data = await obtenerAvesVendidas();
                }
                else {
                    data = await obtenerAvesFallecidas();
                }

                setAves(data);

            }
            catch (err) {

                console.error(
                    'Error cargando aves:',
                    err
                );

                setError(
                    'No se pudieron cargar las aves.'
                );

            }
            finally {

                setLoading(false);

            }

        };


    useFocusEffect(
        useCallback(
            () => {
                cargarAves();
            },
            [tabActual]
        )
    );


    const razas =
        useMemo(
            () =>
                [...new Set(
                    aves
                        .map(item => item.raza)
                        .filter(Boolean)
                )]
                    .sort((a, b) =>
                        String(a).localeCompare(String(b))
                    ),
            [aves]
        );


    const jaulas =
        useMemo(
            () =>
                [...new Set(
                    aves
                        .map(item => item.jaula_codigo)
                        .filter(Boolean)
                )]
                    .sort((a, b) =>
                        String(a).localeCompare(String(b))
                    ),
            [aves]
        );


    const listaFiltrada =
        useMemo(
            () => {

                const texto =
                    busqueda
                        .trim()
                        .toLowerCase();

                const minimo =
                    parseEnteroOpcional(
                        edadDesde
                    );

                const maximo =
                    parseEnteroOpcional(
                        edadHasta
                    );


                return aves.filter(item => {

                    if (
                        texto
                        &&
                        !String(item.codigo || '')
                            .toLowerCase()
                            .includes(texto)
                    ) {
                        return false;
                    }

                    if (
                        filtroRaza !== 'TODAS'
                        &&
                        item.raza !== filtroRaza
                    ) {
                        return false;
                    }

                    if (
                        filtroSexo !== 'TODOS'
                        &&
                        item.sexo !== filtroSexo
                    ) {
                        return false;
                    }

                    if (
                        filtroSalud !== 'TODAS'
                        &&
                        normalizarSalud(item.estado_salud) !== filtroSalud
                    ) {
                        return false;
                    }

                    if (
                        filtroJaula === 'SIN_JAULA'
                        &&
                        item.jaula_codigo
                    ) {
                        return false;
                    }

                    if (
                        filtroJaula !== 'TODAS'
                        &&
                        filtroJaula !== 'SIN_JAULA'
                        &&
                        item.jaula_codigo !== filtroJaula
                    ) {
                        return false;
                    }

                    if (
                        minimo !== null
                        ||
                        maximo !== null
                    ) {

                        const edadMeses =
                            obtenerEdadMeses(
                                item.fecha_nacimiento
                            );

                        if (
                            edadMeses === null
                        ) {
                            return false;
                        }

                        if (
                            minimo !== null
                            &&
                            edadMeses < minimo
                        ) {
                            return false;
                        }

                        if (
                            maximo !== null
                            &&
                            edadMeses > maximo
                        ) {
                            return false;
                        }

                    }

                    return true;

                });

            },
            [
                aves,
                busqueda,
                filtroRaza,
                filtroSexo,
                filtroSalud,
                filtroJaula,
                edadDesde,
                edadHasta
            ]
        );


    const limpiarFiltros = () => {
        setBusqueda('');
        setFiltroRaza('TODAS');
        setFiltroSexo('TODOS');
        setFiltroSalud('TODAS');
        setFiltroJaula('TODAS');
        setEdadDesde('');
        setEdadHasta('');
    };


    return (

        <View style={styles.container}>

            <ScrollView
                contentContainerStyle={
                    styles.content
                }
                keyboardShouldPersistTaps="handled"
            >

                <Header
                    title="Aves"
                    subtitle="Control y trazabilidad de las aves"
                />


                <View style={styles.tabs}>
                    {
                        [
                            {id:'ACTIVAS', label:'🐔 Activas'},
                            {id:'VENDIDAS', label:'💰 Vendidas'},
                            {id:'FALLECIDAS', label:'⚰ Fallecidas'}
                        ].map(tab => (
                            <TouchableOpacity
                                key={tab.id}
                                style={[
                                    styles.tab,
                                    tabActual === tab.id &&
                                    styles.tabActive
                                ]}
                                onPress={() =>
                                    setTabActual(tab.id)
                                }
                            >
                                <Text
                                    style={[
                                        styles.tabText,
                                        tabActual === tab.id &&
                                        styles.tabTextActive
                                    ]}
                                >
                                    {tab.label}
                                </Text>
                            </TouchableOpacity>
                        ))
                    }
                </View>


                {
                    tabActual === 'ACTIVAS'
                    &&
                    (
                        <TouchableOpacity
                            style={styles.newButton}
                            onPress={() =>
                                navigation.navigate('NuevaAve')
                            }
                        >
                            <Text style={styles.newButtonText}>
                                ＋ Nueva ave
                            </Text>
                        </TouchableOpacity>
                    )
                }


                <View style={styles.searchRow}>
                    <TextInput
                        style={styles.searchInput}
                        value={busqueda}
                        onChangeText={setBusqueda}
                        placeholder="Buscar por código..."
                        autoCapitalize="characters"
                    />

                    <TouchableOpacity
                        style={[
                            styles.filterButton,
                            mostrarFiltros &&
                            styles.filterButtonActive
                        ]}
                        onPress={() =>
                            setMostrarFiltros(
                                value => !value
                            )
                        }
                    >
                        <Text style={styles.filterButtonText}>
                            ⚙ Filtros
                        </Text>
                    </TouchableOpacity>
                </View>


                {
                    mostrarFiltros
                    &&
                    (
                        <View style={styles.filterCard}>

                            <FilterSection
                                title="Raza"
                                values={[
                                    {id:'TODAS', label:'Todas'},
                                    ...razas.map(item => ({
                                        id:item,
                                        label:item
                                    }))
                                ]}
                                selected={filtroRaza}
                                onSelect={setFiltroRaza}
                            />

                            <FilterSection
                                title="Sexo"
                                values={[
                                    {id:'TODOS', label:'Todos'},
                                    {id:'MACHO', label:'🐓 Macho'},
                                    {id:'HEMBRA', label:'🐔 Hembra'}
                                ]}
                                selected={filtroSexo}
                                onSelect={setFiltroSexo}
                            />

                            <FilterSection
                                title="Salud"
                                values={[
                                    {id:'TODAS', label:'Todas'},
                                    {id:'SANA', label:'🟢 Sana'},
                                    {id:'ENFERMA', label:'🔴 Enferma'},
                                    {id:'EN_TRATAMIENTO', label:'🟡 Tratamiento'}
                                ]}
                                selected={filtroSalud}
                                onSelect={setFiltroSalud}
                            />

                            <FilterSection
                                title="Jaula"
                                values={[
                                    {id:'TODAS', label:'Todas'},
                                    {id:'SIN_JAULA', label:'Sin jaula'},
                                    ...jaulas.map(item => ({
                                        id:item,
                                        label:item
                                    }))
                                ]}
                                selected={filtroJaula}
                                onSelect={setFiltroJaula}
                            />

                            <Text style={styles.filterLabel}>
                                Edad en meses
                            </Text>

                            <View style={styles.ageRow}>
                                <TextInput
                                    style={styles.ageInput}
                                    value={edadDesde}
                                    onChangeText={setEdadDesde}
                                    keyboardType="number-pad"
                                    placeholder="Desde"
                                />
                                <TextInput
                                    style={styles.ageInput}
                                    value={edadHasta}
                                    onChangeText={setEdadHasta}
                                    keyboardType="number-pad"
                                    placeholder="Hasta"
                                />
                            </View>

                            <TouchableOpacity
                                style={styles.clearButton}
                                onPress={limpiarFiltros}
                            >
                                <Text style={styles.clearButtonText}>
                                    Limpiar filtros
                                </Text>
                            </TouchableOpacity>

                        </View>
                    )
                }


                {
                    !loading && !error
                    &&
                    (
                        <Text style={styles.resultCount}>
                            {listaFiltrada.length} ave{listaFiltrada.length === 1 ? '' : 's'} encontrada{listaFiltrada.length === 1 ? '' : 's'}
                        </Text>
                    )
                }


                {
                    loading
                    ? (
                        <View style={styles.center}>
                            <ActivityIndicator
                                size="large"
                                color={COLORS.primary}
                            />
                            <Text style={styles.loadingText}>
                                Cargando aves...
                            </Text>
                        </View>
                    )
                    : null
                }


                {
                    !loading && error
                    ? (
                        <View style={styles.messageCard}>
                            <Text style={styles.errorText}>
                                {error}
                            </Text>
                            <TouchableOpacity
                                style={styles.retryButton}
                                onPress={cargarAves}
                            >
                                <Text style={styles.retryText}>
                                    Reintentar
                                </Text>
                            </TouchableOpacity>
                        </View>
                    )
                    : null
                }


                {
                    !loading &&
                    !error &&
                    listaFiltrada.length === 0
                    ? (
                        <View style={styles.emptyCard}>
                            <Text style={styles.emptyIcon}>
                                🐔
                            </Text>
                            <Text style={styles.emptyTitle}>
                                Sin resultados
                            </Text>
                            <Text style={styles.emptyText}>
                                No hay aves que coincidan con los filtros seleccionados.
                            </Text>
                        </View>
                    )
                    : null
                }


                {
                    !loading &&
                    !error &&
                    listaFiltrada.map(ave => (
                        <AveCard
                            key={ave.id}
                            ave={ave}
                            onPress={() =>
                                navigation.navigate(
                                    'DetalleAve',
                                    {
                                        aveId:ave.id
                                    }
                                )
                            }
                        />
                    ))
                }

            </ScrollView>

        </View>
    );

}


function FilterSection({
    title,
    values,
    selected,
    onSelect
}){
    return (
        <View style={styles.filterSection}>
            <Text style={styles.filterLabel}>
                {title}
            </Text>
            <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.chips}
            >
                {
                    values.map(item => (
                        <TouchableOpacity
                            key={String(item.id)}
                            style={[
                                styles.chip,
                                selected === item.id &&
                                styles.chipSelected
                            ]}
                            onPress={() =>
                                onSelect(item.id)
                            }
                        >
                            <Text
                                style={[
                                    styles.chipText,
                                    selected === item.id &&
                                    styles.chipTextSelected
                                ]}
                            >
                                {item.label}
                            </Text>
                        </TouchableOpacity>
                    ))
                }
            </ScrollView>
        </View>
    );
}


function parseEnteroOpcional(valor){
    const text = String(valor || '').trim();
    if(!text) return null;
    const number = Number(text);
    if(!Number.isFinite(number) || number < 0) return null;
    return Math.floor(number);
}


function obtenerEdadMeses(fechaNacimiento){
    if(!fechaNacimiento) return null;

    const fecha = new Date(fechaNacimiento);
    if(Number.isNaN(fecha.getTime())) return null;

    const hoy = new Date();

    let meses =
        (hoy.getFullYear() - fecha.getFullYear()) * 12
        +
        (hoy.getMonth() - fecha.getMonth());

    if(hoy.getDate() < fecha.getDate()){
        meses -= 1;
    }

    return Math.max(0, meses);
}


function normalizarSalud(estado){
    if(estado === 'EN_TRATAMIENTO') return 'EN_TRATAMIENTO';
    if(estado === 'ENFERMA') return 'ENFERMA';
    return 'SANA';
}


const styles = StyleSheet.create({
    container:{
        flex:1,
        backgroundColor:COLORS.background
    },
    content:{
        padding:16,
        paddingBottom:40
    },
    tabs:{
        flexDirection:'row',
        marginBottom:15,
        backgroundColor:COLORS.card,
        borderRadius:14,
        padding:4
    },
    tab:{
        flex:1,
        paddingVertical:10,
        alignItems:'center',
        borderRadius:12
    },
    tabActive:{
        backgroundColor:COLORS.primary
    },
    tabText:{
        fontSize:12,
        color:COLORS.textSecondary,
        fontWeight:'600'
    },
    tabTextActive:{
        color:COLORS.white
    },
    newButton:{
        backgroundColor:COLORS.primary,
        paddingVertical:14,
        borderRadius:14,
        alignItems:'center',
        marginBottom:14
    },
    newButtonText:{
        color:COLORS.white,
        fontSize:17,
        fontWeight:'bold'
    },
    searchRow:{
        flexDirection:'row',
        alignItems:'center',
        marginBottom:12
    },
    searchInput:{
        flex:1,
        backgroundColor:COLORS.card,
        borderWidth:1,
        borderColor:COLORS.border,
        borderRadius:12,
        paddingHorizontal:13,
        paddingVertical:11
    },
    filterButton:{
        marginLeft:8,
        backgroundColor:'#e8eeee',
        paddingHorizontal:12,
        paddingVertical:12,
        borderRadius:12
    },
    filterButtonActive:{
        backgroundColor:'#d7efea'
    },
    filterButtonText:{
        color:COLORS.text,
        fontWeight:'600'
    },
    filterCard:{
        backgroundColor:COLORS.card,
        borderRadius:16,
        padding:14,
        marginBottom:12,
        borderWidth:1,
        borderColor:COLORS.border
    },
    filterSection:{
        marginBottom:13
    },
    filterLabel:{
        color:COLORS.text,
        fontWeight:'600',
        marginBottom:7
    },
    chips:{
        paddingRight:8
    },
    chip:{
        backgroundColor:'#eef2f2',
        borderRadius:18,
        paddingHorizontal:12,
        paddingVertical:8,
        marginRight:7
    },
    chipSelected:{
        backgroundColor:COLORS.primary
    },
    chipText:{
        color:COLORS.text,
        fontSize:12
    },
    chipTextSelected:{
        color:'#fff',
        fontWeight:'bold'
    },
    ageRow:{
        flexDirection:'row',
        justifyContent:'space-between'
    },
    ageInput:{
        width:'48%',
        backgroundColor:'#f8fafa',
        borderWidth:1,
        borderColor:COLORS.border,
        borderRadius:10,
        paddingHorizontal:12,
        paddingVertical:10
    },
    clearButton:{
        alignSelf:'flex-end',
        marginTop:12,
        paddingHorizontal:12,
        paddingVertical:8
    },
    clearButtonText:{
        color:COLORS.primary,
        fontWeight:'bold'
    },
    resultCount:{
        color:COLORS.textSecondary,
        fontSize:12,
        marginBottom:10
    },
    center:{
        alignItems:'center',
        marginTop:40
    },
    loadingText:{
        marginTop:10,
        color:COLORS.textSecondary
    },
    emptyCard:{
        backgroundColor:COLORS.card,
        borderRadius:18,
        padding:25,
        alignItems:'center',
        elevation:2
    },
    emptyIcon:{
        fontSize:42
    },
    emptyTitle:{
        fontSize:19,
        fontWeight:'bold',
        color:COLORS.text,
        marginTop:10
    },
    emptyText:{
        textAlign:'center',
        color:COLORS.textSecondary,
        marginTop:8,
        lineHeight:20
    },
    messageCard:{
        backgroundColor:COLORS.card,
        padding:20,
        borderRadius:15
    },
    errorText:{
        color:COLORS.danger,
        textAlign:'center'
    },
    retryButton:{
        marginTop:15,
        alignSelf:'center',
        backgroundColor:COLORS.primary,
        paddingHorizontal:20,
        paddingVertical:10,
        borderRadius:10
    },
    retryText:{
        color:COLORS.white,
        fontWeight:'bold'
    }
});
