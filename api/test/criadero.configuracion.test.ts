import { describe, it, expect } from "vitest";
import { CriaderoService } from "../src/criaderos/criaderos.service";
import {
  FakeCriaderoRepository,
  DEFAULT_TEST_CRIADERO_ID
} from "./helpers/fake-criadero.repository";


const configRequest = {
  especiePrincipalItemId:"item-especie",
  razaPrincipalItemId:"item-raza",
  tipoCriaderoItemId:"item-tipo",
  finalidadItemId:"item-finalidad"
};



describe("CriaderoService updateConfiguracion",()=>{


  it("debe actualizar configuración válida", async()=>{

    const repository = new FakeCriaderoRepository();

    const service = new CriaderoService(repository);


    const result = await service.updateConfiguracion(
      DEFAULT_TEST_CRIADERO_ID,
      configRequest
    );


    expect(result.success)
      .toBe(true);


    expect(repository.updated)
      .toBe(true);

  });



  it("debe rechazar item inexistente", async()=>{

    const repository = new FakeCriaderoRepository();

    repository.items.delete("item-raza");


    const service = new CriaderoService(repository);


    const result = await service.updateConfiguracion(
      DEFAULT_TEST_CRIADERO_ID,
      configRequest
    );


    expect(result.success)
      .toBe(false);


    if(!result.success){

      expect(result.error)
        .toBe("ITEMS_NOT_FOUND");

    }

  });



  it("debe rechazar item de otro criadero", async()=>{

    const repository = new FakeCriaderoRepository();


    repository.items.set(
      "item-raza",
      {
        id:"item-raza",
        criaderoId:"otro-criadero",
        catalogoCodigo:"RAZAS",
        activo:1,
        deletedAt:null
      }
    );


    const service = new CriaderoService(repository);


    const result = await service.updateConfiguracion(
      DEFAULT_TEST_CRIADERO_ID,
      configRequest
    );


    expect(result.success)
      .toBe(false);


    if(!result.success){

      expect(result.error)
        .toBe("ITEM_WRONG_CRIADERO");

    }

  });



  it("debe rechazar catálogo incorrecto", async()=>{

    const repository = new FakeCriaderoRepository();


    repository.items.set(
      "item-especie",
      {
        id:"item-especie",
        criaderoId:DEFAULT_TEST_CRIADERO_ID,
        catalogoCodigo:"RAZAS",
        activo:1,
        deletedAt:null
      }
    );


    const service = new CriaderoService(repository);


    const result = await service.updateConfiguracion(
      DEFAULT_TEST_CRIADERO_ID,
      configRequest
    );


    expect(result.success)
      .toBe(false);


    if(!result.success){

      expect(result.error)
        .toBe("ITEM_WRONG_CATALOG");

    }

  });


});
