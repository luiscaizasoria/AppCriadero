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


function evolucion(id: string, aveId: string, fecha: string, extra: Record<string, unknown> = {}){

  return {
    id,
    aveId,
    fecha,
    fotoUri: null,
    pesoGramos: null,
    alturaCm: null,
    largoCm: null,
    caracteristicas: null,
    observacion: null,
    ...extra
  };

}


describe("AveService.listarEvolucion",()=>{

  let repository: FakeAveRepository;

  let service: AveService;

  beforeEach(()=>{

    repository = new FakeAveRepository();
    service = new AveService(repository);

    repository.sembrarAve(CRIADERO,{ id:"ave-1", codigo:"K001" });
    repository.sembrarAve("criadero-2",{ id:"ave-2", codigo:"K002" });

  });


  it("debe devolver la evolución ordenada por fecha e id descendentes", async()=>{

    repository.evoluciones.push(
      evolucion("e1","ave-1","2026-01-01T00:00:00.000Z"),
      evolucion("e2","ave-1","2026-03-01T00:00:00.000Z"),
      evolucion("e3","ave-1","2026-03-01T00:00:00.000Z"),
      evolucion("e4","ave-2","2026-05-01T00:00:00.000Z")
    );

    const r = await service.listarEvolucion(CRIADERO,"ave-1");

    expect(r.success).toBe(true);

    if(r.success){
      expect(r.data.evolucion.map(e => e.id)).toEqual(["e3","e2","e1"]);
    }

  });


  it("debe devolver lista vacía para un ave inexistente o de otro criadero", async()=>{

    repository.evoluciones.push(evolucion("e4","ave-2","2026-05-01T00:00:00.000Z"));

    const inexistente = await service.listarEvolucion(CRIADERO,"no-existe");
    const ajena = await service.listarEvolucion(CRIADERO,"ave-2");

    expect(inexistente).toEqual({ success:true, data:{ evolucion:[] } });
    expect(ajena).toEqual({ success:true, data:{ evolucion:[] } });

  });

});


describe("HTTP GET /aves/:aveId/evolucion",()=>{

  let app: ReturnType<typeof createApp>;

  let repository: FakeAveRepository;

  async function llamar(path: string, userId: string | null){

    const headers: Record<string,string> = {};

    if(userId){
      headers.Authorization = `Bearer ${await token(userId)}`;
    }

    return app.request(path,{ method:"GET", headers },{ JWT_SECRET:jwtSecret });

  }

  beforeEach(()=>{

    repository = new FakeAveRepository();
    repository.sembrarAve(CRIADERO,{ id:"ave-1", codigo:"K001" });

    const service = new AveService(repository);

    const router = createAvesRouter(()=>({
      service,
      userOwnsCriadero: async(userId,criaderoId)=>
        userId==="propietario" && criaderoId===CRIADERO
    }));

    app = createApp({ avesRouter:router });

  });


  it("debe rechazar la petición sin token", async()=>{

    expect((await llamar(`${BASE}/ave-1/evolucion`,null)).status).toBe(401);

  });


  it("debe bloquear a un usuario que no es propietario del criadero", async()=>{

    const respuesta = await llamar(`${BASE}/ave-1/evolucion`,"otro-usuario");

    expect(respuesta.status).toBe(403);
    expect((await respuesta.json()).error).toBe("FORBIDDEN");

  });


  it("debe devolver 200 con la forma { evolucion: [...] }", async()=>{

    repository.evoluciones.push(
      evolucion("e1","ave-1","2026-01-01T00:00:00.000Z",{
        fotoUri:"file:///foto.jpg", pesoGramos:1200, alturaCm:30, largoCm:40,
        caracteristicas:"Plumaje", observacion:"Registro inicial"
      })
    );

    const respuesta = await llamar(`${BASE}/ave-1/evolucion`,"propietario");

    expect(respuesta.status).toBe(200);

    const cuerpo = await respuesta.json();

    expect(cuerpo.success).toBe(true);
    expect(cuerpo.data.evolucion).toHaveLength(1);
    expect(Object.keys(cuerpo.data.evolucion[0]).sort()).toEqual([
      "alturaCm","aveId","caracteristicas","fecha","fechaCreacion","fotoUri",
      "id","largoCm","observacion","pesoGramos"
    ]);
    expect(cuerpo.data.evolucion[0].fotoUri).toBe("file:///foto.jpg");

  });


  it("debe devolver 200 con lista vacía para un ave inexistente", async()=>{

    const respuesta = await llamar(`${BASE}/no-existe/evolucion`,"propietario");

    expect(respuesta.status).toBe(200);
    expect((await respuesta.json()).data).toEqual({ evolucion:[] });

  });

});
