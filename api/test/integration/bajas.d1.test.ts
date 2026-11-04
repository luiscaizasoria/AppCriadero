import { describe, it, expect, beforeAll } from "vitest";
import { AuthService } from "../../src/auth/auth.service";
import { D1AuthRepository } from "../../src/auth/auth.repository";
import { CriaderoService } from "../../src/criaderos/criaderos.service";
import { D1CriaderoRepository } from "../../src/criaderos/criaderos.repository";
import { D1AveRepository } from "../../src/aves/aves.repository";
import { AveService } from "../../src/aves/aves.service";
import { LocalD1Adapter } from "../helpers/local-d1.adapter";


const db = new LocalD1Adapter();

const jwtSecret = "integration-secret-key";

const FECHA = "2026-11-04T10:00:00.000Z";


async function crearCriadero(email: string){

  const auth = new AuthService(new D1AuthRepository(db as any), jwtSecret);

  const usuario = await auth.register({ email, nombre: "Usuario Bajas", password: "Password123!" });

  if(!usuario.success){
    throw new Error("No se pudo registrar el usuario de prueba");
  }

  const criaderos = new CriaderoService(new D1CriaderoRepository(db as any));

  const criadero = await criaderos.createCriadero(usuario.data.user.id, {
    nombre: "Criadero Bajas",
    pais: "Ecuador",
    provincia: "Pichincha",
    ciudad: "Quito",
    telefono: "0999999999",
    correoContacto: email
  });

  if(!criadero.success){
    throw new Error("No se pudo crear el criadero de prueba");
  }

  return criadero.data.id;

}


async function filas<T = any>(sql: string, ...params: unknown[]): Promise<T[]>{

  const resultado = await db.prepare(sql).bind(...params).all();

  return resultado.results as T[];

}


describe("Bajas D1 local (SQLite en memoria)",()=>{


  let criaderoA: string;

  let criaderoB: string;

  const aves = new AveService(new D1AveRepository(db as any), () => new Date(FECHA));


  async function crearAve(criadero: string, codigo: string){

    const resultado = await aves.crear(criadero, { codigo, origen: "NACIDA_CRIADERO" });

    if(!resultado.success){
      throw new Error(`No se pudo crear ${codigo}: ${resultado.error}`);
    }

    return resultado.data.ave;

  }


  async function ave(id: string){

    return (await filas("SELECT estado, fecha_actualizacion, jaula_actual_id FROM aves WHERE id = ?", id))[0];

  }


  beforeAll(async()=>{

    criaderoA = await crearCriadero("bajas.a@test.com");

    criaderoB = await crearCriadero("bajas.b@test.com");

  });


  it("debe registrar la venta con 2 ingresos REAL, origen_id de la baja e historial (BAJ-01, BAJ-02)", async()=>{

    const a = await crearAve(criaderoA, "BV1");

    const resultado = await aves.registrarVenta(criaderoA, a.id, {
      fecha: FECHA,
      celular: "+593 99 123 4567",
      comprador: "Juan",
      ciudadDestino: "Quito",
      cooperativaEnvio: "Coop",
      valorVenta: 12.5,
      valorEnvio: 3.25,
      detalle: "Gracias"
    });

    expect(resultado.success).toBe(true);

    const bajaId = resultado.success ? resultado.data.id : "";

    expect(await ave(a.id)).toMatchObject({ estado: "VENDIDA", fecha_actualizacion: FECHA });

    const bajas = await filas("SELECT * FROM bajas_ave WHERE ave_id = ?", a.id);

    expect(bajas).toHaveLength(1);
    expect(bajas[0]).toMatchObject({
      id: bajaId, criadero_id: criaderoA, tipo: "VENTA", celular: "0991234567",
      cooperativa_envio: "Coop", comprador: "Juan", valor_venta: 12.5, valor_envio: 3.25,
      causa: null, detalle: "Gracias"
    });

    const movs = await filas(
      "SELECT categoria, tipo, valor, detalle, origen_tipo, origen_id, ave_id FROM movimientos_financieros WHERE ave_id = ? ORDER BY categoria DESC",
      a.id
    );

    expect(movs).toEqual([
      { categoria: "VENTA_AVE", tipo: "INGRESO", valor: 12.5, detalle: `Venta de ave ${a.id} a Juan`, origen_tipo: "VENTA_AVE", origen_id: bajaId, ave_id: a.id },
      { categoria: "ENVIO_AVE", tipo: "INGRESO", valor: 3.25, detalle: `Envío de venta de ave ${a.id} a Juan`, origen_tipo: "VENTA_AVE", origen_id: bajaId, ave_id: a.id }
    ]);

    const hist = await filas("SELECT jaula_id, detalle FROM ave_historial WHERE ave_id = ? AND tipo_evento = 'VENTA'", a.id);

    expect(hist).toEqual([{
      jaula_id: null,
      detalle: "Ave vendida. Celular: 0991234567 Comprador: Juan Destino: Quito Gracias"
    }]);

  });


  it("debe guardar NULL en importes ausentes y 0 en los movimientos, y conservar el 0 (BAJ-03, BAJ-04, BAJ-07)", async()=>{

    const a = await crearAve(criaderoA, "BV2");
    const b = await crearAve(criaderoA, "BV3");
    const c = await crearAve(criaderoA, "BV4");

    await aves.registrarVenta(criaderoA, a.id, { fecha: FECHA, celular: "991234567", valorVenta: null, comprador: "" });
    await aves.registrarVenta(criaderoA, b.id, { fecha: FECHA, celular: "991234567", valorVenta: 0 });
    await aves.registrarVenta(criaderoA, c.id, { fecha: FECHA, celular: "991234567", valorVenta: -1, valorEnvio: "abc" });

    const bajas = await filas(
      "SELECT ave_id, valor_venta, valor_envio, comprador FROM bajas_ave WHERE ave_id IN (?, ?, ?)", a.id, b.id, c.id
    );
    const porAve = (id: string) => bajas.find(x => x.ave_id === id);

    expect(porAve(a.id)).toMatchObject({ valor_venta: null, valor_envio: null, comprador: null });
    expect(porAve(b.id)).toMatchObject({ valor_venta: 0, valor_envio: null });
    expect(porAve(c.id)).toMatchObject({ valor_venta: null, valor_envio: null });

    const movs = await filas(
      "SELECT valor, detalle FROM movimientos_financieros WHERE ave_id = ? ORDER BY categoria DESC", a.id
    );

    expect(movs).toEqual([
      { valor: 0, detalle: `Venta de ave ${a.id}` },
      { valor: 0, detalle: `Envío de venta de ave ${a.id}` }
    ]);

  });


  it("debe rechazar el celular vacío sin escribir nada (BAJ-06)", async()=>{

    const a = await crearAve(criaderoA, "BV5");

    const resultado = await aves.registrarVenta(criaderoA, a.id, { fecha: FECHA, celular: "abc" });

    expect(!resultado.success && resultado.error).toBe("CELULAR_COMPRADOR_REQUERIDO");
    expect((await ave(a.id)).estado).toBe("ACTIVA");
    expect(await filas("SELECT id FROM bajas_ave WHERE ave_id = ?", a.id)).toHaveLength(0);
    expect(await filas("SELECT id FROM movimientos_financieros WHERE ave_id = ?", a.id)).toHaveLength(0);

  });


  it("debe registrar la muerte sin tocar jaula ni finanzas (BAJ-08, BAJ-09)", async()=>{

    const a = await crearAve(criaderoA, "BM1");
    const b = await crearAve(criaderoA, "BM2");

    await aves.registrarMuerte(criaderoA, a.id, { fecha: FECHA, causa: "Enfermedad", detalle: "" });
    await aves.registrarMuerte(criaderoA, b.id, { fecha: FECHA, causa: "Frío", detalle: "Aplastada" });

    expect(await ave(a.id)).toMatchObject({ estado: "FALLECIDA", fecha_actualizacion: FECHA });

    const bajas = await filas("SELECT tipo, causa, detalle, celular, valor_venta FROM bajas_ave WHERE ave_id = ?", a.id);

    expect(bajas).toEqual([{ tipo: "MUERTE", causa: "Enfermedad", detalle: null, celular: null, valor_venta: null }]);

    const hist = await filas("SELECT jaula_id, detalle FROM ave_historial WHERE ave_id IN (?, ?) AND tipo_evento = 'MUERTE' ORDER BY detalle", a.id, b.id);

    expect(hist).toEqual([
      { jaula_id: null, detalle: "Aplastada" },
      { jaula_id: null, detalle: "Ave dada de baja por fallecimiento." }
    ]);
    expect(await filas("SELECT id FROM movimientos_financieros WHERE ave_id = ?", a.id)).toHaveLength(0);

  });


  it("debe permitir una segunda baja sobre un ave ya vendida (BAJ-10)", async()=>{

    const a = await crearAve(criaderoA, "BD1");

    await aves.registrarVenta(criaderoA, a.id, { fecha: FECHA, celular: "0991234567" });
    await aves.registrarMuerte(criaderoA, a.id, { fecha: FECHA });

    expect((await ave(a.id)).estado).toBe("FALLECIDA");
    expect(await filas("SELECT id FROM bajas_ave WHERE ave_id = ?", a.id)).toHaveLength(2);

  });


  it("debe responder AVE_NO_ENCONTRADA para un ave inexistente o de otro criadero sin escribir (BAJ-11)", async()=>{

    const ajena = await crearAve(criaderoB, "BX1");

    const r1 = await aves.registrarMuerte(criaderoA, "no-existe", { fecha: FECHA });
    const r2 = await aves.registrarVenta(criaderoA, ajena.id, { fecha: FECHA, celular: "0991234567" });

    expect(!r1.success && r1.error).toBe("AVE_NO_ENCONTRADA");
    expect(!r2.success && r2.error).toBe("AVE_NO_ENCONTRADA");
    expect((await ave(ajena.id)).estado).toBe("ACTIVA");
    expect(await filas("SELECT id FROM bajas_ave WHERE ave_id = ?", ajena.id)).toHaveLength(0);

  });


  it("debe revertir todo si falla una escritura del batch (BAJ-12)", async()=>{

    const a = await crearAve(criaderoA, "BF1");
    const repo = new D1AveRepository(db as any);

    // ingresoEnvioId repetido: la 4ª sentencia viola la PK y el batch se revierte.
    await expect(repo.registrarVenta(criaderoA, {
      aveId: a.id, bajaId: "baja-f1", ingresoVentaId: "mov-repetido", ingresoEnvioId: "mov-repetido",
      historialId: "hist-f1", fecha: FECHA, celular: "0991234567", ciudadDestino: null,
      cooperativaEnvio: null, comprador: null, valorVenta: 1, valorEnvio: null, detalle: null,
      detalleVenta: "x", detalleEnvio: "y", detalleHistorial: "z"
    })).rejects.toThrow();

    expect((await ave(a.id)).estado).toBe("ACTIVA");
    expect(await filas("SELECT id FROM bajas_ave WHERE id = 'baja-f1'")).toHaveLength(0);
    expect(await filas("SELECT id FROM movimientos_financieros WHERE id = 'mov-repetido'")).toHaveLength(0);

  });


  it("debe listar vendidas y fallecidas con INNER JOIN, fecha DESC y campos de baja (BAJ-14)", async()=>{

    const criadero = await crearCriadero("bajas.lista@test.com");

    const v1 = await crearAve(criadero, "LV1");
    const v2 = await crearAve(criadero, "LV2");
    const m1 = await crearAve(criadero, "LM1");
    const sinBaja = await crearAve(criadero, "LS1");

    await aves.registrarVenta(criadero, v1.id, { fecha: "2026-11-01T00:00:00.000Z", celular: "0991234567", comprador: "Ana", valorVenta: 12.5, valorEnvio: 3.25 });
    await aves.registrarVenta(criadero, v2.id, { fecha: "2026-11-03T00:00:00.000Z", celular: "0991234567" });
    await aves.registrarMuerte(criadero, m1.id, { fecha: "2026-11-02T00:00:00.000Z", causa: "Frío" });

    await db.prepare("UPDATE aves SET estado = 'VENDIDA' WHERE id = ?").bind(sinBaja.id).run();

    const vendidas = await aves.listar(criadero, "VENDIDA");
    const fallecidas = await aves.listar(criadero, "FALLECIDA");

    expect(vendidas.success && vendidas.data.aves.map(x => x.codigo)).toEqual(["LV2", "LV1"]);

    if(vendidas.success){
      expect(vendidas.data.aves[1]).toMatchObject({
        fechaVenta: "2026-11-01T00:00:00.000Z", celular: "0991234567", comprador: "Ana",
        valorVenta: 12.5, valorEnvio: 3.25
      });
    }

    if(fallecidas.success){
      expect(fallecidas.data.aves).toHaveLength(1);
      expect(fallecidas.data.aves[0]).toMatchObject({ codigo: "LM1", fechaFallecimiento: "2026-11-02T00:00:00.000Z", causa: "Frío" });
    }

  });


  it("debe devolver las bajas del ave, más reciente primero, y [] si no hay (BAJ-15)", async()=>{

    const a = await crearAve(criaderoA, "BL1");

    const vacio = await aves.listarBajasAve(criaderoA, a.id);

    expect(vacio.success && vacio.data.bajas).toEqual([]);

    await aves.registrarVenta(criaderoA, a.id, { fecha: "2026-11-01T00:00:00.000Z", celular: "0991234567", valorVenta: 12.5, valorEnvio: 3.25, ciudadDestino: "Quito" });
    await aves.registrarMuerte(criaderoA, a.id, { fecha: "2026-11-02T00:00:00.000Z", causa: "Frío" });

    const lista = await aves.listarBajasAve(criaderoA, a.id);

    expect(lista.success && lista.data.bajas.map(b => b.tipo)).toEqual(["MUERTE", "VENTA"]);

    if(lista.success){
      expect(lista.data.bajas[1]).toMatchObject({
        valorVenta: 12.5, valorEnvio: 3.25, ciudadDestino: "Quito", cooperativaEnvio: null, causa: null
      });
    }

    const deOtro = await aves.listarBajasAve(criaderoB, a.id);

    expect(deOtro.success && deOtro.data.bajas).toEqual([]);

  });


});
