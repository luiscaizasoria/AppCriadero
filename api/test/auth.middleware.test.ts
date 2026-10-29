import { describe, it, expect } from "vitest";
import { Hono } from "hono";
import { SignJWT } from "jose";
import { jwtMiddleware } from "../src/auth/auth.middleware";


const jwtSecret = "secret-test-key";


function createApp() {

  const app = new Hono<{
    Bindings:{
      JWT_SECRET:string;
    };
    Variables:{
      user:{
        id:string;
        email:string;
      };
    };
  }>();


  app.use("*", jwtMiddleware);


  app.get("/protected", (c)=>{

    const user = c.get("user");

    return c.json({
      success:true,
      user
    });

  });


  return app;
}



describe("JWT Middleware",()=>{


  it("debe rechazar request sin token", async()=>{

    const app = createApp();


    const response = await app.request(
      "/protected",
      {
        method:"GET"
      },
      {
        JWT_SECRET: jwtSecret
      }
    );


    expect(response.status)
      .toBe(401);


    const body = await response.json();

    expect(body.error)
      .toBe("UNAUTHORIZED");

  });



  it("debe rechazar token con formato incorrecto", async()=>{

    const app = createApp();


    const response = await app.request(
      "/protected",
      {
        method:"GET",
        headers:{
          Authorization:"Basic abc123"
        }
      },
      {
        JWT_SECRET:jwtSecret
      }
    );


    expect(response.status)
      .toBe(401);


    const body = await response.json();

    expect(body.error)
      .toBe("INVALID_TOKEN");

  });



  it("debe rechazar JWT inválido", async()=>{

    const app = createApp();


    const response = await app.request(
      "/protected",
      {
        method:"GET",
        headers:{
          Authorization:"Bearer token-invalido"
        }
      },
      {
        JWT_SECRET:jwtSecret
      }
    );


    expect(response.status)
      .toBe(401);

  });



  it("debe aceptar JWT válido y colocar usuario en contexto", async()=>{

    const token = await new SignJWT({
      email:"usuario@test.com"
    })
    .setProtectedHeader({
      alg:"HS256"
    })
    .setSubject("user-123")
    .setIssuedAt()
    .setExpirationTime("1h")
    .sign(
      new TextEncoder().encode(jwtSecret)
    );


    const app = createApp();


    const response = await app.request(
      "/protected",
      {
        method:"GET",
        headers:{
          Authorization:`Bearer ${token}`
        }
      },
      {
        JWT_SECRET:jwtSecret
      }
    );


    expect(response.status)
      .toBe(200);


    const body = await response.json();


    expect(body.success)
      .toBe(true);


    expect(body.user.id)
      .toBe("user-123");


    expect(body.user.email)
      .toBe("usuario@test.com");

  });


});
