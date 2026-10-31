/**
 * Service de Jaulas. Replica el comportamiento de JaulaRepository.js de V1:
 * normaliza con trim (vacio -> null), no aplica reglas nuevas y conserva
 * el mensaje de SQLite que las pantallas reconocen para el codigo duplicado.
 * La unica validacion es tecnica (tipos de dato del cuerpo).
 */

import {
  generateJaulaId,
  type JaulaRepository,
} from './jaulas.repository';
import {
  MENSAJE_CODIGO_DUPLICADO,
  type EstadoJaulas,
  type JaulaDatos,
  type JaulaDetalle,
  type JaulaInactivaListado,
  type JaulaListado,
  type Resultado,
} from './jaulas.types';

function validationError(message: string): Resultado<never> {
  return { success: false, error: 'VALIDATION_ERROR', message };
}

function noEncontrada(): Resultado<never> {
  return { success: false, error: 'JAULA_NO_ENCONTRADA', message: 'JAULA_NO_ENCONTRADA' };
}

function codigoDuplicado(): Resultado<never> {
  return { success: false, error: 'UNIQUE_JAULAS_CODIGO', message: MENSAJE_CODIGO_DUPLICADO };
}

function esErrorUnique(error: unknown): boolean {
  const mensaje = error instanceof Error ? error.message : String(error);
  return mensaje.toLowerCase().includes('unique');
}

function textoOpcional(valor: unknown): string | null | undefined {
  if (valor === undefined || valor === null) return null;
  if (typeof valor === 'string') return valor.trim() || null;
  return undefined;
}

/** trim y vacio -> null, como crearJaula / actualizarJaula de V1. */
export function normalizar(body: unknown): JaulaDatos | Resultado<never> {
  if (typeof body !== 'object' || body === null || Array.isArray(body)) {
    return validationError('El cuerpo debe ser un objeto JSON');
  }

  const datos = body as Record<string, unknown>;

  if (typeof datos.codigo !== 'string') {
    return validationError('El campo codigo debe ser texto');
  }

  const nombre = textoOpcional(datos.nombre);
  const ubicacion = textoOpcional(datos.ubicacion);
  const tipo = textoOpcional(datos.tipo);

  if (nombre === undefined || ubicacion === undefined || tipo === undefined) {
    return validationError('nombre, ubicacion y tipo deben ser texto');
  }

  return { codigo: datos.codigo.trim(), nombre, ubicacion, tipo };
}

function esDatos(valor: JaulaDatos | Resultado<never>): valor is JaulaDatos {
  return !('success' in valor);
}

export class JaulaService {
  constructor(
    private repository: JaulaRepository,
    private now: () => Date = () => new Date(),
    private newId: () => string = generateJaulaId
  ) {}

  async listar(
    criaderoId: string,
    estado: EstadoJaulas
  ): Promise<Resultado<{ jaulas: JaulaListado[] | JaulaInactivaListado[] }>> {
    const jaulas = estado === 'ACTIVA'
      ? await this.repository.listarActivas(criaderoId)
      : await this.repository.listarInactivas(criaderoId);

    return { success: true, data: { jaulas } };
  }

  async obtener(criaderoId: string, jaulaId: string): Promise<Resultado<{ jaula: JaulaDetalle }>> {
    const jaula = await this.repository.obtenerPorId(criaderoId, jaulaId);

    if (!jaula) return noEncontrada();

    return { success: true, data: { jaula } };
  }

  async crear(criaderoId: string, body: unknown): Promise<Resultado<{ jaula: JaulaDetalle }>> {
    const datos = normalizar(body);
    if (!esDatos(datos)) return datos;

    const id = this.newId();

    try {
      await this.repository.crear(criaderoId, id, datos);
    } catch (error) {
      if (esErrorUnique(error)) return codigoDuplicado();
      throw error;
    }

    return this.obtener(criaderoId, id);
  }

  async actualizar(
    criaderoId: string,
    jaulaId: string,
    body: unknown
  ): Promise<Resultado<{ jaula: JaulaDetalle }>> {
    const datos = normalizar(body);
    if (!esDatos(datos)) return datos;

    let filas: number;

    try {
      filas = await this.repository.actualizar(criaderoId, jaulaId, datos);
    } catch (error) {
      if (esErrorUnique(error)) return codigoDuplicado();
      throw error;
    }

    if (filas === 0) return noEncontrada();

    return this.obtener(criaderoId, jaulaId);
  }

  /**
   * Equivale a desactivarJaula de V1. Las aves llegan con la migracion 0006:
   * hasta entonces no hay aves que liberar (cantidadAvesLiberadas = 0).
   */
  async desactivar(
    criaderoId: string,
    jaulaId: string
  ): Promise<Resultado<{ cantidadAvesLiberadas: number }>> {
    const jaula = await this.repository.obtenerPorId(criaderoId, jaulaId);

    if (!jaula) return noEncontrada();

    // V1: si la jaula ya esta inactiva no escribe nada y devuelve 0.
    if (Number(jaula.activa) === 1) {
      await this.repository.desactivar(criaderoId, jaulaId, this.now().toISOString());
    }

    return { success: true, data: { cantidadAvesLiberadas: 0 } };
  }
}
