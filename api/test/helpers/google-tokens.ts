import {
  SignJWT,
  createLocalJWKSet,
  exportJWK,
  generateKeyPair,
} from "jose";
import type { JWTVerifyGetKey } from "jose";

export const CLIENT_ID = "web-123.apps.googleusercontent.com";
export const KID = "kid-prueba-1";
export const AHORA_MS = 1_800_000_000_000;

type Clave = Awaited<ReturnType<typeof generateKeyPair>>["privateKey"];

export interface GoogleClaims {
  sub?: string;
  email?: string;
  email_verified?: boolean | string;
  name?: string;
  iss?: string;
  aud?: string;
  /** epoch en segundos */
  exp?: number;
  kid?: string;
  /** Firmar con otra clave (firma incorrecta). */
  clave?: Clave;
  /** Omitir estos claims. */
  sin?: string[];
}

export interface GoogleFake {
  jwks: JWTVerifyGetKey;
  privateKey: Clave;
  /** JWK publica serializada (para el ataque HS256 con la clave publica). */
  publicJwk: string;
  firmar(claims?: GoogleClaims): Promise<string>;
}

export async function crearGoogleFake(): Promise<GoogleFake> {
  const { publicKey, privateKey } = await generateKeyPair("RS256", {
    extractable: true,
  });
  const jwk = await exportJWK(publicKey);
  jwk.kid = KID;
  jwk.alg = "RS256";
  jwk.use = "sig";

  return {
    jwks: createLocalJWKSet({ keys: [jwk] }),
    privateKey,
    publicJwk: JSON.stringify(jwk),
    async firmar(claims: GoogleClaims = {}) {
      const sin = claims.sin ?? [];
      const payload: Record<string, unknown> = {
        email: claims.email ?? "ana@gmail.com",
        email_verified: claims.email_verified ?? true,
        name: claims.name ?? "Ana Google",
      };
      for (const clave of sin) {
        delete payload[clave];
      }
      const jwt = new SignJWT(payload)
        .setProtectedHeader({ alg: "RS256", kid: claims.kid ?? KID })
        .setIssuedAt(Math.floor(AHORA_MS / 1000) - 60)
        .setExpirationTime(claims.exp ?? Math.floor(AHORA_MS / 1000) + 3600);
      if (!sin.includes("iss")) {
        jwt.setIssuer(claims.iss ?? "https://accounts.google.com");
      }
      if (!sin.includes("aud")) {
        jwt.setAudience(claims.aud ?? CLIENT_ID);
      }
      if (!sin.includes("sub")) {
        jwt.setSubject(claims.sub ?? "google-sub-1");
      }
      return jwt.sign(claims.clave ?? privateKey);
    },
  };
}
