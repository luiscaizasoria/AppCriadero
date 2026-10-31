import { D1CriaderoRepository } from '../criaderos/criaderos.repository';
import { D1JaulaRepository } from './jaulas.repository';
import { JaulaService } from './jaulas.service';


export interface JaulaDependencies {
  service: JaulaService;
  userOwnsCriadero(userId: string, criaderoId: string): Promise<boolean>;
}


export function createJaulaDependencies(db: D1Database): JaulaDependencies {

  const service = new JaulaService(new D1JaulaRepository(db));

  const criaderos = new D1CriaderoRepository(db);


  return {
    service,
    userOwnsCriadero: (userId, criaderoId) =>
      criaderos.userOwnsCriadero(userId, criaderoId)
  };

}
