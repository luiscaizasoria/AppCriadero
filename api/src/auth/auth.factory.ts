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


export interface AuthFactoryOptions {
  /** Valor de EMAIL_VERIFICATION_REQUIRED; solo "true" activa la verificacion. */
  emailVerificationRequired?: string;
  /** RESEND_API_KEY (secreto). */
  resendApiKey?: string;
  /** EMAIL_FROM. */
  emailFrom?: string;
  /** Inyeccion para tests. */
  mailer?: EnvioCorreo;
  now?: () => number;
  generateCode?: () => string;
}


export function createAuthService(
  db: D1Database,
  jwtSecret: string,
  options: AuthFactoryOptions = {}
){

  const repository = new D1AuthRepository(db);

  const mailer: EnvioCorreo =
    options.mailer ??
    (options.resendApiKey && options.emailFrom
      ? new EnvioCorreoHttp({
          apiKey: options.resendApiKey,
          from: options.emailFrom
        })
      : new EnvioCorreoNoConfigurado());

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
    }
  );

}
