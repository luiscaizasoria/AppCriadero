/**
 * Rutas para el módulo de Criaderos
 */

import { Hono } from 'hono';
import { D1CriaderoRepository } from './criaderos.repository';
import { CriaderoService } from './criaderos.service';
import type { CreateCriaderoRequest, UpdateConfiguracionRequest } from './criaderos.types';

const criaderosRouter = new Hono<{ Bindings: { DB: D1Database } }>();

// POST /api/v1/criaderos
criaderosRouter.post('/', async (c) => {
  const db = c.env.DB;
  const repository = new D1CriaderoRepository(db);
  const service = new CriaderoService(repository);

  try {
    const body = await c.req.json<CreateCriaderoRequest>();

    const result = await service.createCriadero(body);

    if (result.success) {
      return c.json(result, 201);
    } else {
      if (result.error === 'VALIDATION_ERROR') {
        return c.json(result, 400);
      }
      if (result.error === 'USER_NOT_FOUND') {
        return c.json(result, 404);
      }
      return c.json(result, 500);
    }
  } catch (error) {
    console.error('Error en endpoint POST /criaderos:', error);
    return c.json(
      {
        success: false,
        error: 'INTERNAL_ERROR',
        message: 'Error interno del servidor',
      },
      500
    );
  }
});

// PUT /api/v1/criaderos/:criaderoId/configuracion
criaderosRouter.put('/:criaderoId/configuracion', async (c) => {
  const db = c.env.DB;
  const repository = new D1CriaderoRepository(db);
  const service = new CriaderoService(repository);

  try {
    const criaderoId = c.req.param('criaderoId');
    const body = await c.req.json<UpdateConfiguracionRequest>();

    const result = await service.updateConfiguracion(criaderoId!, body);

    if (result.success) {
      return c.json(result, 200);
    } else {
      if (result.error === 'VALIDATION_ERROR') {
        return c.json(result, 400);
      }
      if (result.error === 'CRIADERO_NOT_FOUND' ||
          result.error === 'ITEMS_NOT_FOUND') {
        return c.json(result, 404);
      }
      if (result.error === 'CRIADERO_CONFIGURATION_MISSING' ||
          result.error === 'CONFIGURATION_CONCURRENCY_CONFLICT') {
        return c.json(result, 409);
      }
      return c.json(result, 500);
    }
  } catch (error) {
    console.error('Error en endpoint PUT /criaderos/:criaderoId/configuracion:', error);
    return c.json(
      {
        success: false,
        error: 'INTERNAL_ERROR',
        message: 'Error interno del servidor',
      },
      500
    );
  }
});

export default criaderosRouter;
