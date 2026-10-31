import { describe, it, expect, beforeEach } from "vitest";
import { CatalogoService } from "../src/catalogs/catalogs.service";
import { FakeCatalogoRepository } from "./helpers/fake-catalogs.repository";


const CRIADERO = "criadero-1";

const OTRO_CRIADERO = "criadero-2";

const MENSAJE_DUPLICADO =
  "UNIQUE constraint failed: catalogo_items.catalogo_id, catalogo_items.codigo";


let repository: FakeCatalogoRepository;

let service: CatalogoService;

let ids: number;


describe("CatalogoService",()=>{


  beforeEach(()=>{

    repository = new FakeCatalogoRepository();

    ids = 0;

    service = new CatalogoService(repository,()=>`item-${++ids}`);

  });


  it("debe listar solo los 7 catálogos básicos ordenados por nombre", async()=>{

    const resultado = await service.listarCatalogos();

    expect(resultado.success).toBe(true);

    if(!resultado.success){
      return;
    }

    const codigos = resultado.data.catalogos.map(c=>c.codigo);

    expect(codigos).toHaveLength(7);
    expect(codigos).not.toContain("ESPECIES");
    expect(codigos).not.toContain("TIPOS_CRIADERO");
    expect(codigos).not.toContain("FINALIDADES_CRIADERO");
    expect(resultado.data.catalogos[0]).toEqual({
      id:"cat-alimentos",
      codigo:"ALIMENTOS",
      nombre:"Alimentos",
      activo:1
    });

  });


  it("debe obtener un catálogo básico y rechazar uno de onboarding o inexistente", async()=>{

    const razas = await service.obtenerCatalogo("RAZAS");
    const especies = await service.obtenerCatalogo("ESPECIES");
    const otro = await service.obtenerCatalogo("NO_EXISTE");

    expect(razas).toEqual({
      success:true,
      data:{ catalogo:{ id:"cat-razas", codigo:"RAZAS", nombre:"Razas" } }
    });

    expect(especies.success).toBe(false);
    expect(otro.success).toBe(false);

    if(!otro.success){
      expect(otro.error).toBe("CATALOGO_NOT_FOUND");
    }

  });


  it("debe listar solo los ítems activos del criadero ordenados por orden y nombre", async()=>{

    repository.sembrar(CRIADERO,"RAZAS",{ id:"a", codigo:"B", nombre:"Beta", orden:2 });
    repository.sembrar(CRIADERO,"RAZAS",{ id:"b", codigo:"A", nombre:"Alfa", orden:2 });
    repository.sembrar(CRIADERO,"RAZAS",{ id:"c", codigo:"Z", nombre:"Zeta", orden:0 });
    repository.sembrar(CRIADERO,"RAZAS",{ id:"d", codigo:"X", nombre:"Inactiva", orden:1, activo:0 });
    repository.sembrar(OTRO_CRIADERO,"RAZAS",{ id:"e", codigo:"O", nombre:"Ajena", orden:1 });

    const resultado = await service.listarItems(CRIADERO,"RAZAS");

    expect(resultado.success).toBe(true);

    if(resultado.success){
      expect(resultado.data.items.map(i=>i.nombre))
        .toEqual(["Zeta","Alfa","Beta"]);
      expect(Object.keys(resultado.data.items[0]).sort())
        .toEqual(["activo","codigo","descripcion","id","nombre","orden"]);
    }

  });


  it("debe responder CATALOGO_NOT_FOUND al listar ítems de un catálogo desconocido", async()=>{

    const resultado = await service.listarItems(CRIADERO,"ESPECIES");

    expect(resultado.success).toBe(false);

  });


  it("debe crear un ítem con orden 0, descripción null y sin normalizar el código", async()=>{

    const resultado = await service.crearItem(
      CRIADERO,
      "ALIMENTOS",
      { codigo:"maiz molido", nombre:"Maíz", descripcion:"" }
    );

    expect(resultado).toEqual({
      success:true,
      data:{
        item:{
          id:"item-1",
          codigo:"maiz molido",
          nombre:"Maíz",
          descripcion:null,
          activo:1,
          orden:0
        }
      }
    });

  });


  it("debe rechazar con VALIDATION_ERROR un código o nombre vacío o ausente", async()=>{

    const sinNombre = await service.crearItem(CRIADERO,"RAZAS",{ codigo:"X", nombre:"" });
    const sinCodigo = await service.crearItem(CRIADERO,"RAZAS",{ nombre:"X" });
    const codigoVacio = await service.crearItem(CRIADERO,"RAZAS",{ codigo:"", nombre:"X" });
    const noObjeto = await service.crearItem(CRIADERO,"RAZAS","texto");

    for(const r of [sinNombre,sinCodigo,codigoVacio,noObjeto]){
      expect(r.success).toBe(false);
      if(!r.success){
        expect(r.error).toBe("VALIDATION_ERROR");
      }
    }

  });


  it("debe rechazar un código duplicado activo con el mensaje exacto de SQLite", async()=>{

    await service.crearItem(CRIADERO,"BEBIDAS",{ codigo:"AGUA", nombre:"Agua" });

    const duplicado = await service.crearItem(CRIADERO,"BEBIDAS",{ codigo:"AGUA", nombre:"Otra" });

    expect(duplicado).toEqual({
      success:false,
      error:"UNIQUE_CATALOGO_ITEMS_CODIGO",
      message:MENSAJE_DUPLICADO
    });

  });


  it("debe mantener reservado el código de un ítem desactivado", async()=>{

    await service.crearItem(CRIADERO,"BEBIDAS",{ codigo:"AGUA", nombre:"Agua" });
    await service.desactivarItem(CRIADERO,"BEBIDAS","item-1");

    const duplicado = await service.crearItem(CRIADERO,"BEBIDAS",{ codigo:"AGUA", nombre:"Agua" });

    expect(duplicado.success).toBe(false);

    if(!duplicado.success){
      expect(duplicado.error).toBe("UNIQUE_CATALOGO_ITEMS_CODIGO");
    }

  });


  it("debe aceptar el mismo código en otro catálogo", async()=>{

    await service.crearItem(CRIADERO,"RAZAS",{ codigo:"OTRO", nombre:"Otro" });

    const otro = await service.crearItem(CRIADERO,"ALIMENTOS",{ codigo:"OTRO", nombre:"Otro" });

    expect(otro.success).toBe(true);

  });


  it("debe editar nombre y descripción sin cambiar código, orden ni activo", async()=>{

    await service.crearItem(CRIADERO,"RAZAS",{ codigo:"K", nombre:"Viejo", descripcion:"d" });

    const editado = await service.actualizarItem(
      CRIADERO,"RAZAS","item-1",{ nombre:"Nuevo", descripcion:"", codigo:"HACK", orden:9 }
    );

    expect(editado).toEqual({
      success:true,
      data:{
        item:{ id:"item-1", codigo:"K", nombre:"Nuevo", descripcion:null, activo:1, orden:0 }
      }
    });

  });


  it("debe permitir editar un ítem inactivo", async()=>{

    await service.crearItem(CRIADERO,"RAZAS",{ codigo:"K", nombre:"Viejo" });
    await service.desactivarItem(CRIADERO,"RAZAS","item-1");

    const editado = await service.actualizarItem(CRIADERO,"RAZAS","item-1",{ nombre:"Nuevo" });

    expect(editado.success).toBe(true);

    if(editado.success){
      expect(editado.data.item.activo).toBe(0);
      expect(editado.data.item.nombre).toBe("Nuevo");
    }

  });


  it("debe rechazar la edición con nombre vacío", async()=>{

    await service.crearItem(CRIADERO,"RAZAS",{ codigo:"K", nombre:"Viejo" });

    const editado = await service.actualizarItem(CRIADERO,"RAZAS","item-1",{ nombre:"  " });

    expect(editado.success).toBe(false);

    if(!editado.success){
      expect(editado.error).toBe("VALIDATION_ERROR");
    }

  });


  it("debe desactivar un ítem, sacarlo del listado y ser idempotente", async()=>{

    await service.crearItem(CRIADERO,"RAZAS",{ codigo:"K", nombre:"Kiri" });

    const primera = await service.desactivarItem(CRIADERO,"RAZAS","item-1");
    const segunda = await service.desactivarItem(CRIADERO,"RAZAS","item-1");

    expect(primera.success).toBe(true);
    expect(segunda.success).toBe(true);

    if(segunda.success){
      expect(segunda.data.item.activo).toBe(0);
    }

    const lista = await service.listarItems(CRIADERO,"RAZAS");

    if(lista.success){
      expect(lista.data.items).toEqual([]);
    }

  });


  it("debe responder CATALOGO_ITEM_NOT_FOUND con un ítem de otro criadero o de otro catálogo", async()=>{

    await service.crearItem(CRIADERO,"RAZAS",{ codigo:"K", nombre:"Kiri" });

    const otroCriadero = await service.actualizarItem(OTRO_CRIADERO,"RAZAS","item-1",{ nombre:"X" });
    const otroCatalogo = await service.desactivarItem(CRIADERO,"SEXOS","item-1");
    const inexistente = await service.desactivarItem(CRIADERO,"RAZAS","no-existe");

    for(const r of [otroCriadero,otroCatalogo,inexistente]){
      expect(r.success).toBe(false);
      if(!r.success){
        expect(r.error).toBe("CATALOGO_ITEM_NOT_FOUND");
      }
    }

  });

});
