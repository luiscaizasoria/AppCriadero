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

export interface UpdateConfiguracionRequest {
  especiePrincipalItemId: string;
  razaPrincipalItemId: string;
  tipoCriaderoItemId: string;
  finalidadItemId: string;
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

export interface UpdateConfiguracionResponse {
  success: true;
  data: {
    criaderoId: string;
    especiePrincipalItemId: string;
    razaPrincipalItemId: string;
    tipoCriaderoItemId: string;
    finalidadItemId: string;
    onboardingCompletado: false;
  };
}

export interface CompleteOnboardingResponse {
  success: true;
  data: {
    criaderoId: string;
    onboardingCompletado: true;
    alreadyCompleted: boolean;
  };
}

export interface OnboardingIncompleteErrorResponse {
  success: false;
  error: 'ONBOARDING_INCOMPLETE';
  message: string;
  missingFields: string[];
}

export interface ErrorResponse {
  success: false;
  error: string;
  message: string;
  missingFields?: string[];
}
