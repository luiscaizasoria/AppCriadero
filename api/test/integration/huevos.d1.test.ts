import { describe, it, expect, beforeAll } from "vitest";
import { AuthService } from "../../src/auth/auth.service";
import { D1AuthRepository } from "../../src/auth/auth.repository";
import { CriaderoService } from "../../src/criaderos/criaderos.service";
import { D1CriaderoRepository } from "../../src/criaderos/criaderos.repository";
import { D1AveRepository } from "../../src/aves/aves.repository";
import { AveService } from "../../src/aves/aves.service";
import { D1JaulaRepository } from "../../src/jaulas/jaulas.repository";
import { JaulaService } from "../../src/jaulas/jaulas.service";
import { D1HuevosRepository } from "../../src/huevos/huevos.repository";
import { HuevosService } from "../../src/huevos/huevos.service";
import { LocalD1Adapter } from "../helpers/local-d1.adapter";


// Base SQLite en memoria con las migraciones aplicadas (ver LocalD1Adapter).
const db = new LocalD1Adapter();

const jwtSecret = "integration-secret-key";

// Reloj fijo: martes 2026-11-03 10:00 UTC. Ninguna prueba depende del reloj real.
const AHORA = new Date("2026-11-03T10:00:00.000Z");


async function crearCriadero(email:string){

  const auth = new AuthService(new D1AuthRepository(db as any), jwtSecret);

  const usuario = await auth.register({ email, nombre:"Usuario Huevos", password:"Password123!" });

  if(!usuario.success){
    throw new Error("No se pudo registrar el usuario de prueba");
  }

  const criaderos = new CriaderoService(new D1CriaderoRepository(db as any));

  const criadero = await criaderos.createCriadero(usuario.data.user.id,{
    nombre:"Criadero Huevos",
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


describe("Huevos D1 local (SQLite en memoria)",()=>{


  let criaderoA: string;

  let criaderoB: string;

  let ave1: string;

  let ave2: string;

  let jaula1: string;

  const aves = new AveService(new D1AveRepository(db as any));

  const jaulas = new JaulaService(new D1JaulaRepository(db as any));

  const huevos = new HuevosService(new D1HuevosRepository(db as any), undefined, ()=>AHORA);


  async function crearAve(criadero:string, codigo:string, raza:string){

    const resultado = await aves.crear(criadero,{
      codigo,
      origen:"NACIDA_CRIADERO",
      fechaNacimiento:"2026-01-01",
      raza,
      sexo:"HEMBRA"
    });

    if(!resultado.success){
      throw new Error(`No se pudo crear ${codigo}: ${resultado.error}`);
    }

    return resultado.data.ave.id as string;

  }


  async function registrar(criadero:string, ave:string, body:Record<string,unknown>){

    const r = await huevos.registrar(criadero, ave, body);

    if(!r.success){
      throw new Error(`No se pudo registrar: ${r.error}`);
    }

    return r.data;

  }


  beforeAll(async()=>{

    criaderoA = await crearCriadero("huevos-a@test.com");

    criaderoB = await crearCriadero("huevos-b@test.com");

    ave1 = await crearAve(criaderoA,"H-001","Kiri");

    ave2 = await crearAve(criaderoA,"H-002","Giro");

    const jaula = await jaulas.crear(criaderoA,{ codigo:"J-1" });

    if(!jaula.success){
      throw new Error("No se pudo crear la jaula");
    }

    jaula1 = jaula.data.jaula.id as string;

  });


  it("debe soportar printf('%06d') y no recortar a partir de un millón (HUE-04)",async()=>{

    const f = await filas("SELECT 'H' || printf('%06d', 0 + 1) AS a, 'H' || printf('%06d', 999999 + 1) AS b");

    expect(f[0]).toEqual({ a:"H000001", b:"H1000000" });

  });


  it("debe generar H000001 con huevo e historial coherentes (HUE-01)",async()=>{

    const r = await registrar(criaderoA, ave1, {
      jaulaId:jaula1, fecha:"2026-11-03T07:00:00.000Z", observacion:"normal"
    });

    expect(r.codigo).toBe("H000001");

    const h = await filas("SELECT * FROM huevos WHERE id = ?", r.id);
    expect(h[0]).toMatchObject({
      criadero_id:criaderoA, codigo:"H000001", ave_id:ave1, jaula_id:jaula1,
      fecha:"2026-11-03T07:00:00.000Z", estado:"REGISTRADO", observacion:"normal"
    });

    const e = await filas("SELECT * FROM ave_historial WHERE ave_id = ? AND tipo_evento = 'POSTURA_HUEVO'", ave1);
    expect(e).toHaveLength(1);
    expect(e[0]).toMatchObject({
      criadero_id:criaderoA, jaula_id:jaula1, fecha:"2026-11-03T07:00:00.000Z",
      detalle:"Registró huevo H000001"
    });

  });


  it("debe numerar H000002, H000003… por criadero y no mezclar criaderos (HUE-02, HUE-03, HUE-11)",async()=>{

    const dos = await registrar(criaderoA, ave1, { fecha:"2026-11-03T07:30:00.000Z", jaulaId:jaula1 });
    const tres = await registrar(criaderoA, ave2, { fecha:"2026-10-28T14:00:00.000Z", observacion:"" });

    expect([dos.codigo, tres.codigo]).toEqual(["H000002","H000003"]);

    const aveB = await crearAve(criaderoB,"B-001","Kiri");
    const b = await registrar(criaderoB, aveB, { fecha:"2026-11-03T08:00:00.000Z" });

    expect(b.codigo).toBe("H000001");
    expect((await huevos.siguienteCodigo(criaderoA))).toEqual({ success:true, data:{ codigo:"H000004" } });
    expect((await huevos.siguienteCodigo(criaderoB))).toEqual({ success:true, data:{ codigo:"H000002" } });

    const ev = await filas("SELECT detalle FROM ave_historial WHERE tipo_evento = 'POSTURA_HUEVO' AND criadero_id = ? ORDER BY detalle", criaderoA);
    expect(ev.map(x=>x.detalle)).toEqual(["Registró huevo H000001","Registró huevo H000002","Registró huevo H000003"]);

  });


  it("debe guardar NULL con observación o jaula vacías, también en el historial (HUE-05)",async()=>{

    const r = await registrar(criaderoA, ave2, { jaulaId:"", observacion:"", fecha:"2026-10-27T14:00:00.000Z" });

    expect(r.codigo).toBe("H000004");

    const h = (await filas("SELECT * FROM huevos WHERE id = ?", r.id))[0];
    expect(h).toMatchObject({ jaula_id:null, observacion:null });

    const e = (await filas("SELECT * FROM ave_historial WHERE detalle = 'Registró huevo H000004' AND criadero_id = ?", criaderoA))[0];
    expect(e.jaula_id).toBeNull();

  });


  it("debe usar la fecha del reloj cuando falta (HUE-06)",async()=>{

    const r = await registrar(criaderoB, (await filas("SELECT id FROM aves WHERE criadero_id = ?", criaderoB))[0].id, {});

    const h = (await filas("SELECT fecha FROM huevos WHERE id = ?", r.id))[0];
    expect(h.fecha).toBe(AHORA.toISOString());

  });


  it("debe escribir en un ave no ACTIVA (HUE-07)",async()=>{

    const fallecida = await crearAve(criaderoB,"B-002","Kiri");
    await db.prepare("UPDATE aves SET estado = 'FALLECIDA' WHERE id = ?").bind(fallecida).run();

    const r = await huevos.registrar(criaderoB, fallecida, { fecha:"2026-11-03T09:00:00.000Z" });

    expect(r.success).toBe(true);

  });


  it("debe responder 404 por ave o jaula inexistentes o de otro criadero y no escribir (HUE-08, HUE-09)",async()=>{

    const total = (await filas("SELECT * FROM huevos")).length;
    const eventos = (await filas("SELECT * FROM ave_historial")).length;

    const aveAjena = await huevos.registrar(criaderoB, ave1, {});
    const aveFalsa = await huevos.registrar(criaderoA, "no-existe", {});
    const jaulaAjena = await huevos.registrar(criaderoB, (await filas("SELECT id FROM aves WHERE criadero_id = ? LIMIT 1", criaderoB))[0].id, { jaulaId:jaula1 });

    expect(aveAjena).toMatchObject({ success:false, error:"AVE_NO_ENCONTRADA" });
    expect(aveFalsa).toMatchObject({ success:false, error:"AVE_NO_ENCONTRADA" });
    expect(jaulaAjena).toMatchObject({ success:false, error:"JAULA_NO_ENCONTRADA", message:"FOREIGN KEY constraint failed" });
    expect((await filas("SELECT * FROM huevos")).length).toBe(total);
    expect((await filas("SELECT * FROM ave_historial")).length).toBe(eventos);

  });


  it("debe revertir el huevo si falla el evento del batch (HUE-10)",async()=>{

    const repo = new D1HuevosRepository(db as any);
    const antes = (await filas("SELECT * FROM huevos")).length;
    const existente = (await filas("SELECT id FROM ave_historial LIMIT 1"))[0].id;

    await expect(repo.registrarHuevo(criaderoA, {
      huevoId:"huevo-x", historialId:existente, aveId:ave1, jaulaId:null,
      fecha:"2026-11-03T00:00:00.000Z", observacion:null
    })).rejects.toThrow();

    expect((await filas("SELECT * FROM huevos")).length).toBe(antes);
    expect((await filas("SELECT * FROM huevos WHERE id = 'huevo-x'")).length).toBe(0);

  });


  it("debe listar por fecha descendente, desempatar por inserción inversa y aislar criaderos (HUE-12, HUE-13)",async()=>{

    const a = await registrar(criaderoA, ave1, { fecha:"2026-11-20T01:00:00.000Z", jaulaId:jaula1 });
    const lista = await huevos.listarPorAve(criaderoA, ave1);

    expect(lista.success).toBe(true);
    if(!lista.success) return;

    expect(lista.data.huevos.map(h=>h.codigo)).toEqual(["H000005","H000002","H000001"]);
    expect(lista.data.huevos[0]).toEqual({
      id:a.id, codigo:"H000005", fecha:"2026-11-20T01:00:00.000Z", estado:"REGISTRADO",
      observacion:null, jaulaCodigo:"J-1"
    });

    // Empate de fecha: el insertado después va primero.
    const x = await registrar(criaderoA, ave2, { fecha:"2026-09-01T00:00:00.000Z" });
    const y = await registrar(criaderoA, ave2, { fecha:"2026-09-01T00:00:00.000Z" });
    const l2 = await huevos.listarPorAve(criaderoA, ave2);
    expect(l2.success && l2.data.huevos.slice(-2).map(h=>h.id)).toEqual([y.id, x.id]);

    expect(await huevos.listarPorAve(criaderoB, ave1)).toEqual({ success:true, data:{ huevos:[] } });
    expect(await huevos.listarPorAve(criaderoA, "no-existe")).toEqual({ success:true, data:{ huevos:[] } });

  });


  it("debe calcular hoy, semana y mes en UTC como V1 (HUE-15, HUE-16, HUE-17)",async()=>{

    // Datos de A: 11-03 07:00 y 07:30 (hoy), 10-28 (hace 6 días), 10-27 (hace 7), 10-27 14:00 (ave2),
    // 11-20 01:00 (futuro, mismo mes), 09-01 x2 (ave2).
    const r = await huevos.resumen(criaderoA);

    expect(r).toEqual({ success:true, data:{ hoy:2, semana:4, mes:3 } });

  });


  it("debe calcular el total con hoy y mes (HUE-23)",async()=>{

    expect(await huevos.total(criaderoA)).toEqual({ success:true, data:{ total:7, hoy:2, mes:3 } });

  });


  it("debe devolver ceros y null en un criadero sin huevos (HUE-14, HUE-23, HUE-24)",async()=>{

    const vacio = await crearCriadero("huevos-c@test.com");

    expect(await huevos.resumen(vacio)).toEqual({ success:true, data:{ hoy:0, semana:0, mes:0 } });
    expect(await huevos.total(vacio)).toEqual({ success:true, data:{ total:0, hoy:null, mes:null } });
    expect(await huevos.ranking(vacio)).toEqual({ success:true, data:{ ranking:[] } });
    expect(await huevos.porDia(vacio)).toEqual({ success:true, data:{ dias:[] } });
    expect(await huevos.porDiaHistorico(vacio)).toEqual({ success:true, data:{ dias:[] } });
    expect(await huevos.porHora(vacio)).toEqual({ success:true, data:{ horas:[] } });
    expect(await huevos.porJaula(vacio)).toEqual({ success:true, data:{ jaulas:[] } });
    expect(await huevos.porAve(vacio)).toEqual({ success:true, data:{ aves:[] } });

  });


  it("debe devolver ranking y producción por ave, con ave vendida incluida (HUE-18, HUE-19)",async()=>{

    // ave1: 3 huevos (H1, H2, H5); ave2: 4 (10-28, 10-27, 09-01 x2).
    const ranking = await huevos.ranking(criaderoA);
    const porAve = await huevos.porAve(criaderoA);

    expect(ranking.success && ranking.data.ranking.map(x=>x.cantidad)).toEqual([4,3]);
    expect(ranking.success && ranking.data.ranking[0]).toEqual({ id:ave2, codigo:"H-002", raza:"Giro", cantidad:4 });
    expect(porAve.success && porAve.data.aves[1]).toEqual({ id:ave1, codigo:"H-001", cantidad:3 });

    // 12 aves con huevos: el ranking se corta en 10 y por-ave en 20.
    for(let i=0;i<11;i++){
      const ave = await crearAve(criaderoA,`R-${i}`,"Kiri");
      await db.prepare("UPDATE aves SET estado = 'VENDIDA' WHERE id = ?").bind(ave).run();
      await registrar(criaderoA, ave, { fecha:"2026-08-01T00:00:00.000Z" });
    }

    const corto = await huevos.ranking(criaderoA);
    expect(corto.success && corto.data.ranking).toHaveLength(10);

  });


  it("debe agrupar por día de la semana, de Domingo a Sábado, solo en la ventana de 7 días (HUE-20)",async()=>{

    const r = await huevos.porDia(criaderoA);

    // 11-03 martes (2), 10-28 miércoles (1), 11-20 viernes (1). Los de hace 7 días o más no cuentan.
    expect(r).toEqual({ success:true, data:{ dias:[
      { dia:"Martes", cantidad:2 },
      { dia:"Miércoles", cantidad:1 },
      { dia:"Viernes", cantidad:1 }
    ] } });

  });


  it("debe agrupar el histórico por día con las tildes de V1, por cantidad descendente",async()=>{

    const r = await huevos.porDiaHistorico(criaderoA);

    expect(r.success).toBe(true);
    if(!r.success) return;

    const total = r.data.dias.reduce((s,d)=>s+d.cantidad,0);
    const cantidades = r.data.dias.map(d=>d.cantidad);

    // 7 huevos previos + 11 de las aves vendidas (2026-08-01, sábado).
    expect(total).toBe(18);
    expect(cantidades).toEqual([...cantidades].sort((a,b)=>b-a));
    expect(r.data.dias[0]).toEqual({ dia:"Sábado", cantidad:11 });
    expect(r.data.dias.map(d=>d.dia)).toContain("Miércoles");

  });


  it("debe agrupar por hora UTC como texto de dos dígitos (HUE-21)",async()=>{

    const r = await huevos.porHora(criaderoB);

    expect(r.success).toBe(true);
    if(!r.success) return;

    const porHora = Object.fromEntries(r.data.horas.map(h=>[h.hora,h.cantidad]));

    // B: 08:00, 10:00 (reloj), 09:00 UTC.
    expect(porHora).toEqual({ "08":1, "10":1, "09":1 });

  });


  it("debe agrupar por jaula solo los huevos con jaula (HUE-22)",async()=>{

    const r = await huevos.porJaula(criaderoA);

    expect(r).toEqual({ success:true, data:{ jaulas:[{ id:jaula1, codigo:"J-1", cantidad:3 }] } });

  });


  it("debe aislar la producción de otro criadero",async()=>{

    const r = await huevos.resumen(criaderoB);

    expect(r).toEqual({ success:true, data:{ hoy:3, semana:3, mes:3 } });
    expect(await huevos.porJaula(criaderoB)).toEqual({ success:true, data:{ jaulas:[] } });

  });

});
