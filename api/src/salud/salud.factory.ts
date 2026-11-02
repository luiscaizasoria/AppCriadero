import { D1CriaderoRepository } from '../criaderos/criaderos.repository';
import { D1SaludRepository } from './salud.repository';
import { SaludService } from './salud.service';


export interface SaludDependencies {
  service: SaludService;
  userOwnsCriadero(userId: string, criaderoId: string): Promise<boolean>;
}


export function createSaludDependencies(db: D1Database): SaludDependencies {

  const service = new SaludService(new D1SaludRepository(db));

  const criaderos = new D1CriaderoRepository(db);


  return {
    service,
    userOwnsCriadero: (userId, criaderoId) =>
      criaderos.userOwnsCriadero(userId, criaderoId)
  };

}
