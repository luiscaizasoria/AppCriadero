import { D1CriaderoRepository } from '../criaderos/criaderos.repository';
import { D1AveRepository } from './aves.repository';
import { AveService } from './aves.service';


export interface AveDependencies {
  service: AveService;
  userOwnsCriadero(userId: string, criaderoId: string): Promise<boolean>;
}


export function createAveDependencies(db: D1Database): AveDependencies {

  const service = new AveService(new D1AveRepository(db));

  const criaderos = new D1CriaderoRepository(db);


  return {
    service,
    userOwnsCriadero: (userId, criaderoId) =>
      criaderos.userOwnsCriadero(userId, criaderoId)
  };

}
