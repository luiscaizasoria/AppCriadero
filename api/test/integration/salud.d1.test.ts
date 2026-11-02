import { describe, it, expect, beforeAll } from "vitest";
import { AuthService } from "../../src/auth/auth.service";
import { D1AuthRepository } from "../../src/auth/auth.repository";
import { CriaderoService } from "../../src/criaderos/criaderos.service";
import { D1CriaderoRepository } from "../../src/criaderos/criaderos.repository";
import { D1AveRepository } from "../../src/aves/aves.repository";
import { AveService } from "../../src/aves/aves.service";
import { D1SaludRepository } from "../../src/salud/salud.repository";
import { SaludService } from "../../src/salud/salud.service";
import { LocalD1Adapter } from "../helpers/local-d1.adapter";


// Base SQLite en memoria con las migraciones aplicadas (ver LocalD1Adapter).
const db = new LocalD1Adapter();

const jwtSecret = "integration-secret-key";


async function crearCriadero(email:string){

  const auth = new AuthService(new D1AuthRepository(db as any), jwtSecret);

  const usuario = await auth.register({ email, nombre:"Usuario Salud", password:"Password123!" });

  if(!usuario.success){
    throw new Error("No se pudo registrar el usuario de prueba");
  }

  const criaderos = new CriaderoService(new D1CriaderoRepository(db as any));

  const criadero = await criaderos.createCriadero(usuario.data.user.id,{
    nombre:"Criadero Salud",
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


describe("Salud D1 local (SQLite en memoria)",()=>{


  let criaderoA: string;

  let criaderoB: string;

  let aveA: string;

  const aves = new AveService(new D1AveRepository(db as any));

  const salud = new SaludService(new D1SaludRepository(db as any));


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


  beforeAll(async()=>{

    criaderoA = await crearCriadero("salud-a@test.com");

    criaderoB = await crearCriadero("salud-b@test.com");

    aveA = await crearAve(criaderoA,"S-001");

  });


  it("debe registrar diagnóstico sin medicamento (SAL-01)", async()=>{

    const r = await salud.registrarDiagnostico(criaderoA, aveA, {
      enfermedad:"Coriza", sintomas:"", observacion:"", medicamento:null, dosis:"5",
      fecha:"2026-11-01T10:00:00.000Z"
    });

    expect(r.success).toBe(true);

    const d = await filas("SELECT * FROM diagnosticos_ave WHERE ave_id = ?", aveA);
    expect(d).toHaveLength(1);
    expect(d[0]).toMatchObject({ estado:"ACTIVO", sintomas:null, observacion:null, criadero_id:criaderoA });
    expect(await filas("SELECT * FROM tratamientos_ave WHERE ave_id = ?", aveA)).toHaveLength(0);

    const ave = (await filas("SELECT * FROM aves WHERE id = ?", aveA))[0];
    expect(ave.estado_salud).toBe("EN_TRATAMIENTO");
    expect(ave.fecha_ultimo_control_salud).toBe("2026-11-01T10:00:00.000Z");

    const h = await filas("SELECT * FROM ave_historial WHERE ave_id = ? AND tipo_evento = 'SALUD'", aveA);
    expect(h).toHaveLength(1);
    expect(h[0]).toMatchObject({ detalle:"Diagnóstico registrado: Coriza", jaula_id:null });

  });


  it("debe registrar tratamiento con la misma fecha y observación (SAL-02, SAL-03)", async()=>{

    const antes = (await filas("SELECT fecha_actualizacion FROM aves WHERE id = ?", aveA))[0].fecha_actualizacion;

    const r = await salud.registrarDiagnostico(criaderoA, aveA, {
      enfermedad:"Bronquitis", observacion:"obs", medicamento:"Amoxicilina", dosis:"",
      fecha:"2026-11-02T10:00:00.000Z"
    });

    expect(r.success).toBe(true);

    const t = await filas("SELECT * FROM tratamientos_ave WHERE ave_id = ?", aveA);
    expect(t).toHaveLength(1);
    expect(t[0]).toMatchObject({
      medicamento:"Amoxicilina", dosis:null, observacion:"obs",
      fecha:"2026-11-02T10:00:00.000Z", criadero_id:criaderoA
    });
    expect(t[0].diagnostico_id).toBe(r.success ? r.data.id : "");

    const despues = (await filas("SELECT fecha_actualizacion FROM aves WHERE id = ?", aveA))[0].fecha_actualizacion;
    expect(despues).toBe(antes);

  });


  it("debe listar el historial por fecha descendente con ambos estados (SAL-09, SAL-10)", async()=>{

    await db.prepare("UPDATE diagnosticos_ave SET estado = 'CERRADO' WHERE enfermedad = 'Coriza'").bind().run();

    const r = await salud.listarHistorial(criaderoA, aveA);

    expect(r.success).toBe(true);
    if(!r.success) return;

    expect(r.data.historial.map(h=>h.enfermedad)).toEqual(["Bronquitis","Coriza"]);
    expect(r.data.historial[0]).toMatchObject({ medicamento:"Amoxicilina", dosis:null, observacion:"obs" });
    expect(r.data.historial[1]).toMatchObject({ medicamento:null, dosis:null });
    expect(Object.keys(r.data.historial[0]).sort()).toEqual(
      ["dosis","enfermedad","fecha","id","medicamento","observacion","sintomas"]
    );

  });


  it("debe devolver 404 al registrar en un ave de otro criadero o inexistente y no escribir (SAL-07)", async()=>{

    const total = (await filas("SELECT * FROM diagnosticos_ave")).length;

    const ajena = await salud.registrarDiagnostico(criaderoB, aveA, { enfermedad:"E", fecha:"f" });
    const falsa = await salud.registrarDiagnostico(criaderoA, "no-existe", { enfermedad:"E", fecha:"f" });

    expect(ajena).toMatchObject({ success:false, error:"AVE_NO_ENCONTRADA" });
    expect(falsa).toMatchObject({ success:false, error:"AVE_NO_ENCONTRADA" });
    expect((await filas("SELECT * FROM diagnosticos_ave")).length).toBe(total);

  });


  it("debe aislar el historial por criadero y devolver vacío si el ave no existe (SAL-11)", async()=>{

    const otro = await salud.listarHistorial(criaderoB, aveA);
    const falsa = await salud.listarHistorial(criaderoA, "no-existe");

    expect(otro).toEqual({ success:true, data:{ historial:[] } });
    expect(falsa).toEqual({ success:true, data:{ historial:[] } });

  });


  it("debe escribir también en un ave no ACTIVA (SAL-06)", async()=>{

    const fallecida = await crearAve(criaderoA,"S-002");

    await db.prepare("UPDATE aves SET estado = 'FALLECIDA' WHERE id = ?").bind(fallecida).run();

    const r = await salud.registrarDiagnostico(criaderoA, fallecida, { enfermedad:"E", fecha:"f" });

    expect(r.success).toBe(true);

  });


  it("debe revertir todo si falla una escritura del batch (SAL-08)", async()=>{

    const repo = new D1SaludRepository(db as any);
    const antesD = (await filas("SELECT * FROM diagnosticos_ave")).length;
    const antesH = (await filas("SELECT * FROM ave_historial")).length;

    // historialId repetido: el INSERT de ave_historial viola la PK al final del batch.
    const existente = (await filas("SELECT id FROM ave_historial LIMIT 1"))[0].id;

    await expect(repo.registrarDiagnostico(criaderoA, {
      diagnosticoId:"diag-x", tratamientoId:"trat-x", historialId:existente, aveId:aveA,
      fecha:"f", enfermedad:"E", sintomas:null, observacion:null, medicamento:"M", dosis:null
    })).rejects.toThrow();

    expect((await filas("SELECT * FROM diagnosticos_ave")).length).toBe(antesD);
    expect((await filas("SELECT * FROM tratamientos_ave WHERE id = 'trat-x'")).length).toBe(0);
    expect((await filas("SELECT * FROM ave_historial")).length).toBe(antesH);

  });

});
