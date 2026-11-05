import { D1CriaderoRepository } from '../criaderos/criaderos.repository';
import { D1ClientesRepository } from './clientes.repository';
import { ClientesService } from './clientes.service';


export interface ClientesDependencies {
  service: ClientesService;
  userOwnsCriadero(userId: string, criaderoId: string): Promise<boolean>;
}


export function createClientesDependencies(db: D1Database): ClientesDependencies {

  const criaderos = new D1CriaderoRepository(db);

  return {
    service: new ClientesService(new D1ClientesRepository(db)),
    userOwnsCriadero: (userId, criaderoId) =>
      criaderos.userOwnsCriadero(userId, criaderoId)
  };

}
