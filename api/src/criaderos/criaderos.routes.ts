/**
 * Rutas para el módulo de Criaderos
 */

import { Hono } from 'hono';
import type { D1Database } from '@cloudflare/workers-types';
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

// POST /api/v1/criaderos/:criaderoId/onboarding/complete
criaderosRouter.post('/:criaderoId/onboarding/complete', async (c) => {
  const db = c.env.DB;
  const repository = new D1CriaderoRepository(db);
  const service = new CriaderoService(repository);

  try {
    const criaderoId = c.req.param('criaderoId');

    const result = await service.completeOnboarding(criaderoId!);

    if (result.success) {
      return c.json(result, 200);
    } else {
      if (result.error === 'VALIDATION_ERROR') {
        return c.json(result, 400);
      }
      if (result.error === 'CRIADERO_NOT_FOUND') {
        return c.json(result, 404);
      }
      if (result.error === 'ONBOARDING_INCOMPLETE' ||
          result.error === 'CRIADERO_CONFIGURATION_MISSING' ||
          result.error === 'CRIADERO_CONCURRENCY_CONFLICT') {
        return c.json(result, 409);
      }
      if (result.error === 'ITEM_WRONG_CRIADERO' ||
          result.error === 'ITEM_NOT_ACTIVE' ||
          result.error === 'ITEM_DELETED' ||
          result.error === 'ITEM_WRONG_CATALOG') {
        return c.json(result, 400);
      }
      return c.json(result, 500);
    }
  } catch (error) {
    console.error('Error en endpoint POST /criaderos/:criaderoId/onboarding/complete:', error);
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

// GET /api/v1/criaderos/:criaderoId/onboarding
criaderosRouter.get('/:criaderoId/onboarding', async (c) => {
  const db = c.env.DB;
  const repository = new D1CriaderoRepository(db);
  const service = new CriaderoService(repository);

  try {
    const criaderoId = c.req.param('criaderoId');

    const result = await service.getOnboardingStatus(criaderoId!);

    if (result.success) {
      return c.json(result, 200);
    } else {
      if (result.error === 'VALIDATION_ERROR') {
        return c.json(result, 400);
      }
      if (result.error === 'CRIADERO_NOT_FOUND') {
        return c.json(result, 404);
      }
      return c.json(result, 500);
    }
  } catch (error) {
    console.error('Error en endpoint GET /criaderos/:criaderoId/onboarding:', error);
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
