import { describe, it, expect, beforeEach } from "vitest";
import { HuevosService } from "../src/huevos/huevos.service";
import { FakeHuevosRepository } from "./helpers/fake-huevos.repository";

const CRIADERO = "criadero-1";
const AHORA = new Date("2026-11-03T10:00:00.000Z");

let repo: FakeHuevosRepository;
let service: HuevosService;

beforeEach(() => {
  repo = new FakeHuevosRepository();
  repo.sembrarAve(CRIADERO, "ave-1");
  repo.sembrarJaula(CRIADERO, "jaula-1", "J-1");

  let n = 0;
  service = new HuevosService(repo, () => `id-${++n}`, () => AHORA);
});

describe("HuevosService.registrar", () => {
  it("debe registrar el huevo y el evento POSTURA_HUEVO con el mismo código y jaula (HUE-01)", async () => {
    const r = await service.registrar(CRIADERO, "ave-1", {
      jaulaId: "jaula-1", fecha: "2026-11-01T10:00:00.000Z", observacion: "normal",
    });

    expect(r).toEqual({ success: true, data: { id: "id-1", codigo: "H000001" } });
    expect(repo.huevos[0]).toMatchObject({
      estado: "REGISTRADO", jaulaId: "jaula-1", observacion: "normal", fecha: "2026-11-01T10:00:00.000Z",
    });
    expect(repo.eventos[0]).toMatchObject({
      tipoEvento: "POSTURA_HUEVO", jaulaId: "jaula-1", fecha: "2026-11-01T10:00:00.000Z",
      detalle: "Registró huevo H000001",
    });
  });

  it("debe numerar por criadero y no por ave (HUE-02, HUE-11)", async () => {
    for (let i = 0; i < 3; i++) await service.registrar(CRIADERO, "ave-1", {});

    const r = await service.registrar(CRIADERO, "ave-1", {});

    expect(r.success && r.data.codigo).toBe("H000004");
    expect(repo.eventos[3].detalle).toBe("Registró huevo H000004");
  });

  it("debe guardar NULL con observación o jaula vacías (HUE-05)", async () => {
    await service.registrar(CRIADERO, "ave-1", { jaulaId: "", observacion: "" });
    await service.registrar(CRIADERO, "ave-1", { jaulaId: null });
    await service.registrar(CRIADERO, "ave-1", {});

    for (const h of repo.huevos) {
      expect(h.observacion).toBeNull();
      expect(h.jaulaId).toBeNull();
    }
    for (const e of repo.eventos) expect(e.jaulaId).toBeNull();
  });

  it("debe usar el reloj cuando la fecha falta o está vacía (HUE-06)", async () => {
    await service.registrar(CRIADERO, "ave-1", {});
    await service.registrar(CRIADERO, "ave-1", { fecha: "" });

    expect(repo.huevos.map((h) => h.fecha)).toEqual([AHORA.toISOString(), AHORA.toISOString()]);
  });

  it("debe escribir sin comprobar el estado del ave (HUE-07)", async () => {
    // El fake no conoce estados: el servicio no los consulta.
    const r = await service.registrar(CRIADERO, "ave-1", {});

    expect(r.success).toBe(true);
  });

  it("debe responder AVE_NO_ENCONTRADA sin escribir (HUE-08)", async () => {
    const r = await service.registrar(CRIADERO, "otra", {});

    expect(r).toMatchObject({ success: false, error: "AVE_NO_ENCONTRADA" });
    expect(repo.huevos).toHaveLength(0);
  });

  it("debe responder JAULA_NO_ENCONTRADA sin escribir (HUE-09)", async () => {
    const r = await service.registrar(CRIADERO, "ave-1", { jaulaId: "ajena" });

    expect(r).toMatchObject({
      success: false, error: "JAULA_NO_ENCONTRADA", message: "FOREIGN KEY constraint failed",
    });
    expect(repo.huevos).toHaveLength(0);
  });

  it("debe rechazar cuerpos con tipos inválidos", async () => {
    for (const body of [null, [], "x", { fecha: 5 }, { jaulaId: 1 }, { observacion: {} }]) {
      const r = await service.registrar(CRIADERO, "ave-1", body);
      expect(r).toMatchObject({ success: false, error: "VALIDATION_ERROR" });
    }
  });
});

describe("HuevosService lecturas", () => {
  it("debe listar por fecha descendente y por inserción inversa en empate (HUE-12)", async () => {
    await service.registrar(CRIADERO, "ave-1", { fecha: "2026-11-01T10:00:00.000Z", jaulaId: "jaula-1" });
    await service.registrar(CRIADERO, "ave-1", { fecha: "2026-11-02T10:00:00.000Z" });
    await service.registrar(CRIADERO, "ave-1", { fecha: "2026-11-02T10:00:00.000Z" });

    const r = await service.listarPorAve(CRIADERO, "ave-1");

    expect(r.success && r.data.huevos.map((h) => h.codigo)).toEqual(["H000003", "H000002", "H000001"]);
    expect(r.success && r.data.huevos[2]).toMatchObject({ jaulaCodigo: "J-1" });
    expect(r.success && r.data.huevos[0].jaulaCodigo).toBeNull();
  });

  it("debe devolver lista vacía para un ave inexistente (HUE-13)", async () => {
    expect(await service.listarPorAve(CRIADERO, "no")).toEqual({ success: true, data: { huevos: [] } });
  });

  it("debe pasar el instante del reloj inyectado a los agregados con fecha", async () => {
    await service.resumen(CRIADERO);
    await service.porDia(CRIADERO);
    await service.total(CRIADERO);

    expect(repo.ahoraRecibido).toEqual(Array(3).fill("2026-11-03T10:00:00.000Z"));
  });

  it("debe envolver cada agregado en su clave", async () => {
    expect(await service.ranking(CRIADERO)).toEqual({ success: true, data: { ranking: [] } });
    expect(await service.porDiaHistorico(CRIADERO)).toEqual({ success: true, data: { dias: [] } });
    expect(await service.porHora(CRIADERO)).toEqual({ success: true, data: { horas: [] } });
    expect(await service.porJaula(CRIADERO)).toEqual({ success: true, data: { jaulas: [] } });
    expect(await service.porAve(CRIADERO)).toEqual({ success: true, data: { aves: [] } });
    expect(await service.siguienteCodigo(CRIADERO)).toEqual({ success: true, data: { codigo: "H000001" } });
  });
});
