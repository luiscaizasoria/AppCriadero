import { describe, it, expect } from "vitest";
import { Hono } from "hono";
import { createApp } from "../src/app";
import { jwtMiddleware } from "../src/auth/auth.middleware";
import { SignJWT } from "jose";


const jwtSecret = "secret-test-key";


function createFakeCriaderosRouter(){

  const router = new Hono<{
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


  router.use("*", jwtMiddleware);


  router.post("/", async(c)=>{

    const user = c.get("user");


    return c.json({
      success:true,
      data:{
        userId:user.id,
        nombre:"Criadero Test"
      }
    },201);

  });



  router.put("/:criaderoId/configuracion", async(c)=>{

    const user = c.get("user");


    if(user.id !== "owner-user"){

      return c.json({
        success:false,
        error:"FORBIDDEN"
      },403);

    }


    return c.json({
      success:true
    },200);

  });


  return router;

}



async function createToken(
  userId:string
){

  return await new SignJWT({
    email:"test@test.com"
  })
  .setProtectedHeader({
    alg:"HS256"
  })
  .setSubject(userId)
  .setIssuedAt()
  .setExpirationTime("1h")
  .sign(
    new TextEncoder().encode(jwtSecret)
  );

}



describe("HTTP Criaderos Routes",()=>{


  it("debe rechazar creación sin token", async()=>{


    const app = createApp({
      criaderosRouter:createFakeCriaderosRouter()
    });


    const response = await app.request(
      "/api/v1/criaderos",
      {
        method:"POST"
      },
      {
        JWT_SECRET:jwtSecret
      }
    );


    expect(response.status)
      .toBe(401);

  });



  it("debe crear criadero con JWT válido", async()=>{


    const token = await createToken(
      "user-123"
    );


    const app = createApp({
      criaderosRouter:createFakeCriaderosRouter()
    });


    const response = await app.request(
      "/api/v1/criaderos",
      {
        method:"POST",
        headers:{
          Authorization:`Bearer ${token}`
        }
      },
      {
        JWT_SECRET:jwtSecret
      }
    );


    expect(response.status)
      .toBe(201);


    const body = await response.json();


    expect(body.data.userId)
      .toBe("user-123");

  });



  it("debe bloquear modificación de criadero de otro usuario", async()=>{


    const token = await createToken(
      "other-user"
    );


    const app = createApp({
      criaderosRouter:createFakeCriaderosRouter()
    });


    const response = await app.request(
      "/api/v1/criaderos/criadero-1/configuracion",
      {
        method:"PUT",
        headers:{
          Authorization:`Bearer ${token}`
        }
      },
      {
        JWT_SECRET:jwtSecret
      }
    );


    expect(response.status)
      .toBe(403);

  });


});
