import { describe, it, expect, beforeEach } from "vitest";
import { AlertasService } from "../src/alertas/alertas.service";
import { FakeAlertasRepository } from "./helpers/fake-alertas.repository";

const C = "criadero-1";
const AHORA = new Date("2026-11-05T15:00:00.000Z");

let repo: FakeAlertasRepository;
let service: AlertasService;

async function alertas() {
  const r = await service.obtener(C);
  return r.data.alertas;
}

describe("AlertasService", () => {
  beforeEach(() => {
    repo = new FakeAlertasRepository();
    service = new AlertasService(repo, () => AHORA);
  });

  it("debe devolver solo Produccion sin datos y no Finanzas (0 = 0)", async () => {
    const a = await alertas();

    expect(a.map((x) => x.tipo)).toEqual(["PRODUCCION"]);
    expect(a[0]).toStrictEqual({
      tipo: "PRODUCCION", nivel: "MEDIO", titulo: "Sin producción registrada",
      mensaje: "No existen huevos registrados hoy.", entidadId: null, accion: null, accionDestino: null,
    });
    expect(Object.keys(a[0])).toEqual(["tipo", "nivel", "titulo", "mensaje", "entidadId", "accion", "accionDestino"]);
  });

  it("debe devolver [] cuando hay huevos hoy y no hay otras alertas", async () => {
    repo.sembrar(C, { huevosHoy: 3 });

    expect(await alertas()).toEqual([]);
  });

  it("debe alertar la salud con dias >= 7 y usar Math.floor en el mensaje", async () => {
    repo.sembrar(C, {
      huevosHoy: 1,
      salud: [
        { id: "a1", codigo: "K001", dias: 7.9 },
        { id: "a2", codigo: "K002", dias: 6.999999 },
        { id: "a3", codigo: "K003", dias: 7 },
      ],
    });
    const a = await alertas();

    expect(a.map((x) => x.mensaje)).toEqual([
      "El ave K001 lleva 7 días en tratamiento.",
      "El ave K003 lleva 7 días en tratamiento.",
    ]);
    expect(a[0]).toStrictEqual({
      tipo: "SALUD", nivel: "ALTO", titulo: "Ave en tratamiento prolongado",
      mensaje: "El ave K001 lleva 7 días en tratamiento.", entidadId: "a1", accion: "DETALLE_AVE", accionDestino: "DETALLE_AVE",
    });
  });

  it("debe ignorar dias null o negativos", async () => {
    repo.sembrar(C, {
      huevosHoy: 1,
      salud: [{ id: "a1", codigo: "K001", dias: null }, { id: "a2", codigo: "K002", dias: -9 }],
    });

    expect(await alertas()).toEqual([]);
  });

  it("debe poner alimentacion antes que bebida en cada jaula y respetar el orden recibido", async () => {
    repo.sembrar(C, {
      huevosHoy: 1,
      jaulas: [
        { id: "j2", codigo: "J02", sin_alimentacion: 1, sin_bebida: 1 },
        { id: "j1", codigo: "J01", sin_alimentacion: 0, sin_bebida: 1 },
        { id: "j3", codigo: "J03", sin_alimentacion: 0, sin_bebida: 0 },
      ],
    });
    const a = await alertas();

    expect(a.map((x) => [x.entidadId, x.accionDestino])).toEqual([
      ["j2", "ALIMENTACION_JAULA"], ["j2", "BEBIDA_JAULA"], ["j1", "BEBIDA_JAULA"],
    ]);
    expect(a[0].mensaje).toBe("La jaula J02 no tiene alimentación registrada hoy.");
    expect(a[1]).toStrictEqual({
      tipo: "JAULA", nivel: "MEDIO", titulo: "Sin bebida registrada",
      mensaje: "La jaula J02 no tiene bebida registrada hoy.", entidadId: "j2", accion: "DETALLE_JAULA", accionDestino: "BEBIDA_JAULA",
    });
  });

  it("debe alertar Finanzas solo si egresos > ingresos (estricto)", async () => {
    repo.sembrar(C, { huevosHoy: 1, totales: { ingresos: 10, egresos: 10 } });
    expect(await alertas()).toEqual([]);

    repo.sembrar(C, { huevosHoy: 1, totales: { ingresos: 10, egresos: 10.01 } });
    expect((await alertas())[0]).toStrictEqual({
      tipo: "FINANZAS", nivel: "ALTO", titulo: "Gastos superiores a ingresos",
      mensaje: "Los egresos del mes superan los ingresos registrados.", entidadId: null, accion: null, accionDestino: null,
    });

    repo.sembrar(C, { huevosHoy: 1, totales: null });
    expect(await alertas()).toEqual([]);
  });

  it("debe ensamblar salud, jaulas, produccion y finanzas en ese orden", async () => {
    repo.sembrar(C, {
      salud: [{ id: "a1", codigo: "K001", dias: 8 }],
      jaulas: [{ id: "j1", codigo: "J01", sin_alimentacion: 1, sin_bebida: 1 }],
      huevosHoy: 0,
      totales: { ingresos: 0, egresos: 5 },
    });

    expect((await alertas()).map((x) => x.tipo)).toEqual(["SALUD", "JAULA", "JAULA", "PRODUCCION", "FINANZAS"]);
  });

  it("debe usar el mismo instante ahora en las cuatro consultas", async () => {
    await alertas();

    expect(repo.llamadas.map((l) => l.metodo)).toEqual(["avesEnTratamiento", "jaulasActivas", "huevosHoy", "totalesMes"]);
    expect(new Set(repo.llamadas.map((l) => l.ahoraIso))).toEqual(new Set(["2026-11-05T15:00:00.000Z"]));
    expect(new Set(repo.llamadas.map((l) => l.criaderoId))).toEqual(new Set([C]));
  });

  it("debe evaluar el reloj una sola vez por peticion", async () => {
    let n = 0;
    const s = new AlertasService(repo, () => { n++; return new Date(AHORA.getTime() + n * 86400000); });
    await s.obtener(C);

    expect(n).toBe(1);
  });
});
