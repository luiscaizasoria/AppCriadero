import type { D1Database } from "@cloudflare/workers-types";
import { D1CriaderoRepository } from "./criaderos.repository";
import { CriaderoService } from "./criaderos.service";


export function createCriaderoDependencies(
  db: D1Database
){

  const repository = new D1CriaderoRepository(db);

  const service = new CriaderoService(repository);


  return {
    repository,
    service
  };

}
