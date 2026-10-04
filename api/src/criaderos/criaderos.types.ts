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

export type OnboardingStatus =
  | 'INCOMPLETE_GENERAL'
  | 'INCOMPLETE_CONFIGURATION'
  | 'READY_TO_COMPLETE'
  | 'COMPLETED';

export interface OnboardingStatusResponse {
  success: true;
  data: {
    criaderoId: string;
    onboardingCompletado: boolean;
    status: OnboardingStatus;
    currentStep: number | null;
    missingFields: string[];
    generalData: {
      nombre: string | null;
      pais: string | null;
      provincia: string | null;
      ciudad: string | null;
      telefono: string | null;
      correoContacto: string | null;
    };
    configuration: {
      especiePrincipalItemId: string | null;
      razaPrincipalItemId: string | null;
      tipoCriaderoItemId: string | null;
      finalidadItemId: string | null;
    };
  };
}

export interface ErrorResponse {
  success: false;
  error: string;
  message: string;
  missingFields?: string[];
}
