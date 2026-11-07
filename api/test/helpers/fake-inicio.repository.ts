import type { InicioRepository } from "../../src/inicio/inicio.repository";
import type {
  FilaAvesPorRaza,
  FilaHoraPico,
  FilaMejorPonedora,
  FilaProduccionDia,
  FilaResumenInicio,
} from "../../src/inicio/inicio.types";

export interface DatosInicio {
  resumen?: Partial<FilaResumenInicio> | null;
  mejorPonedora?: FilaMejorPonedora | null;
  horaPico?: FilaHoraPico | null;
  produccionSemana?: FilaProduccionDia[];
  avesPorRaza?: FilaAvesPorRaza[];
}

const RESUMEN_VACIO: FilaResumenInicio = {
  activas: 0, vendidas: 0, fallecidas: 0, sanas: 0, tratamiento: 0, enfermas: 0,
  ingresos: 0, egresos: 0, total: 0, ocupadas: 0, hoy: 0, mes: 0, promedio: 0,
};

/** Repositorio falso de Inicio: devuelve lo sembrado por criadero y registra las llamadas. */
export class FakeInicioRepository implements InicioRepository {
  datos = new Map<string, DatosInicio>();
  llamadas: Array<{ metodo: string; criaderoId: string; ahoraIso?: string }> = [];

  sembrar(criaderoId: string, d: DatosInicio) {
    this.datos.set(criaderoId, d);
  }

  private registrar(metodo: string, criaderoId: string, ahoraIso?: string): DatosInicio {
    this.llamadas.push({ metodo, criaderoId, ahoraIso });
    return this.datos.get(criaderoId) ?? {};
  }

  async resumen(criaderoId: string, ahoraIso: string) {
    const d = this.registrar("resumen", criaderoId, ahoraIso);
    if (d.resumen === null) return null;
    return { ...RESUMEN_VACIO, ...(d.resumen ?? {}) };
  }

  async mejorPonedora(criaderoId: string) {
    return this.registrar("mejorPonedora", criaderoId).mejorPonedora ?? null;
  }

  async horaPico(criaderoId: string) {
    return this.registrar("horaPico", criaderoId).horaPico ?? null;
  }

  async produccionSemana(criaderoId: string, ahoraIso: string) {
    return this.registrar("produccionSemana", criaderoId, ahoraIso).produccionSemana ?? [];
  }

  async avesPorRaza(criaderoId: string) {
    return this.registrar("avesPorRaza", criaderoId).avesPorRaza ?? [];
  }
}
