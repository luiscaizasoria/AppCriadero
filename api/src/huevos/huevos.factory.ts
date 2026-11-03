import { D1CriaderoRepository } from '../criaderos/criaderos.repository';
import { D1HuevosRepository } from './huevos.repository';
import { HuevosService } from './huevos.service';


export interface HuevosDependencies {
  service: HuevosService;
  userOwnsCriadero(userId: string, criaderoId: string): Promise<boolean>;
}


/** `ahora` solo se inyecta en pruebas; por defecto es el instante real. */
export function createHuevosDependencies(
  db: D1Database,
  ahora: () => Date = () => new Date()
): HuevosDependencies {

  const service = new HuevosService(new D1HuevosRepository(db), undefined, ahora);

  const criaderos = new D1CriaderoRepository(db);


  return {
    service,
    userOwnsCriadero: (userId, criaderoId) =>
      criaderos.userOwnsCriadero(userId, criaderoId)
  };

}
