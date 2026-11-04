import { describe, it, expect, beforeEach } from "vitest";
import { FinanzasService, numeroNoNegativo } from "../src/finanzas/finanzas.service";
import { FakeFinanzasRepository } from "./helpers/fake-finanzas.repository";

const C = "criadero-1";
const AHORA = "2026-11-03T10:00:00.000Z";

let repo: FakeFinanzasRepository;
let service: FinanzasService;

function datos<T>(r: { success: boolean; data?: T }): T {
  if (!r.success) throw new Error("se esperaba exito");
  return r.data as T;
}

beforeEach(() => {
  repo = new FakeFinanzasRepository();
  let n = 0;
  service = new FinanzasService(repo, () => `id-${++n}`, () => new Date(AHORA));
});

describe("FinanzasService - lecturas", () => {
  it("debe devolver ceros sin movimientos y usar TODO por defecto (FIN-01)", async () => {
    const r = datos(await service.resumen(C));

    expect(r).toEqual({ ingresos: 0, egresos: 0, utilidad: 0 });
    expect(repo.llamadas[0]).toMatchObject({ periodo: "TODO", ahora: AHORA });
  });

  it("debe calcular la utilidad en JS sin redondear (FIN-02, FIN-03)", async () => {
    repo.resumenSembrado = { ingresos: 0.1 + 0.2, egresos: 0.1 };
    const a = datos(await service.resumen(C, "TODO"));

    expect(a.ingresos).toBe(0.30000000000000004);
    expect(a.utilidad).toBe(0.30000000000000004 - 0.1);

    repo.resumenSembrado = { ingresos: 15.75, egresos: 1234567.89 };
    expect(datos(await service.resumen(C)).utilidad).toBe(15.75 - 1234567.89);
  });

  it("debe pasar el periodo y el reloj inyectado al repositorio", async () => {
    await service.resumen(C, "MES");
    await service.consolidadoCategorias(C, "ANIO");

    expect(repo.llamadas).toEqual([
      { metodo: "resumen", periodo: "MES", ahora: AHORA },
      { metodo: "consolidadoCategorias", periodo: "ANIO", ahora: AHORA },
    ]);
  });

  it("debe usar 12 como limite cuando falta, es 0 o no es numero (FIN-39)", async () => {
    for (const limite of [undefined, "0", "x", "", null, 0]) {
      await service.consolidadoMensual(C, limite);
    }
    await service.consolidadoMensual(C, "5");

    expect(repo.llamadas.map((l) => l.limite)).toEqual([12, 12, 12, 12, 12, 12, 5]);
  });

  it("debe responder MOVIMIENTO_NO_ENCONTRADO y VENTA_NO_ENCONTRADA ante ids inexistentes (FIN-33, FIN-34)", async () => {
    expect(await service.obtenerMovimiento(C, "nada")).toMatchObject({ success: false, error: "MOVIMIENTO_NO_ENCONTRADO" });
    repo.sembrarVenta(C, { id: "b-muerte" }, "MUERTE");
    expect(await service.obtenerVenta(C, "b-muerte")).toMatchObject({ success: false, error: "VENTA_NO_ENCONTRADA" });
  });

  it("debe devolver historial vacio para un movimiento inexistente (FIN-32)", async () => {
    expect(datos(await service.historial(C, "nada"))).toEqual({ historial: [] });
  });
});

describe("FinanzasService - alta manual", () => {
  it("debe aplicar los valores por defecto de V1 y no escribir historial (FIN-11)", async () => {
    const r = datos(await service.registrarManual(C, "INGRESO", { categoria: "", valor: 12.5, detalle: "" }));

    expect(r).toEqual({ id: "id-1" });
    expect(repo.movimientos[0]).toMatchObject({
      tipo: "INGRESO", categoria: "OTRO", fecha: AHORA, valor: 12.5, detalle: null, origenTipo: "MANUAL", aveId: null, origenId: null,
    });
    expect(repo.historiales).toHaveLength(0);
  });

  it("debe guardar sin validar el importe: 0 y negativo (FIN-12)", async () => {
    await service.registrarManual(C, "EGRESO", { valor: 0 });
    await service.registrarManual(C, "EGRESO", { valor: -3.25 });

    expect(repo.movimientos.map((m) => m.valor)).toEqual([0, -3.25]);
  });

  it("debe conservar los importes decimales tal cual (FIN-04)", async () => {
    await service.registrarManual(C, "INGRESO", { valor: 19.99 });
    await service.registrarManual(C, "EGRESO", { valor: 1234567.89 });

    expect(repo.movimientos.map((m) => m.valor)).toEqual([19.99, 1234567.89]);
  });

  it("debe rechazar con VALIDATION_ERROR solo lo que D1 no puede guardar (FIN-13)", async () => {
    for (const body of [null, [], "x", {}, { valor: null }, { valor: undefined }, { valor: "1,5" }, { valor: "abc" }, { valor: 1, detalle: 5 }, { valor: 1, fecha: {} }]) {
      expect(await service.registrarManual(C, "INGRESO", body)).toMatchObject({ success: false, error: "VALIDATION_ERROR" });
    }
    expect(repo.movimientos).toHaveLength(0);
  });
});

describe("FinanzasService - actualizarManual", () => {
  beforeEach(() => {
    repo.sembrarMovimiento(C, { id: "m1", tipo: "INGRESO", categoria: "OTRO", fecha: "2026-10-01T00:00:00.000Z", valor: 10, detalle: "a" });
  });

  it("debe escribir EDICION_MANUAL antes del UPDATE con los datos de V1 (FIN-16)", async () => {
    const r = await service.actualizarManual(C, "m1", {
      tipo: "EGRESO", categoria: "ALIMENTO", valor: 12.5, detalle: " x ", fecha: "2026-10-05T00:00:00.000Z",
    });

    expect(r).toEqual({ success: true, data: { id: "m1" } });
    expect(repo.operaciones).toEqual(["HISTORIAL EDICION_MANUAL", "UPDATE m1"]);
    expect(repo.historiales[0]).toMatchObject({
      movimientoId: "m1", fecha: AHORA, accion: "EDICION_MANUAL",
      tipoAnterior: "INGRESO", tipoNuevo: "EGRESO", categoriaAnterior: "OTRO", categoriaNueva: "ALIMENTO",
      fechaMovimientoAnterior: "2026-10-01T00:00:00.000Z", fechaMovimientoNueva: "2026-10-05T00:00:00.000Z",
      valorAnterior: 10, valorNuevo: 12.5, detalleAnterior: "a", detalleNuevo: "x",
      origenTipo: "MANUAL", origenId: null,
    });
    expect(repo.movimientos[0]).toMatchObject({ tipo: "EGRESO", categoria: "ALIMENTO", valor: 12.5, detalle: "x", origenTipo: "MANUAL" });
  });

  it("debe escribir historial aunque no cambie nada (FIN-17)", async () => {
    await service.actualizarManual(C, "m1", { tipo: "INGRESO", categoria: "OTRO", valor: 10, detalle: "a", fecha: "2026-10-01T00:00:00.000Z" });

    expect(repo.historiales).toHaveLength(1);
  });

  it("debe normalizar tipo, categoria, detalle y fecha ausentes (FIN-18)", async () => {
    await service.actualizarManual(C, "m1", { tipo: "otro", categoria: "", valor: 1, detalle: "  " });

    expect(repo.movimientos[0]).toMatchObject({
      tipo: "INGRESO", categoria: "OTRO", detalle: null, fecha: "2026-10-01T00:00:00.000Z",
    });
  });

  it("debe editar un movimiento con origen_tipo NULL (FIN-19)", async () => {
    repo.sembrarMovimiento(C, { id: "m2", origenTipo: null });

    expect((await service.actualizarManual(C, "m2", { valor: 1 })).success).toBe(true);
  });

  it("debe rechazar los movimientos automaticos sin escribir nada (FIN-20)", async () => {
    repo.sembrarMovimiento(C, { id: "v1", origenTipo: "VENTA_AVE", origenId: "b1", categoria: "VENTA_AVE" });
    repo.sembrarMovimiento(C, { id: "v2", origenTipo: "VENTA_AVE", origenId: "b1", categoria: "ENVIO_AVE" });

    for (const id of ["v1", "v2"]) {
      expect(await service.actualizarManual(C, id, { valor: 5 })).toMatchObject({
        success: false, error: "MOVIMIENTO_AUTOMATICO_NO_EDITABLE",
      });
    }
    expect(repo.operaciones).toEqual([]);
  });

  it("debe evaluar en el orden de V1: no encontrado, automatico, valor (FIN-21)", async () => {
    expect(await service.actualizarManual(C, "nada", { valor: 0 })).toMatchObject({ error: "MOVIMIENTO_NO_ENCONTRADO" });

    repo.sembrarMovimiento(C, { id: "v1", origenTipo: "VENTA_AVE" });
    expect(await service.actualizarManual(C, "v1", { valor: 0 })).toMatchObject({ error: "MOVIMIENTO_AUTOMATICO_NO_EDITABLE" });

    for (const valor of [0, "abc", null, undefined, -1, "12,5"]) {
      expect(await service.actualizarManual(C, "m1", { valor })).toMatchObject({ error: "VALOR_INVALIDO" });
    }
    expect(repo.operaciones).toEqual([]);
  });

  it("debe responder VALIDATION_ERROR si detalle no es texto, sin escribir", async () => {
    expect(await service.actualizarManual(C, "m1", { valor: 1, detalle: 5 })).toMatchObject({ error: "VALIDATION_ERROR" });
    expect(await service.actualizarManual(C, "m1", "x")).toMatchObject({ error: "VALIDATION_ERROR" });
    expect(repo.operaciones).toEqual([]);
  });

  it("debe propagar el fallo del batch sin otras escrituras", async () => {
    repo.fallarEn = "actualizarManual";

    await expect(service.actualizarManual(C, "m1", { valor: 1 })).rejects.toThrow("fallo simulado");
    expect(repo.operaciones).toEqual([]);
  });
});

describe("FinanzasService - corregirVenta", () => {
  beforeEach(() => {
    repo.sembrarVenta(C, { id: "b1", aveId: "ave-1", fecha: "2026-10-31T12:00:00.000Z" });
    repo.sembrarMovimiento(C, { id: "mv", origenTipo: "VENTA_AVE", origenId: "b1", categoria: "VENTA_AVE", tipo: "INGRESO", valor: 100, detalle: "Venta de ave ave-1 a Ana", fecha: "2026-10-31T12:00:00.000Z", aveId: "ave-1" });
    repo.sembrarMovimiento(C, { id: "me", origenTipo: "VENTA_AVE", origenId: "b1", categoria: "ENVIO_AVE", tipo: "INGRESO", valor: 5, detalle: "Envío de venta de ave ave-1 a Ana", fecha: "2026-10-31T12:00:00.000Z", aveId: "ave-1" });
  });

  it("debe corregir baja y ambos movimientos con el historial en el orden de V1 (FIN-23)", async () => {
    const r = await service.corregirVenta(C, "b1", { valorVenta: "120,50", valorEnvio: "" });

    expect(r).toEqual({ success: true, data: { bajaId: "b1" } });
    expect(repo.operaciones).toEqual([
      "UPDATE bajas_ave", "HISTORIAL CORRECCION_VENTA", "UPDATE VENTA_AVE", "HISTORIAL CORRECCION_ENVIO", "UPDATE ENVIO_AVE",
    ]);
    expect(repo.bajas[0]).toMatchObject({ valorVenta: 120.5, valorEnvio: 0 });
    expect(repo.movimientos.find((m) => m.id === "mv")).toMatchObject({
      valor: 120.5, detalle: "Venta de ave ave-1", tipo: "INGRESO", fecha: "2026-10-31T12:00:00.000Z",
    });
    expect(repo.movimientos.find((m) => m.id === "me")).toMatchObject({
      valor: 0, detalle: "Envío asociado a venta de ave ave-1",
    });
    expect(repo.historiales[0]).toMatchObject({
      movimientoId: "mv", accion: "CORRECCION_VENTA", valorAnterior: 100, valorNuevo: 120.5,
      detalleAnterior: "Venta de ave ave-1 a Ana", detalleNuevo: "Venta de ave ave-1",
      categoriaAnterior: "VENTA_AVE", categoriaNueva: "VENTA_AVE", origenTipo: "VENTA_AVE", origenId: "b1",
    });
    expect(repo.historiales[1]).toMatchObject({ movimientoId: "me", accion: "CORRECCION_ENVIO" });
  });

  it("debe crear el movimiento de envio ausente y escribir el historial despues del INSERT (FIN-24, FIN-25)", async () => {
    repo.movimientos = repo.movimientos.filter((m) => m.id !== "me");

    await service.corregirVenta(C, "b1", { valorVenta: 10, valorEnvio: 0 });

    expect(repo.operaciones).toEqual([
      "UPDATE bajas_ave", "HISTORIAL CORRECCION_VENTA", "UPDATE VENTA_AVE", "INSERT ENVIO_AVE", "HISTORIAL CREACION_POR_CORRECCION",
    ]);
    const creado = repo.movimientos.find((m) => m.categoria === "ENVIO_AVE")!;
    expect(creado).toMatchObject({ tipo: "INGRESO", valor: 0, origenTipo: "VENTA_AVE", origenId: "b1", aveId: "ave-1" });
    expect(repo.historiales[1]).toMatchObject({
      movimientoId: creado.id, accion: "CREACION_POR_CORRECCION",
      tipoAnterior: null, categoriaAnterior: null, fechaMovimientoAnterior: null, valorAnterior: null, detalleAnterior: null,
      tipoNuevo: "INGRESO", categoriaNueva: "ENVIO_AVE", valorNuevo: 0, origenTipo: "VENTA_AVE", origenId: "b1",
    });
  });

  it("debe conservar los decimales sin redondear (FIN-26)", async () => {
    await service.corregirVenta(C, "b1", { valorVenta: 19.99, valorEnvio: 0.1 });

    expect(repo.bajas[0]).toMatchObject({ valorVenta: 19.99, valorEnvio: 0.1 });
    expect(repo.movimientos.map((m) => m.valor).sort()).toEqual([0.1, 19.99]);
  });

  it("debe responder VALOR_INVALIDO antes de leer la baja (FIN-27)", async () => {
    for (const body of [{ valorVenta: -1 }, { valorVenta: "abc" }, { valorVenta: 1, valorEnvio: -0.5 }, { valorVenta: "1,2,3" }]) {
      expect(await service.corregirVenta(C, "inexistente", body)).toMatchObject({ error: "VALOR_INVALIDO" });
    }
    expect(repo.operaciones).toEqual([]);
  });

  it("debe responder VENTA_NO_ENCONTRADA para bajas inexistentes o de otro tipo (FIN-28)", async () => {
    repo.sembrarVenta(C, { id: "b-muerte" }, "MUERTE");

    for (const id of ["nada", "b-muerte"]) {
      expect(await service.corregirVenta(C, id, { valorVenta: 1 })).toMatchObject({ error: "VENTA_NO_ENCONTRADA" });
    }
    expect(repo.operaciones).toEqual([]);
  });

  it("debe actualizar solo el movimiento de menor orden si hay duplicados (FIN-29)", async () => {
    repo.sembrarMovimiento(C, { id: "mv-dup", origenTipo: "VENTA_AVE", origenId: "b1", categoria: "VENTA_AVE", valor: 1 });

    await service.corregirVenta(C, "b1", { valorVenta: 77 });

    expect(repo.movimientos.find((m) => m.id === "mv")!.valor).toBe(77);
    expect(repo.movimientos.find((m) => m.id === "mv-dup")!.valor).toBe(1);
  });

  it("debe tomar null y ausente como 0 (FIN-30)", async () => {
    await service.corregirVenta(C, "b1", { valorVenta: null });

    expect(repo.bajas[0]).toMatchObject({ valorVenta: 0, valorEnvio: 0 });
  });

  it("debe aplicar numeroNoNegativo como V1", () => {
    expect(numeroNoNegativo(undefined)).toBe(0);
    expect(numeroNoNegativo("  ")).toBe(0);
    expect(numeroNoNegativo("12,5")).toBe(12.5);
    expect(numeroNoNegativo(0)).toBe(0);
    expect(numeroNoNegativo(-0.01)).toBeNull();
    expect(numeroNoNegativo("abc")).toBeNull();
    expect(numeroNoNegativo("Infinity")).toBeNull();
  });
});
