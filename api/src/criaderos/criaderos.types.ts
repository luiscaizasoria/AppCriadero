/**
 * Tipos para el módulo de Criaderos
 */

export interface CreateCriaderoRequest {
  userId: string;
  nombre: string;
  descripcion?: string | null;
  pais: string;
  provincia: string;
  ciudad: string;
  direccion?: string | null;
  telefono: string;
  correoContacto: string;
}

export interface CriaderoResponse {
  id: string;
  userId: string;
  nombre: string;
  descripcion: string | null;
  pais: string;
  provincia: string;
  ciudad: string;
  direccion: string | null;
  telefono: string;
  correoContacto: string;
  logoUri: string | null;
  onboardingCompletado: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateCriaderoResponse {
  success: true;
  data: {
    id: string;
    userId: string;
    nombre: string;
    onboardingCompletado: boolean;
    catalogoItemsGenerados: number;
  };
}

export interface ErrorResponse {
  success: false;
  error: string;
  message: string;
}
