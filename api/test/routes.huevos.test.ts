import { describe, it, expect, beforeEach } from "vitest";
import { SignJWT } from "jose";
import { createApp } from "../src/app";
import { createHuevosRouter } from "../src/huevos/huevos.routes";
import { HuevosService } from "../src/huevos/huevos.service";
import { createAvesRouter } from "../src/aves/aves.routes";
import { AveService } from "../src/aves/aves.service";
import { createSaludRouter } from "../src/salud/salud.routes";
import { SaludService } from "../src/salud/salud.service";
import { FakeSaludRepository } from "./helpers/fake-salud.repository";
import { FakeAveRepository } from "./helpers/fake-aves.repository";
import { FakeHuevosRepository } from "./helpers/fake-huevos.repository";

const jwtSecret = "secret-test-key";
const CRIADERO = "criadero-1";
const BASE = `/api/v1/criaderos/${CRIADERO}`;

async function token(userId: string) {
  return await new SignJWT({ email: "test@test.com" })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(userId)
    .setIssuedAt()
    .setExpirationTime("1h")
    .sign(new TextEncoder().encode(jwtSecret));
}

let app: ReturnType<typeof createApp>;
let repository: FakeHuevosRepository;

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

describe("HTTP Huevos", () => {
  beforeEach(() => {
    repository = new FakeHuevosRepository();
    repository.sembrarAve(CRIADERO, "ave-1");
    repository.sembrarJaula(CRIADERO, "jaula-1", "J-1");

    let n = 0;
    const duenio = async (userId: string, criaderoId: string) =>
      userId === "propietario" && criaderoId === CRIADERO;

    const huevosRouter = createHuevosRouter(() => ({
      service: new HuevosService(repository, () => `id-${++n}`, () => new Date("2026-11-03T10:00:00.000Z")),
      userOwnsCriadero: duenio,
    }));

    // Router de aves real (con fake) montado a la vez: comprueba que las rutas no chocan.
    const avesRouter = createAvesRouter(() => ({
      service: new AveService(new FakeAveRepository()),
      userOwnsCriadero: duenio,
    }));

    // Salud también se monta bajo /aves/:aveId (comparte el prefijo con /aves/:aveId/huevos).
    const saludRouter = createSaludRouter(() => ({
      service: new SaludService(new FakeSaludRepository()),
      userOwnsCriadero: duenio,
    }));

    app = createApp({ huevosRouter, avesRouter, saludRouter });
  });

  it("debe rechazar las peticiones sin token", async () => {
    expect((await llamar(`${BASE}/aves/ave-1/huevos`, null, "POST", {})).status).toBe(401);
    expect((await llamar(`${BASE}/huevos/produccion/resumen`, null)).status).toBe(401);
  });

  it("debe responder 403 FORBIDDEN si el criadero no es del usuario", async () => {
    for (const ruta of [`${BASE}/aves/ave-1/huevos`, `${BASE}/huevos/produccion/total`, `${BASE}/huevos/siguiente-codigo`]) {
      const r = await llamar(ruta, "intruso");

      expect(r.status).toBe(403);
      expect((await r.json()).error).toBe("FORBIDDEN");
    }
  });

  it("debe responder 201 con id y código", async () => {
    const r = await llamar(`${BASE}/aves/ave-1/huevos`, "propietario", "POST",
      { jaulaId: "jaula-1", fecha: "2026-11-02T10:00:00.000Z", userId: "otro" });

    expect(r.status).toBe(201);
    expect(await r.json()).toEqual({ success: true, data: { id: "id-1", codigo: "H000001" } });
  });

  it("debe responder 404 para ave o jaula inexistentes", async () => {
    const a = await llamar(`${BASE}/aves/otra/huevos`, "propietario", "POST", {});
    const j = await llamar(`${BASE}/aves/ave-1/huevos`, "propietario", "POST", { jaulaId: "x" });

    expect(a.status).toBe(404);
    expect((await a.json()).error).toBe("AVE_NO_ENCONTRADA");
    expect(j.status).toBe(404);
    expect((await j.json()).error).toBe("JAULA_NO_ENCONTRADA");
  });

  it("debe responder 400 con cuerpo no JSON o tipos inválidos", async () => {
    expect((await llamar(`${BASE}/aves/ave-1/huevos`, "propietario", "POST", "no-json{")).status).toBe(400);
    expect((await llamar(`${BASE}/aves/ave-1/huevos`, "propietario", "POST", { fecha: 5 })).status).toBe(400);
  });

  it("debe listar los huevos del ave y devolver lista vacía si no existe", async () => {
    await llamar(`${BASE}/aves/ave-1/huevos`, "propietario", "POST", { jaulaId: "jaula-1", fecha: "2026-11-02" });

    const r = await llamar(`${BASE}/aves/ave-1/huevos`, "propietario");
    const vacia = await llamar(`${BASE}/aves/otra/huevos`, "propietario");

    expect((await r.json()).data.huevos[0]).toMatchObject({ codigo: "H000001", jaulaCodigo: "J-1", estado: "REGISTRADO" });
    expect(await vacia.json()).toEqual({ success: true, data: { huevos: [] } });
  });

  it("debe responder cada endpoint de producción con su forma", async () => {
    repository.resumenSembrado = { hoy: 1, semana: 2, mes: 3 };

    const claves: Record<string, string> = {
      ranking: "ranking", "por-dia": "dias", "por-dia-historico": "dias",
      "por-hora": "horas", "por-jaula": "jaulas", "por-ave": "aves",
    };

    expect(await (await llamar(`${BASE}/huevos/produccion/resumen`, "propietario")).json())
      .toEqual({ success: true, data: { hoy: 1, semana: 2, mes: 3 } });
    expect(await (await llamar(`${BASE}/huevos/produccion/total`, "propietario")).json())
      .toEqual({ success: true, data: { total: 0, hoy: null, mes: null } });
    expect(await (await llamar(`${BASE}/huevos/siguiente-codigo`, "propietario")).json())
      .toEqual({ success: true, data: { codigo: "H000001" } });

    for (const [ruta, clave] of Object.entries(claves)) {
      const r = await llamar(`${BASE}/huevos/produccion/${ruta}`, "propietario");

      expect(r.status).toBe(200);
      expect(await r.json()).toEqual({ success: true, data: { [clave]: [] } });
    }
  });

});
