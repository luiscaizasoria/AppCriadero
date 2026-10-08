/**
 * Middleware para autenticación JWT
 */

import { jwtVerify } from 'jose';
import type { Context, Next } from 'hono';
import type { D1Database } from '@cloudflare/workers-types';
import type { Variables } from 'hono/types';

export interface AuthUser {
  id: string;
  email: string;
}

export type AuthVariables = {
  user: AuthUser;
};

export async function jwtMiddleware(c: Context<{ Bindings: { DB: D1Database; JWT_SECRET: string }, Variables: AuthVariables }>, next: Next) {
  const authHeader = c.req.header('Authorization');

  if (!authHeader) {
    return c.json(
      {
        success: false,
        error: 'UNAUTHORIZED',
        message: 'Token requerido',
      },
      401
    );
  }

  const parts = authHeader.split(' ');
  if (parts.length !== 2 || parts[0] !== 'Bearer') {
    return c.json(
      {
        success: false,
        error: 'INVALID_TOKEN',
        message: 'Token inválido',
      },
      401
    );
  }

  const token = parts[1];
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

  try {
    const secret = new TextEncoder().encode(jwtSecret);
    const { payload } = await jwtVerify(token, secret);

    if (!payload.sub || !payload.email) {
      return c.json(
        {
          success: false,
          error: 'INVALID_TOKEN',
          message: 'Token inválido',
        },
        401
      );
    }

    const user: AuthUser = {
      id: payload.sub as string,
      email: payload.email as string,
    };

    c.set('user', user);
    await next();
  } catch (error) {
    return c.json(
      {
        success: false,
        error: 'INVALID_TOKEN',
        message: 'Token inválido',
      },
      401
    );
  }
}
