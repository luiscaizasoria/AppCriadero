import { describe, it, expect, beforeAll } from "vitest";
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
 * Finanzas contra D1 local (SQLite en memoria con las migraciones 0001-0011).
 * Reloj fijo en cada prueba (nunca el real). Los importes con decimales se comparan con el
 * mismo SUM de SQLite y con la resta de JS, sin redondeos.
 */

const db = new LocalD1Adapter();
const jwtSecret = "integration-secret-key";
const AHORA = "2026-11-03T10:00:00.000Z";
const FECHA_VENTA = "2026-10-31T12:00:00.000Z";

let contador = 0;

async function crearCriadero(): Promise<string> {
  const email = `finanzas.${++contador}@test.com`;
  const auth = new AuthService(new D1AuthRepository(db as any), jwtSecret);
  const usuario = await auth.register({ email, nombre: "Usuario Finanzas", password: "Password123!" });
  if (!usuario.success) throw new Error("No se pudo registrar el usuario de prueba");

  const criaderos = new CriaderoService(new D1CriaderoRepository(db as any));
  const criadero = await criaderos.createCriadero(usuario.data.user.id, {
    nombre: "Criadero Finanzas", pais: "Ecuador", provincia: "Pichincha", ciudad: "Quito",
    telefono: "0999999999", correoContacto: email,
  });
  if (!criadero.success) throw new Error("No se pudo crear el criadero de prueba");
  return criadero.data.id;
}

async function filas<T = any>(sql: string, ...params: unknown[]): Promise<T[]> {
  return (await db.prepare(sql).bind(...params).all()).results as T[];
}

function servicio(ahora = AHORA) {
  return new FinanzasService(new D1FinanzasRepository(db as any), undefined, () => new Date(ahora));
}

let nMov = 0;

/** Inserta un movimiento directo (dato forzado); el rowid sigue el orden de insercion. */
async function mov(
  criadero: string,
  m: { tipo?: string; categoria?: string | null; fecha?: string; valor: number; detalle?: string | null; aveId?: string | null; origenTipo?: string | null; origenId?: string | null }
): Promise<string> {
  const id = `mov-${++nMov}`;
  await db.prepare(`
    INSERT INTO movimientos_financieros (id, criadero_id, tipo, categoria, fecha, valor, detalle, ave_id, origen_tipo, origen_id)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).bind(
    id, criadero, m.tipo ?? "INGRESO", m.categoria === undefined ? "OTRO" : m.categoria,
    m.fecha ?? "2026-11-01T00:00:00.000Z", m.valor, m.detalle ?? null, m.aveId ?? null,
    m.origenTipo ?? "MANUAL", m.origenId ?? null
  ).run();
  return id;
}

function datos<T>(r: { success: boolean; data?: T; error?: string }): T {
  if (!r.success) throw new Error(`se esperaba exito: ${r.error}`);
  return r.data as T;
}

describe("Finanzas D1 local (SQLite en memoria)", () => {
  const aves = new AveService(new D1AveRepository(db as any), () => new Date(FECHA_VENTA));

  async function venderAve(criadero: string, codigo: string, extra: Record<string, unknown> = {}) {
    const ave = await aves.crear(criadero, { codigo, origen: "NACIDA_CRIADERO" });
    if (!ave.success) throw new Error("no se creo el ave");
    const baja = await aves.registrarVenta(criadero, ave.data.ave.id, {
      fecha: FECHA_VENTA, celular: "+593 99 123 4567", comprador: "Ana", valorVenta: 100, valorEnvio: 5, ...extra,
    });
    if (!baja.success) throw new Error(`no se registro la venta: ${baja.error}`);
    return { aveId: ave.data.ave.id, bajaId: baja.data.id };
  }

  beforeAll(() => {
    // Las pruebas de integracion comparten la base: cada una usa su propio criadero.
  });

  it("debe devolver ceros sin movimientos en TODO, MES y ANIO (FIN-01)", async () => {
    const c = await crearCriadero();

    for (const p of ["TODO", "MES", "ANIO"]) {
      expect(datos(await servicio().resumen(c, p))).toEqual({ ingresos: 0, egresos: 0, utilidad: 0 });
    }
    expect(datos(await servicio().consolidadoCategorias(c))).toEqual({ categorias: [] });
    expect(datos(await servicio().consolidadoMensual(c))).toEqual({ meses: [] });
  });

  it("debe sumar con el mismo SUM de SQLite y restar en JS sin redondeo (FIN-02, FIN-03)", async () => {
    const c = await crearCriadero();
    await mov(c, { valor: 0.1 });
    await mov(c, { valor: 0.2 });
    await mov(c, { tipo: "EGRESO", valor: 0.1 });

    const sumaSql = (await filas("SELECT SUM(valor) AS s FROM movimientos_financieros WHERE criadero_id = ? AND tipo = 'INGRESO'", c))[0].s;
    const r = datos(await servicio().resumen(c, "TODO"));

    expect(r.ingresos).toBe(sumaSql);
    expect(r.egresos).toBe(0.1);
    expect(r.utilidad).toBe(sumaSql - 0.1);

    const c2 = await crearCriadero();
    await mov(c2, { valor: 12.5 });
    await mov(c2, { valor: 3.25 });
    await mov(c2, { tipo: "EGRESO", valor: 1234567.89 });
    const r2 = datos(await servicio().resumen(c2));

    expect(r2).toEqual({ ingresos: 15.75, egresos: 1234567.89, utilidad: 15.75 - 1234567.89 });
  });

  it("debe sumar 500 movimientos igual que el SUM de SQLite", async () => {
    const c = await crearCriadero();
    for (let i = 0; i < 500; i++) {
      await mov(c, { tipo: i % 3 === 0 ? "EGRESO" : "INGRESO", valor: (i % 97) * 0.37 + 0.01, fecha: `2026-${String((i % 12) + 1).padStart(2, "0")}-15T08:00:00.000Z` });
    }
    const sql = (await filas(`
      SELECT COALESCE(SUM(CASE WHEN tipo='INGRESO' THEN valor ELSE 0 END),0) AS i,
             COALESCE(SUM(CASE WHEN tipo='EGRESO' THEN valor ELSE 0 END),0) AS e
      FROM movimientos_financieros WHERE criadero_id = ?`, c))[0];
    const r = datos(await servicio().resumen(c));

    expect(r.ingresos).toBe(sql.i);
    expect(r.egresos).toBe(sql.e);
    expect(r.utilidad).toBe(sql.i - sql.e);
    expect(datos(await servicio().listarMovimientos(c)).movimientos).toHaveLength(500);
    expect(datos(await servicio().consolidadoMensual(c)).meses).toHaveLength(12);
  });

  it("debe conservar los importes del alta idénticos (FIN-04)", async () => {
    const c = await crearCriadero();
    await servicio().registrarManual(c, "INGRESO", { valor: 19.99 });
    await servicio().registrarManual(c, "EGRESO", { valor: 1234567.89 });

    const m = datos(await servicio().listarMovimientos(c)).movimientos;

    expect(m.map((x) => x.valor).sort((p, q) => p - q)).toEqual([19.99, 1234567.89]);
  });

  it("debe filtrar MES, ANIO y TODO por igualdad de strftime en UTC (FIN-05 a FIN-08)", async () => {
    const c = await crearCriadero();
    await mov(c, { valor: 1, fecha: "2026-10-31T23:59:59.999Z" });
    await mov(c, { valor: 10, fecha: "2026-11-01T00:00:00.000Z" });
    await mov(c, { valor: 100, fecha: "2025-12-31T23:59:59.999Z" });

    const en = async (p: string, ahora: string) => datos(await servicio(ahora).resumen(c, p)).ingresos;
    const ahora = "2026-10-31T23:59:59.999Z";

    expect(await en("MES", ahora)).toBe(1);
    expect(await en("ANIO", ahora)).toBe(11);
    expect(await en("TODO", ahora)).toBe(111);
    for (const p of ["mes", "X", undefined as unknown as string]) expect(await en(p, ahora)).toBe(111);

    // FIN-07: igualdad, no >=
    expect(await en("MES", "2026-11-01T00:00:00.000Z")).toBe(10);
    expect(await en("ANIO", "2027-01-01T00:00:00.000Z")).toBe(0);
  });

  it("debe usar el mes UTC aunque en Ecuador siga siendo el mes anterior (FIN-06)", async () => {
    const c = await crearCriadero();
    await mov(c, { valor: 7, fecha: "2026-10-31T23:30:00.000Z" });
    await mov(c, { valor: 3, fecha: "2026-11-01T01:00:00.000Z" });

    // el de 23:30 UTC del 31/oct ya no es "este mes" en noviembre; solo entra el de noviembre (3)
    expect(datos(await servicio("2026-11-01T00:10:00.000Z").resumen(c, "MES")).ingresos).toBe(3);
    expect(datos(await servicio("2026-11-01T00:10:00.000Z").resumen(c, "ANIO")).ingresos).toBe(10);
    expect(datos(await servicio("2026-10-31T23:00:00.000Z").resumen(c, "MES")).ingresos).toBe(7);
  });

  it("debe cubrir el borde de fin de año, año bisiesto y fechas ilegibles (FIN-07, FIN-08)", async () => {
    const c = await crearCriadero();
    await mov(c, { valor: 1, fecha: "2027-01-01T00:00:00.000Z" });
    await mov(c, { valor: 2, fecha: "2028-02-29T12:00:00.000Z" });
    await mov(c, { valor: 4, fecha: "abc" });

    expect(datos(await servicio("2026-12-31T23:59:59.999Z").resumen(c, "MES")).ingresos).toBe(0);
    expect(datos(await servicio("2026-12-31T23:59:59.999Z").resumen(c, "ANIO")).ingresos).toBe(0);
    expect(datos(await servicio("2028-02-01T00:00:00.000Z").resumen(c, "MES")).ingresos).toBe(2);
    expect(datos(await servicio().resumen(c, "TODO")).ingresos).toBe(7);
  });

  it("debe ignorar tipos desconocidos en sumas y listarlos en categorias (FIN-09)", async () => {
    const c = await crearCriadero();
    await mov(c, { tipo: "RARO", valor: 9, categoria: "OTRO", fecha: "2026-10-05T00:00:00.000Z" });

    expect(datos(await servicio().resumen(c))).toEqual({ ingresos: 0, egresos: 0, utilidad: 0 });
    expect(datos(await servicio().consolidadoMensual(c)).meses).toEqual([{ periodo: "2026-10", ingresos: 0, egresos: 0 }]);
    expect(datos(await servicio().consolidadoCategorias(c)).categorias).toEqual([{ tipo: "RARO", categoria: "OTRO", cantidad: 1, total: 9 }]);
  });

  it("debe ordenar por fecha descendente y desempatar por insercion con las claves de V1 (FIN-10)", async () => {
    const c = await crearCriadero();
    const a = await mov(c, { valor: 1, fecha: "2026-10-01T00:00:00.000Z" });
    const b = await mov(c, { valor: 2, fecha: "2026-10-03T00:00:00.000Z" });
    const d = await mov(c, { valor: 3, fecha: "2026-10-02T00:00:00.000Z" });
    const e = await mov(c, { valor: 4, fecha: "2026-10-02T00:00:00.000Z" });

    const m = datos(await servicio().listarMovimientos(c)).movimientos;

    expect(m.map((x) => x.id)).toEqual([b, e, d, a]);
    expect(Object.keys(m[0])).toEqual(["id", "tipo", "categoria", "fecha", "valor", "detalle", "aveId", "origenTipo", "origenId", "aveCodigo"]);
    expect(m[0].aveCodigo).toBeNull();
  });

  it("debe aplicar los valores por defecto del alta y no escribir historial (FIN-11, FIN-12)", async () => {
    const c = await crearCriadero();
    const { id } = datos(await servicio().registrarManual(c, "INGRESO", { categoria: "", valor: 12.5, detalle: "" }));
    await servicio().registrarManual(c, "EGRESO", { valor: 0 });
    await servicio().registrarManual(c, "EGRESO", { valor: -3.25 });

    const f = (await filas("SELECT * FROM movimientos_financieros WHERE id = ?", id))[0];

    expect(f).toMatchObject({ tipo: "INGRESO", categoria: "OTRO", fecha: AHORA, valor: 12.5, detalle: null, origen_tipo: "MANUAL", ave_id: null, origen_id: null });
    expect(await filas("SELECT * FROM movimientos_financieros_historial WHERE criadero_id = ?", c)).toHaveLength(0);
    expect((await filas("SELECT valor FROM movimientos_financieros WHERE criadero_id = ? AND tipo = 'EGRESO' ORDER BY rowid", c)).map((x) => x.valor)).toEqual([0, -3.25]);
  });

  it("debe editar un movimiento manual con historial EDICION_MANUAL antes del UPDATE (FIN-16, FIN-17, FIN-18, FIN-19)", async () => {
    const c = await crearCriadero();
    const id = await mov(c, { valor: 10, categoria: "OTRO", detalle: "a", fecha: "2026-10-01T00:00:00.000Z" });

    const r = datos(await servicio().actualizarManual(c, id, { tipo: "EGRESO", categoria: "ALIMENTO", valor: 12.5, detalle: " x ", fecha: "2026-10-05T00:00:00.000Z" }));
    expect(r).toEqual({ id });

    const h = await filas("SELECT * FROM movimientos_financieros_historial WHERE movimiento_id = ?", id);
    expect(h).toHaveLength(1);
    expect(h[0]).toMatchObject({
      criadero_id: c, fecha: AHORA, accion: "EDICION_MANUAL", tipo_anterior: "INGRESO", tipo_nuevo: "EGRESO",
      categoria_anterior: "OTRO", categoria_nueva: "ALIMENTO",
      fecha_movimiento_anterior: "2026-10-01T00:00:00.000Z", fecha_movimiento_nueva: "2026-10-05T00:00:00.000Z",
      valor_anterior: 10, valor_nuevo: 12.5, detalle_anterior: "a", detalle_nuevo: "x", origen_tipo: "MANUAL", origen_id: null,
    });
    expect((await filas("SELECT * FROM movimientos_financieros WHERE id = ?", id))[0]).toMatchObject({ tipo: "EGRESO", categoria: "ALIMENTO", fecha: "2026-10-05T00:00:00.000Z", valor: 12.5, detalle: "x", origen_tipo: "MANUAL", ave_id: null, origen_id: null });

    // sin cambios: igual escribe historial; campos ausentes se normalizan; origen NULL se edita
    await servicio().actualizarManual(c, id, { tipo: "EGRESO", categoria: "ALIMENTO", valor: 12.5, detalle: "x", fecha: "2026-10-05T00:00:00.000Z" });
    expect(await filas("SELECT id FROM movimientos_financieros_historial WHERE movimiento_id = ?", id)).toHaveLength(2);

    const sinOrigen = await mov(c, { valor: 5, origenTipo: null, fecha: "2026-09-01T00:00:00.000Z" });
    await servicio().actualizarManual(c, sinOrigen, { tipo: "raro", categoria: "", valor: 6, detalle: "" });
    expect((await filas("SELECT * FROM movimientos_financieros WHERE id = ?", sinOrigen))[0]).toMatchObject({ tipo: "INGRESO", categoria: "OTRO", detalle: null, fecha: "2026-09-01T00:00:00.000Z", valor: 6 });
  });

  it("debe rechazar la edicion de movimientos automaticos, inexistentes o con valor invalido sin escribir (FIN-20, FIN-21)", async () => {
    const c = await crearCriadero();
    const { bajaId } = await venderAve(c, "FA1");
    const auto = (await filas("SELECT id FROM movimientos_financieros WHERE origen_id = ?", bajaId)).map((x) => x.id);
    const manual = await mov(c, { valor: 10 });

    for (const id of auto) {
      expect(await servicio().actualizarManual(c, id, { valor: 5 })).toMatchObject({ error: "MOVIMIENTO_AUTOMATICO_NO_EDITABLE" });
    }
    expect(await servicio().actualizarManual(c, "nada", { valor: 0 })).toMatchObject({ error: "MOVIMIENTO_NO_ENCONTRADO" });
    for (const valor of [0, "abc", null]) {
      expect(await servicio().actualizarManual(c, manual, { valor })).toMatchObject({ error: "VALOR_INVALIDO" });
    }
    expect(await filas("SELECT id FROM movimientos_financieros_historial WHERE criadero_id = ?", c)).toHaveLength(0);
  });

  it("debe corregir una venta: baja, ambos movimientos e historial (FIN-23, FIN-26)", async () => {
    const c = await crearCriadero();
    const { aveId, bajaId } = await venderAve(c, "FC1");
    const avesAntes = await filas("SELECT * FROM aves WHERE id = ?", aveId);
    const histAntes = await filas("SELECT * FROM ave_historial WHERE ave_id = ?", aveId);

    const r = datos(await servicio().corregirVenta(c, bajaId, { valorVenta: "120,50", valorEnvio: "" }));
    expect(r).toEqual({ bajaId });

    expect((await filas("SELECT valor_venta, valor_envio FROM bajas_ave WHERE id = ?", bajaId))[0]).toEqual({ valor_venta: 120.5, valor_envio: 0 });
    const ms = await filas("SELECT * FROM movimientos_financieros WHERE origen_id = ? ORDER BY categoria", bajaId);
    expect(ms[0]).toMatchObject({ categoria: "ENVIO_AVE", tipo: "INGRESO", fecha: FECHA_VENTA, valor: 0, detalle: `Envío asociado a venta de ave ${aveId}`, ave_id: aveId });
    expect(ms[1]).toMatchObject({ categoria: "VENTA_AVE", tipo: "INGRESO", fecha: FECHA_VENTA, valor: 120.5, detalle: `Venta de ave ${aveId}` });

    for (const m of ms) {
      const h = await filas("SELECT * FROM movimientos_financieros_historial WHERE movimiento_id = ?", m.id);
      expect(h).toHaveLength(1);
      expect(h[0].accion).toBe(m.categoria === "VENTA_AVE" ? "CORRECCION_VENTA" : "CORRECCION_ENVIO");
      expect(h[0]).toMatchObject({ origen_tipo: "VENTA_AVE", origen_id: bajaId });
    }
    expect(await filas("SELECT * FROM aves WHERE id = ?", aveId)).toEqual(avesAntes);
    expect(await filas("SELECT * FROM ave_historial WHERE ave_id = ?", aveId)).toEqual(histAntes);

    // 0.1 y 19.99 idénticos (FIN-26)
    await servicio().corregirVenta(c, bajaId, { valorVenta: 19.99, valorEnvio: 0.1 });
    expect((await filas("SELECT valor_venta, valor_envio FROM bajas_ave WHERE id = ?", bajaId))[0]).toEqual({ valor_venta: 19.99, valor_envio: 0.1 });
    expect((await filas("SELECT valor FROM movimientos_financieros WHERE origen_id = ? ORDER BY categoria", bajaId)).map((x) => x.valor)).toEqual([0.1, 19.99]);
  });

  it("debe crear el movimiento de envio ausente con historial CREACION_POR_CORRECCION (FIN-24, FIN-25)", async () => {
    const c = await crearCriadero();
    const { aveId, bajaId } = await venderAve(c, "FC2");
    await db.prepare("DELETE FROM movimientos_financieros WHERE origen_id = ? AND categoria = 'ENVIO_AVE'").bind(bajaId).run();

    await servicio().corregirVenta(c, bajaId, { valorVenta: 10, valorEnvio: 0 });

    const envio = (await filas("SELECT * FROM movimientos_financieros WHERE origen_id = ? AND categoria = 'ENVIO_AVE'", bajaId))[0];
    expect(envio).toMatchObject({ tipo: "INGRESO", valor: 0, origen_tipo: "VENTA_AVE", ave_id: aveId, fecha: FECHA_VENTA });
    const h = (await filas("SELECT * FROM movimientos_financieros_historial WHERE movimiento_id = ?", envio.id))[0];
    expect(h).toMatchObject({
      accion: "CREACION_POR_CORRECCION", tipo_anterior: null, categoria_anterior: null, fecha_movimiento_anterior: null,
      valor_anterior: null, detalle_anterior: null, tipo_nuevo: "INGRESO", categoria_nueva: "ENVIO_AVE", valor_nuevo: 0,
      origen_tipo: "VENTA_AVE", origen_id: bajaId,
    });
  });

  it("debe validar importes antes de leer y rechazar bajas ajenas, inexistentes o de muerte sin escribir (FIN-27, FIN-28, FIN-30)", async () => {
    const c = await crearCriadero();
    const otro = await crearCriadero();
    const { bajaId } = await venderAve(c, "FC3");
    const muerte = await aves.crear(c, { codigo: "FC3M", origen: "NACIDA_CRIADERO" });
    if (!muerte.success) throw new Error("ave");
    const baja = await aves.registrarMuerte(c, muerte.data.ave.id, { fecha: FECHA_VENTA, causa: "x" });
    const muerteId = baja.success ? baja.data.id : "";

    expect(await servicio().corregirVenta(c, "nada", { valorVenta: -1 })).toMatchObject({ error: "VALOR_INVALIDO" });
    expect(await servicio().corregirVenta(c, bajaId, { valorVenta: "abc" })).toMatchObject({ error: "VALOR_INVALIDO" });
    expect(await servicio().corregirVenta(c, "nada", { valorVenta: 1 })).toMatchObject({ error: "VENTA_NO_ENCONTRADA" });
    expect(await servicio().corregirVenta(c, muerteId, { valorVenta: 1 })).toMatchObject({ error: "VENTA_NO_ENCONTRADA" });
    expect(await servicio().corregirVenta(otro, bajaId, { valorVenta: 1 })).toMatchObject({ error: "VENTA_NO_ENCONTRADA" });
    expect((await filas("SELECT valor_venta, valor_envio FROM bajas_ave WHERE id = ?", bajaId))[0]).toEqual({ valor_venta: 100, valor_envio: 5 });
    expect(await filas("SELECT id FROM movimientos_financieros_historial WHERE criadero_id = ?", c)).toHaveLength(0);

    // FIN-30: null y ausente = 0
    expect(datos(await servicio().corregirVenta(c, bajaId, { valorVenta: null }))).toEqual({ bajaId });
    expect((await filas("SELECT valor_venta, valor_envio FROM bajas_ave WHERE id = ?", bajaId))[0]).toEqual({ valor_venta: 0, valor_envio: 0 });
  });

  it("debe actualizar solo el movimiento de menor rowid si hay duplicados (FIN-29)", async () => {
    const c = await crearCriadero();
    const { aveId, bajaId } = await venderAve(c, "FC4");
    const dup = await mov(c, { categoria: "VENTA_AVE", origenTipo: "VENTA_AVE", origenId: bajaId, aveId, valor: 1 });

    await servicio().corregirVenta(c, bajaId, { valorVenta: 77 });

    expect((await filas("SELECT valor FROM movimientos_financieros WHERE id = ?", dup))[0].valor).toBe(1);
    expect((await filas("SELECT valor FROM movimientos_financieros WHERE origen_id = ? AND categoria = 'VENTA_AVE' AND id <> ?", bajaId, dup))[0].valor).toBe(77);
  });

  it("debe ser atomico: un fallo a mitad de la correccion no deja nada escrito", async () => {
    const c = await crearCriadero();
    const { bajaId } = await venderAve(c, "FC5");
    const antes = await filas("SELECT * FROM movimientos_financieros WHERE origen_id = ? ORDER BY rowid", bajaId);

    await db.exec(`CREATE TRIGGER falla_envio BEFORE INSERT ON movimientos_financieros_historial
      WHEN NEW.accion = 'CORRECCION_ENVIO' BEGIN SELECT RAISE(ABORT, 'fallo simulado'); END;`);
    try {
      await expect(servicio().corregirVenta(c, bajaId, { valorVenta: 55, valorEnvio: 9 })).rejects.toThrow();
    } finally {
      await db.exec("DROP TRIGGER falla_envio");
    }

    expect((await filas("SELECT valor_venta, valor_envio FROM bajas_ave WHERE id = ?", bajaId))[0]).toEqual({ valor_venta: 100, valor_envio: 5 });
    expect(await filas("SELECT * FROM movimientos_financieros WHERE origen_id = ? ORDER BY rowid", bajaId)).toEqual(antes);
    expect(await filas("SELECT id FROM movimientos_financieros_historial WHERE criadero_id = ?", c)).toHaveLength(0);
  });

  it("debe ser atomico: un fallo en la edicion manual no deja historial", async () => {
    const c = await crearCriadero();
    const id = await mov(c, { valor: 10 });

    await db.exec(`CREATE TRIGGER falla_update BEFORE UPDATE ON movimientos_financieros
      BEGIN SELECT RAISE(ABORT, 'fallo simulado'); END;`);
    try {
      await expect(servicio().actualizarManual(c, id, { valor: 20 })).rejects.toThrow();
    } finally {
      await db.exec("DROP TRIGGER falla_update");
    }

    expect(await filas("SELECT id FROM movimientos_financieros_historial WHERE criadero_id = ?", c)).toHaveLength(0);
    expect((await filas("SELECT valor FROM movimientos_financieros WHERE id = ?", id))[0].valor).toBe(10);
  });

  it("debe listar el historial con fecha descendente, el ultimo primero, y vacio si no hay (FIN-31, FIN-32)", async () => {
    const c = await crearCriadero();
    const id = await mov(c, { valor: 10 });
    for (const v of [11, 12, 13]) await servicio().actualizarManual(c, id, { valor: v });

    const h = datos(await servicio().historial(c, id)).historial;

    expect(h.map((x) => x.valorNuevo)).toEqual([13, 12, 11]);
    expect(Object.keys(h[0])).toEqual(["id", "movimientoId", "fecha", "accion", "tipoAnterior", "tipoNuevo", "categoriaAnterior", "categoriaNueva", "fechaMovimientoAnterior", "fechaMovimientoNueva", "valorAnterior", "valorNuevo", "detalleAnterior", "detalleNuevo", "origenTipo", "origenId"]);
    expect(datos(await servicio().historial(c, "nada")).historial).toEqual([]);
  });

  it("debe devolver el movimiento y la venta con sus claves, y error para ids de otro tipo (FIN-33, FIN-34)", async () => {
    const c = await crearCriadero();
    const { aveId, bajaId } = await venderAve(c, "FV1");
    const m = datos(await servicio().obtenerMovimiento(c, (await filas("SELECT id FROM movimientos_financieros WHERE origen_id = ? AND categoria = 'VENTA_AVE'", bajaId))[0].id)).movimiento;

    expect(Object.keys(m)).toEqual(["id", "tipo", "categoria", "fecha", "valor", "detalle", "aveId", "origenTipo", "origenId", "fechaCreacion", "aveCodigo"]);
    expect(m).toMatchObject({ aveId, aveCodigo: "FV1", origenId: bajaId });
    expect(await servicio().obtenerMovimiento(c, "nada")).toMatchObject({ error: "MOVIMIENTO_NO_ENCONTRADO" });

    const v = datos(await servicio().obtenerVenta(c, bajaId)).venta;
    expect(Object.keys(v)).toEqual(["id", "aveId", "fecha", "celular", "comprador", "ciudadDestino", "cooperativaEnvio", "valorVenta", "valorEnvio", "detalle", "aveCodigo"]);
    expect(v).toMatchObject({ valorVenta: 100, valorEnvio: 5, aveCodigo: "FV1", comprador: "Ana" });
    expect(await servicio().obtenerVenta(c, "nada")).toMatchObject({ error: "VENTA_NO_ENCONTRADA" });
  });

  it("debe consolidar por categoria, uniendo NULL con OTRO y ordenando por tipo y total (FIN-35)", async () => {
    const c = await crearCriadero();
    await mov(c, { valor: 12.5, categoria: "VENTA_HUEVOS" });
    await mov(c, { valor: 3.25, categoria: "OTRO" });
    await mov(c, { valor: 1.5, categoria: null });
    await mov(c, { tipo: "EGRESO", valor: 0.1, categoria: "ALIMENTO" });
    await mov(c, { tipo: "EGRESO", valor: 0.2, categoria: "ALIMENTO" });

    const cat = datos(await servicio().consolidadoCategorias(c, "TODO")).categorias;
    const sumaSql = (await filas("SELECT SUM(valor) AS s FROM movimientos_financieros WHERE criadero_id = ? AND tipo = 'EGRESO'", c))[0].s;

    expect(cat).toEqual([
      { tipo: "INGRESO", categoria: "VENTA_HUEVOS", cantidad: 1, total: 12.5 },
      { tipo: "INGRESO", categoria: "OTRO", cantidad: 2, total: 4.75 },
      { tipo: "EGRESO", categoria: "ALIMENTO", cantidad: 2, total: sumaSql },
    ]);
  });

  it("debe agrupar por mes solo los meses con datos, hasta el limite (FIN-36, FIN-37, FIN-38, FIN-39, FIN-40)", async () => {
    const c = await crearCriadero();
    for (let i = 0; i < 14; i++) {
      const mes = ((i + 8) % 12) + 1;
      const anio = 2025 + Math.floor((i + 8) / 12);
      await mov(c, { valor: i + 1, fecha: `${anio}-${String(mes).padStart(2, "0")}-10T00:00:00.000Z` });
    }
    const todos = datos(await servicio().consolidadoMensual(c, 12)).meses;
    expect(todos).toHaveLength(12);
    expect(todos[0].periodo > todos[11].periodo).toBe(true);
    expect(datos(await servicio().consolidadoMensual(c, 0)).meses).toHaveLength(12);
    expect(datos(await servicio().consolidadoMensual(c, "x")).meses).toHaveLength(12);
    expect(datos(await servicio().consolidadoMensual(c, 3)).meses).toHaveLength(3);

    const c2 = await crearCriadero();
    await mov(c2, { valor: 1, fecha: "2026-08-10T00:00:00.000Z" });
    await mov(c2, { valor: 2, fecha: "2026-10-31T23:59:59.999Z" });
    await mov(c2, { valor: 4, fecha: "2026-11-01T00:00:00.000Z", tipo: "EGRESO" });
    await mov(c2, { valor: 0.1, fecha: "2026-11-02T00:00:00.000Z", tipo: "EGRESO" });
    await mov(c2, { valor: 0.2, fecha: "2026-11-03T00:00:00.000Z", tipo: "EGRESO" });

    const sumaSql = (await filas("SELECT SUM(valor) AS s FROM movimientos_financieros WHERE criadero_id = ? AND tipo='EGRESO'", c2))[0].s;
    expect(datos(await servicio().consolidadoMensual(c2)).meses).toEqual([
      { periodo: "2026-11", ingresos: 0, egresos: sumaSql },
      { periodo: "2026-10", ingresos: 2, egresos: 0 },
      { periodo: "2026-08", ingresos: 1, egresos: 0 },
    ]);
  });

  it("debe aislar los datos entre criaderos (FIN-41)", async () => {
    const a = await crearCriadero();
    const b = await crearCriadero();
    const idA = await mov(a, { valor: 5 });
    await mov(b, { valor: 7 });
    await servicio().actualizarManual(a, idA, { valor: 6 });

    expect(datos(await servicio().resumen(a)).ingresos).toBe(5 + 1);
    expect(datos(await servicio().resumen(b)).ingresos).toBe(7);
    expect(datos(await servicio().listarMovimientos(b)).movimientos).toHaveLength(1);
    expect(datos(await servicio().historial(b, idA)).historial).toEqual([]);
    expect(await servicio().obtenerMovimiento(b, idA)).toMatchObject({ error: "MOVIMIENTO_NO_ENCONTRADO" });
    expect(await servicio().actualizarManual(b, idA, { valor: 1 })).toMatchObject({ error: "MOVIMIENTO_NO_ENCONTRADO" });
  });

  it("debe listar los movimientos de una venta de Bajas con ENVIO_AVE antes que VENTA_AVE y contar el envio en 0 (FIN-46)", async () => {
    const c = await crearCriadero();
    const ave = await aves.crear(c, { codigo: "FB1", origen: "NACIDA_CRIADERO" });
    if (!ave.success) throw new Error("ave");
    const venta = await aves.registrarVenta(c, ave.data.ave.id, { fecha: FECHA_VENTA, celular: "+593 99 123 4567", comprador: "Ana", valorVenta: 40 });
    expect(venta.success).toBe(true);

    const m = datos(await servicio().listarMovimientos(c)).movimientos;
    const cat = datos(await servicio().consolidadoCategorias(c)).categorias;

    expect(m.map((x) => x.categoria)).toEqual(["ENVIO_AVE", "VENTA_AVE"]);
    expect(m[0]).toMatchObject({ valor: 0, aveCodigo: "FB1" });
    expect(cat).toEqual([
      { tipo: "INGRESO", categoria: "VENTA_AVE", cantidad: 1, total: 40 },
      { tipo: "INGRESO", categoria: "ENVIO_AVE", cantidad: 1, total: 0 },
    ]);
  });
});
