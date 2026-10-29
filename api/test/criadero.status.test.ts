import { describe, it, expect } from "vitest";
import { CriaderoService } from "../src/criaderos/criaderos.service";
import {
  FakeCriaderoRepository,
  DEFAULT_TEST_CRIADERO_ID
} from "./helpers/fake-criadero.repository";


describe("CriaderoService getOnboardingStatus",()=>{


  it("debe devolver INCOMPLETE_GENERAL cuando faltan datos generales", async()=>{

    const repository = new FakeCriaderoRepository();

    repository.criaderoInfo.pais = null;


    const service = new CriaderoService(repository);


    const result = await service.getOnboardingStatus(
      DEFAULT_TEST_CRIADERO_ID
    );


    expect(result.success)
      .toBe(true);


    if(result.success){

      expect(result.data.status)
        .toBe("INCOMPLETE_GENERAL");


      expect(result.data.currentStep)
        .toBe(1);

    }

  });



  it("debe devolver INCOMPLETE_CONFIGURATION cuando faltan items", async()=>{

    const repository = new FakeCriaderoRepository();


    repository.configuracion = {
      criaderoId: DEFAULT_TEST_CRIADERO_ID,
      especiePrincipalItemId:null,
      razaPrincipalItemId:null,
      tipoCriaderoItemId:null,
      finalidadItemId:null
    };


    const service = new CriaderoService(repository);


    const result = await service.getOnboardingStatus(
      DEFAULT_TEST_CRIADERO_ID
    );


    expect(result.success)
      .toBe(true);


    if(result.success){

      expect(result.data.status)
        .toBe("INCOMPLETE_CONFIGURATION");


      expect(result.data.currentStep)
        .toBe(2);

    }

  });



  it("debe devolver READY_TO_COMPLETE cuando todo esta listo", async()=>{

    const repository = new FakeCriaderoRepository();


    const service = new CriaderoService(repository);


    const result = await service.getOnboardingStatus(
      DEFAULT_TEST_CRIADERO_ID
    );


    expect(result.success)
      .toBe(true);


    if(result.success){

      expect(result.data.status)
        .toBe("READY_TO_COMPLETE");


      expect(result.data.currentStep)
        .toBe(3);

    }

  });



  it("debe devolver COMPLETED cuando ya finalizo", async()=>{

    const repository = new FakeCriaderoRepository();


    repository.criaderoInfo.onboardingCompletado = 1;


    const service = new CriaderoService(repository);


    const result = await service.getOnboardingStatus(
      DEFAULT_TEST_CRIADERO_ID
    );


    expect(result.success)
      .toBe(true);


    if(result.success){

      expect(result.data.status)
        .toBe("COMPLETED");


      expect(result.data.currentStep)
        .toBe(null);

    }

  });


});
