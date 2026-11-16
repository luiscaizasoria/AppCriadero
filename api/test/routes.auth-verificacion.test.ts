import { describe, it, expect } from "vitest";
import { createApp } from "../src/app";
import authRouter from "../src/auth/auth.routes";
import { EnvioCorreoHttp } from "../src/auth/correo/envio-correo-http";
import { EnvioCorreoSimulado } from "../src/auth/correo/envio-correo-simulado";
import {
  constantTimeCompare,
  generateNumericCode,
  secretsMatch,
  sha256Hex
} from "../src/shared/crypto";


const env = { JWT_SECRET: "secret-test-key" } as never;


function post(path: string, body: unknown, environment: unknown = env){

  const app = createApp({ authRouter });

  return app.request(
    `/api/v1/auth/${path}`,
    {
      method: "POST",
      body: JSON.stringify(body),
      headers: { "Content-Type": "application/json" }
    },
    environment as never
  );

}


describe("HTTP Auth verificacion", () => {


  it("debe responder 400 VALIDATION_ERROR en verify con un codigo que no es de 6 digitos", async () => {

    const response = await post("verification/verify", { email: "a@b.com", code: "12" });

    expect(response.status).toBe(400);

    const body = await response.json() as { error: string };
    expect(body.error).toBe("VALIDATION_ERROR");

  });


  it("debe responder 400 VALIDATION_ERROR en resend con un correo invalido", async () => {

    const response = await post("verification/resend", { email: "no-es-correo" });

    expect(response.status).toBe(400);

  });


  it("debe responder 500 CONFIGURATION_ERROR en verify sin JWT_SECRET", async () => {

    const response = await post("verification/verify", { email: "a@b.com", code: "123456" }, {});

    expect(response.status).toBe(500);

    const body = await response.json() as { error: string };
    expect(body.error).toBe("CONFIGURATION_ERROR");

  });


});


describe("Correo y utilidades criptograficas", () => {


  it("debe enviar el codigo por HTTP con el formato del proveedor y escapar el nombre", async () => {

    const llamadas: { url: string; init: { headers: Record<string, string>; body: string } }[] = [];

    const correo = new EnvioCorreoHttp({
      apiKey: "clave-prueba",
      from: "Kikirikis <no-responder@ejemplo.com>",
      fetchFn: async (url, init) => {
        llamadas.push({ url, init });
        return { ok: true, status: 200 };
      }
    });

    await correo.enviarCodigoVerificacion({
      to: "ana@test.com",
      nombre: "<b>Ana</b>",
      codigo: "654321",
      expiraEnMinutos: 10
    });

    expect(llamadas).toHaveLength(1);
    expect(llamadas[0].init.headers.Authorization).toBe("Bearer clave-prueba");

    const cuerpo = JSON.parse(llamadas[0].init.body);

    expect(cuerpo.to).toEqual(["ana@test.com"]);
    expect(cuerpo.subject).toBe("Tu código de verificación de Criadero Kikirikis");
    expect(cuerpo.text).toContain("654321");
    expect(cuerpo.text).toContain("10 minutos");
    expect(cuerpo.html).toContain("&lt;b&gt;Ana&lt;/b&gt;");
    expect(cuerpo.html).not.toContain("<b>Ana</b>");

  });


  it("debe fallar con error estable si el proveedor responde con error", async () => {

    const correo = new EnvioCorreoHttp({
      apiKey: "k",
      from: "x@y.com",
      fetchFn: async () => ({ ok: false, status: 403 })
    });

    await expect(
      correo.enviarCodigoVerificacion({ to: "a@b.com", nombre: "A", codigo: "111111", expiraEnMinutos: 10 })
    ).rejects.toThrow("403");

  });


  it("debe guardar los correos en el buzon simulado", async () => {

    const correo = new EnvioCorreoSimulado();

    await correo.enviarCodigoVerificacion({ to: "a@b.com", nombre: "A", codigo: "111111", expiraEnMinutos: 10 });

    expect(correo.buzon).toHaveLength(1);

  });


  it("debe comparar en tiempo constante y rechazar longitudes distintas", () => {

    expect(constantTimeCompare("abc", "abc")).toBe(true);
    expect(constantTimeCompare("abc", "abd")).toBe(false);
    expect(constantTimeCompare("abc", "abcd")).toBe(false);

  });


  it("debe rechazar secretos vacios o indefinidos en secretsMatch", () => {

    expect(secretsMatch(undefined, undefined)).toBe(false);
    expect(secretsMatch("", "")).toBe(false);
    expect(secretsMatch("s", undefined)).toBe(false);
    expect(secretsMatch("s", "s")).toBe(true);

  });


  it("debe generar codigos de 6 digitos y un SHA-256 hex de 64 caracteres", async () => {

    for(let i = 0; i < 50; i++){
      expect(generateNumericCode()).toMatch(/^\d{6}$/);
    }

    expect(await sha256Hex("abc")).toBe(
      "ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad"
    );

  });


});
