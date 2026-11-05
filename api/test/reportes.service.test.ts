import { describe, it, expect, beforeEach } from "vitest";
import { ReportesService } from "../src/reportes/reportes.service";
import type { FilaExportacionJaulas } from "../src/reportes/reportes.types";
import { FakeReportesRepository } from "./helpers/fake-reportes.repository";

const AHORA = new Date("2026-11-05T15:00:00.000Z");

describe("ReportesService", () => {
  let repo: FakeReportesRepository;
  let service: ReportesService;

  beforeEach(() => {
    repo = new FakeReportesRepository();
    service = new ReportesService(repo, () => AHORA);
  });

  it("debe devolver ceros, enfermedades vacias y mejor null sin datos (REP-01)", async () => {
    expect(await service.aves("c1")).toEqual({ success: true, data: { activas: 0, vendidas: 0, fallecidas: 0 } });
    expect(await service.salud("c1")).toEqual({
      success: true,
      data: { estado: { tratamiento: 0, enfermas: 0 }, enfermedades: [] },
    });
    expect(await service.produccion("c1")).toEqual({
      success: true,
      data: { huevos: { hoy: 0, mes: 0 }, mejor: null },
    });
    expect(await service.finanzas("c1")).toEqual({ success: true, data: { ingresos: 0, egresos: 0, utilidad: 0 } });
  });

  it("debe calcular utilidad = ingresos - egresos en JS sin redondear (REP-11)", async () => {
    repo.sembrar("c1", { finanzas: { ingresos: 0.1 + 0.2, egresos: 0.1 } });
    const r = await service.finanzas("c1");
    if (!r.success) throw new Error("finanzas");

    expect(r.data.ingresos).toBe(0.30000000000000004);
    expect(r.data.utilidad).toBe(0.30000000000000004 - 0.1);
  });

  it("debe dar utilidad negativa con solo egresos (REP-12)", async () => {
    repo.sembrar("c1", { finanzas: { ingresos: 0, egresos: 7.5 } });

    expect(await service.finanzas("c1")).toEqual({ success: true, data: { ingresos: 0, egresos: 7.5, utilidad: -7.5 } });
  });

  it("debe convertir null de los totales en 0 como Number(x || 0) de V1", async () => {
    repo.sembrar("c1", { finanzas: { ingresos: null, egresos: null } });

    expect(await service.finanzas("c1")).toEqual({ success: true, data: { ingresos: 0, egresos: 0, utilidad: 0 } });
  });

  it("debe pasar al repositorio el instante inyectado en ISO UTC solo en produccion", async () => {
    await service.produccion("c1");
    await service.aves("c1");

    expect(repo.llamadas.find((l) => l.metodo === "huevosHoyMes")?.ahoraIso).toBe("2026-11-05T15:00:00.000Z");
    expect(repo.llamadas.find((l) => l.metodo === "contarAves")?.ahoraIso).toBeUndefined();
  });

  it("debe devolver mejor ponedora y enfermedades tal como las entrega el repositorio", async () => {
    repo.sembrar("c1", {
      mejor: { codigo: "K001", cantidad: 4 },
      enfermedades: [{ enfermedad: "Coriza", cantidad: 3 }],
      estadoSalud: { tratamiento: 2, enfermas: 1 },
    });

    expect(await service.produccion("c1")).toMatchObject({ data: { mejor: { codigo: "K001", cantidad: 4 } } });
    expect(await service.salud("c1")).toEqual({
      success: true,
      data: { estado: { tratamiento: 2, enfermas: 1 }, enfermedades: [{ enfermedad: "Coriza", cantidad: 3 }] },
    });
  });

  it("debe usar 2 consultas de repositorio en salud y produccion y 1 en las demas", async () => {
    await service.salud("c1");
    expect(repo.llamadas).toHaveLength(2);
    repo.llamadas = [];
    await service.produccion("c1");
    expect(repo.llamadas).toHaveLength(2);
    repo.llamadas = [];
    await service.aves("c1");
    await service.finanzas("c1");
    expect(repo.llamadas).toHaveLength(2);
  });

  it("debe devolver filas: [] sin error en las 6 exportaciones vacias (REP-21)", async () => {
    for (const metodo of ["exportarAves", "exportarVentas", "exportarClientes", "exportarFinanzas", "exportarHuevos", "exportarJaulas"] as const) {
      expect(await service[metodo]("c1"), metodo).toEqual({ success: true, data: { filas: [] } });
    }
  });

  it("debe conservar las filas y el orden de claves sin renombrar ni reordenar", async () => {
    const fila: FilaExportacionJaulas = {
      Codigo: "J01", Nombre: null, Ubicacion: null, Tipo: null, EstadoSanitario: "NORMAL",
      Estado: "ACTIVA", FechaCreacion: "2026-10-01 10:00:00", FechaDesactivacion: null,
    };
    repo.sembrar("c1", { exportJaulas: [fila] });
    const r = await service.exportarJaulas("c1");
    if (!r.success) throw new Error("jaulas");

    expect(Object.keys(r.data.filas[0])).toEqual([
      "Codigo", "Nombre", "Ubicacion", "Tipo", "EstadoSanitario", "Estado", "FechaCreacion", "FechaDesactivacion",
    ]);
    expect(r.data.filas[0].FechaDesactivacion).toBeNull();
  });

  it("debe usar el criadero pedido y no mezclar datos de otro", async () => {
    repo.sembrar("c1", { aves: { activas: 3, vendidas: 0, fallecidas: 0 } });
    repo.sembrar("c2", { aves: { activas: 9, vendidas: 0, fallecidas: 0 } });

    expect(await service.aves("c1")).toMatchObject({ data: { activas: 3 } });
    expect(await service.aves("c2")).toMatchObject({ data: { activas: 9 } });
  });
});
