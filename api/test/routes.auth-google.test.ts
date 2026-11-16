import { describe, it, expect } from "vitest";
import { createApp } from "../src/app";
import { createAuthRouter } from "../src/auth/auth.routes";


const env = {
  DB: {} as never,
  JWT_SECRET: "secret-test-key"
};


function post(app: ReturnType<typeof createApp>, body: unknown, bindings: object = env){

  return app.request(
    "/api/v1/auth/google",
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: typeof body === "string" ? body : JSON.stringify(body)
    },
    bindings
  );

}


describe("HTTP POST /auth/google", () => {


  const app = createApp({
    authRouter: createAuthRouter({
      googleJwks: async () => {
        throw new TypeError("fetch failed");
      }
    })
  });


  it("debe responder 400 VALIDATION_ERROR si falta idToken", async () => {

    const res = await post(app, {});

    expect(res.status).toBe(400);
    expect(await res.json()).toMatchObject({
      success: false,
      error: "VALIDATION_ERROR"
    });

  });


  it("debe responder 400 VALIDATION_ERROR si el cuerpo no es JSON", async () => {

    const res = await post(app, "no-json");

    expect(res.status).toBe(400);

  });


  it("debe responder 503 GOOGLE_NOT_CONFIGURED sin GOOGLE_CLIENT_IDS", async () => {

    const res = await post(app, { idToken: "a.b.c" });

    expect(res.status).toBe(503);
    expect(await res.json()).toMatchObject({ error: "GOOGLE_NOT_CONFIGURED" });

  });


  it("debe responder 503 GOOGLE_UNAVAILABLE si el JWKS no responde", async () => {

    const res = await post(
      app,
      { idToken: "eyJhbGciOiJSUzI1NiIsImtpZCI6Imsx" + "In0.e30.c2ln" },
      { ...env, GOOGLE_CLIENT_IDS: "web-1" }
    );

    expect(res.status).toBe(503);
    expect(await res.json()).toMatchObject({ error: "GOOGLE_UNAVAILABLE" });

  });


  it("debe responder 401 INVALID_GOOGLE_TOKEN con un token mal formado", async () => {

    const res = await post(
      app,
      { idToken: "basura" },
      { ...env, GOOGLE_CLIENT_IDS: "web-1" }
    );

    expect(res.status).toBe(401);
    expect(await res.json()).toMatchObject({ error: "INVALID_GOOGLE_TOKEN" });

  });


  it("debe responder 500 CONFIGURATION_ERROR sin JWT_SECRET", async () => {

    const res = await post(app, { idToken: "a.b.c" }, { DB: {} });

    expect(res.status).toBe(500);

  });


});
