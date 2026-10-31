import { describe, it, expect } from "vitest";
import { CriaderoService } from "../src/criaderos/criaderos.service";
import { FakeCriaderoRepository } from "./helpers/fake-criadero.repository";


describe("CriaderoService.listCriaderos",()=>{


  it("debe devolver los criaderos del usuario con onboardingCompletado como booleano", async()=>{

    const repository = new FakeCriaderoRepository();

    repository.criaderosDelUsuario = [
      { id:"c1", nombre:"Criadero Uno", onboardingCompletado:1 },
      { id:"c2", nombre:"Criadero Dos", onboardingCompletado:0 }
    ];

    const service = new CriaderoService(repository);

    const resultado = await service.listCriaderos("user-1");

    expect(resultado).toEqual({
      success:true,
      data:{
        criaderos:[
          { id:"c1", nombre:"Criadero Uno", onboardingCompletado:true },
          { id:"c2", nombre:"Criadero Dos", onboardingCompletado:false }
        ]
      }
    });

  });


  it("debe devolver una lista vacía si el usuario no tiene criaderos", async()=>{

    const service = new CriaderoService(new FakeCriaderoRepository());

    const resultado = await service.listCriaderos("user-1");

    expect(resultado.data.criaderos).toEqual([]);

  });

});
