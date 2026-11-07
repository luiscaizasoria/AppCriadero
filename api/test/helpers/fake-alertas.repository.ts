import type { AlertasRepository } from "../../src/alertas/alertas.repository";
import type { FilaJaulaAlerta, FilaSaludAlerta, TotalesMes } from "../../src/alertas/alertas.types";

export interface DatosAlertas {
  salud?: FilaSaludAlerta[];
  jaulas?: FilaJaulaAlerta[];
  huevosHoy?: number;
  totales?: TotalesMes | null;
}

/** Repositorio falso de Alertas: devuelve lo sembrado por criadero y registra las llamadas. */
export class FakeAlertasRepository implements AlertasRepository {
  datos = new Map<string, DatosAlertas>();
  llamadas: Array<{ metodo: string; criaderoId: string; ahoraIso: string }> = [];

  sembrar(criaderoId: string, d: DatosAlertas) {
    this.datos.set(criaderoId, d);
  }

  private registrar(metodo: string, criaderoId: string, ahoraIso: string): DatosAlertas {
    this.llamadas.push({ metodo, criaderoId, ahoraIso });
    return this.datos.get(criaderoId) ?? {};
  }

  async avesEnTratamiento(criaderoId: string, ahoraIso: string) {
    return this.registrar("avesEnTratamiento", criaderoId, ahoraIso).salud ?? [];
  }

  async jaulasActivas(criaderoId: string, ahoraIso: string) {
    return this.registrar("jaulasActivas", criaderoId, ahoraIso).jaulas ?? [];
  }

  async huevosHoy(criaderoId: string, ahoraIso: string) {
    return this.registrar("huevosHoy", criaderoId, ahoraIso).huevosHoy ?? 0;
  }

  async totalesMes(criaderoId: string, ahoraIso: string) {
    const d = this.registrar("totalesMes", criaderoId, ahoraIso);
    return d.totales === undefined ? { ingresos: 0, egresos: 0 } : d.totales;
  }
}
