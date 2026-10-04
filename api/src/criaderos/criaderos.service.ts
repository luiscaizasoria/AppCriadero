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
  CompleteOnboardingResponse,
  OnboardingStatusResponse,
  ErrorResponse,
  OnboardingIncompleteErrorResponse,
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

  async completeOnboarding(criaderoId: string): Promise<CompleteOnboardingResponse | ErrorResponse | OnboardingIncompleteErrorResponse> {
    if (!criaderoId) {
      return {
        success: false,
        error: 'VALIDATION_ERROR',
        message: 'criaderoId es requerido',
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
      // Obtener información del criadero
      const criaderoInfo = await this.repository.getCriaderoInfo(criaderoId);
      if (!criaderoInfo) {
        return {
          success: false,
          error: 'CRIADERO_NOT_FOUND',
          message: 'El criadero no existe',
        };
      }

      // Idempotencia: si ya está completado, retornar éxito
      if (criaderoInfo.onboardingCompletado === 1) {
        return {
          success: true,
          data: {
            criaderoId,
            onboardingCompletado: true,
            alreadyCompleted: true,
          },
        };
      }

      // Validar campos obligatorios del criadero
      const missingFields: string[] = [];

      if (!criaderoInfo.nombre || criaderoInfo.nombre.trim() === '') {
        missingFields.push('nombre');
      }
      if (!criaderoInfo.pais || criaderoInfo.pais.trim() === '') {
        missingFields.push('pais');
      }
      if (!criaderoInfo.provincia || criaderoInfo.provincia.trim() === '') {
        missingFields.push('provincia');
      }
      if (!criaderoInfo.ciudad || criaderoInfo.ciudad.trim() === '') {
        missingFields.push('ciudad');
      }
      if (!criaderoInfo.telefono || criaderoInfo.telefono.trim() === '') {
        missingFields.push('telefono');
      }
      if (!criaderoInfo.correoContacto || criaderoInfo.correoContacto.trim() === '') {
        missingFields.push('correoContacto');
      }

      if (missingFields.length > 0) {
        return {
          success: false,
          error: 'ONBOARDING_INCOMPLETE',
          message: 'El onboarding no puede completarse',
          missingFields,
        };
      }

      // Obtener configuración del criadero
      const configuracion = await this.repository.getCriaderoConfiguracion(criaderoId);
      if (!configuracion) {
        return {
          success: false,
          error: 'CRIADERO_CONFIGURATION_MISSING',
          message: 'No existe configuración para este criadero',
        };
      }

      // Validar que todos los campos de configuración estén configurados
      if (!configuracion.especiePrincipalItemId) {
        missingFields.push('especiePrincipalItemId');
      }
      if (!configuracion.razaPrincipalItemId) {
        missingFields.push('razaPrincipalItemId');
      }
      if (!configuracion.tipoCriaderoItemId) {
        missingFields.push('tipoCriaderoItemId');
      }
      if (!configuracion.finalidadItemId) {
        missingFields.push('finalidadItemId');
      }

      if (missingFields.length > 0) {
        return {
          success: false,
          error: 'ONBOARDING_INCOMPLETE',
          message: 'El onboarding no puede completarse',
          missingFields,
        };
      }

      // Validar los catalogo_items seleccionados (reutilizar lógica existente)
      const itemIds = [
        configuracion.especiePrincipalItemId!,
        configuracion.razaPrincipalItemId!,
        configuracion.tipoCriaderoItemId!,
        configuracion.finalidadItemId!,
      ];

      const itemsInfo = await this.repository.getCatalogoItemsInfo(itemIds);

      // Validar que existan todos los items
      const missingItems = itemIds.filter(id => !itemsInfo.has(id));
      if (missingItems.length > 0) {
        return {
          success: false,
          error: 'ONBOARDING_INCOMPLETE',
          message: 'El onboarding no puede completarse',
          missingFields: missingItems,
        };
      }

      // Validar que todos los items pertenezcan al mismo criadero
      const especieItem = itemsInfo.get(configuracion.especiePrincipalItemId!)!;
      const razaItem = itemsInfo.get(configuracion.razaPrincipalItemId!)!;
      const tipoItem = itemsInfo.get(configuracion.tipoCriaderoItemId!)!;
      const finalidadItem = itemsInfo.get(configuracion.finalidadItemId!)!;

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
          itemId: configuracion.especiePrincipalItemId!,
          expectedCatalog: 'ESPECIES',
          field: 'especiePrincipalItemId',
        },
        {
          itemId: configuracion.razaPrincipalItemId!,
          expectedCatalog: 'RAZAS',
          field: 'razaPrincipalItemId',
        },
        {
          itemId: configuracion.tipoCriaderoItemId!,
          expectedCatalog: 'TIPOS_CRIADERO',
          field: 'tipoCriaderoItemId',
        },
        {
          itemId: configuracion.finalidadItemId!,
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

      // Completar onboarding
      const result = await this.repository.completeOnboarding(criaderoId, criaderoInfo.version);

      if (!result.success) {
        return {
          success: false,
          error: 'CRIADERO_CONCURRENCY_CONFLICT',
          message: 'El criadero fue modificado por otra operación. Intente nuevamente.',
        };
      }

      return {
        success: true,
        data: {
          criaderoId,
          onboardingCompletado: true,
          alreadyCompleted: false,
        },
      };
    } catch (error) {
      console.error('Error al completar onboarding:', error);
      return {
        success: false,
        error: 'INTERNAL_ERROR',
        message: 'Error al completar el onboarding',
      };
    }
  }

  async getOnboardingStatus(criaderoId: string): Promise<OnboardingStatusResponse | ErrorResponse> {
    if (!criaderoId) {
      return {
        success: false,
        error: 'VALIDATION_ERROR',
        message: 'criaderoId es requerido',
      };
    }

    try {
      // Obtener información del criadero (ya verifica deleted_at IS NULL)
      const criaderoInfo = await this.repository.getCriaderoInfo(criaderoId);
      if (!criaderoInfo) {
        return {
          success: false,
          error: 'CRIADERO_NOT_FOUND',
          message: 'El criadero no existe',
        };
      }

      // Obtener configuración del criadero
      const configuracion = await this.repository.getCriaderoConfiguracion(criaderoId);

      // Determinar estado del onboarding
      const onboardingCompletado = criaderoInfo.onboardingCompletado === 1;

      // Si ya está completado, no necesitamos evaluar más
      if (onboardingCompletado) {
        return {
          success: true,
          data: {
            criaderoId,
            onboardingCompletado: true,
            status: 'COMPLETED',
            currentStep: null,
            missingFields: [],
            generalData: {
              nombre: criaderoInfo.nombre,
              pais: criaderoInfo.pais,
              provincia: criaderoInfo.provincia,
              ciudad: criaderoInfo.ciudad,
              telefono: criaderoInfo.telefono,
              correoContacto: criaderoInfo.correoContacto,
            },
            configuration: {
              especiePrincipalItemId: configuracion?.especiePrincipalItemId ?? null,
              razaPrincipalItemId: configuracion?.razaPrincipalItemId ?? null,
              tipoCriaderoItemId: configuracion?.tipoCriaderoItemId ?? null,
              finalidadItemId: configuracion?.finalidadItemId ?? null,
            },
          },
        };
      }

      // Validar campos generales
      const missingFields: string[] = [];

      if (!criaderoInfo.nombre || criaderoInfo.nombre.trim() === '') {
        missingFields.push('nombre');
      }
      if (!criaderoInfo.pais || criaderoInfo.pais.trim() === '') {
        missingFields.push('pais');
      }
      if (!criaderoInfo.provincia || criaderoInfo.provincia.trim() === '') {
        missingFields.push('provincia');
      }
      if (!criaderoInfo.ciudad || criaderoInfo.ciudad.trim() === '') {
        missingFields.push('ciudad');
      }
      if (!criaderoInfo.telefono || criaderoInfo.telefono.trim() === '') {
        missingFields.push('telefono');
      }
      if (!criaderoInfo.correoContacto || criaderoInfo.correoContacto.trim() === '') {
        missingFields.push('correoContacto');
      }

      // Si faltan datos generales
      if (missingFields.length > 0) {
        return {
          success: true,
          data: {
            criaderoId,
            onboardingCompletado: false,
            status: 'INCOMPLETE_GENERAL',
            currentStep: 1,
            missingFields,
            generalData: {
              nombre: criaderoInfo.nombre,
              pais: criaderoInfo.pais,
              provincia: criaderoInfo.provincia,
              ciudad: criaderoInfo.ciudad,
              telefono: criaderoInfo.telefono,
              correoContacto: criaderoInfo.correoContacto,
            },
            configuration: {
              especiePrincipalItemId: configuracion?.especiePrincipalItemId ?? null,
              razaPrincipalItemId: configuracion?.razaPrincipalItemId ?? null,
              tipoCriaderoItemId: configuracion?.tipoCriaderoItemId ?? null,
              finalidadItemId: configuracion?.finalidadItemId ?? null,
            },
          },
        };
      }

      // Datos generales completos, validar configuración
      if (!configuracion) {
        // No existe configuración
        return {
          success: true,
          data: {
            criaderoId,
            onboardingCompletado: false,
            status: 'INCOMPLETE_CONFIGURATION',
            currentStep: 2,
            missingFields: ['especiePrincipalItemId', 'razaPrincipalItemId', 'tipoCriaderoItemId', 'finalidadItemId'],
            generalData: {
              nombre: criaderoInfo.nombre,
              pais: criaderoInfo.pais,
              provincia: criaderoInfo.provincia,
              ciudad: criaderoInfo.ciudad,
              telefono: criaderoInfo.telefono,
              correoContacto: criaderoInfo.correoContacto,
            },
            configuration: {
              especiePrincipalItemId: null,
              razaPrincipalItemId: null,
              tipoCriaderoItemId: null,
              finalidadItemId: null,
            },
          },
        };
      }

      // Validar campos de configuración
      if (!configuracion.especiePrincipalItemId) {
        missingFields.push('especiePrincipalItemId');
      }
      if (!configuracion.razaPrincipalItemId) {
        missingFields.push('razaPrincipalItemId');
      }
      if (!configuracion.tipoCriaderoItemId) {
        missingFields.push('tipoCriaderoItemId');
      }
      if (!configuracion.finalidadItemId) {
        missingFields.push('finalidadItemId');
      }

      // Si faltan campos de configuración
      if (missingFields.length > 0) {
        return {
          success: true,
          data: {
            criaderoId,
            onboardingCompletado: false,
            status: 'INCOMPLETE_CONFIGURATION',
            currentStep: 2,
            missingFields,
            generalData: {
              nombre: criaderoInfo.nombre,
              pais: criaderoInfo.pais,
              provincia: criaderoInfo.provincia,
              ciudad: criaderoInfo.ciudad,
              telefono: criaderoInfo.telefono,
              correoContacto: criaderoInfo.correoContacto,
            },
            configuration: {
              especiePrincipalItemId: configuracion.especiePrincipalItemId,
              razaPrincipalItemId: configuracion.razaPrincipalItemId,
              tipoCriaderoItemId: configuracion.tipoCriaderoItemId,
              finalidadItemId: configuracion.finalidadItemId,
            },
          },
        };
      }

      // Todo completo, listo para finalizar
      return {
        success: true,
        data: {
          criaderoId,
          onboardingCompletado: false,
          status: 'READY_TO_COMPLETE',
          currentStep: 3,
          missingFields: [],
          generalData: {
            nombre: criaderoInfo.nombre,
            pais: criaderoInfo.pais,
            provincia: criaderoInfo.provincia,
            ciudad: criaderoInfo.ciudad,
            telefono: criaderoInfo.telefono,
            correoContacto: criaderoInfo.correoContacto,
          },
          configuration: {
            especiePrincipalItemId: configuracion.especiePrincipalItemId,
            razaPrincipalItemId: configuracion.razaPrincipalItemId,
            tipoCriaderoItemId: configuracion.tipoCriaderoItemId,
            finalidadItemId: configuracion.finalidadItemId,
          },
        },
      };
    } catch (error) {
      console.error('Error al obtener estado del onboarding:', error);
      return {
        success: false,
        error: 'INTERNAL_ERROR',
        message: 'Error al obtener el estado del onboarding',
      };
    }
  }
}
