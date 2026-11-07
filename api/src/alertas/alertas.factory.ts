import { D1CriaderoRepository } from '../criaderos/criaderos.repository';
import { D1AlertasRepository } from './alertas.repository';
import { AlertasService } from './alertas.service';


export interface AlertasDependencies {
  service: AlertasService;
  userOwnsCriadero(userId: string, criaderoId: string): Promise<boolean>;
}


/** `ahora` solo se inyecta en pruebas; por defecto es el instante real. */
export function createAlertasDependencies(
  db: D1Database,
  ahora: () => Date = () => new Date()
): AlertasDependencies {

  const criaderos = new D1CriaderoRepository(db);

  return {
    service: new AlertasService(new D1AlertasRepository(db), ahora),
    userOwnsCriadero: (userId, criaderoId) =>
      criaderos.userOwnsCriadero(userId, criaderoId)
  };

}
