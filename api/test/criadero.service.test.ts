import { describe, it, expect } from "vitest";
import { CriaderoService } from "../src/criaderos/criaderos.service";
import { FakeCriaderoRepository } from "./helpers/fake-criadero.repository";


const request = {
  nombre:"Criadero Test",
  descripcion:"Prueba",
  pais:"Ecuador",
  provincia:"Pichincha",
  ciudad:"Quito",
  direccion:"Quito",
  telefono:"0999999999",
  correoContacto:"test@test.com"
};



describe("CriaderoService createCriadero",()=>{


  it("debe rechazar usuario inexistente", async()=>{

    const repository = new FakeCriaderoRepository();

    repository.userActive = false;


    const service = new CriaderoService(repository);


    const result = await service.createCriadero(
      "user-1",
      request
    );


    expect(result.success)
      .toBe(false);


    if(!result.success){

      expect(result.error)
        .toBe("USER_NOT_FOUND");

    }

  });



  it("debe rechazar cuando faltan catalogos", async()=>{

    const repository = new FakeCriaderoRepository();

    repository.catalogs.delete("RAZAS");


    const service = new CriaderoService(repository);


    const result = await service.createCriadero(
      "user-1",
      request
    );


    expect(result.success)
      .toBe(false);


    if(!result.success){

      expect(result.error)
        .toBe("CATALOGS_MISSING");

    }

  });



  it("debe crear criadero correctamente", async()=>{

    const repository = new FakeCriaderoRepository();


    const service = new CriaderoService(repository);


    const result = await service.createCriadero(
      "user-1",
      request
    );


    expect(result.success)
      .toBe(true);


    if(result.success){

      expect(result.data.userId)
        .toBe("user-1");


      expect(result.data.onboardingCompletado)
        .toBe(false);


      expect(result.data.catalogoItemsGenerados)
        .toBeGreaterThan(0);

    }

  });


});
