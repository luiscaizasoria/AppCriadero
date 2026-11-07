import type { AlertasRepository } from './alertas.repository';
import type { Alerta, AlertasData, Resultado } from './alertas.types';


/**
 * Solo lectura: replica AlertasRepository.js de V1 (sin validaciones ni errores propios).
 * Un unico `ahora` por peticion se usa en todas las consultas (sustituye a 'now' / CURRENT_TIMESTAMP).
 */
export class AlertasService {

  constructor(
    private repo: AlertasRepository,
    private ahora: () => Date = () => new Date()
  ) {}

  async obtener(criaderoId: string): Promise<Resultado<AlertasData>> {
    const ahoraIso = this.ahora().toISOString();

    const tratamiento = await this.repo.avesEnTratamiento(criaderoId, ahoraIso);
    const jaulas = await this.repo.jaulasActivas(criaderoId, ahoraIso);
    const huevosHoy = await this.repo.huevosHoy(criaderoId, ahoraIso);
    const totales = await this.repo.totalesMes(criaderoId, ahoraIso);

    const alertas: Alerta[] = [];

    for (const item of tratamiento) {
      if (Number(item.dias || 0) >= 7) {
        alertas.push({
          tipo: 'SALUD',
          nivel: 'ALTO',
          titulo: 'Ave en tratamiento prolongado',
          mensaje: `El ave ${item.codigo} lleva ${Math.floor(item.dias as number)} días en tratamiento.`,
          entidadId: item.id,
          accion: 'DETALLE_AVE',
          accionDestino: 'DETALLE_AVE',
        });
      }
    }

    for (const jaula of jaulas) {
      if (Number(jaula.sin_alimentacion)) {
        alertas.push({
          tipo: 'JAULA',
          nivel: 'MEDIO',
          titulo: 'Sin alimentación registrada',
          mensaje: `La jaula ${jaula.codigo} no tiene alimentación registrada hoy.`,
          entidadId: jaula.id,
          accion: 'DETALLE_JAULA',
          accionDestino: 'ALIMENTACION_JAULA',
        });
      }
      if (Number(jaula.sin_bebida)) {
        alertas.push({
          tipo: 'JAULA',
          nivel: 'MEDIO',
          titulo: 'Sin bebida registrada',
          mensaje: `La jaula ${jaula.codigo} no tiene bebida registrada hoy.`,
          entidadId: jaula.id,
          accion: 'DETALLE_JAULA',
          accionDestino: 'BEBIDA_JAULA',
        });
      }
    }

    if (Number(huevosHoy || 0) === 0) {
      alertas.push({
        tipo: 'PRODUCCION',
        nivel: 'MEDIO',
        titulo: 'Sin producción registrada',
        mensaje: 'No existen huevos registrados hoy.',
        entidadId: null,
        accion: null,
        accionDestino: null,
      });
    }

    if (Number(totales?.egresos || 0) > Number(totales?.ingresos || 0)) {
      alertas.push({
        tipo: 'FINANZAS',
        nivel: 'ALTO',
        titulo: 'Gastos superiores a ingresos',
        mensaje: 'Los egresos del mes superan los ingresos registrados.',
        entidadId: null,
        accion: null,
        accionDestino: null,
      });
    }

    return { success: true, data: { alertas } };
  }

}
