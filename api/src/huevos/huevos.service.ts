/**
 * Service de Huevos. Replica HuevoRepository.js y ProduccionRepository.js (V1): sin validar
 * estado del ave; las unicas validaciones son tecnicas (tipos del cuerpo) y la pertenencia
 * del ave y de la jaula al criadero (equivale al error de FK de V1).
 * El reloj es inyectable solo para pruebas; por defecto es el instante real.
 */

import { v7 as uuidv7 } from 'uuid';
import type { HuevosRepository } from './huevos.repository';
import type {
  HuevoAve,
  ProduccionAve,
  ProduccionDia,
  ProduccionHora,
  ProduccionJaula,
  RankingPonedora,
  Resultado,
  ResumenProduccion,
  TotalProduccion,
} from './huevos.types';

const MENSAJE_FK = 'FOREIGN KEY constraint failed';

function fallo(error: string, message: string = error): Resultado<never> {
  return { success: false, error, message };
}

function esObjeto(body: unknown): body is Record<string, unknown> {
  return typeof body === 'object' && body !== null && !Array.isArray(body);
}

function esAusente(valor: unknown): valor is null | undefined {
  return valor === undefined || valor === null;
}

function ok<T>(data: T): Resultado<T> {
  return { success: true, data };
}

export class HuevosService {
  constructor(
    private repository: HuevosRepository,
    private newId: () => string = uuidv7,
    private ahora: () => Date = () => new Date()
  ) {}

  /** `registrarHuevo`: devuelve id y codigo del huevo creado. */
  async registrar(
    criaderoId: string,
    aveId: string,
    body: unknown
  ): Promise<Resultado<{ id: string; codigo: string }>> {
    if (!esObjeto(body)) return fallo('VALIDATION_ERROR', 'El cuerpo debe ser un objeto JSON');

    for (const campo of ['jaulaId', 'fecha', 'observacion']) {
      const valor = body[campo];
      if (!esAusente(valor) && typeof valor !== 'string') {
        return fallo('VALIDATION_ERROR', `El campo ${campo} debe ser texto`);
      }
    }

    const jaulaId = body.jaulaId ? String(body.jaulaId) : null;

    if (!(await this.repository.existeAve(criaderoId, aveId))) {
      return fallo('AVE_NO_ENCONTRADA');
    }

    if (jaulaId !== null && !(await this.repository.existeJaula(criaderoId, jaulaId))) {
      return fallo('JAULA_NO_ENCONTRADA', MENSAJE_FK);
    }

    const huevoId = this.newId();

    const codigo = await this.repository.registrarHuevo(criaderoId, {
      huevoId,
      historialId: this.newId(),
      aveId,
      jaulaId,
      // fecha || new Date().toISOString()
      fecha: body.fecha ? String(body.fecha) : this.ahoraIso(),
      observacion: body.observacion ? String(body.observacion) : null,
    });

    return ok({ id: huevoId, codigo });
  }

  async siguienteCodigo(criaderoId: string): Promise<Resultado<{ codigo: string }>> {
    return ok({ codigo: await this.repository.siguienteCodigo(criaderoId) });
  }

  /** Ave inexistente: lista vacia, sin error (V1 no comprueba el ave). */
  async listarPorAve(criaderoId: string, aveId: string): Promise<Resultado<{ huevos: HuevoAve[] }>> {
    return ok({ huevos: await this.repository.listarPorAve(criaderoId, aveId) });
  }

  async resumen(criaderoId: string): Promise<Resultado<ResumenProduccion>> {
    return ok(await this.repository.resumen(criaderoId, this.ahoraIso()));
  }

  async ranking(criaderoId: string): Promise<Resultado<{ ranking: RankingPonedora[] }>> {
    return ok({ ranking: await this.repository.ranking(criaderoId) });
  }

  async porDia(criaderoId: string): Promise<Resultado<{ dias: ProduccionDia[] }>> {
    return ok({ dias: await this.repository.porDia(criaderoId, this.ahoraIso()) });
  }

  async porDiaHistorico(criaderoId: string): Promise<Resultado<{ dias: ProduccionDia[] }>> {
    return ok({ dias: await this.repository.porDiaHistorico(criaderoId) });
  }

  async porHora(criaderoId: string): Promise<Resultado<{ horas: ProduccionHora[] }>> {
    return ok({ horas: await this.repository.porHora(criaderoId) });
  }

  async porJaula(criaderoId: string): Promise<Resultado<{ jaulas: ProduccionJaula[] }>> {
    return ok({ jaulas: await this.repository.porJaula(criaderoId) });
  }

  async porAve(criaderoId: string): Promise<Resultado<{ aves: ProduccionAve[] }>> {
    return ok({ aves: await this.repository.porAve(criaderoId) });
  }

  async total(criaderoId: string): Promise<Resultado<TotalProduccion>> {
    return ok(await this.repository.total(criaderoId, this.ahoraIso()));
  }

  private ahoraIso(): string {
    return this.ahora().toISOString();
  }
}
