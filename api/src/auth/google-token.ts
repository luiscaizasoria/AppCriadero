/**
 * Validación del id_token de Google Sign-In (RS256 con el JWKS de Google).
 * Sin dependencias de Hono ni de D1. No registra nunca el token.
 */

import { createRemoteJWKSet, errors, jwtVerify } from 'jose';
import type { JWTPayload, JWTVerifyGetKey } from 'jose';

export const GOOGLE_JWKS_URL = 'https://www.googleapis.com/oauth2/v3/certs';
export const GOOGLE_ISSUERS = ['accounts.google.com', 'https://accounts.google.com'];
export const GOOGLE_CLOCK_TOLERANCE_SECONDS = 30;

export type GoogleTokenFailure = 'INVALID' | 'UNAVAILABLE';

export class GoogleTokenError extends Error {
  constructor(public readonly kind: GoogleTokenFailure, detail: string) {
    super(detail);
    this.name = 'GoogleTokenError';
  }
}

export interface GoogleIdentity {
  sub: string;
  /** Normalizado (trim + minúsculas); null si el token no trae correo. */
  email: string | null;
  emailVerified: boolean;
  name: string | null;
}

export interface GoogleVerifyOptions {
  clientIds: string[];
  jwks: JWTVerifyGetKey;
  /** Reloj inyectable (epoch ms). */
  now?: () => number;
}

let remoteJwks: JWTVerifyGetKey | null = null;

/** JWKS remoto de Google, creado una vez por isolate (jose cachea y respeta el cooldown). */
export function getGoogleJwks(): JWTVerifyGetKey {
  if (!remoteJwks) {
    remoteJwks = createRemoteJWKSet(new URL(GOOGLE_JWKS_URL), {
      timeoutDuration: 5000,
    });
  }
  return remoteJwks;
}

/** Lista separada por comas, recortada y sin vacíos. */
export function parseClientIds(value: string | undefined): string[] {
  return (value ?? '')
    .split(',')
    .map((x) => x.trim())
    .filter((x) => x.length > 0);
}

function classify(error: unknown): GoogleTokenError {
  if (error instanceof errors.JWKSNoMatchingKey) {
    return new GoogleTokenError('INVALID', 'kid sin clave');
  }
  if (
    error instanceof errors.JWKSTimeout ||
    error instanceof errors.JWKSInvalid ||
    !(error instanceof errors.JOSEError)
  ) {
    // Red caída, tiempo agotado o JWKS ilegible: no es culpa del token.
    return new GoogleTokenError('UNAVAILABLE', 'JWKS no disponible');
  }
  if (error.code === 'ERR_JOSE_GENERIC') {
    // jose lo usa cuando el JWKS remoto no responde 200.
    return new GoogleTokenError('UNAVAILABLE', 'JWKS no disponible');
  }
  return new GoogleTokenError('INVALID', error.code);
}

function readEmailVerified(value: unknown): boolean {
  return value === true || value === 'true';
}

function readString(value: unknown): string | null {
  return typeof value === 'string' && value.trim().length > 0 ? value.trim() : null;
}

/**
 * Verifica firma, iss, aud y exp. Lanza GoogleTokenError. `clientIds` no puede
 * estar vacío: el llamador lo comprueba antes (nunca se acepta cualquier aud).
 */
export async function verificarIdTokenGoogle(
  idToken: string,
  options: GoogleVerifyOptions
): Promise<GoogleIdentity> {
  if (options.clientIds.length === 0) {
    throw new GoogleTokenError('INVALID', 'sin clientIds');
  }

  let payload: JWTPayload;
  try {
    const result = await jwtVerify(idToken, options.jwks, {
      algorithms: ['RS256'],
      issuer: GOOGLE_ISSUERS,
      audience: options.clientIds,
      clockTolerance: GOOGLE_CLOCK_TOLERANCE_SECONDS,
      ...(options.now ? { currentDate: new Date(options.now()) } : {}),
    });
    payload = result.payload;
  } catch (error) {
    throw classify(error);
  }

  const sub = readString(payload.sub);
  if (!sub) {
    throw new GoogleTokenError('INVALID', 'sin sub');
  }
  const email = readString(payload.email);

  return {
    sub,
    email: email ? email.toLowerCase() : null,
    emailVerified: readEmailVerified(payload.email_verified),
    name: readString(payload.name),
  };
}
