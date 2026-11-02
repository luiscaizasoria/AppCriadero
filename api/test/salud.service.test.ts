import { describe, it, expect, beforeEach } from "vitest";
import { SaludService } from "../src/salud/salud.service";
import { FakeSaludRepository } from "./helpers/fake-salud.repository";

const C = "criadero-1";
const AVE = "ave-1";

let repo: FakeSaludRepository;
let servicio: SaludService;

beforeEach(() => {
  repo = new FakeSaludRepository();
  repo.sembrarAve(C, AVE);
  let n = 0;
  servicio = new SaludService(repo, () => `id-${++n}`);
});

describe("SaludService.registrarDiagnostico", () => {
  it("debe registrar diagnóstico sin medicamento y convertir vacíos en null (SAL-01)", async () => {
    const r = await servicio.registrarDiagnostico(C, AVE, {
      enfermedad: "Coriza", sintomas: "", observacion: "", medicamento: null, dosis: "",
      fecha: "2026-11-02T10:00:00.000Z",
    });

    expect(r).toEqual({ success: true, data: { id: "id-1" } });
    expect(repo.diagnosticos).toHaveLength(1);
    expect(repo.diagnosticos[0]).toMatchObject({ estado: "ACTIVO", sintomas: null, observacion: null });
    expect(repo.tratamientos).toHaveLength(0);
    expect(repo.estadoSalud.get(AVE)).toBe("EN_TRATAMIENTO");
    expect(repo.ultimoControl.get(AVE)).toBe("2026-11-02T10:00:00.000Z");
    expect(repo.eventos[0].detalle).toBe("Diagnóstico registrado: Coriza");
  });

  it("debe crear el tratamiento con medicamento y dosis (SAL-02)", async () => {
    await servicio.registrarDiagnostico(C, AVE, {
      enfermedad: "Coriza", medicamento: "X", dosis: "2 ml", observacion: "obs", fecha: "f",
    });

    expect(repo.tratamientos).toHaveLength(1);
    expect(repo.tratamientos[0]).toMatchObject({
      diagnosticoId: "id-1", dosis: "2 ml", observacion: "obs", fecha: "f", medicamento: "X",
    });
  });

  it("debe guardar dosis null si viene vacía con medicamento (SAL-03)", async () => {
    await servicio.registrarDiagnostico(C, AVE, { enfermedad: "E", medicamento: "X", dosis: "", fecha: "f" });

    expect(repo.tratamientos[0].dosis).toBeNull();
  });

  it("debe descartar la dosis si no hay medicamento (SAL-04)", async () => {
    await servicio.registrarDiagnostico(C, AVE, { enfermedad: "E", medicamento: "", dosis: "5", fecha: "f" });

    expect(repo.tratamientos).toHaveLength(0);
  });

  it("debe permitir diagnósticos repetidos sin rechazo (SAL-05)", async () => {
    await servicio.registrarDiagnostico(C, AVE, { enfermedad: "A", fecha: "f1" });
    const r = await servicio.registrarDiagnostico(C, AVE, { enfermedad: "B", fecha: "f2" });

    expect(r.success).toBe(true);
    expect(repo.diagnosticos).toHaveLength(2);
    expect(repo.ultimoControl.get(AVE)).toBe("f2");
  });

  it("debe responder AVE_NO_ENCONTRADA sin escribir nada (SAL-07)", async () => {
    const r = await servicio.registrarDiagnostico(C, "no-existe", { enfermedad: "E", fecha: "f" });

    expect(r).toMatchObject({ success: false, error: "AVE_NO_ENCONTRADA" });
    expect(repo.diagnosticos).toHaveLength(0);
    expect(repo.eventos).toHaveLength(0);
  });

  it("debe rechazar tipos inválidos del cuerpo con VALIDATION_ERROR", async () => {
    for (const body of [null, [], { fecha: "f" }, { enfermedad: "E" }, { enfermedad: "E", fecha: "f", sintomas: {} }, { enfermedad: "E", fecha: "f", dosis: 3 }]) {
      const r = await servicio.registrarDiagnostico(C, AVE, body);
      expect(r).toMatchObject({ success: false, error: "VALIDATION_ERROR" });
    }
    expect(repo.diagnosticos).toHaveLength(0);
  });
});

describe("SaludService.listarHistorial", () => {
  it("debe listar por fecha descendente con medicamento solo donde hay tratamiento (SAL-09)", async () => {
    await servicio.registrarDiagnostico(C, AVE, { enfermedad: "A", fecha: "2026-01-01" });
    await servicio.registrarDiagnostico(C, AVE, { enfermedad: "B", medicamento: "M", dosis: "1", fecha: "2026-03-01" });
    await servicio.registrarDiagnostico(C, AVE, { enfermedad: "C", fecha: "2026-02-01" });

    const r = await servicio.listarHistorial(C, AVE);

    expect(r.success && r.data.historial.map((h) => h.enfermedad)).toEqual(["B", "C", "A"]);
    expect(r.success && r.data.historial[0]).toMatchObject({ medicamento: "M", dosis: "1" });
    expect(r.success && r.data.historial[1]).toMatchObject({ medicamento: null, dosis: null });
  });

  it("debe devolver lista vacía para un ave inexistente (SAL-11)", async () => {
    const r = await servicio.listarHistorial(C, "no-existe");

    expect(r).toEqual({ success: true, data: { historial: [] } });
  });
});
