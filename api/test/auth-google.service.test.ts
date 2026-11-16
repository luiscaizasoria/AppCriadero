import { describe, it, expect, vi, afterEach } from "vitest";
import { SignJWT, jwtVerify } from "jose";
import type { JWTVerifyGetKey } from "jose";
import { AuthService } from "../src/auth/auth.service";
import { hashPassword } from "../src/auth/auth.repository";
import { FakeAuthRepository } from "./helpers/fake-auth.repository";
import {
  FakeVerificationRepository,
  FakeRateLimitRepository
} from "./helpers/fake-verification.repository";
import { EnvioCorreoSimulado } from "../src/auth/correo/envio-correo-simulado";
import {
  AHORA_MS,
  CLIENT_ID,
  crearGoogleFake,
  type GoogleFake
} from "./helpers/google-tokens";


const jwtSecret = "secret-test-key";

let google: GoogleFake;


async function crear(opciones: {
  clientIds?: string[];
  jwks?: JWTVerifyGetKey;
  verificacion?: boolean;
} = {}){

  google = google ?? await crearGoogleFake();

  const users = new FakeAuthRepository();
  const mailer = new EnvioCorreoSimulado();

  const service = new AuthService(
    users,
    jwtSecret,
    {
      enabled: opciones.verificacion ?? false,
      codes: new FakeVerificationRepository(users),
      limits: new FakeRateLimitRepository(),
      mailer,
      now: () => AHORA_MS
    },
    {
      clientIds: opciones.clientIds ?? [CLIENT_ID],
      jwks: opciones.jwks ?? google.jwks,
      now: () => AHORA_MS
    }
  );

  return { service, users, mailer };

}


function fila(email: string, extra: Record<string, unknown> = {}){

  return {
    id: "u-1",
    email,
    nombre: "Existente",
    password_hash: "pbkdf2_sha256$1$AAAA$BBBB" as string | null,
    active: 1,
    deleted_at: null as string | null,
    email_verified_at: "2026-01-01 00:00:00" as string | null,
    google_sub: null as string | null,
    ...extra
  };

}


afterEach(() => {
  vi.restoreAllMocks();
});


describe("AuthService Google Sign-In", () => {


  it("goo-01 debe emitir el JWT propio con un id_token valido", async () => {

    const { service, users } = await crear();

    const { result, created } = await service.loginWithGoogle({
      idToken: await google.firmar()
    });

    expect(result.success).toBe(true);
    expect(created).toBe(true);

    if(result.success){
      const verificado = await jwtVerify(
        result.data.accessToken,
        new TextEncoder().encode(jwtSecret)
      );
      expect(verificado.payload.sub).toBe(users.users[0].id);
      expect(verificado.payload.sub).not.toBe("google-sub-1");
      expect(result.data.expiresIn).toBe(3600);
      expect(result.data.user.email).toBe("ana@gmail.com");
    }

  });


  it("goo-02 debe rechazar un id_token firmado con otra clave", async () => {

    const { service, users } = await crear();
    const otro = await crearGoogleFake();

    const { result } = await service.loginWithGoogle({
      idToken: await google.firmar({ clave: otro.privateKey })
    });

    expect(result).toMatchObject({ success: false, error: "INVALID_GOOGLE_TOKEN" });
    expect(users.users).toHaveLength(0);

  });


  it("goo-03 debe rechazar un aud ajeno", async () => {

    const { service } = await crear();

    const { result } = await service.loginWithGoogle({
      idToken: await google.firmar({ aud: "otra-app.apps.googleusercontent.com" })
    });

    expect(result).toMatchObject({ error: "INVALID_GOOGLE_TOKEN" });

  });


  it("goo-03 debe aceptar cualquier aud de la lista de clientes", async () => {

    const { service } = await crear({ clientIds: ["x.apps", CLIENT_ID] });

    const { result } = await service.loginWithGoogle({
      idToken: await google.firmar()
    });

    expect(result.success).toBe(true);

  });


  it("goo-04 debe rechazar un iss ajeno y aceptar los dos de Google", async () => {

    const { service } = await crear();

    const ajeno = await service.loginWithGoogle({
      idToken: await google.firmar({ iss: "https://evil.example.com" })
    });
    expect(ajeno.result).toMatchObject({ error: "INVALID_GOOGLE_TOKEN" });

    const sinEsquema = await service.loginWithGoogle({
      idToken: await google.firmar({ iss: "accounts.google.com" })
    });
    expect(sinEsquema.result.success).toBe(true);

    const conEsquema = await service.loginWithGoogle({
      idToken: await google.firmar({ iss: "https://accounts.google.com", sub: "s2", email: "otra@gmail.com" })
    });
    expect(conEsquema.result.success).toBe(true);

  });


  it("goo-05 debe rechazar un exp vencido y tolerar 30 s de reloj", async () => {

    const { service } = await crear();
    const ahoraS = Math.floor(AHORA_MS / 1000);

    const vencido = await service.loginWithGoogle({
      idToken: await google.firmar({ exp: ahoraS - 120 })
    });
    expect(vencido.result).toMatchObject({ error: "INVALID_GOOGLE_TOKEN" });

    const dentro = await service.loginWithGoogle({
      idToken: await google.firmar({ exp: ahoraS - 10 })
    });
    expect(dentro.result.success).toBe(true);

  });


  it("goo-06 debe rechazar email_verified falso o ausente", async () => {

    const { service, users } = await crear();

    const falso = await service.loginWithGoogle({
      idToken: await google.firmar({ email_verified: false })
    });
    expect(falso.result).toMatchObject({ error: "GOOGLE_EMAIL_NOT_VERIFIED" });

    const ausente = await service.loginWithGoogle({
      idToken: await google.firmar({ sin: ["email_verified"] })
    });
    expect(ausente.result).toMatchObject({ error: "GOOGLE_EMAIL_NOT_VERIFIED" });

    const cadenaFalsa = await service.loginWithGoogle({
      idToken: await google.firmar({ email_verified: "false" })
    });
    expect(cadenaFalsa.result).toMatchObject({ error: "GOOGLE_EMAIL_NOT_VERIFIED" });

    expect(users.users).toHaveLength(0);

  });


  it("goo-06 debe aceptar email_verified como la cadena true", async () => {

    const { service } = await crear();

    const { result } = await service.loginWithGoogle({
      idToken: await google.firmar({ email_verified: "true" })
    });

    expect(result.success).toBe(true);

  });


  it("goo-07 debe vincular una cuenta verificada con contraseña y conservarla", async () => {

    const { service, users } = await crear();
    const hash = await hashPassword("Password123!");
    users.users.push(fila("ana@gmail.com", { password_hash: hash }));

    const { result, created } = await service.loginWithGoogle({
      idToken: await google.firmar()
    });

    expect(result.success).toBe(true);
    expect(created).toBe(false);
    expect(users.users[0].google_sub).toBe("google-sub-1");
    expect(users.users[0].password_hash).toBe(hash);

    const login = await service.login({
      email: "ana@gmail.com",
      password: "Password123!"
    });
    expect(login.success).toBe(true);

  });


  it("goo-08 debe vincular una cuenta sin verificar, anular su contraseña y su codigo", async () => {

    const { service, users } = await crear({ verificacion: true });
    const hash = await hashPassword("Password123!");
    users.users.push(fila("ana@gmail.com", { password_hash: hash, email_verified_at: null }));

    const { result } = await service.loginWithGoogle({
      idToken: await google.firmar()
    });

    expect(result.success).toBe(true);
    expect(users.users[0].email_verified_at).not.toBeNull();
    expect(users.users[0].password_hash).toBeNull();
    expect(users.codigosBorrados).toEqual(["u-1"]);

    const login = await service.login({
      email: "ana@gmail.com",
      password: "Password123!"
    });
    expect(login).toMatchObject({ success: false, error: "INVALID_CREDENTIALS" });

  });


  it("goo-09 debe crear un usuario nuevo verificado y sin contraseña, sin correo", async () => {

    const { service, users, mailer } = await crear({ verificacion: true });

    const { result, created } = await service.loginWithGoogle({
      idToken: await google.firmar({ name: "Ana Google" })
    });

    expect(result.success).toBe(true);
    expect(created).toBe(true);
    expect(users.users).toHaveLength(1);
    expect(users.users[0]).toMatchObject({
      email: "ana@gmail.com",
      nombre: "Ana Google",
      password_hash: null,
      google_sub: "google-sub-1"
    });
    expect(users.users[0].email_verified_at).not.toBeNull();
    expect(mailer.buzon).toHaveLength(0);

  });


  it("goo-09 debe usar la parte local del correo si el token no trae nombre", async () => {

    const { service, users } = await crear();

    await service.loginWithGoogle({
      idToken: await google.firmar({ sin: ["name"], email: "Pepe.Perez@Gmail.com" })
    });

    expect(users.users[0].email).toBe("pepe.perez@gmail.com");
    expect(users.users[0].nombre).toBe("pepe.perez");

  });


  it("goo-10 debe iniciar el segundo login por google_sub aunque cambie el correo", async () => {

    const { service, users } = await crear();

    const primero = await service.loginWithGoogle({
      idToken: await google.firmar()
    });
    const segundo = await service.loginWithGoogle({
      idToken: await google.firmar({ email: "nuevo@gmail.com" })
    });

    expect(primero.created).toBe(true);
    expect(segundo.created).toBe(false);
    expect(users.users).toHaveLength(1);
    expect(users.users[0].email).toBe("ana@gmail.com");

    if(primero.result.success && segundo.result.success){
      expect(segundo.result.data.user.id).toBe(primero.result.data.user.id);
    }

  });


  it("goo-11 debe rechazar un kid desconocido", async () => {

    const { service } = await crear();

    const { result } = await service.loginWithGoogle({
      idToken: await google.firmar({ kid: "kid-que-no-existe" })
    });

    expect(result).toMatchObject({ error: "INVALID_GOOGLE_TOKEN" });

  });


  it("goo-12 debe responder GOOGLE_UNAVAILABLE si el JWKS no responde", async () => {

    const caido: JWTVerifyGetKey = async () => {
      throw new TypeError("fetch failed");
    };
    const { service } = await crear({ jwks: caido });

    const { result } = await service.loginWithGoogle({
      idToken: await google.firmar()
    });

    expect(result).toMatchObject({ success: false, error: "GOOGLE_UNAVAILABLE" });

  });


  it("goo-13 debe responder GOOGLE_NOT_CONFIGURED sin lista de clientes", async () => {

    const { service, users } = await crear({ clientIds: [] });

    const { result } = await service.loginWithGoogle({
      idToken: await google.firmar()
    });

    expect(result).toMatchObject({ success: false, error: "GOOGLE_NOT_CONFIGURED" });
    expect(users.users).toHaveLength(0);

  });


  it("goo-14 debe responder INVALID_CREDENTIALS en el login por contraseña de una cuenta solo Google, sin PBKDF2", async () => {

    const { service } = await crear();
    await service.loginWithGoogle({ idToken: await google.firmar() });

    const derivar = vi.spyOn(crypto.subtle, "deriveBits");

    const login = await service.login({
      email: "ana@gmail.com",
      password: "Password123!"
    });

    expect(login).toMatchObject({ success: false, error: "INVALID_CREDENTIALS" });
    expect(derivar).not.toHaveBeenCalled();

  });


  it("goo-15 debe rechazar una cuenta inactiva o dada de baja con ese google_sub", async () => {

    const inactiva = await crear();
    inactiva.users.users.push(fila("ana@gmail.com", { active: 0, google_sub: "google-sub-1" }));
    const r1 = await inactiva.service.loginWithGoogle({ idToken: await google.firmar() });
    expect(r1.result).toMatchObject({ error: "USER_INACTIVE" });

    const baja = await crear();
    baja.users.users.push(fila("ana@gmail.com", {
      deleted_at: "2026-02-01 00:00:00",
      google_sub: "google-sub-1"
    }));
    const r2 = await baja.service.loginWithGoogle({ idToken: await google.firmar() });
    expect(r2.result).toMatchObject({ error: "INVALID_GOOGLE_TOKEN" });

  });


  it("goo-15 debe rechazar por correo una cuenta inactiva o dada de baja", async () => {

    const inactiva = await crear();
    inactiva.users.users.push(fila("ana@gmail.com", { active: 0 }));
    const r1 = await inactiva.service.loginWithGoogle({ idToken: await google.firmar() });
    expect(r1.result).toMatchObject({ error: "USER_INACTIVE" });

    const baja = await crear();
    baja.users.users.push(fila("ana@gmail.com", { deleted_at: "2026-02-01 00:00:00" }));
    const r2 = await baja.service.loginWithGoogle({ idToken: await google.firmar() });
    expect(r2.result).toMatchObject({ error: "EMAIL_ALREADY_REGISTERED" });

  });


  it("goo-16 debe responder GOOGLE_ACCOUNT_CONFLICT con otra cuenta Google del mismo correo", async () => {

    const { service, users } = await crear();
    users.users.push(fila("ana@gmail.com", { google_sub: "otro-sub" }));

    const { result } = await service.loginWithGoogle({
      idToken: await google.firmar({ sub: "google-sub-1" })
    });

    expect(result).toMatchObject({ success: false, error: "GOOGLE_ACCOUNT_CONFLICT" });
    expect(users.users[0].google_sub).toBe("otro-sub");

  });


  it("goo-17 debe rechazar tokens con alg none o HS256 firmado con la clave publica", async () => {

    const { service } = await crear();
    const b64 = (x: unknown) => Buffer.from(JSON.stringify(x)).toString("base64url");
    const payload = {
      iss: "https://accounts.google.com",
      aud: CLIENT_ID,
      sub: "google-sub-1",
      email: "ana@gmail.com",
      email_verified: true,
      exp: Math.floor(AHORA_MS / 1000) + 3600
    };

    const sinFirma = `${b64({ alg: "none", typ: "JWT" })}.${b64(payload)}.`;
    const r1 = await service.loginWithGoogle({ idToken: sinFirma });
    expect(r1.result).toMatchObject({ error: "INVALID_GOOGLE_TOKEN" });

    const hs = await new SignJWT(payload)
      .setProtectedHeader({ alg: "HS256", kid: "kid-prueba-1" })
      .sign(new TextEncoder().encode(google.publicJwk));
    const r2 = await service.loginWithGoogle({ idToken: hs });
    expect(r2.result).toMatchObject({ error: "INVALID_GOOGLE_TOKEN" });

  });


  it("goo-18 debe tolerar dos peticiones simultaneas sin duplicar la cuenta", async () => {

    const { service, users } = await crear();
    const idToken = await google.firmar();

    const [a, b] = await Promise.all([
      service.loginWithGoogle({ idToken }),
      service.loginWithGoogle({ idToken })
    ]);

    expect(a.result.success).toBe(true);
    expect(b.result.success).toBe(true);
    expect(users.users).toHaveLength(1);

  });


  it("goo-18 debe vincular una sola vez con peticiones simultaneas sobre una cuenta existente", async () => {

    const { service, users } = await crear();
    users.users.push(fila("ana@gmail.com"));
    const idToken = await google.firmar();

    const [a, b] = await Promise.all([
      service.loginWithGoogle({ idToken }),
      service.loginWithGoogle({ idToken })
    ]);

    expect(a.result.success).toBe(true);
    expect(b.result.success).toBe(true);
    expect(users.users).toHaveLength(1);
    expect(users.users[0].google_sub).toBe("google-sub-1");

  });


  it("goo-19 debe funcionar con la bandera de verificacion apagada y encendida", async () => {

    for(const verificacion of [false, true]){
      const { service } = await crear({ verificacion });
      const { result } = await service.loginWithGoogle({
        idToken: await google.firmar()
      });
      expect(result.success).toBe(true);
    }

  });


  it("goo-20 debe responder VALIDATION_ERROR si falta idToken o no es cadena", async () => {

    const { service } = await crear();

    for(const body of [{}, { idToken: "" }, { idToken: 123 }, { idToken: null }]){
      const { result } = await service.loginWithGoogle(body as never);
      expect(result).toMatchObject({ success: false, error: "VALIDATION_ERROR" });
    }

  });


  it("debe rechazar un token mal formado sin llamar al repositorio", async () => {

    const { service, users } = await crear();

    const { result } = await service.loginWithGoogle({ idToken: "no-es-un-jwt" });

    expect(result).toMatchObject({ error: "INVALID_GOOGLE_TOKEN" });
    expect(users.users).toHaveLength(0);

  });


});
