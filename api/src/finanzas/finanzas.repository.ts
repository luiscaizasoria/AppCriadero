/**
 * Repositorio de Finanzas. SQL con prepared statements que replica FinanzasRepository.js (V1):
 * importes REAL sin redondeo, sumas con SUM en SQL, periodos por igualdad de strftime en UTC.
 * `strftime(..., 'now')` de V1 se sustituye por el parametro `ahora` (ISO UTC) que fija el
 * servicio. Las correcciones se ejecutan en un unico db.batch (atomico).
 */

import type {
  BajaVentaBasica,
  CategoriaConsolidada,
  CorreccionVentaPlan,
  HistorialFila,
  HistorialInsert,
  MesConsolidado,
  MovimientoDetalle,
  MovimientoListado,
  MovimientoManualInput,
  MovimientoManualUpdate,
  ResumenSumas,
  VentaBaja,
} from './finanzas.types';

export interface FinanzasRepository {
  resumen(criaderoId: string, periodo: string, ahora: string): Promise<ResumenSumas>;
  listarMovimientos(criaderoId: string): Promise<MovimientoListado[]>;
  insertarManual(criaderoId: string, input: MovimientoManualInput): Promise<void>;
  obtenerMovimiento(criaderoId: string, id: string): Promise<MovimientoDetalle | null>;
  obtenerVenta(criaderoId: string, bajaId: string): Promise<VentaBaja | null>;
  obtenerBajaVenta(criaderoId: string, bajaId: string): Promise<BajaVentaBasica | null>;
  /** Movimiento de la venta por (origen VENTA_AVE, origen_id, categoria) con menor rowid. */
  buscarMovimientoVenta(
    criaderoId: string,
    bajaId: string,
    categoria: string
  ): Promise<MovimientoDetalle | null>;
  /** Historial + UPDATE en un batch. */
  actualizarManual(
    criaderoId: string,
    historial: HistorialInsert,
    update: MovimientoManualUpdate
  ): Promise<void>;
  /** UPDATE bajas_ave + sincronizaciones (historial/UPDATE o INSERT/historial) en un batch. */
  corregirVenta(criaderoId: string, plan: CorreccionVentaPlan): Promise<void>;
  historial(criaderoId: string, movimientoId: string): Promise<HistorialFila[]>;
  consolidadoCategorias(
    criaderoId: string,
    periodo: string,
    ahora: string
  ): Promise<CategoriaConsolidada[]>;
  consolidadoMensual(criaderoId: string, limite: number): Promise<MesConsolidado[]>;
}

const SELECT_MOVIMIENTO = `
  SELECT
    mf.id,
    mf.tipo,
    mf.categoria,
    mf.fecha,
    mf.valor,
    mf.detalle,
    mf.ave_id AS aveId,
    mf.origen_tipo AS origenTipo,
    mf.origen_id AS origenId,
    mf.fecha_creacion AS fechaCreacion,
    a.codigo AS aveCodigo
  FROM movimientos_financieros mf
  LEFT JOIN aves a
    ON a.id = mf.ave_id AND a.criadero_id = mf.criadero_id
`;

/** construirFiltroPeriodo de V1: igualdad de strftime; cualquier otro valor = sin filtro. */
function filtroPeriodo(
  periodo: string,
  ahora: string
): { sql: string; params: string[] } {
  if (periodo === 'MES') {
    return { sql: "AND strftime('%Y-%m', fecha) = strftime('%Y-%m', ?)", params: [ahora] };
  }

  if (periodo === 'ANIO') {
    return { sql: "AND strftime('%Y', fecha) = strftime('%Y', ?)", params: [ahora] };
  }

  return { sql: '', params: [] };
}

export class D1FinanzasRepository implements FinanzasRepository {
  constructor(private db: D1Database) {}

  async resumen(criaderoId: string, periodo: string, ahora: string): Promise<ResumenSumas> {
    const filtro = filtroPeriodo(periodo, ahora);

    const fila = await this.db
      .prepare(`
        SELECT
          COALESCE(SUM(CASE WHEN tipo = 'INGRESO' THEN valor ELSE 0 END), 0) AS ingresos,
          COALESCE(SUM(CASE WHEN tipo = 'EGRESO' THEN valor ELSE 0 END), 0) AS egresos
        FROM movimientos_financieros
        WHERE criadero_id = ?
        ${filtro.sql}
      `)
      .bind(criaderoId, ...filtro.params)
      .first<{ ingresos: number | null; egresos: number | null }>();

    return { ingresos: Number(fila?.ingresos || 0), egresos: Number(fila?.egresos || 0) };
  }

  async listarMovimientos(criaderoId: string): Promise<MovimientoListado[]> {
    const resultado = await this.db
      .prepare(`
        SELECT
          mf.id,
          mf.tipo,
          mf.categoria,
          mf.fecha,
          mf.valor,
          mf.detalle,
          mf.ave_id AS aveId,
          mf.origen_tipo AS origenTipo,
          mf.origen_id AS origenId,
          a.codigo AS aveCodigo
        FROM movimientos_financieros mf
        LEFT JOIN aves a
          ON a.id = mf.ave_id AND a.criadero_id = mf.criadero_id
        WHERE mf.criadero_id = ?
        ORDER BY mf.fecha DESC, mf.rowid DESC
      `)
      .bind(criaderoId)
      .all<MovimientoListado>();

    return resultado.results;
  }

  async insertarManual(criaderoId: string, input: MovimientoManualInput): Promise<void> {
    await this.db
      .prepare(`
        INSERT INTO movimientos_financieros
          (id, criadero_id, tipo, categoria, fecha, valor, detalle, origen_tipo)
        VALUES (?, ?, ?, ?, ?, ?, ?, 'MANUAL')
      `)
      .bind(
        input.id, criaderoId, input.tipo, input.categoria, input.fecha, input.valor, input.detalle
      )
      .run();
  }

  async obtenerMovimiento(criaderoId: string, id: string): Promise<MovimientoDetalle | null> {
    return await this.db
      .prepare(`${SELECT_MOVIMIENTO} WHERE mf.id = ? AND mf.criadero_id = ?`)
      .bind(id, criaderoId)
      .first<MovimientoDetalle>();
  }

  async obtenerVenta(criaderoId: string, bajaId: string): Promise<VentaBaja | null> {
    return await this.db
      .prepare(`
        SELECT
          b.id,
          b.ave_id AS aveId,
          b.fecha,
          b.celular,
          b.comprador,
          b.ciudad_destino AS ciudadDestino,
          b.cooperativa_envio AS cooperativaEnvio,
          b.valor_venta AS valorVenta,
          b.valor_envio AS valorEnvio,
          b.detalle,
          a.codigo AS aveCodigo
        FROM bajas_ave b
        INNER JOIN aves a
          ON a.id = b.ave_id
        WHERE b.id = ? AND b.criadero_id = ? AND b.tipo = 'VENTA'
      `)
      .bind(bajaId, criaderoId)
      .first<VentaBaja>();
  }

  async obtenerBajaVenta(criaderoId: string, bajaId: string): Promise<BajaVentaBasica | null> {
    return await this.db
      .prepare(`
        SELECT id, ave_id AS aveId, fecha
        FROM bajas_ave
        WHERE id = ? AND criadero_id = ? AND tipo = 'VENTA'
      `)
      .bind(bajaId, criaderoId)
      .first<BajaVentaBasica>();
  }

  async buscarMovimientoVenta(
    criaderoId: string,
    bajaId: string,
    categoria: string
  ): Promise<MovimientoDetalle | null> {
    return await this.db
      .prepare(`
        ${SELECT_MOVIMIENTO}
        WHERE mf.criadero_id = ?
          AND mf.origen_tipo = 'VENTA_AVE'
          AND mf.origen_id = ?
          AND mf.categoria = ?
        ORDER BY mf.rowid
        LIMIT 1
      `)
      .bind(criaderoId, bajaId, categoria)
      .first<MovimientoDetalle>();
  }

  async actualizarManual(
    criaderoId: string,
    historial: HistorialInsert,
    update: MovimientoManualUpdate
  ): Promise<void> {
    await this.db.batch([
      this.statementHistorial(criaderoId, historial),
      this.db
        .prepare(`
          UPDATE movimientos_financieros
          SET tipo = ?, categoria = ?, fecha = ?, valor = ?, detalle = ?
          WHERE id = ? AND criadero_id = ?
        `)
        .bind(
          update.tipo, update.categoria, update.fecha, update.valor, update.detalle,
          update.id, criaderoId
        ),
    ]);
  }

  async corregirVenta(criaderoId: string, plan: CorreccionVentaPlan): Promise<void> {
    const sentencias: D1PreparedStatement[] = [
      this.db
        .prepare(`
          UPDATE bajas_ave
          SET valor_venta = ?, valor_envio = ?
          WHERE id = ? AND criadero_id = ?
        `)
        .bind(plan.valorVenta, plan.valorEnvio, plan.bajaId, criaderoId),
    ];

    for (const s of plan.sincronizaciones) {
      if (s.existenteId !== null) {
        // Existente: historial antes del UPDATE.
        sentencias.push(this.statementHistorial(criaderoId, s.historial));
        sentencias.push(
          this.db
            .prepare(`
              UPDATE movimientos_financieros
              SET tipo = 'INGRESO', categoria = ?, fecha = ?, valor = ?, detalle = ?,
                  ave_id = ?, origen_tipo = 'VENTA_AVE', origen_id = ?
              WHERE id = ? AND criadero_id = ?
            `)
            .bind(
              s.categoria, plan.fechaVenta, s.valor, s.detalle,
              plan.aveId, plan.bajaId, s.existenteId, criaderoId
            )
        );
      } else {
        // Nuevo: INSERT y despues el historial.
        sentencias.push(
          this.db
            .prepare(`
              INSERT INTO movimientos_financieros
                (id, criadero_id, tipo, categoria, fecha, valor, detalle, ave_id, origen_tipo, origen_id)
              VALUES (?, ?, 'INGRESO', ?, ?, ?, ?, ?, 'VENTA_AVE', ?)
            `)
            .bind(
              s.nuevoId, criaderoId, s.categoria, plan.fechaVenta, s.valor, s.detalle,
              plan.aveId, plan.bajaId
            )
        );
        sentencias.push(this.statementHistorial(criaderoId, s.historial));
      }
    }

    await this.db.batch(sentencias);
  }

  async historial(criaderoId: string, movimientoId: string): Promise<HistorialFila[]> {
    const resultado = await this.db
      .prepare(`
        SELECT
          id,
          movimiento_id AS movimientoId,
          fecha,
          accion,
          tipo_anterior AS tipoAnterior,
          tipo_nuevo AS tipoNuevo,
          categoria_anterior AS categoriaAnterior,
          categoria_nueva AS categoriaNueva,
          fecha_movimiento_anterior AS fechaMovimientoAnterior,
          fecha_movimiento_nueva AS fechaMovimientoNueva,
          valor_anterior AS valorAnterior,
          valor_nuevo AS valorNuevo,
          detalle_anterior AS detalleAnterior,
          detalle_nuevo AS detalleNuevo,
          origen_tipo AS origenTipo,
          origen_id AS origenId
        FROM movimientos_financieros_historial
        WHERE movimiento_id = ? AND criadero_id = ?
        ORDER BY fecha DESC, rowid DESC
      `)
      .bind(movimientoId, criaderoId)
      .all<HistorialFila>();

    return resultado.results;
  }

  async consolidadoCategorias(
    criaderoId: string,
    periodo: string,
    ahora: string
  ): Promise<CategoriaConsolidada[]> {
    const filtro = filtroPeriodo(periodo, ahora);

    const resultado = await this.db
      .prepare(`
        SELECT
          tipo,
          COALESCE(categoria, 'OTRO') AS categoria,
          COUNT(*) AS cantidad,
          COALESCE(SUM(valor), 0) AS total
        FROM movimientos_financieros
        WHERE criadero_id = ?
        ${filtro.sql}
        GROUP BY tipo, COALESCE(categoria, 'OTRO')
        ORDER BY tipo DESC, total DESC
      `)
      .bind(criaderoId, ...filtro.params)
      .all<CategoriaConsolidada>();

    return resultado.results;
  }

  async consolidadoMensual(criaderoId: string, limite: number): Promise<MesConsolidado[]> {
    const resultado = await this.db
      .prepare(`
        SELECT
          strftime('%Y-%m', fecha) AS periodo,
          COALESCE(SUM(CASE WHEN tipo = 'INGRESO' THEN valor ELSE 0 END), 0) AS ingresos,
          COALESCE(SUM(CASE WHEN tipo = 'EGRESO' THEN valor ELSE 0 END), 0) AS egresos
        FROM movimientos_financieros
        WHERE criadero_id = ?
        GROUP BY strftime('%Y-%m', fecha)
        ORDER BY periodo DESC
        LIMIT ?
      `)
      .bind(criaderoId, limite)
      .all<MesConsolidado>();

    return resultado.results;
  }

  private statementHistorial(criaderoId: string, h: HistorialInsert): D1PreparedStatement {
    return this.db
      .prepare(`
        INSERT INTO movimientos_financieros_historial
          (id, criadero_id, movimiento_id, fecha, accion,
           tipo_anterior, tipo_nuevo, categoria_anterior, categoria_nueva,
           fecha_movimiento_anterior, fecha_movimiento_nueva,
           valor_anterior, valor_nuevo, detalle_anterior, detalle_nuevo,
           origen_tipo, origen_id)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `)
      .bind(
        h.id, criaderoId, h.movimientoId, h.fecha, h.accion,
        h.tipoAnterior, h.tipoNuevo, h.categoriaAnterior, h.categoriaNueva,
        h.fechaMovimientoAnterior, h.fechaMovimientoNueva,
        h.valorAnterior, h.valorNuevo, h.detalleAnterior, h.detalleNuevo,
        h.origenTipo, h.origenId
      );
  }
}
