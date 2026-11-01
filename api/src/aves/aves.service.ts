/**
 * Service de Aves. Replica AveRepository.js, EvolucionAveRepository.js y
 * registrarEventoCicloVida de V1: mismos errores (cadenas de V1 como codigo y
 * mensaje), mismos textos de historial y mismo orden de validacion. No anade
 * reglas nuevas; la unica validacion es tecnica (tipos de dato del cuerpo) y la
 * pertenencia de ave/jaula al criadero (equivale al error de FK de V1).
 */

import { generateAveId, type AveRepository } from './aves.repository';
import {
  MENSAJE_CODIGO_DUPLICADO,
  MENSAJE_FK,
  type AveBajaListado,
  type AveCandidataPadre,
  type AveDatos,
  type AveDetalle,
  type AveFila,
  type AveListado,
  type AveParaAsignar,
  type AvePorJaula,
  type EstadoBajaAve,
  type HistorialAve,
  type Resultado,
} from './aves.types';

type EstadoAves = 'ACTIVA' | EstadoBajaAve;

function fallo(error: string, message: string = error): Resultado<never> {
  return { success: false, error, message };
}

function validationError(message: string): Resultado<never> {
  return fallo('VALIDATION_ERROR', message);
}

function aveNoEncontrada(): Resultado<never> {
  return fallo('AVE_NO_ENCONTRADA');
}

/** Equivale al error de FK que V1 deja pasar cuando la jaula no existe. */
function jaulaNoEncontrada(): Resultado<never> {
  return fallo('JAULA_NO_ENCONTRADA', MENSAJE_FK);
}

function esErrorUnique(error: unknown): boolean {
  const mensaje = error instanceof Error ? error.message : String(error);
  return mensaje.toLowerCase().includes('unique');
}

function esObjeto(body: unknown): body is Record<string, unknown> {
  return typeof body === 'object' && body !== null && !Array.isArray(body);
}

function esAusente(valor: unknown): valor is null | undefined {
  return valor === undefined || valor === null;
}

/** string, number o boolean: lo que SQLite/D1 aceptan como parametro escalar (objetos y arreglos no). */
function esEscalar(valor: unknown): valor is string | number | boolean {
  return typeof valor === 'string' || typeof valor === 'number' || typeof valor === 'boolean';
}

/**
 * `x || null` de V1 para textos (sin trim ni comprobacion de tipo). SQLite lo guardaba
 * con afinidad TEXT, asi que un escalar se acepta y se guarda como texto. undefined =
 * objeto/arreglo (tecnico: D1 no puede enlazarlo).
 */
function textoOrNull(valor: unknown): string | null | undefined {
  if (esAusente(valor)) return null;
  if (esEscalar(valor)) return valor ? String(valor) : null;
  return undefined;
}

/** `x?.trim() || null` de V1. undefined = tipo invalido. */
function textoTrimOrNull(valor: unknown): string | null | undefined {
  if (esAusente(valor)) return null;
  if (typeof valor === 'string') return valor.trim() || null;
  return undefined;
}

/**
 * `x ?? null` de V1 para numeros, sin comprobacion de tipo: SQLite aplicaba la afinidad de la
 * columna (un texto numerico se guardaba como numero). Se acepta cualquier escalar; D1 hace
 * lo mismo. undefined = objeto/arreglo (tecnico: D1 no puede enlazarlo).
 */
function numeroOrNull(valor: unknown): number | null | undefined {
  if (esAusente(valor)) return null;
  if (typeof valor === 'number') return valor;
  if (typeof valor === 'boolean') return Number(valor);
  if (typeof valor === 'string') return valor as unknown as number;
  return undefined;
}

/** Normaliza el cuerpo de crearAve / actualizarAve como V1. */
export function normalizarDatos(body: unknown): AveDatos | Resultado<never> {
  if (!esObjeto(body)) return validationError('El cuerpo debe ser un objeto JSON');

  if (typeof body.codigo !== 'string') return validationError('El campo codigo debe ser texto');
  // V1 no validaba origen; aqui solo se exige un escalar porque la columna es NOT NULL y D1 no enlaza undefined/objetos.
  if (!esEscalar(body.origen)) return validationError('El campo origen es obligatorio');

  const fechaNacimiento = textoOrNull(body.fechaNacimiento);
  const fechaIngreso = textoOrNull(body.fechaIngreso);
  const sexo = textoOrNull(body.sexo);
  const fotoUri = textoOrNull(body.fotoUri);
  const padreId = textoOrNull(body.padreId);
  const madreId = textoOrNull(body.madreId);
  const criaderoOrigen = textoTrimOrNull(body.criaderoOrigen);
  const metodoEnvio = textoTrimOrNull(body.metodoEnvio);
  const raza = textoTrimOrNull(body.raza);
  const caracteristicas = textoTrimOrNull(body.caracteristicas);
  const edadMesesCompra = numeroOrNull(body.edadMesesCompra);
  const pesoGramos = numeroOrNull(body.pesoGramos);
  const alturaCm = numeroOrNull(body.alturaCm);
  const largoCm = numeroOrNull(body.largoCm);

  const textos = [
    fechaNacimiento, fechaIngreso, sexo, fotoUri, padreId, madreId,
    criaderoOrigen, metodoEnvio, raza, caracteristicas,
  ];
  const numeros = [edadMesesCompra, pesoGramos, alturaCm, largoCm];

  if (textos.some((valor) => valor === undefined)) {
    return validationError('Los campos del ave no pueden ser objetos ni arreglos');
  }

  if (numeros.some((valor) => valor === undefined)) {
    return validationError('edadMesesCompra, pesoGramos, alturaCm y largoCm no pueden ser objetos ni arreglos');
  }

  return {
    codigo: body.codigo.trim().toUpperCase(),
    origen: String(body.origen),
    fechaNacimiento: fechaNacimiento as string | null,
    edadMesesCompra: edadMesesCompra as number | null,
    fechaIngreso: fechaIngreso as string | null,
    criaderoOrigen: criaderoOrigen as string | null,
    metodoEnvio: metodoEnvio as string | null,
    raza: raza as string | null,
    sexo: sexo as string | null,
    pesoGramos: pesoGramos as number | null,
    alturaCm: alturaCm as number | null,
    largoCm: largoCm as number | null,
    caracteristicas: caracteristicas as string | null,
    fotoUri: fotoUri as string | null,
    padreId: padreId as string | null,
    madreId: madreId as string | null,
  };
}

function esDatos(valor: AveDatos | Resultado<never>): valor is AveDatos {
  return !('success' in valor);
}

/** normalizar() de actualizarAve: null/undefined -> '' y trim. */
function cmp(valor: unknown): string {
  return valor === null || valor === undefined ? '' : String(valor).trim();
}

/** Detalle del evento DATOS_ACTUALIZADOS (etiquetas y orden de V1). */
function detalleCambios(anterior: AveFila, datos: AveDatos, padre: string | null, madre: string | null): string {
  const comparaciones: Array<[boolean, string]> = [
    [cmp(anterior.codigo).toUpperCase() !== datos.codigo, 'código'],
    [cmp(anterior.origen) !== cmp(datos.origen), 'origen'],
    [cmp(anterior.fechaNacimiento) !== cmp(datos.fechaNacimiento), 'fecha de nacimiento'],
    [cmp(anterior.edadMesesCompra) !== cmp(datos.edadMesesCompra), 'edad de ingreso'],
    [cmp(anterior.fechaIngreso) !== cmp(datos.fechaIngreso), 'fecha de ingreso'],
    [cmp(anterior.criaderoOrigen) !== cmp(datos.criaderoOrigen), 'criadero de origen'],
    [cmp(anterior.metodoEnvio) !== cmp(datos.metodoEnvio), 'método de envío'],
    [cmp(anterior.raza) !== cmp(datos.raza), 'raza'],
    [cmp(anterior.sexo) !== cmp(datos.sexo), 'sexo'],
    [cmp(anterior.pesoGramos) !== cmp(datos.pesoGramos), 'peso'],
    [cmp(anterior.alturaCm) !== cmp(datos.alturaCm), 'altura'],
    [cmp(anterior.largoCm) !== cmp(datos.largoCm), 'largo'],
    [cmp(anterior.caracteristicas) !== cmp(datos.caracteristicas), 'características'],
    [cmp(anterior.fotoUri) !== cmp(datos.fotoUri), 'fotografía'],
    [cmp(anterior.padreId) !== cmp(padre), 'padre'],
    [cmp(anterior.madreId) !== cmp(madre), 'madre'],
  ];

  const cambios = comparaciones.filter(([cambio]) => cambio).map(([, etiqueta]) => etiqueta);

  return cambios.length > 0
    ? `Datos generales actualizados: ${cambios.join(', ')}.`
    : 'Se guardó la edición de los datos generales sin cambios visibles.';
}

// ---- Helpers de registrarEvolucionAve (EvolucionAveRepository.js:413-543) ----

function fueMedidaInformada(valor: unknown): boolean {
  return !(esAusente(valor) || String(valor).trim() === '');
}

function numeroOActual(nuevo: unknown, actual: number | null | undefined): number | null {
  const actualNumero = esAusente(actual) ? null : Number(actual);

  if (!fueMedidaInformada(nuevo)) return actualNumero;

  const numero = Number(String(nuevo).replace(',', '.'));

  return Number.isFinite(numero) ? numero : actualNumero;
}

function numerosIguales(a: unknown, b: unknown): boolean {
  const aVacio = a === null || a === undefined || a === '';
  const bVacio = b === null || b === undefined || b === '';

  if (aVacio && bVacio) return true;

  return Number(a) === Number(b);
}

function formatearMedida(valor: number | null | undefined, unidad: string): string {
  if (esAusente(valor)) return 'No registrado';
  return `${Number(valor)} ${unidad}`;
}

function normalizarTexto(valor: unknown): string {
  return String(valor || '').trim();
}

export class AveService {
  constructor(
    private repository: AveRepository,
    private now: () => Date = () => new Date(),
    private newId: () => string = generateAveId
  ) {}

  async listar(
    criaderoId: string,
    estado: EstadoAves
  ): Promise<Resultado<{ aves: AveListado[] | AveBajaListado[] }>> {
    const aves = estado === 'ACTIVA'
      ? await this.repository.listarActivas(criaderoId)
      : await this.repository.listarBajas(criaderoId, estado);

    return { success: true, data: { aves } };
  }

  async listarPorJaula(criaderoId: string, jaulaId: string): Promise<Resultado<{ aves: AvePorJaula[] }>> {
    return { success: true, data: { aves: await this.repository.listarPorJaula(criaderoId, jaulaId) } };
  }

  async listarParaAsignarJaula(
    criaderoId: string,
    jaulaId: string
  ): Promise<Resultado<{ aves: AveParaAsignar[] }>> {
    return {
      success: true,
      data: { aves: await this.repository.listarParaAsignarJaula(criaderoId, jaulaId) },
    };
  }

  async listarCandidatasPadres(
    criaderoId: string,
    aveIdActual: string | null
  ): Promise<Resultado<{ aves: AveCandidataPadre[] }>> {
    return {
      success: true,
      data: { aves: await this.repository.listarCandidatasPadres(criaderoId, aveIdActual || null) },
    };
  }

  /** existeAvePorCodigo de V1: UPPER(TRIM), false si queda vacio, excluye el id si es truthy. */
  async existeCodigo(
    criaderoId: string,
    codigo: string,
    excluirAveId: string | null
  ): Promise<Resultado<{ existe: boolean }>> {
    const codigoLimpio = String(codigo || '').trim().toUpperCase();

    if (!codigoLimpio) return { success: true, data: { existe: false } };

    const existe = await this.repository.existeCodigo(criaderoId, codigoLimpio, excluirAveId || null);

    return { success: true, data: { existe } };
  }

  async obtener(criaderoId: string, aveId: string): Promise<Resultado<{ ave: AveDetalle }>> {
    const ave = await this.repository.obtenerPorId(criaderoId, aveId);

    if (!ave) return aveNoEncontrada();

    return { success: true, data: { ave } };
  }

  /**
   * validarRelacionPadres de V1, en su orden. Con aveId (edicion) incluye
   * PADRE/MADRE_ES_MISMA_AVE y el recorrido de descendientes (una sola consulta).
   */
  private async validarRelacionPadres(
    criaderoId: string,
    aveId: string | null,
    padreId: string | null,
    madreId: string | null
  ): Promise<Resultado<never> | null> {
    if (aveId && padreId === aveId) return fallo('PADRE_ES_MISMA_AVE');
    if (aveId && madreId === aveId) return fallo('MADRE_ES_MISMA_AVE');
    if (padreId && madreId && padreId === madreId) return fallo('PADRES_IGUALES');

    if (padreId) {
      const padre = await this.repository.obtenerParentesco(criaderoId, padreId);

      if (!padre) return fallo('PADRE_NO_ENCONTRADO');
      if (padre.sexo && padre.sexo !== 'MACHO') return fallo('PADRE_NO_MACHO');
    }

    if (madreId) {
      const madre = await this.repository.obtenerParentesco(criaderoId, madreId);

      if (!madre) return fallo('MADRE_NO_ENCONTRADA');
      if (madre.sexo && madre.sexo !== 'HEMBRA') return fallo('MADRE_NO_HEMBRA');
    }

    if (!aveId || (!padreId && !madreId)) return null;

    const descendientes = new Set(await this.repository.obtenerIdsDescendientes(criaderoId, aveId));

    if (padreId && descendientes.has(padreId)) return fallo('PARENTESCO_CIRCULAR_PADRE');
    if (madreId && descendientes.has(madreId)) return fallo('PARENTESCO_CIRCULAR_MADRE');

    return null;
  }

  async crear(criaderoId: string, body: unknown): Promise<Resultado<{ ave: AveDetalle }>> {
    const datos = normalizarDatos(body);
    if (!esDatos(datos)) return datos;

    const jaulaIdBody = (body as Record<string, unknown>).jaulaId;

    if (!esAusente(jaulaIdBody) && typeof jaulaIdBody !== 'string') {
      return validationError('jaulaId debe ser texto');
    }

    const jaulaId = (jaulaIdBody as string | null | undefined) || null;

    const errorPadres = await this.validarRelacionPadres(criaderoId, null, datos.padreId, datos.madreId);
    if (errorPadres) return errorPadres;

    if (jaulaId && !(await this.repository.obtenerJaula(criaderoId, jaulaId))) {
      return jaulaNoEncontrada();
    }

    const id = this.newId();
    const fecha = this.now().toISOString();

    try {
      await this.repository.crear(criaderoId, {
        id,
        datos,
        jaulaId,
        evolucionId: this.newId(),
        historialId: this.newId(),
        jaulaHistorialId: jaulaId ? this.newId() : null,
        fecha,
        detalleAlta: datos.origen === 'NACIDA_CRIADERO'
          ? 'Ave registrada como nacida en el criadero.'
          : 'Ave registrada como comprada.',
        detalleJaula: jaulaId ? `Ave ${datos.codigo} ingresó a la jaula.` : null,
      });
    } catch (error) {
      if (esErrorUnique(error)) {
        return fallo('UNIQUE_AVES_CODIGO', MENSAJE_CODIGO_DUPLICADO);
      }
      throw error;
    }

    return this.obtener(criaderoId, id);
  }

  async actualizar(
    criaderoId: string,
    aveId: string,
    body: unknown
  ): Promise<Resultado<{ ave: AveDetalle }>> {
    const datos = normalizarDatos(body);
    if (!esDatos(datos)) return datos;

    const anterior = await this.repository.obtenerFila(criaderoId, aveId);

    if (!anterior) return aveNoEncontrada();
    if (anterior.estado !== 'ACTIVA') return fallo('AVE_NO_ACTIVA');

    const errorPadres = await this.validarRelacionPadres(criaderoId, aveId, datos.padreId, datos.madreId);
    if (errorPadres) return errorPadres;

    if (await this.repository.existeCodigo(criaderoId, datos.codigo, aveId)) {
      return fallo('CODIGO_AVE_DUPLICADO');
    }

    const esNacida = datos.origen === 'NACIDA_CRIADERO';
    const padreGuardar = esNacida ? datos.padreId : null;
    const madreGuardar = esNacida ? datos.madreId : null;
    const guardados: AveDatos = { ...datos, padreId: padreGuardar, madreId: madreGuardar };

    try {
      await this.repository.actualizar(criaderoId, {
        aveId,
        datos: guardados,
        jaulaActualId: anterior.jaulaActualId || null,
        historialId: this.newId(),
        fecha: this.now().toISOString(),
        detalle: detalleCambios(anterior, datos, padreGuardar, madreGuardar),
      });
    } catch (error) {
      if (esErrorUnique(error)) return fallo('CODIGO_AVE_DUPLICADO');
      throw error;
    }

    return this.obtener(criaderoId, aveId);
  }

  /**
   * cambiarJaulaAve de V1: jaulaAnteriorId y codigoAve los aporta el llamador
   * (si falta el codigo se usa el del ave). No valida estado del ave ni jaula activa.
   */
  async cambiarJaula(
    criaderoId: string,
    aveId: string,
    body: unknown
  ): Promise<Resultado<{ ave: AveDetalle }>> {
    if (!esObjeto(body)) return validationError('El cuerpo debe ser un objeto JSON');

    for (const campo of ['nuevaJaulaId', 'jaulaAnteriorId', 'codigoAve']) {
      const valor = body[campo];
      if (!esAusente(valor) && typeof valor !== 'string') {
        return validationError(`El campo ${campo} debe ser texto`);
      }
    }

    const ave = await this.repository.obtenerFila(criaderoId, aveId);

    if (!ave) return aveNoEncontrada();

    const nuevaJaulaId = (body.nuevaJaulaId as string | null | undefined) || null;
    const jaulaAnteriorId = (body.jaulaAnteriorId as string | null | undefined) || null;
    const codigoAve = (body.codigoAve as string | null | undefined) ?? ave.codigo;

    for (const jaulaId of [nuevaJaulaId, jaulaAnteriorId]) {
      if (jaulaId && !(await this.repository.obtenerJaula(criaderoId, jaulaId))) {
        return jaulaNoEncontrada();
      }
    }

    const detalleCambio = nuevaJaulaId && jaulaAnteriorId
      ? 'El ave fue movida de una jaula a otra.'
      : nuevaJaulaId
        ? 'El ave fue asignada a una jaula.'
        : 'El ave fue retirada de su jaula.';

    await this.repository.cambiarJaula(criaderoId, {
      aveId,
      nuevaJaulaId,
      jaulaAnteriorId,
      fecha: this.now().toISOString(),
      historialId: this.newId(),
      detalleCambio,
      salida: jaulaAnteriorId
        ? { id: this.newId(), detalle: `Ave ${codigoAve} salió de la jaula.` }
        : null,
      ingreso: nuevaJaulaId
        ? { id: this.newId(), detalle: `Ave ${codigoAve} ingresó a la jaula.` }
        : null,
    });

    return this.obtener(criaderoId, aveId);
  }

  /** obtenerHistorialAve de V1 (sin comprobar existencia: ave inexistente -> []). */
  async listarHistorial(
    criaderoId: string,
    aveId: string
  ): Promise<Resultado<{ historial: HistorialAve[] }>> {
    return {
      success: true,
      data: { historial: await this.repository.listarHistorial(criaderoId, aveId) },
    };
  }

  /** registrarEventoCicloVida de V1: ave_historial sin jaula_id, fecha || ahora, detalle || null. */
  async registrarEvento(
    criaderoId: string,
    aveId: string,
    body: unknown
  ): Promise<Resultado<{ id: string }>> {
    if (!esObjeto(body)) return validationError('El cuerpo debe ser un objeto JSON');

    if (typeof body.tipoEvento !== 'string') {
      return validationError('El campo tipoEvento debe ser texto');
    }

    if (!esAusente(body.fecha) && typeof body.fecha !== 'string') {
      return validationError('El campo fecha debe ser texto');
    }

    if (!esAusente(body.detalle) && typeof body.detalle !== 'string') {
      return validationError('El campo detalle debe ser texto');
    }

    if (!(await this.repository.obtenerFila(criaderoId, aveId))) return aveNoEncontrada();

    const id = this.newId();

    await this.repository.insertarEvento(criaderoId, {
      id,
      aveId,
      tipoEvento: body.tipoEvento,
      fecha: (body.fecha as string | null | undefined) || this.now().toISOString(),
      detalle: (body.detalle as string | null | undefined) || null,
    });

    return { success: true, data: { id } };
  }

  /** registrarEvolucionAve de V1. */
  async registrarEvolucion(
    criaderoId: string,
    aveId: string,
    body: unknown
  ): Promise<Resultado<{ ave: AveDetalle }>> {
    if (!esObjeto(body)) return validationError('El cuerpo debe ser un objeto JSON');

    for (const campo of ['fotoUri', 'caracteristicas', 'observacion']) {
      const valor = body[campo];
      if (!esAusente(valor) && typeof valor !== 'string') {
        return validationError(`El campo ${campo} debe ser texto`);
      }
    }

    for (const campo of ['pesoGramos', 'alturaCm', 'largoCm']) {
      const valor = body[campo];
      if (!esAusente(valor) && typeof valor !== 'number' && typeof valor !== 'string') {
        return validationError(`El campo ${campo} debe ser numero o texto numerico`);
      }
    }

    const fotoUri = (body.fotoUri as string | null | undefined) || null;
    const caracteristicas = (body.caracteristicas as string | null | undefined) || null;
    const observacion = (body.observacion as string | null | undefined) || null;

    const contexto = await this.repository.obtenerContextoEvolucion(criaderoId, aveId);

    if (!contexto) return aveNoEncontrada();

    const actual = contexto.ave;
    const fechaActual = this.now().toISOString();

    const pesoFinal = numeroOActual(body.pesoGramos, actual.pesoGramos);
    const alturaFinal = numeroOActual(body.alturaCm, actual.alturaCm);
    const largoFinal = numeroOActual(body.largoCm, actual.largoCm);

    const cambios: string[] = [];

    if (fueMedidaInformada(body.pesoGramos) && !numerosIguales(actual.pesoGramos, pesoFinal)) {
      cambios.push(`Peso: ${formatearMedida(actual.pesoGramos, 'g')} → ${formatearMedida(pesoFinal, 'g')}`);
    }

    if (fueMedidaInformada(body.alturaCm) && !numerosIguales(actual.alturaCm, alturaFinal)) {
      cambios.push(`Altura: ${formatearMedida(actual.alturaCm, 'cm')} → ${formatearMedida(alturaFinal, 'cm')}`);
    }

    if (fueMedidaInformada(body.largoCm) && !numerosIguales(actual.largoCm, largoFinal)) {
      cambios.push(`Largo: ${formatearMedida(actual.largoCm, 'cm')} → ${formatearMedida(largoFinal, 'cm')}`);
    }

    if (normalizarTexto(actual.fotoUri) !== normalizarTexto(fotoUri)) {
      cambios.push('Fotografía actualizada');
    }

    if (normalizarTexto(actual.caracteristicas) !== normalizarTexto(caracteristicas)) {
      cambios.push('Características actualizadas');
    }

    let detalle = cambios.length > 0
      ? `Evolución registrada. ${cambios.join('. ')}.`
      : 'Se actualizó la evolución del ave.';

    if (observacion && observacion.trim()) detalle += ` ${observacion.trim()}`;

    await this.repository.registrarEvolucion(criaderoId, {
      aveId,
      inicial: contexto.totalEvoluciones === 0
        ? {
            id: this.newId(),
            fecha: actual.fechaCreacion || fechaActual,
            fotoUri: actual.fotoUri || null,
            pesoGramos: numeroOActual(undefined, actual.pesoGramos),
            alturaCm: numeroOActual(undefined, actual.alturaCm),
            largoCm: numeroOActual(undefined, actual.largoCm),
            caracteristicas: actual.caracteristicas || null,
          }
        : null,
      fotoUri,
      pesoGramos: pesoFinal,
      alturaCm: alturaFinal,
      largoCm: largoFinal,
      caracteristicas,
      observacion,
      evolucionId: this.newId(),
      fecha: fechaActual,
      jaulaActualId: actual.jaulaActualId || null,
      historialId: this.newId(),
      detalle,
    });

    return this.obtener(criaderoId, aveId);
  }

  /**
   * finalizarTratamiento de v1.0.0 (tres escrituras en un batch). El evento
   * RECUPERACION lo registra la pantalla via registrarEvento. Sin validar el
   * estado de salud del ave.
   */
  async finalizarTratamiento(
    criaderoId: string,
    aveId: string,
    body: unknown
  ): Promise<Resultado<{ ave: AveDetalle }>> {
    let observacion = '';

    if (body !== undefined && body !== null) {
      if (!esObjeto(body)) return validationError('El cuerpo debe ser un objeto JSON');

      if (!esAusente(body.observacion) && typeof body.observacion !== 'string') {
        return validationError('El campo observacion debe ser texto');
      }

      observacion = ((body.observacion as string | null | undefined) ?? '').trim();
    }

    if (!(await this.repository.obtenerFila(criaderoId, aveId))) return aveNoEncontrada();

    const fecha = this.now().toISOString();

    await this.repository.finalizarTratamiento(criaderoId, {
      aveId,
      fecha,
      saludId: this.newId(),
      detalleSalud: observacion
        ? `Recuperación registrada: ${observacion}`
        : 'Ave recuperada y tratamiento finalizado.',
    });

    return this.obtener(criaderoId, aveId);
  }
}
