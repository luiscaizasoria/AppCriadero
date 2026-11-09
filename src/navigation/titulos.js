// Títulos en español de cada pantalla, coherentes con el botón o la tarjeta que la abre.
// Una sola fuente para la cabecera y para las migas.
const TITULOS = {
    // Jaulas
    ListaJaulas: 'Jaulas',
    NuevaJaula: 'Nueva jaula',
    DetalleJaula: 'Detalle de jaula',
    DetalleJaulaInactiva: 'Historial de jaula',
    SeleccionarAveJaula: 'Agregar ave',
    AlimentacionJaula: 'Alimentación',
    BebidaJaula: 'Bebida',
    SanidadJaula: 'Sanidad',
    HistorialJaula: 'Historial',
    // Aves
    ListaAves: 'Aves',
    DetalleAve: 'Ficha del ave',
    EvolucionAve: 'Evolución',
    SaludAve: 'Salud',
    FinalizarTratamiento: 'Finalizar tratamiento',
    BajaAve: 'Dar de baja',
    RegistrarHuevo: 'Registro de huevo',
    CicloVidaAve: 'Ciclo de vida',
    GenealogiaAve: 'Genealogía',
    // Finanzas
    FinanzasInicio: 'Finanzas',
    NuevoMovimientoFinanciero: 'Nuevo movimiento',
    EditarMovimientoFinanciero: 'Movimiento financiero',
    // Más
    MasMenu: 'Más',
    Configuracion: 'Configuración',
    EditarCatalogoItem: 'Elemento',
    ProduccionHuevos: 'Producción de huevos',
    Clientes: 'Clientes',
    DetalleCliente: 'Detalle del cliente',
    Reportes: 'Reportes',
    Backup: 'Respaldo',
    Alertas: 'Alertas',
    // Inicio
    InicioPrincipal: 'Inicio'
};

export function tituloRuta(nombre, params) {
    if (nombre === 'NuevaAve') {
        return params && params.modoEdicion ? 'Editar ave' : 'Nueva ave';
    }
    if (nombre === 'Catalogo') {
        return (params && params.titulo) || 'Catálogo';
    }
    return TITULOS[nombre] || nombre;
}
