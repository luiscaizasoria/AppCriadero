import type { AveRepository, JaulaBasica } from "../../src/aves/aves.repository";
import type {
  ActualizarAveInput,
  AveBajaListado,
  BajaAve,
  BajaMuerteInput,
  BajaVentaInput,
  AveCandidataPadre,
  AveDetalle,
  AveFila,
  AveListado,
  AveParaAsignar,
  AveParentesco,
  AvePorJaula,
  CambiarJaulaInput,
  ContextoEvolucion,
  CrearAveInput,
  EstadoBajaAve,
  EventoAveInput,
  EvolucionAve,
  EvolucionInput,
  FinalizarTratamientoInput,
  HistorialAve
} from "../../src/aves/aves.types";


export type FilaAve = AveFila & {
  criaderoId: string;
  estadoSalud: string | null;
  fechaActualizacion: string | null;
  fechaUltimoControlSalud: string | null;
};


export interface FilaHistorialAve {
  id: string;
  criaderoId: string;
  aveId: string;
  jaulaId: string | null;
  tipoEvento: string;
  fecha: string;
  detalle: string | null;
}


export interface FilaBaja extends BajaAve {
  criaderoId: string;
  aveId: string;
}


export interface FilaMovimiento {
  id: string;
  criaderoId: string;
  tipo: string;
  categoria: string;
  fecha: string;
  valor: number;
  detalle: string;
  aveId: string;
  origenTipo: string;
  origenId: string;
}


export interface FilaJaulaHistorial {
  id: string;
  criaderoId: string;
  jaulaId: string;
  aveId: string;
  tipoEvento: string;
  fecha: string;
  detalle: string;
}


export interface FilaEvolucion {
  id: string;
  aveId: string;
  fecha: string;
  fotoUri: string | null;
  pesoGramos: number | null;
  alturaCm: number | null;
  largoCm: number | null;
  caracteristicas: string | null;
  observacion: string | null;
}


/**
 * Repositorio en memoria con el mismo contrato que D1AveRepository.
 * El codigo es unico por criadero y distingue mayusculas (UNIQUE de V1).
 */
export class FakeAveRepository implements AveRepository {


  aves: FilaAve[] = [];

  jaulas: Array<JaulaBasica & { criaderoId: string }> = [];

  historial: FilaHistorialAve[] = [];

  jaulaHistorial: FilaJaulaHistorial[] = [];

  evoluciones: FilaEvolucion[] = [];

  bajas: FilaBaja[] = [];

  movimientos: FilaMovimiento[] = [];

  /** Diagnosticos sembrados por las pruebas (estado ACTIVO / CERRADO). */
  diagnosticos: Array<{ id: string; aveId: string; estado: string }> = [];

  /** Veces que se pidio el recorrido de descendientes. */
  consultasDescendientes = 0;


  sembrarJaula(criaderoId: string, id: string, codigo: string, activa = 1) {
    this.jaulas.push({ criaderoId, id, codigo, activa });
  }


  sembrarAve(criaderoId: string, datos: Partial<FilaAve> & { id: string; codigo: string }) {

    this.aves.push({
      criaderoId,
      origen: "NACIDA_CRIADERO",
      fechaNacimiento: null,
      edadMesesCompra: null,
      fechaIngreso: null,
      criaderoOrigen: null,
      metodoEnvio: null,
      raza: null,
      sexo: null,
      pesoGramos: null,
      alturaCm: null,
      largoCm: null,
      caracteristicas: null,
      fotoUri: null,
      padreId: null,
      madreId: null,
      jaulaActualId: null,
      estado: "ACTIVA",
      estadoSalud: "SANA",
      fechaCreacion: "2026-10-30 12:00:00",
      fechaActualizacion: null,
      fechaUltimoControlSalud: null,
      ...datos
    });

  }


  private comparar(a: string, b: string) {
    return a < b ? -1 : a > b ? 1 : 0;
  }


  private codigoJaula(jaulaId: string | null) {
    return this.jaulas.find(j => j.id === jaulaId)?.codigo ?? null;
  }


  private codigoAve(aveId: string | null) {
    return this.aves.find(a => a.id === aveId)?.codigo ?? null;
  }


  private aListado(fila: FilaAve): AveListado {

    return {
      id: fila.id,
      codigo: fila.codigo,
      origen: fila.origen,
      fechaNacimiento: fila.fechaNacimiento,
      edadMesesCompra: fila.edadMesesCompra,
      fechaIngreso: fila.fechaIngreso,
      criaderoOrigen: fila.criaderoOrigen,
      metodoEnvio: fila.metodoEnvio,
      raza: fila.raza,
      sexo: fila.sexo,
      pesoGramos: fila.pesoGramos,
      alturaCm: fila.alturaCm,
      largoCm: fila.largoCm,
      caracteristicas: fila.caracteristicas,
      fotoUri: fila.fotoUri,
      padreId: fila.padreId,
      madreId: fila.madreId,
      jaulaActualId: fila.jaulaActualId,
      estado: fila.estado,
      estadoSalud: fila.estadoSalud,
      fechaCreacion: fila.fechaCreacion,
      jaulaCodigo: this.codigoJaula(fila.jaulaActualId),
      jaulaNombre: null,
      padreCodigo: this.codigoAve(fila.padreId),
      madreCodigo: this.codigoAve(fila.madreId)
    };

  }


  private deCriadero(criaderoId: string) {
    return this.aves.filter(a => a.criaderoId === criaderoId);
  }


  async listarActivas(criaderoId: string) {

    return this.deCriadero(criaderoId)
      .filter(a => a.estado === "ACTIVA")
      .sort((a, b) => this.comparar(a.codigo, b.codigo))
      .map(a => this.aListado(a));

  }


  /** Siembra una baja sin pasar por el servicio (para listados). */
  sembrarBaja(criaderoId: string, datos: Partial<FilaBaja> & { id: string; aveId: string; tipo: string }) {

    this.bajas.push({
      criaderoId,
      fecha: "2026-10-30T12:00:00.000Z",
      causa: null,
      celular: null,
      ciudadDestino: null,
      cooperativaEnvio: null,
      comprador: null,
      valorVenta: null,
      valorEnvio: null,
      detalle: null,
      ...datos
    });

  }


  /** INNER JOIN con bajas_ave del tipo que corresponde, fecha DESC (como D1AveRepository). */
  async listarBajas(criaderoId: string, estado: EstadoBajaAve): Promise<AveBajaListado[]> {

    const tipo = estado === "VENDIDA" ? "VENTA" : "MUERTE";
    const resultado: Array<{ fecha: string; ave: AveBajaListado }> = [];

    for (const baja of this.bajas.filter(b => b.criaderoId === criaderoId && b.tipo === tipo)) {

      const ave = this.deCriadero(criaderoId).find(a => a.id === baja.aveId && a.estado === estado);

      if (!ave) {
        continue;
      }

      const { criaderoOrigen, metodoEnvio, fechaCreacion, ...resto } = this.aListado(ave);
      void criaderoOrigen; void metodoEnvio; void fechaCreacion;

      const extra = tipo === "VENTA"
        ? {
            fechaVenta: baja.fecha,
            celular: baja.celular,
            ciudadDestino: baja.ciudadDestino,
            cooperativaEnvio: baja.cooperativaEnvio,
            comprador: baja.comprador,
            valorVenta: baja.valorVenta,
            valorEnvio: baja.valorEnvio,
            detalle: baja.detalle
          }
        : { fechaFallecimiento: baja.fecha, causa: baja.causa, detalle: baja.detalle };

      resultado.push({ fecha: baja.fecha, ave: { ...resto, ...extra } });

    }

    return resultado.sort((a, b) => this.comparar(b.fecha, a.fecha)).map(r => r.ave);

  }


  async listarBajasAve(criaderoId: string, aveId: string): Promise<BajaAve[]> {

    return this.bajas
      .filter(b => b.criaderoId === criaderoId && b.aveId === aveId)
      .sort((a, b) => this.comparar(b.fecha, a.fecha) || this.comparar(b.id, a.id))
      .map(b => ({
        id: b.id,
        tipo: b.tipo,
        fecha: b.fecha,
        causa: b.causa,
        celular: b.celular,
        ciudadDestino: b.ciudadDestino,
        cooperativaEnvio: b.cooperativaEnvio,
        comprador: b.comprador,
        valorVenta: b.valorVenta,
        valorEnvio: b.valorEnvio,
        detalle: b.detalle
      }));

  }


  async registrarMuerte(criaderoId: string, input: BajaMuerteInput) {

    const fila = this.deCriadero(criaderoId).find(a => a.id === input.aveId);

    if (fila) {
      fila.estado = "FALLECIDA";
      fila.fechaActualizacion = input.fecha;
    }

    this.sembrarBaja(criaderoId, {
      id: input.bajaId,
      aveId: input.aveId,
      tipo: "MUERTE",
      fecha: input.fecha,
      causa: input.causa,
      detalle: input.detalle
    });

    this.historial.push({
      id: input.historialId,
      criaderoId,
      aveId: input.aveId,
      jaulaId: null,
      tipoEvento: "MUERTE",
      fecha: input.fecha,
      detalle: input.detalleHistorial
    });

  }


  async registrarVenta(criaderoId: string, input: BajaVentaInput) {

    const fila = this.deCriadero(criaderoId).find(a => a.id === input.aveId);

    if (fila) {
      fila.estado = "VENDIDA";
      fila.fechaActualizacion = input.fecha;
    }

    this.sembrarBaja(criaderoId, {
      id: input.bajaId,
      aveId: input.aveId,
      tipo: "VENTA",
      fecha: input.fecha,
      celular: input.celular,
      ciudadDestino: input.ciudadDestino,
      cooperativaEnvio: input.cooperativaEnvio,
      comprador: input.comprador,
      valorVenta: input.valorVenta,
      valorEnvio: input.valorEnvio,
      detalle: input.detalle
    });

    this.movimientos.push(
      {
        id: input.ingresoVentaId,
        criaderoId,
        tipo: "INGRESO",
        categoria: "VENTA_AVE",
        fecha: input.fecha,
        valor: input.valorVenta ?? 0,
        detalle: input.detalleVenta,
        aveId: input.aveId,
        origenTipo: "VENTA_AVE",
        origenId: input.bajaId
      },
      {
        id: input.ingresoEnvioId,
        criaderoId,
        tipo: "INGRESO",
        categoria: "ENVIO_AVE",
        fecha: input.fecha,
        valor: input.valorEnvio ?? 0,
        detalle: input.detalleEnvio,
        aveId: input.aveId,
        origenTipo: "VENTA_AVE",
        origenId: input.bajaId
      }
    );

    this.historial.push({
      id: input.historialId,
      criaderoId,
      aveId: input.aveId,
      jaulaId: null,
      tipoEvento: "VENTA",
      fecha: input.fecha,
      detalle: input.detalleHistorial
    });

  }


  async listarPorJaula(criaderoId: string, jaulaId: string): Promise<AvePorJaula[]> {

    return this.deCriadero(criaderoId)
      .filter(a => a.estado === "ACTIVA" && a.jaulaActualId === jaulaId)
      .sort((a, b) => this.comparar(a.codigo, b.codigo))
      .map(a => ({
        id: a.id,
        codigo: a.codigo,
        origen: a.origen,
        fechaNacimiento: a.fechaNacimiento,
        raza: a.raza,
        caracteristicas: a.caracteristicas,
        fotoUri: a.fotoUri,
        jaulaActualId: a.jaulaActualId,
        estado: a.estado
      }));

  }


  async listarParaAsignarJaula(criaderoId: string, jaulaId: string): Promise<AveParaAsignar[]> {

    return this.deCriadero(criaderoId)
      .filter(a =>
        a.estado === "ACTIVA" &&
        (a.jaulaActualId === null || a.jaulaActualId !== jaulaId)
      )
      .sort((a, b) => this.comparar(a.codigo, b.codigo))
      .map(a => ({
        id: a.id,
        codigo: a.codigo,
        raza: a.raza,
        fotoUri: a.fotoUri,
        jaulaActualId: a.jaulaActualId,
        jaulaCodigo: this.codigoJaula(a.jaulaActualId)
      }));

  }


  private descendientes(criaderoId: string, aveId: string) {

    const resultado = new Set<string>();
    const pendientes = [aveId];

    while (pendientes.length > 0) {

      const actual = pendientes.pop()!;

      for (const ave of this.deCriadero(criaderoId)) {

        if (
          (ave.padreId === actual || ave.madreId === actual) &&
          ave.id !== aveId &&
          !resultado.has(ave.id)
        ) {
          resultado.add(ave.id);
          pendientes.push(ave.id);
        }

      }

    }

    return resultado;

  }


  async listarCandidatasPadres(criaderoId: string, excluirAveId: string | null): Promise<AveCandidataPadre[]> {

    const excluidos = excluirAveId
      ? new Set([excluirAveId, ...this.descendientes(criaderoId, excluirAveId)])
      : new Set<string>();

    return this.deCriadero(criaderoId)
      .filter(a => a.estado === "ACTIVA" && !excluidos.has(a.id))
      .sort((a, b) => this.comparar(a.codigo, b.codigo))
      .map(a => ({ id: a.id, codigo: a.codigo, raza: a.raza, sexo: a.sexo }));

  }


  async existeCodigo(criaderoId: string, codigoLimpio: string, excluirAveId: string | null) {

    return this.deCriadero(criaderoId).some(
      a => a.codigo.trim().toUpperCase() === codigoLimpio && a.id !== excluirAveId
    );

  }


  async obtenerPorId(criaderoId: string, aveId: string): Promise<AveDetalle | null> {

    const fila = this.deCriadero(criaderoId).find(a => a.id === aveId);

    if (!fila) {
      return null;
    }

    return {
      ...this.aListado(fila),
      fechaActualizacion: fila.fechaActualizacion,
      fechaUltimoControlSalud: fila.fechaUltimoControlSalud
    };

  }


  async obtenerFila(criaderoId: string, aveId: string): Promise<AveFila | null> {

    const fila = this.deCriadero(criaderoId).find(a => a.id === aveId);

    if (!fila) {
      return null;
    }

    const { criaderoId: _c, estadoSalud: _e, fechaActualizacion: _f, fechaUltimoControlSalud: _u, ...resto } = fila;
    void _c; void _e; void _f; void _u;

    return { ...resto };

  }


  async obtenerParentesco(criaderoId: string, aveId: string): Promise<AveParentesco | null> {

    const fila = this.deCriadero(criaderoId).find(a => a.id === aveId);

    return fila ? { id: fila.id, codigo: fila.codigo, sexo: fila.sexo } : null;

  }


  async obtenerIdsDescendientes(criaderoId: string, aveId: string) {

    this.consultasDescendientes += 1;

    return [...this.descendientes(criaderoId, aveId)];

  }


  async obtenerJaula(criaderoId: string, jaulaId: string) {

    const jaula = this.jaulas.find(j => j.id === jaulaId && j.criaderoId === criaderoId);

    return jaula ? { id: jaula.id, codigo: jaula.codigo, activa: jaula.activa } : null;

  }


  private errorUnique() {
    return new Error("D1_ERROR: UNIQUE constraint failed: aves.criadero_id, aves.codigo: SQLITE_CONSTRAINT");
  }


  async crear(criaderoId: string, input: CrearAveInput) {

    const d = input.datos;

    if (this.deCriadero(criaderoId).some(a => a.codigo === d.codigo)) {
      throw this.errorUnique();
    }

    this.sembrarAve(criaderoId, {
      id: input.id,
      codigo: d.codigo,
      origen: d.origen,
      fechaNacimiento: d.fechaNacimiento,
      edadMesesCompra: d.edadMesesCompra,
      fechaIngreso: d.fechaIngreso,
      criaderoOrigen: d.criaderoOrigen,
      metodoEnvio: d.metodoEnvio,
      raza: d.raza,
      sexo: d.sexo,
      pesoGramos: d.pesoGramos,
      alturaCm: d.alturaCm,
      largoCm: d.largoCm,
      caracteristicas: d.caracteristicas,
      fotoUri: d.fotoUri,
      padreId: d.padreId,
      madreId: d.madreId,
      jaulaActualId: input.jaulaId
    });

    this.evoluciones.push({
      id: input.evolucionId,
      aveId: input.id,
      fecha: input.fecha,
      fotoUri: d.fotoUri,
      pesoGramos: d.pesoGramos,
      alturaCm: d.alturaCm,
      largoCm: d.largoCm,
      caracteristicas: d.caracteristicas,
      observacion: "Registro inicial"
    });

    this.historial.push({
      id: input.historialId,
      criaderoId,
      aveId: input.id,
      jaulaId: input.jaulaId,
      tipoEvento: "ALTA",
      fecha: input.fecha,
      detalle: input.detalleAlta
    });

    if (input.jaulaId && input.jaulaHistorialId && input.detalleJaula) {
      this.jaulaHistorial.push({
        id: input.jaulaHistorialId,
        criaderoId,
        jaulaId: input.jaulaId,
        aveId: input.id,
        tipoEvento: "INGRESO_AVE",
        fecha: input.fecha,
        detalle: input.detalleJaula
      });
    }

  }


  async actualizar(criaderoId: string, input: ActualizarAveInput) {

    const fila = this.deCriadero(criaderoId).find(a => a.id === input.aveId && a.estado === "ACTIVA");

    if (!fila) {
      return;
    }

    if (this.deCriadero(criaderoId).some(a => a.codigo === input.datos.codigo && a.id !== input.aveId)) {
      throw this.errorUnique();
    }

    Object.assign(fila, input.datos, { fechaActualizacion: "2026-10-30 12:00:01" });

    this.historial.push({
      id: input.historialId,
      criaderoId,
      aveId: input.aveId,
      jaulaId: input.jaulaActualId,
      tipoEvento: "DATOS_ACTUALIZADOS",
      fecha: input.fecha,
      detalle: input.detalle
    });

  }


  async cambiarJaula(criaderoId: string, input: CambiarJaulaInput) {

    const fila = this.deCriadero(criaderoId).find(a => a.id === input.aveId);

    if (fila) {
      fila.jaulaActualId = input.nuevaJaulaId;
      fila.fechaActualizacion = "2026-10-30 12:00:01";
    }

    this.historial.push({
      id: input.historialId,
      criaderoId,
      aveId: input.aveId,
      jaulaId: input.nuevaJaulaId,
      tipoEvento: "CAMBIO_JAULA",
      fecha: input.fecha,
      detalle: input.detalleCambio
    });

    if (input.jaulaAnteriorId && input.salida) {
      this.jaulaHistorial.push({
        id: input.salida.id,
        criaderoId,
        jaulaId: input.jaulaAnteriorId,
        aveId: input.aveId,
        tipoEvento: "SALIDA_AVE",
        fecha: input.fecha,
        detalle: input.salida.detalle
      });
    }

    if (input.nuevaJaulaId && input.ingreso) {
      this.jaulaHistorial.push({
        id: input.ingreso.id,
        criaderoId,
        jaulaId: input.nuevaJaulaId,
        aveId: input.aveId,
        tipoEvento: "INGRESO_AVE",
        fecha: input.fecha,
        detalle: input.ingreso.detalle
      });
    }

  }


  async listarHistorial(criaderoId: string, aveId: string): Promise<HistorialAve[]> {

    return this.historial
      .filter(h => h.criaderoId === criaderoId && h.aveId === aveId)
      .sort((a, b) => this.comparar(b.fecha, a.fecha) || this.comparar(b.id, a.id))
      .map(h => ({
        id: h.id,
        aveId: h.aveId,
        jaulaId: h.jaulaId,
        tipoEvento: h.tipoEvento,
        fecha: h.fecha,
        detalle: h.detalle,
        fechaCreacion: "2026-10-30 12:00:00",
        jaulaCodigo: this.codigoJaula(h.jaulaId)
      }));

  }


  async listarEvolucion(criaderoId: string, aveId: string): Promise<EvolucionAve[]> {

    const ave = this.aves.find(a => a.id === aveId && a.criaderoId === criaderoId);

    if (!ave) {
      return [];
    }

    return this.evoluciones
      .filter(e => e.aveId === aveId)
      .sort((a, b) => this.comparar(b.fecha, a.fecha) || this.comparar(b.id, a.id))
      .map(e => ({ ...e, fechaCreacion: "2026-10-30 12:00:00" }));

  }


  async insertarEvento(criaderoId: string, input: EventoAveInput) {

    this.historial.push({
      id: input.id,
      criaderoId,
      aveId: input.aveId,
      jaulaId: null,
      tipoEvento: input.tipoEvento,
      fecha: input.fecha,
      detalle: input.detalle
    });

  }


  async obtenerContextoEvolucion(criaderoId: string, aveId: string): Promise<ContextoEvolucion | null> {

    const ave = await this.obtenerFila(criaderoId, aveId);

    if (!ave) {
      return null;
    }

    return {
      ave,
      totalEvoluciones: this.evoluciones.filter(e => e.aveId === aveId).length
    };

  }


  async registrarEvolucion(criaderoId: string, input: EvolucionInput) {

    if (input.inicial) {
      this.evoluciones.push({
        id: input.inicial.id,
        aveId: input.aveId,
        fecha: input.inicial.fecha,
        fotoUri: input.inicial.fotoUri,
        pesoGramos: input.inicial.pesoGramos,
        alturaCm: input.inicial.alturaCm,
        largoCm: input.inicial.largoCm,
        caracteristicas: input.inicial.caracteristicas,
        observacion: "Registro inicial"
      });
    }

    const fila = this.deCriadero(criaderoId).find(a => a.id === input.aveId);

    if (fila) {
      fila.fotoUri = input.fotoUri;
      fila.pesoGramos = input.pesoGramos;
      fila.alturaCm = input.alturaCm;
      fila.largoCm = input.largoCm;
      fila.caracteristicas = input.caracteristicas;
      fila.fechaActualizacion = "2026-10-30 12:00:01";
    }

    this.evoluciones.push({
      id: input.evolucionId,
      aveId: input.aveId,
      fecha: input.fecha,
      fotoUri: input.fotoUri,
      pesoGramos: input.pesoGramos,
      alturaCm: input.alturaCm,
      largoCm: input.largoCm,
      caracteristicas: input.caracteristicas,
      observacion: input.observacion
    });

    this.historial.push({
      id: input.historialId,
      criaderoId,
      aveId: input.aveId,
      jaulaId: input.jaulaActualId,
      tipoEvento: "EVOLUCION",
      fecha: input.fecha,
      detalle: input.detalle
    });

  }


  async finalizarTratamiento(criaderoId: string, input: FinalizarTratamientoInput) {

    const fila = this.deCriadero(criaderoId).find(a => a.id === input.aveId);

    if (fila) {
      fila.estadoSalud = "SANA";
      fila.fechaUltimoControlSalud = input.fecha;
    }

    for (const diagnostico of this.diagnosticos) {
      if (diagnostico.aveId === input.aveId && diagnostico.estado === "ACTIVO") {
        diagnostico.estado = "CERRADO";
      }
    }

    this.historial.push(
      {
        id: input.saludId,
        criaderoId,
        aveId: input.aveId,
        jaulaId: null,
        tipoEvento: "SALUD",
        fecha: input.fecha,
        detalle: input.detalleSalud
      }
    );

  }

}
