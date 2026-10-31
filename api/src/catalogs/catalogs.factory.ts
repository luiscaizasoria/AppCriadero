import { D1CriaderoRepository } from '../criaderos/criaderos.repository';
import { D1CatalogoRepository } from './catalogs.repository';
import { CatalogoService } from './catalogs.service';


export interface CatalogoDependencies {
  service: CatalogoService;
  userOwnsCriadero(userId: string, criaderoId: string): Promise<boolean>;
}


export function createCatalogoDependencies(db: D1Database): CatalogoDependencies {

  const service = new CatalogoService(new D1CatalogoRepository(db));

  const criaderos = new D1CriaderoRepository(db);


  return {
    service,
    userOwnsCriadero: (userId, criaderoId) =>
      criaderos.userOwnsCriadero(userId, criaderoId)
  };

}
