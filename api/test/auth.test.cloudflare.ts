import { describe, it, expect } from "vitest";
import { env } from "cloudflare:test";
import app from "../src/index";
import { uniqueEmail } from "./helpers/test-data";

describe("Auth API", () => {

  it("debe registrar un usuario y devolver JWT", async () => {
    const email = uniqueEmail("register");

    const response = await app.request(
      "/api/v1/auth/register",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email,
          nombre: "Usuario Test",
          password: "Password123!",
        }),
      },
      env
    );

    expect(response.status).toBe(201);

    const body = await response.json();

    expect(body.success).toBe(true);
    expect(body.data.user.email).toBe(email);
    expect(body.data.accessToken).toBeDefined();
    expect(body.data.expiresIn).toBe(3600);
  });


  it("debe permitir login con credenciales correctas", async () => {
    const email = uniqueEmail("login");

    const registerResponse = await app.request(
      "/api/v1/auth/register",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email,
          nombre: "Usuario Login",
          password: "Password123!",
        }),
      },
      env
    );

    expect(registerResponse.status).toBe(201);


    const loginResponse = await app.request(
      "/api/v1/auth/login",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email,
          password: "Password123!",
        }),
      },
      env
    );

    expect(loginResponse.status).toBe(200);

    const body = await loginResponse.json();

    expect(body.success).toBe(true);
    expect(body.data.accessToken).toBeDefined();
  });


  it("debe rechazar password incorrecto", async () => {
    const email = uniqueEmail("invalid-password");

    await app.request(
      "/api/v1/auth/register",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email,
          nombre: "Usuario Password",
          password: "Password123!",
        }),
      },
      env
    );


    const response = await app.request(
      "/api/v1/auth/login",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email,
          password: "Incorrecto123!",
        }),
      },
      env
    );

    expect(response.status).toBe(401);

    const body = await response.json();

    expect(body.error).toBe("INVALID_CREDENTIALS");
  });


  it("debe rechazar registro duplicado", async () => {
    const email = uniqueEmail("duplicate");

    const payload = {
      email,
      nombre: "Usuario Duplicate",
      password: "Password123!",
    };


    const first = await app.request(
      "/api/v1/auth/register",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      },
      env
    );

    expect(first.status).toBe(201);


    const second = await app.request(
      "/api/v1/auth/register",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      },
      env
    );

    expect(second.status).toBe(409);

    const body = await second.json();

    expect(body.error).toBe("EMAIL_ALREADY_REGISTERED");
  });

});
