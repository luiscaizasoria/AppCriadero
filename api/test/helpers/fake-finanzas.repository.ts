import type { FinanzasRepository } from "../../src/finanzas/finanzas.repository";
import type {
  BajaVentaBasica,
  CategoriaConsolidada,
  CorreccionVentaPlan,
  HistorialFila,
  HistorialInsert,
  MesConsolidado,
  MovimientoDetalle,
  MovimientoListado,
  MovimientoManualInput,
  MovimientoManualUpdate,
  ResumenSumas,
  VentaBaja,
} from "../../src/finanzas/finanzas.types";

/**
 * Fake en memoria: guarda movimientos, bajas e historial de verdad (las escrituras de batch se
 * aplican en el orden recibido y se anotan en `operaciones`); los agregados devuelven valores
 * sembrados y anotan los argumentos (`periodo`, `ahora`, `limite`).
 */
export class FakeFinanzasRepository implements FinanzasRepository {
  movimientos: MovimientoDetalle[] = [];
  bajas: Array<VentaBaja & { criaderoId: string; tipo: string }> = [];
  historiales: Array<HistorialInsert & { criaderoId: string }> = [];
  operaciones: string[] = [];

  resumenSembrado: ResumenSumas = { ingresos: 0, egresos: 0 };
  categoriasSembradas: CategoriaConsolidada[] = [];
  mesesSembrados: MesConsolidado[] = [];
  llamadas: Array<{ metodo: string; periodo?: string; ahora?: string; limite?: number }> = [];

  /** Hace fallar el batch indicado (para comprobar que el servicio no hace escrituras previas). */
  fallarEn: "actualizarManual" | "corregirVenta" | null = null;

  async resumen(_c: string, periodo: string, ahora: string): Promise<ResumenSumas> {
    this.llamadas.push({ metodo: "resumen", periodo, ahora });
    return this.resumenSembrado;
  }

  async listarMovimientos(criaderoId: string): Promise<MovimientoListado[]> {
    return this.movimientos.filter((m) => (m as any).criaderoId === criaderoId);
  }

  async insertarManual(criaderoId: string, input: MovimientoManualInput): Promise<void> {
    this.operaciones.push(`INSERT ${input.id}`);
    this.movimientos.push({
      ...(input as any),
      criaderoId,
      aveId: null,
      origenTipo: "MANUAL",
      origenId: null,
      aveCodigo: null,
      fechaCreacion: "2026-01-01 00:00:00",
    });
  }

  async obtenerMovimiento(criaderoId: string, id: string): Promise<MovimientoDetalle | null> {
    return (
      (this.movimientos.find((m) => m.id === id && (m as any).criaderoId === criaderoId) as any) ??
      null
    );
  }

  async obtenerVenta(criaderoId: string, bajaId: string): Promise<VentaBaja | null> {
    return (
      this.bajas.find((b) => b.id === bajaId && b.criaderoId === criaderoId && b.tipo === "VENTA") ??
      null
    );
  }

  async obtenerBajaVenta(criaderoId: string, bajaId: string): Promise<BajaVentaBasica | null> {
    const b = await this.obtenerVenta(criaderoId, bajaId);
    return b ? { id: b.id, aveId: b.aveId, fecha: b.fecha } : null;
  }

  async buscarMovimientoVenta(
    criaderoId: string,
    bajaId: string,
    categoria: string
  ): Promise<MovimientoDetalle | null> {
    return (
      this.movimientos.find(
        (m) =>
          (m as any).criaderoId === criaderoId &&
          m.origenTipo === "VENTA_AVE" &&
          m.origenId === bajaId &&
          m.categoria === categoria
      ) ?? null
    );
  }

  async actualizarManual(
    criaderoId: string,
    historial: HistorialInsert,
    update: MovimientoManualUpdate
  ): Promise<void> {
    if (this.fallarEn === "actualizarManual") throw new Error("fallo simulado");

    this.operaciones.push(`HISTORIAL ${historial.accion}`);
    this.historiales.push({ ...historial, criaderoId });
    this.operaciones.push(`UPDATE ${update.id}`);
    Object.assign(this.movimientos.find((m) => m.id === update.id)!, update);
  }

  async corregirVenta(criaderoId: string, plan: CorreccionVentaPlan): Promise<void> {
    if (this.fallarEn === "corregirVenta") throw new Error("fallo simulado");

    this.operaciones.push("UPDATE bajas_ave");
    const baja = this.bajas.find((b) => b.id === plan.bajaId)!;
    baja.valorVenta = plan.valorVenta;
    baja.valorEnvio = plan.valorEnvio;

    for (const s of plan.sincronizaciones) {
      if (s.existenteId !== null) {
        this.operaciones.push(`HISTORIAL ${s.historial.accion}`);
        this.historiales.push({ ...s.historial, criaderoId });
        this.operaciones.push(`UPDATE ${s.categoria}`);
        Object.assign(this.movimientos.find((m) => m.id === s.existenteId)!, {
          tipo: "INGRESO",
          categoria: s.categoria,
          fecha: plan.fechaVenta,
          valor: s.valor,
          detalle: s.detalle,
          aveId: plan.aveId,
          origenTipo: "VENTA_AVE",
          origenId: plan.bajaId,
        });
      } else {
        this.operaciones.push(`INSERT ${s.categoria}`);
        this.movimientos.push({
          id: s.nuevoId,
          criaderoId,
          tipo: "INGRESO",
          categoria: s.categoria,
          fecha: plan.fechaVenta,
          valor: s.valor,
          detalle: s.detalle,
          aveId: plan.aveId,
          origenTipo: "VENTA_AVE",
          origenId: plan.bajaId,
          aveCodigo: null,
          fechaCreacion: "2026-01-01 00:00:00",
        } as any);
        this.operaciones.push(`HISTORIAL ${s.historial.accion}`);
        this.historiales.push({ ...s.historial, criaderoId });
      }
    }
  }

  async historial(criaderoId: string, movimientoId: string): Promise<HistorialFila[]> {
    return this.historiales
      .filter((h) => h.criaderoId === criaderoId && h.movimientoId === movimientoId)
      .map(({ criaderoId: _c, ...h }) => h);
  }

  async consolidadoCategorias(
    _c: string,
    periodo: string,
    ahora: string
  ): Promise<CategoriaConsolidada[]> {
    this.llamadas.push({ metodo: "consolidadoCategorias", periodo, ahora });
    return this.categoriasSembradas;
  }

  async consolidadoMensual(_c: string, limite: number): Promise<MesConsolidado[]> {
    this.llamadas.push({ metodo: "consolidadoMensual", limite });
    return this.mesesSembrados;
  }

  sembrarMovimiento(criaderoId: string, m: Partial<MovimientoDetalle> & { id: string }) {
    this.movimientos.push({
      tipo: "INGRESO",
      categoria: "OTRO",
      fecha: "2026-01-01T00:00:00.000Z",
      valor: 10,
      detalle: null,
      aveId: null,
      origenTipo: "MANUAL",
      origenId: null,
      aveCodigo: null,
      fechaCreacion: "2026-01-01 00:00:00",
      criaderoId,
      ...m,
    } as any);
  }

  sembrarVenta(criaderoId: string, v: Partial<VentaBaja> & { id: string }, tipo = "VENTA") {
    this.bajas.push({
      aveId: "ave-1",
      fecha: "2026-10-31T12:00:00.000Z",
      celular: null,
      comprador: null,
      ciudadDestino: null,
      cooperativaEnvio: null,
      valorVenta: 100,
      valorEnvio: 5,
      detalle: null,
      aveCodigo: "A-1",
      criaderoId,
      tipo,
      ...v,
    });
  }
}
