import type { ReportesRepository } from "../../src/reportes/reportes.repository";
import type {
  EnfermedadCantidad,
  EstadoSaludResumen,
  FilaExportacionAves,
  FilaExportacionClientes,
  FilaExportacionFinanzas,
  FilaExportacionHuevos,
  FilaExportacionJaulas,
  FilaExportacionVentas,
  HuevosHoyMes,
  MejorPonedora,
  ReporteAves,
  TotalesFinanzas,
} from "../../src/reportes/reportes.types";

/** Datos que el fake devuelve para un criadero (todo opcional: sin sembrar = vacio). */
export interface DatosReportes {
  aves?: ReporteAves;
  estadoSalud?: EstadoSaludResumen;
  enfermedades?: EnfermedadCantidad[];
  huevos?: HuevosHoyMes;
  mejor?: MejorPonedora | null;
  finanzas?: TotalesFinanzas;
  exportAves?: FilaExportacionAves[];
  exportVentas?: FilaExportacionVentas[];
  exportClientes?: FilaExportacionClientes[];
  exportFinanzas?: FilaExportacionFinanzas[];
  exportHuevos?: FilaExportacionHuevos[];
  exportJaulas?: FilaExportacionJaulas[];
}

/** Repositorio falso de Reportes: devuelve lo sembrado por criadero y registra las llamadas. */
export class FakeReportesRepository implements ReportesRepository {
  datos = new Map<string, DatosReportes>();
  llamadas: Array<{ metodo: string; criaderoId: string; ahoraIso?: string }> = [];

  sembrar(criaderoId: string, d: DatosReportes) {
    this.datos.set(criaderoId, d);
  }

  private d(criaderoId: string, metodo: string, ahoraIso?: string): DatosReportes {
    this.llamadas.push({ metodo, criaderoId, ahoraIso });
    return this.datos.get(criaderoId) ?? {};
  }

  async contarAves(criaderoId: string): Promise<ReporteAves> {
    return this.d(criaderoId, "contarAves").aves ?? { activas: 0, vendidas: 0, fallecidas: 0 };
  }

  async estadoSalud(criaderoId: string): Promise<EstadoSaludResumen> {
    return this.d(criaderoId, "estadoSalud").estadoSalud ?? { tratamiento: 0, enfermas: 0 };
  }

  async enfermedades(criaderoId: string): Promise<EnfermedadCantidad[]> {
    return this.d(criaderoId, "enfermedades").enfermedades ?? [];
  }

  async huevosHoyMes(criaderoId: string, ahoraIso: string): Promise<HuevosHoyMes> {
    return this.d(criaderoId, "huevosHoyMes", ahoraIso).huevos ?? { hoy: 0, mes: 0 };
  }

  async mejorPonedora(criaderoId: string): Promise<MejorPonedora | null> {
    return this.d(criaderoId, "mejorPonedora").mejor ?? null;
  }

  async totalesFinanzas(criaderoId: string): Promise<TotalesFinanzas> {
    return this.d(criaderoId, "totalesFinanzas").finanzas ?? { ingresos: 0, egresos: 0 };
  }

  async exportarAves(criaderoId: string): Promise<FilaExportacionAves[]> {
    return this.d(criaderoId, "exportarAves").exportAves ?? [];
  }

  async exportarVentas(criaderoId: string): Promise<FilaExportacionVentas[]> {
    return this.d(criaderoId, "exportarVentas").exportVentas ?? [];
  }

  async exportarClientes(criaderoId: string): Promise<FilaExportacionClientes[]> {
    return this.d(criaderoId, "exportarClientes").exportClientes ?? [];
  }

  async exportarFinanzas(criaderoId: string): Promise<FilaExportacionFinanzas[]> {
    return this.d(criaderoId, "exportarFinanzas").exportFinanzas ?? [];
  }

  async exportarHuevos(criaderoId: string): Promise<FilaExportacionHuevos[]> {
    return this.d(criaderoId, "exportarHuevos").exportHuevos ?? [];
  }

  async exportarJaulas(criaderoId: string): Promise<FilaExportacionJaulas[]> {
    return this.d(criaderoId, "exportarJaulas").exportJaulas ?? [];
  }
}
