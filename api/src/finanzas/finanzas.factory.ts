import { D1CriaderoRepository } from '../criaderos/criaderos.repository';
import { D1FinanzasRepository } from './finanzas.repository';
import { FinanzasService } from './finanzas.service';


export interface FinanzasDependencies {
  service: FinanzasService;
  userOwnsCriadero(userId: string, criaderoId: string): Promise<boolean>;
}


/** `ahora` solo se inyecta en pruebas; por defecto es el instante real. */
export function createFinanzasDependencies(
  db: D1Database,
  ahora: () => Date = () => new Date()
): FinanzasDependencies {

  const service = new FinanzasService(new D1FinanzasRepository(db), undefined, ahora);

  const criaderos = new D1CriaderoRepository(db);


  return {
    service,
    userOwnsCriadero: (userId, criaderoId) =>
      criaderos.userOwnsCriadero(userId, criaderoId)
  };

}
