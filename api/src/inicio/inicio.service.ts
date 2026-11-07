import type { InicioRepository } from './inicio.repository';
import type { Dashboard, Resultado } from './inicio.types';


/**
 * Solo lectura: replica DashboardRepository.js de V1 (sin validaciones ni errores propios).
 * Un unico `ahora` por peticion se usa en todas las consultas (sustituye a 'now').
 */
export class InicioService {

  constructor(
    private repo: InicioRepository,
    private ahora: () => Date = () => new Date()
  ) {}

  async obtener(criaderoId: string): Promise<Resultado<Dashboard>> {
    const ahoraIso = this.ahora().toISOString();

    const [r, mejorPonedora, horaPico, produccionSemana, avesPorRaza] = await Promise.all([
      this.repo.resumen(criaderoId, ahoraIso),
      this.repo.mejorPonedora(criaderoId),
      this.repo.horaPico(criaderoId),
      this.repo.produccionSemana(criaderoId, ahoraIso),
      this.repo.avesPorRaza(criaderoId)
    ]);

    const total = Number(r?.total);
    const ingresos = Number(r?.ingresos || 0);
    const egresos = Number(r?.egresos || 0);

    const data: Dashboard = {
      aves: { activas: r?.activas ?? 0, vendidas: r?.vendidas ?? 0, fallecidas: r?.fallecidas ?? 0 },
      salud: { sanas: r?.sanas ?? 0, tratamiento: r?.tratamiento ?? 0, enfermas: r?.enfermas ?? 0 },
      finanzas: { ingresos, egresos, utilidad: ingresos - egresos },
      jaulas: { total: r?.total ?? 0, ocupadas: r?.ocupadas ?? 0 },
      ocupacionJaulas: {
        porcentaje: total > 0
          ? Number(((Number(r?.ocupadas) / total) * 100).toFixed(2))
          : 0
      },
      huevos: { hoy: r?.hoy ?? 0, mes: r?.mes ?? 0 },
      mejorPonedora: mejorPonedora ?? null,
      horaPico: horaPico ?? null,
      produccionSemana,
      avesPorRaza,
      totalRazas: avesPorRaza.length,
      promedioHuevos: Number(r?.promedio || 0)
    };

    return { success: true, data };
  }

}
