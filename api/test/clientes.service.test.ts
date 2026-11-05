import { describe, it, expect, beforeEach } from "vitest";
import { ClientesService } from "../src/clientes/clientes.service";
import type { Cliente } from "../src/clientes/clientes.types";
import { FakeClientesRepository } from "./helpers/fake-clientes.repository";

const CLIENTE: Cliente = {
  celular: "0991234567",
  nombre: "Ana",
  ciudad: "Quito",
  totalCompras: 2,
  totalVentas: 20,
  totalEnvios: 3.25,
  ultimaCompra: "2026-11-01T10:00:00.000Z",
};

describe("ClientesService", () => {
  let repo: FakeClientesRepository;
  let service: ClientesService;

  beforeEach(() => {
    repo = new FakeClientesRepository();
    service = new ClientesService(repo);
  });

  it("debe devolver clientes: [] sin error cuando no hay ventas", async () => {
    expect(await service.listar("c1")).toEqual({ success: true, data: { clientes: [] } });
  });

  it("debe listar los clientes del criadero pedido", async () => {
    repo.sembrarClientes("c1", [CLIENTE]);

    expect(await service.listar("c1")).toEqual({ success: true, data: { clientes: [CLIENTE] } });
    expect(await service.listar("c2")).toEqual({ success: true, data: { clientes: [] } });
  });

  it("debe responder cliente: null y no un error si el celular no tiene ventas", async () => {
    expect(await service.obtenerPorCelular("c1", "000")).toEqual({ success: true, data: { cliente: null } });
  });

  it("debe devolver el cliente por celular exacto sin normalizar", async () => {
    repo.sembrarClientes("c1", [CLIENTE]);

    expect(await service.obtenerPorCelular("c1", "0991234567")).toEqual({ success: true, data: { cliente: CLIENTE } });
    expect(await service.obtenerPorCelular("c1", "+0991234567")).toEqual({ success: true, data: { cliente: null } });
  });

  it("debe devolver compras: [] para un celular sin ventas", async () => {
    expect(await service.compras("c1", "000")).toEqual({ success: true, data: { compras: [] } });
  });

  it("debe pasar el celular al repositorio sin transformarlo", async () => {
    await service.compras("c1", "+593 99 123 4567");

    expect(repo.llamadas).toEqual([{ metodo: "listarComprasCliente", criaderoId: "c1", celular: "+593 99 123 4567" }]);
  });
});
