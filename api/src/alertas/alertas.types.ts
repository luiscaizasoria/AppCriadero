/** Alerta calculada (solo lectura). Claves y orden de V1; todas presentes, con null real. */
export interface Alerta {
  tipo: 'SALUD' | 'JAULA' | 'PRODUCCION' | 'FINANZAS';
  nivel: 'ALTO' | 'MEDIO';
  titulo: string;
  mensaje: string;
  entidadId: string | null;
  accion: string | null;
  accionDestino: string | null;
}

export interface AlertasData {
  alertas: Alerta[];
}

export interface Resultado<T> {
  success: true;
  data: T;
}

/** Fila de aves en tratamiento; `dias` sale de julianday (puede ser null si la fecha no es interpretable). */
export interface FilaSaludAlerta {
  id: string;
  codigo: string;
  dias: number | null;
}

/** Jaula activa con sus dos banderas (0/1) de "sin registro hoy". */
export interface FilaJaulaAlerta {
  id: string;
  codigo: string;
  sin_alimentacion: number;
  sin_bebida: number;
}

export interface TotalesMes {
  ingresos: number | null;
  egresos: number | null;
}
