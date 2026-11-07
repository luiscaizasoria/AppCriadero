import { describe, it, expect, beforeEach } from "vitest";
import { InicioService } from "../src/inicio/inicio.service";
import { FakeInicioRepository } from "./helpers/fake-inicio.repository";

const C = "criadero-1";
const AHORA = new Date("2026-11-05T15:00:00.000Z");

let repo: FakeInicioRepository;
let service: InicioService;

async function dashboard() {
  const r = await service.obtener(C);
  return r.data;
}

const CLAVES = [
  "aves", "salud", "finanzas", "jaulas", "ocupacionJaulas", "huevos", "mejorPonedora", "horaPico",
  "produccionSemana", "avesPorRaza", "totalRazas", "promedioHuevos",
];

describe("InicioService", () => {
  beforeEach(() => {
    repo = new FakeInicioRepository();
    service = new InicioService(repo, () => AHORA);
  });

  it("debe devolver ceros, null y arrays vacios en un criadero vacio con las claves de V1 en orden", async () => {
    const d = await dashboard();

    expect(Object.keys(d)).toEqual(CLAVES);
    expect(d).toStrictEqual({
      aves: { activas: 0, vendidas: 0, fallecidas: 0 },
      salud: { sanas: 0, tratamiento: 0, enfermas: 0 },
      finanzas: { ingresos: 0, egresos: 0, utilidad: 0 },
      jaulas: { total: 0, ocupadas: 0 },
      ocupacionJaulas: { porcentaje: 0 },
      huevos: { hoy: 0, mes: 0 },
      mejorPonedora: null,
      horaPico: null,
      produccionSemana: [],
      avesPorRaza: [],
      totalRazas: 0,
      promedioHuevos: 0,
    });
  });

  it("debe ordenar las claves internas como el SELECT de V1", async () => {
    const d = await dashboard();

    expect(Object.keys(d.aves)).toEqual(["activas", "vendidas", "fallecidas"]);
    expect(Object.keys(d.salud)).toEqual(["sanas", "tratamiento", "enfermas"]);
    expect(Object.keys(d.finanzas)).toEqual(["ingresos", "egresos", "utilidad"]);
    expect(Object.keys(d.jaulas)).toEqual(["total", "ocupadas"]);
    expect(Object.keys(d.huevos)).toEqual(["hoy", "mes"]);
  });

  it("debe calcular la ocupacion con toFixed(2) en JS y 0 sin jaulas", async () => {
    repo.sembrar(C, { resumen: { total: 3, ocupadas: 1 } });
    expect((await dashboard()).ocupacionJaulas.porcentaje).toBe(33.33);

    repo.sembrar(C, { resumen: { total: 3, ocupadas: 2 } });
    expect((await dashboard()).ocupacionJaulas.porcentaje).toBe(66.67);

    repo.sembrar(C, { resumen: { total: 0, ocupadas: 0 } });
    expect((await dashboard()).ocupacionJaulas.porcentaje).toBe(0);
  });

  it("debe calcular la utilidad en JS sin redondeo", async () => {
    repo.sembrar(C, { resumen: { ingresos: 0.3, egresos: 0.1 } });

    expect((await dashboard()).finanzas).toStrictEqual({ ingresos: 0.3, egresos: 0.1, utilidad: 0.3 - 0.1 });
    expect((await dashboard()).finanzas.utilidad).toBe(0.19999999999999998);
  });

  it("debe tratar ingresos y egresos nulos como 0", async () => {
    repo.sembrar(C, { resumen: { ingresos: null, egresos: null, promedio: null } });
    const d = await dashboard();

    expect(d.finanzas).toStrictEqual({ ingresos: 0, egresos: 0, utilidad: 0 });
    expect(d.promedioHuevos).toBe(0);
  });

  it("debe tomar totalRazas del numero de filas de avesPorRaza", async () => {
    repo.sembrar(C, {
      avesPorRaza: [
        { raza: "A", cantidad: 2, porcentaje: 66.67 },
        { raza: "B", cantidad: 1, porcentaje: 33.33 },
      ],
    });
    const d = await dashboard();

    expect(d.totalRazas).toBe(2);
    expect(d.avesPorRaza.map((r) => r.raza)).toEqual(["A", "B"]);
  });

  it("debe devolver mejorPonedora y horaPico tal cual o null real", async () => {
    repo.sembrar(C, { mejorPonedora: { codigo: "K001", cantidad: 3 }, horaPico: { hora: "08", cantidad: 2 } });
    const d = await dashboard();

    expect(d.mejorPonedora).toStrictEqual({ codigo: "K001", cantidad: 3 });
    expect(d.horaPico).toStrictEqual({ hora: "08", cantidad: 2 });

    repo.sembrar(C, {});
    const v = await dashboard();
    expect(v.mejorPonedora).toBeNull();
    expect(v.horaPico).toBeNull();
    expect(Object.keys(v)).toContain("mejorPonedora");
  });

  it("debe devolver ceros si el resumen llega como null", async () => {
    repo.sembrar(C, { resumen: null });
    const d = await dashboard();

    expect(d.aves).toStrictEqual({ activas: 0, vendidas: 0, fallecidas: 0 });
    expect(d.ocupacionJaulas.porcentaje).toBe(0);
  });

  it("debe pasar el produccionSemana tal cual salio del repositorio", async () => {
    const filas = [{ dia: "Domingo", cantidad: 2 }, { dia: "Sábado", cantidad: 1 }];
    repo.sembrar(C, { produccionSemana: filas });

    expect((await dashboard()).produccionSemana).toStrictEqual(filas);
  });

  it("debe usar un unico instante inyectado en todas las consultas y consultar 5 veces", async () => {
    await dashboard();
    const conAhora = repo.llamadas.filter((l) => l.ahoraIso !== undefined);

    expect(repo.llamadas).toHaveLength(5);
    expect(conAhora.map((l) => l.metodo)).toEqual(["resumen", "produccionSemana"]);
    expect(conAhora.every((l) => l.ahoraIso === "2026-11-05T15:00:00.000Z")).toBe(true);
    expect(repo.llamadas.every((l) => l.criaderoId === C)).toBe(true);
  });
});
