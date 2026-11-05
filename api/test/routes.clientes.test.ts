import { describe, it, expect, beforeEach } from "vitest";
import { SignJWT } from "jose";
import { createApp } from "../src/app";
import { createClientesRouter } from "../src/clientes/clientes.routes";
import { ClientesService } from "../src/clientes/clientes.service";
import { FakeClientesRepository } from "./helpers/fake-clientes.repository";

const jwtSecret = "secret-test-key";
const CRIADERO = "criadero-1";
const BASE = `/api/v1/criaderos/${CRIADERO}/clientes`;

async function token(userId: string) {
  return await new SignJWT({ email: "test@test.com" })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(userId)
    .setIssuedAt()
    .setExpirationTime("1h")
    .sign(new TextEncoder().encode(jwtSecret));
}

let app: ReturnType<typeof createApp>;
let repo: FakeClientesRepository;

async function llamar(path: string, userId: string | null) {
  const headers: Record<string, string> = {};
  if (userId) headers.Authorization = `Bearer ${await token(userId)}`;
  return app.request(path, { method: "GET", headers }, { JWT_SECRET: jwtSecret });
}

describe("HTTP Clientes", () => {
  beforeEach(() => {
    repo = new FakeClientesRepository();
    const clientesRouter = createClientesRouter(() => ({
      service: new ClientesService(repo),
      userOwnsCriadero: async (userId, criaderoId) => userId === "propietario" && criaderoId === CRIADERO,
    }));
    app = createApp({ clientesRouter });
  });

  const rutas = ["", "/0991234567", "/0991234567/compras"];

  it("debe rechazar con 401 las 3 rutas sin token", async () => {
    for (const ruta of rutas) {
      expect((await llamar(BASE + ruta, null)).status, ruta).toBe(401);
    }
  });

  it("debe responder 403 FORBIDDEN en las 3 rutas si el criadero no es del usuario, sin consultar datos", async () => {
    for (const ruta of rutas) {
      const r = await llamar(BASE + ruta, "intruso");

      expect(r.status, ruta).toBe(403);
      expect((await r.json()).error).toBe("FORBIDDEN");
    }
    expect(repo.llamadas).toEqual([]);
  });

  it("debe responder 200 con clientes en camelCase", async () => {
    repo.sembrarClientes(CRIADERO, [
      { celular: "099", nombre: "Ana", ciudad: "", totalCompras: 1, totalVentas: 0, totalEnvios: 0, ultimaCompra: "2026-11-01T00:00:00.000Z" },
    ]);
    const r = await llamar(BASE, "propietario");

    expect(r.status).toBe(200);
    expect(await r.json()).toEqual({
      success: true,
      data: {
        clientes: [
          { celular: "099", nombre: "Ana", ciudad: "", totalCompras: 1, totalVentas: 0, totalEnvios: 0, ultimaCompra: "2026-11-01T00:00:00.000Z" },
        ],
      },
    });
  });

  it("debe responder 200 con cliente null (no 404) si el celular no existe", async () => {
    const r = await llamar(`${BASE}/0000`, "propietario");

    expect(r.status).toBe(200);
    expect(await r.json()).toEqual({ success: true, data: { cliente: null } });
  });

  it("debe responder 200 con compras vacias si el celular no existe", async () => {
    const r = await llamar(`${BASE}/0000/compras`, "propietario");

    expect(r.status).toBe(200);
    expect(await r.json()).toEqual({ success: true, data: { compras: [] } });
  });

  it("debe entregar intacto al servicio el celular codificado con +, espacios, % y / (CLI-12)", async () => {
    const celulares = ["+593 99 123 4567", "50%", "a/b", "+593%2099", "  x  "];

    for (const celular of celulares) {
      repo.llamadas = [];
      await llamar(`${BASE}/${encodeURIComponent(celular)}`, "propietario");
      await llamar(`${BASE}/${encodeURIComponent(celular)}/compras`, "propietario");

      expect(repo.llamadas.map((l) => l.celular), celular).toEqual([celular, celular]);
    }
  });

  it("debe conservar un + literal sin codificar en la ruta", async () => {
    await llamar(`${BASE}/+593`, "propietario");

    expect(repo.llamadas[0].celular).toBe("+593");
  });
});
