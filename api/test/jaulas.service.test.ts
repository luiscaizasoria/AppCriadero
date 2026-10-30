import { describe, it, expect, beforeEach } from "vitest";
import { JaulaService } from "../src/jaulas/jaulas.service";
import { FakeJaulaRepository } from "./helpers/fake-jaula.repository";


const CRIADERO = "criadero-1";

const OTRO_CRIADERO = "criadero-2";


let repository: FakeJaulaRepository;

let service: JaulaService;

let ids: number;

let instante: string;


function crearServicio(){

  repository = new FakeJaulaRepository();

  ids = 0;

  instante = "2026-10-30T12:00:00.000Z";

  service = new JaulaService(
    repository,
    () => new Date(instante),
    () => `jaula-${++ids}`
  );

}


async function crear(codigo: string, extra: Record<string, unknown> = {}, criadero = CRIADERO){

  const resultado = await service.crear(criadero, { codigo, ...extra });

  if(!resultado.success){
    throw new Error(`No se pudo crear ${codigo}: ${resultado.error}`);
  }

  return resultado.data.jaula;

}


describe("JaulaService (paridad con JaulaRepository de V1)",()=>{


  beforeEach(()=>{
    crearServicio();
  });


  it("debe crear una jaula activa en estado sanitario NORMAL (PAR-JAU-001)", async()=>{

    const resultado = await service.crear(CRIADERO,{ codigo:"J001", tipo:"General" });

    expect(resultado.success).toBe(true);

    if(!resultado.success){
      return;
    }

    const jaula = resultado.data.jaula;

    expect(jaula.id).toBe("jaula-1");
    expect(jaula.codigo).toBe("J001");
    expect(jaula.nombre).toBeNull();
    expect(jaula.ubicacion).toBeNull();
    expect(jaula.tipo).toBe("General");
    expect(jaula.estadoSanitario).toBe("NORMAL");
    expect(jaula.activa).toBe(1);
    expect(jaula.fechaCreacion).toBeTruthy();
    expect(jaula.fechaActualizacion).toBeNull();
    expect(jaula.fechaDesactivacion).toBeNull();

  });


  it("debe aplicar solo trim, sin pasar a mayúsculas, y convertir vacío en null (PAR-JAU-002)", async()=>{

    const jaula = await crear(" j002 ",{ nombre:" Sector A ", ubicacion:"", tipo:"   " });

    expect(jaula.codigo).toBe("j002");
    expect(jaula.nombre).toBe("Sector A");
    expect(jaula.ubicacion).toBeNull();
    expect(jaula.tipo).toBeNull();

  });


  it("debe rechazar un código duplicado con el mensaje de SQLite que reconocen las pantallas (PAR-JAU-004)", async()=>{

    await crear("J001");

    const resultado = await service.crear(CRIADERO,{ codigo:"J001" });

    expect(resultado.success).toBe(false);

    if(resultado.success){
      return;
    }

    expect(resultado.error).toBe("UNIQUE_JAULAS_CODIGO");
    expect(resultado.message).toBe("UNIQUE constraint failed: jaulas.codigo");

    expect(await repository.filas.length).toBe(1);

  });


  it("debe mantener ocupado el código de una jaula inactiva (PAR-JAU-005)", async()=>{

    const jaula = await crear("J001");

    await service.desactivar(CRIADERO, jaula.id);

    const resultado = await service.crear(CRIADERO,{ codigo:"J001" });

    expect(resultado.success).toBe(false);

  });


  it("debe distinguir mayúsculas en la unicidad del código (PAR-JAU-006)", async()=>{

    await crear("J001");

    const resultado = await service.crear(CRIADERO,{ codigo:"j001" });

    expect(resultado.success).toBe(true);

  });


  it("debe permitir el mismo código en criaderos distintos", async()=>{

    await crear("J001");

    const resultado = await service.crear(OTRO_CRIADERO,{ codigo:"J001" });

    expect(resultado.success).toBe(true);

  });


  it("debe listar solo las activas ordenadas por código con cantidadAves en 0 (PAR-JAU-007, 009)", async()=>{

    await crear("J002");
    await crear("J001");
    const inactiva = await crear("J003");

    await service.desactivar(CRIADERO, inactiva.id);

    const resultado = await service.listar(CRIADERO,"ACTIVA");

    expect(resultado.success).toBe(true);

    if(!resultado.success){
      return;
    }

    const jaulas = resultado.data.jaulas;

    expect(jaulas.map(j=>j.codigo)).toEqual(["J001","J002"]);
    expect(jaulas.every(j=>j.cantidadAves===0)).toBe(true);
    expect(jaulas.every(j=>j.activa===1)).toBe(true);

  });


  it("debe listar las inactivas por fecha de desactivación descendente (PAR-JAU-011)", async()=>{

    const a = await crear("A");
    const b = await crear("B");

    instante = "2026-10-29T10:00:00.000Z";
    await service.desactivar(CRIADERO, b.id);

    instante = "2026-10-30T10:00:00.000Z";
    await service.desactivar(CRIADERO, a.id);

    const resultado = await service.listar(CRIADERO,"INACTIVA");

    expect(resultado.success).toBe(true);

    if(!resultado.success){
      return;
    }

    expect(resultado.data.jaulas.map(j=>j.codigo)).toEqual(["A","B"]);

  });


  it("debe devolver JAULA_NO_ENCONTRADA al abrir una jaula inexistente o de otro criadero (PAR-JAU-018)", async()=>{

    const ajena = await crear("J001", {}, OTRO_CRIADERO);

    const inexistente = await service.obtener(CRIADERO,"no-existe");
    const deOtro = await service.obtener(CRIADERO, ajena.id);

    for(const resultado of [inexistente, deOtro]){

      expect(resultado.success).toBe(false);

      if(!resultado.success){
        expect(resultado.error).toBe("JAULA_NO_ENCONTRADA");
      }

    }

  });


  it("debe rechazar editar a un código que ya existe (PAR-JAU-014)", async()=>{

    await crear("J001");
    const segunda = await crear("J002");

    const resultado = await service.actualizar(CRIADERO, segunda.id, { codigo:"J001" });

    expect(resultado.success).toBe(false);

    if(!resultado.success){
      expect(resultado.message).toBe("UNIQUE constraint failed: jaulas.codigo");
    }

  });


  it("debe permitir editar sin cambiar el código y actualizar los datos (PAR-JAU-015)", async()=>{

    const jaula = await crear("J001",{ nombre:"Antes" });

    const resultado = await service.actualizar(
      CRIADERO,
      jaula.id,
      { codigo:"J001", nombre:"Después", ubicacion:"Patio", tipo:"Postura" }
    );

    expect(resultado.success).toBe(true);

    if(!resultado.success){
      return;
    }

    expect(resultado.data.jaula.nombre).toBe("Después");
    expect(resultado.data.jaula.ubicacion).toBe("Patio");
    expect(resultado.data.jaula.tipo).toBe("Postura");
    expect(jaula.fechaActualizacion).toBeNull();
    expect(resultado.data.jaula.fechaActualizacion).toBeTruthy();

  });


  it("debe guardar el tipo vacío como null y aceptar texto libre (PAR-JAU-016)", async()=>{

    const jaula = await crear("J001",{ tipo:"Postura" });

    const vacio = await service.actualizar(CRIADERO, jaula.id, { codigo:"J001", tipo:"" });
    const libre = await service.actualizar(CRIADERO, jaula.id, { codigo:"J001", tipo:"Aviario" });

    expect(vacio.success && vacio.data.jaula.tipo).toBeNull();
    expect(libre.success && libre.data.jaula.tipo).toBe("Aviario");

  });


  it("debe desactivar una jaula con activa 0 y fecha de desactivación ISO (PAR-JAU-019)", async()=>{

    const jaula = await crear("J001");

    const resultado = await service.desactivar(CRIADERO, jaula.id);

    expect(resultado).toEqual({
      success:true,
      data:{ cantidadAvesLiberadas:0 }
    });

    const despues = await service.obtener(CRIADERO, jaula.id);

    expect(despues.success).toBe(true);

    if(despues.success){
      expect(despues.data.jaula.activa).toBe(0);
      expect(despues.data.jaula.fechaDesactivacion).toBe("2026-10-30T12:00:00.000Z");
    }

  });


  it("debe devolver 0 sin escribir nada si la jaula ya estaba inactiva (PAR-JAU-023)", async()=>{

    const jaula = await crear("J001");

    await service.desactivar(CRIADERO, jaula.id);

    instante = "2026-11-01T00:00:00.000Z";

    const segunda = await service.desactivar(CRIADERO, jaula.id);

    expect(segunda).toEqual({
      success:true,
      data:{ cantidadAvesLiberadas:0 }
    });

    const despues = await service.obtener(CRIADERO, jaula.id);

    if(despues.success){
      expect(despues.data.jaula.fechaDesactivacion).toBe("2026-10-30T12:00:00.000Z");
    }

  });


  it("debe devolver JAULA_NO_ENCONTRADA al desactivar una jaula inexistente (PAR-JAU-024)", async()=>{

    const resultado = await service.desactivar(CRIADERO,"no-existe");

    expect(resultado.success).toBe(false);

    if(!resultado.success){
      expect(resultado.error).toBe("JAULA_NO_ENCONTRADA");
    }

  });


  it("debe devolver JAULA_NO_ENCONTRADA al editar una jaula inexistente", async()=>{

    const resultado = await service.actualizar(CRIADERO,"no-existe",{ codigo:"J001" });

    expect(resultado.success).toBe(false);

    if(!resultado.success){
      expect(resultado.error).toBe("JAULA_NO_ENCONTRADA");
    }

  });


  it("debe rechazar un cuerpo cuyo código no es texto (validación técnica)", async()=>{

    const sinCodigo = await service.crear(CRIADERO,{ nombre:"Sin código" });
    const numerico = await service.crear(CRIADERO,{ codigo:5 });
    const noObjeto = await service.crear(CRIADERO,"J001");

    for(const resultado of [sinCodigo, numerico, noObjeto]){

      expect(resultado.success).toBe(false);

      if(!resultado.success){
        expect(resultado.error).toBe("VALIDATION_ERROR");
      }

    }

    expect(repository.filas.length).toBe(0);

  });

});
