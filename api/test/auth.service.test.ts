import { describe, it, expect } from "vitest";
import { AuthService } from "../src/auth/auth.service";
import { FakeAuthRepository } from "./helpers/fake-auth.repository";


describe("AuthService", () => {


  const jwtSecret = "secret-test-key";


  it("debe registrar un usuario correctamente", async () => {


    const repository = new FakeAuthRepository();


    const service = new AuthService(
      repository,
      jwtSecret
    );


    const result = await service.register({

      email: " Test@Email.com ",

      nombre: " Usuario Test ",

      password: "Password123!"

    });


    expect(result.success)
      .toBe(true);


    if(result.success){

      expect(result.data.user.email)
        .toBe("test@email.com");


      expect(result.data.accessToken)
        .toBeDefined();

    }

  });



  it("debe rechazar email duplicado", async () => {


    const repository = new FakeAuthRepository();


    const service = new AuthService(
      repository,
      jwtSecret
    );


    await service.register({

      email:"test@test.com",

      nombre:"Usuario",

      password:"Password123!"

    });



    const result = await service.register({

      email:"TEST@TEST.COM",

      nombre:"Otro",

      password:"Password123!"

    });



    expect(result.success)
      .toBe(false);


    if(!result.success){

      expect(result.error)
        .toBe("EMAIL_ALREADY_REGISTERED");

    }

  });



  it("debe permitir login con password correcto", async()=>{


    const repository = new FakeAuthRepository();


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



  it("debe rechazar password incorrecto", async()=>{


    const repository = new FakeAuthRepository();


    const service = new AuthService(
      repository,
      jwtSecret
    );



    await service.register({

      email:"password@test.com",

      nombre:"Password",

      password:"Password123!"

    });



    const result = await service.login({

      email:"password@test.com",

      password:"Incorrecta123!"

    });



    expect(result.success)
      .toBe(false);


    if(!result.success){

      expect(result.error)
        .toBe("INVALID_CREDENTIALS");

    }

  });


});
