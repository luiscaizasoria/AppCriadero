import { describe, it, expect, vi } from "vitest";
import Database from "better-sqlite3";
import { AuthService } from "../../src/auth/auth.service";
import { D1AuthRepository } from "../../src/auth/auth.repository";
import { CriaderoService } from "../../src/criaderos/criaderos.service";
import { D1CriaderoRepository } from "../../src/criaderos/criaderos.repository";
import { D1ReportesRepository } from "../../src/reportes/reportes.repository";
import { ReportesService } from "../../src/reportes/reportes.service";
import { LocalD1Adapter } from "../helpers/local-d1.adapter";

/**
 * PARIDAD CON V1 (Reportes).
 *
 * Ejecuta el codigo REAL de V1 (src/repositories/ReportesRepository.sqlite.js, sin modificarlo) sobre una base
 * better-sqlite3 en memoria con las tablas en forma V1 (aves, jaulas, huevos, diagnosticos_ave, bajas_ave y
 * movimientos_financieros; DDL de src/database/migrations.js y siguientes, sin FK). Un adaptador minimo imita
 * getAllAsync / getFirstAsync de expo-sqlite. Intervenciones del arnes (las unicas): (1) `getDatabase` de V1
 * se sustituye con vi.mock; (2) el literal 'now' del SQL que recibe el adaptador se sustituye por el instante
 * fijo AHORA (mismo efecto que el reloj inyectable de V2).
 *
 * Los MISMOS datos se cargan en la base V1 (ids enteros por orden de insercion) y en la D1 local de V2
 * (migraciones reales; ids TEXT) y se comparan con toStrictEqual, Object.keys por fila (orden) y un viaje
 * JSON de las 10 funciones. V2 ademas tiene un SEGUNDO criadero con datos y codigos repetidos que no se carga
 * en V1. Unica normalizacion: OrigenId (entero en V1, TEXT en V2: se compara por posicion de insercion).
 * Cada escenario crea su propia base V1 y su propia D1.
 */

const holder = vi.hoisted(() => ({ db: null as any }));

vi.mock("../../../src/database/database", () => ({
  getDatabase: async () => holder.db,
}));

const V1: any = await import("../../../src/repositories/ReportesRepository.sqlite.js");

const AHORA = "2026-11-05T15:00:00.000Z";
const jwtSecret = "integration-secret-key";

const DDL_V1 = `
  CREATE TABLE jaulas (
    id INTEGER PRIMARY KEY AUTOINCREMENT, codigo TEXT NOT NULL UNIQUE, nombre TEXT, ubicacion TEXT, tipo TEXT,
    estado_sanitario TEXT NOT NULL DEFAULT 'NORMAL', activa INTEGER NOT NULL DEFAULT 1,
    fecha_creacion TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP, fecha_desactivacion TEXT
  );
  CREATE TABLE aves (
    id INTEGER PRIMARY KEY AUTOINCREMENT, codigo TEXT NOT NULL UNIQUE, origen TEXT NOT NULL, fecha_nacimiento TEXT,
    raza TEXT, caracteristicas TEXT, padre_id INTEGER, madre_id INTEGER, jaula_actual_id INTEGER,
    estado TEXT NOT NULL DEFAULT 'ACTIVA', estado_salud TEXT DEFAULT 'SANA', sexo TEXT,
    peso_gramos REAL, altura_cm REAL, largo_cm REAL
  );
  CREATE TABLE huevos (
    id INTEGER PRIMARY KEY AUTOINCREMENT, codigo TEXT NOT NULL UNIQUE, ave_id INTEGER NOT NULL, jaula_id INTEGER,
    fecha TEXT NOT NULL, estado TEXT NOT NULL DEFAULT 'REGISTRADO', observacion TEXT
  );
  CREATE TABLE diagnosticos_ave (
    id INTEGER PRIMARY KEY AUTOINCREMENT, ave_id INTEGER NOT NULL, fecha TEXT NOT NULL, enfermedad TEXT NOT NULL,
    estado TEXT NOT NULL DEFAULT 'ACTIVO'
  );
  CREATE TABLE bajas_ave (
    id INTEGER PRIMARY KEY AUTOINCREMENT, ave_id INTEGER NOT NULL, tipo TEXT NOT NULL, fecha TEXT NOT NULL,
    causa TEXT, celular TEXT, ciudad_destino TEXT, cooperativa_envio TEXT, comprador TEXT,
    valor_venta REAL, valor_envio REAL, detalle TEXT
  );
  CREATE TABLE movimientos_financieros (
    id INTEGER PRIMARY KEY AUTOINCREMENT, tipo TEXT NOT NULL, categoria TEXT, fecha TEXT NOT NULL,
    valor REAL NOT NULL, detalle TEXT, ave_id INTEGER, origen_tipo TEXT, origen_id INTEGER
  );
`;

type Kind = "a" | "j" | "h" | "d" | "b" | "m";
const TABLAS: Record<Kind, string> = {
  a: "aves", j: "jaulas", h: "huevos", d: "diagnosticos_ave", b: "bajas_ave", m: "movimientos_financieros",
};

const id = (kind: Kind, n: number) => `${kind}${String(n).padStart(5, "0")}`;
const numero = (valor: unknown) => (typeof valor === "string" ? Number(valor.slice(1)) : valor);

class Entorno {
  v1 = new Database(":memory:");
  d1 = new LocalD1Adapter();
  n: Record<Kind, number> = { a: 0, j: 0, h: 0, d: 0, b: 0, m: 0 };
  nx = 0;
  A = "";
  B = "";
  adaptador: any;

  constructor() {
    this.v1.exec(DDL_V1);
    const v1 = this.v1;
    const sub = (sql: string) => sql.replaceAll("'now'", `'${AHORA}'`);
    this.adaptador = {
      async getAllAsync(sql: string, params: unknown[] = []) {
        return v1.prepare(sub(sql)).all(...params);
      },
      async getFirstAsync(sql: string, params: unknown[] = []) {
        return v1.prepare(sub(sql)).get(...params) ?? null;
      },
    };
  }

  async iniciar() {
    this.A = await this.crearCriadero("a@reportes.paridad.test");
    this.B = await this.crearCriadero("b@reportes.paridad.test");
  }

  private async crearCriadero(email: string) {
    const auth = new AuthService(new D1AuthRepository(this.d1 as any), jwtSecret);
    const usuario = await auth.register({ email, nombre: "Paridad", password: "Password123!" });
    if (!usuario.success) throw new Error("usuario");
    const criaderos = new CriaderoService(new D1CriaderoRepository(this.d1 as any));
    const c = await criaderos.createCriadero(usuario.data.user.id, {
      nombre: "Criadero Reportes", pais: "Ecuador", provincia: "Pichincha", ciudad: "Quito", telefono: "0999999999", correoContacto: email,
    });
    if (!c.success) throw new Error("criadero");
    return c.data.id;
  }

  /** Inserta la misma fila en V1 (id entero) y en la D1 del criadero A (id TEXT con el mismo numero). */
  async ins(kind: Kind, fila: Record<string, unknown>, refs: Record<string, Kind> = {}): Promise<number> {
    const tabla = TABLAS[kind];
    const cols = Object.keys(fila);
    const n = ++this.n[kind];

    this.v1
      .prepare(`INSERT INTO ${tabla} (${cols.join(", ")}) VALUES (${cols.map(() => "?").join(", ")})`)
      .run(...cols.map((c) => fila[c]));

    const valores = cols.map((c) => {
      const ref = refs[c];
      return ref && fila[c] !== null && fila[c] !== undefined ? id(ref, fila[c] as number) : fila[c];
    });
    await this.d1
      .prepare(`INSERT INTO ${tabla} (id, criadero_id, ${cols.join(", ")}) VALUES (?, ?, ${cols.map(() => "?").join(", ")})`)
      .bind(id(kind, n), this.A, ...valores)
      .run();
    return n;
  }

  /** Fila solo en D1, criadero B (no existe en V1). Las referencias son ids D1 ya resueltos. */
  async insB(kind: Kind, fila: Record<string, unknown>): Promise<string> {
    const tabla = TABLAS[kind];
    const cols = Object.keys(fila);
    const nuevo = `${kind}x${String(++this.nx).padStart(4, "0")}`;
    await this.d1
      .prepare(`INSERT INTO ${tabla} (id, criadero_id, ${cols.join(", ")}) VALUES (?, ?, ${cols.map(() => "?").join(", ")})`)
      .bind(nuevo, this.B, ...cols.map((c) => fila[c]))
      .run();
    return nuevo;
  }

  servicio() {
    return new ReportesService(new D1ReportesRepository(this.d1 as any), () => new Date(AHORA));
  }
}

// ---- helpers de filas ----

const ave = (codigo: string, extra: Record<string, unknown> = {}) => ({
  codigo, origen: "NACIDA_CRIADERO", fecha_nacimiento: null, raza: null, caracteristicas: null,
  padre_id: null, madre_id: null, jaula_actual_id: null, estado: "ACTIVA", estado_salud: "SANA", sexo: null,
  peso_gramos: null, altura_cm: null, largo_cm: null, ...extra,
});
const REFS_AVE: Record<string, Kind> = { padre_id: "a", madre_id: "a", jaula_actual_id: "j" };

const jaula = (codigo: string, extra: Record<string, unknown> = {}) => ({
  codigo, nombre: null, ubicacion: null, tipo: null, estado_sanitario: "NORMAL", activa: 1,
  fecha_creacion: "2026-10-01T10:00:00.000Z", fecha_desactivacion: null, ...extra,
});

const huevo = (codigo: string, ave_id: number, fecha: string, extra: Record<string, unknown> = {}) => ({
  codigo, ave_id, jaula_id: null, fecha, estado: "REGISTRADO", observacion: null, ...extra,
});
const REFS_HUEVO: Record<string, Kind> = { ave_id: "a", jaula_id: "j" };

const diag = (ave_id: number, enfermedad: string, extra: Record<string, unknown> = {}) => ({
  ave_id, fecha: "2026-10-20T10:00:00.000Z", enfermedad, estado: "ACTIVO", ...extra,
});

const baja = (ave_id: number, extra: Record<string, unknown>) => ({
  ave_id, tipo: "VENTA", fecha: "2026-10-01T10:00:00.000Z", causa: null, celular: null, ciudad_destino: null,
  cooperativa_envio: null, comprador: null, valor_venta: null, valor_envio: null, detalle: null, ...extra,
});

const mov = (tipo: string, valor: number, fecha: string, extra: Record<string, unknown> = {}) => ({
  tipo, categoria: null, fecha, valor, detalle: null, ave_id: null, origen_tipo: null, origen_id: null, ...extra,
});
const REFS_MOV: Record<string, Kind> = { ave_id: "a", origen_id: "b" };

// ---- comparacion ----

let comparaciones = 0;

function normalizarFinanzas(filas: any[]) {
  return filas.map((f) => ({ ...f, OrigenId: numero(f.OrigenId) }));
}

async function compararTodo(e: Entorno, escenario: string) {
  holder.db = e.adaptador;
  const s = e.servicio();
  const A = e.A;

  const casos: Array<[string, () => Promise<any>, (d: any) => any]> = [
    ["obtenerReporteAves", () => s.aves(A), (d) => d],
    ["obtenerReporteSalud", () => s.salud(A), (d) => d],
    ["obtenerReporteProduccion", () => s.produccion(A), (d) => d],
    ["obtenerReporteFinanzas", () => s.finanzas(A), (d) => d],
    ["obtenerExportacionAves", () => s.exportarAves(A), (d) => d.filas],
    ["obtenerExportacionVentas", () => s.exportarVentas(A), (d) => d.filas],
    ["obtenerExportacionClientes", () => s.exportarClientes(A), (d) => d.filas],
    ["obtenerExportacionFinanzas", () => s.exportarFinanzas(A), (d) => normalizarFinanzas(d.filas)],
    ["obtenerExportacionHuevos", () => s.exportarHuevos(A), (d) => d.filas],
    ["obtenerExportacionJaulas", () => s.exportarJaulas(A), (d) => d.filas],
  ];

  for (const [nombre, v2, extraer] of casos) {
    const esperado = await V1[nombre]();
    const r = await v2();
    if (!r.success) throw new Error(nombre);
    const obtenido = extraer(r.data);
    const etiqueta = `${escenario}: ${nombre}`;

    comparaciones++;
    expect(obtenido, etiqueta).toStrictEqual(esperado);

    if (Array.isArray(esperado)) {
      expect(obtenido.map((f: any) => Object.keys(f)), `${etiqueta} (claves y orden)`).toStrictEqual(
        esperado.map((f: any) => Object.keys(f))
      );
    }

    // viaje por JSON: lo que ve el cliente es lo que V1 devolvia
    const viaje = JSON.parse(JSON.stringify(r.data));
    expect(extraer(viaje), `${etiqueta} (JSON)`).toStrictEqual(esperado);
  }
}

// ---- escenarios ----

async function cargarPrincipal(e: Entorno) {
  // jaulas: orden de insercion distinto del de codigo; mayuscula/minuscula (orden binario)
  const j10 = await e.ins("j", jaula("J10", { nombre: "Grande", ubicacion: "Patio", tipo: "REPRODUCCION", estado_sanitario: "CUARENTENA" }));
  const j02 = await e.ins("j", jaula("J02", { activa: 0, fecha_creacion: "2026-09-01 08:00:00", fecha_desactivacion: "2026-10-15T09:30:00.000Z" }));
  const j01 = await e.ins("j", jaula("J01", { nombre: "Uno", fecha_creacion: "2026-10-01 10:00:00" }));
  await e.ins("j", jaula("j05", { nombre: null, ubicacion: "", tipo: "", activa: 0 }));
  await e.ins("j", jaula("J03"));

  // aves: padres antes que hijos; codigos desordenados; REAL dificiles; NULL y 0
  const k010 = await e.ins("a", ave("K010", { sexo: "MACHO", raza: "Gigante", peso_gramos: 1234.5, fecha_nacimiento: "2024-01-15", jaula_actual_id: j10, caracteristicas: "Alto; fuerte \"campeon\"\nlinea 2" }), REFS_AVE);
  const k003 = await e.ins("a", ave("K003", { sexo: "HEMBRA", raza: "Fina", peso_gramos: 0.1 + 0.2, altura_cm: 2.675, largo_cm: 1e-7, fecha_nacimiento: "2024-03-02T00:00:00.000Z" }), REFS_AVE);
  await e.ins("a", ave("K007", { sexo: "HEMBRA", padre_id: k010, madre_id: k003, jaula_actual_id: j01, peso_gramos: 123456789.123456, altura_cm: 0, largo_cm: 0, origen: "COMPRADA" }), REFS_AVE);
  const k001 = await e.ins("a", ave("K001", { estado: "VENDIDA", sexo: "MACHO", peso_gramos: 0, altura_cm: null, jaula_actual_id: j02 }), REFS_AVE);
  const k002 = await e.ins("a", ave("K002", { estado: "FALLECIDA", estado_salud: "ENFERMA", padre_id: k010 }), REFS_AVE);
  const k004 = await e.ins("a", ave("K004", { estado_salud: "EN_TRATAMIENTO", madre_id: k003 }), REFS_AVE);
  const k006 = await e.ins("a", ave("K006", { estado_salud: "ENFERMA", jaula_actual_id: j10 }), REFS_AVE);
  const k008 = await e.ins("a", ave("K008", { estado_salud: "SANA" }), REFS_AVE);
  const k009 = await e.ins("a", ave("K009", { estado: "VENDIDA", estado_salud: "ENFERMA" }), REFS_AVE);
  const k011 = await e.ins("a", ave("K011", { estado_salud: null, padre_id: k010, madre_id: k003 }), REFS_AVE);
  await e.ins("a", ave("k012", { estado_salud: "EN_TRATAMIENTO" }), REFS_AVE);

  // diagnosticos: empates (cantidad 3 en B..F, solo caben 4), orden de insercion inverso, mayusculas, espacios,
  // aves de cualquier estado y diagnosticos no ACTIVO
  const enf = async (nombre: string, veces: number, ave: number, extra: Record<string, unknown> = {}) => {
    for (let i = 0; i < veces; i++) await e.ins("d", diag(ave, nombre, extra), { ave_id: "a" });
  };
  await enf("Newcastle", 3, k004);
  await enf("Bronquitis", 3, k006);
  await enf("Aspergilosis", 3, k002, { estado: "FINALIZADO" });
  await enf("Coriza", 3, k009);
  await enf("Bouba", 3, k008);
  await enf("Viruela", 5, k004);
  await enf("coriza", 1, k004);
  await enf("Coriza ", 1, k004);

  // huevos: hoy / mes / otros periodos / formatos de fecha; ave de baja; empates de fecha; mejor ponedora
  await e.ins("h", huevo("H000001", k006, "2026-11-05T00:00:00.000Z", { jaula_id: j10, observacion: "Normal; \"limpio\"" }), REFS_HUEVO);
  await e.ins("h", huevo("H000002", k006, "2026-11-05T23:59:59.999Z"), REFS_HUEVO);
  await e.ins("h", huevo("H000003", k006, "2026-11-01T00:00:00.000Z", { jaula_id: j01 }), REFS_HUEVO);
  await e.ins("h", huevo("H000004", k004, "2026-10-31T23:59:59.999Z"), REFS_HUEVO);
  await e.ins("h", huevo("H000005", k004, "2026-11-05 08:00:00", { estado: "ECLOSIONADO" }), REFS_HUEVO);
  await e.ins("h", huevo("H000006", k004, "2026-11-04T10:00:00.000Z", { jaula_id: j02 }), REFS_HUEVO);
  await e.ins("h", huevo("H000007", k004, "2026-12-05T10:00:00.000Z"), REFS_HUEVO);
  await e.ins("h", huevo("H000008", k004, "2025-11-05T10:00:00.000Z"), REFS_HUEVO);
  await e.ins("h", huevo("H000009", k006, "2026-11-04T10:00:00.000Z"), REFS_HUEVO);
  await e.ins("h", huevo("H000010", k001, "2026-11-05T09:00:00.000Z"), REFS_HUEVO);
  await e.ins("h", huevo("H000011", k002, "2026-11-05T09:00:00.000Z", { observacion: "" }), REFS_HUEVO);
  await e.ins("h", huevo("H000012", k009, "2026-11-05T09:00:00.000Z"), REFS_HUEVO);

  // ventas (bajas): fecha empatada, valores NULL y REAL, textos con espacios, MUERTE, celulares raros
  const b1 = await e.ins("b", baja(k001, { fecha: "2026-10-01T10:00:00.000Z", celular: "0991", comprador: " Ana ", ciudad_destino: "Quito", cooperativa_envio: "Servientrega", valor_venta: 12.5, valor_envio: 3.25, detalle: "Con; punto y coma\ny \"comillas\"" }), { ave_id: "a" });
  const b2 = await e.ins("b", baja(k009, { fecha: "2026-10-01T10:00:00.000Z", celular: "0991", comprador: "Ana", ciudad_destino: "  ", valor_venta: 0.1, valor_envio: null }), { ave_id: "a" });
  await e.ins("b", baja(k008, { fecha: "2026-10-01T10:00:00.000Z", celular: "0992", comprador: "zed", valor_venta: 0.2, valor_envio: 0.7 }), { ave_id: "a" });
  await e.ins("b", baja(k006, { fecha: "2026-10-01T10:00:00.000Z", celular: "0992", comprador: "Zed", ciudad_destino: "Loja", valor_venta: 0.3, valor_envio: 0.000001 }), { ave_id: "a" });
  await e.ins("b", baja(k004, { fecha: "2026-09-15T00:00:00.000Z", celular: "0993" }), { ave_id: "a" });
  await e.ins("b", baja(k004, { fecha: "2026-09-16T00:00:00.000Z", celular: "0993", comprador: "", ciudad_destino: "" }), { ave_id: "a" });
  await e.ins("b", baja(k004, { tipo: "MUERTE", fecha: "2026-09-20T00:00:00.000Z", causa: "Frio", celular: "0999", comprador: "Muerte", valor_venta: 50 }), { ave_id: "a" });
  await e.ins("b", baja(k003, { fecha: "2026-08-01T00:00:00.000Z", celular: null, comprador: "Sin celular", valor_venta: 5 }), { ave_id: "a" });
  await e.ins("b", baja(k003, { fecha: "2026-08-02T00:00:00.000Z", celular: " ", comprador: "Celular espacio", valor_venta: 6 }), { ave_id: "a" });
  await e.ins("b", baja(k003, { fecha: "2026-08-03T00:00:00.000Z", celular: "", comprador: "Celular vacio", valor_venta: 7 }), { ave_id: "a" });
  await e.ins("b", baja(k011, { fecha: "2026-07-01T00:00:00.000Z", celular: "0980", comprador: "Empate", valor_venta: 1 }), { ave_id: "a" });
  await e.ins("b", baja(k010, { fecha: "2026-07-01T00:00:00.000Z", celular: "0970", comprador: "Empate", valor_venta: 1 }), { ave_id: "a" });

  // movimientos: ingresos, egresos, otro tipo, REAL dificiles, misma fecha (par de venta), sin ave, origen
  await e.ins("m", mov("INGRESO", 0.1, "2026-10-01T10:00:00.000Z", { categoria: "VENTA", ave_id: k001, origen_tipo: "VENTA_AVE", origen_id: b1, detalle: "Venta ave" }), REFS_MOV);
  await e.ins("m", mov("INGRESO", 3.25, "2026-10-01T10:00:00.000Z", { categoria: "ENVIO", ave_id: k001, origen_tipo: "VENTA_AVE", origen_id: b1 }), REFS_MOV);
  await e.ins("m", mov("INGRESO", 0.2, "2026-10-01T10:00:00.000Z", { ave_id: k009, origen_tipo: "VENTA_AVE", origen_id: b2 }), REFS_MOV);
  await e.ins("m", mov("EGRESO", 0.7, "2026-10-02T00:00:00.000Z", { categoria: "ALIMENTO", detalle: "Maiz; \"premium\"" }), REFS_MOV);
  await e.ins("m", mov("EGRESO", 0.000001, "2026-10-02T00:00:00.000Z", { categoria: "OTROS", origen_tipo: "MANUAL" }), REFS_MOV);
  await e.ins("m", mov("AJUSTE", 100, "2026-10-03T00:00:00.000Z"), REFS_MOV);
  await e.ins("m", mov("INGRESO", 0.3, "2026-09-30T00:00:00.000Z", { ave_id: k008 }), REFS_MOV);
  await e.ins("m", mov("INGRESO", 1000000000000000.3, "2026-09-29T00:00:00.000Z"), REFS_MOV);
  await e.ins("m", mov("EGRESO", 0, "2026-09-29T00:00:00.000Z", { categoria: "CERO" }), REFS_MOV);
}

/** Datos solo de D1: criadero B con los mismos codigos y valores distintos en todas las tablas. */
async function cargarB(e: Entorno) {
  const jb = await e.insB("j", jaula("J01", { nombre: "AJENA", activa: 1 }));
  const jb2 = await e.insB("j", jaula("J10", { nombre: "AJENA 10", activa: 0 }));
  const pb = await e.insB("a", ave("K010", { sexo: "HEMBRA", peso_gramos: 9999, jaula_actual_id: jb }));
  const mb = await e.insB("a", ave("K003", { sexo: "MACHO", peso_gramos: 8888 }));
  const hijo = await e.insB("a", ave("K007", { padre_id: pb, madre_id: mb, jaula_actual_id: jb2, estado: "VENDIDA", estado_salud: "ENFERMA" }));
  const k4 = await e.insB("a", ave("K004", { estado_salud: "ENFERMA" }));
  for (let i = 0; i < 12; i++) {
    await e.insB("h", huevo(`H${String(i + 1).padStart(6, "0")}`, k4, "2026-11-05T10:00:00.000Z", { jaula_id: jb }));
    await e.insB("d", diag(k4, "Ajena"));
  }
  await e.insB("b", baja(hijo, { celular: "0991", comprador: "AJENO", ciudad_destino: "AJENA", valor_venta: 777, valor_envio: 77, fecha: "2027-01-01T00:00:00.000Z" }));
  await e.insB("b", baja(hijo, { celular: "0777", comprador: "SOLO AJENO", valor_venta: 1, fecha: "2027-01-02T00:00:00.000Z" }));
  await e.insB("m", mov("INGRESO", 5000, "2027-01-01T00:00:00.000Z", { ave_id: hijo }));
  await e.insB("m", mov("EGRESO", 4000, "2027-01-02T00:00:00.000Z"));
}

describe("Paridad con V1: ReportesRepository.js real contra la API", () => {
  it("debe coincidir con V1 en las 10 funciones con el escenario principal (REP-02..REP-20, REP-22)", async () => {
    const e = new Entorno();
    await e.iniciar();
    await cargarPrincipal(e);
    await cargarB(e);

    holder.db = e.adaptador;
    // el escenario es discriminante de verdad
    expect((await V1.obtenerExportacionAves()).length).toBeGreaterThan(10);
    expect((await V1.obtenerReporteProduccion()).mejor).not.toBeNull();
    expect((await V1.obtenerReporteSalud()).enfermedades).toHaveLength(5);

    await compararTodo(e, "principal");
  });

  it("debe dar los valores concretos de la spec igual que V1 (REP-03, 05, 06, 07, 11)", async () => {
    const e = new Entorno();
    await e.iniciar();
    await cargarPrincipal(e);
    await cargarB(e);
    holder.db = e.adaptador;
    const s = e.servicio();

    const salud: any = await s.salud(e.A);
    expect(salud.data.estado).toStrictEqual({ tratamiento: 2, enfermas: 1 });
    // Viruela 5 y los empates de 3 en orden de texto DESCENDENTE, como V1: Newcastle, Coriza, Bronquitis, Bouba
    // (Aspergilosis queda fuera). La spec proponia ascendente; V1 real hace lo contrario.
    expect(salud.data.enfermedades.map((x: any) => [x.enfermedad, x.cantidad])).toStrictEqual([
      ["Viruela", 5], ["Newcastle", 3], ["Coriza", 3], ["Bronquitis", 3], ["Bouba", 3],
    ]);
    const prod: any = await s.produccion(e.A);
    expect(prod.data.huevos).toStrictEqual({ hoy: 6, mes: 9 });
    expect(prod.data.mejor).toStrictEqual({ codigo: "K004", cantidad: 5 });
    const fin: any = await s.finanzas(e.A);
    expect(fin.data.utilidad).toBe(fin.data.ingresos - fin.data.egresos);

    await compararTodo(e, "concretos");
  });

  it("debe coincidir con V1 en los empates de mejor ponedora: gana la creada antes aunque sus huevos se registren despues (REP-09)", async () => {
    const e = new Entorno();
    await e.iniciar();
    await e.ins("j", jaula("J01"));
    const x = await e.ins("a", ave("K001"), REFS_AVE);
    const y = await e.ins("a", ave("K002"), REFS_AVE);
    const z = await e.ins("a", ave("K003", { estado: "VENDIDA" }), REFS_AVE);
    let h = 0;
    const cod = () => `H${String(++h).padStart(6, "0")}`;
    // los huevos de las aves creadas despues se insertan primero; 3 empatadas a 2 huevos
    for (const ave of [z, y, x, z, y, x]) {
      await e.ins("h", huevo(cod(), ave, "2026-11-05T10:00:00.000Z"), REFS_HUEVO);
    }
    await compararTodo(e, "empate-ponedora-1");

    // un desempate con ganadora clara por cantidad, ave dada de baja
    const w = await e.ins("a", ave("K004", { estado: "FALLECIDA" }), REFS_AVE);
    for (const ave of [w, w, w]) await e.ins("h", huevo(cod(), ave, "2026-10-05T10:00:00.000Z"), REFS_HUEVO);
    await compararTodo(e, "ponedora-baja");
  });

  it("debe coincidir con V1 en empates de enfermedades, insertadas en orden inverso, con mayusculas y acentos (REP-06)", async () => {
    const e = new Entorno();
    await e.iniciar();
    const a = await e.ins("a", ave("K001"), REFS_AVE);
    // 9 enfermedades empatadas a 2, insertadas en orden descendente; el puesto 5 decide quien entra
    for (const nombre of ["zeta", "Ñandu", "alfa", "Zeta", "Beta", "beta", "Alfa", "Épsilon", "gamma"]) {
      await e.ins("d", diag(a, nombre), { ave_id: "a" });
      await e.ins("d", diag(a, nombre), { ave_id: "a" });
    }
    await e.ins("d", diag(a, "Unica"), { ave_id: "a" });
    await e.ins("d", diag(a, "Unica"), { ave_id: "a" });
    await e.ins("d", diag(a, "Unica"), { ave_id: "a" });
    await compararTodo(e, "empate-enfermedades-1");

    // cantidades distintas: 7 enfermedades, 5 mayores en orden descendente (REP-05)
    const e2 = new Entorno();
    await e2.iniciar();
    const a2 = await e2.ins("a", ave("K001"), REFS_AVE);
    const cantidades: Array<[string, number]> = [["G", 1], ["F", 2], ["E", 3], ["D", 4], ["C", 5], ["B", 6], ["A", 7]];
    for (const [n, c] of cantidades) {
      for (let i = 0; i < c; i++) await e2.ins("d", diag(a2, n), { ave_id: "a" });
    }
    await compararTodo(e2, "top5-sin-empates");
    const s: any = await e2.servicio().salud(e2.A);
    expect(s.data.enfermedades.map((x: any) => x.enfermedad)).toStrictEqual(["A", "B", "C", "D", "E"]);
  });

  it("debe coincidir con V1 con muchas ventas de la misma fecha en orden de insercion mezclado (REP-15, REP-17, REP-18)", async () => {
    const e = new Entorno();
    await e.iniciar();
    await e.ins("j", jaula("J01"));
    const aves: number[] = [];
    for (let i = 1; i <= 8; i++) aves.push(await e.ins("a", ave(`K${String(i).padStart(3, "0")}`), REFS_AVE));
    // ventas, movimientos y huevos con la misma fecha, ave distinta cada vez y en desorden
    for (const [i, a] of [5, 2, 8, 1, 7, 3, 6, 4].entries()) {
      const b = await e.ins("b", baja(aves[a - 1], { fecha: "2026-10-10T10:00:00.000Z", celular: `099${i % 3}`, comprador: `C${i}`, valor_venta: i / 10, valor_envio: i % 2 ? 1 : null }), { ave_id: "a" });
      await e.ins("m", mov("INGRESO", i + 0.5, "2026-10-10T10:00:00.000Z", { ave_id: aves[a - 1], origen_tipo: "VENTA_AVE", origen_id: b }), REFS_MOV);
      await e.ins("h", huevo(`H${String(i + 1).padStart(6, "0")}`, aves[a - 1], "2026-10-10T10:00:00.000Z", { jaula_id: 1 }), REFS_HUEVO);
    }
    // otra fecha para comprobar el orden DESC entre fechas
    await e.ins("b", baja(aves[0], { fecha: "2026-10-11T10:00:00.000Z", celular: "0990", comprador: "Ultima" }), { ave_id: "a" });
    await compararTodo(e, "empates-fecha");
  });

  it("debe coincidir con V1 sin datos: ceros, enfermedades [], mejor null y filas [] aunque otro criadero tenga datos (REP-01, REP-21)", async () => {
    const e = new Entorno();
    await e.iniciar();
    await cargarB(e);
    holder.db = e.adaptador;

    expect(await V1.obtenerReporteAves()).toStrictEqual({ activas: 0, vendidas: 0, fallecidas: 0 });
    expect((await V1.obtenerReporteProduccion()).mejor).toBeNull();
    await compararTodo(e, "vacio");
  });

  it("debe dar los mismos resultados con otro reloj fijo (cambio de dia y de mes)", async () => {
    const e = new Entorno();
    await e.iniciar();
    const a = await e.ins("a", ave("K001"), REFS_AVE);
    let h = 0;
    for (const f of ["2026-10-31T23:59:59.999Z", "2026-11-01T00:00:00.000Z", "2026-11-05T00:00:00.000Z", "2026-11-05T23:59:59.999Z", "2026-11-06T00:00:00.000Z"]) {
      await e.ins("h", huevo(`H${String(++h).padStart(6, "0")}`, a, f), REFS_HUEVO);
    }
    await compararTodo(e, "reloj-base");

    // V2 con el reloj corrido un dia; V1 con 'now' corrido el mismo dia
    const otro = "2026-11-06T00:00:00.000Z";
    const v1Otro = {
      async getFirstAsync(sql: string, params: unknown[] = []) {
        return e.v1.prepare(sql.replaceAll("'now'", `'${otro}'`)).get(...params) ?? null;
      },
      async getAllAsync(sql: string, params: unknown[] = []) {
        return e.v1.prepare(sql.replaceAll("'now'", `'${otro}'`)).all(...params);
      },
    };
    holder.db = v1Otro;
    const esperado = await V1.obtenerReporteProduccion();
    const r: any = await new ReportesService(new D1ReportesRepository(e.d1 as any), () => new Date(otro)).produccion(e.A);

    expect(r.data).toStrictEqual(esperado);
    expect(r.data.huevos).toStrictEqual({ hoy: 1, mes: 4 });
  });

  it("debe coincidir con V1 en empates masivos y volumenes mayores con datos pseudoaleatorios (varias semillas)", async () => {
    for (const semilla of [1, 7, 42, 2026]) {
      let s = semilla;
      const azar = (max: number) => {
        s = (s * 1664525 + 1013904223) % 4294967296;
        return Math.floor((s / 4294967296) * max);
      };
      const e = new Entorno();
      await e.iniciar();
      await cargarB(e);

      const j = [] as number[];
      for (let i = 1; i <= 6; i++) j.push(await e.ins("j", jaula(`J${String(i).padStart(2, "0")}`, { activa: azar(2) }), REFS_AVE));
      const aves: number[] = [];
      for (let i = 1; i <= 40; i++) {
        const codigo = `K${String(azar(900) + 100)}-${i}`;
        aves.push(await e.ins("a", ave(codigo, {
          estado: ["ACTIVA", "VENDIDA", "FALLECIDA"][azar(3)],
          estado_salud: ["SANA", "ENFERMA", "EN_TRATAMIENTO", null][azar(4)],
          padre_id: i > 4 && azar(2) ? aves[azar(4)] : null,
          jaula_actual_id: azar(3) ? j[azar(6)] : null,
          peso_gramos: azar(3) ? azar(100000) / 100 : null,
        }), REFS_AVE));
      }
      const enfermedades = Array.from({ length: 30 }, (_, i) => `Enf-${String.fromCharCode(65 + (i * 7) % 26)}${i % 5}`);
      for (let i = 0; i < 150; i++) await e.ins("d", diag(aves[azar(40)], enfermedades[azar(30)]), { ave_id: "a" });
      const fechas = Array.from({ length: 12 }, (_, i) => `2026-11-0${(i % 9) + 1}T10:00:00.000Z`);
      for (let i = 1; i <= 250; i++) {
        await e.ins("h", huevo(`H${String(i).padStart(6, "0")}`, aves[azar(12)], fechas[azar(12)], { jaula_id: azar(3) ? j[azar(6)] : null }), REFS_HUEVO);
      }
      for (let i = 0; i < 60; i++) {
        const b = await e.ins("b", baja(aves[azar(40)], {
          tipo: azar(8) ? "VENTA" : "MUERTE", fecha: fechas[azar(12)], celular: azar(10) ? `09${azar(12)}` : null,
          comprador: azar(3) ? ["Ana", " ana", "Beto ", "", "Zed"][azar(5)] : null,
          ciudad_destino: azar(3) ? ["Quito", "Loja", " ", "cuenca"][azar(4)] : null,
          valor_venta: azar(4) ? azar(1000) / 10 : null, valor_envio: azar(3) ? azar(100) / 7 : null,
        }), { ave_id: "a" });
        await e.ins("m", mov(azar(5) ? ["INGRESO", "EGRESO"][azar(2)] : "AJUSTE", azar(100000) / 100, fechas[azar(12)], {
          ave_id: azar(2) ? aves[azar(40)] : null, origen_tipo: azar(2) ? "VENTA_AVE" : null, origen_id: azar(2) ? b : null,
        }), REFS_MOV);
      }
      await compararTodo(e, `aleatorio-${semilla}`);
    }
  });

  it("debe dejar el resumen de comparaciones realizadas", () => {
    expect(comparaciones).toBeGreaterThan(60);
    console.log(`Paridad Reportes: ${comparaciones} comparaciones (cada una con toStrictEqual, claves en orden y viaje JSON), 0 diferencias`);
  });
});
