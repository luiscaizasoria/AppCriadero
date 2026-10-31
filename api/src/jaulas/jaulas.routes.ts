/**
 * Rutas del modulo de Jaulas: /api/v1/criaderos/:criaderoId/jaulas
 */

import { Hono } from 'hono';
import { jwtMiddleware, type AuthUser, type AuthVariables } from '../auth/auth.middleware';
import { createJaulaDependencies, type JaulaDependencies } from './jaulas.factory';
import type { EstadoJaulas, Resultado } from './jaulas.types';

type Env = {
  DB: D1Database;
  JWT_SECRET: string;
};

type DependenciesFactory = (db: D1Database) => JaulaDependencies;

function statusDeError(error: string): 400 | 404 | 409 | 500 {
  if (error === 'VALIDATION_ERROR') return 400;
  if (error === 'JAULA_NO_ENCONTRADA') return 404;
  if (error === 'UNIQUE_JAULAS_CODIGO') return 409;
  return 500;
}

const CUERPO_INVALIDO = {
  success: false,
  error: 'VALIDATION_ERROR',
  message: 'Cuerpo JSON inválido',
};

/** Permite inyectar dependencias falsas en las pruebas. */
export function createJaulasRouter(buildDependencies: DependenciesFactory = createJaulaDependencies) {

  const router = new Hono<{ Bindings: Env; Variables: AuthVariables }>();

  router.use('*', jwtMiddleware);

  // Propiedad del criadero antes de cualquier consulta o cambio.
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
    console.error('Error en endpoint de jaulas:', error);
    return c.json(
      {
        success: false,
        error: 'INTERNAL_ERROR',
        message: 'Error interno del servidor',
      },
      500
    );
  });

  function responder(c: any, resultado: Resultado<unknown>, statusOk: 200 | 201 = 200) {
    if (resultado.success) return c.json(resultado, statusOk);
    return c.json(resultado, statusDeError(resultado.error));
  }

  async function leerJson(c: any): Promise<{ ok: true; body: unknown } | { ok: false }> {
    try {
      return { ok: true, body: await c.req.json() };
    } catch {
      return { ok: false };
    }
  }

  // GET /jaulas?estado=ACTIVA|INACTIVA
  router.get('/', async (c) => {
    const { service } = buildDependencies(c.env.DB);
    const estado = c.req.query('estado') ?? 'ACTIVA';

    if (estado !== 'ACTIVA' && estado !== 'INACTIVA') {
      return c.json(
        {
          success: false,
          error: 'VALIDATION_ERROR',
          message: 'estado debe ser ACTIVA o INACTIVA',
        },
        400
      );
    }

    return responder(c, await service.listar(c.req.param('criaderoId')!, estado as EstadoJaulas));
  });

  // GET /jaulas/:jaulaId
  router.get('/:jaulaId', async (c) => {
    const { service } = buildDependencies(c.env.DB);

    return responder(c, await service.obtener(c.req.param('criaderoId')!, c.req.param('jaulaId')));
  });

  // POST /jaulas
  router.post('/', async (c) => {
    const { service } = buildDependencies(c.env.DB);
    const json = await leerJson(c);

    if (!json.ok) return c.json(CUERPO_INVALIDO, 400);

    return responder(c, await service.crear(c.req.param('criaderoId')!, json.body), 201);
  });

  // PUT /jaulas/:jaulaId
  router.put('/:jaulaId', async (c) => {
    const { service } = buildDependencies(c.env.DB);
    const json = await leerJson(c);

    if (!json.ok) return c.json(CUERPO_INVALIDO, 400);

    return responder(
      c,
      await service.actualizar(c.req.param('criaderoId')!, c.req.param('jaulaId'), json.body)
    );
  });

  // DELETE /jaulas/:jaulaId  (baja logica: activa = 0)
  router.delete('/:jaulaId', async (c) => {
    const { service } = buildDependencies(c.env.DB);

    return responder(c, await service.desactivar(c.req.param('criaderoId')!, c.req.param('jaulaId')));
  });

  return router;

}

export default createJaulasRouter();
