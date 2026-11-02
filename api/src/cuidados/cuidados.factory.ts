import { D1CriaderoRepository } from '../criaderos/criaderos.repository';
import { D1CuidadosRepository } from './cuidados.repository';
import { CuidadosService } from './cuidados.service';


export interface CuidadosDependencies {
  service: CuidadosService;
  userOwnsCriadero(userId: string, criaderoId: string): Promise<boolean>;
}


export function createCuidadosDependencies(db: D1Database): CuidadosDependencies {

  const service = new CuidadosService(new D1CuidadosRepository(db));

  const criaderos = new D1CriaderoRepository(db);


  return {
    service,
    userOwnsCriadero: (userId, criaderoId) =>
      criaderos.userOwnsCriadero(userId, criaderoId)
  };

}
