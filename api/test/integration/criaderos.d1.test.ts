import { describe, it, expect, beforeEach } from "vitest";
import { AuthService } from "../../src/auth/auth.service";
import { D1AuthRepository } from "../../src/auth/auth.repository";
import { CriaderoService } from "../../src/criaderos/criaderos.service";
import { D1CriaderoRepository } from "../../src/criaderos/criaderos.repository";
import { LocalD1Adapter } from "../helpers/local-d1.adapter";


const db = new LocalD1Adapter();

const jwtSecret = "integration-secret-key";


const request = {

  nombre:"Criadero Integration",

  descripcion:"Prueba D1",

  pais:"Ecuador",

  provincia:"Pichincha",

  ciudad:"Quito",

  direccion:"Quito",

  telefono:"0999999999",

  correoContacto:"integration@criadero.com"

};



describe("Criadero D1 Local Integration",()=>{


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



  it("debe crear criadero completo en D1 local", async()=>{


    const authRepository = new D1AuthRepository(
      db as any
    );


    const authService = new AuthService(
      authRepository,
      jwtSecret
    );


    const userResult = await authService.register({

      email:"criadero.integration@test.com",

      nombre:"Usuario Integration",

      password:"Password123!"

    });



    expect(userResult.success)
      .toBe(true);



    if(!userResult.success){
      return;
    }



    const userId = userResult.data.user.id;



    const repository = new D1CriaderoRepository(
      db as any
    );


    const service = new CriaderoService(
      repository
    );



    const result = await service.createCriadero(
      userId,
      request
    );



    expect(result.success)
      .toBe(true);



    if(!result.success){
      return;
    }



    const criadero = await db
      .prepare(
        "SELECT * FROM criaderos WHERE id = ?"
      )
      .bind(
        result.data.id
      )
      .first();



    expect(criadero)
      .not
      .toBeNull();



    const items = await db
      .prepare(
        "SELECT COUNT(*) as total FROM catalogo_items WHERE criadero_id = ?"
      )
      .bind(
        result.data.id
      )
      .first();



    expect(items.total)
      .toBe(38);



    const configuracion = await db
      .prepare(
        "SELECT * FROM criadero_configuracion WHERE criadero_id = ?"
      )
      .bind(
        result.data.id
      )
      .first();



    expect(configuracion)
      .not
      .toBeNull();


  });


});
