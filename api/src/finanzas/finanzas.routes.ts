/**
 * Rutas de Finanzas, montadas en /api/v1/criaderos/:criaderoId/finanzas:
 *   GET  /resumen?periodo=            GET  /movimientos
 *   POST /ingresos                    POST /egresos
 *   GET  /movimientos/:movimientoId   PUT  /movimientos/:movimientoId
 *   GET  /movimientos/:movimientoId/historial
 *   GET  /ventas/:bajaId              POST /ventas/:bajaId/correccion
 *   GET  /consolidado/categorias?periodo=   GET /consolidado/mensual?limite=
 */

import { Hono } from 'hono';
import { jwtMiddleware, type AuthUser, type AuthVariables } from '../auth/auth.middleware';
import { createFinanzasDependencies, type FinanzasDependencies } from './finanzas.factory';
import type { Resultado } from './finanzas.types';

type Env = {
  DB: D1Database;
  JWT_SECRET: string;
};

type DependenciesFactory = (db: D1Database) => FinanzasDependencies;

function statusDeError(error: string): 400 | 404 | 409 | 500 {
  if (error === 'VALIDATION_ERROR' || error === 'VALOR_INVALIDO') return 400;
  if (error === 'MOVIMIENTO_NO_ENCONTRADO' || error === 'VENTA_NO_ENCONTRADA') return 404;
  if (error === 'MOVIMIENTO_AUTOMATICO_NO_EDITABLE') return 409;
  return 500;
}

const CUERPO_INVALIDO = {
  success: false,
  error: 'VALIDATION_ERROR',
  message: 'Cuerpo JSON inválido',
};

/** Permite inyectar dependencias falsas en las pruebas. */
export function createFinanzasRouter(
  buildDependencies: DependenciesFactory = (db) => createFinanzasDependencies(db)
) {

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
    console.error('Error en endpoint de finanzas:', error);
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

  router.get('/resumen', async (c) => {
    const { service } = buildDependencies(c.env.DB);
    return responder(c, await service.resumen(c.req.param('criaderoId')!, c.req.query('periodo')), 200);
  });

  router.get('/movimientos', async (c) => {
    const { service } = buildDependencies(c.env.DB);
    return responder(c, await service.listarMovimientos(c.req.param('criaderoId')!), 200);
  });

  router.post('/ingresos', async (c) => {
    const { service } = buildDependencies(c.env.DB);
    const json = await leerJson(c);

    if (!json.ok) return c.json(CUERPO_INVALIDO, 400);

    return responder(c, await service.registrarManual(c.req.param('criaderoId')!, 'INGRESO', json.body), 201);
  });

  router.post('/egresos', async (c) => {
    const { service } = buildDependencies(c.env.DB);
    const json = await leerJson(c);

    if (!json.ok) return c.json(CUERPO_INVALIDO, 400);

    return responder(c, await service.registrarManual(c.req.param('criaderoId')!, 'EGRESO', json.body), 201);
  });

  router.get('/movimientos/:movimientoId/historial', async (c) => {
    const { service } = buildDependencies(c.env.DB);
    return responder(
      c,
      await service.historial(c.req.param('criaderoId')!, c.req.param('movimientoId')!),
      200
    );
  });

  router.get('/movimientos/:movimientoId', async (c) => {
    const { service } = buildDependencies(c.env.DB);
    return responder(
      c,
      await service.obtenerMovimiento(c.req.param('criaderoId')!, c.req.param('movimientoId')!),
      200
    );
  });

  router.put('/movimientos/:movimientoId', async (c) => {
    const { service } = buildDependencies(c.env.DB);
    const json = await leerJson(c);

    if (!json.ok) return c.json(CUERPO_INVALIDO, 400);

    return responder(
      c,
      await service.actualizarManual(c.req.param('criaderoId')!, c.req.param('movimientoId')!, json.body),
      200
    );
  });

  router.post('/ventas/:bajaId/correccion', async (c) => {
    const { service } = buildDependencies(c.env.DB);
    const json = await leerJson(c);

    if (!json.ok) return c.json(CUERPO_INVALIDO, 400);

    return responder(
      c,
      await service.corregirVenta(c.req.param('criaderoId')!, c.req.param('bajaId')!, json.body),
      200
    );
  });

  router.get('/ventas/:bajaId', async (c) => {
    const { service } = buildDependencies(c.env.DB);
    return responder(
      c,
      await service.obtenerVenta(c.req.param('criaderoId')!, c.req.param('bajaId')!),
      200
    );
  });

  router.get('/consolidado/categorias', async (c) => {
    const { service } = buildDependencies(c.env.DB);
    return responder(
      c,
      await service.consolidadoCategorias(c.req.param('criaderoId')!, c.req.query('periodo')),
      200
    );
  });

  router.get('/consolidado/mensual', async (c) => {
    const { service } = buildDependencies(c.env.DB);
    return responder(
      c,
      await service.consolidadoMensual(c.req.param('criaderoId')!, c.req.query('limite')),
      200
    );
  });

  return router;

}

export default createFinanzasRouter();
