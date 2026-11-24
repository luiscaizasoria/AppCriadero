import { EnvioCorreoError } from './envio-correo';

/** Interfaz minima de socket (compatible con `Socket` de cloudflare:sockets). */
export interface SmtpSocket {
  readable: ReadableStream<Uint8Array>;
  writable: WritableStream<Uint8Array>;
  close(): Promise<void> | void;
}

/** Abre una conexion TLS implicita al host y puerto indicados. */
export type SmtpSocketFactory = (
  host: string,
  port: number
) => Promise<SmtpSocket>;

export type SmtpCategoria =
  | 'smtp_connect_failed'
  | 'smtp_timeout'
  | 'smtp_auth_failed'
  | 'smtp_rejected'
  | 'smtp_protocol_error'
  | 'smtp_invalid_message';

/**
 * Error SMTP con mensaje fijo: nunca incluye texto del servidor, credenciales,
 * destinatario ni el contenido del mensaje.
 */
export class SmtpError extends EnvioCorreoError {
  constructor(
    readonly categoria: SmtpCategoria,
    readonly codigoSmtp?: number
  ) {
    super(
      `Fallo del envio SMTP (${categoria}${codigoSmtp ? ` ${codigoSmtp}` : ''})`
    );
    this.name = 'SmtpError';
  }
}

export interface SmtpClientOptions {
  host: string;
  port: number;
  socketFactory: SmtpSocketFactory;
  /** Nombre que se anuncia en EHLO. */
  ehloName: string;
  user: string;
  password: string;
  connectTimeoutMs?: number;
  responseTimeoutMs?: number;
  totalTimeoutMs?: number;
}

export interface SmtpEnvio {
  from: string;
  to: string;
  /** Mensaje completo (cabeceras y cuerpo), con cualquier tipo de salto de linea. */
  mensaje: string;
}

interface Respuesta {
  codigo: number;
}

const DIRECCION_VALIDA = /^[^\s<>\r\n"]+@[^\s<>\r\n"]+$/;

function conTiempo<T>(
  promesa: Promise<T>,
  ms: number,
  categoria: SmtpCategoria
): Promise<T> {
  let temporizador: ReturnType<typeof setTimeout> | undefined;
  const limite = new Promise<never>((_, reject) => {
    temporizador = setTimeout(() => reject(new SmtpError(categoria)), ms);
  });
  return Promise.race([promesa, limite]).finally(() => {
    if (temporizador !== undefined) {
      clearTimeout(temporizador);
    }
  });
}

function aBase64(texto: string): string {
  const bytes = new TextEncoder().encode(texto);
  let binario = '';
  for (const byte of bytes) {
    binario += String.fromCharCode(byte);
  }
  return btoa(binario);
}

/** Normaliza a CRLF y duplica el punto inicial de cada linea (RFC 5321 4.5.2). */
export function aplicarDotStuffing(mensaje: string): string {
  let texto = mensaje.replace(/\r\n|\r|\n/g, '\r\n');
  if (!texto.endsWith('\r\n')) {
    texto += '\r\n';
  }
  return ('\r\n' + texto).replace(/\r\n\./g, '\r\n..').slice(2);
}

/** Cliente SMTP minimo: EHLO, AUTH PLAIN, MAIL FROM, RCPT TO, DATA y QUIT. */
export class SmtpClient {
  private readonly connectTimeoutMs: number;
  private readonly responseTimeoutMs: number;
  private readonly totalTimeoutMs: number;

  constructor(private readonly options: SmtpClientOptions) {
    this.connectTimeoutMs = options.connectTimeoutMs ?? 8000;
    this.responseTimeoutMs = options.responseTimeoutMs ?? 8000;
    this.totalTimeoutMs = options.totalTimeoutMs ?? 20000;
  }

  async enviar(envio: SmtpEnvio): Promise<void> {
    if (
      !DIRECCION_VALIDA.test(envio.from) ||
      !DIRECCION_VALIDA.test(envio.to)
    ) {
      throw new SmtpError('smtp_invalid_message');
    }

    let socket: SmtpSocket | undefined;
    let terminado = false;
    try {
      const sesion = this.sesion(envio, (s) => {
        socket = s;
        if (terminado) {
          // La apertura llego tarde (tras un timeout): nadie mas lo cerraria.
          void Promise.resolve(s.close()).catch(() => undefined);
        }
      });
      sesion.catch(() => undefined);
      await conTiempo(sesion, this.totalTimeoutMs, 'smtp_timeout');
    } catch (error) {
      if (error instanceof SmtpError) {
        console.error('smtp', error.categoria, error.codigoSmtp ?? '');
        throw error;
      }
      console.error('smtp', 'smtp_protocol_error');
      throw new SmtpError('smtp_protocol_error');
    } finally {
      terminado = true;
      try {
        await socket?.close();
      } catch {
        // Ignorado: el socket ya esta cerrado.
      }
    }
  }

  private async sesion(
    envio: SmtpEnvio,
    registrarSocket: (s: SmtpSocket) => void
  ): Promise<void> {
    const apertura = this.options.socketFactory(
      this.options.host,
      this.options.port
    );
    // Si la apertura llega tarde (tras un timeout) se cierra el socket.
    apertura.then(
      (s) => registrarSocket(s),
      () => undefined
    );
    let socket: SmtpSocket;
    try {
      socket = await conTiempo(apertura, this.connectTimeoutMs, 'smtp_timeout');
    } catch (error) {
      if (error instanceof SmtpError) {
        throw error;
      }
      throw new SmtpError('smtp_connect_failed');
    }

    const escritor = socket.writable.getWriter();
    const lector = socket.readable.getReader();
    const decodificador = new TextDecoder();
    const codificador = new TextEncoder();
    let pendiente = '';

    const leer = async (): Promise<Respuesta> => {
      let codigo = 0;
      for (;;) {
        let salto = pendiente.indexOf('\n');
        while (salto === -1) {
          const { value, done } = await conTiempo(
            lector.read(),
            this.responseTimeoutMs,
            'smtp_timeout'
          );
          if (done || !value) {
            throw new SmtpError('smtp_protocol_error');
          }
          pendiente += decodificador.decode(value, { stream: true });
          salto = pendiente.indexOf('\n');
        }
        const linea = pendiente.slice(0, salto).replace(/\r$/, '');
        pendiente = pendiente.slice(salto + 1);
        const m = /^(\d{3})([ -]|$)/.exec(linea);
        if (!m) {
          throw new SmtpError('smtp_protocol_error');
        }
        codigo = Number(m[1]);
        if (m[2] !== '-') {
          return { codigo };
        }
      }
    };

    const escribir = async (texto: string): Promise<void> => {
      await conTiempo(
        escritor.write(codificador.encode(texto)),
        this.responseTimeoutMs,
        'smtp_timeout'
      );
    };

    const esperar = async (
      aceptados: number[],
      categoria: SmtpCategoria = 'smtp_rejected'
    ): Promise<void> => {
      const { codigo } = await leer();
      if (!aceptados.includes(codigo)) {
        throw new SmtpError(categoria, codigo);
      }
    };

    const comando = async (
      texto: string,
      aceptados: number[],
      categoria?: SmtpCategoria
    ): Promise<void> => {
      await escribir(texto + '\r\n');
      await esperar(aceptados, categoria);
    };

    try {
      await esperar([220]);
      await comando(`EHLO ${this.options.ehloName}`, [250]);
      await comando(
        `AUTH PLAIN ${aBase64(`\u0000${this.options.user}\u0000${this.options.password}`)}`,
        [235],
        'smtp_auth_failed'
      );
      await comando(`MAIL FROM:<${envio.from}>`, [250]);
      await comando(`RCPT TO:<${envio.to}>`, [250, 251]);
      await comando('DATA', [354]);
      await escribir(aplicarDotStuffing(envio.mensaje) + '.\r\n');
      await esperar([250]);
      try {
        await escribir('QUIT\r\n');
        await conTiempo(leer(), 2000, 'smtp_timeout');
      } catch {
        // El mensaje ya fue aceptado; el cierre ordenado es opcional.
      }
    } catch (error) {
      if (error instanceof SmtpError) {
        throw error;
      }
      throw new SmtpError('smtp_protocol_error');
    }
  }
}
