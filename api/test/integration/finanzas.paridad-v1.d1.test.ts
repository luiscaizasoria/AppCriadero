import { describe, it, expect, beforeAll, afterAll, vi } from "vitest";
import Database from "better-sqlite3";
import { AuthService } from "../../src/auth/auth.service";
import { D1AuthRepository } from "../../src/auth/auth.repository";
import { CriaderoService } from "../../src/criaderos/criaderos.service";
import { D1CriaderoRepository } from "../../src/criaderos/criaderos.repository";
import { D1AveRepository } from "../../src/aves/aves.repository";
import { AveService } from "../../src/aves/aves.service";
import { D1FinanzasRepository } from "../../src/finanzas/finanzas.repository";
import { FinanzasService } from "../../src/finanzas/finanzas.service";
import { LocalD1Adapter } from "../helpers/local-d1.adapter";

/**
 * PARIDAD CON V1 (Finanzas).
 *
 * Ejecuta el codigo REAL de V1 (src/repositories/FinanzasRepository.sqlite.js, sin modificarlo) sobre
 * una base better-sqlite3 en memoria con las tablas en forma V1 (DDL de src/database/migrations.js
 * y migrationV6.js; sin FK a otras tablas salvo aves). Un adaptador minimo imita la API de
 * expo-sqlite que V1 usa (getAllAsync / getFirstAsync / runAsync / withTransactionAsync).
 * Intervenciones del arnes (las unicas): (1) `getDatabase` de V1 se sustituye con vi.mock por la
 * base en memoria; (2) el literal 'now' de las consultas de periodo se sustituye por el instante
 * fijado de la prueba (mismo efecto que el reloj inyectado de V2); (3) `Date` se fija con
 * fake timers para `new Date().toISOString()` de V1.
 *
 * Los MISMOS datos de entrada se cargan en la base V1 y en la D1 local de V2 (migraciones reales
 * 0001-0011) y se comparan, campo por campo y con toStrictEqual: resumen (TODO/MES/ANIO/desconocido
 * con varios relojes), consolidado por categoria, consolidado mensual (limites), listado de
 * movimientos, movimiento por id, venta por baja, historial, y el resultado (exito o mensaje de
 * error) y el estado final de las tablas tras cada alta, edicion manual y correccion de venta.
 * Unicas diferencias normalizadas: ids (INTEGER en V1, TEXT en V2: se comparan por etiqueta de
 * orden de creacion), claves camelCase de la API -> snake_case de V1, fecha_creacion (reloj real
 * del motor) y el id del ave dentro de `detalle` (entero en V1, UUID en V2).
 */

const holder = vi.hoisted(() => ({ db: null as any }));

vi.mock("../../../src/database/database", () => ({
  getDatabase: async () => holder.db,
}));

// La logica de V1 vive en FinanzasRepository.sqlite.js (FinanzasRepository.js es la fachada que elige
// entre SQLite y API); es el codigo V1 intacto, sin modificar.
const V1: any = await import("../../../src/repositories/FinanzasRepository.sqlite.js");

let reloj = "2026-11-03T10:00:00.000Z";

const DDL_V1 = `
  CREATE TABLE aves (id INTEGER PRIMARY KEY AUTOINCREMENT, codigo TEXT NOT NULL UNIQUE);
  CREATE TABLE bajas_ave (
    id INTEGER PRIMARY KEY AUTOINCREMENT, ave_id INTEGER NOT NULL, tipo TEXT NOT NULL, fecha TEXT NOT NULL,
    causa TEXT, celular TEXT, ciudad_destino TEXT, cooperativa_envio TEXT, comprador TEXT,
    valor_venta REAL, valor_envio REAL, detalle TEXT,
    fecha_creacion TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (ave_id) REFERENCES aves(id)
  );
  CREATE TABLE movimientos_financieros (
    id INTEGER PRIMARY KEY AUTOINCREMENT, tipo TEXT NOT NULL, categoria TEXT, fecha TEXT NOT NULL,
    valor REAL NOT NULL, detalle TEXT, ave_id INTEGER, origen_tipo TEXT, origen_id INTEGER,
    fecha_creacion TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (ave_id) REFERENCES aves(id)
  );
  CREATE INDEX idx_movimientos_fecha ON movimientos_financieros(fecha);
  CREATE TABLE movimientos_financieros_historial (
    id INTEGER PRIMARY KEY AUTOINCREMENT, movimiento_id INTEGER NOT NULL, fecha TEXT NOT NULL, accion TEXT NOT NULL,
    tipo_anterior TEXT, tipo_nuevo TEXT, categoria_anterior TEXT, categoria_nueva TEXT,
    fecha_movimiento_anterior TEXT, fecha_movimiento_nueva TEXT, valor_anterior REAL, valor_nuevo REAL,
    detalle_anterior TEXT, detalle_nuevo TEXT, origen_tipo TEXT, origen_id INTEGER,
    FOREIGN KEY (movimiento_id) REFERENCES movimientos_financieros(id)
  );
  CREATE INDEX idx_mov_fin_hist_movimiento ON movimientos_financieros_historial(movimiento_id);
  CREATE INDEX idx_movimientos_financieros_origen ON movimientos_financieros(origen_tipo, origen_id);
`;

function crearAdaptadorV1() {
  const sqlite = new Database(":memory:");
  sqlite.exec(DDL_V1);
  sqlite.pragma("foreign_keys = ON");

  const sub = (sql: string) => sql.replaceAll("'now'", `'${reloj}'`);

  return {
    sqlite,
    async getAllAsync(sql: string, params: unknown[] = []) {
      return sqlite.prepare(sub(sql)).all(...params);
    },
    async getFirstAsync(sql: string, params: unknown[] = []) {
      return sqlite.prepare(sub(sql)).get(...params) ?? null;
    },
    async runAsync(sql: string, params: unknown[] = []) {
      const r = sqlite.prepare(sub(sql)).run(...params);
      return { lastInsertRowId: Number(r.lastInsertRowid), changes: r.changes };
    },
    async withTransactionAsync(fn: () => Promise<void>) {
      sqlite.exec("BEGIN");
      try {
        await fn();
        sqlite.exec("COMMIT");
      } catch (e) {
        sqlite.exec("ROLLBACK");
        throw e;
      }
    },
  };
}

const v1db = crearAdaptadorV1();
holder.db = v1db;

const d1 = new LocalD1Adapter();
const jwtSecret = "integration-secret-key";

async function filas<T = any>(sql: string, ...params: unknown[]): Promise<T[]> {
  return (await d1.prepare(sql).bind(...params).all()).results as T[];
}

function v2() {
  return new FinanzasService(new D1FinanzasRepository(d1 as any), undefined, () => new Date(reloj));
}

function fijarReloj(iso: string) {
  reloj = iso;
  vi.setSystemTime(new Date(iso));
}

// ---- etiquetas de ids ----

type Kind = "m" | "a" | "b";
const etiquetas = { v1: new Map<string, string>(), v2: new Map<string, string>() };

function registrar(kind: Kind, n: number, v1id: unknown, v2id: unknown) {
  etiquetas.v1.set(`${kind}:${v1id}`, `${kind}${n}`);
  etiquetas.v2.set(`${kind}:${v2id}`, `${kind}${n}`);
}

function etiqueta(lado: "v1" | "v2", kind: Kind, id: unknown) {
  if (id === null || id === undefined) return null;
  return etiquetas[lado].get(`${kind}:${id}`) ?? `?${kind}:${id}`;
}

function aSnake(obj: any): any {
  if (obj === null || typeof obj !== "object") return obj;
  if (Array.isArray(obj)) return obj.map(aSnake);
  return Object.fromEntries(
    Object.entries(obj).map(([k, v]) => [k.replace(/[A-Z]/g, (c) => "_" + c.toLowerCase()), v])
  );
}

function normDetalle(lado: "v1" | "v2", texto: unknown) {
  if (typeof texto !== "string") return texto;
  return texto.replace(/\bave ([0-9a-f][0-9a-f-]*)/g, (_m, id) => `ave ${etiqueta(lado, "a", id)}`);
}

/** Normaliza una fila segun lo que representa su `id`. */
function norm(lado: "v1" | "v2", fila: any, idKind: Kind | "historial" | null) {
  if (fila === null || fila === undefined) return fila;
  const f: any = lado === "v2" ? aSnake(fila) : { ...fila };

  if (idKind === "historial") f.id = "<id>";
  else if (idKind && "id" in f) f.id = etiqueta(lado, idKind, f.id);
  if ("movimiento_id" in f) f.movimiento_id = etiqueta(lado, "m", f.movimiento_id);
  if ("ave_id" in f) f.ave_id = etiqueta(lado, "a", f.ave_id);
  if ("origen_id" in f) f.origen_id = etiqueta(lado, "b", f.origen_id);
  if ("fecha_creacion" in f) f.fecha_creacion = "<ts>";
  if ("criadero_id" in f) delete f.criadero_id;
  for (const k of ["detalle", "detalle_anterior", "detalle_nuevo"]) if (k in f) f[k] = normDetalle(lado, f[k]);

  return JSON.parse(JSON.stringify(f));
}

// ---- registro de comparaciones (para el informe) ----

const comparaciones: string[] = [];

function paridad(nombre: string, esperadoV1: unknown, obtenidoV2: unknown) {
  comparaciones.push(nombre);
  expect(obtenidoV2, nombre).toStrictEqual(esperadoV1);
}

async function resultadoV1(fn: () => Promise<unknown>) {
  try {
    return { ok: true, valor: await fn() };
  } catch (e: any) {
    return { ok: false, error: e.message };
  }
}

function resultadoV2(r: any, extraer: (data: any) => unknown) {
  return r.success ? { ok: true, valor: extraer(r.data) } : { ok: false, error: r.error };
}

// ---- datos ----

let criadero: string;
let nMov = 0;

async function insertarMov(m: {
  tipo: string; categoria: string | null; fecha: string; valor: number; detalle?: string | null;
  ave?: number | null; origenTipo?: string | null; baja?: number | null;
}) {
  const n = ++nMov;
  const detalle = (lado: "v1" | "v2") =>
    m.detalle == null ? null : m.detalle.replace(/\{a(\d+)\}/g, (_x, k) => (lado === "v1" ? String(k) : aveV2[Number(k)]));

  v1db.sqlite.prepare(`
    INSERT INTO movimientos_financieros (tipo, categoria, fecha, valor, detalle, ave_id, origen_tipo, origen_id)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `).run(m.tipo, m.categoria, m.fecha, m.valor, detalle("v1"), m.ave ?? null, m.origenTipo === undefined ? "MANUAL" : m.origenTipo, m.baja ?? null);

  await d1.prepare(`
    INSERT INTO movimientos_financieros (id, criadero_id, tipo, categoria, fecha, valor, detalle, ave_id, origen_tipo, origen_id)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).bind(`m${n}`, criadero, m.tipo, m.categoria, m.fecha, m.valor, detalle("v2"), m.ave ? aveV2[m.ave] : null,
    m.origenTipo === undefined ? "MANUAL" : m.origenTipo, m.baja ? `b${m.baja}` : null).run();

  registrar("m", n, n, `m${n}`);
  return n;
}

const aveV2: Record<number, string> = {};

async function instantanea() {
  const v1 = {
    movimientos: v1db.sqlite.prepare("SELECT * FROM movimientos_financieros ORDER BY id").all().map((r: any) => norm("v1", r, "m")),
    historial: v1db.sqlite.prepare("SELECT * FROM movimientos_financieros_historial ORDER BY id").all().map((r: any) => norm("v1", r, "historial")),
    bajas: v1db.sqlite.prepare("SELECT id, ave_id, tipo, fecha, valor_venta, valor_envio FROM bajas_ave ORDER BY id").all().map((r: any) => norm("v1", r, "b")),
  };
  const dos = {
    movimientos: (await filas("SELECT * FROM movimientos_financieros WHERE criadero_id = ? ORDER BY rowid", criadero)).map((r) => norm("v2", { ...r }, "m")),
    historial: (await filas("SELECT * FROM movimientos_financieros_historial WHERE criadero_id = ? ORDER BY rowid", criadero)).map((r) => norm("v2", { ...r }, "historial")),
    bajas: (await filas("SELECT id, ave_id, tipo, fecha, valor_venta, valor_envio FROM bajas_ave WHERE criadero_id = ? ORDER BY rowid", criadero)).map((r) => norm("v2", { ...r }, "b")),
  };
  return { v1, v2: dos };
}

async function compararEstado(nombre: string) {
  const { v1, v2: dos } = await instantanea();
  paridad(`${nombre}: tabla movimientos_financieros`, v1.movimientos, dos.movimientos);
  paridad(`${nombre}: tabla movimientos_financieros_historial`, v1.historial, dos.historial);
  paridad(`${nombre}: tabla bajas_ave`, v1.bajas, dos.bajas);
}

function v1Id(label: string) {
  return Number(label.slice(1));
}

function v2Id(label: string) {
  return label === "nada" ? "nada" : label;
}

describe("Paridad con V1: FinanzasRepository.js real contra la API", () => {
  beforeAll(async () => {
    vi.useFakeTimers({ toFake: ["Date"] });
    fijarReloj("2026-11-03T10:00:00.000Z");

    const email = "finanzas.paridad@test.com";
    const auth = new AuthService(new D1AuthRepository(d1 as any), jwtSecret);
    const usuario = await auth.register({ email, nombre: "Paridad", password: "Password123!" });
    if (!usuario.success) throw new Error("usuario");
    const criaderos = new CriaderoService(new D1CriaderoRepository(d1 as any));
    const c = await criaderos.createCriadero(usuario.data.user.id, {
      nombre: "Criadero Paridad", pais: "Ecuador", provincia: "Pichincha", ciudad: "Quito", telefono: "0999999999", correoContacto: email,
    });
    if (!c.success) throw new Error("criadero");
    criadero = c.data.id;

    // aves: 1..3 en ambas bases
    const aves = new AveService(new D1AveRepository(d1 as any));
    for (let n = 1; n <= 3; n++) {
      v1db.sqlite.prepare("INSERT INTO aves (codigo) VALUES (?)").run(`PA-${n}`);
      const a = await aves.crear(criadero, { codigo: `PA-${n}`, origen: "NACIDA_CRIADERO" });
      if (!a.success) throw new Error("ave");
      aveV2[n] = a.data.ave.id;
      registrar("a", n, n, a.data.ave.id);
    }

    // bajas: b1 venta con envio, b2 venta sin envio (valor_envio NULL), b3 muerte
    const bajas = [
      [1, "VENTA", "2026-10-31T12:00:00.000Z", null, "0999111222", "Quito", "Coop", "Ana", 100, 5, "ok"],
      [2, "VENTA", "2026-10-15T08:00:00.000Z", null, "0988777666", null, null, "Luis", 40.5, null, null],
      [3, "MUERTE", "2026-10-20T08:00:00.000Z", "enfermedad", null, null, null, null, null, null, "x"],
    ] as const;
    for (const [n, tipo, fecha, causa, celular, ciudad, coop, comprador, vv, ve, detalle] of bajas) {
      v1db.sqlite.prepare(`INSERT INTO bajas_ave (ave_id, tipo, fecha, causa, celular, ciudad_destino, cooperativa_envio, comprador, valor_venta, valor_envio, detalle)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`).run(n, tipo, fecha, causa, celular, ciudad, coop, comprador, vv, ve, detalle);
      await d1.prepare(`INSERT INTO bajas_ave (id, criadero_id, ave_id, tipo, fecha, causa, celular, ciudad_destino, cooperativa_envio, comprador, valor_venta, valor_envio, detalle)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`).bind(`b${n}`, criadero, aveV2[n], tipo, fecha, causa, celular, ciudad, coop, comprador, vv, ve, detalle).run();
      registrar("b", n, n, `b${n}`);
    }

    // movimientos de venta (como los deja Bajas) y movimientos manuales variados
    await insertarMov({ tipo: "INGRESO", categoria: "VENTA_AVE", fecha: "2026-10-31T12:00:00.000Z", valor: 100, detalle: "Venta de ave {a1} a Ana", ave: 1, origenTipo: "VENTA_AVE", baja: 1 });
    await insertarMov({ tipo: "INGRESO", categoria: "ENVIO_AVE", fecha: "2026-10-31T12:00:00.000Z", valor: 5, detalle: "Envío de venta de ave {a1} a Ana", ave: 1, origenTipo: "VENTA_AVE", baja: 1 });
    await insertarMov({ tipo: "INGRESO", categoria: "VENTA_AVE", fecha: "2026-10-15T08:00:00.000Z", valor: 40.5, detalle: "Venta de ave {a2} a Luis", ave: 2, origenTipo: "VENTA_AVE", baja: 2 });
    await insertarMov({ tipo: "INGRESO", categoria: "VENTA_HUEVOS", fecha: "2026-10-31T23:59:59.999Z", valor: 12.5, detalle: "huevos" });
    await insertarMov({ tipo: "INGRESO", categoria: "OTRO", fecha: "2026-11-01T00:00:00.000Z", valor: 3.25 });
    await insertarMov({ tipo: "INGRESO", categoria: null, fecha: "2025-12-31T23:59:59.999Z", valor: 0.1 });
    await insertarMov({ tipo: "INGRESO", categoria: null, fecha: "2026-11-02T10:00:00.000Z", valor: 0.2 });
    await insertarMov({ tipo: "EGRESO", categoria: "ALIMENTO", fecha: "2026-11-01T01:00:00.000Z", valor: 0.1, detalle: "pienso", ave: 3 });
    await insertarMov({ tipo: "EGRESO", categoria: "ALIMENTO", fecha: "2026-11-01T01:00:00.000Z", valor: 0.2 });
    await insertarMov({ tipo: "EGRESO", categoria: "MEDICAMENTO", fecha: "2026-10-31T23:30:00.000Z", valor: 19.99 });
    await insertarMov({ tipo: "EGRESO", categoria: "INFRAESTRUCTURA", fecha: "2027-01-01T00:00:00.000Z", valor: 1234567.89 });
    await insertarMov({ tipo: "EGRESO", categoria: "COMPRA_AVE", fecha: "2028-02-29T12:00:00.000Z", valor: 33.33 });
    await insertarMov({ tipo: "RARO", categoria: "OTRO", fecha: "2026-10-05T00:00:00.000Z", valor: 9 });
    await insertarMov({ tipo: "INGRESO", categoria: "OTRO", fecha: "abc", valor: 4 });
    await insertarMov({ tipo: "INGRESO", categoria: "OTRO", fecha: "2026-09-09T09:09:09.000Z", valor: 7.77, origenTipo: null });

    // 500 movimientos pseudoaleatorios deterministas (sumas, orden y agrupaciones a escala)
    let semilla = 12345;
    const rnd = () => (semilla = (semilla * 1103515245 + 12345) % 2147483648) / 2147483648;
    const cats = ["VENTA_HUEVOS", "OTRO", "ALIMENTO", "MEDICAMENTO", null, "INFRAESTRUCTURA", "COMPRA_AVE"];
    for (let i = 0; i < 500; i++) {
      const mes = 1 + Math.floor(rnd() * 12);
      const dia = 1 + Math.floor(rnd() * 28);
      await insertarMov({
        tipo: rnd() < 0.5 ? "INGRESO" : "EGRESO",
        categoria: cats[Math.floor(rnd() * cats.length)],
        fecha: `${rnd() < 0.5 ? 2025 : 2026}-${String(mes).padStart(2, "0")}-${String(dia).padStart(2, "0")}T${String(Math.floor(rnd() * 24)).padStart(2, "0")}:00:00.000Z`,
        valor: rnd() * 1000 + 0.01,
      });
    }
  });

  afterAll(() => {
    vi.useRealTimers();
    console.log(`PARIDAD V1: ${comparaciones.length} comparaciones\n- ${[...new Set(comparaciones.map((c) => c.split(":")[0]))].join("\n- ")}`);
  });

  it("debe coincidir con V1 en el estado inicial cargado", async () => {
    await compararEstado("estado inicial");
  });

  it("debe coincidir con V1 en resumen TODO/MES/ANIO/desconocido con varios relojes", async () => {
    for (const ahora of [
      "2026-11-03T10:00:00.000Z", "2026-10-31T23:59:59.999Z", "2026-11-01T00:00:00.000Z",
      "2026-12-31T23:59:59.999Z", "2027-01-01T00:00:00.000Z", "2028-02-01T00:00:00.000Z", "2025-12-31T23:59:59.999Z",
    ]) {
      fijarReloj(ahora);
      for (const periodo of ["TODO", "MES", "ANIO", "mes", "X", undefined]) {
        const a = await V1.obtenerResumenFinanciero(periodo);
        const b = resultadoV2(await v2().resumen(criadero, periodo), (d) => d);
        paridad(`resumen ${String(periodo)} @${ahora}`, a, b.valor);
        expect(Object.keys(b.valor as object)).toStrictEqual(Object.keys(a));
      }
    }
    fijarReloj("2026-11-03T10:00:00.000Z");
  });

  it("debe coincidir con V1 en consolidado por categoria (todos los periodos y relojes)", async () => {
    for (const ahora of ["2026-11-03T10:00:00.000Z", "2026-10-31T23:59:59.999Z", "2027-01-01T00:00:00.000Z", "2025-12-31T23:59:59.999Z"]) {
      fijarReloj(ahora);
      for (const periodo of ["TODO", "MES", "ANIO", "otro", undefined]) {
        const a = await V1.obtenerConsolidadoCategorias(periodo);
        const b = resultadoV2(await v2().consolidadoCategorias(criadero, periodo), (d) => d.categorias);
        paridad(`consolidado categorias ${String(periodo)} @${ahora}`, JSON.parse(JSON.stringify(a)), JSON.parse(JSON.stringify(b.valor)));
      }
    }
    fijarReloj("2026-11-03T10:00:00.000Z");
  });

  it("debe coincidir con V1 en consolidado mensual con distintos limites", async () => {
    for (const limite of [undefined, 12, 0, "x", 3, 1, 500, -1, "5", null]) {
      const a = await V1.obtenerConsolidadoMensual(limite as any);
      const b = resultadoV2(await v2().consolidadoMensual(criadero, limite), (d) => d.meses);
      paridad(`consolidado mensual limite=${String(limite)}`, JSON.parse(JSON.stringify(a)), JSON.parse(JSON.stringify(b.valor)));
    }
  });

  it("debe coincidir con V1 en el listado de movimientos (orden y campos)", async () => {
    const a = (await V1.obtenerMovimientosFinancieros()).map((r: any) => norm("v1", r, "m"));
    const b = (resultadoV2(await v2().listarMovimientos(criadero), (d) => d.movimientos).valor as any[]).map((r) => norm("v2", r, "m"));

    expect(a.length).toBe(515);
    paridad("listado de movimientos (515 filas)", a, b);
  });

  it("debe coincidir con V1 en movimiento por id, venta por baja e historial vacio", async () => {
    for (const label of ["m1", "m2", "m3", "m4", "m6", "m15", "m400"]) {
      const a = norm("v1", await V1.obtenerMovimientoPorId(v1Id(label)), "m");
      const r = resultadoV2(await v2().obtenerMovimiento(criadero, v2Id(label)), (d) => d.movimiento);
      paridad(`movimiento por id ${label}`, a, r.ok ? norm("v2", r.valor, "m") : null);
    }
    const nada = await V1.obtenerMovimientoPorId(99999);
    paridad("movimiento por id inexistente", nada, resultadoV2(await v2().obtenerMovimiento(criadero, "nada"), (d) => d).ok ? "existe" : null);

    for (const label of ["b1", "b2", "b3", "b99"]) {
      const a = norm("v1", await V1.obtenerVentaPorBajaId(v1Id(label)), "b");
      const r = resultadoV2(await v2().obtenerVenta(criadero, v2Id(label)), (d) => d.venta);
      paridad(`venta por baja ${label}`, a, r.ok ? norm("v2", r.valor, "b") : null);
    }

    const h1 = await V1.obtenerHistorialMovimiento(1);
    const h2 = resultadoV2(await v2().historial(criadero, "m1"), (d) => d.historial).valor;
    paridad("historial sin correcciones / inexistente", h1, h2);
    paridad("historial de movimiento inexistente", await V1.obtenerHistorialMovimiento(99999), resultadoV2(await v2().historial(criadero, "nada"), (d) => d.historial).valor);
  });

  it("debe coincidir con V1 en altas manuales (resultado y estado)", async () => {
    const casos: Array<[string, "INGRESO" | "EGRESO", any]> = [
      ["ingreso completo", "INGRESO", { categoria: "VENTA_HUEVOS", valor: 12.5, detalle: "huevos", fecha: "2026-10-20T10:00:00.000Z" }],
      ["egreso solo valor", "EGRESO", { valor: 0.1 }],
      ["ingreso categoria vacia y valor 0", "INGRESO", { categoria: "", valor: 0, detalle: "", fecha: "" }],
      ["egreso valor negativo", "EGRESO", { categoria: "ALIMENTO", valor: -3.25, fecha: "2026-10-21T10:00:00.000Z" }],
      ["ingreso 19.99", "INGRESO", { valor: 19.99, detalle: "x" }],
      ["egreso 1234567.89", "EGRESO", { valor: 1234567.89 }],
      ["ingreso valor texto numerico", "INGRESO", { valor: "7.5" }],
    ];

    for (const [nombre, tipo, cuerpo] of casos) {
      fijarReloj("2026-11-03T10:00:00.000Z");
      const idV1 = await (tipo === "INGRESO" ? V1.registrarIngreso : V1.registrarEgreso)({ ...cuerpo });
      const r = resultadoV2(await v2().registrarManual(criadero, tipo, { ...cuerpo }), (d) => d.id);
      expect(r.ok, nombre).toBe(true);
      registrar("m", ++nMov, idV1, r.valor);
      expect(idV1).toBe(nMov);
      await compararEstado(`alta ${nombre}`);
    }
    // sin historial en altas
    paridad("alta no escribe historial", 0, (await filas("SELECT COUNT(*) AS n FROM movimientos_financieros_historial WHERE criadero_id = ?", criadero))[0].n);
  });

  it("debe coincidir con V1 en ediciones manuales (exitos y errores, en el orden de evaluacion)", async () => {
    const casos: Array<[string, string, any]> = [
      ["cambio completo", "m4", { tipo: "EGRESO", categoria: "ALIMENTO", valor: 12.5, detalle: " x ", fecha: "2026-10-05T00:00:00.000Z" }],
      ["sin cambios", "m4", { tipo: "EGRESO", categoria: "ALIMENTO", valor: 12.5, detalle: "x", fecha: "2026-10-05T00:00:00.000Z" }],
      ["campos vacios", "m5", { tipo: "otro", categoria: "", valor: 6.1, detalle: "  " }],
      ["origen NULL", "m15", { tipo: "INGRESO", categoria: "OTRO", valor: 0.3, detalle: "n" }],
      ["con ave vinculada", "m8", { tipo: "EGRESO", categoria: "ALIMENTO", valor: 0.7 }],
      ["automatico VENTA_AVE", "m1", { valor: 5 }],
      ["automatico ENVIO_AVE", "m2", { valor: 5 }],
      ["inexistente", "nada", { valor: 5 }],
      ["inexistente y valor 0", "nada", { valor: 0 }],
      ["automatico y valor 0", "m1", { valor: 0 }],
      ["valor 0", "m4", { valor: 0 }],
      ["valor abc", "m4", { valor: "abc" }],
      ["valor null", "m4", { valor: null }],
      ["valor negativo", "m4", { valor: -1 }],
      ["valor coma", "m4", { valor: "12,5" }],
      ["valor texto numerico", "m4", { valor: "8.25" }],
    ];

    for (const [nombre, label, cuerpo] of casos) {
      fijarReloj("2026-11-03T11:00:00.000Z");
      const a = await resultadoV1(() => V1.actualizarMovimientoManual({ id: label === "nada" ? 99999 : v1Id(label), ...cuerpo }));
      const b = resultadoV2(await v2().actualizarManual(criadero, v2Id(label), { ...cuerpo }), () => undefined);
      paridad(`edicion ${nombre}: resultado`, a.ok ? { ok: true, valor: undefined } : a, b.ok ? { ok: true, valor: undefined } : b);
      await compararEstado(`edicion ${nombre}`);
    }
    fijarReloj("2026-11-03T10:00:00.000Z");
  });

  it("debe coincidir con V1 en correcciones de venta (resultado, historial y bajas_ave)", async () => {
    const casos: Array<[string, string, any]> = [
      ["b1 con coma y envio vacio", "b1", { valorVenta: "120,50", valorEnvio: "" }],
      ["b2 sin movimiento de envio, envio 3.25", "b2", { valorVenta: 40.5, valorEnvio: 3.25 }],
      ["b2 otra vez", "b2", { valorVenta: 41, valorEnvio: 0 }],
      ["b1 decimales 19.99 y 0.1", "b1", { valorVenta: 19.99, valorEnvio: 0.1 }],
      ["b1 null y ausente", "b1", { valorVenta: null }],
      ["valor negativo", "b1", { valorVenta: -1, valorEnvio: 1 }],
      ["envio negativo", "b1", { valorVenta: 1, valorEnvio: -0.5 }],
      ["valor abc", "b1", { valorVenta: "abc" }],
      ["inexistente con valor invalido", "nada", { valorVenta: -1 }],
      ["inexistente", "nada", { valorVenta: 1 }],
      ["baja de muerte", "b3", { valorVenta: 1 }],
      ["b1 texto con espacios", "b1", { valorVenta: " 7,5 ", valorEnvio: "0" }],
    ];

    for (const [nombre, label, cuerpo] of casos) {
      fijarReloj("2026-11-03T12:00:00.000Z");
      const a = await resultadoV1(() => V1.corregirVentaFinanciera({ bajaId: label === "nada" ? 99999 : v1Id(label), ...cuerpo }));
      const b = resultadoV2(await v2().corregirVenta(criadero, v2Id(label), { ...cuerpo }), () => undefined);
      paridad(`correccion ${nombre}: resultado`, a.ok ? { ok: true, valor: undefined } : a, b.ok ? { ok: true, valor: undefined } : b);

      // el movimiento creado por la correccion recibe etiqueta en el mismo orden en ambas bases
      const cantV1 = v1db.sqlite.prepare("SELECT COUNT(*) AS n FROM movimientos_financieros").get().n as number;
      const cantV2 = (await filas("SELECT COUNT(*) AS n FROM movimientos_financieros WHERE criadero_id = ?", criadero))[0].n as number;
      expect(cantV2).toBe(cantV1);
      while (nMov < cantV1) {
        nMov++;
        registrar("m", nMov, nMov, (await filas("SELECT id FROM movimientos_financieros WHERE criadero_id = ? ORDER BY rowid LIMIT 1 OFFSET ?", criadero, nMov - 1))[0].id);
      }
      await compararEstado(`correccion ${nombre}`);
    }
    fijarReloj("2026-11-03T10:00:00.000Z");
  });

  it("debe coincidir con V1 con movimientos duplicados de la misma categoria (menor id)", async () => {
    await insertarMov({ tipo: "INGRESO", categoria: "VENTA_AVE", fecha: "2026-10-01T00:00:00.000Z", valor: 1, detalle: "dup", ave: 1, origenTipo: "VENTA_AVE", baja: 1 });
    fijarReloj("2026-11-03T13:00:00.000Z");
    const a = await resultadoV1(() => V1.corregirVentaFinanciera({ bajaId: 1, valorVenta: 77.7, valorEnvio: 2 }));
    const b = resultadoV2(await v2().corregirVenta(criadero, "b1", { valorVenta: 77.7, valorEnvio: 2 }), () => undefined);
    paridad("correccion con duplicado: resultado", a.ok ? { ok: true, valor: undefined } : a, b.ok ? { ok: true, valor: undefined } : b);
    await compararEstado("correccion con duplicado");
    fijarReloj("2026-11-03T10:00:00.000Z");
  });

  it("debe coincidir con V1 en el historial y las lecturas finales tras todas las operaciones", async () => {
    fijarReloj("2026-11-03T10:00:00.000Z");
    const idV2DeEtiqueta = (label: string) =>
      [...etiquetas.v2.entries()].find(([k, v]) => k.startsWith("m:") && v === label)![0].slice(2);

    const noVacios: Record<string, number> = {};

    for (const label of ["m1", "m2", "m3", "m4", "m5", "m15", "m523"]) {
      const a = (await V1.obtenerHistorialMovimiento(v1Id(label))).map((r: any) => norm("v1", r, "historial"));
      const r = resultadoV2(await v2().historial(criadero, idV2DeEtiqueta(label)), (d) => d.historial).valor as any[];
      noVacios[label] = a.length;
      paridad(`historial ${label}`, a, r.map((x) => norm("v2", x, "historial")));
    }

    // la comparacion no es vacua: los movimientos corregidos o editados tienen historial en V1
    for (const label of ["m1", "m2", "m3", "m4", "m523"]) expect(noVacios[label], label).toBeGreaterThan(0);
    // m4 recibe 3 ediciones validas (completa, sin cambios y valor texto "8.25")
    expect(noVacios.m4).toBe(3);
    expect(["CORRECCION_VENTA", "CORRECCION_ENVIO", "CREACION_POR_CORRECCION", "EDICION_MANUAL"].sort()).toEqual(
      [...new Set(v1db.sqlite.prepare("SELECT accion FROM movimientos_financieros_historial").all().map((r: any) => r.accion))].sort()
    );

    const movs = (await V1.obtenerMovimientosFinancieros()).map((r: any) => norm("v1", r, "m"));
    const movs2 = (resultadoV2(await v2().listarMovimientos(criadero), (d) => d.movimientos).valor as any[]).map((r) => norm("v2", r, "m"));
    paridad("listado final de movimientos", movs, movs2);

    for (const periodo of ["TODO", "MES", "ANIO"]) {
      paridad(`resumen final ${periodo}`, await V1.obtenerResumenFinanciero(periodo), resultadoV2(await v2().resumen(criadero, periodo), (d) => d).valor);
      paridad(`consolidado categorias final ${periodo}`,
        JSON.parse(JSON.stringify(await V1.obtenerConsolidadoCategorias(periodo))),
        JSON.parse(JSON.stringify(resultadoV2(await v2().consolidadoCategorias(criadero, periodo), (d) => d.categorias).valor)));
    }
    paridad("consolidado mensual final",
      JSON.parse(JSON.stringify(await V1.obtenerConsolidadoMensual(12))),
      JSON.parse(JSON.stringify(resultadoV2(await v2().consolidadoMensual(criadero, 12), (d) => d.meses).valor)));
    await compararEstado("estado final");
  });
});
