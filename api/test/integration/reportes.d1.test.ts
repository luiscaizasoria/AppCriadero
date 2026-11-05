import { describe, it, expect, beforeAll } from "vitest";
import { SignJWT } from "jose";
import { AuthService } from "../../src/auth/auth.service";
import { D1AuthRepository } from "../../src/auth/auth.repository";
import { CriaderoService } from "../../src/criaderos/criaderos.service";
import { D1CriaderoRepository } from "../../src/criaderos/criaderos.repository";
import { createApp } from "../../src/app";
import { createReportesRouter } from "../../src/reportes/reportes.routes";
import { createReportesDependencies } from "../../src/reportes/reportes.factory";
import { LocalD1Adapter } from "../helpers/local-d1.adapter";

const db = new LocalD1Adapter();
const jwtSecret = "integration-secret-key";
const AHORA = "2026-11-05T15:00:00.000Z";

/** Envuelve el adaptador y cuenta cada llamada a D1 (all / first / run). */
class D1Contador {
  llamadas = 0;
  batches = 0;

  prepare(sql: string) {
    const stmt = db.prepare(sql);
    return {
      bind: (...params: unknown[]) => {
        const bound: any = stmt.bind(...params);
        return {
          all: async () => { this.llamadas++; return bound.all(); },
          first: async () => { this.llamadas++; return bound.first(); },
          run: async () => { this.llamadas++; return bound.run(); },
        };
      },
    };
  }

  async batch(statements: unknown[]) {
    this.batches++;
    return db.batch(statements as any[]);
  }
}

type Cuenta = { userId: string; criaderoId: string };

async function crearUsuarioYCriadero(email: string): Promise<Cuenta> {
  const auth = new AuthService(new D1AuthRepository(db as any), jwtSecret);
  const usuario = await auth.register({ email, nombre: "Reportes", password: "Password123!" });
  if (!usuario.success) throw new Error("usuario");
  const criaderos = new CriaderoService(new D1CriaderoRepository(db as any));
  const c = await criaderos.createCriadero(usuario.data.user.id, {
    nombre: "Criadero", pais: "Ecuador", provincia: "Pichincha", ciudad: "Quito", telefono: "0999999999", correoContacto: email,
  });
  if (!c.success) throw new Error("criadero");
  return { userId: usuario.data.user.id, criaderoId: c.data.id };
}

async function token(userId: string) {
  return await new SignJWT({ email: "t@t.com" })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(userId)
    .setIssuedAt()
    .setExpirationTime("1h")
    .sign(new TextEncoder().encode(jwtSecret));
}

async function lote(statements: any[]) {
  for (let i = 0; i < statements.length; i += 400) await db.batch(statements.slice(i, i + 400));
}

const sql = (texto: string, ...p: unknown[]) => db.prepare(texto).bind(...p);

const insJaula = (c: string, id: string, codigo: string, extra: { activa?: number; fd?: string | null } = {}) =>
  sql(`INSERT INTO jaulas (id, criadero_id, codigo, nombre, activa, fecha_creacion, fecha_desactivacion) VALUES (?, ?, ?, ?, ?, ?, ?)`,
    id, c, codigo, `Jaula ${codigo}`, extra.activa ?? 1, "2026-10-01 10:00:00", extra.fd ?? null);

const insAve = (c: string, id: string, codigo: string, x: Record<string, unknown> = {}) =>
  sql(`INSERT INTO aves (id, criadero_id, codigo, origen, estado, estado_salud, sexo, padre_id, madre_id, jaula_actual_id, peso_gramos)
       VALUES (?, ?, ?, 'NACIDA_CRIADERO', ?, ?, ?, ?, ?, ?, ?)`,
    id, c, codigo, x.estado ?? "ACTIVA", x.salud ?? "SANA", x.sexo ?? "HEMBRA", x.padre ?? null, x.madre ?? null, x.jaula ?? null, x.peso ?? null);

const insHuevo = (c: string, id: string, codigo: string, ave: string, fecha: string, jaula: string | null = null) =>
  sql(`INSERT INTO huevos (id, criadero_id, codigo, ave_id, jaula_id, fecha) VALUES (?, ?, ?, ?, ?, ?)`, id, c, codigo, ave, jaula, fecha);

const insDiag = (c: string, id: string, ave: string, enfermedad: string) =>
  sql(`INSERT INTO diagnosticos_ave (id, criadero_id, ave_id, fecha, enfermedad) VALUES (?, ?, ?, '2026-10-20T10:00:00.000Z', ?)`, id, c, ave, enfermedad);

const insBaja = (c: string, id: string, ave: string, tipo: string, fecha: string, x: Record<string, unknown> = {}) =>
  sql(`INSERT INTO bajas_ave (id, criadero_id, ave_id, tipo, fecha, celular, comprador, ciudad_destino, valor_venta, valor_envio)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    id, c, ave, tipo, fecha, x.celular ?? null, x.comprador ?? null, x.ciudad ?? null, x.vv ?? null, x.ve ?? null);

const insMov = (c: string, id: string, tipo: string, valor: number, fecha: string, ave: string | null = null, origen: [string, string] | null = null) =>
  sql(`INSERT INTO movimientos_financieros (id, criadero_id, tipo, categoria, fecha, valor, ave_id, origen_tipo, origen_id)
       VALUES (?, ?, ?, 'CAT', ?, ?, ?, ?, ?)`, id, c, tipo, fecha, valor, ave, origen?.[0] ?? null, origen?.[1] ?? null);

describe("Reportes D1 local (SQLite en memoria)", () => {
  let A: Cuenta;
  let B: Cuenta;
  const contador = new D1Contador();
  const app = createApp({
    reportesRouter: createReportesRouter(() => createReportesDependencies(contador as any, () => new Date(AHORA))),
  });

  async function get(cuenta: Cuenta, criaderoId: string, ruta: string, conToken = true) {
    const t0 = performance.now();
    const antes = contador.llamadas;
    const headers: Record<string, string> = conToken ? { Authorization: `Bearer ${await token(cuenta.userId)}` } : {};
    const r = await app.request(
      `/api/v1/criaderos/${criaderoId}/reportes${ruta}`,
      { headers },
      { JWT_SECRET: jwtSecret, DB: contador }
    );
    const texto = await r.text();
    return { status: r.status, texto, body: JSON.parse(texto) as any, llamadas: contador.llamadas - antes, ms: performance.now() - t0 };
  }

  const RUTAS = [
    "/aves", "/salud", "/produccion", "/finanzas",
    "/exportaciones/aves", "/exportaciones/ventas", "/exportaciones/clientes",
    "/exportaciones/finanzas", "/exportaciones/huevos", "/exportaciones/jaulas",
  ];

  beforeAll(async () => {
    A = await crearUsuarioYCriadero("reportes.a@test.com");
    B = await crearUsuarioYCriadero("reportes.b@test.com");
  });

  it("debe devolver ceros, enfermedades [], mejor null y filas [] en un criadero sin datos (REP-01, REP-21)", async () => {
    const vacio = await crearUsuarioYCriadero("reportes.vacio@test.com");
    const r = async (ruta: string) => (await get(vacio, vacio.criaderoId, ruta)).body;

    expect(await r("/aves")).toEqual({ success: true, data: { activas: 0, vendidas: 0, fallecidas: 0 } });
    expect(await r("/salud")).toEqual({ success: true, data: { estado: { tratamiento: 0, enfermas: 0 }, enfermedades: [] } });
    expect(await r("/produccion")).toEqual({ success: true, data: { huevos: { hoy: 0, mes: 0 }, mejor: null } });
    expect(await r("/finanzas")).toEqual({ success: true, data: { ingresos: 0, egresos: 0, utilidad: 0 } });
    for (const ruta of RUTAS.filter((x) => x.startsWith("/exportaciones"))) {
      const x = await get(vacio, vacio.criaderoId, ruta);

      expect(x.status, ruta).toBe(200);
      expect(x.body, ruta).toEqual({ success: true, data: { filas: [] } });
    }
  });

  it("debe cargar datos en A y B con codigos repetidos y aislarlos en los 10 endpoints (REP-02..REP-22)", async () => {
    // Criadero A
    await lote([
      insJaula(A.criaderoId, "A-j1", "J01"),
      insJaula(A.criaderoId, "A-j2", "J02", { activa: 0, fd: "2026-10-15T09:30:00.000Z" }),
      insAve(A.criaderoId, "A-a1", "K001", { sexo: "MACHO" }),
      insAve(A.criaderoId, "A-a2", "K002", { salud: "ENFERMA", madre: "A-a1", jaula: "A-j1", peso: 0 }),
      insAve(A.criaderoId, "A-a3", "K003", { estado: "VENDIDA", salud: "ENFERMA", padre: "A-a1" }),
      insAve(A.criaderoId, "A-a4", "K004", { estado: "FALLECIDA" }),
      insDiag(A.criaderoId, "A-d1", "A-a3", "Coriza"),
      insDiag(A.criaderoId, "A-d2", "A-a2", "Coriza"),
      insDiag(A.criaderoId, "A-d3", "A-a4", "Bouba"),
      insHuevo(A.criaderoId, "A-h1", "H000001", "A-a2", "2026-11-05T23:59:59.999Z", "A-j1"),
      insHuevo(A.criaderoId, "A-h2", "H000002", "A-a2", "2026-11-01T00:00:00.000Z"),
      insHuevo(A.criaderoId, "A-h3", "H000003", "A-a1", "2026-10-31T23:59:59.999Z"),
      insHuevo(A.criaderoId, "A-h4", "H000004", "A-a3", "2026-11-05T01:00:00.000Z"),
      insBaja(A.criaderoId, "A-b1", "A-a3", "VENTA", "2026-10-01T10:00:00.000Z", { celular: "0991", comprador: " Ana ", vv: 10, ve: 1 }),
      insBaja(A.criaderoId, "A-b2", "A-a4", "MUERTE", "2026-10-02T10:00:00.000Z"),
      insMov(A.criaderoId, "A-m1", "INGRESO", 0.1, "2026-10-01T10:00:00.000Z", "A-a3", ["VENTA_AVE", "A-b1"]),
      insMov(A.criaderoId, "A-m2", "INGRESO", 0.2, "2026-10-01T10:00:00.000Z"),
      insMov(A.criaderoId, "A-m3", "EGRESO", 0.05, "2026-10-02T10:00:00.000Z"),
      insMov(A.criaderoId, "A-m4", "AJUSTE", 99, "2026-10-03T10:00:00.000Z"),
    ]);
    // Criadero B: mismos codigos, otros valores; el ave de B apunta como padre a un ave de A (referencia cruzada)
    await lote([
      insJaula(B.criaderoId, "B-j1", "J01"),
      insAve(B.criaderoId, "B-a1", "K001", { estado: "VENDIDA", sexo: "MACHO" }),
      insAve(B.criaderoId, "B-a2", "K002", { padre: "A-a1", madre: "A-a2", jaula: "A-j1" }),
      insDiag(B.criaderoId, "B-d1", "B-a1", "Ajena"),
      insHuevo(B.criaderoId, "B-h1", "H000001", "B-a2", "2026-11-05T10:00:00.000Z", "A-j1"),
      insBaja(B.criaderoId, "B-b1", "B-a1", "VENTA", "2027-01-01T00:00:00.000Z", { celular: "0991", comprador: "AJENO", vv: 777 }),
      insMov(B.criaderoId, "B-m1", "INGRESO", 5000, "2027-01-01T00:00:00.000Z", "A-a3"),
    ]);

    const aves = (await get(A, A.criaderoId, "/aves")).body.data;
    expect(aves).toEqual({ activas: 2, vendidas: 1, fallecidas: 1 });

    const salud = (await get(A, A.criaderoId, "/salud")).body.data;
    expect(salud.estado).toEqual({ tratamiento: 0, enfermas: 1 });
    expect(salud.enfermedades).toEqual([{ enfermedad: "Coriza", cantidad: 2 }, { enfermedad: "Bouba", cantidad: 1 }]);

    const prod = (await get(A, A.criaderoId, "/produccion")).body.data;
    expect(prod.huevos).toEqual({ hoy: 2, mes: 3 });
    expect(prod.mejor).toEqual({ codigo: "K002", cantidad: 2 });

    const fin = (await get(A, A.criaderoId, "/finanzas")).body.data;
    expect(fin.ingresos).toBeCloseTo(0.3, 10);
    expect(fin.egresos).toBe(0.05);
    expect(fin.utilidad).toBe(fin.ingresos - fin.egresos);

    // B ve solo lo suyo
    expect((await get(B, B.criaderoId, "/aves")).body.data).toEqual({ activas: 1, vendidas: 1, fallecidas: 0 });
    expect((await get(B, B.criaderoId, "/salud")).body.data.enfermedades).toEqual([{ enfermedad: "Ajena", cantidad: 1 }]);
    expect((await get(B, B.criaderoId, "/produccion")).body.data).toEqual({ huevos: { hoy: 1, mes: 1 }, mejor: { codigo: "K002", cantidad: 1 } });
    expect((await get(B, B.criaderoId, "/finanzas")).body.data).toEqual({ ingresos: 5000, egresos: 0, utilidad: 5000 });

    const exA = (r: string) => get(A, A.criaderoId, `/exportaciones/${r}`).then((x) => x.body.data.filas as any[]);
    const exB = (r: string) => get(B, B.criaderoId, `/exportaciones/${r}`).then((x) => x.body.data.filas as any[]);

    // aves: orden por Codigo, padre/madre/jaula por codigo dentro del criadero (REP-13, REP-14)
    const avesA = await exA("aves");
    expect(avesA.map((f) => f.Codigo)).toEqual(["K001", "K002", "K003", "K004"]);
    expect(avesA[1]).toMatchObject({ Madre: "K001", Padre: null, Jaula: "J01", PesoGramos: 0, AlturaCm: null });
    expect(avesA[2]).toMatchObject({ Padre: "K001", Estado: "VENDIDA" });
    expect(Object.keys(avesA[0])).toEqual([
      "Codigo", "Raza", "Sexo", "Estado", "EstadoSalud", "FechaNacimiento", "PesoGramos", "AlturaCm", "LargoCm",
      "Padre", "Madre", "Jaula", "Origen", "Caracteristicas",
    ]);

    // REP-23: el ave de B apunta a un padre/madre/jaula de A: el JOIN no resuelve fuera del criadero
    const avesB = await exB("aves");
    expect(avesB.find((f) => f.Codigo === "K002")).toMatchObject({ Padre: null, Madre: null, Jaula: null });

    // ventas y clientes (REP-15, REP-16)
    const ventasA = await exA("ventas");
    expect(ventasA).toEqual([{ Ave: "K003", Fecha: "2026-10-01T10:00:00.000Z", Celular: "0991", Nombre: " Ana ", CiudadDestino: null, Cooperativa: null, ValorAve: 10, ValorEnvio: 1, Detalle: null }]);
    const clientesA = await exA("clientes");
    expect(clientesA).toEqual([{ Celular: "0991", Nombre: "Ana", Ciudad: null, Compras: 1, TotalAves: 10, TotalEnvios: 1, UltimaCompra: "2026-10-01T10:00:00.000Z" }]);
    expect((await exB("clientes"))[0]).toMatchObject({ Nombre: "AJENO", TotalAves: 777 });

    // finanzas: Fecha DESC, empate = ultimo insertado primero; OrigenId texto; Ave por codigo (REP-17, REP-23)
    const finA = await exA("finanzas");
    expect(finA.map((f) => f.Valor)).toEqual([99, 0.05, 0.2, 0.1]);
    expect(finA[3]).toEqual({ Fecha: "2026-10-01T10:00:00.000Z", Tipo: "INGRESO", Categoria: "CAT", Valor: 0.1, Detalle: null, Ave: "K003", Origen: "VENTA_AVE", OrigenId: "A-b1" });
    const finB = await exB("finanzas");
    expect(finB).toHaveLength(1);
    expect(finB[0].Ave).toBeNull(); // el ave_id apunta a un ave de A: no se resuelve

    // huevos (REP-18, REP-23)
    const huevosA = await exA("huevos");
    expect(huevosA.map((f) => f.Codigo)).toEqual(["H000001", "H000004", "H000002", "H000003"]);
    expect(huevosA[0]).toEqual({ Codigo: "H000001", Fecha: "2026-11-05T23:59:59.999Z", Ave: "K002", Jaula: "J01", Estado: "REGISTRADO", Observacion: null });
    expect(huevosA[1].Jaula).toBeNull();
    expect((await exB("huevos"))[0]).toMatchObject({ Ave: "K002", Jaula: null });

    // jaulas (REP-19)
    const jaulasA = await exA("jaulas");
    expect(jaulasA.map((f) => [f.Codigo, f.Estado, f.FechaDesactivacion])).toEqual([
      ["J01", "ACTIVA", null], ["J02", "INACTIVA", "2026-10-15T09:30:00.000Z"],
    ]);
    expect(jaulasA[0].FechaCreacion).toBe("2026-10-01 10:00:00");
    expect(await exB("jaulas")).toHaveLength(1);
  });

  it("debe responder 403 FORBIDDEN sin filtrar datos si el criadero es de otro usuario o no existe (REP-22)", async () => {
    for (const ruta of RUTAS) {
      const ajeno = await get(A, B.criaderoId, ruta);
      const inexistente = await get(A, "no-existe", ruta);

      expect(ajeno.status, ruta).toBe(403);
      expect(ajeno.body.error).toBe("FORBIDDEN");
      expect(ajeno.texto).not.toContain("AJENO");
      expect(inexistente.status, ruta).toBe(403);
    }
  });

  it("debe responder 401 sin token", async () => {
    const r = await get(A, A.criaderoId, "/aves", false);

    expect(r.status).toBe(401);
  });

  it("debe usar 2 llamadas a D1 (3 en salud y produccion) con pocos datos y con el volumen de REP-24, y medir tiempo y tamano", async () => {
    const pocos = await crearUsuarioYCriadero("reportes.pocos@test.com");
    await lote([
      insJaula(pocos.criaderoId, "P-j1", "J01"),
      insAve(pocos.criaderoId, "P-a1", "K001"),
      insHuevo(pocos.criaderoId, "P-h1", "H000001", "P-a1", AHORA, "P-j1"),
      insDiag(pocos.criaderoId, "P-d1", "P-a1", "Coriza"),
      insBaja(pocos.criaderoId, "P-b1", "P-a1", "VENTA", AHORA, { celular: "0990", comprador: "P", vv: 1 }),
      insMov(pocos.criaderoId, "P-m1", "INGRESO", 1, AHORA, "P-a1"),
    ]);

    const grande = await crearUsuarioYCriadero("reportes.grande@test.com");
    const g = grande.criaderoId;
    const st: any[] = [];
    for (let i = 1; i <= 60; i++) st.push(insJaula(g, `G-j${i}`, `J${String(i).padStart(3, "0")}`, { activa: i % 5 ? 1 : 0, fd: i % 5 ? null : "2026-10-15T09:30:00.000Z" }));
    for (let i = 1; i <= 300; i++) {
      st.push(insAve(g, `G-a${i}`, `K${String(i).padStart(4, "0")}`, {
        estado: ["ACTIVA", "ACTIVA", "VENDIDA", "FALLECIDA"][i % 4],
        salud: ["SANA", "ENFERMA", "EN_TRATAMIENTO"][i % 3],
        jaula: `G-j${(i % 60) + 1}`, padre: i > 10 ? `G-a${(i % 10) + 1}` : null, madre: i > 10 ? `G-a${(i % 7) + 1}` : null,
        peso: 1000 + i * 1.37,
      }));
    }
    await lote(st);
    const hs: any[] = [];
    for (let i = 1; i <= 2000; i++) {
      const dia = String(1 + (i % 28)).padStart(2, "0");
      hs.push(insHuevo(g, `G-h${i}`, `H${String(i).padStart(6, "0")}`, `G-a${(i % 300) + 1}`, `2026-11-${dia}T${String(i % 24).padStart(2, "0")}:00:00.000Z`, `G-j${(i % 60) + 1}`));
    }
    await lote(hs);
    const ms: any[] = [];
    for (let i = 1; i <= 2000; i++) {
      ms.push(insMov(g, `G-m${i}`, ["INGRESO", "EGRESO"][i % 2], i * 0.37, `2026-10-${String(1 + (i % 28)).padStart(2, "0")}T00:00:00.000Z`, i % 3 ? `G-a${(i % 300) + 1}` : null));
    }
    await lote(ms);
    const bs: any[] = [];
    for (let i = 1; i <= 300; i++) {
      bs.push(insBaja(g, `G-b${i}`, `G-a${i}`, i % 10 ? "VENTA" : "MUERTE", `2026-09-${String(1 + (i % 28)).padStart(2, "0")}T00:00:00.000Z`, {
        celular: `09${String(i % 80).padStart(8, "0")}`, comprador: `Comprador ${i % 80}`, ciudad: "Quito", vv: i * 0.1, ve: i % 3 ? 0.25 : null,
      }));
    }
    await lote(bs);
    const ds: any[] = [];
    for (let i = 1; i <= 100; i++) ds.push(insDiag(g, `G-d${i}`, `G-a${(i % 300) + 1}`, `Enfermedad ${i % 12}`));
    await lote(ds);

    const esperadas: Record<string, number> = {
      "/aves": 2, "/finanzas": 2, "/salud": 3, "/produccion": 3,
    };
    const informe: string[] = [];

    for (const ruta of RUTAS) {
      const esperado = esperadas[ruta] ?? 2;
      const p = await get(pocos, pocos.criaderoId, ruta);
      const gr = await get(grande, g, ruta);

      expect(p.status, ruta).toBe(200);
      expect(gr.status, ruta).toBe(200);
      expect(p.llamadas, `${ruta} pocos datos`).toBe(esperado);
      expect(gr.llamadas, `${ruta} volumen REP-24`).toBe(esperado);
      informe.push(
        `GET /reportes${ruta}: llamadas D1 pocos=${p.llamadas} grande=${gr.llamadas}; tiempo pocos=${p.ms.toFixed(1)} ms grande=${gr.ms.toFixed(1)} ms; tamano grande=${gr.texto.length} B`
      );
    }
    expect(contador.batches).toBe(0);

    // contenidos con el volumen
    expect((await get(grande, g, "/exportaciones/jaulas")).body.data.filas).toHaveLength(60);
    expect((await get(grande, g, "/exportaciones/aves")).body.data.filas).toHaveLength(300);
    expect((await get(grande, g, "/exportaciones/huevos")).body.data.filas).toHaveLength(2000);
    expect((await get(grande, g, "/exportaciones/finanzas")).body.data.filas).toHaveLength(2000);
    expect((await get(grande, g, "/exportaciones/ventas")).body.data.filas).toHaveLength(270);
    expect((await get(grande, g, "/exportaciones/clientes")).body.data.filas).toHaveLength(72);
    expect((await get(grande, g, "/salud")).body.data.enfermedades).toHaveLength(5);

    console.log(informe.join("\n"));
  });

  it("debe mantener las llamadas a D1 con 20000 huevos y medir tiempo y tamano (informativo)", async () => {
    const enorme = await crearUsuarioYCriadero("reportes.enorme@test.com");
    const g = enorme.criaderoId;
    await lote([insAve(g, "E-a1", "K001"), insAve(g, "E-a2", "K002")]);
    const hs: any[] = [];
    for (let i = 1; i <= 20000; i++) {
      hs.push(insHuevo(g, `E-h${i}`, `H${String(i).padStart(6, "0")}`, `E-a${(i % 2) + 1}`, `2026-11-${String(1 + (i % 28)).padStart(2, "0")}T${String(i % 24).padStart(2, "0")}:00:00.000Z`));
    }
    await lote(hs);

    const informe: string[] = [];
    for (const ruta of ["/produccion", "/exportaciones/huevos"]) {
      const r = await get(enorme, g, ruta);

      expect(r.status).toBe(200);
      expect(r.llamadas).toBe(ruta === "/produccion" ? 3 : 2);
      informe.push(`20000 huevos GET /reportes${ruta}: llamadas D1=${r.llamadas}; tiempo=${r.ms.toFixed(1)} ms; tamano=${r.texto.length} B`);
    }
    console.log(informe.join("\n"));
  });
});
