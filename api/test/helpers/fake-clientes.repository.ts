import type { ClientesRepository } from "../../src/clientes/clientes.repository";
import type { Cliente, CompraCliente } from "../../src/clientes/clientes.types";

/** Repositorio falso de Clientes: devuelve lo sembrado por criadero y registra las llamadas. */
export class FakeClientesRepository implements ClientesRepository {
  clientes = new Map<string, Cliente[]>();
  compras = new Map<string, CompraCliente[]>();
  llamadas: Array<{ metodo: string; criaderoId: string; celular?: string }> = [];

  sembrarClientes(criaderoId: string, filas: Cliente[]) {
    this.clientes.set(criaderoId, filas);
  }

  sembrarCompras(criaderoId: string, celular: string, filas: CompraCliente[]) {
    this.compras.set(`${criaderoId}|${celular}`, filas);
  }

  async listarClientes(criaderoId: string): Promise<Cliente[]> {
    this.llamadas.push({ metodo: "listarClientes", criaderoId });
    return this.clientes.get(criaderoId) ?? [];
  }

  async obtenerClientePorCelular(criaderoId: string, celular: string): Promise<Cliente | null> {
    this.llamadas.push({ metodo: "obtenerClientePorCelular", criaderoId, celular });
    return (this.clientes.get(criaderoId) ?? []).find((c) => c.celular === celular) ?? null;
  }

  async listarComprasCliente(criaderoId: string, celular: string): Promise<CompraCliente[]> {
    this.llamadas.push({ metodo: "listarComprasCliente", criaderoId, celular });
    return this.compras.get(`${criaderoId}|${celular}`) ?? [];
  }
}
