/**
 * Service de Finanzas. Replica FinanzasRepository.js (V1): sin validar importes en el alta,
 * mismos codigos de error (MOVIMIENTO_NO_ENCONTRADO, MOVIMIENTO_AUTOMATICO_NO_EDITABLE,
 * VALOR_INVALIDO, VENTA_NO_ENCONTRADA), mismo orden de evaluacion y mismos textos de historial.
 * Dinero: ningun redondeo ni conversion; la unica aritmetica es `ingresos - egresos` en JS, como V1.
 * El reloj es inyectable (pruebas); por defecto es el instante real.
 */

import { v7 as uuidv7 } from 'uuid';
import type { FinanzasRepository } from './finanzas.repository';
import type {
  CategoriaConsolidada,
  HistorialFila,
  HistorialInsert,
  MesConsolidado,
  MovimientoDetalle,
  MovimientoListado,
  Resultado,
  ResumenFinanciero,
  SincronizacionVenta,
  VentaBaja,
} from './finanzas.types';

function fallo(error: string, message: string = error): Resultado<never> {
  return { success: false, error, message };
}

function ok<T>(data: T): Resultado<T> {
  return { success: true, data };
}

function esObjeto(body: unknown): body is Record<string, unknown> {
  return typeof body === 'object' && body !== null && !Array.isArray(body);
}

function esAusente(valor: unknown): valor is null | undefined {
  return valor === undefined || valor === null;
}

/** numeroNoNegativo de V1: vacio/null/undefined = 0; coma por punto; no finito o negativo = null. */
export function numeroNoNegativo(valor: unknown): number | null {
  if (valor === null || valor === undefined || String(valor).trim() === '') {
    return 0;
  }

  const numero = Number(String(valor).replace(',', '.'));

  if (!Number.isFinite(numero) || numero < 0) {
    return null;
  }

  return numero;
}

interface Snapshot {
  tipo: string | null;
  categoria: string | null;
  fecha: string | null;
  valor: number | null;
  detalle: string | null;
}

export class FinanzasService {
  constructor(
    private repository: FinanzasRepository,
    private newId: () => string = uuidv7,
    private ahora: () => Date = () => new Date()
  ) {}

  async resumen(criaderoId: string, periodo?: string): Promise<Resultado<ResumenFinanciero>> {
    const { ingresos, egresos } = await this.repository.resumen(
      criaderoId, periodo ?? 'TODO', this.ahoraIso()
    );

    return ok({ ingresos, egresos, utilidad: ingresos - egresos });
  }

  async listarMovimientos(
    criaderoId: string
  ): Promise<Resultado<{ movimientos: MovimientoListado[] }>> {
    return ok({ movimientos: await this.repository.listarMovimientos(criaderoId) });
  }

  /** registrarIngreso / registrarEgreso: un solo INSERT, origen MANUAL, sin historial. */
  async registrarManual(
    criaderoId: string,
    tipo: 'INGRESO' | 'EGRESO',
    body: unknown
  ): Promise<Resultado<{ id: string }>> {
    if (!esObjeto(body)) return fallo('VALIDATION_ERROR', 'El cuerpo debe ser un objeto JSON');

    for (const campo of ['categoria', 'detalle', 'fecha']) {
      const valor = body[campo];
      if (!esAusente(valor) && typeof valor !== 'string') {
        return fallo('VALIDATION_ERROR', `El campo ${campo} debe ser texto`);
      }
    }

    // Number(valor) como V1; solo se rechaza lo que D1 no puede guardar (NaN / no finito).
    // null/undefined: un NaN de V1 viaja como null en JSON y Number(null) seria 0; V1 no lo guardaba.
    const valor = esAusente(body.valor) ? Number.NaN : Number(body.valor);

    if (!Number.isFinite(valor)) {
      return fallo('VALIDATION_ERROR', 'El campo valor debe ser un numero');
    }

    const id = this.newId();

    await this.repository.insertarManual(criaderoId, {
      id,
      tipo,
      categoria: (body.categoria as string | null | undefined) || 'OTRO',
      fecha: (body.fecha as string | null | undefined) || this.ahoraIso(),
      valor,
      detalle: (body.detalle as string | null | undefined) || null,
    });

    return ok({ id });
  }

  async obtenerMovimiento(
    criaderoId: string,
    id: string
  ): Promise<Resultado<{ movimiento: MovimientoDetalle }>> {
    const movimiento = await this.repository.obtenerMovimiento(criaderoId, id);

    if (!movimiento) return fallo('MOVIMIENTO_NO_ENCONTRADO');

    return ok({ movimiento });
  }

  async obtenerVenta(criaderoId: string, bajaId: string): Promise<Resultado<{ venta: VentaBaja }>> {
    const venta = await this.repository.obtenerVenta(criaderoId, bajaId);

    if (!venta) return fallo('VENTA_NO_ENCONTRADA');

    return ok({ venta });
  }

  /** actualizarMovimientoManual: mismo orden de comprobaciones que V1. */
  async actualizarManual(
    criaderoId: string,
    id: string,
    body: unknown
  ): Promise<Resultado<{ id: string }>> {
    if (!esObjeto(body)) return fallo('VALIDATION_ERROR', 'El cuerpo debe ser un objeto JSON');

    const anterior = await this.repository.obtenerMovimiento(criaderoId, id);

    if (!anterior) return fallo('MOVIMIENTO_NO_ENCONTRADO');

    if (anterior.origenTipo && anterior.origenTipo !== 'MANUAL') {
      return fallo('MOVIMIENTO_AUTOMATICO_NO_EDITABLE');
    }

    const nuevoValor = Number(body.valor);

    if (!Number.isFinite(nuevoValor) || nuevoValor <= 0) {
      return fallo('VALOR_INVALIDO');
    }

    // En V1 un detalle que no es texto lanza TypeError en `.trim()`; aqui es un 400 tecnico.
    for (const campo of ['categoria', 'detalle', 'fecha']) {
      const valor = body[campo];
      if (!esAusente(valor) && typeof valor !== 'string') {
        return fallo('VALIDATION_ERROR', `El campo ${campo} debe ser texto`);
      }
    }

    const nuevaFecha = (body.fecha as string | null | undefined) || anterior.fecha;
    const nuevoDetalle = (body.detalle as string | null | undefined)?.trim() || null;
    const nuevaCategoria = (body.categoria as string | null | undefined) || 'OTRO';
    const nuevoTipo = body.tipo === 'EGRESO' ? 'EGRESO' : 'INGRESO';

    await this.repository.actualizarManual(
      criaderoId,
      this.historialInsert('EDICION_MANUAL', anterior.id, anterior, {
        tipo: nuevoTipo,
        categoria: nuevaCategoria,
        fecha: nuevaFecha,
        valor: nuevoValor,
        detalle: nuevoDetalle,
      }, anterior.origenTipo, anterior.origenId),
      {
        id,
        tipo: nuevoTipo,
        categoria: nuevaCategoria,
        fecha: nuevaFecha,
        valor: nuevoValor,
        detalle: nuevoDetalle,
      }
    );

    return ok({ id });
  }

  /** corregirVentaFinanciera: importes validados antes de leer; un unico batch. */
  async corregirVenta(
    criaderoId: string,
    bajaId: string,
    body: unknown
  ): Promise<Resultado<{ bajaId: string }>> {
    if (!esObjeto(body)) return fallo('VALIDATION_ERROR', 'El cuerpo debe ser un objeto JSON');

    const valorAve = numeroNoNegativo(body.valorVenta);
    const valorTransporte = numeroNoNegativo(body.valorEnvio);

    if (valorAve === null || valorTransporte === null) {
      return fallo('VALOR_INVALIDO');
    }

    const venta = await this.repository.obtenerBajaVenta(criaderoId, bajaId);

    if (!venta) return fallo('VENTA_NO_ENCONTRADA');

    const sincronizaciones: SincronizacionVenta[] = [];

    for (const item of [
      {
        categoria: 'VENTA_AVE' as const,
        valor: valorAve,
        detalle: `Venta de ave ${venta.aveId}`,
        accion: 'CORRECCION_VENTA',
      },
      {
        categoria: 'ENVIO_AVE' as const,
        valor: valorTransporte,
        detalle: `Envío asociado a venta de ave ${venta.aveId}`,
        accion: 'CORRECCION_ENVIO',
      },
    ]) {
      const existente = await this.repository.buscarMovimientoVenta(
        criaderoId, venta.id, item.categoria
      );

      const nuevo: Snapshot = {
        tipo: 'INGRESO',
        categoria: item.categoria,
        fecha: venta.fecha,
        valor: item.valor,
        detalle: item.detalle,
      };

      if (existente) {
        sincronizaciones.push({
          categoria: item.categoria,
          valor: item.valor,
          detalle: item.detalle,
          existenteId: existente.id,
          nuevoId: '',
          historial: this.historialInsert(
            item.accion, existente.id, existente, nuevo, existente.origenTipo, existente.origenId
          ),
        });
      } else {
        const nuevoId = this.newId();

        sincronizaciones.push({
          categoria: item.categoria,
          valor: item.valor,
          detalle: item.detalle,
          existenteId: null,
          nuevoId,
          historial: this.historialInsert(
            'CREACION_POR_CORRECCION',
            nuevoId,
            { tipo: null, categoria: null, fecha: null, valor: null, detalle: null },
            nuevo,
            'VENTA_AVE',
            venta.id
          ),
        });
      }
    }

    await this.repository.corregirVenta(criaderoId, {
      bajaId: venta.id,
      aveId: venta.aveId,
      fechaVenta: venta.fecha,
      valorVenta: valorAve,
      valorEnvio: valorTransporte,
      sincronizaciones,
    });

    return ok({ bajaId });
  }

  /** Movimiento inexistente: lista vacia, sin error (V1 no comprueba). */
  async historial(
    criaderoId: string,
    movimientoId: string
  ): Promise<Resultado<{ historial: HistorialFila[] }>> {
    return ok({ historial: await this.repository.historial(criaderoId, movimientoId) });
  }

  async consolidadoCategorias(
    criaderoId: string,
    periodo?: string
  ): Promise<Resultado<{ categorias: CategoriaConsolidada[] }>> {
    return ok({
      categorias: await this.repository.consolidadoCategorias(
        criaderoId, periodo ?? 'TODO', this.ahoraIso()
      ),
    });
  }

  async consolidadoMensual(
    criaderoId: string,
    limite?: unknown
  ): Promise<Resultado<{ meses: MesConsolidado[] }>> {
    // [Number(limite) || 12] de V1: 0, NaN y ausente = 12.
    return ok({
      meses: await this.repository.consolidadoMensual(criaderoId, Number(limite ?? 12) || 12),
    });
  }

  /** registrarAuditoria de V1: origen_tipo/origen_id salen siempre del movimiento anterior. */
  private historialInsert(
    accion: string,
    movimientoId: string,
    anterior: Snapshot,
    nuevo: Snapshot,
    origenTipo: string | null,
    origenId: string | null
  ): HistorialInsert {
    return {
      id: this.newId(),
      movimientoId,
      fecha: this.ahoraIso(),
      accion,
      tipoAnterior: anterior.tipo ?? null,
      tipoNuevo: nuevo.tipo ?? null,
      categoriaAnterior: anterior.categoria ?? null,
      categoriaNueva: nuevo.categoria ?? null,
      fechaMovimientoAnterior: anterior.fecha ?? null,
      fechaMovimientoNueva: nuevo.fecha ?? null,
      valorAnterior: anterior.valor ?? null,
      valorNuevo: nuevo.valor ?? null,
      detalleAnterior: anterior.detalle ?? null,
      detalleNuevo: nuevo.detalle ?? null,
      origenTipo: origenTipo ?? null,
      origenId: origenId ?? null,
    };
  }

  private ahoraIso(): string {
    return this.ahora().toISOString();
  }
}
