/**
 * Repository de Cuidados de jaula. Solo SQL; el servicio decide ids y textos.
 * Cada registro se escribe junto con su fila de jaula_historial en un db.batch atomico.
 */

import type {
  CrearAlimentoBebidaInput,
  CrearSanidadInput,
  RegistroAlimentacionListado,
} from './cuidados.types';

export interface CuidadosRepository {
  existeJaula(criaderoId: string, jaulaId: string): Promise<boolean>;
  crearAlimentacion(criaderoId: string, input: CrearAlimentoBebidaInput): Promise<void>;
  crearBebida(criaderoId: string, input: CrearAlimentoBebidaInput): Promise<void>;
  crearSanidad(criaderoId: string, input: CrearSanidadInput): Promise<void>;
  listarAlimentacion(criaderoId: string, jaulaId: string): Promise<RegistroAlimentacionListado[]>;
}

export class D1CuidadosRepository implements CuidadosRepository {
  constructor(private db: D1Database) {}

  async existeJaula(criaderoId: string, jaulaId: string): Promise<boolean> {
    const fila = await this.db
      .prepare('SELECT id FROM jaulas WHERE id = ? AND criadero_id = ?')
      .bind(jaulaId, criaderoId)
      .first<{ id: string }>();

    return fila !== null && fila !== undefined;
  }

  private insertarHistorial(
    criaderoId: string,
    historialId: string,
    jaulaId: string,
    tipoEvento: string,
    fecha: string,
    detalle: string
  ) {
    return this.db
      .prepare(`
        INSERT INTO jaula_historial
          (id, criadero_id, jaula_id, ave_id, tipo_evento, fecha, detalle)
        VALUES (?, ?, ?, NULL, ?, ?, ?)
      `)
      .bind(historialId, criaderoId, jaulaId, tipoEvento, fecha, detalle);
  }

  private async crearAlimentoBebida(
    tabla: 'alimentacion_jaula' | 'bebida_jaula',
    tipoEvento: 'ALIMENTACION' | 'BEBIDA',
    criaderoId: string,
    input: CrearAlimentoBebidaInput
  ): Promise<void> {
    await this.db.batch([
      this.db
        .prepare(`
          INSERT INTO ${tabla}
            (id, criadero_id, jaula_id, fecha, tipo, cantidad, detalle)
          VALUES (?, ?, ?, ?, ?, ?, ?)
        `)
        .bind(input.id, criaderoId, input.jaulaId, input.fecha, input.tipo, input.cantidad, input.detalle),
      this.insertarHistorial(
        criaderoId, input.historialId, input.jaulaId, tipoEvento, input.fecha, input.detalleHistorial
      ),
    ]);
  }

  crearAlimentacion(criaderoId: string, input: CrearAlimentoBebidaInput): Promise<void> {
    return this.crearAlimentoBebida('alimentacion_jaula', 'ALIMENTACION', criaderoId, input);
  }

  crearBebida(criaderoId: string, input: CrearAlimentoBebidaInput): Promise<void> {
    return this.crearAlimentoBebida('bebida_jaula', 'BEBIDA', criaderoId, input);
  }

  async crearSanidad(criaderoId: string, input: CrearSanidadInput): Promise<void> {
    await this.db.batch([
      this.db
        .prepare(`
          INSERT INTO sanidad_jaula
            (id, criadero_id, jaula_id, fecha, tipo, detalle)
          VALUES (?, ?, ?, ?, ?, ?)
        `)
        .bind(input.id, criaderoId, input.jaulaId, input.fecha, input.tipo, input.detalle),
      this.db
        .prepare(`
          UPDATE jaulas
          SET estado_sanitario = ?, fecha_actualizacion = CURRENT_TIMESTAMP
          WHERE id = ? AND criadero_id = ?
        `)
        .bind(input.estadoSanitario, input.jaulaId, criaderoId),
      this.insertarHistorial(
        criaderoId, input.historialId, input.jaulaId, 'SANIDAD', input.fecha, input.detalleHistorial
      ),
    ]);
  }

  async listarAlimentacion(
    criaderoId: string,
    jaulaId: string
  ): Promise<RegistroAlimentacionListado[]> {
    const result = await this.db
      .prepare(`
        SELECT
          id,
          jaula_id AS jaulaId,
          fecha,
          tipo,
          cantidad,
          detalle,
          fecha_creacion AS fechaCreacion
        FROM alimentacion_jaula
        WHERE jaula_id = ? AND criadero_id = ?
        ORDER BY fecha DESC, id DESC
      `)
      .bind(jaulaId, criaderoId)
      .all<RegistroAlimentacionListado>();

    return result.results;
  }
}
