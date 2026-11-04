import { describe, it, expect, beforeAll } from "vitest";
import { AuthService } from "../../src/auth/auth.service";
import { D1AuthRepository } from "../../src/auth/auth.repository";
import { CriaderoService } from "../../src/criaderos/criaderos.service";
import { D1CriaderoRepository } from "../../src/criaderos/criaderos.repository";
import { D1AveRepository } from "../../src/aves/aves.repository";
import { AveService } from "../../src/aves/aves.service";
import { LocalD1Adapter } from "../helpers/local-d1.adapter";


// Base SQLite en memoria con las migraciones aplicadas (ver LocalD1Adapter).
const db = new LocalD1Adapter();

const jwtSecret = "integration-secret-key";


async function crearCriadero(email:string){

  const auth = new AuthService(new D1AuthRepository(db as any), jwtSecret);

  const usuario = await auth.register({ email, nombre:"Usuario Evolucion", password:"Password123!" });

  if(!usuario.success){
    throw new Error("No se pudo registrar el usuario de prueba");
  }

  const criaderos = new CriaderoService(new D1CriaderoRepository(db as any));

  const criadero = await criaderos.createCriadero(usuario.data.user.id,{
    nombre:"Criadero Evolucion",
    pais:"Ecuador",
    provincia:"Pichincha",
    ciudad:"Quito",
    telefono:"0999999999",
    correoContacto:email
  });

  if(!criadero.success){
    throw new Error("No se pudo crear el criadero de prueba");
  }

  return criadero.data.id;

}


describe("Evolución de ave D1 local (SQLite en memoria)",()=>{

  let criaderoA: string;

  let criaderoB: string;

  let aveA: string;

  let aveB: string;

  const aves = new AveService(new D1AveRepository(db as any));


  async function crearAve(criadero:string, codigo:string){

    const resultado = await aves.crear(criadero,{
      codigo,
      origen:"NACIDA_CRIADERO",
      fechaNacimiento:"2026-01-01",
      raza:"Kiri",
      sexo:"MACHO"
    });

    if(!resultado.success){
      throw new Error(`No se pudo crear ${codigo}: ${resultado.error}`);
    }

    return resultado.data.ave.id as string;

  }


  async function insertar(id:string, criadero:string, ave:string, fecha:string, peso:number|null, foto:string|null){

    await db.prepare(`
      INSERT INTO ave_evolucion
        (id, criadero_id, ave_id, fecha, foto_r2_key, peso_gramos, altura_cm, largo_cm, caracteristicas, observacion, fecha_creacion)
      VALUES (?, ?, ?, ?, ?, ?, 30, 40, 'Plumaje', 'Obs', '2026-02-01 10:00:00')
    `).bind(id, criadero, ave, fecha, foto, peso).run();

  }


  beforeAll(async()=>{

    criaderoA = await crearCriadero("evo-a@test.com");

    criaderoB = await crearCriadero("evo-b@test.com");

    aveA = await crearAve(criaderoA,"E-001");

    aveB = await crearAve(criaderoB,"E-002");

    await insertar("evo-1", criaderoA, aveA, "2026-01-10T00:00:00.000Z", 1000, null);
    await insertar("evo-2", criaderoA, aveA, "2026-03-10T00:00:00.000Z", 1200, "file:///foto.jpg");
    await insertar("evo-3", criaderoA, aveA, "2026-03-10T00:00:00.000Z", 1300, null);
    await insertar("evo-b", criaderoB, aveB, "2026-04-10T00:00:00.000Z", 900, null);

  });


  it("debe listar la evolución por fecha e id descendentes con todos los campos", async()=>{

    const r = await aves.listarEvolucion(criaderoA, aveA);

    expect(r.success).toBe(true);

    if(!r.success){
      return;
    }

    const lista = r.data.evolucion;

    // Los dos registros de la fecha inicial de la creación del ave (registro automático) pueden existir;
    // se comprueba solo el subconjunto sembrado y su orden relativo.
    const sembrados = lista.filter(e => e.id.startsWith("evo-"));

    expect(sembrados.map(e => e.id)).toEqual(["evo-3","evo-2","evo-1"]);

    expect(sembrados[1]).toEqual({
      id:"evo-2",
      aveId:aveA,
      fecha:"2026-03-10T00:00:00.000Z",
      fotoUri:"file:///foto.jpg",
      pesoGramos:1200,
      alturaCm:30,
      largoCm:40,
      caracteristicas:"Plumaje",
      observacion:"Obs",
      fechaCreacion:"2026-02-01 10:00:00"
    });

  });


  it("debe aislar la evolución entre criaderos", async()=>{

    const cruzada = await aves.listarEvolucion(criaderoB, aveA);
    const propia = await aves.listarEvolucion(criaderoB, aveB);

    expect(cruzada).toEqual({ success:true, data:{ evolucion:[] } });

    if(propia.success){
      expect(propia.data.evolucion.map(e => e.id)).toContain("evo-b");
      expect(propia.data.evolucion.every(e => e.aveId === aveB)).toBe(true);
    }

  });


  it("debe devolver lista vacía para un ave inexistente", async()=>{

    expect(await aves.listarEvolucion(criaderoA,"no-existe"))
      .toEqual({ success:true, data:{ evolucion:[] } });

  });

});
