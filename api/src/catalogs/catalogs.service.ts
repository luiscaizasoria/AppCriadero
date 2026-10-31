/**
 * Service de Catalogos. Replica ConfiguracionRepository.js de V1: el codigo
 * no se normaliza (lo hace la pantalla), orden = 0 al crear, editar solo
 * cambia nombre y descripcion y "eliminar" es activo = 0 (idempotente).
 * Validacion tecnica unicamente (tipos y textos vacios que la pantalla ya impide).
 */

import { generateCatalogoItemId, type CatalogoRepository } from './catalogs.repository';
import {
  CATALOGOS_BASICOS,
  MENSAJE_ITEM_CODIGO_DUPLICADO,
  type CatalogoDetalle,
  type CatalogoItem,
  type CatalogoItemEdicion,
  type CatalogoItemNuevo,
  type CatalogoListado,
  type Resultado,
} from './catalogs.types';

function validationError(message: string): Resultado<never> {
  return { success: false, error: 'VALIDATION_ERROR', message };
}

function catalogoNoEncontrado(): Resultado<never> {
  return { success: false, error: 'CATALOGO_NOT_FOUND', message: 'CATALOGO_NOT_FOUND' };
}

function itemNoEncontrado(): Resultado<never> {
  return { success: false, error: 'CATALOGO_ITEM_NOT_FOUND', message: 'CATALOGO_ITEM_NOT_FOUND' };
}

function codigoDuplicado(): Resultado<never> {
  return {
    success: false,
    error: 'UNIQUE_CATALOGO_ITEMS_CODIGO',
    message: MENSAJE_ITEM_CODIGO_DUPLICADO,
  };
}

function esErrorUnique(error: unknown): boolean {
  const mensaje = error instanceof Error ? error.message : String(error);
  return mensaje.toLowerCase().includes('unique');
}

function esObjeto(body: unknown): body is Record<string, unknown> {
  return typeof body === 'object' && body !== null && !Array.isArray(body);
}

/** descripcion || null, como V1; un valor que no es texto es error tecnico. */
function descripcionOpcional(valor: unknown): string | null | undefined {
  if (valor === undefined || valor === null) return null;
  if (typeof valor === 'string') return valor || null;
  return undefined;
}

function textoRequerido(valor: unknown): valor is string {
  return typeof valor === 'string' && valor.trim() !== '';
}

function esBasico(codigo: string): boolean {
  return (CATALOGOS_BASICOS as readonly string[]).includes(codigo);
}

function esError<T>(valor: T | Resultado<never>): valor is Resultado<never> {
  return typeof valor === 'object' && valor !== null && 'success' in valor;
}

export function validarAlta(body: unknown): CatalogoItemNuevo | Resultado<never> {
  if (!esObjeto(body)) return validationError('El cuerpo debe ser un objeto JSON');
  if (!textoRequerido(body.codigo)) return validationError('El campo codigo es requerido');
  if (!textoRequerido(body.nombre)) return validationError('El campo nombre es requerido');

  const descripcion = descripcionOpcional(body.descripcion);
  if (descripcion === undefined) return validationError('descripcion debe ser texto');

  return { codigo: body.codigo, nombre: body.nombre, descripcion };
}

export function validarEdicion(body: unknown): CatalogoItemEdicion | Resultado<never> {
  if (!esObjeto(body)) return validationError('El cuerpo debe ser un objeto JSON');
  if (!textoRequerido(body.nombre)) return validationError('El campo nombre es requerido');

  const descripcion = descripcionOpcional(body.descripcion);
  if (descripcion === undefined) return validationError('descripcion debe ser texto');

  return { nombre: body.nombre, descripcion };
}

export class CatalogoService {
  constructor(
    private repository: CatalogoRepository,
    private newId: () => string = generateCatalogoItemId
  ) {}

  private async resolverCatalogo(codigo: string): Promise<CatalogoDetalle | null> {
    if (!esBasico(codigo)) return null;
    return this.repository.obtenerCatalogoPorCodigo(codigo);
  }

  async listarCatalogos(): Promise<Resultado<{ catalogos: CatalogoListado[] }>> {
    const catalogos = await this.repository.listarCatalogos(CATALOGOS_BASICOS);
    return { success: true, data: { catalogos } };
  }

  async obtenerCatalogo(codigo: string): Promise<Resultado<{ catalogo: CatalogoDetalle }>> {
    const catalogo = await this.resolverCatalogo(codigo);
    if (!catalogo) return catalogoNoEncontrado();
    return { success: true, data: { catalogo } };
  }

  async listarItems(
    criaderoId: string,
    codigo: string
  ): Promise<Resultado<{ items: CatalogoItem[] }>> {
    const catalogo = await this.resolverCatalogo(codigo);
    if (!catalogo) return catalogoNoEncontrado();

    const items = await this.repository.listarItems(criaderoId, catalogo.id);
    return { success: true, data: { items } };
  }

  async crearItem(
    criaderoId: string,
    codigo: string,
    body: unknown
  ): Promise<Resultado<{ item: CatalogoItem }>> {
    const datos = validarAlta(body);
    if (esError(datos)) return datos;

    const catalogo = await this.resolverCatalogo(codigo);
    if (!catalogo) return catalogoNoEncontrado();

    const id = this.newId();

    try {
      await this.repository.crearItem(criaderoId, catalogo.id, id, datos);
    } catch (error) {
      if (esErrorUnique(error)) return codigoDuplicado();
      throw error;
    }

    return this.devolverItem(criaderoId, catalogo.id, id);
  }

  async actualizarItem(
    criaderoId: string,
    codigo: string,
    itemId: string,
    body: unknown
  ): Promise<Resultado<{ item: CatalogoItem }>> {
    const datos = validarEdicion(body);
    if (esError(datos)) return datos;

    const catalogo = await this.resolverCatalogo(codigo);
    if (!catalogo) return catalogoNoEncontrado();

    const filas = await this.repository.actualizarItem(criaderoId, catalogo.id, itemId, datos);
    if (filas === 0) return itemNoEncontrado();

    return this.devolverItem(criaderoId, catalogo.id, itemId);
  }

  /** Equivale a eliminarItemCatalogo de V1: activo = 0, idempotente. */
  async desactivarItem(
    criaderoId: string,
    codigo: string,
    itemId: string
  ): Promise<Resultado<{ item: CatalogoItem }>> {
    const catalogo = await this.resolverCatalogo(codigo);
    if (!catalogo) return catalogoNoEncontrado();

    const filas = await this.repository.desactivarItem(criaderoId, catalogo.id, itemId);
    if (filas === 0) return itemNoEncontrado();

    return this.devolverItem(criaderoId, catalogo.id, itemId);
  }

  private async devolverItem(
    criaderoId: string,
    catalogoId: string,
    itemId: string
  ): Promise<Resultado<{ item: CatalogoItem }>> {
    const item = await this.repository.obtenerItem(criaderoId, catalogoId, itemId);
    if (!item) return itemNoEncontrado();
    return { success: true, data: { item } };
  }
}
