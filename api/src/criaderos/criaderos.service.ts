/**
 * Service para lógica de negocio de Criaderos
 */

import { DEFAULT_CATALOG_ITEMS, DefaultCatalogItem } from '../catalogs/defaultCatalogItems';
import type { CriaderoRepository } from './criaderos.repository';
import type { CreateCriaderoRequest, CreateCriaderoResponse, ErrorResponse } from './criaderos.types';
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
}
