import { D1CriaderoRepository } from '../criaderos/criaderos.repository';
import { D1InicioRepository } from './inicio.repository';
import { InicioService } from './inicio.service';


export interface InicioDependencies {
  service: InicioService;
  userOwnsCriadero(userId: string, criaderoId: string): Promise<boolean>;
}


/** `ahora` solo se inyecta en pruebas; por defecto es el instante real. */
export function createInicioDependencies(
  db: D1Database,
  ahora: () => Date = () => new Date()
): InicioDependencies {

  const criaderos = new D1CriaderoRepository(db);

  return {
    service: new InicioService(new D1InicioRepository(db), ahora),
    userOwnsCriadero: (userId, criaderoId) =>
      criaderos.userOwnsCriadero(userId, criaderoId)
  };

}
