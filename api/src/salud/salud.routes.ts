/**
 * Rutas de Salud: /api/v1/criaderos/:criaderoId/aves/:aveId/{diagnosticos,salud}
 */

import { Hono } from 'hono';
import { jwtMiddleware, type AuthUser, type AuthVariables } from '../auth/auth.middleware';
import { createSaludDependencies, type SaludDependencies } from './salud.factory';
import type { Resultado } from './salud.types';

type Env = {
  DB: D1Database;
  JWT_SECRET: string;
};

type DependenciesFactory = (db: D1Database) => SaludDependencies;

function statusDeError(error: string): 400 | 404 | 500 {
  if (error === 'VALIDATION_ERROR') return 400;
  if (error === 'AVE_NO_ENCONTRADA') return 404;
  return 500;
}

const CUERPO_INVALIDO = {
  success: false,
  error: 'VALIDATION_ERROR',
  message: 'Cuerpo JSON inválido',
};

/** Permite inyectar dependencias falsas en las pruebas. */
export function createSaludRouter(buildDependencies: DependenciesFactory = createSaludDependencies) {

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
    console.error('Error en endpoint de salud:', error);
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

  // POST /diagnosticos
  router.post('/diagnosticos', async (c) => {
    const { service } = buildDependencies(c.env.DB);
    const json = await leerJson(c);

    if (!json.ok) return c.json(CUERPO_INVALIDO, 400);

    return responder(
      c,
      await service.registrarDiagnostico(c.req.param('criaderoId')!, c.req.param('aveId')!, json.body),
      201
    );
  });

  // GET /salud
  router.get('/salud', async (c) => {
    const { service } = buildDependencies(c.env.DB);

    return responder(
      c,
      await service.listarHistorial(c.req.param('criaderoId')!, c.req.param('aveId')!),
      200
    );
  });

  return router;

}

export default createSaludRouter();
