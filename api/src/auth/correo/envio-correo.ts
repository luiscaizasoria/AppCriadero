/**
 * Servicio de correo para el codigo de verificacion.
 */

export interface CodigoVerificacionCorreo {
  to: string;
  nombre: string;
  codigo: string;
  expiraEnMinutos: number;
}

export interface EnvioCorreo {
  enviarCodigoVerificacion(datos: CodigoVerificacionCorreo): Promise<void>;
}

/** El proveedor fallo o rechazo el envio. */
export class EnvioCorreoError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'EnvioCorreoError';
  }
}

/** Faltan bindings del proveedor (RESEND_API_KEY, EMAIL_FROM). */
export class EnvioCorreoConfigError extends EnvioCorreoError {
  constructor(message: string) {
    super(message);
    this.name = 'EnvioCorreoConfigError';
  }
}

export const ASUNTO_CODIGO = 'Tu código de verificación de MiCriadero';

export function escaparHtml(texto: string): string {
  return texto
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

export function construirTextoCodigo(datos: CodigoVerificacionCorreo): string {
  return (
    `Hola ${datos.nombre},\n\n` +
    `Tu código de verificación de MiCriadero es: ${datos.codigo}\n\n` +
    `Vence en ${datos.expiraEnMinutos} minutos. ` +
    `Si no creaste esta cuenta, ignora este mensaje.\n`
  );
}

export function construirHtmlCodigo(datos: CodigoVerificacionCorreo): string {
  return (
    `<p>Hola ${escaparHtml(datos.nombre)},</p>` +
    `<p>Tu código de verificación de MiCriadero es:</p>` +
    `<p style="font-size:28px;font-weight:bold;letter-spacing:6px">${escaparHtml(datos.codigo)}</p>` +
    `<p>Vence en ${datos.expiraEnMinutos} minutos. ` +
    `Si no creaste esta cuenta, ignora este mensaje.</p>`
  );
}
