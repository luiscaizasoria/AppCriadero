import type {
  EnfermedadCantidad,
  EstadoSaludResumen,
  FilaExportacionAves,
  FilaExportacionClientes,
  FilaExportacionFinanzas,
  FilaExportacionHuevos,
  FilaExportacionJaulas,
  FilaExportacionVentas,
  HuevosHoyMes,
  MejorPonedora,
  ReporteAves,
  TotalesFinanzas,
} from './reportes.types';


export interface ReportesRepository {
  contarAves(criaderoId: string): Promise<ReporteAves>;
  estadoSalud(criaderoId: string): Promise<EstadoSaludResumen>;
  enfermedades(criaderoId: string): Promise<EnfermedadCantidad[]>;
  huevosHoyMes(criaderoId: string, ahoraIso: string): Promise<HuevosHoyMes>;
  mejorPonedora(criaderoId: string): Promise<MejorPonedora | null>;
  totalesFinanzas(criaderoId: string): Promise<TotalesFinanzas>;
  exportarAves(criaderoId: string): Promise<FilaExportacionAves[]>;
  exportarVentas(criaderoId: string): Promise<FilaExportacionVentas[]>;
  exportarClientes(criaderoId: string): Promise<FilaExportacionClientes[]>;
  exportarFinanzas(criaderoId: string): Promise<FilaExportacionFinanzas[]>;
  exportarHuevos(criaderoId: string): Promise<FilaExportacionHuevos[]>;
  exportarJaulas(criaderoId: string): Promise<FilaExportacionJaulas[]>;
}


// SQL de V1 (ReportesRepository.js) con criadero_id. Parametros posicionales `?`, repitiendo el bind.
// Una sola sentencia por consulta (sin db.batch, sin bucles): el numero de llamadas a D1 no depende
// de los datos. Desempates explicitos para reproducir el orden observable de V1. OJO: en el top 5 de
// enfermedades V1 (SQLite real) ordena los empates por `enfermedad` DESCENDENTE (binario), no ascendente
// como suponia la spec; la prueba de paridad (REP-06) lo confirma.

const SQL_AVES = `
  SELECT
    COALESCE(SUM(CASE WHEN estado='ACTIVA' THEN 1 ELSE 0 END), 0) AS activas,
    COALESCE(SUM(CASE WHEN estado='VENDIDA' THEN 1 ELSE 0 END), 0) AS vendidas,
    COALESCE(SUM(CASE WHEN estado='FALLECIDA' THEN 1 ELSE 0 END), 0) AS fallecidas
  FROM aves
  WHERE criadero_id = ?`;

const SQL_SALUD_ESTADO = `
  SELECT
    COALESCE(SUM(CASE WHEN estado_salud='EN_TRATAMIENTO' THEN 1 ELSE 0 END), 0) AS tratamiento,
    COALESCE(SUM(CASE WHEN estado_salud='ENFERMA' THEN 1 ELSE 0 END), 0) AS enfermas
  FROM aves
  WHERE criadero_id = ? AND estado='ACTIVA'`;

const SQL_SALUD_ENFERMEDADES = `
  SELECT enfermedad, COUNT(*) AS cantidad
  FROM diagnosticos_ave
  WHERE criadero_id = ?
  GROUP BY enfermedad
  ORDER BY cantidad DESC, enfermedad DESC
  LIMIT 5`;

const SQL_PRODUCCION_HUEVOS = `
  SELECT
    COALESCE(SUM(CASE WHEN date(fecha)=date(?) THEN 1 ELSE 0 END), 0) AS hoy,
    COALESCE(SUM(CASE WHEN strftime('%Y-%m',fecha)=strftime('%Y-%m',?) THEN 1 ELSE 0 END), 0) AS mes
  FROM huevos
  WHERE criadero_id = ?`;

const SQL_PRODUCCION_MEJOR = `
  SELECT a.codigo AS codigo, COUNT(h.id) AS cantidad
  FROM huevos h
  INNER JOIN aves a ON a.id = h.ave_id AND a.criadero_id = h.criadero_id
  WHERE h.criadero_id = ?
  GROUP BY a.id, a.codigo
  ORDER BY cantidad DESC, a.rowid ASC
  LIMIT 1`;

const SQL_FINANZAS = `
  SELECT
    COALESCE(SUM(CASE WHEN tipo='INGRESO' THEN valor ELSE 0 END), 0) AS ingresos,
    COALESCE(SUM(CASE WHEN tipo='EGRESO' THEN valor ELSE 0 END), 0) AS egresos
  FROM movimientos_financieros
  WHERE criadero_id = ?`;

const SQL_EXPORT_AVES = `
  SELECT
    a.codigo AS Codigo,
    a.raza AS Raza,
    a.sexo AS Sexo,
    a.estado AS Estado,
    a.estado_salud AS EstadoSalud,
    a.fecha_nacimiento AS FechaNacimiento,
    a.peso_gramos AS PesoGramos,
    a.altura_cm AS AlturaCm,
    a.largo_cm AS LargoCm,
    p.codigo AS Padre,
    m.codigo AS Madre,
    j.codigo AS Jaula,
    a.origen AS Origen,
    a.caracteristicas AS Caracteristicas
  FROM aves a
  LEFT JOIN aves p ON p.id = a.padre_id AND p.criadero_id = a.criadero_id
  LEFT JOIN aves m ON m.id = a.madre_id AND m.criadero_id = a.criadero_id
  LEFT JOIN jaulas j ON j.id = a.jaula_actual_id AND j.criadero_id = a.criadero_id
  WHERE a.criadero_id = ?
  ORDER BY a.codigo`;

const SQL_EXPORT_VENTAS = `
  SELECT
    a.codigo AS Ave,
    b.fecha AS Fecha,
    b.celular AS Celular,
    b.comprador AS Nombre,
    b.ciudad_destino AS CiudadDestino,
    b.cooperativa_envio AS Cooperativa,
    b.valor_venta AS ValorAve,
    b.valor_envio AS ValorEnvio,
    b.detalle AS Detalle
  FROM bajas_ave b
  INNER JOIN aves a ON a.id = b.ave_id AND a.criadero_id = b.criadero_id
  WHERE b.criadero_id = ? AND b.tipo = 'VENTA'
  ORDER BY b.fecha DESC, b.rowid ASC`;

const SQL_EXPORT_CLIENTES = `
  SELECT
    b.celular AS Celular,
    MAX(NULLIF(TRIM(b.comprador), '')) AS Nombre,
    MAX(NULLIF(TRIM(b.ciudad_destino), '')) AS Ciudad,
    COUNT(*) AS Compras,
    COALESCE(SUM(b.valor_venta), 0) AS TotalAves,
    COALESCE(SUM(b.valor_envio), 0) AS TotalEnvios,
    MAX(b.fecha) AS UltimaCompra
  FROM bajas_ave b
  WHERE b.criadero_id = ? AND b.tipo = 'VENTA'
    AND b.celular IS NOT NULL
    AND TRIM(b.celular) <> ''
  GROUP BY b.celular
  ORDER BY UltimaCompra DESC, b.celular DESC`;

const SQL_EXPORT_FINANZAS = `
  SELECT
    mf.fecha AS Fecha,
    mf.tipo AS Tipo,
    mf.categoria AS Categoria,
    mf.valor AS Valor,
    mf.detalle AS Detalle,
    a.codigo AS Ave,
    mf.origen_tipo AS Origen,
    mf.origen_id AS OrigenId
  FROM movimientos_financieros mf
  LEFT JOIN aves a ON a.id = mf.ave_id AND a.criadero_id = mf.criadero_id
  WHERE mf.criadero_id = ?
  ORDER BY mf.fecha DESC, mf.rowid DESC`;

const SQL_EXPORT_HUEVOS = `
  SELECT
    h.codigo AS Codigo,
    h.fecha AS Fecha,
    a.codigo AS Ave,
    j.codigo AS Jaula,
    h.estado AS Estado,
    h.observacion AS Observacion
  FROM huevos h
  LEFT JOIN aves a ON a.id = h.ave_id AND a.criadero_id = h.criadero_id
  LEFT JOIN jaulas j ON j.id = h.jaula_id AND j.criadero_id = h.criadero_id
  WHERE h.criadero_id = ?
  ORDER BY h.fecha DESC, h.rowid DESC`;

const SQL_EXPORT_JAULAS = `
  SELECT
    j.codigo AS Codigo,
    j.nombre AS Nombre,
    j.ubicacion AS Ubicacion,
    j.tipo AS Tipo,
    j.estado_sanitario AS EstadoSanitario,
    CASE WHEN j.activa = 1 THEN 'ACTIVA' ELSE 'INACTIVA' END AS Estado,
    j.fecha_creacion AS FechaCreacion,
    j.fecha_desactivacion AS FechaDesactivacion
  FROM jaulas j
  WHERE j.criadero_id = ?
  ORDER BY j.codigo`;


export class D1ReportesRepository implements ReportesRepository {

  constructor(private db: D1Database) {}

  private async uno<T>(sql: string, ...params: unknown[]): Promise<T | null> {
    return await this.db.prepare(sql).bind(...params).first<T>();
  }

  private async todos<T>(sql: string, ...params: unknown[]): Promise<T[]> {
    const r = await this.db.prepare(sql).bind(...params).all<T>();
    return r.results;
  }

  async contarAves(criaderoId: string): Promise<ReporteAves> {
    return (await this.uno<ReporteAves>(SQL_AVES, criaderoId)) ?? { activas: 0, vendidas: 0, fallecidas: 0 };
  }

  async estadoSalud(criaderoId: string): Promise<EstadoSaludResumen> {
    return (await this.uno<EstadoSaludResumen>(SQL_SALUD_ESTADO, criaderoId)) ?? { tratamiento: 0, enfermas: 0 };
  }

  enfermedades(criaderoId: string): Promise<EnfermedadCantidad[]> {
    return this.todos<EnfermedadCantidad>(SQL_SALUD_ENFERMEDADES, criaderoId);
  }

  async huevosHoyMes(criaderoId: string, ahoraIso: string): Promise<HuevosHoyMes> {
    return (await this.uno<HuevosHoyMes>(SQL_PRODUCCION_HUEVOS, ahoraIso, ahoraIso, criaderoId)) ?? { hoy: 0, mes: 0 };
  }

  mejorPonedora(criaderoId: string): Promise<MejorPonedora | null> {
    return this.uno<MejorPonedora>(SQL_PRODUCCION_MEJOR, criaderoId);
  }

  async totalesFinanzas(criaderoId: string): Promise<TotalesFinanzas> {
    return (await this.uno<TotalesFinanzas>(SQL_FINANZAS, criaderoId)) ?? { ingresos: 0, egresos: 0 };
  }

  exportarAves(criaderoId: string): Promise<FilaExportacionAves[]> {
    return this.todos<FilaExportacionAves>(SQL_EXPORT_AVES, criaderoId);
  }

  exportarVentas(criaderoId: string): Promise<FilaExportacionVentas[]> {
    return this.todos<FilaExportacionVentas>(SQL_EXPORT_VENTAS, criaderoId);
  }

  exportarClientes(criaderoId: string): Promise<FilaExportacionClientes[]> {
    return this.todos<FilaExportacionClientes>(SQL_EXPORT_CLIENTES, criaderoId);
  }

  exportarFinanzas(criaderoId: string): Promise<FilaExportacionFinanzas[]> {
    return this.todos<FilaExportacionFinanzas>(SQL_EXPORT_FINANZAS, criaderoId);
  }

  exportarHuevos(criaderoId: string): Promise<FilaExportacionHuevos[]> {
    return this.todos<FilaExportacionHuevos>(SQL_EXPORT_HUEVOS, criaderoId);
  }

  exportarJaulas(criaderoId: string): Promise<FilaExportacionJaulas[]> {
    return this.todos<FilaExportacionJaulas>(SQL_EXPORT_JAULAS, criaderoId);
  }

}
