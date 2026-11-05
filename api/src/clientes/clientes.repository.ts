import type { Cliente, CompraCliente } from './clientes.types';


export interface ClientesRepository {
  listarClientes(criaderoId: string): Promise<Cliente[]>;
  obtenerClientePorCelular(criaderoId: string, celular: string): Promise<Cliente | null>;
  listarComprasCliente(criaderoId: string, celular: string): Promise<CompraCliente[]>;
}


// Misma SELECT de V1 (ClientesRepository.js) con criadero_id anadido en la consulta
// principal y en cada subconsulta. Las subconsultas viajan dentro de la misma sentencia:
// una sola llamada a D1 por endpoint. Parametros posicionales `?` (en orden de aparicion:
// subconsulta de nombre, subconsulta de ciudad, WHERE principal).
const SELECT_CLIENTE = `
  SELECT
    b.celular AS celular,
    COALESCE((
      SELECT b2.comprador FROM bajas_ave b2
      WHERE b2.criadero_id = ? AND b2.tipo = 'VENTA' AND b2.celular = b.celular
        AND TRIM(COALESCE(b2.comprador, '')) <> ''
      ORDER BY b2.fecha DESC, b2.id DESC LIMIT 1
    ), 'Sin nombre') AS nombre,
    COALESCE((
      SELECT b3.ciudad_destino FROM bajas_ave b3
      WHERE b3.criadero_id = ? AND b3.tipo = 'VENTA' AND b3.celular = b.celular
        AND TRIM(COALESCE(b3.ciudad_destino, '')) <> ''
      ORDER BY b3.fecha DESC, b3.id DESC LIMIT 1
    ), '') AS ciudad,
    COUNT(*) AS totalCompras,
    COALESCE(SUM(b.valor_venta), 0) AS totalVentas,
    COALESCE(SUM(b.valor_envio), 0) AS totalEnvios,
    MAX(b.fecha) AS ultimaCompra
  FROM bajas_ave b
`;

const SQL_LISTAR = `${SELECT_CLIENTE}
  WHERE b.criadero_id = ? AND b.tipo = 'VENTA'
    AND b.celular IS NOT NULL AND TRIM(b.celular) <> ''
  GROUP BY b.celular
  ORDER BY ultimaCompra DESC, b.celular ASC`;

const SQL_POR_CELULAR = `${SELECT_CLIENTE}
  WHERE b.criadero_id = ? AND b.tipo = 'VENTA' AND b.celular = ?
  GROUP BY b.celular`;

const SQL_COMPRAS = `
  SELECT b.id AS ventaId, b.fecha, b.celular, b.comprador,
         b.ciudad_destino AS ciudadDestino, b.cooperativa_envio AS cooperativaEnvio,
         b.valor_venta AS valorVenta, b.valor_envio AS valorEnvio, b.detalle,
         a.id AS aveId, a.codigo AS aveCodigo, a.raza AS aveRaza, a.sexo AS aveSexo,
         a.foto_r2_key AS aveFotoUri
  FROM bajas_ave b
  INNER JOIN aves a ON a.id = b.ave_id AND a.criadero_id = b.criadero_id
  WHERE b.criadero_id = ? AND b.tipo = 'VENTA' AND b.celular = ?
  ORDER BY b.fecha DESC, b.id DESC`;


export class D1ClientesRepository implements ClientesRepository {

  constructor(private db: D1Database) {}

  async listarClientes(criaderoId: string): Promise<Cliente[]> {
    const r = await this.db.prepare(SQL_LISTAR).bind(criaderoId, criaderoId, criaderoId).all<Cliente>();
    return r.results;
  }

  async obtenerClientePorCelular(criaderoId: string, celular: string): Promise<Cliente | null> {
    const r = await this.db
      .prepare(SQL_POR_CELULAR)
      .bind(criaderoId, criaderoId, criaderoId, celular)
      .all<Cliente>();
    return r.results[0] ?? null;
  }

  async listarComprasCliente(criaderoId: string, celular: string): Promise<CompraCliente[]> {
    const r = await this.db.prepare(SQL_COMPRAS).bind(criaderoId, celular).all<CompraCliente>();
    return r.results;
  }

}
