import { describe, it, expect, beforeEach } from "vitest";
import { SignJWT } from "jose";
import { createApp } from "../src/app";
import { createSaludRouter } from "../src/salud/salud.routes";
import { SaludService } from "../src/salud/salud.service";
import { createAvesRouter } from "../src/aves/aves.routes";
import { AveService } from "../src/aves/aves.service";
import { FakeAveRepository } from "./helpers/fake-aves.repository";
import { FakeSaludRepository } from "./helpers/fake-salud.repository";

const jwtSecret = "secret-test-key";
const CRIADERO = "criadero-1";
const BASE = `/api/v1/criaderos/${CRIADERO}/aves/ave-1`;

async function token(userId: string) {
  return await new SignJWT({ email: "test@test.com" })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(userId)
    .setIssuedAt()
    .setExpirationTime("1h")
    .sign(new TextEncoder().encode(jwtSecret));
}

let app: ReturnType<typeof createApp>;
let repository: FakeSaludRepository;

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

describe("HTTP Salud", () => {
  beforeEach(() => {
    repository = new FakeSaludRepository();
    repository.sembrarAve(CRIADERO, "ave-1");

    let n = 0;
    const duenio = async (userId: string, criaderoId: string) =>
      userId === "propietario" && criaderoId === CRIADERO;

    const saludRouter = createSaludRouter(() => ({
      service: new SaludService(repository, () => `id-${++n}`),
      userOwnsCriadero: duenio,
    }));

    // Router de aves real (con fake) montado a la vez: comprueba que las rutas no chocan.
    const avesRouter = createAvesRouter(() => ({
      service: new AveService(new FakeAveRepository()),
      userOwnsCriadero: duenio,
    }));

    app = createApp({ saludRouter, avesRouter });
  });

  it("debe rechazar las peticiones sin token", async () => {
    const r = await llamar(`${BASE}/diagnosticos`, null, "POST", { enfermedad: "E", fecha: "f" });

    expect(r.status).toBe(401);
  });

  it("debe responder 403 FORBIDDEN si el criadero no es del usuario", async () => {
    const r = await llamar(`${BASE}/salud`, "intruso");

    expect(r.status).toBe(403);
    expect((await r.json()).error).toBe("FORBIDDEN");
  });

  it("debe responder 201 con el id del diagnóstico", async () => {
    const r = await llamar(`${BASE}/diagnosticos`, "propietario", "POST",
      { enfermedad: "Coriza", medicamento: "X", dosis: "1", fecha: "2026-11-02", userId: "otro" });

    expect(r.status).toBe(201);
    expect(await r.json()).toEqual({ success: true, data: { id: "id-1" } });
    expect(repository.tratamientos).toHaveLength(1);
  });

  it("debe responder 404 AVE_NO_ENCONTRADA para un ave inexistente", async () => {
    const r = await llamar(`/api/v1/criaderos/${CRIADERO}/aves/otra/diagnosticos`, "propietario", "POST",
      { enfermedad: "E", fecha: "f" });

    expect(r.status).toBe(404);
    expect((await r.json()).error).toBe("AVE_NO_ENCONTRADA");
  });

  it("debe responder 400 con cuerpo no JSON o tipos inválidos", async () => {
    const a = await llamar(`${BASE}/diagnosticos`, "propietario", "POST", "no-json{");
    const b = await llamar(`${BASE}/diagnosticos`, "propietario", "POST", { enfermedad: 5, fecha: "f" });

    expect(a.status).toBe(400);
    expect(b.status).toBe(400);
  });

  it("debe responder 200 con el historial y lista vacía si el ave no existe", async () => {
    await llamar(`${BASE}/diagnosticos`, "propietario", "POST", { enfermedad: "E", fecha: "2026-11-02" });

    const r = await llamar(`${BASE}/salud`, "propietario");
    const vacia = await llamar(`/api/v1/criaderos/${CRIADERO}/aves/otra/salud`, "propietario");

    expect(r.status).toBe(200);
    expect((await r.json()).data.historial).toHaveLength(1);
    expect(await vacia.json()).toEqual({ success: true, data: { historial: [] } });
  });
});
