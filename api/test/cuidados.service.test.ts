import { describe, it, expect, beforeEach } from "vitest";
import { CuidadosService, normalizarEstado } from "../src/cuidados/cuidados.service";
import { FakeCuidadosRepository } from "./helpers/fake-cuidados.repository";


const CRIADERO = "criadero-1";

let repository: FakeCuidadosRepository;

let service: CuidadosService;

let ids: number;


beforeEach(()=>{

  repository = new FakeCuidadosRepository();

  repository.sembrarJaula(CRIADERO, "jaula-1");
  repository.sembrarJaula("criadero-2", "jaula-ajena");
  repository.sembrarJaula(CRIADERO, "jaula-inactiva", 0);

  ids = 0;

  service = new CuidadosService(repository, () => `id-${++ids}`);

});


describe("Cuidados de jaula - alimentación y bebida",()=>{


  it("debe registrar alimentación con su fila de historial", async()=>{

    const r = await service.crearAlimentacion(CRIADERO,"jaula-1",{ tipo:"Maíz", cantidad:"50 g", detalle:"x", fecha:"2026-10-30" });

    expect(r).toEqual({ success:true, data:{ registro:{ id:"id-1", jaulaId:"jaula-1", fecha:"2026-10-30", tipo:"Maíz", cantidad:"50 g", detalle:"x" } } });
    expect(repository.historial).toEqual([
      { id:"id-2", criaderoId:CRIADERO, jaulaId:"jaula-1", aveId:null, tipoEvento:"ALIMENTACION", fecha:"2026-10-30", detalle:"Alimentación: Maíz" }
    ]);

  });


  it("debe registrar bebida con el texto de historial Bebida: tipo", async()=>{

    await service.crearBebida(CRIADERO,"jaula-1",{ tipo:"Agua", fecha:"2026-10-30", detalle:"limpia" });

    expect(repository.bebida).toHaveLength(1);
    expect(repository.historial[0].tipoEvento).toBe("BEBIDA");
    expect(repository.historial[0].detalle).toBe("Bebida: Agua");

  });


  it("debe guardar NULL cuando cantidad y detalle son falsy", async()=>{

    for(const valor of ["", 0, false, null, undefined]){
      await service.crearAlimentacion(CRIADERO,"jaula-1",{ tipo:"T", fecha:"f", cantidad:valor, detalle:valor });
    }

    expect(repository.alimentacion.every(r => r.cantidad===null && r.detalle===null)).toBe(true);

  });


  it("debe aceptar cadena vacía en fecha y tipo y no recortar espacios", async()=>{

    const vacio = await service.crearAlimentacion(CRIADERO,"jaula-1",{ tipo:"", fecha:"" });
    const espacios = await service.crearBebida(CRIADERO,"jaula-1",{ tipo:"  Agua ", fecha:" 2026 ", detalle:" d " });

    expect(vacio.success).toBe(true);
    expect(espacios.success && espacios.data.registro).toMatchObject({ tipo:"  Agua ", fecha:" 2026 ", detalle:" d " });

  });


  it("debe aceptar fecha futura, tipo fuera de catálogo y jaula inactiva", async()=>{

    const futura = await service.crearAlimentacion(CRIADERO,"jaula-1",{ tipo:"Inventado", fecha:"2999-01-01" });
    const inactiva = await service.crearBebida(CRIADERO,"jaula-inactiva",{ tipo:"Agua", fecha:"no-es-fecha" });

    expect(futura.success).toBe(true);
    expect(inactiva.success).toBe(true);

  });


  it("debe responder JAULA_NO_ENCONTRADA si la jaula no existe o es de otro criadero", async()=>{

    const inexistente = await service.crearAlimentacion(CRIADERO,"nada",{ tipo:"T", fecha:"f" });
    const ajena = await service.crearBebida(CRIADERO,"jaula-ajena",{ tipo:"T", fecha:"f" });

    expect(inexistente).toMatchObject({ success:false, error:"JAULA_NO_ENCONTRADA" });
    expect(ajena).toMatchObject({ success:false, error:"JAULA_NO_ENCONTRADA" });
    expect(repository.alimentacion).toHaveLength(0);
    expect(repository.bebida).toHaveLength(0);
    expect(repository.historial).toHaveLength(0);

  });


  it("debe rechazar un cuerpo que no es objeto", async()=>{

    for(const cuerpo of [null, "x", 3, []]){
      const r = await service.crearAlimentacion(CRIADERO,"jaula-1",cuerpo);
      expect(r).toMatchObject({ success:false, error:"VALIDATION_ERROR" });
    }

  });


  it("debe informar NOT NULL de fecha antes que el de tipo", async()=>{

    const ambos = await service.crearAlimentacion(CRIADERO,"jaula-1",{});
    const soloTipo = await service.crearAlimentacion(CRIADERO,"jaula-1",{ fecha:"f", tipo:null });
    const bebida = await service.crearBebida(CRIADERO,"jaula-1",{ tipo:"T" });

    expect(ambos).toMatchObject({ error:"VALIDATION_ERROR", message:"NOT NULL constraint failed: alimentacion_jaula.fecha" });
    expect(soloTipo).toMatchObject({ message:"NOT NULL constraint failed: alimentacion_jaula.tipo" });
    expect(bebida).toMatchObject({ message:"NOT NULL constraint failed: bebida_jaula.fecha" });

  });


  it("debe rechazar objetos y arreglos como valores (validación técnica)", async()=>{

    const a = await service.crearAlimentacion(CRIADERO,"jaula-1",{ tipo:{}, fecha:"f" });
    const b = await service.crearAlimentacion(CRIADERO,"jaula-1",{ tipo:"T", fecha:"f", detalle:[] });

    expect(a).toMatchObject({ success:false, error:"VALIDATION_ERROR" });
    expect(b).toMatchObject({ success:false, error:"VALIDATION_ERROR" });

  });


  it("debe listar la alimentación ordenada por fecha e id descendentes", async()=>{

    await service.crearAlimentacion(CRIADERO,"jaula-1",{ tipo:"A", fecha:"2026-10-01" });
    await service.crearAlimentacion(CRIADERO,"jaula-1",{ tipo:"B", fecha:"2026-10-02" });
    await service.crearAlimentacion(CRIADERO,"jaula-1",{ tipo:"C", fecha:"2026-10-02" });
    await service.crearAlimentacion(CRIADERO,"jaula-ajena",{ tipo:"Z", fecha:"2026-10-09" });

    const r = await service.listarAlimentacion(CRIADERO,"jaula-1");

    expect(r.success && r.data.registros.map(x => x.tipo)).toEqual(["C","B","A"]);
    expect(r.success && r.data.registros[0].fechaCreacion).toBeTruthy();

  });

});


describe("Cuidados de jaula - sanidad",()=>{


  const TIPOS = ["Normal","Limpieza","Fumigación","Quemadura","Cuarentena"];

  const ESTADOS = ["NORMAL","LIMPIEZA","FUMIGACION","QUEMADURA","CUARENTENA"];


  it("debe normalizar el estado con comparación estricta", ()=>{

    TIPOS.forEach((tipo,i) => expect(normalizarEstado(tipo)).toBe(ESTADOS[i]));
    expect(normalizarEstado("FUMIGACION")).toBe("NORMAL");
    expect(normalizarEstado("cuarentena")).toBe("NORMAL");
    expect(normalizarEstado("Fumigacion")).toBe("NORMAL");
    expect(normalizarEstado("Otro")).toBe("NORMAL");

  });


  // Tabla 5x5: de cualquier estado previo a cualquier tipo, sin restricción de transición.
  for(const previo of ESTADOS){
    for(let i=0; i<TIPOS.length; i++){
      it(`debe pasar de ${previo} a ${ESTADOS[i]} con tipo ${TIPOS[i]}`, async()=>{

        repository.jaulas.find(j => j.id==="jaula-1")!.estadoSanitario = previo;

        const r = await service.crearSanidad(CRIADERO,"jaula-1",{ tipo:TIPOS[i], fecha:"2026-10-30" });

        expect(r.success && r.data.jaula).toEqual({ id:"jaula-1", estadoSanitario:ESTADOS[i] });
        expect(repository.jaulas.find(j => j.id==="jaula-1")!.estadoSanitario).toBe(ESTADOS[i]);

      });
    }
  }


  it("debe guardar el texto recibido y dejar NORMAL con un tipo desconocido", async()=>{

    repository.jaulas.find(j => j.id==="jaula-1")!.estadoSanitario = "CUARENTENA";

    const r = await service.crearSanidad(CRIADERO,"jaula-1",{ tipo:"FUMIGACION", fecha:"f" });

    expect(r.success && r.data.registro).toEqual({ id:"id-1", jaulaId:"jaula-1", fecha:"f", tipo:"FUMIGACION", detalle:null });
    expect(r.success && r.data.registro).not.toHaveProperty("cantidad");
    expect(repository.sanidad[0].tipo).toBe("FUMIGACION");
    expect(repository.jaulas[0].estadoSanitario).toBe("NORMAL");

  });


  it("debe escribir el historial de sanidad con y sin detalle", async()=>{

    await service.crearSanidad(CRIADERO,"jaula-1",{ tipo:"Limpieza", fecha:"f" });
    await service.crearSanidad(CRIADERO,"jaula-1",{ tipo:"Limpieza", fecha:"f", detalle:"con cal" });
    await service.crearSanidad(CRIADERO,"jaula-1",{ tipo:"Limpieza", fecha:"f", detalle:"" });

    expect(repository.historial.map(h => h.detalle)).toEqual([
      "Sanidad: Limpieza",
      "Sanidad: Limpieza | con cal",
      "Sanidad: Limpieza"
    ]);
    expect(repository.historial.every(h => h.tipoEvento==="SANIDAD")).toBe(true);

  });


  it("debe usar la tabla sanidad_jaula en los mensajes NOT NULL y no tocar la jaula si falla", async()=>{

    const a = await service.crearSanidad(CRIADERO,"jaula-1",{ tipo:"Limpieza" });
    const b = await service.crearSanidad(CRIADERO,"jaula-1",{ fecha:"f" });

    expect(a).toMatchObject({ message:"NOT NULL constraint failed: sanidad_jaula.fecha" });
    expect(b).toMatchObject({ message:"NOT NULL constraint failed: sanidad_jaula.tipo" });
    expect(repository.jaulas[0].estadoSanitario).toBe("NORMAL");

  });


  it("debe aceptar sanidad en jaula inactiva y rechazar la de otro criadero", async()=>{

    const inactiva = await service.crearSanidad(CRIADERO,"jaula-inactiva",{ tipo:"Quemadura", fecha:"f" });
    const ajena = await service.crearSanidad(CRIADERO,"jaula-ajena",{ tipo:"Quemadura", fecha:"f" });

    expect(inactiva.success).toBe(true);
    expect(ajena).toMatchObject({ success:false, error:"JAULA_NO_ENCONTRADA" });
    expect(repository.jaulas.find(j => j.id==="jaula-ajena")!.estadoSanitario).toBe("NORMAL");

  });

});
