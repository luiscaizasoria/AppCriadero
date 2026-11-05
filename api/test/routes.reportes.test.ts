import { describe, it, expect, beforeEach } from "vitest";
import { SignJWT } from "jose";
import { createApp } from "../src/app";
import { createReportesRouter } from "../src/reportes/reportes.routes";
import { ReportesService } from "../src/reportes/reportes.service";
import { FakeReportesRepository } from "./helpers/fake-reportes.repository";

const jwtSecret = "secret-test-key";
const CRIADERO = "criadero-1";
const BASE = `/api/v1/criaderos/${CRIADERO}/reportes`;
const AHORA = new Date("2026-11-05T15:00:00.000Z");

async function token(userId: string) {
  return await new SignJWT({ email: "test@test.com" })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(userId)
    .setIssuedAt()
    .setExpirationTime("1h")
    .sign(new TextEncoder().encode(jwtSecret));
}

let app: ReturnType<typeof createApp>;
let repo: FakeReportesRepository;

async function llamar(path: string, userId: string | null, base = BASE) {
  const headers: Record<string, string> = {};
  if (userId) headers.Authorization = `Bearer ${await token(userId)}`;
  return app.request(base + path, { method: "GET", headers }, { JWT_SECRET: jwtSecret });
}

const RUTAS = [
  "/aves", "/salud", "/produccion", "/finanzas",
  "/exportaciones/aves", "/exportaciones/ventas", "/exportaciones/clientes",
  "/exportaciones/finanzas", "/exportaciones/huevos", "/exportaciones/jaulas",
];

describe("HTTP Reportes", () => {
  beforeEach(() => {
    repo = new FakeReportesRepository();
    const reportesRouter = createReportesRouter(() => ({
      service: new ReportesService(repo, () => AHORA),
      userOwnsCriadero: async (userId, criaderoId) => userId === "propietario" && criaderoId === CRIADERO,
    }));
    app = createApp({ reportesRouter });
  });

  it("debe rechazar con 401 los 10 endpoints sin token", async () => {
    for (const ruta of RUTAS) {
      expect((await llamar(ruta, null)).status, ruta).toBe(401);
    }
  });

  it("debe rechazar con 401 INVALID_TOKEN un token con firma ajena", async () => {
    const mal = await new SignJWT({}).setProtectedHeader({ alg: "HS256" }).setSubject("propietario")
      .setExpirationTime("1h").sign(new TextEncoder().encode("otro-secreto"));
    const r = await app.request(`${BASE}/aves`, { headers: { Authorization: `Bearer ${mal}` } }, { JWT_SECRET: jwtSecret });

    expect(r.status).toBe(401);
  });

  it("debe responder 403 FORBIDDEN en los 10 endpoints si el criadero no es del usuario, sin consultar datos", async () => {
    for (const ruta of RUTAS) {
      const r = await llamar(ruta, "intruso");

      expect(r.status, ruta).toBe(403);
      expect((await r.json()).error).toBe("FORBIDDEN");
    }
    expect(repo.llamadas).toEqual([]);
  });

  it("debe responder 403 si el criadero no existe (REP-22)", async () => {
    for (const ruta of RUTAS) {
      expect((await llamar(ruta, "propietario", "/api/v1/criaderos/no-existe/reportes")).status, ruta).toBe(403);
    }
    expect(repo.llamadas).toEqual([]);
  });

  it("debe responder 200 con la forma de los cuatro resumenes", async () => {
    repo.sembrar(CRIADERO, {
      aves: { activas: 3, vendidas: 2, fallecidas: 1 },
      estadoSalud: { tratamiento: 1, enfermas: 2 },
      enfermedades: [{ enfermedad: "Coriza", cantidad: 4 }],
      huevos: { hoy: 2, mes: 5 },
      mejor: { codigo: "K001", cantidad: 5 },
      finanzas: { ingresos: 10.5, egresos: 4 },
    });

    expect(await (await llamar("/aves", "propietario")).json()).toEqual({
      success: true, data: { activas: 3, vendidas: 2, fallecidas: 1 },
    });
    expect(await (await llamar("/salud", "propietario")).json()).toEqual({
      success: true, data: { estado: { tratamiento: 1, enfermas: 2 }, enfermedades: [{ enfermedad: "Coriza", cantidad: 4 }] },
    });
    expect(await (await llamar("/produccion", "propietario")).json()).toEqual({
      success: true, data: { huevos: { hoy: 2, mes: 5 }, mejor: { codigo: "K001", cantidad: 5 } },
    });
    expect(await (await llamar("/finanzas", "propietario")).json()).toEqual({
      success: true, data: { ingresos: 10.5, egresos: 4, utilidad: 6.5 },
    });
  });

  it("debe responder mejor null y filas vacias con 200 (REP-01, REP-21)", async () => {
    expect(await (await llamar("/produccion", "propietario")).json()).toEqual({
      success: true, data: { huevos: { hoy: 0, mes: 0 }, mejor: null },
    });
    for (const ruta of RUTAS.filter((r) => r.startsWith("/exportaciones"))) {
      const r = await llamar(ruta, "propietario");

      expect(r.status, ruta).toBe(200);
      expect(await r.json()).toEqual({ success: true, data: { filas: [] } });
    }
  });

  it("debe conservar claves PascalCase y su orden en el JSON de las exportaciones y null real", async () => {
    repo.sembrar(CRIADERO, {
      exportFinanzas: [
        { Fecha: "2026-11-01T00:00:00.000Z", Tipo: "INGRESO", Categoria: null, Valor: 12.5, Detalle: null, Ave: "K001", Origen: "VENTA_AVE", OrigenId: "u-1" },
      ],
      exportClientes: [
        { Celular: "099", Nombre: null, Ciudad: null, Compras: 1, TotalAves: 0, TotalEnvios: 0, UltimaCompra: "2026-11-01T00:00:00.000Z" },
      ],
    });
    const fin = await (await llamar("/exportaciones/finanzas", "propietario")).json();
    const cli = await (await llamar("/exportaciones/clientes", "propietario")).json();

    expect(Object.keys(fin.data.filas[0])).toEqual(["Fecha", "Tipo", "Categoria", "Valor", "Detalle", "Ave", "Origen", "OrigenId"]);
    expect(fin.data.filas[0].Valor).toBe(12.5);
    expect(fin.data.filas[0].Categoria).toBeNull();
    expect(Object.keys(cli.data.filas[0])).toEqual(["Celular", "Nombre", "Ciudad", "Compras", "TotalAves", "TotalEnvios", "UltimaCompra"]);
    expect(cli.data.filas[0].Nombre).toBeNull();
  });

  it("debe usar el reloj inyectado en produccion", async () => {
    await llamar("/produccion", "propietario");

    expect(repo.llamadas.find((l) => l.metodo === "huevosHoyMes")?.ahoraIso).toBe("2026-11-05T15:00:00.000Z");
  });

  it("debe responder 500 INTERNAL_ERROR si falla el repositorio", async () => {
    repo.contarAves = async () => { throw new Error("boom"); };
    const r = await llamar("/aves", "propietario");

    expect(r.status).toBe(500);
    expect((await r.json()).error).toBe("INTERNAL_ERROR");
  });
});
