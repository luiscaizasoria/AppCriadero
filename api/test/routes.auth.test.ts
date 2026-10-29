import { describe, it, expect } from "vitest";
import { Hono } from "hono";
import { createApp } from "../src/app";


function createFakeAuthRouter(){

  const router = new Hono();


  router.post("/register", async (c)=>{

    return c.json(
      {
        success:true,
        data:{
          id:"user-1",
          email:"test@test.com"
        }
      },
      201
    );

  });


  router.post("/login", async (c)=>{

    return c.json(
      {
        success:true,
        data:{
          accessToken:"jwt-token-test"
        }
      },
      200
    );

  });


  return router;

}



describe("HTTP Auth Routes",()=>{


  it("POST /api/v1/auth/register debe responder 201", async()=>{


    const app = createApp({
      authRouter:createFakeAuthRouter()
    });


    const response = await app.request(
      "/api/v1/auth/register",
      {
        method:"POST",
        body:JSON.stringify({
          email:"test@test.com",
          password:"Password123!",
          nombre:"Test"
        }),
        headers:{
          "Content-Type":"application/json"
        }
      }
    );


    expect(response.status)
      .toBe(201);


    const body = await response.json();


    expect(body.success)
      .toBe(true);

  });



  it("POST /api/v1/auth/login debe devolver token", async()=>{


    const app = createApp({
      authRouter:createFakeAuthRouter()
    });


    const response = await app.request(
      "/api/v1/auth/login",
      {
        method:"POST",
        body:JSON.stringify({
          email:"test@test.com",
          password:"Password123!"
        }),
        headers:{
          "Content-Type":"application/json"
        }
      }
    );


    expect(response.status)
      .toBe(200);


    const body = await response.json();


    expect(body.data.accessToken)
      .toBeDefined();

  });


});
