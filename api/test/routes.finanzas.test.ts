import { describe, it, expect, beforeEach } from "vitest";
import { SignJWT } from "jose";
import { createApp } from "../src/app";
import { createFinanzasRouter } from "../src/finanzas/finanzas.routes";
import { FinanzasService } from "../src/finanzas/finanzas.service";
import { FakeFinanzasRepository } from "./helpers/fake-finanzas.repository";

const jwtSecret = "secret-test-key";
const CRIADERO = "criadero-1";
const BASE = `/api/v1/criaderos/${CRIADERO}/finanzas`;
const AHORA = "2026-11-03T10:00:00.000Z";

async function token(userId: string) {
  return await new SignJWT({ email: "test@test.com" })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(userId)
    .setIssuedAt()
    .setExpirationTime("1h")
    .sign(new TextEncoder().encode(jwtSecret));
}

let app: ReturnType<typeof createApp>;
let repo: FakeFinanzasRepository;

async function llamar(path: string, userId: string | null, metodo = "GET", cuerpo?: unknown) {
  const headers: Record<string, string> = {};
  if (userId) headers.Authorization = `Bearer ${await token(userId)}`;
  if (cuerpo !== undefined) headers["Content-Type"] = "application/json";

  return app.request(
    path,
    {
      method: metodo,
      headers,
      body: cuerpo === undefined ? undefined : typeof cuerpo === "string" ? cuerpo : JSON.stringify(cuerpo),
    },
    { JWT_SECRET: jwtSecret }
  );
}

describe("HTTP Finanzas", () => {
  beforeEach(() => {
    repo = new FakeFinanzasRepository();
    repo.sembrarMovimiento(CRIADERO, { id: "m1" });
    repo.sembrarVenta(CRIADERO, { id: "b1" });

    let n = 0;
    const finanzasRouter = createFinanzasRouter(() => ({
      service: new FinanzasService(repo, () => `id-${++n}`, () => new Date(AHORA)),
      userOwnsCriadero: async (userId, criaderoId) => userId === "propietario" && criaderoId === CRIADERO,
    }));

    app = createApp({ finanzasRouter });
  });

  const rutas: Array<[string, string, unknown?]> = [
    ["GET", "/resumen"],
    ["GET", "/movimientos"],
    ["POST", "/ingresos", {}],
    ["POST", "/egresos", {}],
    ["GET", "/movimientos/m1"],
    ["PUT", "/movimientos/m1", {}],
    ["GET", "/movimientos/m1/historial"],
    ["GET", "/ventas/b1"],
    ["POST", "/ventas/b1/correccion", {}],
    ["GET", "/consolidado/categorias"],
    ["GET", "/consolidado/mensual"],
  ];

  it("debe rechazar con 401 las 11 rutas sin token", async () => {
    for (const [metodo, ruta, cuerpo] of rutas) {
      expect((await llamar(BASE + ruta, null, metodo, cuerpo)).status, `${metodo} ${ruta}`).toBe(401);
    }
  });

  it("debe responder 403 FORBIDDEN en las 11 rutas si el criadero no es del usuario", async () => {
    for (const [metodo, ruta, cuerpo] of rutas) {
      const r = await llamar(BASE + ruta, "intruso", metodo, cuerpo);

      expect(r.status, `${metodo} ${ruta}`).toBe(403);
      expect((await r.json()).error).toBe("FORBIDDEN");
    }
    expect(repo.operaciones).toEqual([]);
  });

  it("debe responder el resumen con el periodo de la consulta", async () => {
    repo.resumenSembrado = { ingresos: 15.75, egresos: 0.1 };
    const r = await llamar(`${BASE}/resumen?periodo=MES`, "propietario");

    expect(r.status).toBe(200);
    expect(await r.json()).toEqual({ success: true, data: { ingresos: 15.75, egresos: 0.1, utilidad: 15.75 - 0.1 } });
    expect(repo.llamadas[0]).toMatchObject({ periodo: "MES", ahora: AHORA });
  });

  it("debe responder 201 con id en el alta de ingreso y egreso", async () => {
    const i = await llamar(`${BASE}/ingresos`, "propietario", "POST", { categoria: "OTRO", valor: 19.99 });
    const e = await llamar(`${BASE}/egresos`, "propietario", "POST", { valor: 1234567.89 });

    expect(i.status).toBe(201);
    expect(e.status).toBe(201);
    expect((await i.json()).data.id).toBe("id-1");
    expect(repo.movimientos.slice(-2).map((m) => [m.tipo, m.valor])).toEqual([["INGRESO", 19.99], ["EGRESO", 1234567.89]]);
  });

  it("debe responder 400 VALIDATION_ERROR con cuerpo no JSON o importe no numerico", async () => {
    for (const ruta of ["/ingresos", "/egresos"]) {
      expect((await llamar(BASE + ruta, "propietario", "POST", "{no json")).status).toBe(400);
      const r = await llamar(BASE + ruta, "propietario", "POST", { valor: "abc" });
      expect(r.status).toBe(400);
      expect((await r.json()).error).toBe("VALIDATION_ERROR");
    }
    expect((await llamar(`${BASE}/movimientos/m1`, "propietario", "PUT", "{no json")).status).toBe(400);
    expect((await llamar(`${BASE}/ventas/b1/correccion`, "propietario", "POST", "{no json")).status).toBe(400);
  });

  it("debe responder 404 MOVIMIENTO_NO_ENCONTRADO y VENTA_NO_ENCONTRADA", async () => {
    const m = await llamar(`${BASE}/movimientos/nada`, "propietario");
    const v = await llamar(`${BASE}/ventas/nada`, "propietario");
    const p = await llamar(`${BASE}/movimientos/nada`, "propietario", "PUT", { valor: 1 });
    const c = await llamar(`${BASE}/ventas/nada/correccion`, "propietario", "POST", { valorVenta: 1 });

    expect([m.status, v.status, p.status, c.status]).toEqual([404, 404, 404, 404]);
    expect((await m.json()).error).toBe("MOVIMIENTO_NO_ENCONTRADO");
    expect((await v.json()).error).toBe("VENTA_NO_ENCONTRADA");
    expect((await c.json()).error).toBe("VENTA_NO_ENCONTRADA");
  });

  it("debe responder el movimiento con 200", async () => {
    const r = await llamar(`${BASE}/movimientos/m1`, "propietario");

    expect(r.status).toBe(200);
    expect((await r.json()).data.movimiento.id).toBe("m1");
  });

  it("debe responder 409 MOVIMIENTO_AUTOMATICO_NO_EDITABLE y 400 VALOR_INVALIDO en el PUT", async () => {
    repo.sembrarMovimiento(CRIADERO, { id: "auto", origenTipo: "VENTA_AVE" });

    const a = await llamar(`${BASE}/movimientos/auto`, "propietario", "PUT", { valor: 5 });
    const v = await llamar(`${BASE}/movimientos/m1`, "propietario", "PUT", { valor: 0 });

    expect(a.status).toBe(409);
    expect((await a.json()).error).toBe("MOVIMIENTO_AUTOMATICO_NO_EDITABLE");
    expect(v.status).toBe(400);
    expect((await v.json()).error).toBe("VALOR_INVALIDO");
  });

  it("debe actualizar un movimiento manual y listar su historial", async () => {
    const p = await llamar(`${BASE}/movimientos/m1`, "propietario", "PUT", { tipo: "EGRESO", categoria: "ALIMENTO", valor: 12.5, detalle: "x" });
    const h = await llamar(`${BASE}/movimientos/m1/historial`, "propietario");

    expect(p.status).toBe(200);
    expect(await p.json()).toEqual({ success: true, data: { id: "m1" } });
    expect((await h.json()).data.historial).toHaveLength(1);
  });

  it("debe responder 400 VALOR_INVALIDO y 200 en la correccion de venta", async () => {
    const mal = await llamar(`${BASE}/ventas/b1/correccion`, "propietario", "POST", { valorVenta: -1 });
    const bien = await llamar(`${BASE}/ventas/b1/correccion`, "propietario", "POST", { valorVenta: "120,5", valorEnvio: null });

    expect(mal.status).toBe(400);
    expect((await mal.json()).error).toBe("VALOR_INVALIDO");
    expect(bien.status).toBe(200);
    expect(await bien.json()).toEqual({ success: true, data: { bajaId: "b1" } });
    expect(repo.bajas[0]).toMatchObject({ valorVenta: 120.5, valorEnvio: 0 });
  });

  it("debe responder las ventas y los consolidados", async () => {
    repo.categoriasSembradas = [{ tipo: "INGRESO", categoria: "OTRO", cantidad: 2, total: 4.75 }];
    repo.mesesSembrados = [{ periodo: "2026-10", ingresos: 1, egresos: 0 }];

    const v = await llamar(`${BASE}/ventas/b1`, "propietario");
    const c = await llamar(`${BASE}/consolidado/categorias?periodo=ANIO`, "propietario");
    const m = await llamar(`${BASE}/consolidado/mensual?limite=3`, "propietario");

    expect((await v.json()).data.venta.id).toBe("b1");
    expect((await c.json()).data.categorias).toHaveLength(1);
    expect((await m.json()).data.meses).toHaveLength(1);
    expect(repo.llamadas.find((l) => l.metodo === "consolidadoMensual")!.limite).toBe(3);
    expect(repo.llamadas.find((l) => l.metodo === "consolidadoCategorias")!.periodo).toBe("ANIO");
  });
});
