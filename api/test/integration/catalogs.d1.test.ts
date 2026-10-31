import { describe, it, expect, beforeAll } from "vitest";
import { AuthService } from "../../src/auth/auth.service";
import { D1AuthRepository } from "../../src/auth/auth.repository";
import { CriaderoService } from "../../src/criaderos/criaderos.service";
import { D1CriaderoRepository } from "../../src/criaderos/criaderos.repository";
import { D1CatalogoRepository } from "../../src/catalogs/catalogs.repository";
import { CatalogoService } from "../../src/catalogs/catalogs.service";
import { LocalD1Adapter } from "../helpers/local-d1.adapter";


// Base SQLite en memoria con las migraciones aplicadas (ver LocalD1Adapter).
const db = new LocalD1Adapter();

const jwtSecret = "integration-secret-key";

const MENSAJE_DUPLICADO =
  "UNIQUE constraint failed: catalogo_items.catalogo_id, catalogo_items.codigo";


async function crearCriadero(email:string){

  const auth = new AuthService(
    new D1AuthRepository(db as any),
    jwtSecret
  );

  const usuario = await auth.register({
    email,
    nombre:"Usuario Catalogos",
    password:"Password123!"
  });

  if(!usuario.success){
    throw new Error("No se pudo registrar el usuario de prueba");
  }

  const criaderos = new CriaderoService(
    new D1CriaderoRepository(db as any)
  );

  const criadero = await criaderos.createCriadero(
    usuario.data.user.id,
    {
      nombre:"Criadero Catalogos",
      pais:"Ecuador",
      provincia:"Pichincha",
      ciudad:"Quito",
      telefono:"0999999999",
      correoContacto:email
    }
  );

  if(!criadero.success){
    throw new Error("No se pudo crear el criadero de prueba");
  }

  return criadero.data.id;

}


describe("Catálogos D1 local (SQLite en memoria)",()=>{


  let criaderoA: string;

  let criaderoB: string;

  const service = new CatalogoService(new D1CatalogoRepository(db as any));


  async function items(criadero:string,catalogo:string){

    const r = await service.listarItems(criadero,catalogo);

    if(!r.success){
      throw new Error("No se pudo listar");
    }

    return r.data.items;

  }


  beforeAll(async()=>{

    criaderoA = await crearCriadero("catalogos.a@test.com");

    criaderoB = await crearCriadero("catalogos.b@test.com");

  });


  it("debe listar los 7 catálogos básicos y ocultar los de onboarding", async()=>{

    const r = await service.listarCatalogos();

    expect(r.success).toBe(true);

    if(r.success){
      expect(r.data.catalogos.map(c=>c.codigo).sort()).toEqual([
        "ALIMENTOS","BEBIDAS","CATEGORIAS_FINANCIERAS","ENFERMEDADES",
        "MEDICAMENTOS","RAZAS","SEXOS"
      ]);
      expect(r.data.catalogos.every(c=>c.activo===1)).toBe(true);
    }

  });


  it("debe sembrar en un criadero nuevo 42 ítems con el conteo por catálogo", async()=>{

    const esperado: Record<string,number> = {
      RAZAS:9, SEXOS:2, ENFERMEDADES:4, MEDICAMENTOS:4,
      ALIMENTOS:2, BEBIDAS:2, CATEGORIAS_FINANCIERAS:8
    };

    for(const [codigo,total] of Object.entries(esperado)){
      expect((await items(criaderoA,codigo)).length).toBe(total);
    }

    const total = await (db as any)
      .prepare("SELECT COUNT(*) AS total FROM catalogo_items WHERE criadero_id = ?")
      .bind(criaderoA)
      .first();

    expect(total.total).toBe(42);

  });


  it("debe listar los ítems ordenados por orden y nombre", async()=>{

    const alimentos = await items(criaderoA,"ALIMENTOS");

    expect(alimentos.map(i=>i.nombre)).toEqual(["Balanceado","Morichillo"]);

    const bebidas = await items(criaderoA,"BEBIDAS");

    expect(bebidas.map(i=>i.codigo)).toEqual(["AGUA","AGUA_VITAMINA"]);

    const sexos = await items(criaderoA,"SEXOS");

    expect(sexos.map(i=>i.codigo)).toEqual(["MACHO","HEMBRA"]);

  });


  it("debe crear un ítem con UUID, orden 0 y descripción null", async()=>{

    const r = await service.crearItem(
      criaderoA,"RAZAS",{ codigo:"NUEVA", nombre:"Nueva", descripcion:"" }
    );

    expect(r.success).toBe(true);

    if(r.success){
      expect(r.data.item.id).toMatch(/^[0-9a-f-]{36}$/);
      expect(r.data.item.orden).toBe(0);
      expect(r.data.item.descripcion).toBeNull();
      expect(r.data.item.activo).toBe(1);
    }

    // orden 0 va antes de los sembrados (1..9), como en V1.
    expect((await items(criaderoA,"RAZAS"))[0].codigo).toBe("NUEVA");

  });


  it("debe rechazar un código duplicado activo con el mensaje exacto", async()=>{

    const r = await service.crearItem(criaderoA,"RAZAS",{ codigo:"KIKIRIS", nombre:"Otra" });

    expect(r).toEqual({
      success:false,
      error:"UNIQUE_CATALOGO_ITEMS_CODIGO",
      message:MENSAJE_DUPLICADO
    });

  });


  it("debe mantener reservado el código de un ítem desactivado y sacarlo del listado", async()=>{

    const kiri = (await items(criaderoA,"RAZAS")).find(i=>i.codigo==="KIRI")!;

    const primera = await service.desactivarItem(criaderoA,"RAZAS",kiri.id);
    const segunda = await service.desactivarItem(criaderoA,"RAZAS",kiri.id);

    expect(primera.success).toBe(true);
    expect(segunda.success).toBe(true);

    if(segunda.success){
      expect(segunda.data.item.activo).toBe(0);
    }

    expect((await items(criaderoA,"RAZAS")).some(i=>i.codigo==="KIRI")).toBe(false);

    const fila = await (db as any)
      .prepare("SELECT deleted_at FROM catalogo_items WHERE id = ?")
      .bind(kiri.id)
      .first();

    expect(fila.deleted_at).toBeNull();

    const repetido = await service.crearItem(criaderoA,"RAZAS",{ codigo:"KIRI", nombre:"Kiri" });

    expect(repetido.success).toBe(false);

    if(!repetido.success){
      expect(repetido.message).toBe(MENSAJE_DUPLICADO);
    }

  });


  it("debe aceptar el mismo código en otro catálogo y en otro criadero", async()=>{

    const otroCatalogo = await service.crearItem(criaderoA,"ALIMENTOS",{ codigo:"OTRO", nombre:"Otro" });
    const otroCriadero = await service.crearItem(criaderoB,"RAZAS",{ codigo:"NUEVA", nombre:"Nueva" });

    expect(otroCatalogo.success).toBe(true);
    expect(otroCriadero.success).toBe(true);

  });


  it("debe editar nombre y descripción sin cambiar código, orden ni activo, también si está inactivo", async()=>{

    const kiri = await (db as any)
      .prepare(`
        SELECT id FROM catalogo_items
        WHERE criadero_id = ? AND codigo = 'KIRI'
      `)
      .bind(criaderoA)
      .first();

    const r = await service.actualizarItem(
      criaderoA,"RAZAS",kiri.id,{ nombre:"Kiri editado", descripcion:"Desc" }
    );

    expect(r.success).toBe(true);

    if(r.success){
      expect(r.data.item).toEqual({
        id:kiri.id,
        codigo:"KIRI",
        nombre:"Kiri editado",
        descripcion:"Desc",
        activo:0,
        orden:6
      });
    }

  });


  it("debe responder CATALOGO_ITEM_NOT_FOUND con un ítem de otro criadero o de otro catálogo", async()=>{

    const deB = (await items(criaderoB,"RAZAS"))[0];

    const otroCriadero = await service.actualizarItem(criaderoA,"RAZAS",deB.id,{ nombre:"X" });
    const otroCatalogo = await service.desactivarItem(criaderoB,"SEXOS",deB.id);

    for(const r of [otroCriadero,otroCatalogo]){
      expect(r.success).toBe(false);
      if(!r.success){
        expect(r.error).toBe("CATALOGO_ITEM_NOT_FOUND");
      }
    }

    // El ítem de B no cambió.
    expect((await items(criaderoB,"RAZAS")).some(i=>i.id===deB.id && i.nombre===deB.nombre))
      .toBe(true);

  });

});
