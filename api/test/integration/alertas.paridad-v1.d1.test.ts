import { describe, it, expect, vi } from "vitest";
import Database from "better-sqlite3";
import { AuthService } from "../../src/auth/auth.service";
import { D1AuthRepository } from "../../src/auth/auth.repository";
import { CriaderoService } from "../../src/criaderos/criaderos.service";
import { D1CriaderoRepository } from "../../src/criaderos/criaderos.repository";
import { D1AlertasRepository } from "../../src/alertas/alertas.repository";
import { AlertasService } from "../../src/alertas/alertas.service";
import { LocalD1Adapter } from "../helpers/local-d1.adapter";

/**
 * PARIDAD CON V1 (Alertas).
 *
 * Ejecuta el codigo REAL de V1 (src/repositories/AlertasRepository.js, sin modificarlo) sobre una base
 * better-sqlite3 en memoria con las tablas en forma V1 (aves, jaulas, alimentacion_jaula, bebida_jaula, huevos y
 * movimientos_financieros; DDL de src/database/migrations.js, con idx_aves_estado e idx_movimientos_fecha y
 * `codigo UNIQUE`, sin FK). Un adaptador minimo imita getAllAsync / getFirstAsync de expo-sqlite.
 * Intervenciones del arnes (las unicas): (1) `getDatabase` de V1 se sustituye con vi.mock; (2) los literales
 * 'now' y CURRENT_TIMESTAMP del SQL que recibe el adaptador se sustituyen por el instante fijo (mismo efecto
 * que el reloj inyectable de V2).
 *
 * Los MISMOS datos se cargan en la base V1 (ids enteros por orden de insercion) y en la D1 local de V2
 * (migraciones reales; ids TEXT con numeracion DECRECIENTE, para que el orden por id de texto NO coincida con
 * el de insercion y la prueba detecte un ORDER BY equivocado). V2 ademas tiene un SEGUNDO criadero con datos y
 * codigos repetidos que no se carga en V1. Unica normalizacion: entidadId (entero V1 <-> TEXT V2, se compara
 * por el numero de insercion).
 */

const holder = vi.hoisted(() => ({ db: null as any }));

vi.mock("../../../src/database/database", () => ({
  getDatabase: async () => holder.db,
}));

const V1: any = await import("../../../src/repositories/AlertasRepository.sqlite.js");

const AHORA = "2026-11-05T15:00:00.000Z";
const DIA = 86400000;
const jwtSecret = "integration-secret-key";

const DDL_V1 = `
  CREATE TABLE jaulas (
    id INTEGER PRIMARY KEY AUTOINCREMENT, codigo TEXT NOT NULL UNIQUE, nombre TEXT, ubicacion TEXT, tipo TEXT,
    estado_sanitario TEXT NOT NULL DEFAULT 'NORMAL', activa INTEGER NOT NULL DEFAULT 1,
    fecha_creacion TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP, fecha_desactivacion TEXT
  );
  CREATE TABLE aves (
    id INTEGER PRIMARY KEY AUTOINCREMENT, codigo TEXT NOT NULL UNIQUE, origen TEXT NOT NULL, jaula_actual_id INTEGER,
    estado TEXT NOT NULL DEFAULT 'ACTIVA', estado_salud TEXT DEFAULT 'SANA', fecha_ultimo_control_salud TEXT
  );
  CREATE TABLE alimentacion_jaula (
    id INTEGER PRIMARY KEY AUTOINCREMENT, jaula_id INTEGER NOT NULL, fecha TEXT NOT NULL, tipo TEXT NOT NULL,
    cantidad TEXT, detalle TEXT, fecha_creacion TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
  );
  CREATE TABLE bebida_jaula (
    id INTEGER PRIMARY KEY AUTOINCREMENT, jaula_id INTEGER NOT NULL, fecha TEXT NOT NULL, tipo TEXT NOT NULL,
    cantidad TEXT, detalle TEXT, fecha_creacion TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
  );
  CREATE TABLE huevos (
    id INTEGER PRIMARY KEY AUTOINCREMENT, codigo TEXT NOT NULL UNIQUE, ave_id INTEGER NOT NULL, jaula_id INTEGER,
    fecha TEXT NOT NULL, estado TEXT NOT NULL DEFAULT 'REGISTRADO', observacion TEXT
  );
  CREATE TABLE movimientos_financieros (
    id INTEGER PRIMARY KEY AUTOINCREMENT, tipo TEXT NOT NULL, categoria TEXT, fecha TEXT NOT NULL,
    valor REAL NOT NULL, detalle TEXT, ave_id INTEGER, origen_tipo TEXT, origen_id INTEGER
  );
  CREATE INDEX idx_aves_estado ON aves(estado);
  CREATE INDEX idx_movimientos_fecha ON movimientos_financieros(fecha);
`;

type Kind = "a" | "j" | "l" | "w" | "h" | "m";
const TABLAS: Record<Kind, string> = {
  a: "aves", j: "jaulas", l: "alimentacion_jaula", w: "bebida_jaula", h: "huevos", m: "movimientos_financieros",
};

/** id D1 con numeracion decreciente: el texto ordena al reves que la insercion. */
const id = (kind: Kind, n: number) => `${kind}${String(99999 - n).padStart(5, "0")}`;
const desid = (valor: string) => 99999 - Number(valor.slice(1));

class Entorno {
  v1 = new Database(":memory:");
  d1 = new LocalD1Adapter();
  n: Record<Kind, number> = { a: 0, j: 0, l: 0, w: 0, h: 0, m: 0 };
  nx = 0;
  A = "";
  B = "";
  adaptador: any;
  aveHuevera = 0;

  constructor(public ahora: string = AHORA) {
    this.v1.exec(DDL_V1);
    const v1 = this.v1;
    const fijo = `'${ahora}'`;
    const sub = (sql: string) => sql.replaceAll("'now'", fijo).replaceAll("CURRENT_TIMESTAMP", fijo);
    this.adaptador = {
      async getAllAsync(sql: string, params: unknown[] = []) {
        return v1.prepare(sub(sql)).all(...params);
      },
      async getFirstAsync(sql: string, params: unknown[] = []) {
        return v1.prepare(sub(sql)).get(...params) ?? null;
      },
    };
  }

  async iniciar(conHuevera = true) {
    this.A = await this.crearCriadero("a@alertas.paridad.test");
    this.B = await this.crearCriadero("b@alertas.paridad.test");
    if (conHuevera) this.aveHuevera = await this.ins("a", { codigo: "HUEVERA", origen: "X", estado: "VENDIDA", estado_salud: "SANA", fecha_ultimo_control_salud: null });
    return this;
  }

  private async crearCriadero(email: string) {
    const auth = new AuthService(new D1AuthRepository(this.d1 as any), jwtSecret);
    const usuario = await auth.register({ email, nombre: "Paridad", password: "Password123!" });
    if (!usuario.success) throw new Error("usuario");
    const criaderos = new CriaderoService(new D1CriaderoRepository(this.d1 as any));
    const c = await criaderos.createCriadero(usuario.data.user.id, {
      nombre: "Criadero Alertas", pais: "Ecuador", provincia: "Pichincha", ciudad: "Quito", telefono: "0999999999", correoContacto: email,
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
    return new AlertasService(new D1AlertasRepository(this.d1 as any), () => new Date(this.ahora));
  }
}

// ---- helpers de filas ----

const ave = (codigo: string, extra: Record<string, unknown> = {}) => ({
  codigo, origen: "NACIDA_CRIADERO", estado: "ACTIVA", estado_salud: "SANA", fecha_ultimo_control_salud: null, ...extra,
});
const jaula = (codigo: string, extra: Record<string, unknown> = {}) => ({
  codigo, nombre: null, estado_sanitario: "NORMAL", activa: 1, ...extra,
});
const cuidado = (jaula_id: number, fecha: string) => ({ jaula_id, fecha, tipo: "Maiz" });
const REFS_CUIDADO: Record<string, Kind> = { jaula_id: "j" };
const huevo = (codigo: string, ave_id: number, fecha: string) => ({ codigo, ave_id, jaula_id: null, fecha, estado: "REGISTRADO", observacion: null });
const REFS_HUEVO: Record<string, Kind> = { ave_id: "a" };
const mov = (tipo: string, valor: number, fecha: string) => ({ tipo, categoria: null, fecha, valor, detalle: null, ave_id: null, origen_tipo: null, origen_id: null });

const iso = (ms: number) => new Date(ms).toISOString();
const espacio = (ms: number) => iso(ms).slice(0, 19).replace("T", " ");
const sinZ = (ms: number) => iso(ms).slice(0, 23);
const conOffset = (ms: number) => `${iso(ms - 5 * 3600000).slice(0, 23)}-05:00`;
const FORMATOS: Array<[string, (ms: number) => string]> = [["iso", iso], ["espacio", espacio], ["sinZ", sinZ], ["offset", conOffset]];

// ---- comparacion ----

let comparaciones = 0;
let alertasTotales = 0;
const tiposVistos = new Set<string>();

async function comparar(e: Entorno, escenario: string) {
  holder.db = e.adaptador;
  const esperado: any[] = await V1.obtenerTodasLasAlertas();
  const r = await e.servicio().obtener(e.A);
  const obtenido = JSON.parse(JSON.stringify(r.data.alertas)).map((a: any) => ({
    ...a,
    entidadId: a.entidadId === null ? null : desid(a.entidadId),
  }));

  comparaciones++;
  alertasTotales += esperado.length;
  esperado.forEach((a) => tiposVistos.add(a.tipo));
  expect(obtenido, `${escenario}: obtenerTodasLasAlertas`).toStrictEqual(esperado);
  expect(obtenido.map((a: any) => Object.keys(a)), `${escenario}: claves y orden`).toStrictEqual(
    esperado.map((a) => Object.keys(a))
  );

  // las cuatro parciales de V1 contra el filtro por tipo del array unico
  const parciales: Array<[string, string]> = [
    ["obtenerAlertasSalud", "SALUD"], ["obtenerAlertasJaulas", "JAULA"],
    ["obtenerAlertasProduccion", "PRODUCCION"], ["obtenerAlertasFinanzas", "FINANZAS"],
  ];
  for (const [fn, tipo] of parciales) {
    comparaciones++;
    expect(obtenido.filter((a: any) => a.tipo === tipo), `${escenario}: ${fn}`).toStrictEqual(await V1[fn]());
  }

  // resumen: V1 vs la formula del cliente REST
  const resumen = await V1.obtenerResumenAlertas();
  comparaciones++;
  expect({
    total: obtenido.length,
    criticas: obtenido.filter((a: any) => a.nivel === "ALTO").length,
    advertencias: obtenido.filter((a: any) => a.nivel === "MEDIO").length,
  }, `${escenario}: obtenerResumenAlertas`).toStrictEqual(resumen);

  return esperado;
}

// ---- escenarios ----

describe("Paridad con V1: Alertas", () => {
  it("debe coincidir en un criadero vacio (ALE-01, ALE-02)", async () => {
    const e = await new Entorno().iniciar(false);
    const a = await comparar(e, "vacio");

    expect(a.map((x) => x.tipo)).toEqual(["PRODUCCION"]);
  });

  it("debe coincidir con las cuatro categorias, ids no consecutivos y creacion intercalada (ALE-25, ALE-26, ALE-27)", async () => {
    const e = await new Entorno().iniciar();
    const t = Date.parse(AHORA);

    // salud y jaulas intercaladas; codigos desordenados (el orden alfabetico NO es el de insercion)
    const jZ = await e.ins("j", jaula("Z01"));
    await e.ins("a", ave("K9", { estado_salud: "EN_TRATAMIENTO", fecha_ultimo_control_salud: iso(t - 9 * DIA) }));
    const jB = await e.ins("j", jaula("B02"));
    await e.ins("a", ave("K1", { estado_salud: "EN_TRATAMIENTO", fecha_ultimo_control_salud: iso(t - 8 * DIA) }));
    await e.ins("j", jaula("m03", { activa: 0 }));
    const jA = await e.ins("j", jaula("A04"));
    await e.ins("a", ave("K5", { estado_salud: "EN_TRATAMIENTO", fecha_ultimo_control_salud: iso(t - 30 * DIA) }));
    await e.ins("a", ave("K3", { estado_salud: "EN_TRATAMIENTO", fecha_ultimo_control_salud: iso(t - 2 * DIA) }));
    await e.ins("a", ave("K7", { estado_salud: "EN_TRATAMIENTO", fecha_ultimo_control_salud: iso(t - 40 * DIA), estado: "FALLECIDA" }));
    await e.ins("a", ave("K2", { estado_salud: "EN_TRATAMIENTO", fecha_ultimo_control_salud: iso(t - 7.9 * DIA) }));

    await e.ins("l", cuidado(jB, iso(t - 1000)), REFS_CUIDADO);
    await e.ins("w", cuidado(jA, iso(t - 2000)), REFS_CUIDADO);
    await e.ins("w", cuidado(jZ, iso(t - DIA)), REFS_CUIDADO);
    await e.ins("m", mov("EGRESO", 10, iso(t - 1000)));
    await e.ins("m", mov("INGRESO", 4, iso(t - 2000)));

    const a = await comparar(e, "principal");

    expect(a.map((x) => x.tipo)).toEqual(["SALUD", "SALUD", "SALUD", "SALUD", "JAULA", "JAULA", "JAULA", "JAULA", "PRODUCCION", "FINANZAS"]);
    expect(a.slice(0, 4).map((x) => x.mensaje)).toEqual([
      "El ave K9 lleva 9 días en tratamiento.", "El ave K1 lleva 8 días en tratamiento.",
      "El ave K5 lleva 30 días en tratamiento.", "El ave K2 lleva 7 días en tratamiento.",
    ]);
    expect(a.slice(4, 8).map((x) => `${x.entidadId}:${x.accionDestino}`)).toEqual([
      `${jZ}:ALIMENTACION_JAULA`, `${jZ}:BEBIDA_JAULA`, `${jB}:BEBIDA_JAULA`, `${jA}:ALIMENTACION_JAULA`,
    ]);
  });

  it("debe coincidir en los bordes del umbral de 7 dias, en varios relojes y formatos de fecha (ALE-11..15)", async () => {
    const relojes = [
      "2026-11-05T15:00:00.000Z", "2026-11-05T00:00:00.000Z", "2026-11-05T23:59:59.999Z", "2026-11-05T12:34:56.789Z",
      "2026-11-05T03:07:09.001Z", "2026-03-31T23:59:59.999Z", "2026-12-01T00:00:00.000Z", "2026-11-05T06:30:00.250Z",
    ];
    const desplazamientos = [
      7 * DIA, 7 * DIA - 1, 7 * DIA + 1, 7 * DIA - 1000, 7 * DIA + 1000, 6 * DIA + 23 * 3600000 + 59 * 60000 + 59000,
      7.9 * DIA, 6.99 * DIA, 7.01 * DIA, 8 * DIA, 14 * DIA, 0, -DIA, 100 * DIA, 7 * DIA - 60000, 7 * DIA + 60000,
    ];
    let conAlerta = 0;
    let sinAlerta = 0;

    for (const reloj of relojes) {
      const e = await new Entorno(reloj).iniciar(false);
      const t = Date.parse(reloj);
      for (const [nombre, fmt] of FORMATOS) {
        for (const d of desplazamientos) {
          await e.ins("a", ave(`${nombre}-${e.n.a + 1}`, { estado_salud: "EN_TRATAMIENTO", fecha_ultimo_control_salud: fmt(t - d) }));
        }
      }
      await e.ins("a", ave("NULO", { estado_salud: "EN_TRATAMIENTO", fecha_ultimo_control_salud: null }));
      await e.ins("a", ave("INVALIDO", { estado_salud: "EN_TRATAMIENTO", fecha_ultimo_control_salud: "no es fecha" }));
      await e.ins("a", ave("VACIO", { estado_salud: "EN_TRATAMIENTO", fecha_ultimo_control_salud: "" }));
      await e.ins("a", ave("SOLO-FECHA", { estado_salud: "EN_TRATAMIENTO", fecha_ultimo_control_salud: iso(t - 9 * DIA).slice(0, 10) }));
      const a = await comparar(e, `umbral ${reloj}`);
      conAlerta += a.filter((x) => x.tipo === "SALUD").length;
      sinAlerta += e.n.a - a.filter((x) => x.tipo === "SALUD").length;
    }
    // el borde de 7,00 se cruza en ambos sentidos (hay alertas y no alertas)
    expect(conAlerta).toBeGreaterThan(0);
    expect(sinAlerta).toBeGreaterThan(0);
  });

  it("debe coincidir con aves no ACTIVA, otro estado de salud y jaulas inactivas (ALE-06, ALE-16, ALE-17)", async () => {
    const e = await new Entorno().iniciar();
    const t = Date.parse(AHORA);
    const viejo = iso(t - 20 * DIA);
    await e.ins("a", ave("V1", { estado: "VENDIDA", estado_salud: "EN_TRATAMIENTO", fecha_ultimo_control_salud: viejo }));
    await e.ins("a", ave("F1", { estado: "FALLECIDA", estado_salud: "EN_TRATAMIENTO", fecha_ultimo_control_salud: viejo }));
    await e.ins("a", ave("E1", { estado_salud: "ENFERMA", fecha_ultimo_control_salud: viejo }));
    await e.ins("a", ave("S1", { estado_salud: "SANA", fecha_ultimo_control_salud: viejo }));
    await e.ins("a", ave("N1", { estado_salud: null, fecha_ultimo_control_salud: viejo }));
    await e.ins("a", ave("R1", { estado_salud: "EN_TRATAMIENTO", fecha_ultimo_control_salud: iso(t - DIA) }));
    await e.ins("j", jaula("I1", { activa: 0 }));
    await e.ins("j", jaula("I2", { activa: 0 }));
    const a = await comparar(e, "no activas");

    expect(a.map((x) => x.tipo)).toEqual(["PRODUCCION"]);
  });

  it("debe coincidir con jaulas con alimentacion pero sin bebida y registros de otros dias, jaulas y criadero (ALE-03..09)", async () => {
    const e = await new Entorno().iniciar();
    const t = Date.parse(AHORA);
    const j1 = await e.ins("j", jaula("J01"));
    const j2 = await e.ins("j", jaula("J02"));
    const j3 = await e.ins("j", jaula("J03"));
    const j4 = await e.ins("j", jaula("J04"));
    const j5 = await e.ins("j", jaula("J05"));
    await e.ins("l", cuidado(j2, iso(t - 1000)), REFS_CUIDADO);
    await e.ins("l", cuidado(j3, iso(t - 1000)), REFS_CUIDADO);
    await e.ins("w", cuidado(j3, iso(t - 1000)), REFS_CUIDADO);
    await e.ins("l", cuidado(j4, iso(t - DIA)), REFS_CUIDADO);
    await e.ins("w", cuidado(j4, iso(t + DIA)), REFS_CUIDADO);
    await e.ins("l", cuidado(j5, "2026-11-05T22:00:00-05:00"), REFS_CUIDADO);
    await e.ins("w", cuidado(j5, "2026-11-05T00:00:00.000Z"), REFS_CUIDADO);
    await e.ins("l", cuidado(j1, "2026-11-04T23:59:59.999Z"), REFS_CUIDADO);
    await e.ins("w", cuidado(j1, "2026-11-06T00:00:00.000Z"), REFS_CUIDADO);

    // criadero B: jaulas, registros hoy y movimientos que no deben mezclarse
    const jb = await e.insB("j", { codigo: "J01", nombre: null, estado_sanitario: "NORMAL", activa: 1 });
    await e.insB("l", { jaula_id: jb, fecha: iso(t - 1000), tipo: "Maiz" });
    await e.insB("w", { jaula_id: jb, fecha: iso(t - 1000), tipo: "Agua" });
    await e.insB("m", mov("EGRESO", 999, iso(t - 1000)));

    const a = await comparar(e, "jaulas");

    expect(a.filter((x) => x.tipo === "JAULA").length).toBe(6);
  });

  it("debe coincidir en medianoche UTC y cambios de mes y de anio con registros a ambos lados (ALE-08, ALE-23, ALE-32)", async () => {
    const relojes = [
      "2026-11-05T23:59:59.999Z", "2026-11-06T00:00:00.000Z", "2026-11-30T23:59:59.999Z", "2026-12-01T00:00:00.000Z",
      "2026-12-31T23:59:59.999Z", "2027-01-01T00:00:00.000Z", "2028-02-29T12:00:00.000Z", "2026-11-05T00:00:00.000Z",
    ];
    for (const reloj of relojes) {
      const e = await new Entorno(reloj).iniciar();
      const t = Date.parse(reloj);
      const diaIni = Date.UTC(new Date(t).getUTCFullYear(), new Date(t).getUTCMonth(), new Date(t).getUTCDate());
      const mesIni = Date.UTC(new Date(t).getUTCFullYear(), new Date(t).getUTCMonth(), 1);
      const mesSig = Date.UTC(new Date(t).getUTCFullYear(), new Date(t).getUTCMonth() + 1, 1);
      const puntos = [diaIni - 1, diaIni, diaIni + DIA - 1, diaIni + DIA, mesIni - 1, mesIni, mesSig - 1, mesSig, t, t - 1, t + 1];
      for (const p of puntos) {
        const j = await e.ins("j", jaula(`J${e.n.j + 1}`));
        await e.ins("l", cuidado(j, iso(p)), REFS_CUIDADO);
        if (e.n.j % 2 === 0) await e.ins("w", cuidado(j, conOffset(p)), REFS_CUIDADO);
      }
      // huevos en un solo extremo cada vez, para que "hoy" cambie con el reloj
      await e.ins("h", huevo("H000001", e.aveHuevera, iso(diaIni - 1)), REFS_HUEVO);
      if (e.n.a % 2 === 1) await e.ins("h", huevo("H000002", e.aveHuevera, iso(diaIni + DIA)), REFS_HUEVO);
      // finanzas: un egreso por punto, un ingreso un poco menor en el mes del reloj
      for (const p of puntos) await e.ins("m", mov("EGRESO", 10, iso(p)));
      await e.ins("m", mov("INGRESO", 5, iso(mesIni)));
      await comparar(e, `medianoche ${reloj}`);
    }
  });

  it("debe coincidir en Produccion: huevos de hoy de cualquier ave, de ayer, de manana y con formatos (ALE-18, ALE-19)", async () => {
    const t = Date.parse(AHORA);
    const casos: Array<[string, string[]]> = [
      ["sin huevos", []],
      ["solo ayer", [iso(t - DIA)]],
      ["solo manana", [iso(t + DIA)]],
      ["hoy borde inicio", ["2026-11-05T00:00:00.000Z"]],
      ["hoy borde fin", ["2026-11-05T23:59:59.999Z"]],
      ["formato espacio hoy", ["2026-11-05 08:00:00"]],
      ["solo fecha hoy", ["2026-11-05"]],
      ["offset que cruza", ["2026-11-05T22:00:00-05:00"]],
      ["texto invalido", ["no es fecha"]],
    ];
    for (const [nombre, fechas] of casos) {
      const e = await new Entorno().iniciar();
      const fallecida = await e.ins("a", ave("FALL", { estado: "FALLECIDA" }));
      let i = 0;
      for (const f of fechas) await e.ins("h", huevo(`H${++i}`, i % 2 ? e.aveHuevera : fallecida, f), REFS_HUEVO);
      await e.insB("h", { codigo: "H1", ave_id: await e.insB("a", { codigo: "BB", origen: "X" }), fecha: iso(t - 1000), estado: "REGISTRADO" });
      await comparar(e, `produccion ${nombre}`);
    }
  });

  it("debe coincidir en Finanzas: iguales, solo egresos, solo ingresos, otros tipos, REAL dificiles y otros meses (ALE-20..24)", async () => {
    const t = Date.parse(AHORA);
    const hoy = iso(t - 1000);
    const casos: Array<[string, Array<[string, number, string]>]> = [
      ["0 = 0", []],
      ["iguales", [["INGRESO", 10, hoy], ["EGRESO", 10, hoy]]],
      ["solo egresos", [["EGRESO", 0.01, hoy]]],
      ["solo ingresos", [["INGRESO", 5, hoy]]],
      ["otro tipo", [["AJUSTE", 500, hoy], ["EGRESO", 1, "2026-10-31T23:59:59.999Z"]]],
      ["0.1+0.2 vs 0.3", [["INGRESO", 0.3, hoy], ["EGRESO", 0.1, hoy], ["EGRESO", 0.2, hoy]]],
      ["0.3 vs 0.1+0.2", [["EGRESO", 0.3, hoy], ["INGRESO", 0.1, hoy], ["INGRESO", 0.2, hoy]]],
      ["tres sumandos intercalados", [["EGRESO", 0.1, hoy], ["INGRESO", 0.7, hoy], ["EGRESO", 0.2, hoy], ["EGRESO", 0.4, hoy], ["INGRESO", 0.1, hoy]]],
      ["valores enormes", [["INGRESO", 1e16, hoy], ["INGRESO", 1, hoy], ["EGRESO", 1e16, hoy], ["EGRESO", 1, hoy], ["EGRESO", 1, hoy]]],
      ["valor negativo y cero", [["EGRESO", -5, hoy], ["INGRESO", 0, hoy]]],
      ["bordes de mes", [["EGRESO", 99, "2026-10-31T23:59:59.999Z"], ["EGRESO", 99, "2026-12-01T00:00:00.000Z"], ["INGRESO", 1, "2026-11-01T00:00:00.000Z"], ["EGRESO", 2, "2026-11-30T23:59:59.999Z"]]],
      ["formatos de fecha", [["EGRESO", 3, "2026-11-05 08:00:00"], ["INGRESO", 1, "2026-11"], ["EGRESO", 1, "no es fecha"]]],
    ];
    for (const [nombre, movs] of casos) {
      const e = await new Entorno().iniciar();
      for (const [tipo, valor, fecha] of movs) await e.ins("m", mov(tipo, valor, fecha));
      await e.insB("m", mov("EGRESO", 1e6, hoy));
      await comparar(e, `finanzas ${nombre}`);
    }

    // muchos movimientos con centavos
    const e = await new Entorno().iniciar();
    for (let i = 0; i < 400; i++) await e.ins("m", mov(i % 2 ? "INGRESO" : "EGRESO", (i * 37 % 1000) / 100 + 0.01 * (i % 7), iso(t - (i % 20) * 3600000)));
    await comparar(e, "finanzas muchos movimientos");
  });

  function mulberry32(a: number) {
    return () => {
      a |= 0; a = (a + 0x6d2b79f5) | 0;
      let x = Math.imul(a ^ (a >>> 15), 1 | a);
      x = (x + Math.imul(x ^ (x >>> 7), 61 | x)) ^ x;
      return ((x ^ (x >>> 14)) >>> 0) / 4294967296;
    };
  }

  it("debe coincidir con datos pseudoaleatorios en varias semillas y relojes (ALE-25)", async () => {
    const relojes = ["2026-11-05T15:00:00.000Z", "2026-11-05T23:59:59.999Z", "2026-11-30T00:00:00.000Z", "2026-11-06T00:00:00.000Z", "2026-11-05T11:11:11.111Z"];
    for (let semilla = 1; semilla <= 12; semilla++) {
      const rnd = mulberry32(semilla * 7919);
      const pick = <T,>(xs: T[]) => xs[Math.floor(rnd() * xs.length)];
      const reloj = relojes[semilla % relojes.length];
      const t = Date.parse(reloj);
      const e = await new Entorno(reloj).iniciar();
      const fecha = () => {
        const base = pick([0, -1, -999, -3600000, -DIA, -DIA + 1, DIA, 2 * DIA, -7 * DIA, -7 * DIA + 1, -7 * DIA - 1, -30 * DIA, -Math.floor(rnd() * 40 * DIA)]);
        const ms = t + base - Math.floor(rnd() * 3 * 3600000) * (rnd() < 0.3 ? 1 : 0);
        return pick(FORMATOS)[1](ms);
      };
      const jaulas: number[] = [];
      const aves: number[] = [e.aveHuevera];
      const pasos = 120 + Math.floor(rnd() * 80);
      for (let i = 0; i < pasos; i++) {
        const r = rnd();
        if (r < 0.14) {
          jaulas.push(await e.ins("j", jaula(`J${Math.floor(rnd() * 1e6)}-${i}`, { activa: rnd() < 0.8 ? 1 : 0 })));
        } else if (r < 0.34) {
          aves.push(await e.ins("a", ave(`K${Math.floor(rnd() * 1e6)}-${i}`, {
            estado: pick(["ACTIVA", "ACTIVA", "ACTIVA", "VENDIDA", "FALLECIDA"]),
            estado_salud: pick(["EN_TRATAMIENTO", "EN_TRATAMIENTO", "ENFERMA", "SANA", null]),
            fecha_ultimo_control_salud: rnd() < 0.1 ? null : fecha(),
          })));
        } else if (r < 0.54 && jaulas.length) {
          await e.ins(pick<Kind>(["l", "w"]), cuidado(pick(jaulas), fecha()), REFS_CUIDADO);
        } else if (r < 0.64) {
          await e.ins("h", huevo(`H${i}`, pick(aves), fecha()), REFS_HUEVO);
        } else {
          await e.ins("m", mov(pick(["INGRESO", "EGRESO", "EGRESO", "AJUSTE"]), Math.round(rnd() * 20000) / 100, fecha()));
        }
      }
      await comparar(e, `semilla ${semilla} reloj ${reloj}`);
    }
  });

  it("debe haber ejercitado los cuatro tipos de alerta y un numero relevante de comparaciones", () => {
    console.log(`ALERTAS paridad: ${comparaciones} comparaciones, ${alertasTotales} alertas comparadas`);

    expect([...tiposVistos].sort()).toEqual(["FINANZAS", "JAULA", "PRODUCCION", "SALUD"]);
    expect(comparaciones).toBeGreaterThan(100);
  });
});
