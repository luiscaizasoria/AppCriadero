import { describe, it, expect } from "vitest";
import { CriaderoService } from "../src/criaderos/criaderos.service";
import {
  FakeCriaderoRepository,
  DEFAULT_TEST_CRIADERO_ID
} from "./helpers/fake-criadero.repository";


describe("CriaderoService completeOnboarding",()=>{


  it("debe rechazar criadero inexistente", async()=>{

    const repository = new FakeCriaderoRepository();

    repository.criaderoExiste = false;


    const service = new CriaderoService(repository);


    const result = await service.completeOnboarding(
      DEFAULT_TEST_CRIADERO_ID
    );


    expect(result.success)
      .toBe(false);


    if(!result.success){

      expect(result.error)
        .toBe("CRIADERO_NOT_FOUND");

    }

  });



  it("debe completar onboarding correctamente", async()=>{

    const repository = new FakeCriaderoRepository();


    const service = new CriaderoService(repository);


    const result = await service.completeOnboarding(
      DEFAULT_TEST_CRIADERO_ID
    );


    expect(result.success)
      .toBe(true);


    expect(repository.completed)
      .toBe(true);

  });



  it("debe ser idempotente cuando ya está completado", async()=>{

    const repository = new FakeCriaderoRepository();

    repository.criaderoInfo.onboardingCompletado = 1;


    const service = new CriaderoService(repository);


    const result = await service.completeOnboarding(
      DEFAULT_TEST_CRIADERO_ID
    );


    expect(result.success)
      .toBe(true);


    if(result.success){

      expect(result.data.alreadyCompleted)
        .toBe(true);

    }

  });



});
