import { describe, it, expect, beforeEach } from "vitest";
import { AveService } from "../src/aves/aves.service";
import { FakeAveRepository } from "./helpers/fake-aves.repository";


const CRIADERO = "criadero-1";

const OTRO_CRIADERO = "criadero-2";


let repository: FakeAveRepository;

let service: AveService;

let ids: number;

let instante: string;


function crearServicio(){

  repository = new FakeAveRepository();

  ids = 0;

  instante = "2026-10-30T12:00:00.000Z";

  service = new AveService(
    repository,
    () => new Date(instante),
    () => `id-${++ids}`
  );

  repository.sembrarJaula(CRIADERO, "jaula-1", "J001");
  repository.sembrarJaula(CRIADERO, "jaula-2", "J002");
  repository.sembrarJaula(OTRO_CRIADERO, "jaula-ajena", "J999");

}


async function crear(codigo: string, extra: Record<string, unknown> = {}, criadero = CRIADERO){

  const resultado = await service.crear(criadero, {
    codigo,
    origen: "NACIDA_CRIADERO",
    fechaNacimiento: "2026-01-01",
    raza: "Kiri",
    sexo: "MACHO",
    ...extra
  });

  if(!resultado.success){
    throw new Error(`No se pudo crear ${codigo}: ${resultado.error}`);
  }

  return resultado.data.ave;

}


function error(resultado: { success: boolean }){

  expect(resultado.success).toBe(false);

  return resultado as { success: false; error: string; message: string };

}


describe("AveService (paridad con AveRepository de V1)",()=>{


  beforeEach(()=>{
    crearServicio();
  });


  it("debe crear el ave con evolución inicial y evento ALTA sin jaula_historial (PAR-AVE-001)", async()=>{

    const ave = await crear(" k001 ");

    expect(ave.codigo).toBe("K001");
    expect(ave.estado).toBe("ACTIVA");
    expect(ave.estadoSalud).toBe("SANA");
    expect(ave.edadMesesCompra).toBeNull();

    expect(repository.evoluciones).toHaveLength(1);
    expect(repository.evoluciones[0].observacion).toBe("Registro inicial");

    expect(repository.historial).toHaveLength(1);
    expect(repository.historial[0]).toMatchObject({
      tipoEvento: "ALTA",
      jaulaId: null,
      detalle: "Ave registrada como nacida en el criadero."
    });

    expect(repository.jaulaHistorial).toHaveLength(0);

  });


  it("debe registrar el alta de un ave comprada con su detalle (PAR-AVE-002)", async()=>{

    await crear("K002",{
      origen: "COMPRADA",
      edadMesesCompra: 8,
      fechaIngreso: "2025-06-15",
      criaderoOrigen: " Criadero X ",
      metodoEnvio: "Bus"
    });

    expect(repository.historial[0].detalle).toBe("Ave registrada como comprada.");
    expect(repository.aves[0].criaderoOrigen).toBe("Criadero X");
    expect(repository.aves[0].edadMesesCompra).toBe(8);

  });


  it("debe escribir INGRESO_AVE con el código en mayúsculas si hay jaula inicial (PAR-AVE-003, 004)", async()=>{

    const ave = await crear("k003",{ jaulaId: "jaula-1" });

    expect(ave.jaulaActualId).toBe("jaula-1");
    expect(repository.historial[0].jaulaId).toBe("jaula-1");
    expect(repository.jaulaHistorial).toHaveLength(1);
    expect(repository.jaulaHistorial[0]).toMatchObject({
      tipoEvento: "INGRESO_AVE",
      jaulaId: "jaula-1",
      detalle: "Ave K003 ingresó a la jaula."
    });

  });


  it("debe responder el mensaje de SQLite si el código ya existe al crear (V1 depende del UNIQUE)", async()=>{

    await crear("K001");

    const resultado = error(await service.crear(CRIADERO,{ codigo: "K001", origen: "COMPRADA" }));

    expect(resultado.error).toBe("UNIQUE_AVES_CODIGO");
    expect(resultado.message).toBe("UNIQUE constraint failed: aves.codigo");
    expect(repository.aves).toHaveLength(1);

  });


  it("debe permitir el mismo código en otro criadero", async()=>{

    await crear("K001");

    const otra = await crear("K001",{}, OTRO_CRIADERO);

    expect(otra.codigo).toBe("K001");

  });


  it("debe rechazar la jaula de otro criadero con el mensaje de FK de SQLite", async()=>{

    const resultado = error(await service.crear(CRIADERO,{
      codigo: "K001",
      origen: "COMPRADA",
      jaulaId: "jaula-ajena"
    }));

    expect(resultado.error).toBe("JAULA_NO_ENCONTRADA");
    expect(resultado.message).toBe("FOREIGN KEY constraint failed");
    expect(repository.aves).toHaveLength(0);

  });


  it("debe aceptar una jaula inactiva al crear porque V1 no lo valida", async()=>{

    repository.sembrarJaula(CRIADERO, "jaula-inactiva", "J003", 0);

    const ave = await crear("K001",{ jaulaId: "jaula-inactiva" });

    expect(ave.jaulaActualId).toBe("jaula-inactiva");

  });


  it("debe rechazar padre y madre iguales antes de buscarlos (PAR-AVE-011)", async()=>{

    const resultado = error(await service.crear(CRIADERO,{
      codigo: "K001",
      origen: "NACIDA_CRIADERO",
      padreId: "x",
      madreId: "x"
    }));

    expect(resultado.error).toBe("PADRES_IGUALES");
    expect(resultado.message).toBe("PADRES_IGUALES");

  });


  it("debe distinguir padre no encontrado, padre no macho, madre no encontrada y madre no hembra", async()=>{

    const macho = await crear("M1",{ sexo: "MACHO" });
    const hembra = await crear("H1",{ sexo: "HEMBRA" });

    const base = { codigo: "K9", origen: "NACIDA_CRIADERO" };

    expect(error(await service.crear(CRIADERO,{ ...base, padreId: "no-existe" })).error)
      .toBe("PADRE_NO_ENCONTRADO");

    expect(error(await service.crear(CRIADERO,{ ...base, padreId: hembra.id })).error)
      .toBe("PADRE_NO_MACHO");

    expect(error(await service.crear(CRIADERO,{ ...base, madreId: "no-existe" })).error)
      .toBe("MADRE_NO_ENCONTRADA");

    expect(error(await service.crear(CRIADERO,{ ...base, madreId: macho.id })).error)
      .toBe("MADRE_NO_HEMBRA");

    expect(repository.aves).toHaveLength(2);

  });


  it("debe aceptar un padre sin sexo registrado como V1 (PAR-AVE-015)", async()=>{

    const sinSexo = await crear("S1",{ sexo: null });

    const hijo = await crear("K5",{ padreId: sinSexo.id });

    expect(hijo.padreId).toBe(sinSexo.id);

  });


  it("debe guardar padre y madre aunque el origen sea COMPRADA al crear (V1 no los vacía)", async()=>{

    const padre = await crear("P1");

    const hijo = await crear("K6",{ origen: "COMPRADA", padreId: padre.id });

    expect(hijo.padreId).toBe(padre.id);

  });


  it("debe rechazar un cuerpo cuyo código u origen no es texto (validación técnica)", async()=>{

    for(const cuerpo of [{ origen: "COMPRADA" },{ codigo: 5, origen: "COMPRADA" },{ codigo: "A" },"A"]){
      expect(error(await service.crear(CRIADERO, cuerpo)).error).toBe("VALIDATION_ERROR");
    }

    expect(error(await service.crear(CRIADERO,{ codigo: "A", origen: "COMPRADA", pesoGramos: "10" })).error)
      .toBe("VALIDATION_ERROR");

    expect(repository.aves).toHaveLength(0);

  });


  it("debe normalizar con trim y convertir vacío en null como V1", async()=>{

    const ave = await crear("K1",{ raza: "  ", caracteristicas: " plumas ", sexo: "", pesoGramos: 0 });

    expect(ave.raza).toBeNull();
    expect(ave.caracteristicas).toBe("plumas");
    expect(ave.sexo).toBeNull();
    expect(ave.pesoGramos).toBe(0);

  });


  it("debe editar solo el peso y registrar DATOS_ACTUALIZADOS sin evolución nueva (PAR-AVE-018)", async()=>{

    const ave = await crear("K1",{ pesoGramos: 800, jaulaId: "jaula-1" });

    const resultado = await service.actualizar(CRIADERO, ave.id,{
      codigo: "K1",
      origen: "NACIDA_CRIADERO",
      fechaNacimiento: "2026-01-01",
      raza: "Kiri",
      sexo: "MACHO",
      pesoGramos: 850
    });

    expect(resultado.success).toBe(true);

    const evento = repository.historial.filter(h => h.tipoEvento === "DATOS_ACTUALIZADOS");

    expect(evento).toHaveLength(1);
    expect(evento[0].detalle).toBe("Datos generales actualizados: peso.");
    expect(evento[0].jaulaId).toBe("jaula-1");
    expect(repository.evoluciones).toHaveLength(1);

  });


  it("debe registrar el evento aunque no haya cambios (PAR-AVE-019)", async()=>{

    const ave = await crear("K1");

    await service.actualizar(CRIADERO, ave.id,{
      codigo: "k1",
      origen: "NACIDA_CRIADERO",
      fechaNacimiento: "2026-01-01",
      raza: "Kiri",
      sexo: "MACHO"
    });

    const evento = repository.historial.find(h => h.tipoEvento === "DATOS_ACTUALIZADOS");

    expect(evento?.detalle).toBe("Se guardó la edición de los datos generales sin cambios visibles.");

  });


  it("debe listar las etiquetas de cambios en el orden de V1 y vaciar padres al pasar a COMPRADA (PAR-AVE-023)", async()=>{

    const padre = await crear("P1");
    const hijo = await crear("K1",{ padreId: padre.id });

    const resultado = await service.actualizar(CRIADERO, hijo.id,{
      codigo: "K2",
      origen: "COMPRADA",
      fechaNacimiento: "2025-01-01",
      edadMesesCompra: 3,
      raza: "Seram",
      sexo: "HEMBRA",
      padreId: padre.id
    });

    expect(resultado.success).toBe(true);

    if(resultado.success){
      expect(resultado.data.ave.padreId).toBeNull();
    }

    const evento = repository.historial.find(h => h.tipoEvento === "DATOS_ACTUALIZADOS");

    expect(evento?.detalle).toBe(
      "Datos generales actualizados: código, origen, fecha de nacimiento, edad de ingreso, raza, sexo, padre."
    );

  });


  it("debe devolver los errores de edición en el orden de V1", async()=>{

    const ave = await crear("K1");
    const otra = await crear("K2");
    const vendida = await crear("K3");

    repository.aves.find(a => a.id === vendida.id)!.estado = "VENDIDA";

    const datos = { codigo: "K1", origen: "NACIDA_CRIADERO" };

    expect(error(await service.actualizar(CRIADERO,"no-existe",datos)).error)
      .toBe("AVE_NO_ENCONTRADA");

    expect(error(await service.actualizar(CRIADERO, vendida.id, datos)).error)
      .toBe("AVE_NO_ACTIVA");

    expect(error(await service.actualizar(CRIADERO, ave.id,{ ...datos, padreId: ave.id })).error)
      .toBe("PADRE_ES_MISMA_AVE");

    expect(error(await service.actualizar(CRIADERO, ave.id,{ ...datos, madreId: ave.id })).error)
      .toBe("MADRE_ES_MISMA_AVE");

    expect(error(await service.actualizar(CRIADERO, ave.id,{ ...datos, padreId: otra.id, madreId: otra.id })).error)
      .toBe("PADRES_IGUALES");

    expect(error(await service.actualizar(CRIADERO, ave.id,{ ...datos, codigo: " k2 " })).error)
      .toBe("CODIGO_AVE_DUPLICADO");

  });


  it("debe permitir editar con el propio código aunque cambie la capitalización (PAR-AVE-021)", async()=>{

    const ave = await crear("K1");

    const resultado = await service.actualizar(CRIADERO, ave.id,{ codigo: "k1", origen: "NACIDA_CRIADERO" });

    expect(resultado.success).toBe(true);

  });


  it("debe detectar el parentesco circular con una sola consulta de descendientes (PAR-AVE-022)", async()=>{

    const abuelo = await crear("A1",{ sexo: "MACHO" });
    const hija = await crear("B1",{ sexo: "HEMBRA", padreId: abuelo.id });
    const nieto = await crear("C1",{ sexo: "MACHO", madreId: hija.id });

    repository.consultasDescendientes = 0;

    const circularPadre = error(await service.actualizar(CRIADERO, abuelo.id,{
      codigo: "A1",
      origen: "NACIDA_CRIADERO",
      padreId: nieto.id
    }));

    expect(circularPadre.error).toBe("PARENTESCO_CIRCULAR_PADRE");
    expect(repository.consultasDescendientes).toBe(1);

    const circularMadre = error(await service.actualizar(CRIADERO, abuelo.id,{
      codigo: "A1",
      origen: "NACIDA_CRIADERO",
      madreId: hija.id
    }));

    expect(circularMadre.error).toBe("PARENTESCO_CIRCULAR_MADRE");

  });


  it("debe cambiar de jaula con CAMBIO_JAULA, SALIDA_AVE e INGRESO_AVE (PAR-AVE-025)", async()=>{

    const ave = await crear("K1",{ jaulaId: "jaula-1" });

    const resultado = await service.cambiarJaula(CRIADERO, ave.id,{
      nuevaJaulaId: "jaula-2",
      jaulaAnteriorId: "jaula-1",
      codigoAve: "K1"
    });

    expect(resultado.success).toBe(true);

    const cambio = repository.historial.find(h => h.tipoEvento === "CAMBIO_JAULA");

    expect(cambio).toMatchObject({
      jaulaId: "jaula-2",
      detalle: "El ave fue movida de una jaula a otra."
    });

    expect(repository.jaulaHistorial.slice(1).map(h => [h.tipoEvento, h.jaulaId, h.detalle])).toEqual([
      ["SALIDA_AVE","jaula-1","Ave K1 salió de la jaula."],
      ["INGRESO_AVE","jaula-2","Ave K1 ingresó a la jaula."]
    ]);

  });


  it("debe asignar una jaula sin SALIDA_AVE y retirarla sin INGRESO_AVE (PAR-AVE-024, 026)", async()=>{

    const ave = await crear("K1");

    await service.cambiarJaula(CRIADERO, ave.id,{ nuevaJaulaId: "jaula-1", codigoAve: "K1" });

    expect(repository.historial.at(-1)?.detalle).toBe("El ave fue asignada a una jaula.");
    expect(repository.jaulaHistorial.map(h => h.tipoEvento)).toEqual(["INGRESO_AVE"]);

    await service.cambiarJaula(CRIADERO, ave.id,{ nuevaJaulaId: null, jaulaAnteriorId: "jaula-1", codigoAve: "K1" });

    expect(repository.historial.at(-1)).toMatchObject({
      jaulaId: null,
      detalle: "El ave fue retirada de su jaula."
    });

    expect(repository.jaulaHistorial.map(h => h.tipoEvento)).toEqual(["INGRESO_AVE","SALIDA_AVE"]);
    expect(repository.aves[0].jaulaActualId).toBeNull();

  });


  it("debe cambiar la jaula de un ave no activa porque V1 no valida el estado", async()=>{

    const ave = await crear("K1");

    repository.aves[0].estado = "VENDIDA";

    const resultado = await service.cambiarJaula(CRIADERO, ave.id,{ nuevaJaulaId: "jaula-1" });

    expect(resultado.success).toBe(true);

  });


  it("debe responder AVE_NO_ENCONTRADA y JAULA_NO_ENCONTRADA al cambiar de jaula con datos inexistentes", async()=>{

    const ave = await crear("K1");

    expect(error(await service.cambiarJaula(CRIADERO,"no-existe",{ nuevaJaulaId: "jaula-1" })).error)
      .toBe("AVE_NO_ENCONTRADA");

    expect(error(await service.cambiarJaula(CRIADERO, ave.id,{ nuevaJaulaId: "jaula-ajena" })).error)
      .toBe("JAULA_NO_ENCONTRADA");

  });


  it("debe listar solo las activas, ordenadas por código, con candidatas excluyendo descendientes (PAR-AVE-027, 032)", async()=>{

    const abuelo = await crear("B1");
    const hijo = await crear("C1",{ padreId: abuelo.id });
    await crear("A1");
    const vendida = await crear("D1");

    repository.aves.find(a => a.id === vendida.id)!.estado = "VENDIDA";

    const activas = await service.listar(CRIADERO,"ACTIVA");

    expect(activas.success && activas.data.aves.map(a => a.codigo)).toEqual(["A1","B1","C1"]);

    const candidatas = await service.listarCandidatasPadres(CRIADERO, abuelo.id);

    expect(candidatas.success && candidatas.data.aves.map(a => a.codigo)).toEqual(["A1"]);
    expect(hijo.id).toBeTruthy();

    const bajas = await service.listar(CRIADERO,"VENDIDA");

    expect(bajas.success && bajas.data.aves.map(a => a.codigo)).toEqual(["D1"]);

  });


  it("debe listar para asignar las activas sin jaula o con otra jaula, y por jaula solo las activas", async()=>{

    await crear("A1",{ jaulaId: "jaula-1" });
    await crear("B1",{ jaulaId: "jaula-2" });
    await crear("C1");

    const paraAsignar = await service.listarParaAsignarJaula(CRIADERO,"jaula-1");
    const porJaula = await service.listarPorJaula(CRIADERO,"jaula-1");

    expect(paraAsignar.success && paraAsignar.data.aves.map(a => a.codigo)).toEqual(["B1","C1"]);
    expect(paraAsignar.success && paraAsignar.data.aves[0].jaulaCodigo).toBe("J002");
    expect(porJaula.success && porJaula.data.aves.map(a => a.codigo)).toEqual(["A1"]);

  });


  it("debe comprobar el código con UPPER(TRIM), false si queda vacío y sin filtrar estado (PAR-AVE-006)", async()=>{

    const ave = await crear("K001");

    repository.aves[0].estado = "VENDIDA";

    const existe = await service.existeCodigo(CRIADERO," k001 ",null);
    const propio = await service.existeCodigo(CRIADERO,"K001", ave.id);
    const vacio = await service.existeCodigo(CRIADERO,"   ",null);

    expect(existe.success && existe.data.existe).toBe(true);
    expect(propio.success && propio.data.existe).toBe(false);
    expect(vacio.success && vacio.data.existe).toBe(false);

  });


  it("debe devolver AVE_NO_ENCONTRADA al abrir un ave inexistente o de otro criadero (PAR-AVE-030)", async()=>{

    const ajena = await crear("K1",{}, OTRO_CRIADERO);

    expect(error(await service.obtener(CRIADERO,"no-existe")).error).toBe("AVE_NO_ENCONTRADA");
    expect(error(await service.obtener(CRIADERO, ajena.id)).error).toBe("AVE_NO_ENCONTRADA");

  });


  it("debe registrar la evolución con el registro inicial y los cambios de medida (PAR-AVE-035)", async()=>{

    const ave = await crear("K1",{ jaulaId: "jaula-1" });

    repository.evoluciones = [];

    const resultado = await service.registrarEvolucion(CRIADERO, ave.id,{
      pesoGramos: "850,5",
      observacion: " Va bien "
    });

    expect(resultado.success).toBe(true);

    expect(repository.evoluciones).toHaveLength(2);
    expect(repository.evoluciones[0].observacion).toBe("Registro inicial");
    expect(repository.evoluciones[0].fecha).toBe("2026-10-30 12:00:00");
    expect(repository.evoluciones[1]).toMatchObject({ pesoGramos: 850.5, observacion: " Va bien " });

    const evento = repository.historial.find(h => h.tipoEvento === "EVOLUCION");

    expect(evento?.jaulaId).toBe("jaula-1");
    expect(evento?.detalle).toBe("Evolución registrada. Peso: No registrado → 850.5 g. Va bien");

  });


  it("debe conservar las medidas no informadas y detallar foto y características", async()=>{

    const ave = await crear("K1",{ pesoGramos: 800, alturaCm: 20, fotoUri: "file:///a.jpg" });

    await service.registrarEvolucion(CRIADERO, ave.id,{
      alturaCm: 22,
      fotoUri: "file:///b.jpg",
      caracteristicas: "Cresta grande"
    });

    expect(repository.aves[0]).toMatchObject({
      pesoGramos: 800,
      alturaCm: 22,
      fotoUri: "file:///b.jpg",
      caracteristicas: "Cresta grande"
    });

    expect(repository.historial.find(h => h.tipoEvento === "EVOLUCION")?.detalle).toBe(
      "Evolución registrada. Altura: 20 cm → 22 cm. Fotografía actualizada. Características actualizadas."
    );

  });


  it("debe usar el texto por defecto si no hay cambios ni observación y no repetir el registro inicial", async()=>{

    const ave = await crear("K1",{ fotoUri: "file:///a.jpg" });

    const resultado = await service.registrarEvolucion(CRIADERO, ave.id,{ fotoUri: "file:///a.jpg" });

    expect(resultado.success).toBe(true);
    expect(repository.evoluciones).toHaveLength(2);

    const evento = repository.historial.find(h => h.tipoEvento === "EVOLUCION");

    expect(evento?.detalle).toBe("Se actualizó la evolución del ave.");

  });


  it("debe devolver AVE_NO_ENCONTRADA al registrar una evolución de un ave inexistente", async()=>{

    expect(error(await service.registrarEvolucion(CRIADERO,"no-existe",{ pesoGramos: 1 })).error)
      .toBe("AVE_NO_ENCONTRADA");

  });


  it("debe registrar un evento de ciclo de vida sin jaula, con fecha por defecto y detalle null", async()=>{

    const ave = await crear("K1",{ jaulaId: "jaula-1" });

    const resultado = await service.registrarEvento(CRIADERO, ave.id,{ tipoEvento: "RECUPERACION" });

    expect(resultado.success).toBe(true);

    const evento = repository.historial.at(-1)!;

    expect(evento).toMatchObject({
      tipoEvento: "RECUPERACION",
      jaulaId: null,
      detalle: null,
      fecha: "2026-10-30T12:00:00.000Z"
    });

    expect(error(await service.registrarEvento(CRIADERO, ave.id,{})).error).toBe("VALIDATION_ERROR");
    expect(error(await service.registrarEvento(CRIADERO,"no-existe",{ tipoEvento: "X" })).error)
      .toBe("AVE_NO_ENCONTRADA");

  });


  it("debe finalizar el tratamiento con SANA, diagnósticos cerrados y solo el evento SALUD (PAR-AVE-039)", async()=>{

    const ave = await crear("K1");

    repository.aves[0].estadoSalud = "EN_TRATAMIENTO";
    repository.diagnosticos.push(
      { id: "d1", aveId: ave.id, estado: "ACTIVO" },
      { id: "d2", aveId: ave.id, estado: "CERRADO" }
    );

    const resultado = await service.finalizarTratamiento(CRIADERO, ave.id,{ observacion: " Mejoró " });

    expect(resultado.success).toBe(true);

    expect(repository.aves[0].estadoSalud).toBe("SANA");
    expect(repository.aves[0].fechaUltimoControlSalud).toBe("2026-10-30T12:00:00.000Z");
    expect(repository.diagnosticos.map(d => d.estado)).toEqual(["CERRADO","CERRADO"]);

    expect(repository.historial.slice(-1).map(h => [h.tipoEvento, h.detalle, h.jaulaId])).toEqual([
      ["SALUD","Recuperación registrada: Mejoró",null]
    ]);
    expect(repository.historial.some(h => h.tipoEvento === "RECUPERACION")).toBe(false);

  });


  it("debe usar los textos por defecto y ejecutar aunque el ave no esté EN_TRATAMIENTO (PAR-AVE-046)", async()=>{

    const ave = await crear("K1");

    const resultado = await service.finalizarTratamiento(CRIADERO, ave.id, undefined);

    expect(resultado.success).toBe(true);

    expect(repository.historial.slice(-1).map(h => h.detalle)).toEqual([
      "Ave recuperada y tratamiento finalizado."
    ]);

  });


  it("debe devolver AVE_NO_ENCONTRADA al finalizar el tratamiento de un ave inexistente", async()=>{

    const resultado = error(await service.finalizarTratamiento(CRIADERO,"no-existe",{}));

    expect(resultado.error).toBe("AVE_NO_ENCONTRADA");
    expect(repository.historial).toHaveLength(0);

  });


  it("debe listar el historial del ave del más reciente al más antiguo", async()=>{

    const ave = await crear("K1");

    instante = "2026-10-31T12:00:00.000Z";

    await service.registrarEvento(CRIADERO, ave.id,{ tipoEvento: "OTRO", detalle: "x" });

    const historial = await service.listarHistorial(CRIADERO, ave.id);

    expect(historial.success && historial.data.historial.map(h => h.tipoEvento)).toEqual(["OTRO","ALTA"]);

  });

});
