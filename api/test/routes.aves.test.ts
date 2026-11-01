import { describe, it, expect, beforeEach } from "vitest";
import { SignJWT } from "jose";
import { createApp } from "../src/app";
import { createAvesRouter } from "../src/aves/aves.routes";
import { AveService } from "../src/aves/aves.service";
import { FakeAveRepository } from "./helpers/fake-aves.repository";


const jwtSecret = "secret-test-key";

const CRIADERO = "criadero-1";

const BASE = `/api/v1/criaderos/${CRIADERO}/aves`;


async function token(userId: string){

  return await new SignJWT({ email:"test@test.com" })
    .setProtectedHeader({ alg:"HS256" })
    .setSubject(userId)
    .setIssuedAt()
    .setExpirationTime("1h")
    .sign(new TextEncoder().encode(jwtSecret));

}


let app: ReturnType<typeof createApp>;

let repository: FakeAveRepository;

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


const AVE = { codigo:"k001", origen:"NACIDA_CRIADERO", fechaNacimiento:"2026-01-01", raza:"Kiri", sexo:"MACHO" };


describe("HTTP Aves",()=>{


  beforeEach(()=>{

    repository = new FakeAveRepository();

    repository.sembrarJaula(CRIADERO,"jaula-1","J001");

    ids = 0;

    const service = new AveService(
      repository,
      () => new Date("2026-10-30T12:00:00.000Z"),
      () => `ave-${++ids}`
    );

    const router = createAvesRouter(()=>({
      service,
      userOwnsCriadero: async(userId,criaderoId)=>
        userId==="propietario" && criaderoId===CRIADERO
    }));

    app = createApp({ avesRouter:router });

  });


  it("debe rechazar las peticiones sin token", async()=>{

    expect((await llamar(BASE, null)).status).toBe(401);

  });


  it("debe bloquear a un usuario que no es propietario del criadero", async()=>{

    const respuesta = await llamar(BASE,"otro-usuario");

    expect(respuesta.status).toBe(403);
    expect((await respuesta.json()).error).toBe("FORBIDDEN");

  });


  it("debe crear un ave y devolverla con 201", async()=>{

    const respuesta = await llamar(BASE,"propietario","POST",{ ...AVE, jaulaId:"jaula-1" });

    expect(respuesta.status).toBe(201);

    const cuerpo = await respuesta.json();

    expect(cuerpo.success).toBe(true);
    expect(cuerpo.data.ave.codigo).toBe("K001");
    expect(cuerpo.data.ave.jaulaCodigo).toBe("J001");
    expect(cuerpo.data.ave.estadoSalud).toBe("SANA");

  });


  it("debe mapear los errores de padres a 400 con la cadena de V1 como código y mensaje", async()=>{

    const respuesta = await llamar(BASE,"propietario","POST",{ ...AVE, padreId:"x", madreId:"x" });

    expect(respuesta.status).toBe(400);

    const cuerpo = await respuesta.json();

    expect(cuerpo).toEqual({ success:false, error:"PADRES_IGUALES", message:"PADRES_IGUALES" });

  });


  it("debe responder 409 con el mensaje de SQLite si el código está duplicado al crear", async()=>{

    await llamar(BASE,"propietario","POST",AVE);

    const respuesta = await llamar(BASE,"propietario","POST",AVE);

    expect(respuesta.status).toBe(409);
    expect((await respuesta.json()).message).toBe("UNIQUE constraint failed: aves.codigo");

  });


  it("debe responder 400 si el cuerpo no es JSON o el código no es texto", async()=>{

    expect((await llamar(BASE,"propietario","POST","{no es json")).status).toBe(400);
    expect((await llamar(BASE,"propietario","POST",{ origen:"COMPRADA" })).status).toBe(400);

  });


  it("debe listar activas por defecto, filtrar por estado y rechazar un estado desconocido", async()=>{

    await llamar(BASE,"propietario","POST",{ ...AVE, codigo:"B" });
    await llamar(BASE,"propietario","POST",{ ...AVE, codigo:"A" });

    repository.aves.find(a=>a.codigo==="B")!.estado = "FALLECIDA";

    const activas = await (await llamar(BASE,"propietario")).json();
    const fallecidas = await (await llamar(`${BASE}?estado=FALLECIDA`,"propietario")).json();

    expect(activas.data.aves.map((a:any)=>a.codigo)).toEqual(["A"]);
    expect(fallecidas.data.aves.map((a:any)=>a.codigo)).toEqual(["B"]);
    expect((await llamar(`${BASE}?estado=OTRO`,"propietario")).status).toBe(400);

  });


  it("debe servir las rutas fijas antes de /:aveId", async()=>{

    await llamar(BASE,"propietario","POST",{ ...AVE, jaulaId:"jaula-1" });

    const existe = await (await llamar(`${BASE}/existe-codigo?codigo=%20K001%20`,"propietario")).json();
    const candidatas = await (await llamar(`${BASE}/candidatas-padres`,"propietario")).json();
    const paraAsignar = await (await llamar(`${BASE}/para-asignar-jaula?jaulaId=jaula-1`,"propietario")).json();
    const porJaula = await (await llamar(`${BASE}/por-jaula/jaula-1`,"propietario")).json();

    expect(existe.data).toEqual({ existe:true });
    expect(candidatas.data.aves.map((a:any)=>a.codigo)).toEqual(["K001"]);
    expect(paraAsignar.data.aves).toEqual([]);
    expect(porJaula.data.aves.map((a:any)=>a.codigo)).toEqual(["K001"]);
    expect((await llamar(`${BASE}/para-asignar-jaula`,"propietario")).status).toBe(400);

  });


  it("debe devolver el detalle y 404 AVE_NO_ENCONTRADA si no existe", async()=>{

    await llamar(BASE,"propietario","POST",AVE);

    const existente = await llamar(`${BASE}/ave-1`,"propietario");
    const inexistente = await llamar(`${BASE}/no-existe`,"propietario");

    expect(existente.status).toBe(200);
    expect(inexistente.status).toBe(404);
    expect((await inexistente.json()).error).toBe("AVE_NO_ENCONTRADA");

  });


  it("debe editar un ave y responder 409 AVE_NO_ACTIVA o CODIGO_AVE_DUPLICADO según V1", async()=>{

    await llamar(BASE,"propietario","POST",AVE);
    await llamar(BASE,"propietario","POST",{ ...AVE, codigo:"K002" });

    const editada = await llamar(`${BASE}/ave-1`,"propietario","PUT",{ ...AVE, caracteristicas:"Nueva" });
    const duplicada = await llamar(`${BASE}/ave-1`,"propietario","PUT",{ ...AVE, codigo:"K002" });

    repository.aves[0].estado = "VENDIDA";

    const noActiva = await llamar(`${BASE}/ave-1`,"propietario","PUT",AVE);

    expect(editada.status).toBe(200);
    expect((await editada.json()).data.ave.caracteristicas).toBe("Nueva");
    expect(duplicada.status).toBe(409);
    expect((await duplicada.json()).error).toBe("CODIGO_AVE_DUPLICADO");
    expect(noActiva.status).toBe(409);
    expect((await noActiva.json()).error).toBe("AVE_NO_ACTIVA");

  });


  it("debe cambiar la jaula y listar el historial del ave", async()=>{

    await llamar(BASE,"propietario","POST",AVE);

    const cambio = await llamar(
      `${BASE}/ave-1/jaula`,
      "propietario",
      "PUT",
      { nuevaJaulaId:"jaula-1", codigoAve:"K001" }
    );

    const historial = await (await llamar(`${BASE}/ave-1/historial`,"propietario")).json();

    expect(cambio.status).toBe(200);
    expect((await cambio.json()).data.ave.jaulaActualId).toBe("jaula-1");
    expect(historial.data.historial.map((h:any)=>h.tipoEvento).sort()).toEqual(["ALTA","CAMBIO_JAULA"]);

  });


  it("debe registrar eventos y evolución con 201", async()=>{

    await llamar(BASE,"propietario","POST",AVE);

    const evento = await llamar(`${BASE}/ave-1/eventos`,"propietario","POST",{ tipoEvento:"RECUPERACION", detalle:"ok" });
    const evolucion = await llamar(`${BASE}/ave-1/evolucion`,"propietario","POST",{ pesoGramos:900 });

    expect(evento.status).toBe(201);
    expect(evolucion.status).toBe(201);
    expect((await evolucion.json()).data.ave.pesoGramos).toBe(900);
    expect((await llamar(`${BASE}/no-existe/evolucion`,"propietario","POST",{})).status).toBe(404);

  });


  it("debe finalizar el tratamiento con o sin cuerpo y responder 404 si el ave no existe", async()=>{

    await llamar(BASE,"propietario","POST",AVE);

    const sinCuerpo = await llamar(`${BASE}/ave-1/finalizar-tratamiento`,"propietario","POST");
    const conCuerpo = await llamar(`${BASE}/ave-1/finalizar-tratamiento`,"propietario","POST",{ observacion:"Bien" });
    const inexistente = await llamar(`${BASE}/no-existe/finalizar-tratamiento`,"propietario","POST",{});
    const malFormado = await llamar(`${BASE}/ave-1/finalizar-tratamiento`,"propietario","POST","{mal");

    expect(sinCuerpo.status).toBe(200);
    expect(conCuerpo.status).toBe(200);
    expect((await sinCuerpo.json()).data.ave.estadoSalud).toBe("SANA");
    expect(inexistente.status).toBe(404);
    expect(malFormado.status).toBe(400);

  });

});
