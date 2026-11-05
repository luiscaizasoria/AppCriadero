import type { ClientesRepository } from './clientes.repository';
import type { Cliente, CompraCliente, Resultado } from './clientes.types';


/** Solo lectura: replica ClientesRepository.js de V1 (sin validaciones ni errores propios). */
export class ClientesService {

  constructor(private repo: ClientesRepository) {}

  async listar(criaderoId: string): Promise<Resultado<{ clientes: Cliente[] }>> {
    return { success: true, data: { clientes: await this.repo.listarClientes(criaderoId) } };
  }

  /** `cliente: null` si no hay ventas con ese celular (V1 devolvia null). */
  async obtenerPorCelular(criaderoId: string, celular: string): Promise<Resultado<{ cliente: Cliente | null }>> {
    return { success: true, data: { cliente: await this.repo.obtenerClientePorCelular(criaderoId, celular) } };
  }

  async compras(criaderoId: string, celular: string): Promise<Resultado<{ compras: CompraCliente[] }>> {
    return { success: true, data: { compras: await this.repo.listarComprasCliente(criaderoId, celular) } };
  }

}
