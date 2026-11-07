import type { FilaJaulaAlerta, FilaSaludAlerta, TotalesMes } from './alertas.types';


export interface AlertasRepository {
  avesEnTratamiento(criaderoId: string, ahoraIso: string): Promise<FilaSaludAlerta[]>;
  jaulasActivas(criaderoId: string, ahoraIso: string): Promise<FilaJaulaAlerta[]>;
  huevosHoy(criaderoId: string, ahoraIso: string): Promise<number>;
  totalesMes(criaderoId: string, ahoraIso: string): Promise<TotalesMes | null>;
}


// SQL de AlertasRepository.js de V1 con criadero_id y un solo instante `?` (ahoraIso) en lugar de
// 'now' / CURRENT_TIMESTAMP. Parametros posicionales repitiendo el bind. Una llamada a D1 por metodo
// (sin db.batch, sin bucles): el numero de llamadas no depende de los datos.

const SQL_SALUD = `
  SELECT a.id, a.codigo,
    julianday(?) - julianday(COALESCE(a.fecha_ultimo_control_salud, ?)) AS dias
  FROM aves a
  WHERE a.criadero_id = ? AND a.estado = 'ACTIVA' AND a.estado_salud = 'EN_TRATAMIENTO'
  ORDER BY a.rowid ASC`;

const SQL_JAULAS = `
  SELECT j.id, j.codigo,
    NOT EXISTS (SELECT 1 FROM alimentacion_jaula x
                WHERE x.criadero_id = j.criadero_id AND x.jaula_id = j.id
                  AND date(x.fecha) = date(?)) AS sin_alimentacion,
    NOT EXISTS (SELECT 1 FROM bebida_jaula x
                WHERE x.criadero_id = j.criadero_id AND x.jaula_id = j.id
                  AND date(x.fecha) = date(?)) AS sin_bebida
  FROM jaulas j
  WHERE j.criadero_id = ? AND j.activa = 1
  ORDER BY j.rowid ASC`;

const SQL_PRODUCCION = `
  SELECT COUNT(*) AS total FROM huevos WHERE criadero_id = ? AND date(fecha) = date(?)`;

const SQL_FINANZAS = `
  SELECT
    COALESCE(SUM(CASE WHEN tipo='INGRESO' THEN valor ELSE 0 END), 0) AS ingresos,
    COALESCE(SUM(CASE WHEN tipo='EGRESO' THEN valor ELSE 0 END), 0) AS egresos
  FROM movimientos_financieros
  WHERE criadero_id = ? AND strftime('%Y-%m', fecha) = strftime('%Y-%m', ?)`;


export class D1AlertasRepository implements AlertasRepository {

  constructor(private db: D1Database) {}

  async avesEnTratamiento(criaderoId: string, ahoraIso: string): Promise<FilaSaludAlerta[]> {
    const r = await this.db.prepare(SQL_SALUD).bind(ahoraIso, ahoraIso, criaderoId).all<FilaSaludAlerta>();
    return r.results ?? [];
  }

  async jaulasActivas(criaderoId: string, ahoraIso: string): Promise<FilaJaulaAlerta[]> {
    const r = await this.db.prepare(SQL_JAULAS).bind(ahoraIso, ahoraIso, criaderoId).all<FilaJaulaAlerta>();
    return r.results ?? [];
  }

  async huevosHoy(criaderoId: string, ahoraIso: string): Promise<number> {
    const r = await this.db.prepare(SQL_PRODUCCION).bind(criaderoId, ahoraIso).first<{ total: number }>();
    return Number(r?.total || 0);
  }

  async totalesMes(criaderoId: string, ahoraIso: string): Promise<TotalesMes | null> {
    return await this.db.prepare(SQL_FINANZAS).bind(criaderoId, ahoraIso).first<TotalesMes>();
  }

}
