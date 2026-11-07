import { describe, it, expect, beforeEach } from "vitest";
import { SignJWT } from "jose";
import { createApp } from "../src/app";
import { createAlertasRouter } from "../src/alertas/alertas.routes";
import { AlertasService } from "../src/alertas/alertas.service";
import { FakeAlertasRepository } from "./helpers/fake-alertas.repository";

const jwtSecret = "secret-test-key";
const CRIADERO = "criadero-1";
const BASE = `/api/v1/criaderos/${CRIADERO}/alertas`;
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
let repo: FakeAlertasRepository;

async function llamar(userId: string | null, base = BASE) {
  const headers: Record<string, string> = {};
  if (userId) headers.Authorization = `Bearer ${await token(userId)}`;
  return app.request(base, { method: "GET", headers }, { JWT_SECRET: jwtSecret });
}

describe("HTTP Alertas", () => {
  beforeEach(() => {
    repo = new FakeAlertasRepository();
    const alertasRouter = createAlertasRouter(() => ({
      service: new AlertasService(repo, () => AHORA),
      userOwnsCriadero: async (userId, criaderoId) => userId === "propietario" && criaderoId === CRIADERO,
    }));
    app = createApp({ alertasRouter });
  });

  it("debe rechazar con 401 sin token", async () => {
    expect((await llamar(null)).status).toBe(401);
  });

  it("debe rechazar con 401 un token con firma ajena", async () => {
    const mal = await new SignJWT({}).setProtectedHeader({ alg: "HS256" }).setSubject("propietario")
      .setExpirationTime("1h").sign(new TextEncoder().encode("otro-secreto"));
    const r = await app.request(BASE, { headers: { Authorization: `Bearer ${mal}` } }, { JWT_SECRET: jwtSecret });

    expect(r.status).toBe(401);
  });

  it("debe responder 403 FORBIDDEN si el criadero es ajeno o no existe, sin consultar datos", async () => {
    const ajeno = await llamar("intruso");
    const inexistente = await llamar("propietario", "/api/v1/criaderos/no-existe/alertas");

    expect(ajeno.status).toBe(403);
    expect((await ajeno.json()).error).toBe("FORBIDDEN");
    expect(inexistente.status).toBe(403);
    expect(repo.llamadas).toEqual([]);
  });

  it("debe responder 200 con data.alertas, claves en orden y null presentes", async () => {
    repo.sembrar(CRIADERO, {
      salud: [{ id: "a1", codigo: "K001", dias: 8.2 }],
      jaulas: [{ id: "j1", codigo: "J01", sin_alimentacion: 0, sin_bebida: 1 }],
      huevosHoy: 0,
      totales: { ingresos: 1, egresos: 2 },
    });
    const r = await llamar("propietario");
    const body = await r.json();

    expect(r.status).toBe(200);
    expect(body.success).toBe(true);
    expect(Object.keys(body.data)).toEqual(["alertas"]);
    expect(body.data.alertas.map((a: any) => a.tipo)).toEqual(["SALUD", "JAULA", "PRODUCCION", "FINANZAS"]);
    for (const a of body.data.alertas) {
      expect(Object.keys(a)).toEqual(["tipo", "nivel", "titulo", "mensaje", "entidadId", "accion", "accionDestino"]);
    }
    expect(body.data.alertas[2].entidadId).toBeNull();
    expect(body.data.alertas[3].accionDestino).toBeNull();
  });

  it("debe responder alertas [] cuando no hay ninguna", async () => {
    repo.sembrar(CRIADERO, { huevosHoy: 2 });

    expect(await (await llamar("propietario")).json()).toEqual({ success: true, data: { alertas: [] } });
  });

  it("debe usar el reloj inyectado", async () => {
    await llamar("propietario");

    expect(repo.llamadas.every((l) => l.ahoraIso === "2026-11-05T15:00:00.000Z")).toBe(true);
    expect(repo.llamadas).toHaveLength(4);
  });

  it("debe responder 500 INTERNAL_ERROR si falla el repositorio", async () => {
    repo.huevosHoy = async () => { throw new Error("boom"); };
    const r = await llamar("propietario");

    expect(r.status).toBe(500);
    expect((await r.json()).error).toBe("INTERNAL_ERROR");
  });
});
