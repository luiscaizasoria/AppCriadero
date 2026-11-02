import { describe, it, expect, beforeAll } from "vitest";
import { AuthService } from "../../src/auth/auth.service";
import { D1AuthRepository } from "../../src/auth/auth.repository";
import { CriaderoService } from "../../src/criaderos/criaderos.service";
import { D1CriaderoRepository } from "../../src/criaderos/criaderos.repository";
import { D1JaulaRepository } from "../../src/jaulas/jaulas.repository";
import { JaulaService } from "../../src/jaulas/jaulas.service";
import { D1CuidadosRepository } from "../../src/cuidados/cuidados.repository";
import { CuidadosService } from "../../src/cuidados/cuidados.service";
import { LocalD1Adapter } from "../helpers/local-d1.adapter";


// Base SQLite en memoria con las migraciones aplicadas (ver LocalD1Adapter).
const db = new LocalD1Adapter();

const jwtSecret = "integration-secret-key";


async function crearCriadero(email:string){

  const auth = new AuthService(new D1AuthRepository(db as any), jwtSecret);

  const usuario = await auth.register({ email, nombre:"Usuario Cuidados", password:"Password123!" });

  if(!usuario.success){
    throw new Error("No se pudo registrar el usuario de prueba");
  }

  const criaderos = new CriaderoService(new D1CriaderoRepository(db as any));

  const criadero = await criaderos.createCriadero(usuario.data.user.id,{
    nombre:"Criadero Cuidados",
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


async function filas<T = any>(sql:string, ...params:unknown[]):Promise<T[]>{

  const resultado = await db.prepare(sql).bind(...params).all();

  return resultado.results as T[];

}


describe("Cuidados de jaula D1 local (SQLite en memoria)",()=>{


  let criaderoA: string;

  let criaderoB: string;

  let jaulaA: string;

  let jaulaB: string;

  const repositorio = new D1CuidadosRepository(db as any);

  const cuidados = new CuidadosService(repositorio);

  const jaulas = new JaulaService(new D1JaulaRepository(db as any));


  async function crearJaula(criadero:string, codigo:string){

    const resultado = await jaulas.crear(criadero,{ codigo });

    if(!resultado.success){
      throw new Error("No se pudo crear la jaula");
    }

    return resultado.data.jaula.id as string;

  }


  beforeAll(async()=>{

    criaderoA = await crearCriadero("cuidados-a@test.com");
    criaderoB = await crearCriadero("cuidados-b@test.com");

    jaulaA = await crearJaula(criaderoA,"J001");
    jaulaB = await crearJaula(criaderoB,"J001");

  });


  it("debe tener aplicada la migración 0007", async()=>{

    const tablas = await filas<{name:string}>(
      "SELECT name FROM sqlite_master WHERE type='table' AND name IN ('alimentacion_jaula','bebida_jaula','sanidad_jaula')"
    );

    expect(tablas).toHaveLength(3);

  });


  it("debe escribir alimentación y su historial con las FK reales", async()=>{

    const r = await cuidados.crearAlimentacion(criaderoA,jaulaA,{ tipo:"Maíz", cantidad:"50 g", fecha:"2026-10-30" });

    if(!r.success) throw new Error(r.message);

    const registro = await filas("SELECT * FROM alimentacion_jaula WHERE id = ?", r.data.registro.id);
    const historial = await filas("SELECT * FROM jaula_historial WHERE jaula_id = ? AND tipo_evento = 'ALIMENTACION'", jaulaA);

    expect(registro[0]).toMatchObject({ criadero_id:criaderoA, jaula_id:jaulaA, tipo:"Maíz", cantidad:"50 g", detalle:null });
    expect(historial).toHaveLength(1);
    expect(historial[0]).toMatchObject({ criadero_id:criaderoA, ave_id:null, fecha:"2026-10-30", detalle:"Alimentación: Maíz" });

  });


  it("debe escribir bebida y su historial", async()=>{

    const r = await cuidados.crearBebida(criaderoA,jaulaA,{ tipo:"Agua", fecha:"2026-10-30", detalle:"fresca" });

    expect(r.success).toBe(true);

    const historial = await filas("SELECT detalle FROM jaula_historial WHERE jaula_id = ? AND tipo_evento = 'BEBIDA'", jaulaA);

    expect(historial[0].detalle).toBe("Bebida: Agua");

  });


  it("debe registrar sanidad, actualizar el estado de la jaula y escribir el historial", async()=>{

    const r = await cuidados.crearSanidad(criaderoA,jaulaA,{ tipo:"Fumigación", fecha:"2026-10-31", detalle:"cal" });

    expect(r.success && r.data.jaula.estadoSanitario).toBe("FUMIGACION");

    const jaula = await filas("SELECT estado_sanitario FROM jaulas WHERE id = ?", jaulaA);
    const historial = await filas("SELECT detalle FROM jaula_historial WHERE jaula_id = ? AND tipo_evento = 'SANIDAD'", jaulaA);

    expect(jaula[0].estado_sanitario).toBe("FUMIGACION");
    expect(historial[0].detalle).toBe("Sanidad: Fumigación | cal");

    await cuidados.crearSanidad(criaderoA,jaulaA,{ tipo:"otro texto", fecha:"2026-11-01" });

    const despues = await filas("SELECT estado_sanitario FROM jaulas WHERE id = ?", jaulaA);

    expect(despues[0].estado_sanitario).toBe("NORMAL");

  });


  it("debe listar la alimentación por fecha e id descendentes", async()=>{

    await cuidados.crearAlimentacion(criaderoA,jaulaA,{ tipo:"Antiguo", fecha:"2026-01-01" });

    const r = await cuidados.listarAlimentacion(criaderoA,jaulaA);

    expect(r.success && r.data.registros.map(x => x.tipo)).toEqual(["Maíz","Antiguo"]);
    expect(r.success && r.data.registros[0].fechaCreacion).toBeTruthy();

  });


  it("debe aceptar cadenas vacías y guardar NULL en cantidad y detalle falsy", async()=>{

    const r = await cuidados.crearBebida(criaderoA,jaulaA,{ tipo:"", fecha:"", cantidad:0, detalle:"" });

    if(!r.success) throw new Error(r.message);

    const fila = await filas("SELECT * FROM bebida_jaula WHERE id = ?", r.data.registro.id);

    expect(fila[0]).toMatchObject({ tipo:"", fecha:"", cantidad:null, detalle:null });

  });


  it("debe incluir fechaCreacion en el historial de la jaula, en orden fecha e id descendentes", async()=>{

    const repo = new D1JaulaRepository(db as any);

    const historial = await repo.listarHistorialCompleto(criaderoA,jaulaA);

    expect(historial.length).toBeGreaterThan(3);
    expect(historial.every(h => typeof h.fechaCreacion === "string" && h.fechaCreacion.length > 0)).toBe(true);

    const fechas = historial.map(h => h.fecha);

    expect([...fechas].sort().reverse()).toEqual(fechas);
    expect(historial[0].fecha).toBe("2026-11-01");

  });


  it("debe revertir alimentación si falla el historial (segundo statement)", async()=>{

    const existente = (await filas("SELECT id FROM jaula_historial WHERE jaula_id = ?", jaulaA))[0].id;
    const antes = (await filas("SELECT COUNT(*) AS n FROM alimentacion_jaula"))[0].n;

    await expect(repositorio.crearAlimentacion(criaderoA,{
      id:"alimento-atomico", historialId:existente, jaulaId:jaulaA, fecha:"f", tipo:"T",
      cantidad:null, detalle:null, detalleHistorial:"x"
    })).rejects.toThrow();

    const despues = (await filas("SELECT COUNT(*) AS n FROM alimentacion_jaula"))[0].n;

    expect(despues).toBe(antes);

  });


  it("debe revertir sanidad completa si falla el historial (tercer statement)", async()=>{

    const existente = (await filas("SELECT id FROM jaula_historial WHERE jaula_id = ?", jaulaA))[0].id;
    const antes = (await filas("SELECT COUNT(*) AS n FROM sanidad_jaula"))[0].n;
    const estado = (await filas("SELECT estado_sanitario FROM jaulas WHERE id = ?", jaulaA))[0].estado_sanitario;

    await expect(repositorio.crearSanidad(criaderoA,{
      id:"sanidad-atomica", historialId:existente, jaulaId:jaulaA, fecha:"f", tipo:"Cuarentena",
      detalle:null, estadoSanitario:"CUARENTENA", detalleHistorial:"x"
    })).rejects.toThrow();

    const despues = (await filas("SELECT COUNT(*) AS n FROM sanidad_jaula"))[0].n;
    const estadoDespues = (await filas("SELECT estado_sanitario FROM jaulas WHERE id = ?", jaulaA))[0].estado_sanitario;

    expect(despues).toBe(antes);
    expect(estadoDespues).toBe(estado);

  });


  it("debe rechazar una jaula de otro criadero sin escribir nada", async()=>{

    const tablas = ["alimentacion_jaula","bebida_jaula","sanidad_jaula"];
    const contar = async() => (await filas(
      "SELECT (SELECT COUNT(*) FROM alimentacion_jaula) + (SELECT COUNT(*) FROM bebida_jaula) + (SELECT COUNT(*) FROM sanidad_jaula) + (SELECT COUNT(*) FROM jaula_historial) AS n"
    ))[0].n;
    const antes = await contar();

    const a = await cuidados.crearAlimentacion(criaderoA,jaulaB,{ tipo:"T", fecha:"f" });
    const b = await cuidados.crearBebida(criaderoA,jaulaB,{ tipo:"T", fecha:"f" });
    const c = await cuidados.crearSanidad(criaderoA,jaulaB,{ tipo:"Quemadura", fecha:"f" });

    expect(tablas).toHaveLength(3);
    for(const r of [a,b,c]){
      expect(r).toMatchObject({ success:false, error:"JAULA_NO_ENCONTRADA" });
    }
    expect(await contar()).toBe(antes);
    expect((await filas("SELECT estado_sanitario FROM jaulas WHERE id = ?", jaulaB))[0].estado_sanitario).toBe("NORMAL");

  });


  it("debe aceptar cuidados en una jaula inactiva", async()=>{

    const inactiva = await crearJaula(criaderoA,"J002");

    await db.prepare("UPDATE jaulas SET activa = 0 WHERE id = ?").bind(inactiva).run();

    const r = await cuidados.crearAlimentacion(criaderoA,inactiva,{ tipo:"T", fecha:"f" });

    expect(r.success).toBe(true);

  });

});
