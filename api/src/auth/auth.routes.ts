/**
 * Rutas para el mÃ³dulo de AutenticaciÃ³n
 */

import { Hono } from 'hono';
import type { D1Database } from '@cloudflare/workers-types';
import { createAuthService } from './auth.factory';
import type { RegisterRequest, LoginRequest } from './auth.types';

type Env = {
  DB: D1Database;
  JWT_SECRET: string;
};

const authRouter = new Hono<{ Bindings: Env }>();

// POST /api/v1/auth/register
authRouter.post('/register', async (c) => {
  const db = c.env.DB;
  const jwtSecret = c.env.JWT_SECRET;

  if (!jwtSecret) {
    return c.json(
      {
        success: false,
        error: 'CONFIGURATION_ERROR',
        message: 'JWT_SECRET no configurado',
      },
      500
    );
  }

  const service = createAuthService(db, jwtSecret);

  try {
    const body = await c.req.json<RegisterRequest>();

    const result = await service.register(body);

    if (result.success) {
      return c.json(result, 201);
    } else {
      if (result.error === 'VALIDATION_ERROR') {
        return c.json(result, 400);
      }
      if (result.error === 'EMAIL_ALREADY_REGISTERED') {
        return c.json(result, 409);
      }
      return c.json(result, 500);
    }
  } catch (error) {
    console.error('Error en endpoint POST /auth/register:', error);
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

// POST /api/v1/auth/login
authRouter.post('/login', async (c) => {
  const db = c.env.DB;
  const jwtSecret = c.env.JWT_SECRET;

  if (!jwtSecret) {
    return c.json(
      {
        success: false,
        error: 'CONFIGURATION_ERROR',
        message: 'JWT_SECRET no configurado',
      },
      500
    );
  }

  const service = createAuthService(db, jwtSecret);

  try {
    const body = await c.req.json<LoginRequest>();

    const result = await service.login(body);

    if (result.success) {
      return c.json(result, 200);
    } else {
      if (result.error === 'VALIDATION_ERROR') {
        return c.json(result, 400);
      }
      if (result.error === 'INVALID_CREDENTIALS') {
        return c.json(result, 401);
      }
      if (result.error === 'USER_INACTIVE') {
        return c.json(result, 403);
      }
      return c.json(result, 500);
    }
  } catch (error) {
    console.error('Error en endpoint POST /auth/login:', error);
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

export default authRouter;

