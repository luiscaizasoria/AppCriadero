/**
 * Service de Cuidados de jaula. Replica AlimentacionRepository.js, BebidaRepository.js y
 * SanidadJaulaRepository.js de V1: mismos textos de historial, misma normalizacion del
 * estado sanitario y mismos mensajes NOT NULL. Sin validaciones nuevas (la unica es tecnica:
 * tipo de dato del cuerpo) ni trim.
 */

import { v7 as uuidv7 } from 'uuid';
import type { CuidadosRepository } from './cuidados.repository';
import {
  MENSAJE_CUERPO_OBJETO,
  type EstadoSanitario,
  type RegistroAlimentacionListado,
  type RegistroAlimentoBebida,
  type RegistroSanidad,
  type Resultado,
} from './cuidados.types';

function fallo(error: string, message: string): Resultado<never> {
  return { success: false, error, message };
}

function validationError(message: string): Resultado<never> {
  return fallo('VALIDATION_ERROR', message);
}

function esObjeto(body: unknown): body is Record<string, unknown> {
  return typeof body === 'object' && body !== null && !Array.isArray(body);
}

function esAusente(valor: unknown): valor is null | undefined {
  return valor === undefined || valor === null;
}

function esEscalar(valor: unknown): valor is string | number | boolean {
  return typeof valor === 'string' || typeof valor === 'number' || typeof valor === 'boolean';
}

/** `x || null` de V1; escalar guardado como texto. undefined = objeto/arreglo (tecnico). */
function textoOrNull(valor: unknown): string | null | undefined {
  if (esAusente(valor)) return null;
  if (esEscalar(valor)) return valor ? String(valor) : null;
  return undefined;
}

/** normalizarEstado de SanidadJaulaRepository.js (comparacion estricta). */
export function normalizarEstado(tipo: string): EstadoSanitario {
  switch (tipo) {
    case 'Normal': return 'NORMAL';
    case 'Limpieza': return 'LIMPIEZA';
    case 'Fumigación': return 'FUMIGACION';
    case 'Quemadura': return 'QUEMADURA';
    case 'Cuarentena': return 'CUARENTENA';
    default: return 'NORMAL';
  }
}

interface DatosBase {
  fecha: string;
  tipo: string;
  cantidad: string | null;
  detalle: string | null;
}

type Tabla = 'alimentacion_jaula' | 'bebida_jaula' | 'sanidad_jaula';

export class CuidadosService {
  constructor(
    private repository: CuidadosRepository,
    private newId: () => string = uuidv7
  ) {}

  /** Cuerpo, NOT NULL (fecha antes que tipo, como SQLite) y tipos escalares. */
  private normalizar(
    body: unknown,
    tabla: Tabla,
    conCantidad: boolean
  ): DatosBase | Resultado<never> {
    if (!esObjeto(body)) return validationError(MENSAJE_CUERPO_OBJETO);

    if (esAusente(body.fecha)) return validationError(`NOT NULL constraint failed: ${tabla}.fecha`);
    if (esAusente(body.tipo)) return validationError(`NOT NULL constraint failed: ${tabla}.tipo`);

    if (!esEscalar(body.fecha) || !esEscalar(body.tipo)) {
      return validationError('Los campos fecha y tipo deben ser texto');
    }

    const cantidad = conCantidad ? textoOrNull(body.cantidad) : null;
    const detalle = textoOrNull(body.detalle);

    if (cantidad === undefined || detalle === undefined) {
      return validationError('Los campos cantidad y detalle no pueden ser objetos ni arreglos');
    }

    return { fecha: String(body.fecha), tipo: String(body.tipo), cantidad, detalle };
  }

  private async jaulaExiste(criaderoId: string, jaulaId: string): Promise<boolean> {
    return this.repository.existeJaula(criaderoId, jaulaId);
  }

  private jaulaNoEncontrada(): Resultado<never> {
    return fallo('JAULA_NO_ENCONTRADA', 'FOREIGN KEY constraint failed');
  }

  async crearAlimentacion(
    criaderoId: string,
    jaulaId: string,
    body: unknown
  ): Promise<Resultado<{ registro: RegistroAlimentoBebida }>> {
    const datos = this.normalizar(body, 'alimentacion_jaula', true);
    if ('success' in datos) return datos;
    if (!(await this.jaulaExiste(criaderoId, jaulaId))) return this.jaulaNoEncontrada();

    const id = this.newId();
    await this.repository.crearAlimentacion(criaderoId, {
      id,
      historialId: this.newId(),
      jaulaId,
      ...datos,
      detalleHistorial: `Alimentación: ${datos.tipo}`,
    });

    return { success: true, data: { registro: { id, jaulaId, ...datos } } };
  }

  async crearBebida(
    criaderoId: string,
    jaulaId: string,
    body: unknown
  ): Promise<Resultado<{ registro: RegistroAlimentoBebida }>> {
    const datos = this.normalizar(body, 'bebida_jaula', true);
    if ('success' in datos) return datos;
    if (!(await this.jaulaExiste(criaderoId, jaulaId))) return this.jaulaNoEncontrada();

    const id = this.newId();
    await this.repository.crearBebida(criaderoId, {
      id,
      historialId: this.newId(),
      jaulaId,
      ...datos,
      detalleHistorial: `Bebida: ${datos.tipo}`,
    });

    return { success: true, data: { registro: { id, jaulaId, ...datos } } };
  }

  async crearSanidad(
    criaderoId: string,
    jaulaId: string,
    body: unknown
  ): Promise<
    Resultado<{
      registro: RegistroSanidad;
      jaula: { id: string; estadoSanitario: EstadoSanitario };
    }>
  > {
    const datos = this.normalizar(body, 'sanidad_jaula', false);
    if ('success' in datos) return datos;
    if (!(await this.jaulaExiste(criaderoId, jaulaId))) return this.jaulaNoEncontrada();

    const id = this.newId();
    const estadoSanitario = normalizarEstado(datos.tipo);
    const detalleHistorial =
      `Sanidad: ${datos.tipo}` + (datos.detalle ? ` | ${datos.detalle}` : '');

    await this.repository.crearSanidad(criaderoId, {
      id,
      historialId: this.newId(),
      jaulaId,
      fecha: datos.fecha,
      tipo: datos.tipo,
      detalle: datos.detalle,
      estadoSanitario,
      detalleHistorial,
    });

    return {
      success: true,
      data: {
        registro: { id, jaulaId, fecha: datos.fecha, tipo: datos.tipo, detalle: datos.detalle },
        jaula: { id: jaulaId, estadoSanitario },
      },
    };
  }

  /** obtenerAlimentacionJaula de V1 (jaula inexistente -> []). */
  async listarAlimentacion(
    criaderoId: string,
    jaulaId: string
  ): Promise<Resultado<{ registros: RegistroAlimentacionListado[] }>> {
    return {
      success: true,
      data: { registros: await this.repository.listarAlimentacion(criaderoId, jaulaId) },
    };
  }
}
