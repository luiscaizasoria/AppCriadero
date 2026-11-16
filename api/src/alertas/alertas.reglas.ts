/**
 * Regla de la alerta de Salud (excepcion aprobada a la paridad con V1, documents/specs/alertas-del-dia.md).
 * Un ave ACTIVA y EN_TRATAMIENTO alerta SOLO el dia calendario UTC en que
 * date(fecha_ultimo_control_salud, '+N days') = date(ahora). No vuelve los dias siguientes.
 * Cambiar el plazo o la regla exige tocar solo este archivo (y SQL_SALUD si cambia la comparacion).
 */
export const DIAS_PLAZO_CONTROL_SALUD = 7;

/** Modificador de date() de SQLite; se pasa como parametro `?` de SQL_SALUD. */
export function modificadorPlazoSalud(): string {
  return `+${DIAS_PLAZO_CONTROL_SALUD} days`;
}
