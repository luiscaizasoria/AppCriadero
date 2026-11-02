import type { SaludRepository } from "../../src/salud/salud.repository";
import type { HistorialSalud, RegistrarDiagnosticoInput } from "../../src/salud/salud.types";

interface Diagnostico {
  criaderoId: string;
  id: string;
  aveId: string;
  fecha: string;
  enfermedad: string;
  sintomas: string | null;
  observacion: string | null;
  estado: string;
}

interface Tratamiento {
  id: string;
  diagnosticoId: string;
  aveId: string;
  fecha: string;
  medicamento: string;
  dosis: string | null;
  observacion: string | null;
}

export interface EventoHistorial {
  id: string;
  aveId: string;
  tipoEvento: string;
  fecha: string;
  detalle: string;
}

export class FakeSaludRepository implements SaludRepository {
  aves = new Set<string>();
  diagnosticos: Diagnostico[] = [];
  tratamientos: Tratamiento[] = [];
  eventos: EventoHistorial[] = [];
  ultimoControl = new Map<string, string>();
  estadoSalud = new Map<string, string>();

  sembrarAve(criaderoId: string, aveId: string) {
    this.aves.add(`${criaderoId}|${aveId}`);
  }

  async existeAve(criaderoId: string, aveId: string) {
    return this.aves.has(`${criaderoId}|${aveId}`);
  }

  async registrarDiagnostico(criaderoId: string, i: RegistrarDiagnosticoInput) {
    this.diagnosticos.push({
      criaderoId, id: i.diagnosticoId, aveId: i.aveId, fecha: i.fecha,
      enfermedad: i.enfermedad, sintomas: i.sintomas, observacion: i.observacion, estado: "ACTIVO",
    });

    if (i.medicamento) {
      this.tratamientos.push({
        id: i.tratamientoId, diagnosticoId: i.diagnosticoId, aveId: i.aveId, fecha: i.fecha,
        medicamento: i.medicamento, dosis: i.dosis, observacion: i.observacion,
      });
    }

    this.estadoSalud.set(i.aveId, "EN_TRATAMIENTO");
    this.ultimoControl.set(i.aveId, i.fecha);
    this.eventos.push({
      id: i.historialId, aveId: i.aveId, tipoEvento: "SALUD", fecha: i.fecha,
      detalle: `Diagnóstico registrado: ${i.enfermedad}`,
    });
  }

  async listarHistorial(criaderoId: string, aveId: string): Promise<HistorialSalud[]> {
    return this.diagnosticos
      .filter((d) => d.criaderoId === criaderoId && d.aveId === aveId)
      .sort((a, b) => (a.fecha < b.fecha ? 1 : a.fecha > b.fecha ? -1 : 0))
      .map((d) => {
        const t = this.tratamientos.find((x) => x.diagnosticoId === d.id);
        return {
          id: d.id, fecha: d.fecha, enfermedad: d.enfermedad, sintomas: d.sintomas,
          observacion: d.observacion, medicamento: t?.medicamento ?? null, dosis: t?.dosis ?? null,
        };
      });
  }
}
