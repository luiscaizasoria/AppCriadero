/**
 * Rutas de Huevos, montadas en /api/v1/criaderos/:criaderoId:
 *   POST|GET /aves/:aveId/huevos
 *   GET /huevos/siguiente-codigo
 *   GET /huevos/produccion/{resumen,ranking,por-dia,por-dia-historico,por-hora,por-jaula,por-ave,total}
 * Los middlewares se limitan a esas rutas para no interceptar las de otros modulos.
 */

import { Hono } from 'hono';
import { jwtMiddleware, type AuthUser, type AuthVariables } from '../auth/auth.middleware';
import { createHuevosDependencies, type HuevosDependencies } from './huevos.factory';
import type { Resultado } from './huevos.types';

type Env = {
  DB: D1Database;
  JWT_SECRET: string;
};

type DependenciesFactory = (db: D1Database) => HuevosDependencies;

function statusDeError(error: string): 400 | 404 | 500 {
  if (error === 'VALIDATION_ERROR') return 400;
  if (error === 'AVE_NO_ENCONTRADA' || error === 'JAULA_NO_ENCONTRADA') return 404;
  return 500;
}

const CUERPO_INVALIDO = {
  success: false,
  error: 'VALIDATION_ERROR',
  message: 'Cuerpo JSON inválido',
};

/** Permite inyectar dependencias falsas en las pruebas. */
export function createHuevosRouter(
  buildDependencies: DependenciesFactory = (db) => createHuevosDependencies(db)
) {

  const router = new Hono<{ Bindings: Env; Variables: AuthVariables }>();

  for (const ruta of ['/aves/:aveId/huevos', '/huevos/*']) {

    router.use(ruta, jwtMiddleware);

    // Propiedad del criadero antes de cualquier consulta o cambio.
    router.use(ruta, async (c, next) => {
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

  }

  router.onError((error, c) => {
    console.error('Error en endpoint de huevos:', error);
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

  // POST /aves/:aveId/huevos
  router.post('/aves/:aveId/huevos', async (c) => {
    const { service } = buildDependencies(c.env.DB);
    const json = await leerJson(c);

    if (!json.ok) return c.json(CUERPO_INVALIDO, 400);

    return responder(
      c,
      await service.registrar(c.req.param('criaderoId')!, c.req.param('aveId')!, json.body),
      201
    );
  });

  // GET /aves/:aveId/huevos
  router.get('/aves/:aveId/huevos', async (c) => {
    const { service } = buildDependencies(c.env.DB);

    return responder(
      c,
      await service.listarPorAve(c.req.param('criaderoId')!, c.req.param('aveId')!),
      200
    );
  });

  router.get('/huevos/siguiente-codigo', async (c) => {
    const { service } = buildDependencies(c.env.DB);
    return responder(c, await service.siguienteCodigo(c.req.param('criaderoId')!), 200);
  });

  router.get('/huevos/produccion/resumen', async (c) => {
    const { service } = buildDependencies(c.env.DB);
    return responder(c, await service.resumen(c.req.param('criaderoId')!), 200);
  });

  router.get('/huevos/produccion/ranking', async (c) => {
    const { service } = buildDependencies(c.env.DB);
    return responder(c, await service.ranking(c.req.param('criaderoId')!), 200);
  });

  router.get('/huevos/produccion/por-dia', async (c) => {
    const { service } = buildDependencies(c.env.DB);
    return responder(c, await service.porDia(c.req.param('criaderoId')!), 200);
  });

  router.get('/huevos/produccion/por-dia-historico', async (c) => {
    const { service } = buildDependencies(c.env.DB);
    return responder(c, await service.porDiaHistorico(c.req.param('criaderoId')!), 200);
  });

  router.get('/huevos/produccion/por-hora', async (c) => {
    const { service } = buildDependencies(c.env.DB);
    return responder(c, await service.porHora(c.req.param('criaderoId')!), 200);
  });

  router.get('/huevos/produccion/por-jaula', async (c) => {
    const { service } = buildDependencies(c.env.DB);
    return responder(c, await service.porJaula(c.req.param('criaderoId')!), 200);
  });

  router.get('/huevos/produccion/por-ave', async (c) => {
    const { service } = buildDependencies(c.env.DB);
    return responder(c, await service.porAve(c.req.param('criaderoId')!), 200);
  });

  router.get('/huevos/produccion/total', async (c) => {
    const { service } = buildDependencies(c.env.DB);
    return responder(c, await service.total(c.req.param('criaderoId')!), 200);
  });

  return router;

}

export default createHuevosRouter();
