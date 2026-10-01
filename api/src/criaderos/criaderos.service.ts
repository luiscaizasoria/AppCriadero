/**
 * Service para lógica de negocio de Criaderos
 */

import { DEFAULT_CATALOG_ITEMS, DefaultCatalogItem } from '../catalogs/defaultCatalogItems';
import type { CriaderoRepository } from './criaderos.repository';
import type {
  CreateCriaderoRequest,
  CreateCriaderoResponse,
  UpdateConfiguracionRequest,
  UpdateConfiguracionResponse,
  ErrorResponse,
} from './criaderos.types';
import {
  generateCriaderoId,
  generateCatalogoItemId,
  generateConfiguracionId,
} from './criaderos.repository';

export class CriaderoService {
  constructor(private repository: CriaderoRepository) {}

  async createCriadero(request: CreateCriaderoRequest): Promise<CreateCriaderoResponse | ErrorResponse> {
    // Validaciones
    if (!request.userId || !request.nombre || !request.pais || !request.provincia ||
        !request.ciudad || !request.telefono || !request.correoContacto) {
      return {
        success: false,
        error: 'VALIDATION_ERROR',
        message: 'Todos los campos requeridos deben estar presentes',
      };
    }

    // Verificar que el usuario existe y está activo
    const userExists = await this.repository.userExistsAndActive(request.userId);
    if (!userExists) {
      return {
        success: false,
        error: 'USER_NOT_FOUND',
        message: 'El usuario no existe o no está activo',
      };
    }

    try {
      // Paso 1: Obtener los catálogos necesarios
      const catalogCodes = Array.from(
        new Set(DEFAULT_CATALOG_ITEMS.map(item => item.catalogCode))
      );
      const catalogosMap = await this.repository.getCatalogosByCodigo(catalogCodes);

      // Paso 2: Validar que existan todos los catálogos necesarios
      const missingCatalogs = catalogCodes.filter(code => !catalogosMap.has(code));
      if (missingCatalogs.length > 0) {
        return {
          success: false,
          error: 'CATALOGS_MISSING',
          message: `Faltan catálogos requeridos: ${missingCatalogs.join(', ')}`,
        };
      }

      // Paso 3: Generar todos los UUIDs previamente
      const criaderoId = generateCriaderoId();
      const configuracionId = generateConfiguracionId();
      const itemIds = DEFAULT_CATALOG_ITEMS.map(() => generateCatalogoItemId());

      // Paso 4: Preparar todos los statements en un único array
      const db = this.repository.getDb();
      const statements: D1PreparedStatement[] = [];

      // Statement para INSERT criadero
      const criaderoStmt = db.prepare(`
        INSERT INTO criaderos (
          id, user_id, nombre, descripcion, pais, provincia, ciudad,
          direccion, telefono, correo_contacto, logo_uri, onboarding_completado
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NULL, 0)
      `);
      statements.push(
        criaderoStmt.bind(
          criaderoId,
          request.userId,
          request.nombre,
          request.descripcion ?? null,
          request.pais,
          request.provincia,
          request.ciudad,
          request.direccion ?? null,
          request.telefono,
          request.correoContacto
        )
      );

      // Statements para INSERT catalogo_items
      const catalogoItemStmt = db.prepare(`
        INSERT INTO catalogo_items (
          id, criadero_id, catalogo_id, codigo, nombre, descripcion,
          activo, orden, deleted_at, version
        ) VALUES (?, ?, ?, ?, ?, ?, 1, ?, NULL, 1)
      `);

      for (let i = 0; i < DEFAULT_CATALOG_ITEMS.length; i++) {
        const item = DEFAULT_CATALOG_ITEMS[i];
        const catalogoId = catalogosMap.get(item.catalogCode)!;
        statements.push(
          catalogoItemStmt.bind(
            itemIds[i],
            criaderoId,
            catalogoId,
            item.code,
            item.name,
            item.description ?? null,
            item.order ?? null
          )
        );
      }

      // Statement para INSERT criadero_configuracion
      const configuracionStmt = db.prepare(`
        INSERT INTO criadero_configuracion (
          id, criadero_id, especie_principal_item_id, raza_principal_item_id,
          tipo_criadero_item_id, finalidad_item_id
        ) VALUES (?, ?, NULL, NULL, NULL, NULL)
      `);
      statements.push(configuracionStmt.bind(configuracionId, criaderoId));

      // Paso 5: Ejecutar un único batch con todos los statements
      await this.repository.executeBatch(statements);

      return {
        success: true,
        data: {
          id: criaderoId,
          userId: request.userId,
          nombre: request.nombre,
          onboardingCompletado: false,
          catalogoItemsGenerados: DEFAULT_CATALOG_ITEMS.length,
        },
      };
    } catch (error) {
      console.error('Error al crear criadero:', error);
      return {
        success: false,
        error: 'INTERNAL_ERROR',
        message: 'Error al crear el criadero',
      };
    }
  }

  async updateConfiguracion(
    criaderoId: string,
    request: UpdateConfiguracionRequest
  ): Promise<UpdateConfiguracionResponse | ErrorResponse> {
    // Validaciones
    if (!criaderoId) {
      return {
        success: false,
        error: 'VALIDATION_ERROR',
        message: 'criaderoId es requerido',
      };
    }

    if (!request.especiePrincipalItemId || !request.razaPrincipalItemId ||
        !request.tipoCriaderoItemId || !request.finalidadItemId) {
      return {
        success: false,
        error: 'VALIDATION_ERROR',
        message: 'Todos los campos de configuración son requeridos',
      };
    }

    // Verificar que el criadero existe
    const criaderoExists = await this.repository.criaderoExists(criaderoId);
    if (!criaderoExists) {
      return {
        success: false,
        error: 'CRIADERO_NOT_FOUND',
        message: 'El criadero no existe',
      };
    }

    try {
      // Obtener información de los 4 items seleccionados
      const itemIds = [
        request.especiePrincipalItemId,
        request.razaPrincipalItemId,
        request.tipoCriaderoItemId,
        request.finalidadItemId,
      ];

      const itemsInfo = await this.repository.getCatalogoItemsInfo(itemIds);

      // Validar que existan todos los items
      const missingItems = itemIds.filter(id => !itemsInfo.has(id));
      if (missingItems.length > 0) {
        return {
          success: false,
          error: 'ITEMS_NOT_FOUND',
          message: `Items no encontrados: ${missingItems.join(', ')}`,
        };
      }

      // Validar cada item
      const especieItem = itemsInfo.get(request.especiePrincipalItemId)!;
      const razaItem = itemsInfo.get(request.razaPrincipalItemId)!;
      const tipoItem = itemsInfo.get(request.tipoCriaderoItemId)!;
      const finalidadItem = itemsInfo.get(request.finalidadItemId)!;

      // Validar que todos los items pertenezcan al mismo criadero
      if (especieItem.criaderoId !== criaderoId ||
          razaItem.criaderoId !== criaderoId ||
          tipoItem.criaderoId !== criaderoId ||
          finalidadItem.criaderoId !== criaderoId) {
        return {
          success: false,
          error: 'ITEM_WRONG_CRIADERO',
          message: 'Los items seleccionados deben pertenecer al mismo criadero',
        };
      }

      // Validar que todos los items estén activos
      if (especieItem.activo !== 1 || razaItem.activo !== 1 ||
          tipoItem.activo !== 1 || finalidadItem.activo !== 1) {
        return {
          success: false,
          error: 'ITEM_NOT_ACTIVE',
          message: 'Todos los items seleccionados deben estar activos',
        };
      }

      // Validar que ningún item tenga deleted_at
      if (especieItem.deletedAt !== null || razaItem.deletedAt !== null ||
          tipoItem.deletedAt !== null || finalidadItem.deletedAt !== null) {
        return {
          success: false,
          error: 'ITEM_DELETED',
          message: 'Los items seleccionados no deben estar eliminados',
        };
      }

      // Validar que cada item pertenezca al catálogo correcto
      const catalogValidations = [
        {
          itemId: request.especiePrincipalItemId,
          expectedCatalog: 'ESPECIES',
          field: 'especiePrincipalItemId',
        },
        {
          itemId: request.razaPrincipalItemId,
          expectedCatalog: 'RAZAS',
          field: 'razaPrincipalItemId',
        },
        {
          itemId: request.tipoCriaderoItemId,
          expectedCatalog: 'TIPOS_CRIADERO',
          field: 'tipoCriaderoItemId',
        },
        {
          itemId: request.finalidadItemId,
          expectedCatalog: 'FINALIDADES_CRIADERO',
          field: 'finalidadItemId',
        },
      ];

      for (const validation of catalogValidations) {
        const item = itemsInfo.get(validation.itemId)!;
        if (item.catalogoCodigo !== validation.expectedCatalog) {
          return {
            success: false,
            error: 'ITEM_WRONG_CATALOG',
            message: `El campo ${validation.field} pertenece al catálogo ${item.catalogoCodigo}, se esperaba ${validation.expectedCatalog}`,
          };
        }
      }

      // TODO: En una fase posterior, filtrar raza por especie.
      // Actualmente todas las razas son de gallina/gallo, pero cuando se agreguen
      // razas de otras especies (pato, pavo, codorniz), se debe validar que
      // la raza seleccionada corresponda a la especie seleccionada.

      // Obtener versión actual de la configuración
      const currentVersion = await this.repository.getConfiguracionVersion(criaderoId);
      if (currentVersion === null) {
        return {
          success: false,
          error: 'CRIADERO_CONFIGURATION_MISSING',
          message: 'No existe configuración para este criadero',
        };
      }

      // Actualizar configuración
      const updateResult = await this.repository.updateConfiguracion({
        criaderoId,
        especiePrincipalItemId: request.especiePrincipalItemId,
        razaPrincipalItemId: request.razaPrincipalItemId,
        tipoCriaderoItemId: request.tipoCriaderoItemId,
        finalidadItemId: request.finalidadItemId,
        currentVersion,
      });

      if (!updateResult.success) {
        return {
          success: false,
          error: 'CONFIGURATION_CONCURRENCY_CONFLICT',
          message: 'La configuración fue modificada por otra operación. Intente nuevamente.',
        };
      }

      return {
        success: true,
        data: {
          criaderoId,
          especiePrincipalItemId: request.especiePrincipalItemId,
          razaPrincipalItemId: request.razaPrincipalItemId,
          tipoCriaderoItemId: request.tipoCriaderoItemId,
          finalidadItemId: request.finalidadItemId,
          onboardingCompletado: false,
        },
      };
    } catch (error) {
      console.error('Error al actualizar configuración:', error);
      return {
        success: false,
        error: 'INTERNAL_ERROR',
        message: 'Error al actualizar la configuración',
      };
    }
  }
}
