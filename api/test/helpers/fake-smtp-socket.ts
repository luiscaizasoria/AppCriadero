import type { SmtpSocket, SmtpSocketFactory } from "../../src/auth/correo/smtp-client";

export interface FakeSmtpOptions {
  /** Respuestas por comando (prefijo en mayusculas); sustituyen a las normales. */
  respuestas?: Record<string, string>;
  /** Si es true, el servidor no responde nada (simula bloqueo). */
  silencio?: boolean;
  /** Si es true, el saludo 220 tampoco se envia. */
  sinSaludo?: boolean;
}

export class FakeSmtpServer {
  /** Comandos recibidos (una entrada por linea de comando; el mensaje DATA va en `datos`). */
  readonly comandos: string[] = [];
  datos = "";
  cerrado = false;
  private controller!: ReadableStreamDefaultController<Uint8Array>;
  private enData = false;
  private bufferData = "";
  private bufferCmd = "";
  private readonly enc = new TextEncoder();
  private readonly dec = new TextDecoder();

  constructor(private readonly opciones: FakeSmtpOptions = {}) {}

  socket(): SmtpSocket {
    const readable = new ReadableStream<Uint8Array>({
      start: (c) => {
        this.controller = c;
        if (!this.opciones.sinSaludo && !this.opciones.silencio) {
          this.responder("220 smtp.fake ESMTP ready\r\n");
        }
      },
    });
    const writable = new WritableStream<Uint8Array>({
      write: (chunk) => this.recibir(this.dec.decode(chunk)),
    });
    return {
      readable,
      writable,
      close: () => {
        this.cerrado = true;
        try {
          this.controller.close();
        } catch {
          // ya cerrado
        }
      },
    };
  }

  factory(): SmtpSocketFactory {
    return async () => this.socket();
  }

  private responder(texto: string) {
    this.controller.enqueue(this.enc.encode(texto));
  }

  private recibir(texto: string) {
    if (this.opciones.silencio) {
      return;
    }
    if (this.enData) {
      this.bufferData += texto;
      if (this.bufferData.endsWith("\r\n.\r\n")) {
        this.enData = false;
        this.datos = this.bufferData;
        this.responder(this.opciones.respuestas?.["."] ?? "250 2.0.0 OK queued\r\n");
      }
      return;
    }
    this.bufferCmd += texto;
    let i: number;
    while ((i = this.bufferCmd.indexOf("\r\n")) !== -1) {
      const linea = this.bufferCmd.slice(0, i);
      this.bufferCmd = this.bufferCmd.slice(i + 2);
      this.comandos.push(linea);
      this.comando(linea);
    }
  }

  private comando(linea: string) {
    const mayus = linea.toUpperCase();
    const clave = ["EHLO", "AUTH", "MAIL FROM", "RCPT TO", "DATA", "QUIT"].find((k) =>
      mayus.startsWith(k)
    );
    const personalizada = clave ? this.opciones.respuestas?.[clave] : undefined;
    if (personalizada) {
      this.responder(personalizada);
      return;
    }
    switch (clave) {
      case "EHLO":
        this.responder(
          "250-smtp.fake at your service\r\n250-SIZE 35882577\r\n250-AUTH LOGIN PLAIN\r\n250 8BITMIME\r\n"
        );
        break;
      case "AUTH":
        this.responder("235 2.7.0 Accepted\r\n");
        break;
      case "MAIL FROM":
      case "RCPT TO":
        this.responder("250 2.1.0 OK\r\n");
        break;
      case "DATA":
        this.enData = true;
        this.responder("354 Go ahead\r\n");
        break;
      case "QUIT":
        this.responder("221 2.0.0 Bye\r\n");
        break;
      default:
        this.responder("500 5.5.1 Unknown\r\n");
    }
  }
}
