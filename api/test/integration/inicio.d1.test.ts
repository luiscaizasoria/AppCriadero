import { describe, it, expect, beforeAll } from "vitest";
import { SignJWT } from "jose";
import { AuthService } from "../../src/auth/auth.service";
import { D1AuthRepository } from "../../src/auth/auth.repository";
import { CriaderoService } from "../../src/criaderos/criaderos.service";
import { D1CriaderoRepository } from "../../src/criaderos/criaderos.repository";
import { createApp } from "../../src/app";
import { createInicioRouter } from "../../src/inicio/inicio.routes";
import { createInicioDependencies } from "../../src/inicio/inicio.factory";
import { LocalD1Adapter } from "../helpers/local-d1.adapter";

const db = new LocalD1Adapter();
const jwtSecret = "integration-secret-key";
const AHORA = "2026-11-05T15:00:00.000Z";
const DIA = 86400000;
const HORA = 3600000;
const T0 = Date.parse(AHORA);
const hace = (ms: number) => new Date(T0 - ms).toISOString();
const DIA0 = Date.UTC(2026, 10, 5);

/** Envuelve el adaptador y cuenta cada llamada a D1 (all / first / run) y cada batch. */
class D1Contador {
  llamadas = 0;
  batches = 0;
  reloj = AHORA;

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
  const usuario = await auth.register({ email, nombre: "Inicio", password: "Password123!" });
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

const insJaula = (c: string, id: string, codigo: string, activa = 1) =>
  sql(`INSERT INTO jaulas (id, criadero_id, codigo, nombre, activa) VALUES (?, ?, ?, ?, ?)`, id, c, codigo, `Jaula ${codigo}`, activa);

const insAve = (c: string, id: string, codigo: string,
  x: { estado?: string; salud?: string | null; raza?: string | null; jaula?: string | null } = {}) =>
  sql(`INSERT INTO aves (id, criadero_id, codigo, origen, estado, estado_salud, raza, jaula_actual_id)
       VALUES (?, ?, ?, 'NACIDA_CRIADERO', ?, ?, ?, ?)`,
    id, c, codigo, x.estado ?? "ACTIVA", x.salud === undefined ? "SANA" : x.salud, x.raza === undefined ? "Kikiris" : x.raza, x.jaula ?? null);

const insHuevo = (c: string, id: string, codigo: string, ave: string, fecha: string) =>
  sql(`INSERT INTO huevos (id, criadero_id, codigo, ave_id, fecha) VALUES (?, ?, ?, ?, ?)`, id, c, codigo, ave, fecha);

const insMov = (c: string, id: string, tipo: string, valor: number, fecha: string) =>
  sql(`INSERT INTO movimientos_financieros (id, criadero_id, tipo, categoria, fecha, valor) VALUES (?, ?, ?, 'CAT', ?, ?)`, id, c, tipo, fecha, valor);

describe("Inicio (dashboard) D1 local (SQLite en memoria)", () => {
  let A: Cuenta;
  let B: Cuenta;
  let seq = 0;
  const nuevo = (p: string) => `${p}-${String(++seq).padStart(6, "0")}`;
  const contador = new D1Contador();
  const app = createApp({
    inicioRouter: createInicioRouter(() => createInicioDependencies(contador as any, () => new Date(contador.reloj))),
  });

  async function get(cuenta: Cuenta, criaderoId: string, conToken = true) {
    const t0 = performance.now();
    const antes = contador.llamadas;
    const headers: Record<string, string> = conToken ? { Authorization: `Bearer ${await token(cuenta.userId)}` } : {};
    const r = await app.request(
      `/api/v1/criaderos/${criaderoId}/dashboard`,
      { headers },
      { JWT_SECRET: jwtSecret, DB: contador }
    );
    const texto = await r.text();
    return { status: r.status, texto, body: JSON.parse(texto) as any, llamadas: contador.llamadas - antes, ms: performance.now() - t0 };
  }

  async function dashboard(c: Cuenta = A) {
    const r = await get(c, c.criaderoId);
    expect(r.status).toBe(200);
    return r.body.data as Record<string, any>;
  }

  async function limpiar(...cs: string[]) {
    for (const c of cs) {
      await sql(`DELETE FROM movimientos_financieros WHERE criadero_id = ?`, c).run();
      await sql(`DELETE FROM huevos WHERE criadero_id = ?`, c).run();
      await sql(`DELETE FROM aves WHERE criadero_id = ?`, c).run();
      await sql(`DELETE FROM jaulas WHERE criadero_id = ?`, c).run();
    }
  }

  beforeAll(async () => {
    A = await crearUsuarioYCriadero("a@inicio.d1.test");
    B = await crearUsuarioYCriadero("b@inicio.d1.test");
  });

  it("debe devolver ceros, null y arrays vacios en un criadero vacio, con claves de V1 en orden (INI-01, INI-24)", async () => {
    const d = await dashboard();

    expect(d).toStrictEqual({
      aves: { activas: 0, vendidas: 0, fallecidas: 0 },
      salud: { sanas: 0, tratamiento: 0, enfermas: 0 },
      finanzas: { ingresos: 0, egresos: 0, utilidad: 0 },
      jaulas: { total: 0, ocupadas: 0 },
      ocupacionJaulas: { porcentaje: 0 },
      huevos: { hoy: 0, mes: 0 },
      mejorPonedora: null,
      horaPico: null,
      produccionSemana: [],
      avesPorRaza: [],
      totalRazas: 0,
      promedioHuevos: 0,
    });
    expect(Object.keys(d)).toEqual([
      "aves", "salud", "finanzas", "jaulas", "ocupacionJaulas", "huevos", "mejorPonedora", "horaPico",
      "produccionSemana", "avesPorRaza", "totalRazas", "promedioHuevos",
    ]);
  });

  it("debe contar aves por estado y la salud solo de las ACTIVAS (INI-02, INI-03)", async () => {
    await lote([
      insAve(A.criaderoId, "a1", "K1", { salud: "SANA" }),
      insAve(A.criaderoId, "a2", "K2", { salud: "EN_TRATAMIENTO" }),
      insAve(A.criaderoId, "a3", "K3", { salud: "ENFERMA" }),
      insAve(A.criaderoId, "a4", "K4", { salud: null }),
      insAve(A.criaderoId, "a5", "K5", { salud: "RARA" }),
      insAve(A.criaderoId, "a6", "K6", { estado: "VENDIDA", salud: "EN_TRATAMIENTO" }),
      insAve(A.criaderoId, "a7", "K7", { estado: "FALLECIDA", salud: "ENFERMA" }),
      insAve(B.criaderoId, "b1", "K1", { salud: "ENFERMA" }),
    ]);
    const d = await dashboard();

    expect(d.aves).toStrictEqual({ activas: 5, vendidas: 1, fallecidas: 1 });
    expect(d.salud).toStrictEqual({ sanas: 1, tratamiento: 1, enfermas: 1 });
  });

  it("debe calcular jaulas ocupadas y ocupacion con toFixed (INI-04, INI-05)", async () => {
    await lote([
      insJaula(A.criaderoId, "j1", "J1"),
      insJaula(A.criaderoId, "j2", "J2"),
      insJaula(A.criaderoId, "j3", "J3"),
      insJaula(A.criaderoId, "j4", "J4", 0),
      insJaula(B.criaderoId, "jb1", "J1"),
    ]);
    await lote([
      sql(`UPDATE aves SET jaula_actual_id = 'j1' WHERE id = 'a1'`),
      sql(`UPDATE aves SET jaula_actual_id = 'j2' WHERE id IN ('a6', 'a7')`),
      sql(`UPDATE aves SET jaula_actual_id = 'j4' WHERE id = 'a2'`),
      sql(`UPDATE aves SET jaula_actual_id = 'jb1' WHERE id = 'b1'`),
    ]);
    const d = await dashboard();

    expect(d.jaulas).toStrictEqual({ total: 3, ocupadas: 1 });
    expect(d.ocupacionJaulas).toStrictEqual({ porcentaje: 33.33 });

    await sql(`UPDATE aves SET jaula_actual_id = 'j3' WHERE id = 'a3'`).run();
    expect((await dashboard()).ocupacionJaulas).toStrictEqual({ porcentaje: 66.67 });

    await sql(`UPDATE jaulas SET activa = 0 WHERE criadero_id = ?`, A.criaderoId).run();
    const sin = await dashboard();
    expect(sin.jaulas).toStrictEqual({ total: 0, ocupadas: 0 });
    expect(sin.ocupacionJaulas).toStrictEqual({ porcentaje: 0 });
  });

  it("debe sumar las finanzas del mes UTC por tipo y calcular la utilidad sin redondeo (INI-07..09)", async () => {
    await lote([
      insMov(A.criaderoId, nuevo("m"), "INGRESO", 0.3, "2026-11-01T00:00:00.000Z"),
      insMov(A.criaderoId, nuevo("m"), "EGRESO", 0.1, "2026-11-30T23:59:59.999Z"),
      insMov(A.criaderoId, nuevo("m"), "INGRESO", 99, "2026-10-31T23:59:59.999Z"),
      insMov(A.criaderoId, nuevo("m"), "EGRESO", 99, "2026-12-01T00:00:00.000Z"),
      insMov(A.criaderoId, nuevo("m"), "AJUSTE", 500, hace(1000)),
      insMov(B.criaderoId, nuevo("m"), "EGRESO", 1000, hace(1000)),
    ]);
    const d = await dashboard();

    expect(d.finanzas).toStrictEqual({ ingresos: 0.3, egresos: 0.1, utilidad: 0.3 - 0.1 });
    expect(d.finanzas.utilidad).toBe(0.19999999999999998);

    await sql(`DELETE FROM movimientos_financieros WHERE criadero_id = ?`, A.criaderoId).run();
    await lote([insMov(A.criaderoId, nuevo("m"), "EGRESO", 4, hace(1000))]);
    expect((await dashboard()).finanzas).toStrictEqual({ ingresos: 0, egresos: 4, utilidad: -4 });
  });

  it("debe calcular huevos hoy y mes, mejor ponedora, hora pico, semana y promedio (INI-10..19)", async () => {
    await sql(`DELETE FROM huevos WHERE criadero_id IN (?, ?)`, A.criaderoId, B.criaderoId).run();
    const f = (d: number, h: number) => new Date(DIA0 + d * DIA + h * HORA).toISOString();
    await lote([
      // a6 es VENDIDA: sus huevos cuentan igual
      insHuevo(A.criaderoId, nuevo("h"), "H1", "a6", f(0, 0)),
      insHuevo(A.criaderoId, nuevo("h"), "H2", "a6", f(0, 8)),
      insHuevo(A.criaderoId, nuevo("h"), "H3", "a6", f(-1, 8)),
      insHuevo(A.criaderoId, nuevo("h"), "H4", "a1", f(-6, 14)),
      insHuevo(A.criaderoId, nuevo("h"), "H5", "a1", f(-7, 14)),
      insHuevo(A.criaderoId, nuevo("h"), "H6", "a1", f(1, 14)),
      insHuevo(A.criaderoId, nuevo("h"), "H7", "a1", "2026-10-31T23:59:59.999Z"),
      insHuevo(B.criaderoId, nuevo("h"), "H1", "b1", f(0, 8)),
    ]);
    const d = await dashboard();

    expect(d.huevos).toStrictEqual({ hoy: 2, mes: 4 });
    expect(d.mejorPonedora).toStrictEqual({ codigo: "K1", cantidad: 4 });
    expect(d.horaPico).toStrictEqual({ hora: "14", cantidad: 3 });
    // ventana: -6 (cuenta), -7 (no), futuro +1 (cuenta, sin cota superior)
    const filas = d.produccionSemana as Array<{ dia: string; cantidad: number }>;
    expect(filas.reduce((s, x) => s + x.cantidad, 0)).toBe(6); // H1..H4, H6 y H7 (31/10)
    expect(d.promedioHuevos).toBe(0.86);
    // Domingo primero: 2026-11-05 es jueves; orden por numero de dia
    const orden = ["Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"];
    const indices = filas.map((x) => orden.indexOf(x.dia));
    expect(indices).toEqual([...indices].sort((a, b) => a - b));
  });

  it("debe agrupar razas con TRIM y 'Sin raza', ordenar por cantidad y raza y calcular porcentajes (INI-20..22)", async () => {
    await sql(`DELETE FROM huevos WHERE criadero_id IN (?, ?)`, A.criaderoId, B.criaderoId).run();
    await limpiar(A.criaderoId, B.criaderoId);
    await lote([
      insAve(A.criaderoId, "r1", "R1", { raza: "Kikiris" }),
      insAve(A.criaderoId, "r2", "R2", { raza: " Kikiris " }),
      insAve(A.criaderoId, "r3", "R3", { raza: "kikiris" }),
      insAve(A.criaderoId, "r4", "R4", { raza: "" }),
      insAve(A.criaderoId, "r5", "R5", { raza: "   " }),
      insAve(A.criaderoId, "r6", "R6", { raza: null }),
      insAve(A.criaderoId, "r7", "R7", { raza: "Angora" }),
      insAve(A.criaderoId, "r8", "R8", { raza: "Vendida", estado: "VENDIDA" }),
      insAve(B.criaderoId, "rb1", "R1", { raza: "Otra" }),
    ]);
    const d = await dashboard();

    expect(d.avesPorRaza).toStrictEqual([
      { raza: "Sin raza", cantidad: 3, porcentaje: 42.86 },
      { raza: "Kikiris", cantidad: 2, porcentaje: 28.57 },
      { raza: "Angora", cantidad: 1, porcentaje: 14.29 },
      { raza: "kikiris", cantidad: 1, porcentaje: 14.29 },
    ]);
    expect(d.totalRazas).toBe(4);
  });

  it("debe responder 401 sin token y 403 con criadero ajeno o inexistente (INI-23)", async () => {
    expect((await get(A, A.criaderoId, false)).status).toBe(401);
    const ajeno = await get(A, B.criaderoId);
    expect(ajeno.status).toBe(403);
    expect(ajeno.body.error).toBe("FORBIDDEN");
    expect((await get(A, "no-existe")).status).toBe(403);
  });

  it("debe aislar criaderos con codigos y razas repetidos (INI-06, INI-23)", async () => {
    await limpiar(A.criaderoId, B.criaderoId);
    await lote([
      insJaula(A.criaderoId, "ia-1", "J01"),
      insJaula(B.criaderoId, "ib-1", "J01"),
      insJaula(B.criaderoId, "ib-2", "J02"),
      insAve(A.criaderoId, "ia-a1", "K001", { raza: "Kikiris", jaula: "ia-1" }),
      insAve(B.criaderoId, "ib-a1", "K001", { raza: "Kikiris", jaula: "ib-1" }),
      insAve(B.criaderoId, "ib-a2", "K002", { raza: "Orpington", jaula: "ib-2" }),
    ]);
    await lote([
      insHuevo(A.criaderoId, nuevo("h"), "H1", "ia-a1", hace(1000)),
      insHuevo(B.criaderoId, nuevo("h"), "H1", "ib-a1", hace(1000)),
      insHuevo(B.criaderoId, nuevo("h"), "H2", "ib-a1", hace(2000)),
      insMov(B.criaderoId, nuevo("m"), "INGRESO", 50, hace(1000)),
    ]);
    const a = await dashboard(A);
    const b = await dashboard(B);

    expect(a.aves.activas).toBe(1);
    expect(a.jaulas).toStrictEqual({ total: 1, ocupadas: 1 });
    expect(a.huevos).toStrictEqual({ hoy: 1, mes: 1 });
    expect(a.mejorPonedora).toStrictEqual({ codigo: "K001", cantidad: 1 });
    expect(a.finanzas.ingresos).toBe(0);
    expect(a.totalRazas).toBe(1);
    expect(b.aves.activas).toBe(2);
    expect(b.jaulas).toStrictEqual({ total: 2, ocupadas: 2 });
    expect(b.huevos).toStrictEqual({ hoy: 2, mes: 2 });
    expect(b.mejorPonedora).toStrictEqual({ codigo: "K001", cantidad: 2 });
    expect(b.finanzas.ingresos).toBe(50);
    expect(b.totalRazas).toBe(2);
  });

  it("debe hacer 6 llamadas a D1 con pocos datos, sin batch (INI-26)", async () => {
    contador.batches = 0;
    const r = await get(A, A.criaderoId);

    expect(r.status).toBe(200);
    expect(r.llamadas).toBe(6);
    expect(contador.batches).toBe(0);
  });

  it("debe usar un solo instante por peticion en el borde de medianoche UTC (INI-27)", async () => {
    await sql(`DELETE FROM huevos WHERE criadero_id = ?`, A.criaderoId).run();
    await lote([insHuevo(A.criaderoId, nuevo("h"), "H9", "ia-a1", "2026-11-05T23:59:59.999Z")]);

    contador.reloj = "2026-11-05T23:59:59.999Z";
    const antes = await dashboard();
    contador.reloj = "2026-11-06T00:00:00.000Z";
    const despues = await dashboard();
    contador.reloj = AHORA;

    expect(antes.huevos).toStrictEqual({ hoy: 1, mes: 1 });
    expect(despues.huevos).toStrictEqual({ hoy: 0, mes: 1 });
    expect(despues.produccionSemana).toHaveLength(1);
  });

  describe("datos grandes (INI-26)", () => {
    it("debe mantener 6 llamadas a D1 con 60 jaulas, 300 aves, 2000 huevos y 2000 movimientos", async () => {
      const G = await crearUsuarioYCriadero("g@inicio.d1.test");
      const c = G.criaderoId;
      const razas = ["Kikiris", "Orpington", "Sultan", "", "Brahma", "Silkie"];
      const st: any[] = [];
      for (let i = 1; i <= 60; i++) st.push(insJaula(c, `gj-${i}`, `J${String(i).padStart(3, "0")}`, i % 10 ? 1 : 0));
      await lote(st);
      const st2: any[] = [];
      for (let i = 1; i <= 300; i++) {
        st2.push(insAve(c, `ga-${i}`, `K${String(i).padStart(4, "0")}`, {
          raza: razas[i % razas.length],
          estado: i % 25 === 0 ? "VENDIDA" : "ACTIVA",
          salud: ["SANA", "EN_TRATAMIENTO", "ENFERMA"][i % 3],
          jaula: i % 4 ? `gj-${(i % 60) + 1}` : null,
        }));
      }
      await lote(st2);
      const st3: any[] = [];
      for (let i = 1; i <= 2000; i++) {
        st3.push(insHuevo(c, `gh-${i}`, `H${String(i).padStart(6, "0")}`, `ga-${(i % 300) + 1}`, new Date(DIA0 - (i % 21) * DIA + (i % 24) * HORA).toISOString()));
        st3.push(insMov(c, `gm-${i}`, i % 3 === 0 ? "INGRESO" : "EGRESO", 1 + (i % 17) * 0.37, hace((i % 90) * DIA + HORA)));
      }
      await lote(st3);

      const muestras: Array<{ llamadas: number; ms: number; bytes: number }> = [];
      for (let k = 0; k < 3; k++) {
        const r = await get(G, c);
        expect(r.status).toBe(200);
        muestras.push({ llamadas: r.llamadas, ms: Math.round(r.ms), bytes: r.texto.length });
        expect(r.body.data.aves.activas + r.body.data.aves.vendidas).toBe(300);
        expect(r.body.data.huevos.mes).toBeGreaterThan(0);
      }
      console.log("INICIO datos grandes:", JSON.stringify(muestras));
      for (const m of muestras) expect(m.llamadas).toBe(6);

      const pocos = await get(A, A.criaderoId);
      console.log("INICIO pocos datos:", JSON.stringify({ llamadas: pocos.llamadas, ms: Math.round(pocos.ms), bytes: pocos.texto.length }));
      expect(pocos.llamadas).toBe(6);
    }, 120000);
  });
});
