/**
 * Rutas de Inicio (dashboard), montadas en /api/v1/criaderos/:criaderoId/dashboard (solo lectura):
 *   GET /   -> { success, data: <objeto del dashboard> }
 */

import { Hono } from 'hono';
import { jwtMiddleware, type AuthUser, type AuthVariables } from '../auth/auth.middleware';
import { createInicioDependencies, type InicioDependencies } from './inicio.factory';

type Env = {
  DB: D1Database;
  JWT_SECRET: string;
};

type DependenciesFactory = (db: D1Database) => InicioDependencies;


/** Permite inyectar dependencias falsas en las pruebas. */
export function createInicioRouter(
  buildDependencies: DependenciesFactory = (db) => createInicioDependencies(db)
) {

  const router = new Hono<{ Bindings: Env; Variables: AuthVariables }>();

  router.use('*', jwtMiddleware);

  // Propiedad del criadero antes de cualquier consulta.
  router.use('*', async (c, next) => {
    const user = c.get('user') as AuthUser;
    const { userOwnsCriadero } = buildDependencies(c.env.DB);
    const criaderoId = c.req.param('criaderoId') ?? '';

    if (!(await userOwnsCriadero(user.id, criaderoId))) {
      return c.json(
        {
          success: false,
          error: 'FORBIDDEN',
          message: 'No tiene permisos sobre este criadero',
        },
        403
      );
    }

    await next();
  });

  router.onError((error, c) => {
    console.error('Error en endpoint de inicio:', error);
    return c.json(
      {
        success: false,
        error: 'INTERNAL_ERROR',
        message: 'Error interno del servidor',
      },
      500
    );
  });

  router.get('/', async (c) => {
    const { service } = buildDependencies(c.env.DB);
    return c.json(await service.obtener(c.req.param('criaderoId')!), 200);
  });

  return router;
}

export default createInicioRouter();
