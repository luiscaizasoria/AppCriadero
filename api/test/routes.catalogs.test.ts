import { describe, it, expect, beforeEach } from "vitest";
import { SignJWT } from "jose";
import { createApp } from "../src/app";
import { createCatalogosRouter } from "../src/catalogs/catalogs.routes";
import { CatalogoService } from "../src/catalogs/catalogs.service";
import { FakeCatalogoRepository } from "./helpers/fake-catalogs.repository";


const jwtSecret = "secret-test-key";

const CRIADERO = "criadero-1";

const BASE = `/api/v1/criaderos/${CRIADERO}/catalogos`;


async function token(userId: string){

  return await new SignJWT({ email:"test@test.com" })
    .setProtectedHeader({ alg:"HS256" })
    .setSubject(userId)
    .setIssuedAt()
    .setExpirationTime("1h")
    .sign(new TextEncoder().encode(jwtSecret));

}


let app: ReturnType<typeof createApp>;

let repository: FakeCatalogoRepository;

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


describe("HTTP Catálogos",()=>{


  beforeEach(()=>{

    repository = new FakeCatalogoRepository();

    ids = 0;

    const service = new CatalogoService(repository,()=>`item-${++ids}`);

    const router = createCatalogosRouter(()=>({
      service,
      userOwnsCriadero: async(userId,criaderoId)=>
        userId==="propietario" && criaderoId===CRIADERO
    }));

    app = createApp({ catalogosRouter:router });

  });


  it("debe rechazar las peticiones sin token con 401", async()=>{

    const respuesta = await llamar(BASE, null);

    expect(respuesta.status).toBe(401);

  });


  it("debe bloquear con 403 FORBIDDEN a quien no es propietario del criadero", async()=>{

    const respuesta = await llamar(BASE, "otro-usuario");

    expect(respuesta.status).toBe(403);
    expect((await respuesta.json()).error).toBe("FORBIDDEN");

  });


  it("debe listar los 7 catálogos básicos", async()=>{

    const respuesta = await llamar(BASE, "propietario");

    expect(respuesta.status).toBe(200);

    const cuerpo = await respuesta.json();

    expect(cuerpo.success).toBe(true);
    expect(cuerpo.data.catalogos).toHaveLength(7);

  });


  it("debe devolver un catálogo y 404 CATALOGO_NOT_FOUND si no es básico", async()=>{

    const razas = await llamar(`${BASE}/RAZAS`,"propietario");
    const especies = await llamar(`${BASE}/ESPECIES`,"propietario");

    expect(razas.status).toBe(200);
    expect((await razas.json()).data.catalogo.codigo).toBe("RAZAS");
    expect(especies.status).toBe(404);
    expect((await especies.json()).error).toBe("CATALOGO_NOT_FOUND");

  });


  it("debe crear un ítem con 201 y orden 0", async()=>{

    const respuesta = await llamar(
      `${BASE}/ALIMENTOS/items`,
      "propietario",
      "POST",
      { codigo:"MAIZ", nombre:"Maíz" }
    );

    expect(respuesta.status).toBe(201);

    const cuerpo = await respuesta.json();

    expect(cuerpo.data.item).toEqual({
      id:"item-1",
      codigo:"MAIZ",
      nombre:"Maíz",
      descripcion:null,
      activo:1,
      orden:0
    });

  });


  it("debe responder 409 con el mensaje exacto si el código está duplicado", async()=>{

    await llamar(`${BASE}/BEBIDAS/items`,"propietario","POST",{ codigo:"AGUA", nombre:"Agua" });

    const respuesta = await llamar(
      `${BASE}/BEBIDAS/items`,"propietario","POST",{ codigo:"AGUA", nombre:"Otra" }
    );

    expect(respuesta.status).toBe(409);

    const cuerpo = await respuesta.json();

    expect(cuerpo.error).toBe("UNIQUE_CATALOGO_ITEMS_CODIGO");
    expect(cuerpo.message)
      .toBe("UNIQUE constraint failed: catalogo_items.catalogo_id, catalogo_items.codigo");

  });


  it("debe responder 400 si el cuerpo no es JSON o el nombre está vacío", async()=>{

    const noJson = await llamar(`${BASE}/RAZAS/items`,"propietario","POST","{no es json");
    const sinNombre = await llamar(
      `${BASE}/RAZAS/items`,"propietario","POST",{ codigo:"X", nombre:"" }
    );

    expect(noJson.status).toBe(400);
    expect(sinNombre.status).toBe(400);
    expect((await sinNombre.json()).error).toBe("VALIDATION_ERROR");

  });


  it("debe editar un ítem y rechazar un nombre vacío", async()=>{

    await llamar(`${BASE}/RAZAS/items`,"propietario","POST",{ codigo:"K", nombre:"Viejo" });

    const editado = await llamar(
      `${BASE}/RAZAS/items/item-1`,"propietario","PUT",{ nombre:"Nuevo", descripcion:"Desc" }
    );
    const vacio = await llamar(
      `${BASE}/RAZAS/items/item-1`,"propietario","PUT",{ nombre:"" }
    );

    expect(editado.status).toBe(200);

    const item = (await editado.json()).data.item;

    expect(item.nombre).toBe("Nuevo");
    expect(item.descripcion).toBe("Desc");
    expect(item.codigo).toBe("K");
    expect(vacio.status).toBe(400);

  });


  it("debe desactivar con DELETE, ser idempotente y ocultar el ítem del listado", async()=>{

    await llamar(`${BASE}/RAZAS/items`,"propietario","POST",{ codigo:"K", nombre:"Kiri" });

    const primera = await llamar(`${BASE}/RAZAS/items/item-1`,"propietario","DELETE");
    const segunda = await llamar(`${BASE}/RAZAS/items/item-1`,"propietario","DELETE");
    const lista = await llamar(`${BASE}/RAZAS/items`,"propietario");

    expect(primera.status).toBe(200);
    expect((await primera.json()).data.item.activo).toBe(0);
    expect(segunda.status).toBe(200);
    expect((await lista.json()).data.items).toEqual([]);

  });


  it("debe responder 404 CATALOGO_ITEM_NOT_FOUND con un ítem de otro catálogo", async()=>{

    await llamar(`${BASE}/RAZAS/items`,"propietario","POST",{ codigo:"K", nombre:"Kiri" });

    const put = await llamar(`${BASE}/SEXOS/items/item-1`,"propietario","PUT",{ nombre:"X" });
    const del = await llamar(`${BASE}/SEXOS/items/item-1`,"propietario","DELETE");

    expect(put.status).toBe(404);
    expect((await put.json()).error).toBe("CATALOGO_ITEM_NOT_FOUND");
    expect(del.status).toBe(404);

  });

});
