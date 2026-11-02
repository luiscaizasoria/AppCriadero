import { describe, it, expect, beforeAll } from "vitest";
import { AuthService } from "../../src/auth/auth.service";
import { D1AuthRepository } from "../../src/auth/auth.repository";
import { CriaderoService } from "../../src/criaderos/criaderos.service";
import { D1CriaderoRepository } from "../../src/criaderos/criaderos.repository";
import { D1JaulaRepository } from "../../src/jaulas/jaulas.repository";
import { JaulaService } from "../../src/jaulas/jaulas.service";
import { D1AveRepository } from "../../src/aves/aves.repository";
import { AveService } from "../../src/aves/aves.service";
import { LocalD1Adapter } from "../helpers/local-d1.adapter";


// Base SQLite en memoria con las migraciones aplicadas (ver LocalD1Adapter).
const db = new LocalD1Adapter();

const jwtSecret = "integration-secret-key";


async function crearCriadero(email:string){

  const auth = new AuthService(new D1AuthRepository(db as any), jwtSecret);

  const usuario = await auth.register({ email, nombre:"Usuario Aves", password:"Password123!" });

  if(!usuario.success){
    throw new Error("No se pudo registrar el usuario de prueba");
  }

  const criaderos = new CriaderoService(new D1CriaderoRepository(db as any));

  const criadero = await criaderos.createCriadero(usuario.data.user.id,{
    nombre:"Criadero Aves",
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


describe("Aves D1 local (SQLite en memoria)",()=>{


  let criaderoA: string;

  let criaderoB: string;

  let instante = "2026-10-30T12:00:00.000Z";

  const aves = new AveService(
    new D1AveRepository(db as any),
    () => new Date(instante)
  );

  const jaulas = new JaulaService(
    new D1JaulaRepository(db as any),
    () => new Date(instante)
  );


  async function crearJaula(criadero:string, codigo:string){

    const resultado = await jaulas.crear(criadero,{ codigo });

    if(!resultado.success){
      throw new Error("No se pudo crear la jaula");
    }

    return resultado.data.jaula;

  }


  async function crearAve(criadero:string, codigo:string, extra:Record<string,unknown> = {}){

    const resultado = await aves.crear(criadero,{
      codigo,
      origen:"NACIDA_CRIADERO",
      fechaNacimiento:"2026-01-01",
      raza:"Kiri",
      sexo:"MACHO",
      ...extra
    });

    if(!resultado.success){
      throw new Error(`No se pudo crear ${codigo}: ${resultado.error}`);
    }

    return resultado.data.ave;

  }


  beforeAll(async()=>{

    criaderoA = await crearCriadero("aves.a@test.com");

    criaderoB = await crearCriadero("aves.b@test.com");

  });


  it("debe crear el ave con evolución inicial, ALTA e INGRESO_AVE en una sola operación (PAR-AVE-001, 003, 004)", async()=>{

    const jaula = await crearJaula(criaderoA,"J001");

    const ave = await crearAve(criaderoA," k001 ",{ pesoGramos:800, jaulaId:jaula.id });

    expect(ave.id).toMatch(/^[0-9a-f-]{36}$/);
    expect(ave.codigo).toBe("K001");
    expect(ave.estado).toBe("ACTIVA");
    expect(ave.estadoSalud).toBe("SANA");
    expect(ave.jaulaCodigo).toBe("J001");

    const evolucion = await filas("SELECT * FROM ave_evolucion WHERE ave_id = ?", ave.id);

    expect(evolucion).toHaveLength(1);
    expect(evolucion[0].observacion).toBe("Registro inicial");
    expect(evolucion[0].peso_gramos).toBe(800);
    expect(evolucion[0].fecha).toBe("2026-10-30T12:00:00.000Z");

    const historial = await filas("SELECT * FROM ave_historial WHERE ave_id = ?", ave.id);

    expect(historial).toHaveLength(1);
    expect(historial[0]).toMatchObject({
      tipo_evento:"ALTA",
      jaula_id:jaula.id,
      detalle:"Ave registrada como nacida en el criadero."
    });

    const deJaula = await filas("SELECT * FROM jaula_historial WHERE ave_id = ?", ave.id);

    expect(deJaula).toHaveLength(1);
    expect(deJaula[0]).toMatchObject({
      tipo_evento:"INGRESO_AVE",
      jaula_id:jaula.id,
      detalle:"Ave K001 ingresó a la jaula."
    });

  });


  it("debe rechazar el código duplicado con el mensaje de SQLite y sin escribir nada (V1 depende del UNIQUE)", async()=>{

    const antes = await filas("SELECT COUNT(*) AS total FROM ave_historial");

    const resultado = await aves.crear(criaderoA,{ codigo:"k001", origen:"COMPRADA" });

    expect(resultado.success).toBe(false);

    if(!resultado.success){
      expect(resultado.error).toBe("UNIQUE_AVES_CODIGO");
      expect(resultado.message).toBe("UNIQUE constraint failed: aves.codigo");
    }

    const despues = await filas("SELECT COUNT(*) AS total FROM ave_historial");

    expect(despues[0].total).toBe(antes[0].total);

  });


  it("debe guardar escalares de otro tipo como V1 (afinidad de la columna) sin que D1 falle", async()=>{

    const resultado = await aves.crear(criaderoA,{
      codigo:"TIPOS-1", origen:7, sexo:3, pesoGramos:"10", alturaCm:true, fechaNacimiento:20261001
    });

    expect(resultado.success).toBe(true);

    const fila = await filas("SELECT origen, sexo, peso_gramos, altura_cm, fecha_nacimiento FROM aves WHERE codigo = ?","TIPOS-1");

    expect(fila[0]).toEqual({ origen:"7", sexo:"3", peso_gramos:10, altura_cm:1, fecha_nacimiento:"20261001" });

  });


  it("debe distinguir mayúsculas en el índice único y permitir el mismo código en otro criadero", async()=>{

    const otroCriadero = await crearAve(criaderoB,"K001");

    expect(otroCriadero.codigo).toBe("K001");

    const existeA = await aves.existeCodigo(criaderoA," k001 ",null);
    const existeB = await aves.existeCodigo(criaderoB,"zzz",null);

    expect(existeA.success && existeA.data.existe).toBe(true);
    expect(existeB.success && existeB.data.existe).toBe(false);

  });


  it("debe revertir todo el lote si una jaula no existe en la base (FK) y devolver el error de FK", async()=>{

    const resultado = await aves.crear(criaderoA,{
      codigo:"K-SIN-JAULA",
      origen:"COMPRADA",
      jaulaId:"no-existe"
    });

    expect(resultado.success).toBe(false);

    if(!resultado.success){
      expect(resultado.error).toBe("JAULA_NO_ENCONTRADA");
      expect(resultado.message).toBe("FOREIGN KEY constraint failed");
    }

    expect(await filas("SELECT id FROM aves WHERE codigo = 'K-SIN-JAULA'")).toHaveLength(0);

  });


  it("debe validar padre y madre con los errores de V1 (PAR-AVE-011, 015, 016, 017)", async()=>{

    const macho = await crearAve(criaderoA,"PAD1",{ sexo:"MACHO" });
    const hembra = await crearAve(criaderoA,"MAD1",{ sexo:"HEMBRA" });
    const base = { codigo:"HIJO0", origen:"NACIDA_CRIADERO" };

    const codigos = async(extra:Record<string,unknown>)=>{
      const r = await aves.crear(criaderoA,{ ...base, ...extra });
      return r.success ? "OK" : r.error;
    };

    expect(await codigos({ padreId:macho.id, madreId:macho.id })).toBe("PADRES_IGUALES");
    expect(await codigos({ padreId:"no-existe" })).toBe("PADRE_NO_ENCONTRADO");
    expect(await codigos({ padreId:hembra.id })).toBe("PADRE_NO_MACHO");
    expect(await codigos({ madreId:"no-existe" })).toBe("MADRE_NO_ENCONTRADA");
    expect(await codigos({ madreId:macho.id })).toBe("MADRE_NO_HEMBRA");

    const hijo = await crearAve(criaderoA,"HIJO1",{ padreId:macho.id, madreId:hembra.id });

    expect(hijo.padreCodigo).toBe("PAD1");
    expect(hijo.madreCodigo).toBe("MAD1");

  });


  it("debe tratar como inexistente al padre de otro criadero", async()=>{

    const ajeno = await crearAve(criaderoB,"PADB",{ sexo:"MACHO" });

    const resultado = await aves.crear(criaderoA,{ codigo:"HIJO2", origen:"NACIDA_CRIADERO", padreId:ajeno.id });

    expect(resultado.success).toBe(false);

    if(!resultado.success){
      expect(resultado.error).toBe("PADRE_NO_ENCONTRADO");
    }

  });


  it("debe detectar el parentesco circular con el recorrido recursivo y excluir descendientes de las candidatas (PAR-AVE-022, 032)", async()=>{

    const abuelo = await crearAve(criaderoA,"ABU1",{ sexo:"MACHO" });
    const hija = await crearAve(criaderoA,"HIJ1",{ sexo:"HEMBRA", padreId:abuelo.id });
    const nieto = await crearAve(criaderoA,"NIE1",{ sexo:"MACHO", madreId:hija.id });

    const datos = { codigo:"ABU1", origen:"NACIDA_CRIADERO", sexo:"MACHO" };

    const circularPadre = await aves.actualizar(criaderoA, abuelo.id,{ ...datos, padreId:nieto.id });
    const circularMadre = await aves.actualizar(criaderoA, abuelo.id,{ ...datos, madreId:hija.id });
    const propia = await aves.actualizar(criaderoA, abuelo.id,{ ...datos, padreId:abuelo.id });

    expect(!circularPadre.success && circularPadre.error).toBe("PARENTESCO_CIRCULAR_PADRE");
    expect(!circularMadre.success && circularMadre.error).toBe("PARENTESCO_CIRCULAR_MADRE");
    expect(!propia.success && propia.error).toBe("PADRE_ES_MISMA_AVE");

    const candidatas = await aves.listarCandidatasPadres(criaderoA, abuelo.id);

    expect(candidatas.success).toBe(true);

    if(candidatas.success){
      const codigosCandidatas = candidatas.data.aves.map(a=>a.codigo);

      expect(codigosCandidatas).not.toContain("ABU1");
      expect(codigosCandidatas).not.toContain("HIJ1");
      expect(codigosCandidatas).not.toContain("NIE1");
      expect(codigosCandidatas).toContain("K001");
    }

    const sinExcluir = await aves.listarCandidatasPadres(criaderoA, null);

    expect(sinExcluir.success && sinExcluir.data.aves.map(a=>a.codigo)).toContain("NIE1");

  });


  it("debe editar con DATOS_ACTUALIZADOS, sin evolución nueva, y vaciar padres al pasar a COMPRADA (PAR-AVE-018, 023)", async()=>{

    const padre = await crearAve(criaderoA,"EP1",{ sexo:"MACHO" });
    const ave = await crearAve(criaderoA,"ED1",{ padreId:padre.id, pesoGramos:800 });

    const resultado = await aves.actualizar(criaderoA, ave.id,{
      codigo:"ED1",
      origen:"COMPRADA",
      fechaNacimiento:"2026-01-01",
      raza:"Kiri",
      sexo:"MACHO",
      pesoGramos:850,
      padreId:padre.id
    });

    expect(resultado.success).toBe(true);

    if(resultado.success){
      expect(resultado.data.ave.padreId).toBeNull();
      expect(resultado.data.ave.fechaActualizacion).toBeTruthy();
    }

    const evento = await filas(
      "SELECT detalle FROM ave_historial WHERE ave_id = ? AND tipo_evento = 'DATOS_ACTUALIZADOS'",
      ave.id
    );

    expect(evento[0].detalle).toBe("Datos generales actualizados: origen, peso, padre.");
    expect(await filas("SELECT id FROM ave_evolucion WHERE ave_id = ?", ave.id)).toHaveLength(1);

    const duplicada = await aves.actualizar(criaderoA, ave.id,{ codigo:" ep1 ", origen:"COMPRADA" });

    expect(!duplicada.success && duplicada.error).toBe("CODIGO_AVE_DUPLICADO");

  });


  it("debe cambiar de jaula con los tres eventos y reflejarlo en cantidadAves (PAR-AVE-024, 025, 026)", async()=>{

    const j1 = await crearJaula(criaderoA,"CJ1");
    const j2 = await crearJaula(criaderoA,"CJ2");
    const ave = await crearAve(criaderoA,"CJA1");

    await aves.cambiarJaula(criaderoA, ave.id,{ nuevaJaulaId:j1.id, codigoAve:"CJA1" });
    await aves.cambiarJaula(criaderoA, ave.id,{ nuevaJaulaId:j2.id, jaulaAnteriorId:j1.id, codigoAve:"CJA1" });

    const eventosAve = await filas(
      "SELECT tipo_evento, jaula_id, detalle FROM ave_historial WHERE ave_id = ? AND tipo_evento = 'CAMBIO_JAULA' ORDER BY detalle",
      ave.id
    );

    expect(eventosAve.map(e=>e.detalle)).toEqual([
      "El ave fue asignada a una jaula.",
      "El ave fue movida de una jaula a otra."
    ]);

    const eventosJaula = await filas(
      "SELECT jaula_id, tipo_evento, detalle FROM jaula_historial WHERE ave_id = ? ORDER BY fecha_creacion, rowid",
      ave.id
    );

    expect(eventosJaula.map(e=>[e.tipo_evento,e.jaula_id])).toEqual([
      ["INGRESO_AVE",j1.id],
      ["SALIDA_AVE",j1.id],
      ["INGRESO_AVE",j2.id]
    ]);

    const activas = await jaulas.listar(criaderoA,"ACTIVA");

    expect(activas.success).toBe(true);

    if(activas.success){
      const porCodigo = Object.fromEntries(activas.data.jaulas.map(j=>[j.codigo,j.cantidadAves]));

      expect(porCodigo.CJ1).toBe(0);
      expect(porCodigo.CJ2).toBe(1);
    }

    await aves.cambiarJaula(criaderoA, ave.id,{ nuevaJaulaId:null, jaulaAnteriorId:j2.id });

    const retirada = await aves.obtener(criaderoA, ave.id);

    expect(retirada.success && retirada.data.ave.jaulaActualId).toBeNull();

    const sinAjena = await aves.cambiarJaula(criaderoA, ave.id,{ nuevaJaulaId:"no-existe" });

    expect(!sinAjena.success && sinAjena.error).toBe("JAULA_NO_ENCONTRADA");

  });


  it("debe listar para asignar y por jaula como V1", async()=>{

    const j = await crearJaula(criaderoA,"LJ1");
    const dentro = await crearAve(criaderoA,"LA1",{ jaulaId:j.id });
    await crearAve(criaderoA,"LA2");

    const porJaula = await aves.listarPorJaula(criaderoA, j.id);
    const paraAsignar = await aves.listarParaAsignarJaula(criaderoA, j.id);

    expect(porJaula.success && porJaula.data.aves.map(a=>a.codigo)).toEqual(["LA1"]);

    expect(paraAsignar.success).toBe(true);

    if(paraAsignar.success){
      const codigos = paraAsignar.data.aves.map(a=>a.codigo);

      expect(codigos).toContain("LA2");
      expect(codigos).not.toContain("LA1");
    }

    expect(dentro.jaulaActualId).toBe(j.id);

  });


  it("debe registrar la evolución con registro inicial previo y detalle de cambios (PAR-AVE-035)", async()=>{

    const ave = await crearAve(criaderoA,"EV1",{ pesoGramos:800 });

    await db.prepare("DELETE FROM ave_evolucion WHERE ave_id = ?").bind(ave.id).run();

    instante = "2099-01-01T08:00:00.000Z";

    const resultado = await aves.registrarEvolucion(criaderoA, ave.id,{
      pesoGramos:"850,5",
      observacion:"Va bien"
    });

    expect(resultado.success).toBe(true);

    const evoluciones = await filas("SELECT * FROM ave_evolucion WHERE ave_id = ? ORDER BY fecha", ave.id);

    expect(evoluciones).toHaveLength(2);
    expect(evoluciones[0].observacion).toBe("Registro inicial");
    expect(evoluciones[0].peso_gramos).toBe(800);
    expect(evoluciones[1]).toMatchObject({ peso_gramos:850.5, observacion:"Va bien" });

    const evento = await filas(
      "SELECT detalle FROM ave_historial WHERE ave_id = ? AND tipo_evento = 'EVOLUCION'",
      ave.id
    );

    expect(evento[0].detalle).toBe("Evolución registrada. Peso: 800 g → 850.5 g. Va bien");

    const actual = await aves.obtener(criaderoA, ave.id);

    expect(actual.success && actual.data.ave.pesoGramos).toBe(850.5);

    instante = "2026-10-30T12:00:00.000Z";

  });


  it("debe registrar un evento de ciclo de vida sin jaula y listarlo en el historial", async()=>{

    const ave = await crearAve(criaderoA,"CV1");

    const evento = await aves.registrarEvento(criaderoA, ave.id,{ tipoEvento:"RECUPERACION", detalle:"ok" });

    expect(evento.success).toBe(true);

    const historial = await aves.listarHistorial(criaderoA, ave.id);

    expect(historial.success).toBe(true);

    if(historial.success){
      expect(historial.data.historial.map(h=>h.tipoEvento).sort()).toEqual(["ALTA","RECUPERACION"]);
      expect(historial.data.historial.find(h=>h.tipoEvento==="RECUPERACION")?.jaulaId).toBeNull();
    }

    const inexistente = await aves.registrarEvento(criaderoA,"no-existe",{ tipoEvento:"X" });

    expect(!inexistente.success && inexistente.error).toBe("AVE_NO_ENCONTRADA");

  });


  it("debe finalizar el tratamiento cerrando solo los diagnósticos ACTIVO del ave (PAR-AVE-039, 046)", async()=>{

    const ave = await crearAve(criaderoA,"FT1");
    const otra = await crearAve(criaderoA,"FT2");

    await db.prepare("UPDATE aves SET estado_salud = 'EN_TRATAMIENTO' WHERE id = ?").bind(ave.id).run();

    for(const [id, aveId, estado] of [
      ["dg-1", ave.id, "ACTIVO"],
      ["dg-2", ave.id, "CERRADO"],
      ["dg-3", otra.id, "ACTIVO"]
    ]){
      await db
        .prepare(`
          INSERT INTO diagnosticos_ave (id, criadero_id, ave_id, fecha, enfermedad, estado)
          VALUES (?, ?, ?, '2026-10-29T10:00:00.000Z', 'Coriza', ?)
        `)
        .bind(id, criaderoA, aveId, estado)
        .run();
    }

    instante = "2026-11-02T09:00:00.000Z";

    const resultado = await aves.finalizarTratamiento(criaderoA, ave.id,{ observacion:" Mejoró " });

    expect(resultado.success).toBe(true);

    if(resultado.success){
      expect(resultado.data.ave.estadoSalud).toBe("SANA");
      expect(resultado.data.ave.fechaUltimoControlSalud).toBe("2026-11-02T09:00:00.000Z");
    }

    const diagnosticos = await filas("SELECT id, estado FROM diagnosticos_ave ORDER BY id");

    expect(diagnosticos.map(d=>[d.id,d.estado])).toEqual([
      ["dg-1","CERRADO"],
      ["dg-2","CERRADO"],
      ["dg-3","ACTIVO"]
    ]);

    const eventos = await filas(
      "SELECT tipo_evento, detalle, jaula_id FROM ave_historial WHERE ave_id = ? AND tipo_evento IN ('SALUD','RECUPERACION') ORDER BY tipo_evento DESC",
      ave.id
    );

    expect(eventos).toEqual([
      { tipo_evento:"SALUD", detalle:"Recuperación registrada: Mejoró", jaula_id:null }
    ]);

    // Sin validar el estado: un ave ya SANA también se procesa.
    const otraVez = await aves.finalizarTratamiento(criaderoA, otra.id,{});

    expect(otraVez.success).toBe(true);

    const inexistente = await aves.finalizarTratamiento(criaderoA,"no-existe",{});

    expect(!inexistente.success && inexistente.error).toBe("AVE_NO_ENCONTRADA");

    instante = "2026-10-30T12:00:00.000Z";

  });


  it("debe liberar las aves de cualquier estado al desactivar la jaula y exponer su historial (PAR-AVE-043)", async()=>{

    const jaula = await crearJaula(criaderoA,"DJ1");
    const activa = await crearAve(criaderoA,"DA1",{ jaulaId:jaula.id });
    const vendida = await crearAve(criaderoA,"DA2",{ jaulaId:jaula.id });

    await db.prepare("UPDATE aves SET estado = 'VENDIDA' WHERE id = ?").bind(vendida.id).run();

    const antes = await jaulas.listar(criaderoA,"ACTIVA");

    expect(antes.success && antes.data.jaulas.find(j=>j.codigo==="DJ1")?.cantidadAves).toBe(1);

    const resultado = await jaulas.desactivar(criaderoA, jaula.id);

    expect(resultado).toEqual({ success:true, data:{ cantidadAvesLiberadas:2 } });

    const libres = await filas(
      "SELECT codigo, jaula_actual_id FROM aves WHERE codigo IN ('DA1','DA2') ORDER BY codigo"
    );

    expect(libres.every(a=>a.jaula_actual_id===null)).toBe(true);

    const cambios = await filas(
      "SELECT jaula_id, detalle FROM ave_historial WHERE tipo_evento = 'CAMBIO_JAULA' AND ave_id IN (?, ?)",
      activa.id,
      vendida.id
    );

    expect(cambios).toHaveLength(2);
    expect(cambios.every(c=>c.jaula_id===null)).toBe(true);
    expect(cambios[0].detalle).toBe("La jaula DJ1 fue eliminada. El ave quedó sin jaula asignada.");

    const salidas = await filas(
      "SELECT detalle FROM jaula_historial WHERE jaula_id = ? AND tipo_evento = 'SALIDA_AVE' ORDER BY detalle",
      jaula.id
    );

    expect(salidas.map(s=>s.detalle)).toEqual([
      "Ave DA1 salió de la jaula porque la jaula fue eliminada.",
      "Ave DA2 salió de la jaula porque la jaula fue eliminada."
    ]);

    const inactivas = await jaulas.listar(criaderoA,"INACTIVA");

    expect(inactivas.success && inactivas.data.jaulas.find(j=>j.codigo==="DJ1")?.cantidadAves).toBe(2);

    const historicas = await jaulas.listarAvesHistoricas(criaderoA, jaula.id);

    expect(historicas.success && historicas.data.aves.map(a=>[a.codigo,a.estado])).toEqual([
      ["DA1","ACTIVA"],
      ["DA2","VENDIDA"]
    ]);

    const completo = await jaulas.listarHistorialCompleto(criaderoA, jaula.id);

    expect(completo.success).toBe(true);

    if(completo.success){
      expect(completo.data.historial.map(h=>h.tipoEvento).sort()).toEqual([
        "INGRESO_AVE","INGRESO_AVE","SALIDA_AVE","SALIDA_AVE"
      ]);
      expect(completo.data.historial.every(h=>h.aveCodigo!==null)).toBe(true);
    }

    const otraVez = await jaulas.desactivar(criaderoA, jaula.id);

    expect(otraVez).toEqual({ success:true, data:{ cantidadAvesLiberadas:0 } });

  });


  it("debe aislar las aves por criadero", async()=>{

    const deB = await aves.listar(criaderoB,"ACTIVA");

    if(!deB.success){
      throw new Error("No se pudo listar");
    }

    const idDeB = deB.data.aves[0].id;

    const desdeA = await aves.obtener(criaderoA, idDeB);
    const finalizar = await aves.finalizarTratamiento(criaderoA, idDeB,{});

    expect(!desdeA.success && desdeA.error).toBe("AVE_NO_ENCONTRADA");
    expect(!finalizar.success && finalizar.error).toBe("AVE_NO_ENCONTRADA");

  });

});
