import { describe, it, expect } from "vitest";
import {
  PBKDF2_ITERATIONS,
  hashPassword,
  verifyPassword,
} from "../src/auth/auth.repository";

describe("hash de contraseñas PBKDF2", () => {
  it("debe usar un número de iteraciones que workerd admita (máximo 100000)", () => {
    expect(PBKDF2_ITERATIONS).toBeLessThanOrEqual(100000);
  });

  it("debe generar los hashes nuevos con 100000 iteraciones", async () => {
    const hash = await hashPassword("PruebaKiki2026");
    const [formato, iteraciones] = hash.split("$");

    expect(formato).toBe("pbkdf2_sha256");
    expect(Number(iteraciones)).toBe(100000);
  });

  it("debe verificar una contraseña con el número de iteraciones guardado en el hash", async () => {
    const hash = await hashPassword("PruebaKiki2026");

    expect(await verifyPassword("PruebaKiki2026", hash)).toBe(true);
    expect(await verifyPassword("otra-clave", hash)).toBe(false);
  });
});
