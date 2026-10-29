import { describe, it, expect, beforeEach } from "vitest";
import { AuthService } from "../../src/auth/auth.service";
import { D1AuthRepository } from "../../src/auth/auth.repository";
import { LocalD1Adapter } from "../helpers/local-d1.adapter";


const db = new LocalD1Adapter();

const jwtSecret = "integration-secret-key";


describe("Auth D1 Local Integration",()=>{


  beforeEach(async()=>{

    await db.exec(`
      PRAGMA foreign_keys = OFF;

      DELETE FROM criadero_configuracion;
      DELETE FROM catalogo_items;
      DELETE FROM criaderos;
      DELETE FROM users;

      PRAGMA foreign_keys = ON;
    `);

  });



  it("debe registrar usuario en D1 local real", async()=>{


    const repository = new D1AuthRepository(
      db as any
    );


    const service = new AuthService(
      repository,
      jwtSecret
    );


    const result = await service.register({

      email:"integration@test.com",

      nombre:"Integration",

      password:"Password123!"

    });


    expect(result.success)
      .toBe(true);



    const user = await db
      .prepare(
        "SELECT * FROM users WHERE email = ?"
      )
      .bind(
        "integration@test.com"
      )
      .first();


    expect(user)
      .not
      .toBeNull();


  });



  it("debe permitir login con usuario existente", async()=>{


    const repository = new D1AuthRepository(
      db as any
    );


    const service = new AuthService(
      repository,
      jwtSecret
    );


    await service.register({

      email:"login@test.com",

      nombre:"Login",

      password:"Password123!"

    });



    const result = await service.login({

      email:"login@test.com",

      password:"Password123!"

    });



    expect(result.success)
      .toBe(true);


  });



});

