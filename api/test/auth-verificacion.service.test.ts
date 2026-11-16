import { describe, it, expect } from "vitest";
import { AuthService } from "../src/auth/auth.service";
import { FakeAuthRepository } from "./helpers/fake-auth.repository";
import {
  FakeVerificationRepository,
  FakeRateLimitRepository
} from "./helpers/fake-verification.repository";
import { EnvioCorreoSimulado } from "../src/auth/correo/envio-correo-simulado";


const jwtSecret = "secret-test-key";

const registro = {
  email: "ana@test.com",
  nombre: "Ana",
  password: "Password123!"
};


function crear(enabled = true){

  const users = new FakeAuthRepository();
  const codes = new FakeVerificationRepository(users);
  const limits = new FakeRateLimitRepository();
  const mailer = new EnvioCorreoSimulado();
  const reloj = { ahora: 1_700_000_000_000 };

  const service = new AuthService(users, jwtSecret, {
    enabled,
    codes,
    limits,
    mailer,
    now: () => reloj.ahora,
    generateCode: () => "123456"
  });

  return { service, users, codes, limits, mailer, reloj };

}


describe("AuthService verificacion de cuenta", () => {


  it("debe registrar sin token y enviar el codigo con la bandera encendida", async () => {

    const { service, users, codes, mailer } = crear();

    const result = await service.register(registro);

    expect(result.success).toBe(true);

    if(result.success){
      expect(result.data).toMatchObject({
        verificationRequired: true,
        email: "ana@test.com",
        expiresIn: 600,
        resendAfterSeconds: 60
      });
      expect("accessToken" in result.data).toBe(false);
    }

    expect(users.users[0].email_verified_at).toBeNull();
    expect(codes.codes.size).toBe(1);
    expect(mailer.buzon).toHaveLength(1);
    expect(mailer.ultimo()?.codigo).toBe("123456");

    // El codigo nunca se guarda en claro.
    const fila = [...codes.codes.values()][0];
    expect(fila.codeHash).not.toContain("123456");

  });


  it("debe registrar con token y cuenta verificada con la bandera apagada", async () => {

    const { service, users, mailer } = crear(false);

    const result = await service.register(registro);

    expect(result.success).toBe(true);

    if(result.success){
      expect("accessToken" in result.data).toBe(true);
    }

    expect(users.users[0].email_verified_at).not.toBeNull();
    expect(mailer.buzon).toHaveLength(0);

  });


  it("debe devolver EMAIL_NOT_VERIFIED solo con la contrasena correcta", async () => {

    const { service } = crear();

    await service.register(registro);

    const mal = await service.login({ email: registro.email, password: "Incorrecta123" });

    expect(mal.success).toBe(false);
    if(!mal.success){
      expect(mal.error).toBe("INVALID_CREDENTIALS");
    }

    const bien = await service.login({ email: registro.email, password: registro.password });

    expect(bien.success).toBe(false);
    if(!bien.success){
      expect(bien.error).toBe("EMAIL_NOT_VERIFIED");
      expect(bien.data).toMatchObject({ hasActiveCode: true, resendAfterSeconds: 60 });
    }

  });


  it("debe verificar con el codigo correcto, emitir token y permitir el login", async () => {

    const { service, users, codes } = crear();

    await service.register(registro);

    const result = await service.verifyEmail({ email: registro.email, code: "123456" });

    expect(result.success).toBe(true);
    if(result.success){
      expect(result.data.accessToken).toBeDefined();
    }

    expect(users.users[0].email_verified_at).not.toBeNull();
    expect(codes.codes.size).toBe(0);

    const login = await service.login({ email: registro.email, password: registro.password });
    expect(login.success).toBe(true);

  });


  it("debe invalidar el codigo al quinto intento fallido", async () => {

    const { service } = crear();

    await service.register(registro);

    const errores: string[] = [];

    for(let i = 0; i < 5; i++){
      const r = await service.verifyEmail({ email: registro.email, code: "000000" });
      if(!r.success){
        errores.push(r.error);
      }
    }

    expect(errores).toEqual([
      "INVALID_VERIFICATION_CODE",
      "INVALID_VERIFICATION_CODE",
      "INVALID_VERIFICATION_CODE",
      "INVALID_VERIFICATION_CODE",
      "VERIFICATION_ATTEMPTS_EXCEEDED"
    ]);

    const correcto = await service.verifyEmail({ email: registro.email, code: "123456" });

    expect(correcto.success).toBe(false);

  });


  it("debe rechazar un codigo vencido", async () => {

    const { service, reloj } = crear();

    await service.register(registro);

    reloj.ahora += 10 * 60 * 1000 + 1;

    const result = await service.verifyEmail({ email: registro.email, code: "123456" });

    expect(result.success).toBe(false);
    if(!result.success){
      expect(result.error).toBe("INVALID_VERIFICATION_CODE");
    }

  });


  it("debe rechazar un codigo con formato distinto de 6 digitos", async () => {

    const { service } = crear();

    const result = await service.verifyEmail({ email: registro.email, code: "12ab" });

    expect(result.success).toBe(false);
    if(!result.success){
      expect(result.error).toBe("VALIDATION_ERROR");
    }

  });


  it("debe reemplazar el codigo al reenviar y reiniciar los intentos", async () => {

    const { service, reloj, mailer, codes } = crear();

    let n = 0;
    const secuencia = ["111111", "222222"];

    // Generador distinto por envio.
    (service as unknown as { verification: { generateCode: () => string } })
      .verification.generateCode = () => secuencia[n++];

    await service.register(registro);
    await service.verifyEmail({ email: registro.email, code: "000000" });

    reloj.ahora += 61_000;

    const reenvio = await service.resendCode({ email: registro.email });

    expect(reenvio.success).toBe(true);
    expect(mailer.buzon).toHaveLength(2);
    expect([...codes.codes.values()][0].attempts).toBe(0);

    const viejo = await service.verifyEmail({ email: registro.email, code: "111111" });
    expect(viejo.success).toBe(false);

    const nuevo = await service.verifyEmail({ email: registro.email, code: "222222" });
    expect(nuevo.success).toBe(true);

  });


  it("debe aplicar el cooldown de 60 s y responder igual con correo inexistente", async () => {

    const { service, reloj, mailer } = crear();

    await service.register(registro);

    const pronto = await service.resendCode({ email: registro.email });

    expect(pronto.success).toBe(false);
    if(!pronto.success){
      expect(pronto.error).toBe("RATE_LIMITED");
      expect(pronto.retryAfterSeconds).toBeGreaterThan(0);
    }

    const inexistente = await service.resendCode({ email: "nadie@test.com" });
    const inexistente2 = await service.resendCode({ email: "nadie@test.com" });

    expect(inexistente).toEqual({ success: true, data: { resendAfterSeconds: 60 } });
    expect(inexistente2.success).toBe(false);

    reloj.ahora += 61_000;

    const ok = await service.resendCode({ email: registro.email });
    expect(ok.success).toBe(true);
    expect(mailer.buzon).toHaveLength(2);

  });


  it("debe limitar a 5 envios por hora por correo y reiniciar al vencer la ventana", async () => {

    const { service, reloj, mailer } = crear();

    await service.register(registro);

    for(let i = 0; i < 4; i++){
      reloj.ahora += 61_000;
      const r = await service.resendCode({ email: registro.email });
      expect(r.success).toBe(true);
    }

    expect(mailer.buzon).toHaveLength(5);

    reloj.ahora += 61_000;
    const sexto = await service.resendCode({ email: registro.email });

    expect(sexto.success).toBe(false);
    if(!sexto.success){
      expect(sexto.error).toBe("RATE_LIMITED");
    }

    reloj.ahora += 3_600_000;
    const tras = await service.resendCode({ email: registro.email });
    expect(tras.success).toBe(true);

  });


  it("debe limitar a 5 registros por hora por IP", async () => {

    const { service } = crear();

    const resultados: string[] = [];

    for(let i = 0; i < 6; i++){
      const r = await service.register(
        { ...registro, email: `u${i}@test.com` },
        { ip: "10.0.0.1" }
      );
      resultados.push(r.success ? "ok" : r.error);
    }

    expect(resultados).toEqual(["ok", "ok", "ok", "ok", "ok", "RATE_LIMITED"]);

  });


  it("debe limitar a 80 envios por dia en total", async () => {

    const { service } = crear();

    let limitado = 0;

    for(let i = 0; i < 82; i++){
      const r = await service.register(
        { ...registro, email: `g${i}@test.com` },
        { ip: `10.0.${Math.floor(i / 4)}.${i % 4}` }
      );
      if(!r.success && r.error === "RATE_LIMITED"){
        limitado++;
      }
    }

    expect(limitado).toBe(2);

  });


  it("debe tratar el registro repetido de una cuenta sin verificar como reintento", async () => {

    const { service, users, reloj, mailer } = crear();

    await service.register(registro);

    reloj.ahora += 61_000;

    const r = await service.register({ ...registro, nombre: "Ana Nueva", password: "OtraClave123" });

    expect(r.success).toBe(true);
    expect(users.users).toHaveLength(1);
    expect(users.users[0].nombre).toBe("Ana Nueva");
    expect(mailer.buzon).toHaveLength(2);

  });


  it("debe conservar el 409 si el correo ya esta verificado", async () => {

    const { service } = crear();

    await service.register(registro);
    await service.verifyEmail({ email: registro.email, code: "123456" });

    const r = await service.register(registro);

    expect(r.success).toBe(false);
    if(!r.success){
      expect(r.error).toBe("EMAIL_ALREADY_REGISTERED");
    }

  });


  it("debe cambiar el correo de una cuenta sin verificar y enviar un codigo nuevo", async () => {

    const { service, users, mailer } = crear();

    await service.register(registro);

    const r = await service.changeEmail({
      email: registro.email,
      password: registro.password,
      nuevoEmail: "ana2@test.com"
    });

    expect(r.success).toBe(true);
    expect(users.users[0].email).toBe("ana2@test.com");
    expect(mailer.ultimo()?.to).toBe("ana2@test.com");

  });


  it("debe rechazar el cambio de correo con contrasena incorrecta o cuenta verificada", async () => {

    const { service } = crear();

    await service.register(registro);

    const mal = await service.changeEmail({
      email: registro.email,
      password: "Incorrecta123",
      nuevoEmail: "ana2@test.com"
    });

    expect(mal.success).toBe(false);
    if(!mal.success){
      expect(mal.error).toBe("INVALID_CREDENTIALS");
    }

    await service.verifyEmail({ email: registro.email, code: "123456" });

    const verificada = await service.changeEmail({
      email: registro.email,
      password: registro.password,
      nuevoEmail: "ana2@test.com"
    });

    expect(verificada.success).toBe(false);
    if(!verificada.success){
      expect(verificada.error).toBe("INVALID_CREDENTIALS");
    }

  });


  it("debe rechazar el cambio de correo si el nuevo ya lo usa una cuenta verificada", async () => {

    const { service } = crear();

    await service.register({ ...registro, email: "otra@test.com" });
    await service.verifyEmail({ email: "otra@test.com", code: "123456" });
    await service.register(registro, { ip: "10.9.9.9" });

    const r = await service.changeEmail({
      email: registro.email,
      password: registro.password,
      nuevoEmail: "otra@test.com"
    });

    expect(r.success).toBe(false);
    if(!r.success){
      expect(r.error).toBe("EMAIL_ALREADY_REGISTERED");
    }

  });


  it("debe devolver EMAIL_DELIVERY_FAILED y dejar la cuenta sin verificar si falla el proveedor", async () => {

    const { service, users, mailer } = crear();

    mailer.fallar = true;

    const r = await service.register(registro);

    expect(r.success).toBe(false);
    if(!r.success){
      expect(r.error).toBe("EMAIL_DELIVERY_FAILED");
    }

    expect(users.users[0].email_verified_at).toBeNull();

  });


  it("debe devolver CONFIGURATION_ERROR si el proveedor no esta configurado", async () => {

    const users = new FakeAuthRepository();

    const { EnvioCorreoNoConfigurado } = await import("../src/auth/correo/envio-correo-http");

    const service = new AuthService(users, jwtSecret, {
      enabled: true,
      codes: new FakeVerificationRepository(users),
      limits: new FakeRateLimitRepository(),
      mailer: new EnvioCorreoNoConfigurado()
    });

    const r = await service.register(registro);

    expect(r.success).toBe(false);
    if(!r.success){
      expect(r.error).toBe("CONFIGURATION_ERROR");
    }

  });


  it("debe devolver codigoPrueba y no enviar correo con el modo test-code", async () => {

    const { service, mailer } = crear();

    const r = await service.register(registro, { bypass: "test-code" });

    expect(r.success).toBe(true);
    if(r.success && "verificationRequired" in r.data){
      expect(r.data.codigoPrueba).toBe("123456");
    }

    expect(mailer.buzon).toHaveLength(0);

  });


  it("debe crear la cuenta verificada con token con el modo verified", async () => {

    const { service, users, mailer } = crear();

    const r = await service.register(registro, { bypass: "verified" });

    expect(r.success).toBe(true);
    if(r.success){
      expect("accessToken" in r.data).toBe(true);
    }

    expect(users.users[0].email_verified_at).not.toBeNull();
    expect(mailer.buzon).toHaveLength(0);

  });


  it("debe responder igual en verify y resend para un correo inexistente", async () => {

    const { service } = crear();

    const verify = await service.verifyEmail({ email: "nadie@test.com", code: "123456" });

    expect(verify.success).toBe(false);
    if(!verify.success){
      expect(verify.error).toBe("INVALID_VERIFICATION_CODE");
    }

    const resend = await service.resendCode({ email: "nadie@test.com" });

    expect(resend).toEqual({ success: true, data: { resendAfterSeconds: 60 } });

  });


});
