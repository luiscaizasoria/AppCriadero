import type { D1Database } from "@cloudflare/workers-types";
import { D1AuthRepository } from "./auth.repository";
import { AuthService } from "./auth.service";
import { D1VerificationRepository } from "./verification.repository";
import { D1RateLimitRepository } from "./rate-limit.repository";
import type { EnvioCorreo } from "./correo/envio-correo";
import {
  EnvioCorreoHttp,
  EnvioCorreoNoConfigurado,
} from "./correo/envio-correo-http";
import { EnvioCorreoSmtp } from "./correo/envio-correo-smtp";
import type { JWTVerifyGetKey } from "jose";
import { getGoogleJwks, parseClientIds } from "./google-token";

const noJwks: JWTVerifyGetKey = async () => {
  throw new Error("JWKS no configurado");
};


export interface AuthFactoryOptions {
  /** Valor de EMAIL_VERIFICATION_REQUIRED; solo "true" activa la verificacion. */
  emailVerificationRequired?: string;
  /** RESEND_API_KEY (secreto). */
  resendApiKey?: string;
  /** EMAIL_FROM (secreto: direccion remitente). */
  emailFrom?: string;
  /** EMAIL_PROVIDER: "simulado" | "gmail-smtp". */
  emailProvider?: string;
  /** SMTP_USER y SMTP_PASSWORD (secretos). */
  smtpUser?: string;
  smtpPassword?: string;
  /** EMAIL_FROM_NAME; por defecto "MiCriadero". */
  emailFromName?: string;
  /** Inyeccion para tests. */
  mailer?: EnvioCorreo;
  now?: () => number;
  generateCode?: () => string;
  /** GOOGLE_CLIENT_IDS (lista separada por comas); ausente = Google no configurado. */
  googleClientIds?: string;
  /** Inyeccion para tests; por defecto el JWKS remoto de Google. */
  googleJwks?: JWTVerifyGetKey;
}


/**
 * Selecciona el proveedor de correo por EMAIL_PROVIDER. "simulado", ausente o
 * desconocido = comportamiento previo (Resend si hay claves; si no, no configurado).
 */
export function createMailer(options: AuthFactoryOptions): EnvioCorreo {
  if (options.emailProvider === "gmail-smtp") {
    if (options.smtpUser && options.smtpPassword && options.emailFrom) {
      return new EnvioCorreoSmtp({
        user: options.smtpUser,
        password: options.smtpPassword,
        from: options.emailFrom,
        fromName: options.emailFromName
      });
    }
    return new EnvioCorreoNoConfigurado(
      "SMTP_USER, SMTP_PASSWORD o EMAIL_FROM no configurados"
    );
  }
  return options.resendApiKey && options.emailFrom
    ? new EnvioCorreoHttp({
        apiKey: options.resendApiKey,
        from: options.emailFrom
      })
    : new EnvioCorreoNoConfigurado();
}

export function createAuthService(
  db: D1Database,
  jwtSecret: string,
  options: AuthFactoryOptions = {}
){

  const repository = new D1AuthRepository(db);

  const clientIds = parseClientIds(options.googleClientIds);

  const mailer: EnvioCorreo = options.mailer ?? createMailer(options);

  return new AuthService(
    repository,
    jwtSecret,
    {
      enabled: options.emailVerificationRequired === "true",
      codes: new D1VerificationRepository(db),
      limits: new D1RateLimitRepository(db),
      mailer,
      now: options.now,
      generateCode: options.generateCode
    },
    {
      clientIds,
      // Con la lista vacia no se toca la red: el servicio responde GOOGLE_NOT_CONFIGURED.
      jwks: options.googleJwks ?? (clientIds.length > 0 ? getGoogleJwks() : noJwks),
      now: options.now
    }
  );

}
