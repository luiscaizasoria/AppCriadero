/**
 * Repositorio de Salud. SQL con prepared statements; el registro es un solo batch
 * (equivale a withTransactionAsync de V1).
 */

import type { HistorialSalud, RegistrarDiagnosticoInput } from './salud.types';

export interface SaludRepository {
  existeAve(criaderoId: string, aveId: string): Promise<boolean>;
  registrarDiagnostico(criaderoId: string, input: RegistrarDiagnosticoInput): Promise<void>;
  listarHistorial(criaderoId: string, aveId: string): Promise<HistorialSalud[]>;
}

export class D1SaludRepository implements SaludRepository {
  constructor(private db: D1Database) {}

  async existeAve(criaderoId: string, aveId: string): Promise<boolean> {
    const fila = await this.db
      .prepare('SELECT id FROM aves WHERE id = ? AND criadero_id = ?')
      .bind(aveId, criaderoId)
      .first<{ id: string }>();

    return fila !== null;
  }

  async registrarDiagnostico(criaderoId: string, input: RegistrarDiagnosticoInput): Promise<void> {
    const sentencias: D1PreparedStatement[] = [
      this.db
        .prepare(`
          INSERT INTO diagnosticos_ave
            (id, criadero_id, ave_id, fecha, enfermedad, sintomas, observacion, estado)
          VALUES (?, ?, ?, ?, ?, ?, ?, 'ACTIVO')
        `)
        .bind(
          input.diagnosticoId, criaderoId, input.aveId, input.fecha,
          input.enfermedad, input.sintomas, input.observacion
        ),
    ];

    if (input.medicamento) {
      sentencias.push(
        this.db
          .prepare(`
            INSERT INTO tratamientos_ave
              (id, criadero_id, diagnostico_id, ave_id, fecha, medicamento, dosis, observacion)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
          `)
          .bind(
            input.tratamientoId, criaderoId, input.diagnosticoId, input.aveId,
            input.fecha, input.medicamento, input.dosis, input.observacion
          )
      );
    }

    sentencias.push(
      this.db
        .prepare(`
          UPDATE aves
          SET estado_salud = 'EN_TRATAMIENTO', fecha_ultimo_control_salud = ?
          WHERE id = ? AND criadero_id = ?
        `)
        .bind(input.fecha, input.aveId, criaderoId),
      this.db
        .prepare(`
          INSERT INTO ave_historial
            (id, criadero_id, ave_id, tipo_evento, fecha, detalle)
          VALUES (?, ?, ?, 'SALUD', ?, ?)
        `)
        .bind(
          input.historialId, criaderoId, input.aveId, input.fecha,
          `Diagnóstico registrado: ${input.enfermedad}`
        )
    );

    await this.db.batch(sentencias);
  }

  async listarHistorial(criaderoId: string, aveId: string): Promise<HistorialSalud[]> {
    const resultado = await this.db
      .prepare(`
        SELECT d.id, d.fecha, d.enfermedad, d.sintomas, d.observacion, t.medicamento, t.dosis
        FROM diagnosticos_ave d
        LEFT JOIN tratamientos_ave t ON t.diagnostico_id = d.id
        WHERE d.ave_id = ? AND d.criadero_id = ?
        ORDER BY d.fecha DESC
      `)
      .bind(aveId, criaderoId)
      .all<HistorialSalud>();

    return resultado.results;
  }
}
