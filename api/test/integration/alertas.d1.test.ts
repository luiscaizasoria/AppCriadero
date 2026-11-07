import { describe, it, expect, beforeAll } from "vitest";
import { SignJWT } from "jose";
import { AuthService } from "../../src/auth/auth.service";
import { D1AuthRepository } from "../../src/auth/auth.repository";
import { CriaderoService } from "../../src/criaderos/criaderos.service";
import { D1CriaderoRepository } from "../../src/criaderos/criaderos.repository";
import { createApp } from "../../src/app";
import { createAlertasRouter } from "../../src/alertas/alertas.routes";
import { createAlertasDependencies } from "../../src/alertas/alertas.factory";
import { LocalD1Adapter } from "../helpers/local-d1.adapter";

const db = new LocalD1Adapter();
const jwtSecret = "integration-secret-key";
const AHORA = "2026-11-05T15:00:00.000Z";
const DIA = 86400000;
const hace = (ms: number) => new Date(Date.parse(AHORA) - ms).toISOString();

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
  const usuario = await auth.register({ email, nombre: "Alertas", password: "Password123!" });
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

const insAve = (c: string, id: string, codigo: string, x: { estado?: string; salud?: string | null; control?: string | null } = {}) =>
  sql(`INSERT INTO aves (id, criadero_id, codigo, origen, estado, estado_salud, fecha_ultimo_control_salud)
       VALUES (?, ?, ?, 'NACIDA_CRIADERO', ?, ?, ?)`,
    id, c, codigo, x.estado ?? "ACTIVA", x.salud === undefined ? "SANA" : x.salud, x.control ?? null);

const insHuevo = (c: string, id: string, codigo: string, ave: string, fecha: string) =>
  sql(`INSERT INTO huevos (id, criadero_id, codigo, ave_id, fecha) VALUES (?, ?, ?, ?, ?)`, id, c, codigo, ave, fecha);

const insCuidado = (tabla: "alimentacion_jaula" | "bebida_jaula", c: string, id: string, jaula: string, fecha: string) =>
  sql(`INSERT INTO ${tabla} (id, criadero_id, jaula_id, fecha, tipo) VALUES (?, ?, ?, ?, 'Maiz')`, id, c, jaula, fecha);

const insMov = (c: string, id: string, tipo: string, valor: number, fecha: string) =>
  sql(`INSERT INTO movimientos_financieros (id, criadero_id, tipo, categoria, fecha, valor) VALUES (?, ?, ?, 'CAT', ?, ?)`, id, c, tipo, fecha, valor);

describe("Alertas D1 local (SQLite en memoria)", () => {
  let A: Cuenta;
  let B: Cuenta;
  let aveHuevera: string;
  let seq = 0;
  const nuevo = (p: string) => `${p}-${String(++seq).padStart(6, "0")}`;
  const contador = new D1Contador();
  const app = createApp({
    alertasRouter: createAlertasRouter(() => createAlertasDependencies(contador as any, () => new Date(contador.reloj))),
  });

  async function get(cuenta: Cuenta, criaderoId: string, conToken = true) {
    const t0 = performance.now();
    const antes = contador.llamadas;
    const headers: Record<string, string> = conToken ? { Authorization: `Bearer ${await token(cuenta.userId)}` } : {};
    const r = await app.request(
      `/api/v1/criaderos/${criaderoId}/alertas`,
      { headers },
      { JWT_SECRET: jwtSecret, DB: contador }
    );
    const texto = await r.text();
    return { status: r.status, texto, body: JSON.parse(texto) as any, llamadas: contador.llamadas - antes, ms: performance.now() - t0 };
  }

  async function alertas(c: Cuenta = A) {
    const r = await get(c, c.criaderoId);
    expect(r.status).toBe(200);
    return r.body.data.alertas as Array<Record<string, any>>;
  }

  async function borrarJaulas(...cs: string[]) {
    for (const c of cs) {
      await sql(`DELETE FROM alimentacion_jaula WHERE criadero_id = ?`, c).run();
      await sql(`DELETE FROM bebida_jaula WHERE criadero_id = ?`, c).run();
      await sql(`DELETE FROM jaulas WHERE criadero_id = ?`, c).run();
    }
  }

  beforeAll(async () => {
    A = await crearUsuarioYCriadero("a@alertas.d1.test");
    B = await crearUsuarioYCriadero("b@alertas.d1.test");
    aveHuevera = "ave-huevera-a";
    await insAve(A.criaderoId, aveHuevera, "HUEVERA", { estado: "VENDIDA" }).run();
  });

  it("debe devolver solo Produccion en un criadero sin datos (ALE-01)", async () => {
    const a = await alertas();

    expect(a).toStrictEqual([{
      tipo: "PRODUCCION", nivel: "MEDIO", titulo: "Sin producción registrada",
      mensaje: "No existen huevos registrados hoy.", entidadId: null, accion: null, accionDestino: null,
    }]);
  });

  it("debe alertar alimentacion y bebida de una jaula activa sin cuidados y respetar jaula inactiva y registros ajenos (ALE-02..07)", async () => {
    await borrarJaulas(A.criaderoId, B.criaderoId);
    await lote([
      insJaula(A.criaderoId, "ja-1", "J01"),
      insJaula(A.criaderoId, "ja-2", "J02"),
      insJaula(A.criaderoId, "ja-3", "J03"),
      insJaula(A.criaderoId, "ja-4", "J04", 0),
      insJaula(A.criaderoId, "ja-5", "J05"),
      insJaula(B.criaderoId, "jb-1", "J01"),
      insHuevo(A.criaderoId, nuevo("h"), "H000001", aveHuevera, hace(1000)),
      // J02: alimentacion hoy, sin bebida; J03: ambas hoy; J05: solo ayer, mañana y de otra jaula
      insCuidado("alimentacion_jaula", A.criaderoId, nuevo("c"), "ja-2", hace(1000)),
      insCuidado("alimentacion_jaula", A.criaderoId, nuevo("c"), "ja-3", hace(2000)),
      insCuidado("bebida_jaula", A.criaderoId, nuevo("c"), "ja-3", hace(2000)),
      insCuidado("alimentacion_jaula", A.criaderoId, nuevo("c"), "ja-5", hace(DIA)),
      insCuidado("bebida_jaula", A.criaderoId, nuevo("c"), "ja-5", hace(-DIA)),
      insCuidado("bebida_jaula", A.criaderoId, nuevo("c"), "ja-2", hace(DIA)),
      // otro criadero con registros hoy en una jaula suya no cuenta
      insCuidado("alimentacion_jaula", B.criaderoId, nuevo("c"), "jb-1", hace(1000)),
    ]);
    const a = await alertas();

    expect(a.map((x) => [x.entidadId, x.accionDestino])).toEqual([
      ["ja-1", "ALIMENTACION_JAULA"], ["ja-1", "BEBIDA_JAULA"],
      ["ja-2", "BEBIDA_JAULA"],
      ["ja-5", "ALIMENTACION_JAULA"], ["ja-5", "BEBIDA_JAULA"],
    ]);
    expect(a[0]).toStrictEqual({
      tipo: "JAULA", nivel: "MEDIO", titulo: "Sin alimentación registrada",
      mensaje: "La jaula J01 no tiene alimentación registrada hoy.", entidadId: "ja-1", accion: "DETALLE_JAULA", accionDestino: "ALIMENTACION_JAULA",
    });
    expect(a.some((x) => x.mensaje.includes("J03") || x.mensaje.includes("J04"))).toBe(false);
  });

  it("debe contar como hoy solo los bordes UTC del dia y convertir desplazamientos (ALE-08, ALE-09)", async () => {
    await borrarJaulas(A.criaderoId);
    const fechas = [
      "2026-11-05T00:00:00.000Z", "2026-11-05T23:59:59.999Z", "2026-11-06T00:00:00.000Z",
      "2026-11-04T23:59:59.999Z", "2026-11-05T22:00:00-05:00",
    ];
    const lista = [] as any[];
    fechas.forEach((f, i) => {
      lista.push(insJaula(A.criaderoId, `jf-${i}`, `F0${i}`));
      lista.push(insCuidado("alimentacion_jaula", A.criaderoId, nuevo("c"), `jf-${i}`, f));
      lista.push(insCuidado("bebida_jaula", A.criaderoId, nuevo("c"), `jf-${i}`, f));
    });
    await lote(lista);
    const a = (await alertas()).filter((x) => x.tipo === "JAULA");

    expect(a.map((x) => x.entidadId)).toEqual(["jf-2", "jf-2", "jf-3", "jf-3", "jf-4", "jf-4"]);
  });

  it("debe alertar la salud segun dias, estado y fecha de control (ALE-10..17)", async () => {
    await borrarJaulas(A.criaderoId);
    await lote([
      insAve(A.criaderoId, "as-1", "K001", { salud: "EN_TRATAMIENTO", control: hace(8 * DIA) }),
      insAve(A.criaderoId, "as-2", "K002", { salud: "EN_TRATAMIENTO", control: hace(7.9 * DIA) }),
      insAve(A.criaderoId, "as-3", "K003", { salud: "EN_TRATAMIENTO", control: hace(7 * DIA - 1000) }),
      insAve(A.criaderoId, "as-4", "K004", { salud: "EN_TRATAMIENTO", control: null }),
      insAve(A.criaderoId, "as-5", "K005", { salud: "EN_TRATAMIENTO", control: "no es fecha" }),
      insAve(A.criaderoId, "as-6", "K006", { salud: "EN_TRATAMIENTO", control: hace(-3 * DIA) }),
      insAve(A.criaderoId, "as-7", "K007", { salud: "EN_TRATAMIENTO", control: hace(9 * DIA), estado: "VENDIDA" }),
      insAve(A.criaderoId, "as-8", "K008", { salud: "EN_TRATAMIENTO", control: hace(9 * DIA), estado: "FALLECIDA" }),
      insAve(A.criaderoId, "as-9", "K009", { salud: "ENFERMA", control: hace(9 * DIA) }),
      insAve(A.criaderoId, "as-10", "K010", { salud: "SANA", control: hace(9 * DIA) }),
      insAve(A.criaderoId, "as-11", "K011", { salud: null, control: hace(9 * DIA) }),
      insAve(A.criaderoId, "as-12", "K012", { salud: "EN_TRATAMIENTO", control: "2026-10-28 14:00:00" }),
      insAve(A.criaderoId, "as-13", "K013", { salud: "EN_TRATAMIENTO", control: "2026-10-28T09:00:00-05:00" }),
      insAve(B.criaderoId, "asb-1", "K001", { salud: "EN_TRATAMIENTO", control: hace(30 * DIA) }),
    ]);
    const a = (await alertas()).filter((x) => x.tipo === "SALUD");

    expect(a.map((x) => x.mensaje)).toEqual([
      "El ave K001 lleva 8 días en tratamiento.",
      "El ave K002 lleva 7 días en tratamiento.",
      "El ave K012 lleva 8 días en tratamiento.",
      "El ave K013 lleva 8 días en tratamiento.",
    ]);
    expect(a.map((x) => x.entidadId)).toEqual(["as-1", "as-2", "as-12", "as-13"]);
  });

  it("debe ordenar salud y jaulas por rowid aunque los ids no sean crecientes", async () => {
    await sql(`DELETE FROM aves WHERE criadero_id IN (?, ?) AND codigo LIKE 'K%'`, A.criaderoId, B.criaderoId).run();
    await borrarJaulas(A.criaderoId);
    await lote([
      insAve(A.criaderoId, "az-9", "Z", { salud: "EN_TRATAMIENTO", control: hace(9 * DIA) }),
      insAve(A.criaderoId, "az-1", "A", { salud: "EN_TRATAMIENTO", control: hace(9 * DIA) }),
      insJaula(A.criaderoId, "jz-9", "Z01"),
      insJaula(A.criaderoId, "jz-1", "A01"),
    ]);
    const a = await alertas();

    expect(a.filter((x) => x.tipo === "SALUD").map((x) => x.entidadId)).toEqual(["az-9", "az-1"]);
    expect(a.filter((x) => x.tipo === "JAULA").map((x) => x.entidadId)).toEqual(["jz-9", "jz-9", "jz-1", "jz-1"]);
  });

  it("debe alertar Produccion solo si no hay huevos hoy en este criadero (ALE-18, ALE-19)", async () => {
    await sql(`DELETE FROM huevos WHERE criadero_id IN (?, ?)`, A.criaderoId, B.criaderoId).run();
    await lote([insHuevo(A.criaderoId, nuevo("h"), "H000001", aveHuevera, hace(DIA))]);
    expect((await alertas()).some((x) => x.tipo === "PRODUCCION")).toBe(true);

    await sql(`INSERT INTO aves (id, criadero_id, codigo, origen) VALUES ('ave-b-h', ?, 'HB', 'NACIDA_CRIADERO')`, B.criaderoId).run();
    await lote([insHuevo(B.criaderoId, nuevo("h"), "H000001", "ave-b-h", hace(1000))]);
    expect((await alertas()).some((x) => x.tipo === "PRODUCCION")).toBe(true);

    await lote([insHuevo(A.criaderoId, nuevo("h"), "H000002", aveHuevera, hace(1000))]);
    expect((await alertas()).some((x) => x.tipo === "PRODUCCION")).toBe(false);
  });

  it("debe alertar Finanzas solo con egresos estrictamente mayores en el mes UTC (ALE-20..23)", async () => {
    const fin = async () => (await alertas()).some((x) => x.tipo === "FINANZAS");
    const reset = () => sql(`DELETE FROM movimientos_financieros WHERE criadero_id IN (?, ?)`, A.criaderoId, B.criaderoId).run();

    await reset();
    expect(await fin()).toBe(false); // 0 = 0

    await lote([insMov(A.criaderoId, nuevo("m"), "INGRESO", 10, hace(1000)), insMov(A.criaderoId, nuevo("m"), "EGRESO", 10, hace(1000))]);
    expect(await fin()).toBe(false); // iguales

    await lote([insMov(A.criaderoId, nuevo("m"), "OTRO", 500, hace(1000))]);
    expect(await fin()).toBe(false); // otro tipo no suma

    await lote([insMov(A.criaderoId, nuevo("m"), "EGRESO", 0.01, hace(1000))]);
    expect(await fin()).toBe(true);

    await reset();
    await lote([
      insMov(A.criaderoId, nuevo("m"), "EGRESO", 99, "2026-10-31T23:59:59.999Z"),
      insMov(A.criaderoId, nuevo("m"), "EGRESO", 99, "2026-12-01T00:00:00.000Z"),
      insMov(B.criaderoId, nuevo("m"), "EGRESO", 99, hace(1000)),
    ]);
    expect(await fin()).toBe(false);
    await lote([insMov(A.criaderoId, nuevo("m"), "EGRESO", 1, "2026-11-01T00:00:00.000Z")]);
    expect(await fin()).toBe(true);
    await reset();
  });

  it("debe responder 401 sin token y 403 con criadero ajeno o inexistente (ALE-29)", async () => {
    expect((await get(A, A.criaderoId, false)).status).toBe(401);
    expect((await get(A, B.criaderoId)).status).toBe(403);
    expect((await get(A, "no-existe")).status).toBe(403);
  });

  it("debe aislar criaderos con codigos repetidos (ALE-29)", async () => {
    await sql(`DELETE FROM huevos WHERE criadero_id IN (?, ?)`, A.criaderoId, B.criaderoId).run();
    await sql(`DELETE FROM aves WHERE criadero_id IN (?, ?) AND codigo <> 'HUEVERA'`, A.criaderoId, B.criaderoId).run();
    await borrarJaulas(A.criaderoId, B.criaderoId);
    await lote([
      insJaula(A.criaderoId, "ia-1", "J01"),
      insJaula(B.criaderoId, "ib-1", "J01"),
      insJaula(B.criaderoId, "ib-2", "J02"),
      insAve(B.criaderoId, "ib-a1", "K001", { salud: "EN_TRATAMIENTO", control: hace(20 * DIA) }),
    ]);
    const a = await alertas(A);
    const b = await alertas(B);

    expect(a.filter((x) => x.tipo === "JAULA").map((x) => x.entidadId)).toEqual(["ia-1", "ia-1"]);
    expect(a.some((x) => x.tipo === "SALUD")).toBe(false);
    expect(b.filter((x) => x.tipo === "JAULA").map((x) => x.entidadId)).toEqual(["ib-1", "ib-1", "ib-2", "ib-2"]);
    expect(b.filter((x) => x.tipo === "SALUD").map((x) => x.entidadId)).toEqual(["ib-a1"]);
  });

  it("debe hacer 5 llamadas a D1 con pocos datos, sin batch (ALE-30)", async () => {
    contador.batches = 0;
    const r = await get(A, A.criaderoId);

    expect(r.status).toBe(200);
    expect(r.llamadas).toBe(5);
    expect(contador.batches).toBe(0);
  });

  it("debe usar un solo instante por peticion en el borde de medianoche UTC (ALE-32)", async () => {
    await sql(`DELETE FROM huevos WHERE criadero_id = ?`, A.criaderoId).run();
    await lote([insHuevo(A.criaderoId, nuevo("h"), "H000009", aveHuevera, "2026-11-05T23:59:59.999Z")]);

    contador.reloj = "2026-11-05T23:59:59.999Z";
    expect((await alertas()).some((x) => x.tipo === "PRODUCCION")).toBe(false);
    contador.reloj = "2026-11-06T00:00:00.000Z";
    expect((await alertas()).some((x) => x.tipo === "PRODUCCION")).toBe(true);
    contador.reloj = AHORA;
  });

  describe("datos grandes (ALE-30)", () => {
    it("debe mantener 5 llamadas a D1 con 60 jaulas, 300 aves, 2000 huevos, 2000 movimientos y 2000 cuidados de cada tipo", async () => {
      const G = await crearUsuarioYCriadero("g@alertas.d1.test");
      const c = G.criaderoId;
      const st: any[] = [];
      for (let i = 1; i <= 60; i++) st.push(insJaula(c, `gj-${i}`, `J${String(i).padStart(3, "0")}`));
      for (let i = 1; i <= 300; i++) {
        const tratamiento = i <= 30;
        st.push(insAve(c, `ga-${i}`, `K${String(i).padStart(4, "0")}`,
          tratamiento ? { salud: "EN_TRATAMIENTO", control: hace((8 + (i % 5)) * DIA) } : {}));
      }
      await lote(st);
      const st2: any[] = [];
      for (let i = 1; i <= 2000; i++) {
        st2.push(insHuevo(c, `gh-${i}`, `H${String(i).padStart(6, "0")}`, `ga-${(i % 300) + 1}`, hace((1 + (i % 40)) * DIA)));
        st2.push(insMov(c, `gm-${i}`, i % 3 === 0 ? "INGRESO" : "EGRESO", 1 + (i % 17) * 0.37, hace((i % 90) * DIA + 3600000)));
        st2.push(insCuidado("alimentacion_jaula", c, `gl-${i}`, `gj-${(i % 60) + 1}`, hace((1 + (i % 60)) * DIA)));
        st2.push(insCuidado("bebida_jaula", c, `gw-${i}`, `gj-${(i % 60) + 1}`, hace((1 + (i % 60)) * DIA)));
      }
      await lote(st2);

      const muestras: Array<{ llamadas: number; ms: number; bytes: number; alertas: number }> = [];
      for (let k = 0; k < 3; k++) {
        const r = await get(G, c);
        expect(r.status).toBe(200);
        muestras.push({ llamadas: r.llamadas, ms: Math.round(r.ms), bytes: r.texto.length, alertas: r.body.data.alertas.length });
      }
      console.log("ALERTAS datos grandes (todas las jaulas sin cuidados hoy):", JSON.stringify(muestras));

      for (const m of muestras) expect(m.llamadas).toBe(5);
      // 30 salud + 120 jaula + produccion (huevos solo de dias previos) + finanzas (egresos > ingresos)
      expect(muestras[0].alertas).toBe(30 + 120 + 1 + 1);

      // con cuidados hoy en todas las jaulas: sigue en 5 llamadas y quedan menos alertas
      const hoy: any[] = [];
      for (let i = 1; i <= 60; i++) {
        hoy.push(insCuidado("alimentacion_jaula", c, `gla-${i}`, `gj-${i}`, hace(1000)));
        hoy.push(insCuidado("bebida_jaula", c, `gwa-${i}`, `gj-${i}`, hace(1000)));
      }
      await lote(hoy);
      const r2 = await get(G, c);
      console.log("ALERTAS datos grandes (cuidados hoy):", JSON.stringify({ llamadas: r2.llamadas, ms: Math.round(r2.ms), bytes: r2.texto.length, alertas: r2.body.data.alertas.length }));
      expect(r2.llamadas).toBe(5);
      expect(r2.body.data.alertas.length).toBe(30 + 1 + 1);
    }, 60000);
  });
});
