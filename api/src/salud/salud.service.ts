/**
 * Service de Salud. Replica registrarDiagnostico y obtenerHistorialSaludAve de
 * SaludRepository.js (V1): sin validar estado del ave; la unica validacion es
 * tecnica (tipos del cuerpo) y la pertenencia del ave al criadero (equivale al
 * error de FK de V1).
 */

import { v7 as uuidv7 } from 'uuid';
import type { SaludRepository } from './salud.repository';
import type { HistorialSalud, Resultado } from './salud.types';

function fallo(error: string, message: string = error): Resultado<never> {
  return { success: false, error, message };
}

function esObjeto(body: unknown): body is Record<string, unknown> {
  return typeof body === 'object' && body !== null && !Array.isArray(body);
}

function esAusente(valor: unknown): valor is null | undefined {
  return valor === undefined || valor === null;
}

/** `x || null` de V1. */
function textoOrNull(valor: unknown): string | null {
  return valor ? String(valor) : null;
}

export class SaludService {
  constructor(
    private repository: SaludRepository,
    private newId: () => string = uuidv7
  ) {}

  async registrarDiagnostico(
    criaderoId: string,
    aveId: string,
    body: unknown
  ): Promise<Resultado<{ id: string }>> {
    if (!esObjeto(body)) return fallo('VALIDATION_ERROR', 'El cuerpo debe ser un objeto JSON');

    if (typeof body.enfermedad !== 'string') {
      return fallo('VALIDATION_ERROR', 'El campo enfermedad debe ser texto');
    }

    if (typeof body.fecha !== 'string') {
      return fallo('VALIDATION_ERROR', 'El campo fecha debe ser texto');
    }

    for (const campo of ['sintomas', 'observacion', 'medicamento', 'dosis']) {
      const valor = body[campo];
      if (!esAusente(valor) && typeof valor !== 'string') {
        return fallo('VALIDATION_ERROR', `El campo ${campo} debe ser texto`);
      }
    }

    if (!(await this.repository.existeAve(criaderoId, aveId))) {
      return fallo('AVE_NO_ENCONTRADA');
    }

    const diagnosticoId = this.newId();

    await this.repository.registrarDiagnostico(criaderoId, {
      diagnosticoId,
      tratamientoId: this.newId(),
      historialId: this.newId(),
      aveId,
      fecha: body.fecha,
      enfermedad: body.enfermedad,
      sintomas: textoOrNull(body.sintomas),
      observacion: textoOrNull(body.observacion),
      medicamento: textoOrNull(body.medicamento),
      dosis: textoOrNull(body.dosis),
    });

    return { success: true, data: { id: diagnosticoId } };
  }

  /** Ave inexistente: lista vacia, sin error (V1 no comprueba el ave). */
  async listarHistorial(
    criaderoId: string,
    aveId: string
  ): Promise<Resultado<{ historial: HistorialSalud[] }>> {
    return {
      success: true,
      data: { historial: await this.repository.listarHistorial(criaderoId, aveId) },
    };
  }
}
