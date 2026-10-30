import { describe, it, expect, beforeAll } from "vitest";
import { AuthService } from "../../src/auth/auth.service";
import { D1AuthRepository } from "../../src/auth/auth.repository";
import { CriaderoService } from "../../src/criaderos/criaderos.service";
import { D1CriaderoRepository } from "../../src/criaderos/criaderos.repository";
import { D1JaulaRepository } from "../../src/jaulas/jaulas.repository";
import { JaulaService } from "../../src/jaulas/jaulas.service";
import { LocalD1Adapter } from "../helpers/local-d1.adapter";


// Base SQLite en memoria con las migraciones aplicadas (ver LocalD1Adapter).
const db = new LocalD1Adapter();

const jwtSecret = "integration-secret-key";


async function crearCriadero(email:string){

  const auth = new AuthService(
    new D1AuthRepository(db as any),
    jwtSecret
  );

  const usuario = await auth.register({
    email,
    nombre:"Usuario Jaulas",
    password:"Password123!"
  });

  if(!usuario.success){
    throw new Error("No se pudo registrar el usuario de prueba");
  }

  const criaderos = new CriaderoService(
    new D1CriaderoRepository(db as any)
  );

  const criadero = await criaderos.createCriadero(
    usuario.data.user.id,
    {
      nombre:"Criadero Jaulas",
      pais:"Ecuador",
      provincia:"Pichincha",
      ciudad:"Quito",
      telefono:"0999999999",
      correoContacto:email
    }
  );

  if(!criadero.success){
    throw new Error("No se pudo crear el criadero de prueba");
  }

  return criadero.data.id;

}


describe("Jaulas D1 local (SQLite en memoria)",()=>{


  let criaderoA: string;

  let criaderoB: string;

  let instante = "2026-10-30T12:00:00.000Z";

  const service = new JaulaService(
    new D1JaulaRepository(db as any),
    () => new Date(instante)
  );


  beforeAll(async()=>{

    criaderoA = await crearCriadero("jaulas.a@test.com");

    criaderoB = await crearCriadero("jaulas.b@test.com");

  });


  it("debe crear jaulas con id UUID, estado NORMAL y activa 1 (PAR-JAU-001)", async()=>{

    const resultado = await service.crear(
      criaderoA,
      { codigo:"J001", tipo:"General" }
    );

    expect(resultado.success).toBe(true);

    if(!resultado.success){
      return;
    }

    const jaula = resultado.data.jaula;

    expect(jaula.id).toMatch(/^[0-9a-f-]{36}$/);
    expect(jaula.estadoSanitario).toBe("NORMAL");
    expect(jaula.activa).toBe(1);
    expect(jaula.nombre).toBeNull();
    expect(jaula.fechaActualizacion).toBeNull();
    expect(jaula.fechaCreacion).toMatch(/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/);

  });


  it("debe rechazar un código duplicado con el índice único de D1 (PAR-JAU-004)", async()=>{

    const resultado = await service.crear(criaderoA,{ codigo:"J001" });

    expect(resultado.success).toBe(false);

    if(!resultado.success){
      expect(resultado.message).toBe("UNIQUE constraint failed: jaulas.codigo");
    }

  });


  it("debe distinguir mayúsculas y permitir el mismo código en otro criadero (PAR-JAU-006)", async()=>{

    const minuscula = await service.crear(criaderoA,{ codigo:"j001" });
    const otroCriadero = await service.crear(criaderoB,{ codigo:"J001" });

    expect(minuscula.success).toBe(true);
    expect(otroCriadero.success).toBe(true);

  });


  it("debe listar solo las jaulas del criadero ordenadas por código (PAR-JAU-007)", async()=>{

    await service.crear(criaderoA,{ codigo:"J000" });

    const resultado = await service.listar(criaderoA,"ACTIVA");

    expect(resultado.success).toBe(true);

    if(!resultado.success){
      return;
    }

    expect(resultado.data.jaulas.map(j=>j.codigo))
      .toEqual(["J000","J001","j001"]);

    expect(resultado.data.jaulas.every(j=>j.cantidadAves===0)).toBe(true);

  });


  it("debe editar una jaula y mantener su código ocupado entre inactivas (PAR-JAU-005, 015)", async()=>{

    const lista = await service.listar(criaderoA,"ACTIVA");

    if(!lista.success){
      throw new Error("No se pudo listar");
    }

    const j000 = lista.data.jaulas.find(j=>j.codigo==="J000")!;

    const editada = await service.actualizar(
      criaderoA,
      j000.id,
      { codigo:"J000", nombre:"Sector Norte", ubicacion:" Patio ", tipo:"" }
    );

    expect(editada.success).toBe(true);

    if(editada.success){
      expect(editada.data.jaula.nombre).toBe("Sector Norte");
      expect(editada.data.jaula.ubicacion).toBe("Patio");
      expect(editada.data.jaula.tipo).toBeNull();
    }

    const desactivada = await service.desactivar(criaderoA, j000.id);

    expect(desactivada).toEqual({
      success:true,
      data:{ cantidadAvesLiberadas:0 }
    });

    const repetido = await service.crear(criaderoA,{ codigo:"J000" });

    expect(repetido.success).toBe(false);

  });


  it("debe listar las inactivas con su fecha de desactivación ISO (PAR-JAU-011, 019)", async()=>{

    const resultado = await service.listar(criaderoA,"INACTIVA");

    expect(resultado.success).toBe(true);

    if(!resultado.success){
      return;
    }

    const inactivas = resultado.data.jaulas as any[];

    expect(inactivas.map(j=>j.codigo)).toEqual(["J000"]);
    expect(inactivas[0].activa).toBe(0);
    expect(inactivas[0].fechaDesactivacion).toBe("2026-10-30T12:00:00.000Z");

  });


  it("debe devolver 0 si la jaula ya estaba inactiva y JAULA_NO_ENCONTRADA si no existe (PAR-JAU-023, 024)", async()=>{

    const inactivas = await service.listar(criaderoA,"INACTIVA");

    if(!inactivas.success){
      throw new Error("No se pudo listar");
    }

    const id = inactivas.data.jaulas[0].id;

    instante = "2026-12-01T00:00:00.000Z";

    const otraVez = await service.desactivar(criaderoA, id);
    const inexistente = await service.desactivar(criaderoA,"no-existe");

    expect(otraVez).toEqual({
      success:true,
      data:{ cantidadAvesLiberadas:0 }
    });

    expect(inexistente.success).toBe(false);

    const detalle = await service.obtener(criaderoA, id);

    if(detalle.success){
      expect(detalle.data.jaula.fechaDesactivacion).toBe("2026-10-30T12:00:00.000Z");
    }

  });


  it("debe aislar las jaulas por criadero", async()=>{

    const deB = await service.listar(criaderoB,"ACTIVA");

    if(!deB.success){
      throw new Error("No se pudo listar");
    }

    const idDeB = deB.data.jaulas[0].id;

    const desdeA = await service.obtener(criaderoA, idDeB);

    expect(desdeA.success).toBe(false);

    if(!desdeA.success){
      expect(desdeA.error).toBe("JAULA_NO_ENCONTRADA");
    }

  });

});
