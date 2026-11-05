import { describe, it, expect, beforeAll, vi } from "vitest";
import Database from "better-sqlite3";
import { AuthService } from "../../src/auth/auth.service";
import { D1AuthRepository } from "../../src/auth/auth.repository";
import { CriaderoService } from "../../src/criaderos/criaderos.service";
import { D1CriaderoRepository } from "../../src/criaderos/criaderos.repository";
import { D1ClientesRepository } from "../../src/clientes/clientes.repository";
import { ClientesService } from "../../src/clientes/clientes.service";
import { LocalD1Adapter } from "../helpers/local-d1.adapter";

/**
 * PARIDAD CON V1 (Clientes).
 *
 * Ejecuta el codigo REAL de V1 (src/repositories/ClientesRepository.sqlite.js, sin modificarlo) sobre una
 * base better-sqlite3 en memoria con las tablas aves y bajas_ave en forma V1 (DDL de
 * src/database/migrations.js y migrationV5.js). Un adaptador minimo imita getAllAsync / getFirstAsync de
 * expo-sqlite. Unica intervencion del arnes: `getDatabase` de V1 se sustituye con vi.mock.
 *
 * Los MISMOS datos se cargan en la base V1 (ids enteros por orden de insercion) y en la D1 local de V2
 * (migraciones reales; ids TEXT ordenados por insercion) y se comparan con toStrictEqual: obtenerClientes,
 * obtenerClientePorCelular (todos los celulares, incluidos inexistentes, ' ' y NULL-like) y
 * obtenerComprasCliente. V2 ademas tiene un SEGUNDO criadero con ventas a los mismos celulares (no cargadas
 * en V1) para comprobar que no se mezclan. Unicas normalizaciones: claves camelCase -> snake_case (aSnake de
 * la app) y venta_id / ave_id (entero en V1, TEXT con el mismo numero de orden en V2).
 */

const holder = vi.hoisted(() => ({ db: null as any }));

vi.mock("../../../src/database/database", () => ({
  getDatabase: async () => holder.db,
}));

const V1: any = await import("../../../src/repositories/ClientesRepository.sqlite.js");

const v1 = new Database(":memory:");
v1.exec(`
  CREATE TABLE aves (id INTEGER PRIMARY KEY AUTOINCREMENT, codigo TEXT NOT NULL UNIQUE, raza TEXT, sexo TEXT, foto_uri TEXT);
  CREATE TABLE bajas_ave (
    id INTEGER PRIMARY KEY AUTOINCREMENT, ave_id INTEGER NOT NULL, tipo TEXT NOT NULL, fecha TEXT NOT NULL,
    causa TEXT, celular TEXT, ciudad_destino TEXT, cooperativa_envio TEXT, comprador TEXT,
    valor_venta REAL, valor_envio REAL, detalle TEXT,
    fecha_creacion TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (ave_id) REFERENCES aves(id)
  );
  CREATE INDEX idx_bajas_ave_celular ON bajas_ave(celular);
`);
v1.pragma("foreign_keys = ON");
holder.db = {
  async getAllAsync(sql: string, params: unknown[] = []) {
    return v1.prepare(sql).all(...params);
  },
  async getFirstAsync(sql: string, params: unknown[] = []) {
    return v1.prepare(sql).get(...params) ?? null;
  },
};

const d1 = new LocalD1Adapter();
const jwtSecret = "integration-secret-key";

function aSnake(obj: any): any {
  if (obj === null || typeof obj !== "object") return obj;
  if (Array.isArray(obj)) return obj.map(aSnake);
  return Object.fromEntries(
    Object.entries(obj).map(([k, v]) => [k.replace(/[A-Z]/g, (c) => "_" + c.toLowerCase()), v])
  );
}

const comparaciones: string[] = [];

function paridad(nombre: string, esperadoV1: unknown, obtenidoV2: unknown) {
  comparaciones.push(nombre);
  expect(obtenidoV2, nombre).toStrictEqual(esperadoV1);
}

const idAve = (n: number) => `a${String(n).padStart(5, "0")}`;
const idVenta = (n: number) => `v${String(n).padStart(5, "0")}`;
const numero = (id: string) => Number(id.slice(1));

function normCompra(c: any) {
  return { ...c, venta_id: numero(c.venta_id), ave_id: numero(c.ave_id) };
}

let criadero: string;
let otro: string;
let servicio: ClientesService;
let nAve = 0;
let nVenta = 0;

async function crearCriadero(email: string) {
  const auth = new AuthService(new D1AuthRepository(d1 as any), jwtSecret);
  const usuario = await auth.register({ email, nombre: "Paridad", password: "Password123!" });
  if (!usuario.success) throw new Error("usuario");
  const criaderos = new CriaderoService(new D1CriaderoRepository(d1 as any));
  const c = await criaderos.createCriadero(usuario.data.user.id, {
    nombre: "Criadero Clientes", pais: "Ecuador", provincia: "Pichincha", ciudad: "Quito", telefono: "0999999999", correoContacto: email,
  });
  if (!c.success) throw new Error("criadero");
  return c.data.id;
}

/** Inserta un ave en V1 y en V2 (criadero dado) y devuelve su numero de orden. */
async function ave(codigo: string, raza: string | null, sexo: string | null, foto: string | null, criaderoId = criadero) {
  const n = ++nAve;
  if (criaderoId === criadero) {
    v1.prepare("INSERT INTO aves (codigo, raza, sexo, foto_uri) VALUES (?, ?, ?, ?)").run(codigo, raza, sexo, foto);
  }
  await d1.prepare(
    "INSERT INTO aves (id, criadero_id, codigo, origen, raza, sexo, foto_r2_key) VALUES (?, ?, ?, 'NACIDA_CRIADERO', ?, ?, ?)"
  ).bind(idAve(n), criaderoId, codigo, raza, sexo, foto).run();
  return n;
}

interface Venta {
  ave: number;
  tipo?: string;
  fecha: string;
  celular: string | null;
  comprador?: string | null;
  ciudad?: string | null;
  coop?: string | null;
  vv?: number | null;
  ve?: number | null;
  detalle?: string | null;
}

async function venta(v: Venta) {
  const n = ++nVenta;
  const vals = [v.ave, v.tipo ?? "VENTA", v.fecha, v.celular, v.ciudad ?? null, v.coop ?? null, v.comprador ?? null, v.vv ?? null, v.ve ?? null, v.detalle ?? null];
  v1.prepare(
    `INSERT INTO bajas_ave (ave_id, tipo, fecha, celular, ciudad_destino, cooperativa_envio, comprador, valor_venta, valor_envio, detalle)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
  ).run(...vals);
  await d1.prepare(
    `INSERT INTO bajas_ave (id, criadero_id, ave_id, tipo, fecha, celular, ciudad_destino, cooperativa_envio, comprador, valor_venta, valor_envio, detalle)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
  ).bind(idVenta(n), criadero, idAve(v.ave), ...vals.slice(1)).run();
}

/** Venta solo en V2, en otro criadero (no existe en V1). */
async function ventaAjena(aveN: number, v: Omit<Venta, "ave">) {
  const n = ++nVenta;
  await d1.prepare(
    `INSERT INTO bajas_ave (id, criadero_id, ave_id, tipo, fecha, celular, ciudad_destino, comprador, valor_venta, valor_envio)
     VALUES (?, ?, ?, 'VENTA', ?, ?, ?, ?, ?, ?)`
  ).bind(idVenta(n), otro, idAve(aveN), v.fecha, v.celular, v.ciudad ?? null, v.comprador ?? null, v.vv ?? null, v.ve ?? null).run();
}

// celulares que cubren los casos CLI-01..CLI-20 que dependen de datos
const CELULARES = [
  "0991234567", "0980000001", "0980000002", "0980000003", "0980000004", "0980000005", "0980000006",
  "0980000007", "0980000008", "0980000009", "+593 99 123 4567", "593991234567", "50%", "a/b", " 0991 ",
  " ", "", "MAYUS", "mayus", "0999999999", "0970000000", "no-existe",
];

describe("Paridad con V1: ClientesRepository.js real contra la API", () => {
  beforeAll(async () => {
    criadero = await crearCriadero("clientes.paridad@test.com");
    otro = await crearCriadero("clientes.paridad.otro@test.com");
    servicio = new ClientesService(new D1ClientesRepository(d1 as any));

    const a1 = await ave("K001", "Gallo Gigante", "MACHO", "file:///foto1.jpg");
    const a2 = await ave("K002", null, null, null);
    const a3 = await ave("K003", "Fina", "HEMBRA", null);
    const a4 = await ave("K004", "Fina", "OTRO", "file:///f4.jpg");
    const a5 = await ave("K005", "", "", "");
    const ajena = await ave("K001", "Fina", "MACHO", "file:///ajena.jpg", otro);

    // CLI-02 y CLI-13: dos/tres ventas, sin envio, valor 0, ave sin raza ni sexo
    await venta({ ave: a1, fecha: "2026-10-01T10:00:00.000Z", celular: "0991234567", comprador: "Ana", ciudad: "Quito", coop: "Servientrega", vv: 12.5, ve: 3.25, detalle: "primera" });
    await venta({ ave: a2, fecha: "2026-10-05T10:00:00.000Z", celular: "0991234567", comprador: "Ana", ciudad: "Quito", vv: 7.5, ve: null });
    await venta({ ave: a3, fecha: "2026-09-01T10:00:00.000Z", celular: "0991234567", comprador: "Ana Vieja", ciudad: "Loja", vv: 0, ve: 1 });

    // CLI-04: sumas REAL "dificiles" (orden de insercion fijo)
    await venta({ ave: a1, fecha: "2026-10-10T00:00:00.000Z", celular: "0980000001", comprador: "Suma", vv: 0.1, ve: 0.1 });
    await venta({ ave: a2, fecha: "2026-10-11T00:00:00.000Z", celular: "0980000001", comprador: "Suma", vv: 0.2, ve: 0.7 });
    await venta({ ave: a3, fecha: "2026-10-12T00:00:00.000Z", celular: "0980000001", comprador: "Suma", vv: 0.3, ve: 0.000001 });

    // CLI-03 y CLI-07: todo NULL, comprador NULL / '' / solo espacios
    await venta({ ave: a1, fecha: "2026-08-01T00:00:00.000Z", celular: "0980000002" });
    await venta({ ave: a2, fecha: "2026-08-02T00:00:00.000Z", celular: "0980000002", comprador: "", ciudad: "" });
    await venta({ ave: a3, fecha: "2026-08-03T00:00:00.000Z", celular: "0980000002", comprador: "   ", ciudad: "  " });

    // CLI-05: celular NULL, ' ' y '' no entran en el listado; una MUERTE con celular tampoco
    await venta({ ave: a4, fecha: "2026-07-01T00:00:00.000Z", celular: null, comprador: "Nulo", vv: 5 });
    await venta({ ave: a4, fecha: "2026-07-02T00:00:00.000Z", celular: " ", comprador: "Espacio", vv: 6 });
    await venta({ ave: a4, fecha: "2026-07-03T00:00:00.000Z", celular: "", comprador: "Vacio", vv: 7 });
    await venta({ ave: a4, tipo: "MUERTE", fecha: "2026-07-04T00:00:00.000Z", celular: "0970000000", comprador: "Muerte", vv: 8 });

    // CLI-06: la mas reciente sin comprador; una anterior con 'Ana' y otra mas antigua con 'Beto' (con espacios)
    await venta({ ave: a1, fecha: "2026-06-01T00:00:00.000Z", celular: "0980000003", comprador: " Beto ", ciudad: "Cuenca" });
    await venta({ ave: a2, fecha: "2026-06-02T00:00:00.000Z", celular: "0980000003", comprador: "Ana", ciudad: " Ambato " });
    await venta({ ave: a3, fecha: "2026-06-03T00:00:00.000Z", celular: "0980000003", comprador: null, ciudad: "" });

    // CLI-08: ultima ciudad vacia; otro celular sin ninguna ciudad
    await venta({ ave: a1, fecha: "2026-05-01T00:00:00.000Z", celular: "0980000004", comprador: "Cris", ciudad: "Guayaquil" });
    await venta({ ave: a2, fecha: "2026-05-02T00:00:00.000Z", celular: "0980000004", comprador: "Cris", ciudad: null });

    // CLI-09: misma fecha exacta, comprador y ciudad distintos: gana el id mayor
    await venta({ ave: a1, fecha: "2026-04-01T00:00:00.000Z", celular: "0980000005", comprador: "Primero", ciudad: "A" });
    await venta({ ave: a2, fecha: "2026-04-01T00:00:00.000Z", celular: "0980000005", comprador: "Segundo", ciudad: "B" });

    // CLI-10: tres clientes con ultima_compra distintas y dos empatadas (orden por celular)
    await venta({ ave: a1, fecha: "2026-03-01T00:00:00.000Z", celular: "0980000007", comprador: "Z" });
    await venta({ ave: a2, fecha: "2026-03-01T00:00:00.000Z", celular: "0980000006", comprador: "Y" });
    await venta({ ave: a3, fecha: "2026-03-01T00:00:00.000Z", celular: "0980000008", comprador: "X" });
    await venta({ ave: a3, fecha: "2026-03-15T00:00:00.000Z", celular: "0980000009", comprador: "W" });

    // CLI-12: celular con +, espacios, %, / y variantes sensibles (sin normalizar)
    await venta({ ave: a5, fecha: "2026-02-01T00:00:00.000Z", celular: "+593 99 123 4567", comprador: "Plus", ciudad: "Quito", vv: 10 });
    await venta({ ave: a5, fecha: "2026-02-02T00:00:00.000Z", celular: "593991234567", comprador: "SinPlus", vv: 11 });
    await venta({ ave: a5, fecha: "2026-02-03T00:00:00.000Z", celular: "50%", comprador: "Porciento", vv: 12 });
    await venta({ ave: a5, fecha: "2026-02-04T00:00:00.000Z", celular: "a/b", comprador: "Barra", vv: 13 });
    await venta({ ave: a5, fecha: "2026-02-05T00:00:00.000Z", celular: " 0991 ", comprador: "Espacios", vv: 14 });
    await venta({ ave: a5, fecha: "2026-02-06T00:00:00.000Z", celular: "MAYUS", comprador: "May", vv: 15 });
    await venta({ ave: a5, fecha: "2026-02-07T00:00:00.000Z", celular: "mayus", comprador: "min", vv: 16 });

    // CLI-15: la misma ave vendida dos veces al mismo celular
    await venta({ ave: a4, fecha: "2026-01-01T00:00:00.000Z", celular: "0999999999", comprador: "Doble", vv: 1.5, ve: 0.5 });
    await venta({ ave: a4, fecha: "2026-01-02T00:00:00.000Z", celular: "0999999999", comprador: "Doble", vv: 2.5 });

    // Aislamiento: el otro criadero vende a los mismos celulares con otros nombres/ciudades/importes
    await ventaAjena(ajena, { fecha: "2027-01-01T00:00:00.000Z", celular: "0991234567", comprador: "AJENO", ciudad: "AJENA", vv: 999, ve: 999 });
    await ventaAjena(ajena, { fecha: "2027-01-02T00:00:00.000Z", celular: "0980000003", comprador: "AJENO", ciudad: "AJENA", vv: 1 });
    await ventaAjena(ajena, { fecha: "2027-01-03T00:00:00.000Z", celular: "0980000099", comprador: "SOLO-AJENO", vv: 1 });
  });

  it("debe coincidir con V1 en obtenerClientes (formas, tipos, orden, SUM de NULL, nombre/ciudad)", async () => {
    const esperado = await V1.obtenerClientes();
    const r = await servicio.listar(criadero);

    expect(esperado.length).toBeGreaterThan(15);
    if (!r.success) throw new Error("listar");
    paridad("obtenerClientes", esperado, aSnake(r.data.clientes));
    expect(Object.keys(aSnake(r.data.clientes)[0]).sort()).toEqual(
      ["celular", "ciudad", "nombre", "total_compras", "total_envios", "total_ventas", "ultima_compra"]
    );
  });

  it("debe coincidir con V1 en obtenerClientePorCelular para cada celular, existente o no", async () => {
    for (const celular of CELULARES) {
      const esperado = await V1.obtenerClientePorCelular(celular);
      const r = await servicio.obtenerPorCelular(criadero, celular);
      if (!r.success) throw new Error("celular");

      paridad(`obtenerClientePorCelular(${JSON.stringify(celular)})`, esperado, aSnake(r.data.cliente));
    }
  });

  it("debe coincidir con V1 en obtenerComprasCliente para cada celular, existente o no", async () => {
    for (const celular of CELULARES) {
      const esperado = (await V1.obtenerComprasCliente(celular)) as any[];
      const r = await servicio.compras(criadero, celular);
      if (!r.success) throw new Error("compras");

      paridad(`obtenerComprasCliente(${JSON.stringify(celular)})`, esperado, aSnake(r.data.compras).map(normCompra));
    }
  });

  it("debe dar los casos concretos de la spec igual que V1 (CLI-02, 03, 06, 09, 12, 13)", async () => {
    const c = async (cel: string) => {
      const r = await servicio.obtenerPorCelular(criadero, cel);
      if (!r.success) throw new Error("x");
      return aSnake(r.data.cliente);
    };

    expect(await c("0991234567")).toMatchObject({ total_compras: 3, total_ventas: 20, total_envios: 4.25, nombre: "Ana", ciudad: "Quito" });
    expect(await c("0980000002")).toStrictEqual({
      celular: "0980000002", nombre: "Sin nombre", ciudad: "", total_compras: 3, total_ventas: 0, total_envios: 0, ultima_compra: "2026-08-03T00:00:00.000Z",
    });
    expect(await c("0980000003")).toMatchObject({ nombre: "Ana", ciudad: " Ambato " });
    expect(await c("0980000005")).toMatchObject({ nombre: "Segundo", ciudad: "B" });
    expect(await c("593991234567")).toMatchObject({ nombre: "SinPlus" });
    expect(await c("+593 99 123 4567")).toMatchObject({ nombre: "Plus" });
    expect(await c("+593991234567")).toBeNull();
    expect(await c("0980000099")).toBeNull();
  });

  it("debe dejar en la prueba el resumen de comparaciones realizadas", () => {
    // Se ejecuta tras las anteriores (mismo archivo, orden de declaracion).
    expect(comparaciones.length).toBeGreaterThan(40);
    console.log(`Paridad Clientes: ${comparaciones.length} comparaciones, 0 diferencias`);
  });
});
