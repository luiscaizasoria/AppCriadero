import { describe, it, expect, beforeEach } from "vitest";
import { SignJWT } from "jose";
import { createApp } from "../src/app";
import { createJaulasRouter } from "../src/jaulas/jaulas.routes";
import { JaulaService } from "../src/jaulas/jaulas.service";
import { FakeJaulaRepository } from "./helpers/fake-jaula.repository";


const jwtSecret = "secret-test-key";

const CRIADERO = "criadero-1";

const BASE = `/api/v1/criaderos/${CRIADERO}/jaulas`;


async function token(userId: string){

  return await new SignJWT({ email:"test@test.com" })
    .setProtectedHeader({ alg:"HS256" })
    .setSubject(userId)
    .setIssuedAt()
    .setExpirationTime("1h")
    .sign(new TextEncoder().encode(jwtSecret));

}


let app: ReturnType<typeof createApp>;

let repository: FakeJaulaRepository;

let ids: number;


function llamar(path: string, userId: string | null, metodo = "GET", cuerpo?: unknown){

  return (async()=>{

    const headers: Record<string,string> = {};

    if(userId){
      headers.Authorization = `Bearer ${await token(userId)}`;
    }

    if(cuerpo !== undefined){
      headers["Content-Type"] = "application/json";
    }

    return app.request(
      path,
      {
        method:metodo,
        headers,
        body: cuerpo === undefined
          ? undefined
          : typeof cuerpo === "string" ? cuerpo : JSON.stringify(cuerpo)
      },
      { JWT_SECRET:jwtSecret }
    );

  })();

}


describe("HTTP Jaulas",()=>{


  beforeEach(()=>{

    repository = new FakeJaulaRepository();

    ids = 0;

    const service = new JaulaService(
      repository,
      () => new Date("2026-10-30T12:00:00.000Z"),
      () => `jaula-${++ids}`
    );

    const router = createJaulasRouter(()=>({
      service,
      userOwnsCriadero: async(userId,criaderoId)=>
        userId==="propietario" && criaderoId===CRIADERO
    }));

    app = createApp({ jaulasRouter:router });

  });


  it("debe rechazar las peticiones sin token", async()=>{

    const respuesta = await llamar(BASE, null);

    expect(respuesta.status).toBe(401);

  });


  it("debe bloquear a un usuario que no es propietario del criadero", async()=>{

    const respuesta = await llamar(BASE, "otro-usuario");

    expect(respuesta.status).toBe(403);

    const cuerpo = await respuesta.json();

    expect(cuerpo.error).toBe("FORBIDDEN");

  });


  it("debe crear una jaula y devolverla con 201", async()=>{

    const respuesta = await llamar(
      BASE,
      "propietario",
      "POST",
      { codigo:" J001 ", nombre:"Sector A", tipo:"General" }
    );

    expect(respuesta.status).toBe(201);

    const cuerpo = await respuesta.json();

    expect(cuerpo.success).toBe(true);
    expect(cuerpo.data.jaula.codigo).toBe("J001");
    expect(cuerpo.data.jaula.estadoSanitario).toBe("NORMAL");
    expect(cuerpo.data.jaula.activa).toBe(1);

  });


  it("debe responder 409 con el mensaje de SQLite si el código está duplicado", async()=>{

    await llamar(BASE,"propietario","POST",{ codigo:"J001" });

    const respuesta = await llamar(BASE,"propietario","POST",{ codigo:"J001" });

    expect(respuesta.status).toBe(409);

    const cuerpo = await respuesta.json();

    expect(cuerpo.success).toBe(false);
    expect(cuerpo.message).toBe("UNIQUE constraint failed: jaulas.codigo");

  });


  it("debe responder 400 si el cuerpo no es JSON o el código no es texto", async()=>{

    const noJson = await llamar(BASE,"propietario","POST","{no es json");
    const sinCodigo = await llamar(BASE,"propietario","POST",{ nombre:"Sin código" });

    expect(noJson.status).toBe(400);
    expect(sinCodigo.status).toBe(400);

  });


  it("debe listar activas por defecto e inactivas con estado=INACTIVA", async()=>{

    await llamar(BASE,"propietario","POST",{ codigo:"J002" });
    await llamar(BASE,"propietario","POST",{ codigo:"J001" });
    await llamar(`${BASE}/jaula-1`,"propietario","DELETE");

    const activas = await (await llamar(BASE,"propietario")).json();
    const inactivas = await (await llamar(`${BASE}?estado=INACTIVA`,"propietario")).json();

    expect(activas.data.jaulas.map((j:any)=>j.codigo)).toEqual(["J001"]);
    expect(inactivas.data.jaulas.map((j:any)=>j.codigo)).toEqual(["J002"]);

  });


  it("debe responder 400 si estado no es ACTIVA ni INACTIVA", async()=>{

    const respuesta = await llamar(`${BASE}?estado=OTRO`,"propietario");

    expect(respuesta.status).toBe(400);

  });


  it("debe devolver el detalle y 404 JAULA_NO_ENCONTRADA si no existe", async()=>{

    await llamar(BASE,"propietario","POST",{ codigo:"J001" });

    const existente = await llamar(`${BASE}/jaula-1`,"propietario");
    const inexistente = await llamar(`${BASE}/no-existe`,"propietario");

    expect(existente.status).toBe(200);
    expect(inexistente.status).toBe(404);
    expect((await inexistente.json()).error).toBe("JAULA_NO_ENCONTRADA");

  });


  it("debe editar una jaula y rechazar un código repetido con 409", async()=>{

    await llamar(BASE,"propietario","POST",{ codigo:"J001" });
    await llamar(BASE,"propietario","POST",{ codigo:"J002" });

    const editada = await llamar(
      `${BASE}/jaula-2`,
      "propietario",
      "PUT",
      { codigo:"J002", nombre:"Nuevo", tipo:"" }
    );

    const repetida = await llamar(
      `${BASE}/jaula-2`,
      "propietario",
      "PUT",
      { codigo:"J001" }
    );

    expect(editada.status).toBe(200);
    expect((await editada.json()).data.jaula.nombre).toBe("Nuevo");
    expect(repetida.status).toBe(409);

  });


  it("debe desactivar con DELETE y devolver cantidadAvesLiberadas", async()=>{

    await llamar(BASE,"propietario","POST",{ codigo:"J001" });

    const respuesta = await llamar(`${BASE}/jaula-1`,"propietario","DELETE");

    expect(respuesta.status).toBe(200);
    expect((await respuesta.json()).data).toEqual({ cantidadAvesLiberadas:0 });

    const detalle = await (await llamar(`${BASE}/jaula-1`,"propietario")).json();

    expect(detalle.data.jaula.activa).toBe(0);

  });


  it("debe responder 404 al desactivar una jaula inexistente", async()=>{

    const respuesta = await llamar(`${BASE}/no-existe`,"propietario","DELETE");

    expect(respuesta.status).toBe(404);

  });

});
