import { describe, it, expect, beforeEach } from "vitest";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { AuthService } from "../../src/auth/auth.service";
import { D1AuthRepository } from "../../src/auth/auth.repository";
import { D1VerificationRepository } from "../../src/auth/verification.repository";
import { D1RateLimitRepository } from "../../src/auth/rate-limit.repository";
import { EnvioCorreoSimulado } from "../../src/auth/correo/envio-correo-simulado";
import { createApp } from "../../src/app";
import authRouter from "../../src/auth/auth.routes";
import { LocalD1Adapter } from "../helpers/local-d1.adapter";


const jwtSecret = "integration-secret-key";

const registro = {
  email: "ver@test.com",
  nombre: "Ver",
  password: "Password123!"
};

type Fila = Record<string, unknown> | null;

let db: LocalD1Adapter;
let mailer: EnvioCorreoSimulado;
let reloj: { ahora: number };
let service: AuthService;


function crearServicio(enabled = true){

  return new AuthService(
    new D1AuthRepository(db as never),
    jwtSecret,
    {
      enabled,
      codes: new D1VerificationRepository(db as never),
      limits: new D1RateLimitRepository(db as never),
      mailer,
      now: () => reloj.ahora,
      generateCode: () => "123456"
    }
  );

}


async function usuario(email: string){

  return await db
    .prepare("SELECT * FROM users WHERE email = ?")
    .bind(email)
    .first() as Fila;

}


async function contar(tabla: string){

  const fila = await db
    .prepare(`SELECT COUNT(*) AS n FROM ${tabla}`)
    .bind()
    .first() as { n: number };

  return fila.n;

}


describe("Verificacion de cuenta D1 Local Integration", () => {


  beforeEach(() => {

    db = new LocalD1Adapter();
    mailer = new EnvioCorreoSimulado();
    reloj = { ahora: Date.now() };
    service = crearServicio(true);

  });


  it("ver-01 debe crear usuario sin verificar, un codigo con hash y un correo, sin token", async () => {

    const r = await service.register(registro);

    expect(r.success).toBe(true);
    if(r.success){
      expect("accessToken" in r.data).toBe(false);
    }

    const user = await usuario(registro.email);
    expect(user?.email_verified_at).toBeNull();

    const codigo = await db
      .prepare("SELECT * FROM email_verification_codes")
      .bind()
      .first() as { code_hash: string; salt: string; attempts: number };

    expect(await contar("email_verification_codes")).toBe(1);
    expect(codigo.code_hash).toMatch(/^[0-9a-f]{64}$/);
    expect(codigo.code_hash).not.toContain("123456");
    expect(mailer.buzon).toHaveLength(1);
    expect(mailer.buzon[0].codigo).toBe("123456");

  });


  it("ver-02 debe emitir token y dejar la cuenta verificada con la bandera apagada", async () => {

    const apagado = crearServicio(false);

    const r = await apagado.register(registro);

    expect(r.success).toBe(true);
    if(r.success){
      expect("accessToken" in r.data).toBe(true);
    }

    expect((await usuario(registro.email))?.email_verified_at).not.toBeNull();
    expect(await contar("email_verification_codes")).toBe(0);
    expect(mailer.buzon).toHaveLength(0);

    const login = await apagado.login({ email: registro.email, password: registro.password });
    expect(login.success).toBe(true);

  });


  it("ver-03 debe dar EMAIL_NOT_VERIFIED solo con contrasena correcta", async () => {

    await service.register(registro);

    const mal = await service.login({ email: registro.email, password: "Incorrecta123" });
    const bien = await service.login({ email: registro.email, password: registro.password });

    expect(!mal.success && mal.error).toBe("INVALID_CREDENTIALS");
    expect(!bien.success && bien.error).toBe("EMAIL_NOT_VERIFIED");

  });


  it("ver-04 debe verificar, emitir token, borrar el codigo y permitir el login", async () => {

    await service.register(registro);

    const r = await service.verifyEmail({ email: registro.email, code: "123456" });

    expect(r.success).toBe(true);
    if(r.success){
      expect(r.data.accessToken).toBeDefined();
    }

    expect((await usuario(registro.email))?.email_verified_at).not.toBeNull();
    expect(await contar("email_verification_codes")).toBe(0);

    const login = await service.login({ email: registro.email, password: registro.password });
    expect(login.success).toBe(true);

  });


  it("ver-05 debe invalidar el codigo tras 5 fallos aunque luego llegue el correcto", async () => {

    await service.register(registro);

    const errores: string[] = [];

    for(let i = 0; i < 5; i++){
      const r = await service.verifyEmail({ email: registro.email, code: "999999" });
      errores.push(!r.success ? r.error : "ok");
    }

    expect(errores[3]).toBe("INVALID_VERIFICATION_CODE");
    expect(errores[4]).toBe("VERIFICATION_ATTEMPTS_EXCEEDED");

    const fila = await db
      .prepare("SELECT attempts FROM email_verification_codes")
      .bind()
      .first() as { attempts: number };
    expect(fila.attempts).toBe(5);

    const correcto = await service.verifyEmail({ email: registro.email, code: "123456" });
    expect(correcto.success).toBe(false);

  });


  it("ver-06 debe rechazar un codigo vencido (reloj +10 min)", async () => {

    await service.register(registro);

    reloj.ahora += 10 * 60 * 1000 + 1;

    const r = await service.verifyEmail({ email: registro.email, code: "123456" });

    expect(!r.success && r.error).toBe("INVALID_VERIFICATION_CODE");

  });


  it("ver-07 debe reemplazar el codigo al reenviar, con un solo codigo activo e intentos en 0", async () => {

    await service.register(registro);
    await service.verifyEmail({ email: registro.email, code: "000000" });

    const antes = await db
      .prepare("SELECT code_hash, salt FROM email_verification_codes")
      .bind()
      .first() as { code_hash: string; salt: string };

    reloj.ahora += 61_000;

    const r = await service.resendCode({ email: registro.email });
    expect(r.success).toBe(true);

    const despues = await db
      .prepare("SELECT code_hash, salt, attempts FROM email_verification_codes")
      .bind()
      .first() as { code_hash: string; salt: string; attempts: number };

    expect(await contar("email_verification_codes")).toBe(1);
    expect(despues.attempts).toBe(0);
    expect(despues.salt).not.toBe(antes.salt);
    expect(despues.code_hash).not.toBe(antes.code_hash);
    expect(mailer.buzon).toHaveLength(2);

  });


  it("ver-08 debe aplicar el cooldown de 60 s y responder igual con un correo inexistente", async () => {

    await service.register(registro);

    const pronto = await service.resendCode({ email: registro.email });
    expect(!pronto.success && pronto.error).toBe("RATE_LIMITED");

    const inexistente = await service.resendCode({ email: "nadie@test.com" });
    expect(inexistente).toEqual({ success: true, data: { resendAfterSeconds: 60 } });

    const inexistente2 = await service.resendCode({ email: "nadie@test.com" });
    expect(!inexistente2.success && inexistente2.error).toBe("RATE_LIMITED");

    reloj.ahora += 61_000;
    const ok = await service.resendCode({ email: registro.email });
    expect(ok.success).toBe(true);

  });


  it("ver-09 debe limitar por correo, por IP y global, y reiniciar al vencer la ventana", async () => {

    // Por correo: 5 envios por hora.
    await service.register(registro);
    for(let i = 0; i < 4; i++){
      reloj.ahora += 61_000;
      expect((await service.resendCode({ email: registro.email })).success).toBe(true);
    }
    reloj.ahora += 61_000;
    const sexto = await service.resendCode({ email: registro.email });
    expect(!sexto.success && sexto.error).toBe("RATE_LIMITED");
    expect(!sexto.success && sexto.retryAfterSeconds).toBeGreaterThan(0);

    // Reinicio al vencer la ventana.
    reloj.ahora += 3_600_000;
    expect((await service.resendCode({ email: registro.email })).success).toBe(true);

    // Por IP: 5 registros por hora.
    const resultados: string[] = [];
    for(let i = 0; i < 6; i++){
      const r = await service.register(
        { ...registro, email: `ip${i}@test.com` },
        { ip: "203.0.113.7" }
      );
      resultados.push(r.success ? "ok" : r.error);
    }
    expect(resultados).toEqual(["ok", "ok", "ok", "ok", "ok", "RATE_LIMITED"]);

    // Global: 80 envios por dia (ya hay 6 + 5 = 11 envios hasta aqui; el sexto
    // registro por IP fue rechazado antes de enviar).
    await db.exec(`DELETE FROM rate_limits WHERE bucket = 'send_global'`);

    let limitados = 0;
    for(let i = 0; i < 82; i++){
      const r = await service.register(
        { ...registro, email: `g${i}@test.com` },
        { ip: `198.51.${Math.floor(i / 4)}.${i % 4}` }
      );
      if(!r.success && r.error === "RATE_LIMITED"){
        limitados++;
      }
    }
    expect(limitados).toBe(2);

  });


  it("ver-10 debe tratar un registro repetido sin verificar como reintento y dar 409 si esta verificado", async () => {

    await service.register(registro);

    reloj.ahora += 61_000;

    const r = await service.register({ ...registro, nombre: "Nombre Nuevo", password: "ClaveNueva123" });
    expect(r.success).toBe(true);
    expect(await contar("users")).toBe(1);
    expect((await usuario(registro.email))?.nombre).toBe("Nombre Nuevo");
    expect(mailer.buzon).toHaveLength(2);

    const login = await service.login({ email: registro.email, password: "ClaveNueva123" });
    expect(!login.success && login.error).toBe("EMAIL_NOT_VERIFIED");

    await service.verifyEmail({ email: registro.email, code: "123456" });

    const dup = await service.register(registro);
    expect(!dup.success && dup.error).toBe("EMAIL_ALREADY_REGISTERED");

  });


  it("ver-11 debe cambiar el correo con contrasena y rechazar los casos invalidos", async () => {

    await service.register(registro);

    const mal = await service.changeEmail({
      email: registro.email, password: "Incorrecta123", nuevoEmail: "nuevo@test.com"
    });
    expect(!mal.success && mal.error).toBe("INVALID_CREDENTIALS");

    // Correo en uso por una cuenta verificada.
    await service.register({ ...registro, email: "otra@test.com" }, { ip: "192.0.2.1" });
    await service.verifyEmail({ email: "otra@test.com", code: "123456" });

    const enUso = await service.changeEmail({
      email: registro.email, password: registro.password, nuevoEmail: "otra@test.com"
    });
    expect(!enUso.success && enUso.error).toBe("EMAIL_ALREADY_REGISTERED");

    // Un correo ocupado por una cuenta sin verificar se libera.
    await service.register({ ...registro, email: "libre@test.com" }, { ip: "192.0.2.2" });

    const ok = await service.changeEmail({
      email: registro.email, password: registro.password, nuevoEmail: "libre@test.com"
    });
    expect(ok.success).toBe(true);
    expect(await usuario(registro.email)).toBeNull();
    expect(await usuario("libre@test.com")).not.toBeNull();
    expect(mailer.ultimo()?.to).toBe("libre@test.com");

    // Cuenta verificada: no se puede cambiar por aqui.
    await service.verifyEmail({ email: "libre@test.com", code: "123456" });
    const verificada = await service.changeEmail({
      email: "libre@test.com", password: registro.password, nuevoEmail: "otro@test.com"
    });
    expect(!verificada.success && verificada.error).toBe("INVALID_CREDENTIALS");

  });


  it("ver-12 debe dejar verificadas las cuentas previas con la migracion 0012", async () => {

    await db.exec(`
      INSERT INTO users (id, email, nombre, password_hash, active)
      VALUES ('u-previo', 'previo@test.com', 'Previo', 'x', 1);
    `);
    expect((await usuario("previo@test.com"))?.email_verified_at).toBeNull();

    const sql = readFileSync(
      fileURLToPath(new URL("../../migrations/0012_verificacion_cuenta.sql", import.meta.url)),
      "utf8"
    );
    const update = sql.match(/UPDATE users[\s\S]*?;/);
    expect(update).not.toBeNull();

    await db.exec(update![0]);

    expect((await usuario("previo@test.com"))?.email_verified_at).not.toBeNull();

    // Con la bandera encendida entra sin verificacion.
    await db.exec(`UPDATE users SET password_hash = NULL WHERE id = 'u-previo'`);
    const hash = await new AuthService(new D1AuthRepository(db as never), jwtSecret)
      .register({ email: "b@test.com", nombre: "B", password: "Password123!" });
    expect(hash.success).toBe(true);

    const fila = await usuario("b@test.com");
    await db.exec(`UPDATE users SET email_verified_at = NULL WHERE id = '${fila!.id}'`);
    await db.exec(update![0]);

    const login = await service.login({ email: "b@test.com", password: "Password123!" });
    expect(login.success).toBe(true);

  });


  it("ver-13 debe borrar cuentas sin verificar de mas de 24 h y conservar las verificadas o con criadero", async () => {

    await db.exec(`
      INSERT INTO users (id, email, nombre, password_hash, active, created_at)
      VALUES ('u-viejo', 'viejo@test.com', 'Viejo', 'x', 1, '2020-01-01 00:00:00'),
             ('u-verif', 'verif@test.com', 'Verif', 'x', 1, '2020-01-01 00:00:00'),
             ('u-crit', 'crit@test.com', 'Crit', 'x', 1, '2020-01-01 00:00:00'),
             ('u-goog', 'goog@test.com', 'Goog', 'x', 1, '2020-01-01 00:00:00');
      UPDATE users SET email_verified_at = '2020-01-01 00:00:00' WHERE id = 'u-verif';
      UPDATE users SET google_sub = 'sub-1' WHERE id = 'u-goog';
      INSERT INTO criaderos (id, user_id, nombre) VALUES ('c-1', 'u-crit', 'Mi criadero');
      INSERT INTO email_verification_codes (id, user_id, code_hash, salt, expires_at, sent_at)
      VALUES ('k-1', 'u-viejo', 'h', 's', 1, 1);
    `);

    await service.register({ ...registro, email: "nuevo@test.com" });

    expect(await usuario("viejo@test.com")).toBeNull();
    expect(await db.prepare("SELECT id FROM email_verification_codes WHERE id = 'k-1'").bind().first()).toBeNull();
    expect(await usuario("verif@test.com")).not.toBeNull();
    expect(await usuario("crit@test.com")).not.toBeNull();
    expect(await usuario("goog@test.com")).not.toBeNull();

    // Una cuenta recien creada sobrevive; a las 25 h se borra en el siguiente registro.
    reloj.ahora += 25 * 3_600_000;
    await service.register({ ...registro, email: "otro@test.com" });
    expect(await usuario("nuevo@test.com")).toBeNull();
    expect(await usuario("otro@test.com")).not.toBeNull();

  });


  it("ver-14 debe ignorar las cabeceras de omision sin secreto y honrarlas con el secreto", async () => {

    const app = createApp({ authRouter });

    const registrar = (entorno: Record<string, unknown>, cabeceras: Record<string, string>, email: string) =>
      app.request(
        "/api/v1/auth/register",
        {
          method: "POST",
          body: JSON.stringify({ ...registro, email }),
          headers: { "Content-Type": "application/json", ...cabeceras }
        },
        { DB: db, JWT_SECRET: jwtSecret, EMAIL_VERIFICATION_REQUIRED: "true", ...entorno } as never
      );

    // Sin binding: la cabecera se ignora (sin proveedor configurado -> CONFIGURATION_ERROR).
    const sinSecreto = await registrar({}, { "X-Verification-Bypass": "algo" }, "a1@test.com");
    expect(sinSecreto.status).toBe(500);

    // Binding vacio y cabecera vacia: undefined/"" nunca coinciden.
    const vacio = await registrar({ VERIFICATION_BYPASS_SECRET: "" }, { "X-Verification-Bypass": "" }, "a2@test.com");
    expect(vacio.status).toBe(500);

    // Valor erroneo.
    const erroneo = await registrar({ VERIFICATION_BYPASS_SECRET: "secreto-ok" }, { "X-Verification-Bypass": "otro" }, "a3@test.com");
    expect(erroneo.status).toBe(500);

    // Sin bypass, ni siquiera codigoPrueba.
    const sinTest = await registrar({}, { "X-Verification-Test-Code": "x" }, "a4@test.com");
    expect(await sinTest.text()).not.toContain("codigoPrueba");

    // Con el secreto: cuenta verificada con token.
    const ok = await registrar({ VERIFICATION_BYPASS_SECRET: "secreto-ok" }, { "X-Verification-Bypass": "secreto-ok" }, "b1@test.com");
    expect(ok.status).toBe(201);
    const cuerpo = await ok.json() as { data: { accessToken: string } };
    expect(cuerpo.data.accessToken).toBeDefined();
    expect((await usuario("b1@test.com"))?.email_verified_at).not.toBeNull();

    // Con el secreto en la otra cabecera: cuenta sin verificar y codigoPrueba, sin correo.
    const prueba = await registrar({ VERIFICATION_BYPASS_SECRET: "secreto-ok" }, { "X-Verification-Test-Code": "secreto-ok" }, "b2@test.com");
    expect(prueba.status).toBe(201);
    const cuerpo2 = await prueba.json() as { data: { codigoPrueba: string; verificationRequired: boolean } };
    expect(cuerpo2.data.verificationRequired).toBe(true);
    expect(cuerpo2.data.codigoPrueba).toMatch(/^\d{6}$/);
    expect((await usuario("b2@test.com"))?.email_verified_at).toBeNull();

    // El codigoPrueba verifica de verdad por HTTP.
    const verificar = await app.request(
      "/api/v1/auth/verification/verify",
      {
        method: "POST",
        body: JSON.stringify({ email: "b2@test.com", code: cuerpo2.data.codigoPrueba }),
        headers: { "Content-Type": "application/json" }
      },
      { DB: db, JWT_SECRET: jwtSecret } as never
    );
    expect(verificar.status).toBe(200);

  });


  it("ver-15 debe devolver 502 y dejar la cuenta sin verificar si falla el proveedor", async () => {

    mailer.fallar = true;

    const r = await service.register(registro);

    expect(!r.success && r.error).toBe("EMAIL_DELIVERY_FAILED");
    expect((await usuario(registro.email))?.email_verified_at).toBeNull();

    // La cuenta sigue el camino login -> codigo -> reenviar.
    mailer.fallar = false;
    reloj.ahora += 61_000;
    expect((await service.resendCode({ email: registro.email })).success).toBe(true);

  });


  it("ver-16 debe exigir token en los endpoints protegidos (401 sin token)", async () => {

    const app = createApp();

    const response = await app.request(
      "/api/v1/criaderos",
      { method: "GET" },
      { DB: db, JWT_SECRET: jwtSecret } as never
    );

    expect(response.status).toBe(401);

  });


  it("ver-17 debe devolver 429 con Retry-After por HTTP al superar el limite", async () => {

    const app = createApp({ authRouter });

    const entorno = {
      DB: db,
      JWT_SECRET: jwtSecret,
      EMAIL_VERIFICATION_REQUIRED: "true",
      VERIFICATION_BYPASS_SECRET: "secreto-ok"
    };

    const llamar = () => app.request(
      "/api/v1/auth/verification/resend",
      {
        method: "POST",
        body: JSON.stringify({ email: "x@test.com" }),
        headers: { "Content-Type": "application/json" }
      },
      entorno as never
    );

    expect((await llamar()).status).toBe(200);

    const segunda = await llamar();
    expect(segunda.status).toBe(429);
    expect(Number(segunda.headers.get("Retry-After"))).toBeGreaterThan(0);

    const cuerpo = await segunda.json() as { error: string; retryAfterSeconds: number };
    expect(cuerpo.error).toBe("RATE_LIMITED");

  });


  it("ver-18 debe dar la misma respuesta de verify y resend para un correo inexistente que para uno sin codigo", async () => {

    await service.register(registro);
    await service.verifyEmail({ email: registro.email, code: "123456" });

    const verificado = await service.verifyEmail({ email: registro.email, code: "123456" });
    const inexistente = await service.verifyEmail({ email: "nadie@test.com", code: "123456" });

    expect(verificado).toEqual(inexistente);

    reloj.ahora += 61_000;

    const r1 = await service.resendCode({ email: registro.email });
    const r2 = await service.resendCode({ email: "nadie2@test.com" });

    expect(r1).toEqual(r2);

  });


  it("debe comprobar que el correo de verificacion no se envia en modo test-code", async () => {

    const r = await service.register(registro, { bypass: "test-code" });

    expect(r.success).toBe(true);
    expect(mailer.buzon).toHaveLength(0);
    expect(await contar("email_verification_codes")).toBe(1);

  });


});
