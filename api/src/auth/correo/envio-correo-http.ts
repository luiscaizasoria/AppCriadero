import {
  ASUNTO_CODIGO,
  EnvioCorreoConfigError,
  EnvioCorreoError,
  construirHtmlCodigo,
  construirTextoCodigo,
  type CodigoVerificacionCorreo,
  type EnvioCorreo,
} from './envio-correo';

export const RESEND_ENDPOINT = 'https://api.resend.com/emails';

export type FetchLike = (
  url: string,
  init: { method: string; headers: Record<string, string>; body: string }
) => Promise<{ ok: boolean; status: number }>;

export interface EnvioCorreoHttpOptions {
  apiKey: string;
  from: string;
  endpoint?: string;
  fetchFn?: FetchLike;
}

/**
 * Adaptador HTTP con el formato de Resend (POST JSON con Bearer).
 * Para Brevo bastaria otro adaptador con la misma interfaz.
 */
export class EnvioCorreoHttp implements EnvioCorreo {
  private readonly endpoint: string;
  private readonly fetchFn: FetchLike;

  constructor(private readonly options: EnvioCorreoHttpOptions) {
    this.endpoint = options.endpoint ?? RESEND_ENDPOINT;
    this.fetchFn = options.fetchFn ?? ((url, init) => fetch(url, init));
  }

  async enviarCodigoVerificacion(
    datos: CodigoVerificacionCorreo
  ): Promise<void> {
    let response: { ok: boolean; status: number };
    try {
      response = await this.fetchFn(this.endpoint, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${this.options.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: this.options.from,
          to: [datos.to],
          subject: ASUNTO_CODIGO,
          text: construirTextoCodigo(datos),
          html: construirHtmlCodigo(datos),
        }),
      });
    } catch {
      throw new EnvioCorreoError('No se pudo contactar al proveedor de correo');
    }

    if (!response.ok) {
      throw new EnvioCorreoError(
        `El proveedor de correo respondio ${response.status}`
      );
    }
  }
}

/** Sin RESEND_API_KEY/EMAIL_FROM: cualquier envio falla de forma explicita. */
export class EnvioCorreoNoConfigurado implements EnvioCorreo {
  constructor(
    private readonly mensaje = 'RESEND_API_KEY o EMAIL_FROM no configurados'
  ) {}

  async enviarCodigoVerificacion(): Promise<void> {
    throw new EnvioCorreoConfigError(this.mensaje);
  }
}
