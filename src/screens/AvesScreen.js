import React, {
    useCallback,
    useMemo,
    useState
} from 'react';

import {
    View,
    Text,
    FlatList,
    ScrollView,
    StyleSheet
} from 'react-native';

import {
    useFocusEffect
} from '@react-navigation/native';

import {
    useSafeAreaInsets
} from 'react-native-safe-area-context';

import AveCard
    from '../components/AveCard';

import AveOpcion
    from '../components/AveOpcion';

import FondoPantalla
    from '../components/FondoPantalla';

import PantallaHeader
    from '../components/PantallaHeader';

import BarraEstado
    from '../components/BarraEstado';

import Tarjeta
    from '../components/Tarjeta';

import CampoTexto
    from '../components/CampoTexto';

import Boton
    from '../components/Boton';

import Fab
    from '../components/Fab';

import Icono
    from '../components/Icono';

import Pulsable
    from '../components/Pulsable';

import EstadoCarga
    from '../components/EstadoCarga';

import EstadoError
    from '../components/EstadoError';

import EstadoVacio
    from '../components/EstadoVacio';

import {
    obtenerAvesActivas,
    obtenerAvesVendidas,
    obtenerAvesFallecidas
} from '../repositories/AveRepository';

import {
    colors,
    radii,
    spacing,
    typography
} from '../theme';


const TABS = [
    {id:'ACTIVAS', label:'Activas', icono:'paw-outline'},
    {id:'VENDIDAS', label:'Vendidas', icono:'cash-outline'},
    {id:'FALLECIDAS', label:'Fallecidas', icono:'skull-outline'}
];


export default function AvesScreen({
    navigation
}) {

    const insets =
        useSafeAreaInsets();

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

    // Estables para que las tarjetas memoizadas no se redibujen al teclear en el buscador.
    const abrirAve =
        useCallback(
            ave =>
                navigation.navigate(
                    'DetalleAve',
                    {
                        aveId:ave.id
                    }
                ),
            [navigation]
        );

    const renderAve =
        useCallback(
            ({item}) => (
                <AveCard
                    ave={item}
                    onAbrir={abrirAve}
                />
            ),
            [abrirAve]
        );

    const keyAve =
        useCallback(
            ave =>
                String(ave.id),
            []
        );


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


    // Contenido bajo la lista cuando no hay filas que mostrar (carga, error o vacío)
    let estado = null;

    if (loading) {

        estado = (
            <EstadoCarga
                mensaje="Cargando aves..."
            />
        );

    }
    else if (error) {

        estado = (
            <EstadoError
                mensaje={error}
                onReintentar={cargarAves}
            />
        );

    }
    else if (aves.length === 0) {

        estado = (
            <EstadoVacio
                titulo={
                    tabActual === 'ACTIVAS'
                        ? 'Aún no hay aves registradas'
                        : tabActual === 'VENDIDAS'
                            ? 'Aún no hay ventas de aves'
                            : 'Aún no hay bajas por fallecimiento'
                }
                mensaje={
                    tabActual === 'ACTIVAS'
                        ? 'Toca el botón de abajo para registrar la primera.'
                        : 'Aparecerán aquí cuando se den de baja desde la ficha del ave.'
                }
            />
        );

    }
    else if (listaFiltrada.length === 0) {

        estado = (
            <EstadoVacio
                titulo="Sin resultados"
                mensaje="No hay aves que coincidan con los filtros seleccionados."
            />
        );

    }


    const encabezado = (

        <View>

            <View
                style={styles.tabs}
                accessibilityRole="tablist"
            >
                {
                    TABS.map(tab => {

                        const activa =
                            tabActual === tab.id;

                        return (
                            <Pulsable
                                key={tab.id}
                                testID={`tab-aves-${tab.id.toLowerCase()}`}
                                accessibilityRole="tab"
                                accessibilityLabel={tab.label}
                                accessibilityState={{
                                    selected: activa
                                }}
                                style={[
                                    styles.tab,
                                    activa &&
                                    styles.tabActive
                                ]}
                                onPress={() =>
                                    setTabActual(tab.id)
                                }
                            >
                                <Icono
                                    nombre={tab.icono}
                                    tamano={18}
                                    color={
                                        activa
                                            ? colors.white
                                            : colors.textSecondary
                                    }
                                    style={styles.tabIcono}
                                />
                                <Text
                                    style={[
                                        styles.tabText,
                                        activa &&
                                        styles.tabTextActive
                                    ]}
                                >
                                    {tab.label}
                                </Text>
                            </Pulsable>
                        );

                    })
                }
            </View>


            <View style={styles.searchRow}>

                <CampoTexto
                    style={styles.searchField}
                    icono="buscar"
                    value={busqueda}
                    onChangeText={setBusqueda}
                    placeholder="Buscar por código..."
                    accessibilityLabel="Buscar ave por código"
                    autoCapitalize="characters"
                    testID="buscar-ave"
                />

                <Pulsable
                    testID="filtros-aves"
                    accessibilityRole="button"
                    accessibilityLabel="Filtros"
                    accessibilityState={{
                        expanded: mostrarFiltros
                    }}
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
                    <Icono
                        nombre="filtros"
                        tamano={20}
                        color={
                            mostrarFiltros
                                ? colors.white
                                : colors.primaryDark
                        }
                        style={styles.filterIcono}
                    />
                    <Text
                        style={[
                            styles.filterButtonText,
                            mostrarFiltros &&
                            styles.filterButtonTextActive
                        ]}
                    >
                        Filtros
                    </Text>
                </Pulsable>

            </View>


            {
                mostrarFiltros
                &&
                (
                    <Tarjeta>

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
                                {id:'MACHO', label:'Macho', icono:'male-outline'},
                                {id:'HEMBRA', label:'Hembra', icono:'female-outline'}
                            ]}
                            selected={filtroSexo}
                            onSelect={setFiltroSexo}
                        />

                        <FilterSection
                            title="Salud"
                            values={[
                                {id:'TODAS', label:'Todas'},
                                {id:'SANA', label:'Sana', icono:'checkmark-circle'},
                                {id:'ENFERMA', label:'Enferma', icono:'alert-circle'},
                                {id:'EN_TRATAMIENTO', label:'Tratamiento', icono:'medkit'}
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
                            <CampoTexto
                                style={styles.ageInput}
                                value={edadDesde}
                                onChangeText={setEdadDesde}
                                keyboardType="number-pad"
                                placeholder="Desde"
                                accessibilityLabel="Edad desde, en meses"
                                testID="edad-desde"
                            />
                            <CampoTexto
                                style={styles.ageInput}
                                value={edadHasta}
                                onChangeText={setEdadHasta}
                                keyboardType="number-pad"
                                placeholder="Hasta"
                                accessibilityLabel="Edad hasta, en meses"
                                testID="edad-hasta"
                            />
                        </View>

                        <Boton
                            titulo="Limpiar filtros"
                            variante="terciario"
                            onPress={limpiarFiltros}
                            testID="limpiar-filtros"
                            style={styles.clearButton}
                        />

                    </Tarjeta>
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

        </View>

    );


    return (

        <FondoPantalla>

            <BarraEstado
                estilo="light"
                navigation={navigation}
            />

            <PantallaHeader
                titulo="Aves"
                insetSuperior={insets.top}
                testID="aves-cabecera"
            />

            <FlatList
                data={
                    !loading && !error
                        ? listaFiltrada
                        : []
                }
                keyExtractor={keyAve}
                renderItem={renderAve}
                ListHeaderComponent={encabezado}
                ListEmptyComponent={estado}
                contentContainerStyle={styles.content}
                keyboardShouldPersistTaps="handled"
                initialNumToRender={8}
                windowSize={7}
            />

            {
                tabActual === 'ACTIVAS'
                &&
                (
                    <Fab
                        titulo="Nueva ave"
                        icono="add"
                        testID="fab-agregar-ave"
                        onPress={() =>
                            navigation.navigate('NuevaAve')
                        }
                    />
                )
            }

        </FondoPantalla>

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
                keyboardShouldPersistTaps="handled"
                contentContainerStyle={styles.chips}
            >
                {
                    values.map(item => (
                        <AveOpcion
                            key={String(item.id)}
                            texto={item.label}
                            icono={item.icono}
                            seleccionado={selected === item.id}
                            onPress={() =>
                                onSelect(item.id)
                            }
                        />
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
    content:{
        paddingHorizontal:spacing.pantalla,
        paddingTop:spacing.lg,
        // espacio para que el botón flotante no tape la última tarjeta
        paddingBottom:104
    },
    tabs:{
        flexDirection:'row',
        marginBottom:spacing.md,
        backgroundColor:colors.surface,
        borderRadius:radii.pill,
        borderWidth:1,
        borderColor:colors.borderSoft,
        padding:4
    },
    tab:{
        flex:1,
        flexDirection:'row',
        alignItems:'center',
        justifyContent:'center',
        minHeight:spacing.touchMin,
        borderRadius:radii.pill
    },
    tabActive:{
        backgroundColor:colors.primary
    },
    tabIcono:{
        marginRight:spacing.xs
    },
    tabText:{
        ...typography.etiqueta,
        color:colors.textSecondary
    },
    tabTextActive:{
        color:colors.white
    },
    searchRow:{
        flexDirection:'row',
        alignItems:'flex-start',
        marginBottom:spacing.sm
    },
    searchField:{
        flex:1,
        marginBottom:0
    },
    filterButton:{
        marginLeft:spacing.sm,
        minHeight:54,
        flexDirection:'row',
        alignItems:'center',
        paddingHorizontal:spacing.md,
        borderRadius:radii.md,
        borderWidth:2,
        borderColor:colors.primary,
        backgroundColor:colors.surface
    },
    filterButtonActive:{
        backgroundColor:colors.primary
    },
    filterIcono:{
        marginRight:spacing.xs
    },
    filterButtonText:{
        ...typography.etiqueta,
        color:colors.primaryDark
    },
    filterButtonTextActive:{
        color:colors.white
    },
    filterSection:{
        marginBottom:spacing.sm
    },
    filterLabel:{
        ...typography.etiqueta,
        color:colors.text,
        marginBottom:spacing.sm
    },
    chips:{
        paddingRight:spacing.sm
    },
    ageRow:{
        flexDirection:'row',
        justifyContent:'space-between'
    },
    ageInput:{
        width:'48%',
        marginBottom:0
    },
    clearButton:{
        alignSelf:'flex-end',
        marginTop:spacing.sm
    },
    resultCount:{
        ...typography.secundario,
        color:colors.textSecondary,
        marginTop:spacing.xs,
        marginBottom:spacing.md
    }
});
