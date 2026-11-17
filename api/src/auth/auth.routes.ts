/**
 * Rutas para el módulo de Autenticación
 */

import { Hono } from 'hono';
import type { Context } from 'hono';
import type { D1Database } from '@cloudflare/workers-types';
import type { JWTVerifyGetKey } from 'jose';
import { createAuthService } from './auth.factory';
import type {
  RegisterRequest,
  LoginRequest,
  VerifyRequest,
  ResendRequest,
  ChangeEmailRequest,
  GoogleLoginRequest,
  RequestContext,
  ErrorResponse,
  VerificationBypass,
} from './auth.types';
import { secretsMatch } from '../shared/crypto';

type Env = {
  DB: D1Database;
  JWT_SECRET: string;
  /** Solo "true" activa la verificación por código; ausente = apagada. */
  EMAIL_VERIFICATION_REQUIRED?: string;
  RESEND_API_KEY?: string;
  EMAIL_FROM?: string;
  /** Solo en el Worker de pruebas. Si no está definido, las cabeceras de omisión se ignoran. */
  VERIFICATION_BYPASS_SECRET?: string;
  /** IDs de cliente OAuth de Google admitidos como `aud`, separados por comas. */
  GOOGLE_CLIENT_IDS?: string;
};

type AuthContext = Context<{ Bindings: Env }>;

export const BYPASS_HEADER = 'X-Verification-Bypass';
export const TEST_CODE_HEADER = 'X-Verification-Test-Code';

const authRouter = new Hono<{ Bindings: Env }>();

type ErrorStatus = 400 | 401 | 403 | 409 | 429 | 500 | 502 | 503;

function statusFor(error: string): ErrorStatus {
  switch (error) {
    case 'VALIDATION_ERROR':
    case 'INVALID_VERIFICATION_CODE':
      return 400;
    case 'INVALID_CREDENTIALS':
    case 'INVALID_GOOGLE_TOKEN':
    case 'GOOGLE_EMAIL_NOT_VERIFIED':
      return 401;
    case 'USER_INACTIVE':
    case 'EMAIL_NOT_VERIFIED':
    case 'GOOGLE_REQUIRES_EMAIL_VERIFICATION':
      return 403;
    case 'EMAIL_ALREADY_REGISTERED':
    case 'GOOGLE_ACCOUNT_CONFLICT':
      return 409;
    case 'GOOGLE_NOT_CONFIGURED':
    case 'GOOGLE_UNAVAILABLE':
      return 503;
    case 'RATE_LIMITED':
    case 'VERIFICATION_ATTEMPTS_EXCEEDED':
      return 429;
    case 'EMAIL_DELIVERY_FAILED':
      return 502;
    default:
      return 500;
  }
}

/** Con VERIFICATION_BYPASS_SECRET ausente o vacío no existe ningún bypass. */
function resolveBypass(c: AuthContext): VerificationBypass | undefined {
  const secret = c.env.VERIFICATION_BYPASS_SECRET;
  if (!secret) {
    return undefined;
  }
  if (secretsMatch(secret, c.req.header(BYPASS_HEADER))) {
    return 'verified';
  }
  if (secretsMatch(secret, c.req.header(TEST_CODE_HEADER))) {
    return 'test-code';
  }
  return undefined;
}

function requestContext(c: AuthContext): RequestContext {
  return {
    ip: c.req.header('CF-Connecting-IP') ?? undefined,
    bypass: resolveBypass(c),
  };
}

function respondError(c: AuthContext, result: ErrorResponse) {
  const status = statusFor(result.error);
  if (result.error === 'RATE_LIMITED' && result.retryAfterSeconds) {
    c.header('Retry-After', String(result.retryAfterSeconds));
  }
  return c.json(result, status);
}

function buildService(c: AuthContext) {
  return createAuthService(c.env.DB, c.env.JWT_SECRET, {
    emailVerificationRequired: c.env.EMAIL_VERIFICATION_REQUIRED,
    resendApiKey: c.env.RESEND_API_KEY,
    emailFrom: c.env.EMAIL_FROM,
  });
}

function missingSecret(c: AuthContext) {
  return c.json(
    {
      success: false,
      error: 'CONFIGURATION_ERROR',
      message: 'JWT_SECRET no configurado',
    },
    500
  );
}

function internalError(c: AuthContext, label: string, error: unknown) {
  console.error(`Error en endpoint ${label}:`, error);
  return c.json(
    {
      success: false,
      error: 'INTERNAL_ERROR',
      message: 'Error interno del servidor',
    },
    500
  );
}

// POST /api/v1/auth/register
authRouter.post('/register', async (c) => {
  if (!c.env.JWT_SECRET) {
    return missingSecret(c);
  }

  const service = buildService(c);

  try {
    const body = await c.req.json<RegisterRequest>();
    const result = await service.register(body, requestContext(c));

    return result.success ? c.json(result, 201) : respondError(c, result);
  } catch (error) {
    return internalError(c, 'POST /auth/register', error);
  }
});

// POST /api/v1/auth/login
authRouter.post('/login', async (c) => {
  if (!c.env.JWT_SECRET) {
    return missingSecret(c);
  }

  const service = buildService(c);

  try {
    const body = await c.req.json<LoginRequest>();
    const result = await service.login(body);

    return result.success ? c.json(result, 200) : respondError(c, result);
  } catch (error) {
    return internalError(c, 'POST /auth/login', error);
  }
});

// POST /api/v1/auth/verification/verify
authRouter.post('/verification/verify', async (c) => {
  if (!c.env.JWT_SECRET) {
    return missingSecret(c);
  }

  const service = buildService(c);

  try {
    const body = await c.req.json<VerifyRequest>();
    const result = await service.verifyEmail(body, requestContext(c));

    return result.success ? c.json(result, 200) : respondError(c, result);
  } catch (error) {
    return internalError(c, 'POST /auth/verification/verify', error);
  }
});

// POST /api/v1/auth/verification/resend
authRouter.post('/verification/resend', async (c) => {
  if (!c.env.JWT_SECRET) {
    return missingSecret(c);
  }

  const service = buildService(c);

  try {
    const body = await c.req.json<ResendRequest>();
    const result = await service.resendCode(body, requestContext(c));

    return result.success ? c.json(result, 200) : respondError(c, result);
  } catch (error) {
    return internalError(c, 'POST /auth/verification/resend', error);
  }
});

// POST /api/v1/auth/verification/change-email
authRouter.post('/verification/change-email', async (c) => {
  if (!c.env.JWT_SECRET) {
    return missingSecret(c);
  }

  const service = buildService(c);

  try {
    const body = await c.req.json<ChangeEmailRequest>();
    const result = await service.changeEmail(body, requestContext(c));

    return result.success ? c.json(result, 200) : respondError(c, result);
  } catch (error) {
    return internalError(c, 'POST /auth/verification/change-email', error);
  }
});

// POST /api/v1/auth/google
function googleHandler(googleJwks?: JWTVerifyGetKey) {
  return async (c: AuthContext) => {
    if (!c.env.JWT_SECRET) {
      return missingSecret(c);
    }

    const service = createAuthService(c.env.DB, c.env.JWT_SECRET, {
      emailVerificationRequired: c.env.EMAIL_VERIFICATION_REQUIRED,
      resendApiKey: c.env.RESEND_API_KEY,
      emailFrom: c.env.EMAIL_FROM,
      googleClientIds: c.env.GOOGLE_CLIENT_IDS,
      googleJwks,
    });

    try {
      let body: GoogleLoginRequest;
      try {
        body = await c.req.json<GoogleLoginRequest>();
      } catch {
        // Cuerpo ausente o no JSON: el servicio responde VALIDATION_ERROR.
        body = {} as GoogleLoginRequest;
      }
      const { result, created } = await service.loginWithGoogle(body);

      return result.success
        ? c.json(result, created ? 201 : 200)
        : respondError(c, result);
    } catch (error) {
      return internalError(c, 'POST /auth/google', error);
    }
  };
}

authRouter.post('/google', googleHandler());

/** Router con JWKS de Google inyectable (tests). */
export function createAuthRouter(options: { googleJwks?: JWTVerifyGetKey } = {}) {
  const router = new Hono<{ Bindings: Env }>();
  router.post('/google', googleHandler(options.googleJwks));
  router.route('/', authRouter);
  return router;
}

export default authRouter;
