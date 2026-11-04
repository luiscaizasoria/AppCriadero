import { describe, it, expect, beforeEach } from "vitest";
import { SignJWT } from "jose";
import { createApp } from "../src/app";
import { createAvesRouter } from "../src/aves/aves.routes";
import { AveService, normalizarCelular, numeroNoNegativo } from "../src/aves/aves.service";
import { FakeAveRepository } from "./helpers/fake-aves.repository";


const CRIADERO = "criadero-1";

const FECHA = "2026-11-04T10:00:00.000Z";

let repository: FakeAveRepository;

let service: AveService;

let ids: number;


function ok<T>(resultado: { success: boolean }){

  expect(resultado.success).toBe(true);

  return (resultado as { success: true; data: T }).data;

}


function fallo(resultado: { success: boolean }){

  expect(resultado.success).toBe(false);

  return resultado as { success: false; error: string; message: string };

}


beforeEach(()=>{

  repository = new FakeAveRepository();

  ids = 0;

  service = new AveService(
    repository,
    () => new Date("2026-11-04T09:00:00.000Z"),
    () => `id-${++ids}`
  );

  repository.sembrarJaula(CRIADERO, "J1", "J001");
  repository.sembrarAve(CRIADERO, { id: "ave-1", codigo: "K001", jaulaActualId: "J1" });

});


describe("Bajas de aves: venta (BAJ-01 a BAJ-07)",()=>{


  it("debe registrar la venta sin envío con dos ingresos, el segundo con valor 0 (BAJ-01)", async()=>{

    const data = ok<{ id: string }>(await service.registrarVenta(CRIADERO, "ave-1", {
      fecha: FECHA,
      celular: "0991234567",
      comprador: "Juan",
      ciudadDestino: "Quito",
      valorVenta: 12.5,
      valorEnvio: null,
      detalle: ""
    }));

    const ave = repository.aves[0];

    expect(ave.estado).toBe("VENDIDA");
    expect(ave.fechaActualizacion).toBe(FECHA);
    expect(ave.jaulaActualId).toBe("J1");

    expect(repository.bajas).toHaveLength(1);
    expect(repository.bajas[0]).toMatchObject({
      id: data.id, tipo: "VENTA", valorVenta: 12.5, valorEnvio: null, causa: null, detalle: null
    });

    expect(repository.movimientos.map(m => [m.categoria, m.valor, m.detalle, m.origenTipo, m.origenId])).toEqual([
      ["VENTA_AVE", 12.5, "Venta de ave ave-1 a Juan", "VENTA_AVE", data.id],
      ["ENVIO_AVE", 0, "Envío de venta de ave ave-1 a Juan", "VENTA_AVE", data.id]
    ]);

    expect(repository.historial.at(-1)).toMatchObject({
      tipoEvento: "VENTA",
      jaulaId: null,
      detalle: "Ave vendida. Celular: 0991234567 Comprador: Juan Destino: Quito"
    });

    expect(repository.jaulaHistorial).toHaveLength(0);

  });


  it("debe guardar el envío y el detalle en el historial sin cooperativa ni importes (BAJ-02)", async()=>{

    ok(await service.registrarVenta(CRIADERO, "ave-1", {
      fecha: FECHA,
      celular: "0991234567",
      comprador: "Juan",
      ciudadDestino: "Quito",
      cooperativaEnvio: "Coop",
      valorVenta: 12.5,
      valorEnvio: 3.25,
      detalle: "Gracias"
    }));

    expect(repository.bajas[0]).toMatchObject({ valorEnvio: 3.25, cooperativaEnvio: "Coop" });
    expect(repository.movimientos[1]).toMatchObject({ categoria: "ENVIO_AVE", valor: 3.25 });
    expect(repository.historial.at(-1)!.detalle)
      .toBe("Ave vendida. Celular: 0991234567 Comprador: Juan Destino: Quito Gracias");

  });


  it("debe registrar sin valores ni comprador con NULL y movimientos en 0 (BAJ-03)", async()=>{

    ok(await service.registrarVenta(CRIADERO, "ave-1", {
      fecha: FECHA, celular: "0991234567", valorVenta: null, valorEnvio: null, comprador: ""
    }));

    expect(repository.bajas[0]).toMatchObject({ valorVenta: null, valorEnvio: null, comprador: null });
    expect(repository.movimientos.map(m => [m.valor, m.detalle])).toEqual([
      [0, "Venta de ave ave-1"],
      [0, "Envío de venta de ave ave-1"]
    ]);
    expect(repository.historial.at(-1)!.detalle).toBe("Ave vendida. Celular: 0991234567");

  });


  it("debe conservar el valor de venta 0 como 0 y no como NULL (BAJ-04)", async()=>{

    ok(await service.registrarVenta(CRIADERO, "ave-1", { fecha: FECHA, celular: "0991234567", valorVenta: 0 }));

    expect(repository.bajas[0].valorVenta).toBe(0);
    expect(repository.movimientos[0].valor).toBe(0);

  });


  it("debe normalizar el celular como V1 (BAJ-05)", async()=>{

    expect(normalizarCelular("+593 99 123 4567")).toBe("0991234567");
    expect(normalizarCelular("593991234567")).toBe("0991234567");
    expect(normalizarCelular("991234567")).toBe("0991234567");
    expect(normalizarCelular("12345")).toBe("12345");
    expect(normalizarCelular(null)).toBe("");

    ok(await service.registrarVenta(CRIADERO, "ave-1", { fecha: FECHA, celular: "12345" }));

    expect(repository.bajas[0].celular).toBe("12345");

  });


  it("debe rechazar el celular vacío o sin dígitos sin escribir nada (BAJ-06)", async()=>{

    for(const celular of ["", "abc", null, undefined]){

      const resultado = fallo(await service.registrarVenta(CRIADERO, "ave-1", { fecha: FECHA, celular }));

      expect(resultado.error).toBe("CELULAR_COMPRADOR_REQUERIDO");

    }

    expect(repository.aves[0].estado).toBe("ACTIVA");
    expect(repository.bajas).toHaveLength(0);
    expect(repository.movimientos).toHaveLength(0);

  });


  it("debe guardar NULL y mover 0 si el valor es negativo o texto, sin error (BAJ-07)", async()=>{

    expect(numeroNoNegativo(-1)).toBeNull();
    expect(numeroNoNegativo("abc")).toBeNull();
    expect(numeroNoNegativo("  ")).toBeNull();
    expect(numeroNoNegativo("4.5")).toBe(4.5);

    ok(await service.registrarVenta(CRIADERO, "ave-1", {
      fecha: FECHA, celular: "0991234567", valorVenta: -1, valorEnvio: "abc"
    }));

    expect(repository.bajas[0]).toMatchObject({ valorVenta: null, valorEnvio: null });
    expect(repository.movimientos.map(m => m.valor)).toEqual([0, 0]);

  });


  it("debe usar la hora del servidor si el cliente no envía fecha", async()=>{

    ok(await service.registrarVenta(CRIADERO, "ave-1", { celular: "0991234567" }));

    expect(repository.bajas[0].fecha).toBe("2026-11-04T09:00:00.000Z");

  });


});


describe("Bajas de aves: muerte (BAJ-08 a BAJ-11)",()=>{


  it("debe registrar la muerte sin movimientos financieros ni jaula_historial (BAJ-08)", async()=>{

    const data = ok<{ id: string }>(await service.registrarMuerte(CRIADERO, "ave-1", {
      fecha: FECHA, causa: "Enfermedad", detalle: ""
    }));

    expect(repository.aves[0]).toMatchObject({ estado: "FALLECIDA", fechaActualizacion: FECHA, jaulaActualId: "J1" });
    expect(repository.bajas[0]).toMatchObject({
      id: data.id, tipo: "MUERTE", causa: "Enfermedad", detalle: null, celular: null, valorVenta: null
    });
    expect(repository.historial.at(-1)).toMatchObject({
      tipoEvento: "MUERTE", jaulaId: null, detalle: "Ave dada de baja por fallecimiento."
    });
    expect(repository.movimientos).toHaveLength(0);
    expect(repository.jaulaHistorial).toHaveLength(0);

  });


  it("debe poner el detalle en la baja y en el historial sin la causa (BAJ-09)", async()=>{

    ok(await service.registrarMuerte(CRIADERO, "ave-1", { fecha: FECHA, causa: "Accidente", detalle: "Aplastada" }));

    expect(repository.bajas[0].detalle).toBe("Aplastada");
    expect(repository.historial.at(-1)!.detalle).toBe("Aplastada");

  });


  it("debe escribir otra baja aunque el ave ya esté vendida, sin rechazo por estado (BAJ-10)", async()=>{

    ok(await service.registrarVenta(CRIADERO, "ave-1", { fecha: FECHA, celular: "0991234567" }));
    ok(await service.registrarMuerte(CRIADERO, "ave-1", { fecha: FECHA, causa: "X" }));
    ok(await service.registrarVenta(CRIADERO, "ave-1", { fecha: FECHA, celular: "0991234567" }));

    expect(repository.bajas).toHaveLength(3);
    expect(repository.movimientos).toHaveLength(4);

  });


  it("debe responder AVE_NO_ENCONTRADA sin escribir si el ave no está en el criadero (BAJ-11)", async()=>{

    repository.sembrarAve("criadero-2", { id: "ave-ajena", codigo: "X1" });

    for(const aveId of ["no-existe", "ave-ajena"]){

      expect(fallo(await service.registrarMuerte(CRIADERO, aveId, { fecha: FECHA })).error).toBe("AVE_NO_ENCONTRADA");
      expect(fallo(await service.registrarVenta(CRIADERO, aveId, { fecha: FECHA, celular: "0991234567" })).error)
        .toBe("AVE_NO_ENCONTRADA");

    }

    expect(repository.bajas).toHaveLength(0);
    expect(repository.aves.find(a => a.id === "ave-ajena")!.estado).toBe("ACTIVA");

  });


  it("debe rechazar tipos incorrectos del cuerpo con VALIDATION_ERROR", async()=>{

    expect(fallo(await service.registrarMuerte(CRIADERO, "ave-1", "x")).error).toBe("VALIDATION_ERROR");
    expect(fallo(await service.registrarMuerte(CRIADERO, "ave-1", { causa: 5 })).error).toBe("VALIDATION_ERROR");
    expect(fallo(await service.registrarVenta(CRIADERO, "ave-1", { celular: "099", fecha: 1 })).error)
      .toBe("VALIDATION_ERROR");
    expect(fallo(await service.registrarVenta(CRIADERO, "ave-1", { celular: {} })).error).toBe("VALIDATION_ERROR");

  });


});


describe("Bajas de aves: lecturas (BAJ-14, BAJ-15)",()=>{


  it("debe listar las bajas del ave por fecha descendente y [] si no hay (BAJ-15)", async()=>{

    expect(ok<{ bajas: unknown[] }>(await service.listarBajasAve(CRIADERO, "ave-1")).bajas).toEqual([]);
    expect(ok<{ bajas: unknown[] }>(await service.listarBajasAve(CRIADERO, "no-existe")).bajas).toEqual([]);

    ok(await service.registrarVenta(CRIADERO, "ave-1", {
      fecha: "2026-11-01T00:00:00.000Z", celular: "0991234567", valorVenta: 12.5, valorEnvio: 3.25
    }));
    ok(await service.registrarMuerte(CRIADERO, "ave-1", { fecha: "2026-11-02T00:00:00.000Z", causa: "Frío" }));

    const { bajas } = ok<{ bajas: Array<{ tipo: string; valorVenta: number | null }> }>(
      await service.listarBajasAve(CRIADERO, "ave-1")
    );

    expect(bajas.map(b => b.tipo)).toEqual(["MUERTE", "VENTA"]);
    expect(bajas[1].valorVenta).toBe(12.5);

  });


  it("debe listar vendidas con los campos de la venta y solo las aves con baja (BAJ-14)", async()=>{

    repository.sembrarAve(CRIADERO, { id: "ave-2", codigo: "K002" });
    repository.sembrarAve(CRIADERO, { id: "ave-3", codigo: "K003", estado: "FALLECIDA" });

    ok(await service.registrarVenta(CRIADERO, "ave-1", {
      fecha: FECHA, celular: "0991234567", comprador: "Juan", valorVenta: 12.5
    }));
    ok(await service.registrarMuerte(CRIADERO, "ave-2", { fecha: FECHA, causa: "Frío" }));

    const vendidas = ok<{ aves: Array<Record<string, unknown>> }>(await service.listar(CRIADERO, "VENDIDA")).aves;
    const fallecidas = ok<{ aves: Array<Record<string, unknown>> }>(await service.listar(CRIADERO, "FALLECIDA")).aves;

    expect(vendidas).toHaveLength(1);
    expect(vendidas[0]).toMatchObject({ codigo: "K001", fechaVenta: FECHA, comprador: "Juan", valorVenta: 12.5 });

    expect(fallecidas.map(a => a.codigo)).toEqual(["K002"]);
    expect(fallecidas[0]).toMatchObject({ fechaFallecimiento: FECHA, causa: "Frío" });

  });


});


// ---- HTTP ----

const jwtSecret = "secret-test-key";

async function llamar(app: ReturnType<typeof createApp>, path: string, metodo = "GET", cuerpo?: unknown){

  const jwt = await new SignJWT({ email: "test@test.com" })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject("propietario")
    .setIssuedAt()
    .setExpirationTime("1h")
    .sign(new TextEncoder().encode(jwtSecret));

  return app.request(
    path,
    {
      method: metodo,
      headers: { Authorization: `Bearer ${jwt}`, "Content-Type": "application/json" },
      body: cuerpo === undefined ? undefined : typeof cuerpo === "string" ? cuerpo : JSON.stringify(cuerpo)
    },
    { JWT_SECRET: jwtSecret }
  );

}


describe("HTTP bajas de aves",()=>{


  let app: ReturnType<typeof createApp>;

  const BASE = `/api/v1/criaderos/${CRIADERO}/aves/ave-1`;


  beforeEach(()=>{

    const router = createAvesRouter(()=>({
      service,
      userOwnsCriadero: async(userId, criaderoId) => userId === "propietario" && criaderoId === CRIADERO
    }));

    app = createApp({ avesRouter: router });

  });


  it("debe responder 201 con el id de la baja al registrar venta y muerte", async()=>{

    const venta = await llamar(app, `${BASE}/venta`, "POST", { fecha: FECHA, celular: "0991234567" });

    expect(venta.status).toBe(201);
    expect((await venta.json()).data.id).toBeTruthy();

    const muerte = await llamar(app, `${BASE}/muerte`, "POST", { fecha: FECHA, causa: "Frío" });

    expect(muerte.status).toBe(201);

  });


  it("debe responder 400 CELULAR_COMPRADOR_REQUERIDO sin escribir nada", async()=>{

    const respuesta = await llamar(app, `${BASE}/venta`, "POST", { fecha: FECHA, celular: "" });

    expect(respuesta.status).toBe(400);
    expect((await respuesta.json()).error).toBe("CELULAR_COMPRADOR_REQUERIDO");
    expect(repository.bajas).toHaveLength(0);

  });


  it("debe responder 404 AVE_NO_ENCONTRADA y 400 si el cuerpo no es JSON", async()=>{

    const noExiste = await llamar(app, `/api/v1/criaderos/${CRIADERO}/aves/zzz/muerte`, "POST", { fecha: FECHA });

    expect(noExiste.status).toBe(404);
    expect((await noExiste.json()).error).toBe("AVE_NO_ENCONTRADA");
    expect((await llamar(app, `${BASE}/venta`, "POST", "{no")).status).toBe(400);

  });


  it("debe responder 403 si el usuario no es propietario del criadero", async()=>{

    const respuesta = await llamar(app, `/api/v1/criaderos/otro/aves/ave-1/bajas`);

    expect(respuesta.status).toBe(403);

  });


  it("debe responder 200 con bajas [] y luego con la baja registrada", async()=>{

    const vacia = await llamar(app, `${BASE}/bajas`);

    expect(vacia.status).toBe(200);
    expect((await vacia.json()).data).toEqual({ bajas: [] });

    await llamar(app, `${BASE}/venta`, "POST", { fecha: FECHA, celular: "991234567", valorVenta: 12.5 });

    const bajas = (await (await llamar(app, `${BASE}/bajas`)).json()).data.bajas;

    expect(bajas).toHaveLength(1);
    expect(bajas[0]).toMatchObject({ tipo: "VENTA", celular: "0991234567", valorVenta: 12.5, valorEnvio: null });

  });


});
