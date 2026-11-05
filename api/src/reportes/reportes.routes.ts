/**
 * Rutas de Reportes, montadas en /api/v1/criaderos/:criaderoId/reportes (solo lectura):
 *   GET /aves  /salud  /produccion  /finanzas
 *   GET /exportaciones/{aves,ventas,clientes,finanzas,huevos,jaulas}
 * Las filas de las exportaciones llevan claves PascalCase (cabeceras del CSV de V1).
 */

import { Hono } from 'hono';
import { jwtMiddleware, type AuthUser, type AuthVariables } from '../auth/auth.middleware';
import { createReportesDependencies, type ReportesDependencies } from './reportes.factory';

type Env = {
  DB: D1Database;
  JWT_SECRET: string;
};

type DependenciesFactory = (db: D1Database) => ReportesDependencies;


/** Permite inyectar dependencias falsas en las pruebas. */
export function createReportesRouter(
  buildDependencies: DependenciesFactory = (db) => createReportesDependencies(db)
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
    console.error('Error en endpoint de reportes:', error);
    return c.json(
      {
        success: false,
        error: 'INTERNAL_ERROR',
        message: 'Error interno del servidor',
      },
      500
    );
  });

  router.get('/aves', async (c) => {
    const { service } = buildDependencies(c.env.DB);
    return c.json(await service.aves(c.req.param('criaderoId')!), 200);
  });

  router.get('/salud', async (c) => {
    const { service } = buildDependencies(c.env.DB);
    return c.json(await service.salud(c.req.param('criaderoId')!), 200);
  });

  router.get('/produccion', async (c) => {
    const { service } = buildDependencies(c.env.DB);
    return c.json(await service.produccion(c.req.param('criaderoId')!), 200);
  });

  router.get('/finanzas', async (c) => {
    const { service } = buildDependencies(c.env.DB);
    return c.json(await service.finanzas(c.req.param('criaderoId')!), 200);
  });

  router.get('/exportaciones/aves', async (c) => {
    const { service } = buildDependencies(c.env.DB);
    return c.json(await service.exportarAves(c.req.param('criaderoId')!), 200);
  });

  router.get('/exportaciones/ventas', async (c) => {
    const { service } = buildDependencies(c.env.DB);
    return c.json(await service.exportarVentas(c.req.param('criaderoId')!), 200);
  });

  router.get('/exportaciones/clientes', async (c) => {
    const { service } = buildDependencies(c.env.DB);
    return c.json(await service.exportarClientes(c.req.param('criaderoId')!), 200);
  });

  router.get('/exportaciones/finanzas', async (c) => {
    const { service } = buildDependencies(c.env.DB);
    return c.json(await service.exportarFinanzas(c.req.param('criaderoId')!), 200);
  });

  router.get('/exportaciones/huevos', async (c) => {
    const { service } = buildDependencies(c.env.DB);
    return c.json(await service.exportarHuevos(c.req.param('criaderoId')!), 200);
  });

  router.get('/exportaciones/jaulas', async (c) => {
    const { service } = buildDependencies(c.env.DB);
    return c.json(await service.exportarJaulas(c.req.param('criaderoId')!), 200);
  });

  return router;
}

export default createReportesRouter();
