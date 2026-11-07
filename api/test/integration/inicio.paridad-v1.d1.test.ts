import { describe, it, expect, vi } from "vitest";
import Database from "better-sqlite3";
import { AuthService } from "../../src/auth/auth.service";
import { D1AuthRepository } from "../../src/auth/auth.repository";
import { CriaderoService } from "../../src/criaderos/criaderos.service";
import { D1CriaderoRepository } from "../../src/criaderos/criaderos.repository";
import { D1InicioRepository } from "../../src/inicio/inicio.repository";
import { InicioService } from "../../src/inicio/inicio.service";
import { LocalD1Adapter } from "../helpers/local-d1.adapter";

/**
 * PARIDAD CON V1 (Inicio / dashboard).
 *
 * Ejecuta el codigo REAL de V1 (src/repositories/DashboardRepository.sqlite.js, sin modificarlo) sobre una base
 * better-sqlite3 en memoria con las tablas en forma V1 (aves, jaulas, huevos y movimientos_financieros; DDL de
 * src/database/migrations.js, con idx_aves_jaula, idx_aves_estado, idx_huevos_ave e idx_movimientos_fecha y
 * `codigo UNIQUE`, sin FK). Un adaptador minimo imita getAllAsync / getFirstAsync de expo-sqlite.
 * Intervenciones del arnes (las unicas): (1) `getDatabase` de V1 se sustituye con vi.mock; (2) el literal
 * 'now' del SQL que recibe el adaptador se sustituye por el instante fijo (mismo efecto que el reloj
 * inyectable de V2).
 *
 * Los MISMOS datos se cargan en la base V1 (ids enteros por orden de insercion) y en la D1 local de V2
 * (migraciones reales; ids TEXT con numeracion DECRECIENTE, para que el orden por id de texto NO coincida con
 * el de insercion y la prueba detecte un desempate equivocado). V2 ademas tiene un SEGUNDO criadero con datos
 * y codigos repetidos que no se carga en V1. La respuesta no contiene ids: no hay normalizacion alguna.
 */

const holder = vi.hoisted(() => ({ db: null as any }));

vi.mock("../../../src/database/database", () => ({
  getDatabase: async () => holder.db,
}));

const V1: any = await import("../../../src/repositories/DashboardRepository.sqlite.js");

const AHORA = "2026-11-05T15:00:00.000Z";
const DIA = 86400000;
const HORA = 3600000;
const jwtSecret = "integration-secret-key";

const DDL_V1 = `
  CREATE TABLE jaulas (
    id INTEGER PRIMARY KEY AUTOINCREMENT, codigo TEXT NOT NULL UNIQUE, nombre TEXT, ubicacion TEXT, tipo TEXT,
    estado_sanitario TEXT NOT NULL DEFAULT 'NORMAL', activa INTEGER NOT NULL DEFAULT 1,
    fecha_creacion TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP, fecha_desactivacion TEXT
  );
  CREATE TABLE aves (
    id INTEGER PRIMARY KEY AUTOINCREMENT, codigo TEXT NOT NULL UNIQUE, origen TEXT NOT NULL, raza TEXT,
    jaula_actual_id INTEGER, estado TEXT NOT NULL DEFAULT 'ACTIVA', estado_salud TEXT DEFAULT 'SANA'
  );
  CREATE TABLE huevos (
    id INTEGER PRIMARY KEY AUTOINCREMENT, codigo TEXT NOT NULL UNIQUE, ave_id INTEGER NOT NULL, jaula_id INTEGER,
    fecha TEXT NOT NULL, estado TEXT NOT NULL DEFAULT 'REGISTRADO', observacion TEXT
  );
  CREATE TABLE movimientos_financieros (
    id INTEGER PRIMARY KEY AUTOINCREMENT, tipo TEXT NOT NULL, categoria TEXT, fecha TEXT NOT NULL,
    valor REAL NOT NULL, detalle TEXT, ave_id INTEGER, origen_tipo TEXT, origen_id INTEGER
  );
  CREATE INDEX idx_aves_jaula ON aves(jaula_actual_id);
  CREATE INDEX idx_aves_estado ON aves(estado);
  CREATE INDEX idx_huevos_ave ON huevos(ave_id);
  CREATE INDEX idx_movimientos_fecha ON movimientos_financieros(fecha);
`;

type Kind = "a" | "j" | "h" | "m";
const TABLAS: Record<Kind, string> = { a: "aves", j: "jaulas", h: "huevos", m: "movimientos_financieros" };

/** id D1 con numeracion decreciente: el texto ordena al reves que la insercion. */
const id = (kind: Kind, n: number) => `${kind}${String(99999 - n).padStart(5, "0")}`;

class Entorno {
  v1 = new Database(":memory:");
  d1 = new LocalD1Adapter();
  n: Record<Kind, number> = { a: 0, j: 0, h: 0, m: 0 };
  nx = 0;
  A = "";
  B = "";
  adaptador: any;

  constructor(public ahora: string = AHORA) {
    this.v1.exec(DDL_V1);
    const v1 = this.v1;
    const sub = (sql: string) => sql.replaceAll("'now'", `'${ahora}'`);
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
    this.A = await this.crearCriadero("a@inicio.paridad.test");
    this.B = await this.crearCriadero("b@inicio.paridad.test");
    return this;
  }

  private async crearCriadero(email: string) {
    const auth = new AuthService(new D1AuthRepository(this.d1 as any), jwtSecret);
    const usuario = await auth.register({ email, nombre: "Paridad", password: "Password123!" });
    if (!usuario.success) throw new Error("usuario");
    const criaderos = new CriaderoService(new D1CriaderoRepository(this.d1 as any));
    const c = await criaderos.createCriadero(usuario.data.user.id, {
      nombre: "Criadero Inicio", pais: "Ecuador", provincia: "Pichincha", ciudad: "Quito", telefono: "0999999999", correoContacto: email,
    });
    if (!c.success) throw new Error("criadero");
    return c.data.id;
  }

  /** Inserta la misma fila en V1 (id entero) y en la D1 del criadero A (id TEXT decreciente). */
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

  /** Fila solo en D1, criadero B (no existe en V1). */
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
    return new InicioService(new D1InicioRepository(this.d1 as any), () => new Date(this.ahora));
  }
}

// ---- helpers de filas ----

const ave = (codigo: string, extra: Record<string, unknown> = {}) => ({
  codigo, origen: "NACIDA_CRIADERO", raza: "Kikiris", jaula_actual_id: null, estado: "ACTIVA", estado_salud: "SANA", ...extra,
});
const REFS_AVE: Record<string, Kind> = { jaula_actual_id: "j" };
const jaula = (codigo: string, activa = 1) => ({ codigo, nombre: null, estado_sanitario: "NORMAL", activa });
const huevo = (codigo: string, ave_id: number, fecha: string) => ({ codigo, ave_id, jaula_id: null, fecha, estado: "REGISTRADO", observacion: null });
const REFS_HUEVO: Record<string, Kind> = { ave_id: "a" };
const mov = (tipo: string, valor: number, fecha: string) => ({ tipo, categoria: null, fecha, valor, detalle: null, ave_id: null, origen_tipo: null, origen_id: null });

const iso = (ms: number) => new Date(ms).toISOString();
const espacio = (ms: number) => iso(ms).slice(0, 19).replace("T", " ");
const sinZ = (ms: number) => iso(ms).slice(0, 23);
const conOffset = (ms: number) => `${iso(ms - 5 * HORA).slice(0, 23)}-05:00`;
const soloFecha = (ms: number) => iso(ms).slice(0, 10);
const FORMATOS: Array<[string, (ms: number) => string]> = [
  ["iso", iso], ["espacio", espacio], ["sinZ", sinZ], ["offset", conOffset], ["fecha", soloFecha],
];

// ---- comparacion ----

let comparaciones = 0;
const desempatesMejor = new Set<string>();
let dashboardsConDatos = 0;

async function comparar(e: Entorno, escenario: string) {
  holder.db = e.adaptador;
  const esperado: any = await V1.obtenerDashboard();
  const r = await e.servicio().obtener(e.A);
  const obtenido = JSON.parse(JSON.stringify(r.data));

  comparaciones++;
  if (esperado.aves.activas > 0 || esperado.huevos.mes > 0) dashboardsConDatos++;
  expect(obtenido, `${escenario}: objeto completo`).toStrictEqual(esperado);
  expect(Object.keys(obtenido), `${escenario}: claves de la raiz`).toStrictEqual(Object.keys(esperado));
  for (const k of ["aves", "salud", "finanzas", "jaulas", "ocupacionJaulas", "huevos"]) {
    expect(Object.keys(obtenido[k]), `${escenario}: claves de ${k}`).toStrictEqual(Object.keys(esperado[k]));
  }
  for (const k of ["mejorPonedora", "horaPico"]) {
    if (esperado[k] !== null) expect(Object.keys(obtenido[k]), `${escenario}: claves de ${k}`).toStrictEqual(Object.keys(esperado[k]));
  }
  for (const k of ["produccionSemana", "avesPorRaza"]) {
    expect(obtenido[k].map((f: any) => Object.keys(f)), `${escenario}: claves de ${k}`).toStrictEqual(esperado[k].map((f: any) => Object.keys(f)));
  }
  expect(typeof obtenido.horaPico?.hora === "string" || obtenido.horaPico === null || obtenido.horaPico.hora === null).toBe(true);
  return esperado;
}

function mulberry32(a: number) {
  return () => {
    a |= 0; a = (a + 0x6d2b79f5) | 0;
    let x = Math.imul(a ^ (a >>> 15), 1 | a);
    x = (x + Math.imul(x ^ (x >>> 7), 61 | x)) ^ x;
    return ((x ^ (x >>> 14)) >>> 0) / 4294967296;
  };
}

// ---- escenarios ----

describe("Paridad con V1: Inicio (dashboard)", () => {
  it("debe coincidir en un criadero vacio (INI-01) y con otro criadero con datos que no se mezcla (INI-06, INI-23)", async () => {
    const e = await new Entorno().iniciar();
    const d = await comparar(e, "vacio");

    expect(d.mejorPonedora).toBeNull();
    expect(d.horaPico).toBeNull();
    expect(d.produccionSemana).toEqual([]);
    expect(d.ocupacionJaulas).toEqual({ porcentaje: 0 });

    // el criadero B tiene de todo; A sigue vacio y V1 (sin B) coincide
    const jb = await e.insB("j", jaula("J01"));
    const ab = await e.insB("a", { ...ave("K001"), jaula_actual_id: jb });
    await e.insB("h", { codigo: "H000001", ave_id: ab, jaula_id: null, fecha: iso(Date.parse(AHORA) - 1000), estado: "REGISTRADO" });
    await e.insB("m", mov("INGRESO", 99, iso(Date.parse(AHORA) - 1000)));
    await comparar(e, "vacio con B lleno");
  });

  it("debe coincidir con aves de todos los estados, salud solo de ACTIVAS y salud nula u otra (INI-02, INI-03)", async () => {
    const e = await new Entorno().iniciar();
    const estados = ["ACTIVA", "VENDIDA", "FALLECIDA", "OTRO"];
    const saludes = ["SANA", "EN_TRATAMIENTO", "ENFERMA", null, "", "RARA"];
    let i = 0;
    for (const estado of estados) for (const salud of saludes) {
      await e.ins("a", ave(`K${++i}`, { estado, estado_salud: salud }));
    }
    const d = await comparar(e, "estados");

    expect(d.aves.activas).toBe(6);
    expect(d.salud.sanas + d.salud.tratamiento + d.salud.enfermas).toBeLessThan(d.aves.activas);
  });

  it("debe coincidir con jaulas ocupadas, solo con aves no activas, vacias e inactivas (INI-04, INI-05)", async () => {
    const e = await new Entorno().iniciar();
    const j1 = await e.ins("j", jaula("J1"));
    const j2 = await e.ins("j", jaula("J2"));
    await e.ins("j", jaula("J3"));
    const j4 = await e.ins("j", jaula("J4", 0));
    await e.ins("a", ave("K1", { jaula_actual_id: j1 }), REFS_AVE);
    await e.ins("a", ave("K2", { jaula_actual_id: j2, estado: "VENDIDA" }), REFS_AVE);
    await e.ins("a", ave("K3", { jaula_actual_id: j2, estado: "FALLECIDA" }), REFS_AVE);
    await e.ins("a", ave("K4", { jaula_actual_id: j4 }), REFS_AVE);
    // aves del criadero B en jaulas propias no suman
    const jb = await e.insB("j", jaula("J1"));
    await e.insB("a", { ...ave("K1"), jaula_actual_id: jb });
    const d = await comparar(e, "jaulas");

    expect(d.jaulas).toEqual({ total: 3, ocupadas: 1 });
    expect(d.ocupacionJaulas.porcentaje).toBe(33.33);

    // 2 de 3 y 0 jaulas activas
    await e.ins("a", ave("K5", { jaula_actual_id: await e.ins("j", jaula("J5")) }), REFS_AVE);
    const d2 = await comparar(e, "jaulas 2/3");
    expect(d2.jaulas.total).toBe(4);

    const vacio = await new Entorno().iniciar();
    await vacio.ins("j", jaula("X", 0));
    expect((await comparar(vacio, "sin jaulas activas")).ocupacionJaulas).toEqual({ porcentaje: 0 });
  });

  it("debe coincidir en porcentajes de ocupacion con toFixed (INI-04)", async () => {
    for (const [total, ocupadas] of [[3, 2], [7, 1], [200, 1], [8, 1], [16, 1], [3, 3], [9, 4], [1, 0], [1, 1], [160, 1], [40, 1], [80, 1]]) {
      const e = await new Entorno().iniciar();
      for (let i = 0; i < total; i++) {
        const j = await e.ins("j", jaula(`J${i}`));
        if (i < ocupadas) await e.ins("a", ave(`K${i}`, { jaula_actual_id: j }), REFS_AVE);
      }
      await comparar(e, `ocupacion ${ocupadas}/${total}`);
    }
  });

  it("debe coincidir con razas: mayusculas, espacios, vacias, NULL y 'Sin raza' literal (INI-20, INI-22)", async () => {
    const e = await new Entorno().iniciar();
    const razas: Array<string | null> = [
      "Kikiris", "kikiris", " Kikiris ", "", "   ", null, "Sin raza", " Sin raza ", "\t", "Ñandú", "Zorzal", "angora", "Angora", "Zorzal",
    ];
    let i = 0;
    for (const r of razas) await e.ins("a", ave(`K${++i}`, { raza: r }));
    await e.ins("a", ave("V1", { raza: "Vendida", estado: "VENDIDA" }));
    await e.ins("a", ave("F1", { raza: "Fallecida", estado: "FALLECIDA" }));
    await e.insB("a", ave("K1", { raza: "OtroCriadero" }));
    const d = await comparar(e, "razas");

    expect(d.totalRazas).toBe(d.avesPorRaza.length);
    expect(d.avesPorRaza.some((r: any) => r.raza === "Vendida")).toBe(false);
  });

  it("debe coincidir en porcentajes redondeados de razas (INI-21)", async () => {
    const reparto: number[][] = [[1, 1, 1], [2, 1], [1, 6], [1, 1, 1, 1, 1, 1, 1], [3, 3, 1], [5, 1, 1, 1, 1, 1], [1], [7, 13, 41], [1, 199]];
    for (const r of reparto) {
      const e = await new Entorno().iniciar();
      let i = 0;
      for (let k = 0; k < r.length; k++) for (let c = 0; c < r[k]; c++) await e.ins("a", ave(`K${++i}`, { raza: `R${k}` }));
      await comparar(e, `razas ${r.join("/")}`);
    }
  });

  it("debe coincidir en finanzas del mes: bordes, otros tipos, REAL dificiles y muchos movimientos (INI-07, INI-08, INI-09)", async () => {
    const t = Date.parse(AHORA);
    const hoy = iso(t - 1000);
    const casos: Array<[string, Array<[string, number, string]>]> = [
      ["sin movimientos", []],
      ["solo egresos", [["EGRESO", 0.01, hoy]]],
      ["solo ingresos", [["INGRESO", 5, hoy]]],
      ["bordes de mes", [
        ["INGRESO", 1, "2026-10-31T23:59:59.999Z"], ["INGRESO", 2, "2026-11-01T00:00:00.000Z"],
        ["EGRESO", 3, "2026-11-30T23:59:59.999Z"], ["EGRESO", 4, "2026-12-01T00:00:00.000Z"], ["AJUSTE", 500, hoy],
      ]],
      ["0.1+0.2 vs 0.3", [["INGRESO", 0.3, hoy], ["EGRESO", 0.1, hoy], ["EGRESO", 0.2, hoy]]],
      ["0.3 vs 0.1+0.2", [["EGRESO", 0.3, hoy], ["INGRESO", 0.1, hoy], ["INGRESO", 0.2, hoy]]],
      ["tres sumandos intercalados", [["EGRESO", 0.1, hoy], ["INGRESO", 0.7, hoy], ["EGRESO", 0.2, hoy], ["EGRESO", 0.4, hoy], ["INGRESO", 0.1, hoy]]],
      ["valores enormes", [["INGRESO", 1e16, hoy], ["INGRESO", 1, hoy], ["INGRESO", 1, hoy], ["EGRESO", 1e16, hoy], ["EGRESO", 1, hoy]]],
      ["negativo y cero", [["EGRESO", -5, hoy], ["INGRESO", 0, hoy]]],
      ["formatos", [["EGRESO", 3, "2026-11-05 08:00:00"], ["INGRESO", 1, "2026-11"], ["EGRESO", 1, "no es fecha"], ["INGRESO", 2, "2026-11-05T22:00:00-05:00"]]],
      ["utilidad 0.3-0.1", [["INGRESO", 0.3, hoy], ["EGRESO", 0.1, hoy]]],
    ];
    for (const [nombre, movs] of casos) {
      const e = await new Entorno().iniciar();
      for (const [tipo, valor, fecha] of movs) await e.ins("m", mov(tipo, valor, fecha));
      await e.insB("m", mov("EGRESO", 1e6, hoy));
      await comparar(e, `finanzas ${nombre}`);
    }

    for (const semilla of [1, 2, 3]) {
      const rnd = mulberry32(semilla * 104729);
      const e = await new Entorno().iniciar();
      for (let i = 0; i < 600; i++) {
        const valor = [Math.round(rnd() * 100000) / 100, (i * 37 % 1000) / 100 + 0.01 * (i % 7), 0.1 * (i % 9), rnd() * 3][i % 4];
        await e.ins("m", mov(i % 2 ? "INGRESO" : "EGRESO", valor, iso(t - Math.floor(rnd() * 20) * HORA)));
      }
      await comparar(e, `finanzas muchos ${semilla}`);
    }
  });

  it("debe coincidir en huevos hoy y mes: bordes del dia, otro mes, otro anio y futuros (INI-10, INI-11)", async () => {
    const fechas = [
      "2026-11-05T00:00:00.000Z", "2026-11-05T23:59:59.999Z", "2026-11-04T23:59:59.999Z", "2026-11-06T00:00:00.000Z",
      "2026-10-31T23:59:59.999Z", "2026-12-01T00:00:00.000Z", "2025-11-05T12:00:00.000Z", "2026-11-30T23:59:59.999Z",
      "2026-11-01T00:00:00.000Z", "2026-11-05 08:00:00", "2026-11-05", "2026-11-05T22:00:00-05:00", "no es fecha",
    ];
    for (const reloj of ["2026-11-05T15:00:00.000Z", "2026-11-05T23:59:59.999Z", "2026-11-05T00:00:00.000Z", "2026-11-06T00:00:00.000Z"]) {
      const e = await new Entorno(reloj).iniciar();
      const a = await e.ins("a", ave("K1"));
      let i = 0;
      for (const f of fechas) await e.ins("h", huevo(`H${++i}`, a, f), REFS_HUEVO);
      await comparar(e, `huevos ${reloj}`);
    }
  });

  it("debe coincidir en mejor ponedora con aves no activas, de cualquier fecha y sin huevos en otras aves (INI-12)", async () => {
    const e = await new Entorno().iniciar();
    const v = await e.ins("a", ave("VEN", { estado: "VENDIDA" }));
    const f = await e.ins("a", ave("FALL", { estado: "FALLECIDA" }));
    const k = await e.ins("a", ave("KAC"));
    await e.ins("a", ave("SIN-HUEVOS"));
    let i = 0;
    for (let c = 0; c < 4; c++) await e.ins("h", huevo(`H${++i}`, v, iso(Date.parse(AHORA) - (100 + c) * DIA)), REFS_HUEVO);
    for (let c = 0; c < 2; c++) await e.ins("h", huevo(`H${++i}`, f, iso(Date.parse(AHORA) - c * HORA)), REFS_HUEVO);
    await e.ins("h", huevo(`H${++i}`, k, iso(Date.parse(AHORA))), REFS_HUEVO);
    const d = await comparar(e, "mejor ponedora no activa");

    expect(d.mejorPonedora).toEqual({ codigo: "VEN", cantidad: 4 });
  });

  it("debe coincidir en los empates de mejor ponedora con aves y huevos insertados en distinto orden (INI-13)", async () => {
    const t = Date.parse(AHORA);
    const patrones: Array<{ nombre: string; aves: string[]; huevos: number[] }> = [
      { nombre: "2 aves, huevos intercalados", aves: ["B", "A"], huevos: [1, 0, 1, 0] },
      { nombre: "3 aves, huevos de la ultima primero", aves: ["Z", "M", "A"], huevos: [2, 2, 1, 1, 0, 0] },
      { nombre: "3 aves, huevos de la primera al final", aves: ["Z", "M", "A"], huevos: [1, 1, 2, 2, 0, 0] },
      { nombre: "3 aves, primera al final", aves: ["C", "B", "A"], huevos: [1, 2, 0, 2, 1, 0] },
      { nombre: "4 aves, 1 huevo cada una en orden inverso", aves: ["D", "A", "C", "B"], huevos: [3, 2, 1, 0] },
      { nombre: "4 aves, 1 huevo cada una en orden directo", aves: ["D", "A", "C", "B"], huevos: [0, 1, 2, 3] },
      { nombre: "2 empatadas y una con menos", aves: ["Q", "P", "R"], huevos: [2, 0, 1, 0, 1, 1, 0] },
      { nombre: "empate: gana el codigo menor aunque no sea la primera ave ni el primer huevo", aves: ["Z", "M", "Q"], huevos: [2, 0, 1, 2, 1, 0] },
      { nombre: "empate: codigo menor con huevos al final", aves: ["M", "Z", "C"], huevos: [1, 1, 0, 0, 2, 2] },
      { nombre: "empate 5 aves aleatorio", aves: ["E", "D", "C", "B", "A"], huevos: [4, 3, 3, 0, 1, 2, 4, 0, 1, 2] },
    ];
    for (const p of patrones) {
      const e = await new Entorno().iniciar();
      const ids: number[] = [];
      for (const c of p.aves) ids.push(await e.ins("a", ave(`K-${c}`)));
      let i = 0;
      for (const idx of p.huevos) await e.ins("h", huevo(`H${++i}`, ids[idx], iso(t - i * 1000)), REFS_HUEVO);
      const d = await comparar(e, `empate ${p.nombre}`);
      desempatesMejor.add(d.mejorPonedora.codigo);
    }
  });

  it("debe coincidir en la hora pico: texto de 2 digitos, empates y huevos insertados en distinto orden (INI-14)", async () => {
    const dia = Date.UTC(2026, 10, 5);
    const patrones: Array<{ nombre: string; horas: number[] }> = [
      { nombre: "8 y 14 empatadas, 8 primero", horas: [8, 8, 14, 14] },
      { nombre: "14 y 8 empatadas, 14 primero", horas: [14, 14, 8, 8] },
      { nombre: "intercaladas", horas: [14, 8, 14, 8] },
      { nombre: "tres horas empatadas", horas: [20, 3, 11, 20, 3, 11] },
      { nombre: "23 y 0", horas: [23, 0, 23, 0] },
      { nombre: "una sola", horas: [7] },
      { nombre: "gana la mayor", horas: [9, 9, 9, 1, 1, 22] },
      { nombre: "empate a 1 en orden inverso", horas: [23, 12, 5, 0] },
    ];
    for (const p of patrones) {
      const e = await new Entorno().iniciar();
      const a = await e.ins("a", ave("K1"));
      let i = 0;
      for (const h of p.horas) await e.ins("h", huevo(`H${++i}`, a, iso(dia + h * HORA + i * 60000)), REFS_HUEVO);
      const d = await comparar(e, `hora pico ${p.nombre}`);
      expect(typeof d.horaPico.hora).toBe("string");
      expect(d.horaPico.hora).toHaveLength(2);
    }
  });

  it("debe coincidir en la ventana de 7 dias, el orden por dia de la semana y formatos de fecha (INI-15, INI-16)", async () => {
    const dia0 = Date.UTC(2026, 10, 5);
    for (const reloj of ["2026-11-05T15:00:00.000Z", "2026-11-05T00:00:00.000Z", "2026-11-05T23:59:59.999Z"]) {
      for (const [nombre, fmt] of FORMATOS) {
        const e = await new Entorno(reloj).iniciar();
        const a = await e.ins("a", ave("K1"));
        let i = 0;
        // dias -8 a +0, uno o dos huevos por dia (dos en los pares), a 00:00 y 23:59:59.999
        for (let d = -8; d <= 0; d++) {
          await e.ins("h", huevo(`H${++i}`, a, fmt(dia0 + d * DIA)), REFS_HUEVO);
          if (d % 2 === 0) await e.ins("h", huevo(`H${++i}`, a, fmt(dia0 + d * DIA + DIA - 1)), REFS_HUEVO);
        }
        const dash = await comparar(e, `ventana ${nombre} ${reloj}`);
        if (nombre === "iso") expect(dash.produccionSemana.length).toBeGreaterThan(0);
      }
    }
  });

  it("debe coincidir con huevos de fecha futura que comparten dia de la semana con un dia pasado (INI-17)", async () => {
    const dia0 = Date.UTC(2026, 10, 5);
    for (const futuro of [1, 2, 3, 7, 8, 30]) {
      const e = await new Entorno().iniciar();
      const a = await e.ins("a", ave("K1"));
      let i = 0;
      for (const d of [0, -1, -3, -6, futuro, futuro]) await e.ins("h", huevo(`H${++i}`, a, iso(dia0 + d * DIA + 5 * HORA)), REFS_HUEVO);
      await comparar(e, `futuro +${futuro}`);
    }
  });

  it("debe coincidir al cruzar la medianoche y los cambios de mes y de anio con varios relojes (INI-18, INI-27)", async () => {
    const relojes = [
      "2026-11-05T23:59:59.999Z", "2026-11-06T00:00:00.000Z", "2026-11-30T23:59:59.999Z", "2026-12-01T00:00:00.000Z",
      "2026-12-31T23:59:59.999Z", "2027-01-01T00:00:00.000Z", "2028-02-29T12:00:00.000Z", "2028-03-01T00:00:00.000Z",
      "2026-03-01T00:00:00.000Z", "2026-11-05T00:00:00.000Z",
    ];
    for (const reloj of relojes) {
      const e = await new Entorno(reloj).iniciar();
      const t = Date.parse(reloj);
      const f = new Date(t);
      const diaIni = Date.UTC(f.getUTCFullYear(), f.getUTCMonth(), f.getUTCDate());
      const mesIni = Date.UTC(f.getUTCFullYear(), f.getUTCMonth(), 1);
      const mesSig = Date.UTC(f.getUTCFullYear(), f.getUTCMonth() + 1, 1);
      const puntos = [diaIni - 1, diaIni, diaIni + DIA - 1, diaIni + DIA, mesIni - 1, mesIni, mesSig - 1, mesSig, t, t - 1, t + 1,
        diaIni - 5 * DIA, diaIni - 6 * DIA, diaIni - 6 * DIA - 1, diaIni - 7 * DIA];
      const a = await e.ins("a", ave("K1"));
      const b = await e.ins("a", ave("K2"));
      let i = 0;
      for (const p of puntos) {
        await e.ins("h", huevo(`H${++i}`, i % 3 ? a : b, iso(p)), REFS_HUEVO);
        if (i % 2) await e.ins("h", huevo(`H${++i}`, b, conOffset(p)), REFS_HUEVO);
        await e.ins("m", mov(i % 2 ? "INGRESO" : "EGRESO", 10 + i / 10, iso(p)));
      }
      await comparar(e, `medianoche ${reloj}`);
    }
  });

  it("debe coincidir con una fecha no interpretable que pasa el filtro textual (INI-19)", async () => {
    const e = await new Entorno().iniciar();
    const a = await e.ins("a", ave("K1"));
    await e.ins("h", huevo("H1", a, "2026-11-05 basura"), REFS_HUEVO);
    await e.ins("h", huevo("H2", a, "2026-11-05T10:00:00.000Z"), REFS_HUEVO);
    const d = await comparar(e, "basura con huevo valido");
    expect(d.produccionSemana.length).toBeGreaterThan(1);

    const solo = await new Entorno().iniciar();
    const a2 = await solo.ins("a", ave("K1"));
    await solo.ins("h", huevo("H1", a2, "2026-11-05 basura"), REFS_HUEVO);
    await solo.ins("h", huevo("H2", a2, "2026-11-05 basura"), REFS_HUEVO);
    await comparar(solo, "solo basura");

    const antigua = await new Entorno().iniciar();
    const a3 = await antigua.ins("a", ave("K1"));
    await antigua.ins("h", huevo("H1", a3, "zzz"), REFS_HUEVO);
    await antigua.ins("h", huevo("H2", a3, "2026-11-05T10:00:00.000Z"), REFS_HUEVO);
    await comparar(antigua, "texto invalido sin filtro textual / con hora pico");
  });

  it("debe coincidir con datos pseudoaleatorios en varias semillas y relojes (INI-25)", async () => {
    const relojes = [
      "2026-11-05T15:00:00.000Z", "2026-11-05T23:59:59.999Z", "2026-11-30T00:00:00.000Z", "2026-11-06T00:00:00.000Z",
      "2026-12-31T23:59:59.999Z", "2028-02-29T12:00:00.000Z", "2026-11-05T11:11:11.111Z",
    ];
    for (let semilla = 1; semilla <= 40; semilla++) {
      const rnd = mulberry32(semilla * 7919);
      const pick = <T,>(xs: T[]) => xs[Math.floor(rnd() * xs.length)];
      const reloj = relojes[semilla % relojes.length];
      const t = Date.parse(reloj);
      const inicioDia = Date.UTC(new Date(t).getUTCFullYear(), new Date(t).getUTCMonth(), new Date(t).getUTCDate());
      const e = await new Entorno(reloj).iniciar();

      const fecha = () => {
        const dias = pick([0, 0, -1, -2, -3, -4, -5, -6, -7, -8, 1, 2, 3, -20, -40, -400]);
        const hora = pick([3, 8, 8, 14, 14, 20, 23, 0]);
        const ms = inicioDia + dias * DIA + hora * HORA + pick([0, 59999, 1000 * Math.floor(rnd() * 3600)]);
        return pick(FORMATOS)[1](ms);
      };

      const jaulas: number[] = [];
      const aves: number[] = [];
      const pasos = 60 + Math.floor(rnd() * 120);
      let h = 0;
      for (let i = 0; i < pasos; i++) {
        const r = rnd();
        if (r < 0.12) {
          jaulas.push(await e.ins("j", jaula(`J${i}`, rnd() < 0.8 ? 1 : 0)));
        } else if (r < 0.3) {
          aves.push(await e.ins("a", ave(`K${rnd().toString(36).slice(2, 6)}-${i}`, {
            estado: pick(["ACTIVA", "ACTIVA", "ACTIVA", "VENDIDA", "FALLECIDA"]),
            estado_salud: pick(["SANA", "EN_TRATAMIENTO", "ENFERMA", null]),
            raza: pick(["Kikiris", "Kikiris", "Orpington", " Orpington ", "", null, "   ", "Sin raza", "angora", "Angora"]),
            jaula_actual_id: jaulas.length && rnd() < 0.6 ? pick(jaulas) : null,
          }), REFS_AVE));
        } else if (r < 0.7 && aves.length) {
          await e.ins("h", huevo(`H${++h}`, pick(aves), fecha()), REFS_HUEVO);
        } else {
          await e.ins("m", mov(pick(["INGRESO", "EGRESO", "EGRESO", "AJUSTE"]), Math.round(rnd() * 20000) / 100, fecha()));
        }
      }
      await comparar(e, `semilla ${semilla} reloj ${reloj}`);
    }
  }, 180000);

  it("debe coincidir con el volumen grande (60 jaulas, 300 aves, 2000 huevos, 2000 movimientos) y empates abundantes (INI-26)", async () => {
    const e = await new Entorno().iniciar();
    const t = Date.parse(AHORA);
    const inicioDia = Date.UTC(2026, 10, 5);
    const jaulas: number[] = [];
    for (let i = 1; i <= 60; i++) jaulas.push(await e.ins("j", jaula(`J${String(i).padStart(3, "0")}`, i % 10 ? 1 : 0)));
    const aves: number[] = [];
    const razas = ["Kikiris", "Orpington", "Sultan", "", null, "Brahma", "Silkie"];
    for (let i = 1; i <= 300; i++) {
      aves.push(await e.ins("a", ave(`K${String((i * 7) % 1000).padStart(4, "0")}-${i}`, {
        raza: razas[i % razas.length],
        estado: i % 25 === 0 ? "VENDIDA" : i % 31 === 0 ? "FALLECIDA" : "ACTIVA",
        estado_salud: ["SANA", "EN_TRATAMIENTO", "ENFERMA"][i % 3],
        jaula_actual_id: i % 4 ? jaulas[i % 60] : null,
      }), REFS_AVE));
    }
    for (let i = 1; i <= 2000; i++) {
      await e.ins("h", huevo(`H${String(i).padStart(6, "0")}`, aves[(i * 13) % 300], iso(inicioDia - (i % 12) * DIA + (i % 24) * HORA + (i % 60) * 60000)), REFS_HUEVO);
      await e.ins("m", mov(i % 3 ? "EGRESO" : "INGRESO", 1 + (i % 17) * 0.37, iso(t - (i % 90) * DIA)));
    }
    await comparar(e, "volumen grande");
  }, 120000);

  it("debe haber ejercitado un numero relevante de comparaciones y empates", () => {
    console.log(`INICIO paridad: ${comparaciones} comparaciones, ${dashboardsConDatos} con datos; mejores ponedoras vistas: ${[...desempatesMejor].join(",")}`);

    expect(comparaciones).toBeGreaterThan(100);
    expect(desempatesMejor.size).toBeGreaterThan(2);
  });
});
