/**
 * Rutas para el mÃ³dulo de Criaderos
 */

import { Hono } from 'hono';
import type { D1Database } from '@cloudflare/workers-types';
import { createCriaderoDependencies } from './criaderos.factory';
import type { CreateCriaderoRequest, UpdateConfiguracionRequest } from './criaderos.types';
import { jwtMiddleware, type AuthUser, type AuthVariables } from '../auth/auth.middleware';

type Env = {
  DB: D1Database;
  JWT_SECRET: string;
};

const criaderosRouter = new Hono<{ Bindings: Env, Variables: AuthVariables }>();

// Aplicar middleware JWT a todas las rutas de criaderos
criaderosRouter.use('*', jwtMiddleware);

// POST /api/v1/criaderos
criaderosRouter.post('/', async (c) => {
  const db = c.env.DB;
  const { service, repository } = createCriaderoDependencies(db);
  const user = c.get('user') as AuthUser;

  try {
    const body = await c.req.json<CreateCriaderoRequest>();

    const result = await service.createCriadero(user.id, body);

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
  const { service, repository } = createCriaderoDependencies(db);
  const user = c.get('user') as AuthUser;

  try {
    const criaderoId = c.req.param('criaderoId');
    const body = await c.req.json<UpdateConfiguracionRequest>();

    // Validar propiedad del criadero
    const ownsCriadero = await repository.userOwnsCriadero(user.id, criaderoId!);
    if (!ownsCriadero) {
      return c.json(
        {
          success: false,
          error: 'FORBIDDEN',
          message: 'No tiene permisos sobre este criadero',
        },
        403
      );
    }

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
  const { service, repository } = createCriaderoDependencies(db);
  const user = c.get('user') as AuthUser;

  try {
    const criaderoId = c.req.param('criaderoId');

    // Validar propiedad del criadero
    const ownsCriadero = await repository.userOwnsCriadero(user.id, criaderoId!);
    if (!ownsCriadero) {
      return c.json(
        {
          success: false,
          error: 'FORBIDDEN',
          message: 'No tiene permisos sobre este criadero',
        },
        403
      );
    }

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
  const { service, repository } = createCriaderoDependencies(db);
  const user = c.get('user') as AuthUser;

  try {
    const criaderoId = c.req.param('criaderoId');

    // Validar propiedad del criadero
    const ownsCriadero = await repository.userOwnsCriadero(user.id, criaderoId!);
    if (!ownsCriadero) {
      return c.json(
        {
          success: false,
          error: 'FORBIDDEN',
          message: 'No tiene permisos sobre este criadero',
        },
        403
      );
    }

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

