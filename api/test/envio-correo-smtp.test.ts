import { afterEach, describe, expect, it, vi } from "vitest";
import { EnvioCorreoSmtp } from "../src/auth/correo/envio-correo-smtp";
import { EnvioCorreoError } from "../src/auth/correo/envio-correo";
import { EnvioCorreoNoConfigurado } from "../src/auth/correo/envio-correo-http";
import { aplicarDotStuffing, SmtpClient, SmtpError } from "../src/auth/correo/smtp-client";
import { construirMensajeMime, sanearCabecera } from "../src/auth/correo/mensaje-mime";
import { createMailer } from "../src/auth/auth.factory";
import { FakeSmtpServer, type FakeSmtpOptions } from "./helpers/fake-smtp-socket";

const USUARIO = "usuario-prueba@example.test";
const CLAVE = "clave-de-prueba-123";
const REMITENTE = "remitente@example.test";
const DESTINO = "destino@example.test";
const CODIGO = "482916";

function crear(servidor: FakeSmtpServer, extra: Record<string, unknown> = {}) {
  return new EnvioCorreoSmtp({
    user: USUARIO,
    password: CLAVE,
    from: REMITENTE,
    socketFactory: servidor.factory(),
    now: () => new Date("2026-11-24T10:00:00Z"),
    ...extra,
  });
}

function datos(nombre = "Ana") {
  return { to: DESTINO, nombre, codigo: CODIGO, expiraEnMinutos: 10 };
}

function decodificarPartes(datosSmtp: string): string[] {
  return [...datosSmtp.matchAll(/Content-Transfer-Encoding: base64\r\n\r\n([A-Za-z0-9+/=\r\n]+?)\r\n--/g)].map(
    (m) => new TextDecoder().decode(Uint8Array.from(atob(m[1].replace(/\r\n/g, "")), (c) => c.charCodeAt(0)))
  );
}

async function capturarError(promesa: Promise<unknown>): Promise<unknown> {
  try {
    await promesa;
  } catch (e) {
    return e;
  }
  throw new Error("se esperaba un error");
}

afterEach(() => vi.restoreAllMocks());

describe("EnvioCorreoSmtp", () => {
  it("debe ejecutar la secuencia SMTP completa en orden", async () => {
    const s = new FakeSmtpServer();
    await crear(s).enviarCodigoVerificacion(datos());

    expect(s.comandos[0]).toBe("EHLO example.test");
    expect(s.comandos[1]).toBe(
      `AUTH PLAIN ${btoa(`\u0000${USUARIO}\u0000${CLAVE}`)}`
    );
    expect(s.comandos.slice(2)).toEqual([
      `MAIL FROM:<${REMITENTE}>`,
      `RCPT TO:<${DESTINO}>`,
      "DATA",
      "QUIT",
    ]);
    expect(s.cerrado).toBe(true);
  });

  it("debe construir un multipart/alternative en UTF-8 con el codigo y la vigencia", async () => {
    const s = new FakeSmtpServer();
    await crear(s).enviarCodigoVerificacion(datos("Ñandú"));

    expect(s.datos).toContain("MIME-Version: 1.0");
    expect(s.datos).toContain("Content-Type: multipart/alternative; boundary=");
    expect(s.datos).toContain("Content-Type: text/plain; charset=UTF-8");
    expect(s.datos).toContain("Content-Type: text/html; charset=UTF-8");
    expect(s.datos).toContain("Date: Tue, 24 Nov 2026 10:00:00 GMT");
    expect(s.datos).toMatch(/Message-ID: <[0-9a-f-]+@example\.test>/);
    expect(s.datos).toContain(`From: "Criadero Kikirikis" <${REMITENTE}>`);

    const cabeceraAsunto = /Subject: ((?:=\?UTF-8\?B\?[^?]+\?=(?:\r\n )?)+)/.exec(s.datos)?.[1] ?? "";
    const palabras = [...cabeceraAsunto.matchAll(/=\?UTF-8\?B\?([^?]+)\?=/g)];
    expect(palabras.every((p) => p[0].length <= 75)).toBe(true);
    const decodificado = palabras
      .map((p) => new TextDecoder().decode(Uint8Array.from(atob(p[1]), (c) => c.charCodeAt(0))))
      .join("");
    expect(decodificado).toBe("Tu código de verificación de Criadero Kikirikis");

    const [texto, html] = decodificarPartes(s.datos);
    expect(texto).toContain(CODIGO);
    expect(texto).toContain("Vence en 10 minutos");
    expect(texto).toContain("Ñandú");
    expect(html).toContain(CODIGO);
    expect(html).toContain("Vence en 10 minutos");
    expect(html).not.toMatch(/<img|src=/);
  });

  it("debe codificar el nombre del remitente con no-ASCII (RFC 2047)", () => {
    const m = construirMensajeMime({
      from: REMITENTE,
      fromName: "Kikirikis ñandú",
      to: DESTINO,
      asunto: "Hola",
      texto: "t",
      html: "h",
      fecha: new Date(0),
    });
    expect(m).toMatch(/From: =\?UTF-8\?B\?[A-Za-z0-9+/=]+\?= <remitente@example\.test>/);
  });

  it("debe sanear saltos de linea en cabeceras para evitar inyeccion", () => {
    expect(sanearCabecera("a\r\nBcc: x@y.z")).not.toMatch(/[\r\n]/);
    const m = construirMensajeMime({
      from: REMITENTE,
      fromName: "Nombre\r\nBcc: malo@example.test",
      to: DESTINO,
      asunto: "Asunto\r\nBcc: malo@example.test",
      texto: "t",
      html: "h",
      fecha: new Date(0),
    });
    const cabeceras = m.split("\r\n\r\n")[0];
    expect(cabeceras.split("\r\n").some((l) => l.startsWith("Bcc:"))).toBe(false);
  });

  it("debe aplicar dot-stuffing y terminar el mensaje con CRLF.CRLF", async () => {
    expect(aplicarDotStuffing(".inicio\n.otra\nfin")).toBe(
      "..inicio\r\n..otra\r\nfin\r\n"
    );

    const s = new FakeSmtpServer();
    const cliente = new SmtpClient({
      host: "h",
      port: 465,
      socketFactory: s.factory(),
      ehloName: "example.test",
      user: USUARIO,
      password: CLAVE,
    });
    await cliente.enviar({ from: REMITENTE, to: DESTINO, mensaje: "Linea\r\n.punto\r\n" });
    expect(s.datos).toBe("Linea\r\n..punto\r\n.\r\n");
  });

  it("debe mapear credenciales invalidas a EMAIL error sin filtrar datos", async () => {
    const log = vi.spyOn(console, "error").mockImplementation(() => undefined);
    const s = new FakeSmtpServer({
      respuestas: { AUTH: "535 5.7.8 Username and Password not accepted secreto-del-servidor\r\n" },
    });
    const error = await capturarError(crear(s).enviarCodigoVerificacion(datos()));

    expect(error).toBeInstanceOf(EnvioCorreoError);
    expect((error as SmtpError).categoria).toBe("smtp_auth_failed");
    expect((error as SmtpError).codigoSmtp).toBe(535);
    expect(s.cerrado).toBe(true);

    const salida = JSON.stringify(log.mock.calls) + String((error as Error).message);
    for (const secreto of [CLAVE, USUARIO, DESTINO, CODIGO, "secreto-del-servidor"]) {
      expect(salida).not.toContain(secreto);
    }
    expect(log).toHaveBeenCalledWith("smtp", "smtp_auth_failed", 535);
  });

  it("debe mapear un rechazo del destinatario a smtp_rejected", async () => {
    vi.spyOn(console, "error").mockImplementation(() => undefined);
    const s = new FakeSmtpServer({ respuestas: { "RCPT TO": "550 5.1.1 no existe\r\n" } });
    const error = (await capturarError(crear(s).enviarCodigoVerificacion(datos()))) as SmtpError;
    expect(error.categoria).toBe("smtp_rejected");
    expect(error.codigoSmtp).toBe(550);
  });

  it("debe fallar con smtp_timeout si el servidor no responde y cerrar el socket", async () => {
    vi.spyOn(console, "error").mockImplementation(() => undefined);
    const opciones: FakeSmtpOptions = { silencio: true };
    const s = new FakeSmtpServer(opciones);
    const error = (await capturarError(
      crear(s, { responseTimeoutMs: 30, totalTimeoutMs: 500 }).enviarCodigoVerificacion(datos())
    )) as SmtpError;
    expect(error.categoria).toBe("smtp_timeout");
    expect(s.cerrado).toBe(true);
  });

  it("debe fallar con smtp_timeout si la conexion no se abre a tiempo", async () => {
    vi.spyOn(console, "error").mockImplementation(() => undefined);
    const error = (await capturarError(
      crear(new FakeSmtpServer(), {
        socketFactory: () => new Promise(() => undefined),
        connectTimeoutMs: 30,
      }).enviarCodigoVerificacion(datos())
    )) as SmtpError;
    expect(error.categoria).toBe("smtp_timeout");
  });

  it("debe fallar con smtp_connect_failed si no se puede abrir el socket", async () => {
    vi.spyOn(console, "error").mockImplementation(() => undefined);
    const error = (await capturarError(
      crear(new FakeSmtpServer(), {
        socketFactory: async () => {
          throw new Error("host smtp.gmail.com inalcanzable");
        },
      }).enviarCodigoVerificacion(datos())
    )) as SmtpError;
    expect(error.categoria).toBe("smtp_connect_failed");
    expect(error.message).not.toContain("inalcanzable");
  });

  it("debe rechazar direcciones con saltos de linea sin abrir conexion", async () => {
    const fabrica = vi.fn();
    const error = (await capturarError(
      crear(new FakeSmtpServer(), { socketFactory: fabrica }).enviarCodigoVerificacion({
        ...datos(),
        to: "a@b.test\r\nRCPT TO:<x@y.test>",
      })
    )) as SmtpError;
    expect(error.categoria).toBe("smtp_invalid_message");
    expect(fabrica).not.toHaveBeenCalled();
  });
});

describe("seleccion del proveedor de correo", () => {
  it("debe usar SMTP con EMAIL_PROVIDER gmail-smtp y las tres credenciales", () => {
    const m = createMailer({
      emailProvider: "gmail-smtp",
      smtpUser: USUARIO,
      smtpPassword: CLAVE,
      emailFrom: REMITENTE,
    });
    expect(m).toBeInstanceOf(EnvioCorreoSmtp);
  });

  it("debe dar error de configuracion si falta una credencial SMTP", async () => {
    const m = createMailer({ emailProvider: "gmail-smtp", smtpUser: USUARIO, emailFrom: REMITENTE });
    expect(m).toBeInstanceOf(EnvioCorreoNoConfigurado);
    const error = await capturarError(m.enviarCodigoVerificacion(datos()));
    expect((error as Error).name).toBe("EnvioCorreoConfigError");
    expect((error as Error).message).not.toContain(USUARIO);
  });

  it("debe conservar el comportamiento previo con proveedor ausente, simulado o desconocido", () => {
    for (const proveedor of [undefined, "simulado", "otro"]) {
      expect(createMailer({ emailProvider: proveedor })).toBeInstanceOf(EnvioCorreoNoConfigurado);
    }
  });
});
