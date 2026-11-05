import type { ReportesRepository } from './reportes.repository';
import type {
  Exportacion,
  FilaExportacionAves,
  FilaExportacionClientes,
  FilaExportacionFinanzas,
  FilaExportacionHuevos,
  FilaExportacionJaulas,
  FilaExportacionVentas,
  ReporteAves,
  ReporteFinanzas,
  ReporteProduccion,
  ReporteSalud,
  Resultado,
} from './reportes.types';


/**
 * Solo lectura: replica ReportesRepository.js de V1 (sin validaciones ni errores propios).
 * `ahora` sustituye al 'now' del SQL de V1 (periodos en UTC) y solo se usa en produccion.
 */
export class ReportesService {

  constructor(
    private repo: ReportesRepository,
    private ahora: () => Date = () => new Date()
  ) {}

  async aves(criaderoId: string): Promise<Resultado<ReporteAves>> {
    return { success: true, data: await this.repo.contarAves(criaderoId) };
  }

  async salud(criaderoId: string): Promise<Resultado<ReporteSalud>> {
    const estado = await this.repo.estadoSalud(criaderoId);
    const enfermedades = await this.repo.enfermedades(criaderoId);
    return { success: true, data: { estado, enfermedades } };
  }

  async produccion(criaderoId: string): Promise<Resultado<ReporteProduccion>> {
    const huevos = await this.repo.huevosHoyMes(criaderoId, this.ahora().toISOString());
    const mejor = await this.repo.mejorPonedora(criaderoId);
    return { success: true, data: { huevos, mejor } };
  }

  /** Igual que V1: Number(x || 0) y utilidad = ingresos - egresos en JS. */
  async finanzas(criaderoId: string): Promise<Resultado<ReporteFinanzas>> {
    const t = await this.repo.totalesFinanzas(criaderoId);
    const ingresos = Number(t?.ingresos || 0);
    const egresos = Number(t?.egresos || 0);
    return { success: true, data: { ingresos, egresos, utilidad: ingresos - egresos } };
  }

  async exportarAves(criaderoId: string): Promise<Resultado<Exportacion<FilaExportacionAves>>> {
    return { success: true, data: { filas: await this.repo.exportarAves(criaderoId) } };
  }

  async exportarVentas(criaderoId: string): Promise<Resultado<Exportacion<FilaExportacionVentas>>> {
    return { success: true, data: { filas: await this.repo.exportarVentas(criaderoId) } };
  }

  async exportarClientes(criaderoId: string): Promise<Resultado<Exportacion<FilaExportacionClientes>>> {
    return { success: true, data: { filas: await this.repo.exportarClientes(criaderoId) } };
  }

  async exportarFinanzas(criaderoId: string): Promise<Resultado<Exportacion<FilaExportacionFinanzas>>> {
    return { success: true, data: { filas: await this.repo.exportarFinanzas(criaderoId) } };
  }

  async exportarHuevos(criaderoId: string): Promise<Resultado<Exportacion<FilaExportacionHuevos>>> {
    return { success: true, data: { filas: await this.repo.exportarHuevos(criaderoId) } };
  }

  async exportarJaulas(criaderoId: string): Promise<Resultado<Exportacion<FilaExportacionJaulas>>> {
    return { success: true, data: { filas: await this.repo.exportarJaulas(criaderoId) } };
  }

}
