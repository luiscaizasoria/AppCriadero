import { describe, it, expect, beforeEach } from "vitest";
import { SignJWT } from "jose";
import { createApp } from "../src/app";
import { createCuidadosRouter } from "../src/cuidados/cuidados.routes";
import { CuidadosService } from "../src/cuidados/cuidados.service";
import { createJaulasRouter } from "../src/jaulas/jaulas.routes";
import { JaulaService } from "../src/jaulas/jaulas.service";
import { FakeCuidadosRepository } from "./helpers/fake-cuidados.repository";
import { FakeJaulaRepository } from "./helpers/fake-jaula.repository";


const jwtSecret = "secret-test-key";

const CRIADERO = "criadero-1";

const BASE = `/api/v1/criaderos/${CRIADERO}/jaulas/jaula-1`;


async function token(userId: string){

  return await new SignJWT({ email:"test@test.com" })
    .setProtectedHeader({ alg:"HS256" })
    .setSubject(userId)
    .setIssuedAt()
    .setExpirationTime("1h")
    .sign(new TextEncoder().encode(jwtSecret));

}


let app: ReturnType<typeof createApp>;

let repository: FakeCuidadosRepository;

let ids: number;


async function llamar(path: string, userId: string | null, metodo = "GET", cuerpo?: unknown){

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

}


describe("HTTP Cuidados de jaula",()=>{


  beforeEach(()=>{

    repository = new FakeCuidadosRepository();

    repository.sembrarJaula(CRIADERO,"jaula-1");

    ids = 0;

    const duenio = async(userId: string, criaderoId: string) =>
      userId==="propietario" && criaderoId===CRIADERO;

    const cuidadosRouter = createCuidadosRouter(()=>({
      service: new CuidadosService(repository, () => `id-${++ids}`),
      userOwnsCriadero: duenio
    }));

    // Router de jaulas real (con fake) montado a la vez: comprueba que las rutas no chocan.
    const jaulasRouter = createJaulasRouter(()=>({
      service: new JaulaService(new FakeJaulaRepository()),
      userOwnsCriadero: duenio
    }));

    app = createApp({ cuidadosRouter, jaulasRouter });

  });


  it("debe rechazar las peticiones sin token", async()=>{

    const respuesta = await llamar(`${BASE}/alimentacion`, null, "POST", { tipo:"T", fecha:"f" });

    expect(respuesta.status).toBe(401);

  });


  it("debe responder 403 FORBIDDEN si el criadero no es del usuario", async()=>{

    const respuesta = await llamar(`${BASE}/sanidad`, "intruso", "POST", { tipo:"Normal", fecha:"f" });

    expect(respuesta.status).toBe(403);
    expect((await respuesta.json()).error).toBe("FORBIDDEN");
    expect(repository.sanidad).toHaveLength(0);

  });


  it("debe responder 201 con el registro de alimentación", async()=>{

    const respuesta = await llamar(`${BASE}/alimentacion`, "propietario", "POST",
      { tipo:"Maíz", cantidad:"50", fecha:"2026-10-30", userId:"otro" });

    expect(respuesta.status).toBe(201);
    expect(await respuesta.json()).toEqual({
      success:true,
      data:{ registro:{ id:"id-1", jaulaId:"jaula-1", fecha:"2026-10-30", tipo:"Maíz", cantidad:"50", detalle:null } }
    });

  });


  it("debe responder 201 con el registro de bebida", async()=>{

    const respuesta = await llamar(`${BASE}/bebida`, "propietario", "POST", { tipo:"Agua", fecha:"f" });

    expect(respuesta.status).toBe(201);
    expect((await respuesta.json()).data.registro).toMatchObject({ tipo:"Agua", cantidad:null });

  });


  it("debe responder 201 con registro y jaula en sanidad, sin cantidad", async()=>{

    const respuesta = await llamar(`${BASE}/sanidad`, "propietario", "POST", { tipo:"Cuarentena", fecha:"f", detalle:"d" });
    const cuerpo = await respuesta.json();

    expect(respuesta.status).toBe(201);
    expect(cuerpo.data.registro).toEqual({ id:"id-1", jaulaId:"jaula-1", fecha:"f", tipo:"Cuarentena", detalle:"d" });
    expect(cuerpo.data.jaula).toEqual({ id:"jaula-1", estadoSanitario:"CUARENTENA" });

  });


  it("debe responder 404 JAULA_NO_ENCONTRADA si la jaula no existe", async()=>{

    const respuesta = await llamar(`/api/v1/criaderos/${CRIADERO}/jaulas/nada/bebida`, "propietario", "POST", { tipo:"T", fecha:"f" });

    expect(respuesta.status).toBe(404);
    expect((await respuesta.json()).error).toBe("JAULA_NO_ENCONTRADA");

  });


  it("debe responder 400 VALIDATION_ERROR con el mensaje NOT NULL", async()=>{

    const respuesta = await llamar(`${BASE}/alimentacion`, "propietario", "POST", { tipo:"T" });
    const cuerpo = await respuesta.json();

    expect(respuesta.status).toBe(400);
    expect(cuerpo).toEqual({
      success:false,
      error:"VALIDATION_ERROR",
      message:"NOT NULL constraint failed: alimentacion_jaula.fecha"
    });

  });


  it("debe responder 400 con JSON inválido o cuerpo no objeto", async()=>{

    const malo = await llamar(`${BASE}/bebida`, "propietario", "POST", "{no-json");
    const noObjeto = await llamar(`${BASE}/sanidad`, "propietario", "POST", [1]);

    expect(malo.status).toBe(400);
    expect(noObjeto.status).toBe(400);
    expect((await noObjeto.json()).error).toBe("VALIDATION_ERROR");

  });


  it("debe listar la alimentación y no chocar con las rutas de jaulas", async()=>{

    await llamar(`${BASE}/alimentacion`, "propietario", "POST", { tipo:"A", fecha:"2026-10-01" });
    await llamar(`${BASE}/alimentacion`, "propietario", "POST", { tipo:"B", fecha:"2026-10-02" });

    const respuesta = await llamar(`${BASE}/alimentacion`, "propietario");
    const cuerpo = await respuesta.json();

    expect(respuesta.status).toBe(200);
    expect(cuerpo.data.registros.map((r: any) => r.tipo)).toEqual(["B","A"]);

    const historial = await llamar(`${BASE}/historial`, "propietario");

    expect(historial.status).toBe(200);

  });

});
