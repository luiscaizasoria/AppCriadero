/** Fila unica del resumen (aves, salud, finanzas, jaulas y huevos). Todos los conteos son enteros. */
export interface FilaResumenInicio {
  activas: number;
  vendidas: number;
  fallecidas: number;
  sanas: number;
  tratamiento: number;
  enfermas: number;
  ingresos: number | null;
  egresos: number | null;
  total: number;
  ocupadas: number;
  hoy: number;
  mes: number;
  promedio: number | null;
}

export interface FilaMejorPonedora {
  codigo: string;
  cantidad: number;
}

/** `hora` es texto de 2 digitos, o null si la fecha no es interpretable. */
export interface FilaHoraPico {
  hora: string | null;
  cantidad: number;
}

/** `dia` es null solo con una fecha no interpretable que pase el filtro textual. */
export interface FilaProduccionDia {
  dia: string | null;
  cantidad: number;
}

export interface FilaAvesPorRaza {
  raza: string;
  cantidad: number;
  porcentaje: number | null;
}

/** Objeto del dashboard: claves y orden de DashboardRepository.js de V1. */
export interface Dashboard {
  aves: { activas: number; vendidas: number; fallecidas: number };
  salud: { sanas: number; tratamiento: number; enfermas: number };
  finanzas: { ingresos: number; egresos: number; utilidad: number };
  jaulas: { total: number; ocupadas: number };
  ocupacionJaulas: { porcentaje: number };
  huevos: { hoy: number; mes: number };
  mejorPonedora: FilaMejorPonedora | null;
  horaPico: FilaHoraPico | null;
  produccionSemana: FilaProduccionDia[];
  avesPorRaza: FilaAvesPorRaza[];
  totalRazas: number;
  promedioHuevos: number;
}

export interface Resultado<T> {
  success: true;
  data: T;
}
