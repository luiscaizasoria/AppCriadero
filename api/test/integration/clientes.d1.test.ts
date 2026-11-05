import { describe, it, expect, beforeAll } from "vitest";
import { SignJWT } from "jose";
import { AuthService } from "../../src/auth/auth.service";
import { D1AuthRepository } from "../../src/auth/auth.repository";
import { CriaderoService } from "../../src/criaderos/criaderos.service";
import { D1CriaderoRepository } from "../../src/criaderos/criaderos.repository";
import { createApp } from "../../src/app";
import { createClientesRouter } from "../../src/clientes/clientes.routes";
import { createClientesDependencies } from "../../src/clientes/clientes.factory";
import { LocalD1Adapter } from "../helpers/local-d1.adapter";

const db = new LocalD1Adapter();
const jwtSecret = "integration-secret-key";

/** Envuelve el adaptador y cuenta cada llamada a D1 (all / first / run / batch). */
class D1Contador {
  llamadas = 0;

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
}

async function crearUsuarioYCriadero(email: string) {
  const auth = new AuthService(new D1AuthRepository(db as any), jwtSecret);
  const usuario = await auth.register({ email, nombre: "Clientes", password: "Password123!" });
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

async function insertarAves(criadero: string, prefijo: string, cantidad: number) {
  const stmts = [];
  for (let i = 1; i <= cantidad; i++) {
    stmts.push(
      db.prepare("INSERT INTO aves (id, criadero_id, codigo, origen, raza, sexo) VALUES (?, ?, ?, 'NACIDA_CRIADERO', 'Fina', 'HEMBRA')")
        .bind(`${prefijo}-a${i}`, criadero, `${prefijo}${i}`)
    );
  }
  await db.batch(stmts);
}

async function insertarVenta(v: { id: string; criadero: string; ave: string; fecha: string; celular: string | null; comprador?: string | null; ciudad?: string | null; vv?: number | null; ve?: number | null; tipo?: string }) {
  await db.prepare(
    `INSERT INTO bajas_ave (id, criadero_id, ave_id, tipo, fecha, celular, comprador, ciudad_destino, valor_venta, valor_envio)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
  ).bind(v.id, v.criadero, v.ave, v.tipo ?? "VENTA", v.fecha, v.celular, v.comprador ?? null, v.ciudad ?? null, v.vv ?? null, v.ve ?? null).run();
}

describe("Clientes D1 local (SQLite en memoria)", () => {
  let A: { userId: string; criaderoId: string };
  let B: { userId: string; criaderoId: string };
  const contador = new D1Contador();
  const app = createApp({
    clientesRouter: createClientesRouter(() => createClientesDependencies(contador as any)),
  });

  async function get(userId: string, criaderoId: string, ruta: string) {
    const t0 = performance.now();
    const antes = contador.llamadas;
    const r = await app.request(
      `/api/v1/criaderos/${criaderoId}/clientes${ruta}`,
      { headers: { Authorization: `Bearer ${await token(userId)}` } },
      { JWT_SECRET: jwtSecret, DB: contador }
    );
    return { status: r.status, body: await r.json() as any, llamadas: contador.llamadas - antes, ms: performance.now() - t0 };
  }

  beforeAll(async () => {
    A = await crearUsuarioYCriadero("clientes.a@test.com");
    B = await crearUsuarioYCriadero("clientes.b@test.com");
    await insertarAves(A.criaderoId, "A", 3);
    await insertarAves(B.criaderoId, "B", 3);
  });

  it("debe devolver clientes vacios, cliente null y compras vacias en un criadero sin ventas", async () => {
    const vacio = await crearUsuarioYCriadero("clientes.vacio@test.com");

    expect((await get(vacio.userId, vacio.criaderoId, "")).body).toEqual({ success: true, data: { clientes: [] } });
    expect((await get(vacio.userId, vacio.criaderoId, "/099")).body).toEqual({ success: true, data: { cliente: null } });
    expect((await get(vacio.userId, vacio.criaderoId, "/099/compras")).body).toEqual({ success: true, data: { compras: [] } });
  });

  it("debe aislar los criaderos: mismo celular en otro criadero no mezcla nombre, ciudad, totales ni compras", async () => {
    await insertarVenta({ id: "ia1", criadero: A.criaderoId, ave: "A-a1", fecha: "2026-10-01T00:00:00.000Z", celular: "0991", comprador: "Ana", ciudad: "Quito", vv: 10, ve: 1 });
    await insertarVenta({ id: "ib1", criadero: B.criaderoId, ave: "B-a1", fecha: "2026-11-01T00:00:00.000Z", celular: "0991", comprador: "Beto", ciudad: "Loja", vv: 500, ve: 50 });
    await insertarVenta({ id: "ib2", criadero: B.criaderoId, ave: "B-a2", fecha: "2026-11-02T00:00:00.000Z", celular: "0992", comprador: "Solo B", vv: 1 });

    const listaA = (await get(A.userId, A.criaderoId, "")).body.data.clientes;
    const listaB = (await get(B.userId, B.criaderoId, "")).body.data.clientes;

    expect(listaA).toEqual([
      { celular: "0991", nombre: "Ana", ciudad: "Quito", totalCompras: 1, totalVentas: 10, totalEnvios: 1, ultimaCompra: "2026-10-01T00:00:00.000Z" },
    ]);
    expect(listaB.map((c: any) => [c.celular, c.nombre, c.ciudad, c.totalCompras, c.totalVentas])).toEqual([
      ["0992", "Solo B", "", 1, 1],
      ["0991", "Beto", "Loja", 1, 500],
    ]);

    expect((await get(A.userId, A.criaderoId, "/0991")).body.data.cliente.nombre).toBe("Ana");
    expect((await get(A.userId, A.criaderoId, "/0992")).body.data.cliente).toBeNull();

    const comprasA = (await get(A.userId, A.criaderoId, "/0991/compras")).body.data.compras;
    expect(comprasA.map((c: any) => [c.ventaId, c.aveCodigo])).toEqual([["ia1", "A1"]]);
    expect((await get(A.userId, A.criaderoId, "/0992/compras")).body.data.compras).toEqual([]);
  });

  it("debe responder 403 FORBIDDEN sin filtrar datos si el criadero es de otro usuario", async () => {
    for (const ruta of ["", "/0991", "/0991/compras"]) {
      const r = await get(A.userId, B.criaderoId, ruta);

      expect(r.status, ruta).toBe(403);
      expect(r.body.error).toBe("FORBIDDEN");
      expect(JSON.stringify(r.body)).not.toContain("Beto");
    }
  });

  it("debe responder 403 en un criadero inexistente (la propiedad no distingue inexistente de ajeno)", async () => {
    expect((await get(A.userId, "no-existe", "")).status).toBe(403);
  });

  it("debe encontrar por HTTP celulares con +, espacios, % y / codificados y no normalizarlos (CLI-12)", async () => {
    const celulares = ["+593 99 123 4567", "50%", "a/b", "593 99"];
    let n = 0;

    for (const celular of celulares) {
      await insertarVenta({ id: `ic${++n}`, criadero: A.criaderoId, ave: "A-a2", fecha: `2026-09-0${n}T00:00:00.000Z`, celular, comprador: `C${n}` });
    }

    for (const [i, celular] of celulares.entries()) {
      const r = await get(A.userId, A.criaderoId, `/${encodeURIComponent(celular)}`);
      const compras = await get(A.userId, A.criaderoId, `/${encodeURIComponent(celular)}/compras`);

      expect(r.body.data.cliente?.celular, celular).toBe(celular);
      expect(r.body.data.cliente?.nombre).toBe(`C${i + 1}`);
      expect(compras.body.data.compras.map((c: any) => c.ventaId)).toEqual([`ic${i + 1}`]);
    }

    expect((await get(A.userId, A.criaderoId, `/${encodeURIComponent("+59399")}`)).body.data.cliente).toBeNull();
    expect((await get(A.userId, A.criaderoId, `/${encodeURIComponent("593 99 123 4567")}`)).body.data.cliente).toBeNull();
  });

  it("debe usar 2 llamadas a D1 por endpoint con pocos datos y con 2000 ventas, y medir el tiempo (CLI-19)", async () => {
    const pocos = await crearUsuarioYCriadero("clientes.pocos@test.com");
    await insertarAves(pocos.criaderoId, "P", 3);
    await insertarVenta({ id: "p1", criadero: pocos.criaderoId, ave: "P-a1", fecha: "2026-10-01T00:00:00.000Z", celular: "0990", comprador: "Pocos" });

    const grande = await crearUsuarioYCriadero("clientes.grande@test.com");
    await insertarAves(grande.criaderoId, "G", 2000);
    const ventas = [];
    for (let i = 1; i <= 2000; i++) {
      const celular = `09${String(i % 400).padStart(8, "0")}`; // 400 celulares, 5 ventas cada uno
      const dia = String(1 + (i % 28)).padStart(2, "0");
      ventas.push(
        db.prepare(
          `INSERT INTO bajas_ave (id, criadero_id, ave_id, tipo, fecha, celular, comprador, ciudad_destino, valor_venta, valor_envio)
           VALUES (?, ?, ?, 'VENTA', ?, ?, ?, ?, ?, ?)`
        ).bind(`g${String(i).padStart(5, "0")}`, grande.criaderoId, `G-a${i}`, `2026-10-${dia}T00:00:00.000Z`, celular, i % 3 === 0 ? null : `Comp ${i}`, i % 2 === 0 ? "Quito" : null, i * 0.1, i % 5 === 0 ? null : 0.25)
      );
    }
    await db.batch(ventas);

    const celularGrande = `09${String(7).padStart(8, "0")}`;
    const casos: Array<[string, string]> = [
      ["GET /clientes", ""],
      ["GET /clientes/:celular", `/${celularGrande}`],
      ["GET /clientes/:celular/compras", `/${celularGrande}/compras`],
    ];

    const informe: string[] = [];

    for (const [nombre, ruta] of casos) {
      const p = await get(pocos.userId, pocos.criaderoId, ruta.replace(celularGrande, "0990"));
      const g = await get(grande.userId, grande.criaderoId, ruta);

      expect(p.status).toBe(200);
      expect(g.status).toBe(200);
      expect(p.llamadas, `${nombre} pocos datos`).toBe(2);
      expect(g.llamadas, `${nombre} 2000 ventas`).toBe(2);
      informe.push(`${nombre}: llamadas D1 pocos=${p.llamadas} grande=${g.llamadas}; tiempo pocos=${p.ms.toFixed(1)} ms grande=${g.ms.toFixed(1)} ms`);
    }

    const lista = (await get(grande.userId, grande.criaderoId, "")).body.data.clientes;
    expect(lista).toHaveLength(400);
    expect(lista.reduce((s: number, c: any) => s + c.totalCompras, 0)).toBe(2000);

    const compras = (await get(grande.userId, grande.criaderoId, `/${celularGrande}/compras`)).body.data.compras;
    expect(compras).toHaveLength(5);

    console.log(informe.join("\n"));
  });
});
