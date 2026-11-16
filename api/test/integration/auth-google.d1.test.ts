import { describe, it, expect, beforeEach } from "vitest";
import { AuthService } from "../../src/auth/auth.service";
import { D1AuthRepository } from "../../src/auth/auth.repository";
import { D1VerificationRepository } from "../../src/auth/verification.repository";
import { D1RateLimitRepository } from "../../src/auth/rate-limit.repository";
import { EnvioCorreoSimulado } from "../../src/auth/correo/envio-correo-simulado";
import { createApp } from "../../src/app";
import { createAuthRouter } from "../../src/auth/auth.routes";
import { LocalD1Adapter } from "../helpers/local-d1.adapter";
import {
  AHORA_MS,
  CLIENT_ID,
  crearGoogleFake,
  type GoogleFake
} from "../helpers/google-tokens";


const jwtSecret = "integration-secret-key";

type Fila = Record<string, unknown> | null;

let db: LocalD1Adapter;
let google: GoogleFake;
let mailer: EnvioCorreoSimulado;
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
      now: () => AHORA_MS,
      generateCode: () => "123456"
    },
    {
      clientIds: [CLIENT_ID],
      jwks: google.jwks,
      now: () => AHORA_MS
    }
  );

}


async function usuarios(email: string){

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


describe("Google Sign-In D1 Local Integration", () => {


  beforeEach(async () => {

    db = new LocalD1Adapter();
    google = await crearGoogleFake();
    mailer = new EnvioCorreoSimulado();
    service = crearServicio(true);

  });


  it("goo-07 debe vincular una cuenta verificada y conservar su contraseña", async () => {

    const apagado = crearServicio(false);
    await apagado.register({
      email: "ana@gmail.com",
      nombre: "Ana",
      password: "Password123!"
    });
    const antes = await usuarios("ana@gmail.com");

    const { result } = await service.loginWithGoogle({
      idToken: await google.firmar()
    });

    expect(result.success).toBe(true);

    const despues = await usuarios("ana@gmail.com");
    expect(despues?.google_sub).toBe("google-sub-1");
    expect(despues?.password_hash).toBe(antes?.password_hash);
    expect(despues?.id).toBe(antes?.id);

    const login = await service.login({
      email: "ana@gmail.com",
      password: "Password123!"
    });
    expect(login.success).toBe(true);

  });


  it("goo-08 debe vincular una cuenta sin verificar, anular la contraseña y borrar su codigo", async () => {

    await service.register({
      email: "ana@gmail.com",
      nombre: "Ana",
      password: "Password123!"
    });
    expect(await contar("email_verification_codes")).toBe(1);
    expect((await usuarios("ana@gmail.com"))?.email_verified_at).toBeNull();

    const { result, created } = await service.loginWithGoogle({
      idToken: await google.firmar()
    });

    expect(result.success).toBe(true);
    expect(created).toBe(false);

    const user = await usuarios("ana@gmail.com");
    expect(user?.google_sub).toBe("google-sub-1");
    expect(user?.password_hash).toBeNull();
    expect(user?.email_verified_at).not.toBeNull();
    expect(await contar("email_verification_codes")).toBe(0);

    const login = await service.login({
      email: "ana@gmail.com",
      password: "Password123!"
    });
    expect(login).toMatchObject({ success: false, error: "INVALID_CREDENTIALS" });

  });


  it("goo-09 debe crear el usuario nuevo verificado y sin contraseña", async () => {

    const { result, created } = await service.loginWithGoogle({
      idToken: await google.firmar()
    });

    expect(result.success).toBe(true);
    expect(created).toBe(true);

    const user = await usuarios("ana@gmail.com");
    expect(user?.password_hash).toBeNull();
    expect(user?.google_sub).toBe("google-sub-1");
    expect(user?.email_verified_at).not.toBeNull();
    expect(user?.active).toBe(1);
    expect(await contar("email_verification_codes")).toBe(0);
    expect(mailer.buzon).toHaveLength(0);

  });


  it("goo-10 debe iniciar el segundo login por google_sub aunque cambie el correo", async () => {

    await service.loginWithGoogle({ idToken: await google.firmar() });

    const { result, created } = await service.loginWithGoogle({
      idToken: await google.firmar({ email: "cambiado@gmail.com" })
    });

    expect(result.success).toBe(true);
    expect(created).toBe(false);
    expect(await contar("users")).toBe(1);
    expect(await usuarios("cambiado@gmail.com")).toBeNull();

  });


  it("goo-16 debe responder GOOGLE_ACCOUNT_CONFLICT y respetar UNIQUE(google_sub)", async () => {

    await service.loginWithGoogle({ idToken: await google.firmar() });

    const conflicto = await service.loginWithGoogle({
      idToken: await google.firmar({ sub: "otro-sub" })
    });
    expect(conflicto.result).toMatchObject({ error: "GOOGLE_ACCOUNT_CONFLICT" });

    const user = await usuarios("ana@gmail.com");
    expect(user?.google_sub).toBe("google-sub-1");

    // Otro correo con el mismo sub de Google: el sub ya esta ligado, entra a esa cuenta.
    const mismoSub = await service.loginWithGoogle({
      idToken: await google.firmar({ email: "otro@gmail.com" })
    });
    expect(mismoSub.result.success).toBe(true);
    expect(await contar("users")).toBe(1);

  });


  it("goo-18 debe tolerar dos peticiones simultaneas de un usuario nuevo", async () => {

    const idToken = await google.firmar();

    const [a, b] = await Promise.all([
      service.loginWithGoogle({ idToken }),
      service.loginWithGoogle({ idToken })
    ]);

    expect(a.result.success).toBe(true);
    expect(b.result.success).toBe(true);
    expect(await contar("users")).toBe(1);

  });


  it("goo-18 debe vincular una sola vez dos peticiones simultaneas sobre una cuenta existente", async () => {

    await crearServicio(false).register({
      email: "ana@gmail.com",
      nombre: "Ana",
      password: "Password123!"
    });
    const idToken = await google.firmar();

    const [a, b] = await Promise.all([
      service.loginWithGoogle({ idToken }),
      service.loginWithGoogle({ idToken })
    ]);

    expect(a.result.success).toBe(true);
    expect(b.result.success).toBe(true);
    expect(await contar("users")).toBe(1);
    expect((await usuarios("ana@gmail.com"))?.google_sub).toBe("google-sub-1");

  });


  it("debe responder 201 al crear y 200 al repetir por HTTP", async () => {

    const app = createApp({
      authRouter: createAuthRouter({ googleJwks: google.jwks })
    });
    const bindings = {
      DB: db as never,
      JWT_SECRET: jwtSecret,
      GOOGLE_CLIENT_IDS: ` otro.apps , ${CLIENT_ID} `
    };
    // El reloj de la ruta es el real: token con exp lejano.
    const idToken = await google.firmar({
      exp: Math.floor(Date.now() / 1000) + 3600
    });

    const pedir = () => app.request(
      "/api/v1/auth/google",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ idToken })
      },
      bindings
    );

    const primero = await pedir();
    const cuerpo = await primero.json() as {
      success: boolean;
      data: { accessToken: string; user: { email: string } };
    };
    expect(primero.status).toBe(201);
    expect(cuerpo.success).toBe(true);
    expect(cuerpo.data.user.email).toBe("ana@gmail.com");
    expect(typeof cuerpo.data.accessToken).toBe("string");

    const segundo = await pedir();
    expect(segundo.status).toBe(200);

  });


});
