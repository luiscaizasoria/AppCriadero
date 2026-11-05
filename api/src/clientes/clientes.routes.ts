/**
 * Rutas de Clientes, montadas en /api/v1/criaderos/:criaderoId/clientes (solo lectura):
 *   GET /                        GET /:celular                GET /:celular/compras
 * El celular viaja codificado (encodeURIComponent) como segmento de ruta; Hono lo decodifica.
 */

import { Hono } from 'hono';
import { jwtMiddleware, type AuthUser, type AuthVariables } from '../auth/auth.middleware';
import { createClientesDependencies, type ClientesDependencies } from './clientes.factory';

type Env = {
  DB: D1Database;
  JWT_SECRET: string;
};

type DependenciesFactory = (db: D1Database) => ClientesDependencies;


/** Permite inyectar dependencias falsas en las pruebas. */
export function createClientesRouter(
  buildDependencies: DependenciesFactory = (db) => createClientesDependencies(db)
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
    console.error('Error en endpoint de clientes:', error);
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
    return c.json(await service.listar(c.req.param('criaderoId')!), 200);
  });

  router.get('/:celular/compras', async (c) => {
    const { service } = buildDependencies(c.env.DB);
    return c.json(await service.compras(c.req.param('criaderoId')!, c.req.param('celular')!), 200);
  });

  router.get('/:celular', async (c) => {
    const { service } = buildDependencies(c.env.DB);
    return c.json(await service.obtenerPorCelular(c.req.param('criaderoId')!, c.req.param('celular')!), 200);
  });

  return router;
}

export default createClientesRouter();
