import type { HuevosRepository } from "../../src/huevos/huevos.repository";
import type {
  HuevoAve,
  ProduccionAve,
  ProduccionDia,
  ProduccionHora,
  ProduccionJaula,
  RankingPonedora,
  RegistrarHuevoInput,
  ResumenProduccion,
  TotalProduccion,
} from "../../src/huevos/huevos.types";

interface Huevo {
  criaderoId: string;
  id: string;
  codigo: string;
  aveId: string;
  jaulaId: string | null;
  fecha: string;
  estado: string;
  observacion: string | null;
}

export interface EventoHuevo {
  id: string;
  aveId: string;
  jaulaId: string | null;
  tipoEvento: string;
  fecha: string;
  detalle: string;
}

/** Fake en memoria: registra y lista de verdad; los agregados devuelven valores sembrados y anotan `ahora`. */
export class FakeHuevosRepository implements HuevosRepository {
  aves = new Set<string>();
  jaulas = new Map<string, string>();
  huevos: Huevo[] = [];
  eventos: EventoHuevo[] = [];
  ahoraRecibido: string[] = [];

  resumenSembrado: ResumenProduccion = { hoy: 0, semana: 0, mes: 0 };
  totalSembrado: TotalProduccion = { total: 0, hoy: null, mes: null };
  rankingSembrado: RankingPonedora[] = [];
  diasSembrados: ProduccionDia[] = [];
  horasSembradas: ProduccionHora[] = [];
  jaulasSembradas: ProduccionJaula[] = [];
  avesSembradas: ProduccionAve[] = [];

  sembrarAve(criaderoId: string, aveId: string) {
    this.aves.add(`${criaderoId}|${aveId}`);
  }

  sembrarJaula(criaderoId: string, jaulaId: string, codigo: string) {
    this.jaulas.set(`${criaderoId}|${jaulaId}`, codigo);
  }

  async existeAve(criaderoId: string, aveId: string) {
    return this.aves.has(`${criaderoId}|${aveId}`);
  }

  async existeJaula(criaderoId: string, jaulaId: string) {
    return this.jaulas.has(`${criaderoId}|${jaulaId}`);
  }

  async siguienteCodigo(criaderoId: string) {
    const n = this.huevos.filter((h) => h.criaderoId === criaderoId).length + 1;
    return `H${String(n).padStart(6, "0")}`;
  }

  async registrarHuevo(criaderoId: string, i: RegistrarHuevoInput) {
    const codigo = await this.siguienteCodigo(criaderoId);

    this.huevos.push({
      criaderoId, id: i.huevoId, codigo, aveId: i.aveId, jaulaId: i.jaulaId,
      fecha: i.fecha, estado: "REGISTRADO", observacion: i.observacion,
    });
    this.eventos.push({
      id: i.historialId, aveId: i.aveId, jaulaId: i.jaulaId, tipoEvento: "POSTURA_HUEVO",
      fecha: i.fecha, detalle: `Registró huevo ${codigo}`,
    });

    return codigo;
  }

  async listarPorAve(criaderoId: string, aveId: string): Promise<HuevoAve[]> {
    return this.huevos
      .map((h, orden) => ({ h, orden }))
      .filter(({ h }) => h.criaderoId === criaderoId && h.aveId === aveId)
      .sort((a, b) => (a.h.fecha < b.h.fecha ? 1 : a.h.fecha > b.h.fecha ? -1 : b.orden - a.orden))
      .map(({ h }) => ({
        id: h.id, codigo: h.codigo, fecha: h.fecha, estado: h.estado, observacion: h.observacion,
        jaulaCodigo: h.jaulaId ? this.jaulas.get(`${criaderoId}|${h.jaulaId}`) ?? null : null,
      }));
  }

  async resumen(_criaderoId: string, ahora: string) {
    this.ahoraRecibido.push(ahora);
    return this.resumenSembrado;
  }

  async ranking() {
    return this.rankingSembrado;
  }

  async porDia(_criaderoId: string, ahora: string) {
    this.ahoraRecibido.push(ahora);
    return this.diasSembrados;
  }

  async porDiaHistorico() {
    return this.diasSembrados;
  }

  async porHora() {
    return this.horasSembradas;
  }

  async porJaula() {
    return this.jaulasSembradas;
  }

  async porAve() {
    return this.avesSembradas;
  }

  async total(_criaderoId: string, ahora: string) {
    this.ahoraRecibido.push(ahora);
    return this.totalSembrado;
  }
}
