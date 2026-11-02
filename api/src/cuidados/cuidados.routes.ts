/**
 * Rutas de Cuidados de jaula: /api/v1/criaderos/:criaderoId/jaulas/:jaulaId/{alimentacion,bebida,sanidad}
 */

import { Hono } from 'hono';
import { jwtMiddleware, type AuthUser, type AuthVariables } from '../auth/auth.middleware';
import { createCuidadosDependencies, type CuidadosDependencies } from './cuidados.factory';
import type { Resultado } from './cuidados.types';

type Env = {
  DB: D1Database;
  JWT_SECRET: string;
};

type DependenciesFactory = (db: D1Database) => CuidadosDependencies;

function statusDeError(error: string): 400 | 404 | 500 {
  if (error === 'VALIDATION_ERROR') return 400;
  if (error === 'JAULA_NO_ENCONTRADA') return 404;
  return 500;
}

const CUERPO_INVALIDO = {
  success: false,
  error: 'VALIDATION_ERROR',
  message: 'Cuerpo JSON inválido',
};

/** Permite inyectar dependencias falsas en las pruebas. */
export function createCuidadosRouter(buildDependencies: DependenciesFactory = createCuidadosDependencies) {

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
    console.error('Error en endpoint de cuidados:', error);
    return c.json(
      {
        success: false,
        error: 'INTERNAL_ERROR',
        message: 'Error interno del servidor',
      },
      500
    );
  });

  function responder(c: any, resultado: Resultado<unknown>, statusOk: 200 | 201) {
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

  router.post('/alimentacion', async (c) => {
    const { service } = buildDependencies(c.env.DB);
    const json = await leerJson(c);

    if (!json.ok) return c.json(CUERPO_INVALIDO, 400);

    return responder(
      c,
      await service.crearAlimentacion(c.req.param('criaderoId')!, c.req.param('jaulaId')!, json.body),
      201
    );
  });

  router.post('/bebida', async (c) => {
    const { service } = buildDependencies(c.env.DB);
    const json = await leerJson(c);

    if (!json.ok) return c.json(CUERPO_INVALIDO, 400);

    return responder(
      c,
      await service.crearBebida(c.req.param('criaderoId')!, c.req.param('jaulaId')!, json.body),
      201
    );
  });

  router.post('/sanidad', async (c) => {
    const { service } = buildDependencies(c.env.DB);
    const json = await leerJson(c);

    if (!json.ok) return c.json(CUERPO_INVALIDO, 400);

    return responder(
      c,
      await service.crearSanidad(c.req.param('criaderoId')!, c.req.param('jaulaId')!, json.body),
      201
    );
  });

  router.get('/alimentacion', async (c) => {
    const { service } = buildDependencies(c.env.DB);

    return responder(
      c,
      await service.listarAlimentacion(c.req.param('criaderoId')!, c.req.param('jaulaId')!),
      200
    );
  });

  return router;

}

export default createCuidadosRouter();
