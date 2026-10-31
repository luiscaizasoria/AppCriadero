/**
 * Rutas del modulo de Catalogos: /api/v1/criaderos/:criaderoId/catalogos
 */

import { Hono } from 'hono';
import { jwtMiddleware, type AuthUser, type AuthVariables } from '../auth/auth.middleware';
import { createCatalogoDependencies, type CatalogoDependencies } from './catalogs.factory';
import type { Resultado } from './catalogs.types';

type Env = {
  DB: D1Database;
  JWT_SECRET: string;
};

type DependenciesFactory = (db: D1Database) => CatalogoDependencies;

function statusDeError(error: string): 400 | 404 | 409 | 500 {
  if (error === 'VALIDATION_ERROR') return 400;
  if (error === 'CATALOGO_NOT_FOUND' || error === 'CATALOGO_ITEM_NOT_FOUND') return 404;
  if (error === 'UNIQUE_CATALOGO_ITEMS_CODIGO') return 409;
  return 500;
}

const CUERPO_INVALIDO = {
  success: false,
  error: 'VALIDATION_ERROR',
  message: 'Cuerpo JSON inválido',
};

/** Permite inyectar dependencias falsas en las pruebas. */
export function createCatalogosRouter(
  buildDependencies: DependenciesFactory = createCatalogoDependencies
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
    console.error('Error en endpoint de catalogos:', error);
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

  // GET /catalogos
  router.get('/', async (c) => {
    const { service } = buildDependencies(c.env.DB);

    return responder(c, await service.listarCatalogos());
  });

  // GET /catalogos/:catalogoCodigo
  router.get('/:catalogoCodigo', async (c) => {
    const { service } = buildDependencies(c.env.DB);

    return responder(c, await service.obtenerCatalogo(c.req.param('catalogoCodigo')!));
  });

  // GET /catalogos/:catalogoCodigo/items
  router.get('/:catalogoCodigo/items', async (c) => {
    const { service } = buildDependencies(c.env.DB);

    return responder(
      c,
      await service.listarItems(c.req.param('criaderoId')!, c.req.param('catalogoCodigo')!)
    );
  });

  // POST /catalogos/:catalogoCodigo/items
  router.post('/:catalogoCodigo/items', async (c) => {
    const { service } = buildDependencies(c.env.DB);
    const json = await leerJson(c);

    if (!json.ok) return c.json(CUERPO_INVALIDO, 400);

    return responder(
      c,
      await service.crearItem(
        c.req.param('criaderoId')!,
        c.req.param('catalogoCodigo')!,
        json.body
      ),
      201
    );
  });

  // PUT /catalogos/:catalogoCodigo/items/:itemId
  router.put('/:catalogoCodigo/items/:itemId', async (c) => {
    const { service } = buildDependencies(c.env.DB);
    const json = await leerJson(c);

    if (!json.ok) return c.json(CUERPO_INVALIDO, 400);

    return responder(
      c,
      await service.actualizarItem(
        c.req.param('criaderoId')!,
        c.req.param('catalogoCodigo')!,
        c.req.param('itemId')!,
        json.body
      )
    );
  });

  // DELETE /catalogos/:catalogoCodigo/items/:itemId  (activo = 0)
  router.delete('/:catalogoCodigo/items/:itemId', async (c) => {
    const { service } = buildDependencies(c.env.DB);

    return responder(
      c,
      await service.desactivarItem(
        c.req.param('criaderoId')!,
        c.req.param('catalogoCodigo')!,
        c.req.param('itemId')!
      )
    );
  });

  return router;

}

export default createCatalogosRouter();
