import {
  ASUNTO_CODIGO,
  construirHtmlCodigo,
  construirTextoCodigo,
  type CodigoVerificacionCorreo,
  type EnvioCorreo,
} from './envio-correo';
import { construirMensajeMime, dominioDe } from './mensaje-mime';
import { socketCloudflare } from './socket-cloudflare';
import { SmtpClient, type SmtpSocketFactory } from './smtp-client';

export const GMAIL_SMTP_HOST = 'smtp.gmail.com';
export const GMAIL_SMTP_PORT = 465;
export const NOMBRE_REMITENTE_POR_DEFECTO = 'Criadero Kikirikis';

export interface EnvioCorreoSmtpOptions {
  user: string;
  password: string;
  /** Direccion remitente. */
  from: string;
  fromName?: string;
  host?: string;
  port?: number;
  socketFactory?: SmtpSocketFactory;
  now?: () => Date;
  connectTimeoutMs?: number;
  responseTimeoutMs?: number;
  totalTimeoutMs?: number;
}

/** Proveedor SMTP (Gmail, TLS implicito en 465). Cambiable por otra implementacion de EnvioCorreo. */
export class EnvioCorreoSmtp implements EnvioCorreo {
  constructor(private readonly options: EnvioCorreoSmtpOptions) {}

  async enviarCodigoVerificacion(
    datos: CodigoVerificacionCorreo
  ): Promise<void> {
    const { options } = this;
    const mensaje = construirMensajeMime({
      from: options.from,
      fromName: options.fromName?.trim() || NOMBRE_REMITENTE_POR_DEFECTO,
      to: datos.to,
      asunto: ASUNTO_CODIGO,
      texto: construirTextoCodigo(datos),
      html: construirHtmlCodigo(datos),
      fecha: (options.now ?? (() => new Date()))(),
    });

    const cliente = new SmtpClient({
      host: options.host ?? GMAIL_SMTP_HOST,
      port: options.port ?? GMAIL_SMTP_PORT,
      socketFactory: options.socketFactory ?? socketCloudflare,
      ehloName: dominioDe(options.from),
      user: options.user,
      password: options.password,
      connectTimeoutMs: options.connectTimeoutMs,
      responseTimeoutMs: options.responseTimeoutMs,
      totalTimeoutMs: options.totalTimeoutMs,
    });

    await cliente.enviar({ from: options.from, to: datos.to, mensaje });
  }
}
