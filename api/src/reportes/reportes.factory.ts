import { D1CriaderoRepository } from '../criaderos/criaderos.repository';
import { D1ReportesRepository } from './reportes.repository';
import { ReportesService } from './reportes.service';


export interface ReportesDependencies {
  service: ReportesService;
  userOwnsCriadero(userId: string, criaderoId: string): Promise<boolean>;
}


/** `ahora` solo se inyecta en pruebas; por defecto es el instante real. */
export function createReportesDependencies(
  db: D1Database,
  ahora: () => Date = () => new Date()
): ReportesDependencies {

  const criaderos = new D1CriaderoRepository(db);

  return {
    service: new ReportesService(new D1ReportesRepository(db), ahora),
    userOwnsCriadero: (userId, criaderoId) =>
      criaderos.userOwnsCriadero(userId, criaderoId)
  };

}
