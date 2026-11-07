import { describe, it, expect, beforeEach } from "vitest";
import { SignJWT } from "jose";
import { createApp } from "../src/app";
import { createInicioRouter } from "../src/inicio/inicio.routes";
import { InicioService } from "../src/inicio/inicio.service";
import { FakeInicioRepository } from "./helpers/fake-inicio.repository";

const jwtSecret = "secret-test-key";
const CRIADERO = "criadero-1";
const BASE = `/api/v1/criaderos/${CRIADERO}/dashboard`;
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
let repo: FakeInicioRepository;

async function llamar(userId: string | null, base = BASE) {
  const headers: Record<string, string> = {};
  if (userId) headers.Authorization = `Bearer ${await token(userId)}`;
  return app.request(base, { method: "GET", headers }, { JWT_SECRET: jwtSecret });
}

describe("HTTP Inicio (dashboard)", () => {
  beforeEach(() => {
    repo = new FakeInicioRepository();
    const inicioRouter = createInicioRouter(() => ({
      service: new InicioService(repo, () => AHORA),
      userOwnsCriadero: async (userId, criaderoId) => userId === "propietario" && criaderoId === CRIADERO,
    }));
    app = createApp({ inicioRouter });
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
    const inexistente = await llamar("propietario", "/api/v1/criaderos/no-existe/dashboard");

    expect(ajeno.status).toBe(403);
    expect((await ajeno.json()).error).toBe("FORBIDDEN");
    expect(inexistente.status).toBe(403);
    expect(repo.llamadas).toEqual([]);
  });

  it("debe responder 200 con data = objeto del dashboard, claves en orden y null presentes", async () => {
    repo.sembrar(CRIADERO, {
      resumen: { activas: 2, total: 1, ocupadas: 1, ingresos: 5, egresos: 2 },
      avesPorRaza: [{ raza: "Kikiris", cantidad: 2, porcentaje: 100 }],
    });
    const r = await llamar("propietario");
    const body = await r.json();

    expect(r.status).toBe(200);
    expect(body.success).toBe(true);
    expect(Object.keys(body)).toEqual(["success", "data"]);
    expect(Object.keys(body.data)).toEqual([
      "aves", "salud", "finanzas", "jaulas", "ocupacionJaulas", "huevos", "mejorPonedora", "horaPico",
      "produccionSemana", "avesPorRaza", "totalRazas", "promedioHuevos",
    ]);
    expect(body.data.aves.activas).toBe(2);
    expect(body.data.ocupacionJaulas).toEqual({ porcentaje: 100 });
    expect(body.data.finanzas).toEqual({ ingresos: 5, egresos: 2, utilidad: 3 });
    expect(body.data.totalRazas).toBe(1);
    expect(body.data.mejorPonedora).toBeNull();
    expect(body.data.horaPico).toBeNull();
  });

  it("debe usar el reloj inyectado y consultar 5 veces", async () => {
    await llamar("propietario");

    expect(repo.llamadas).toHaveLength(5);
    expect(repo.llamadas.filter((l) => l.ahoraIso).every((l) => l.ahoraIso === "2026-11-05T15:00:00.000Z")).toBe(true);
  });

  it("debe responder 500 INTERNAL_ERROR si falla el repositorio", async () => {
    repo.horaPico = async () => { throw new Error("boom"); };
    const r = await llamar("propietario");

    expect(r.status).toBe(500);
    expect((await r.json()).error).toBe("INTERNAL_ERROR");
  });
});
