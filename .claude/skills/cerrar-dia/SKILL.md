---
name: cerrar-dia
description: Registra la sesión en la bitácora y actualiza el estado actual con el agente seguimiento-proyecto. Úsala al terminar una sesión o un módulo.
disable-model-invocation: true
---

# Cerrar el día

1. Lanza el agente `seguimiento-proyecto` con esta orden: "Añade la entrada de la sesión de hoy a `documents/bitacora.md` (arriba, máximo 15 líneas) y actualiza `documents/estado-actual.md`. Usa `git log` y `git status` para los hechos y los hashes; resume las decisiones tomadas en esta conversación con su motivo: [lista aquí lo hecho, decidido y pendiente en la sesión]".
2. Comprueba que el agente solo tocó esos dos archivos (`git status --short`).
3. Devuelve al usuario un resumen de 5 líneas: entrada añadida, estado actualizado, pendiente y siguiente paso.
4. No hagas commit salvo que el usuario lo pida.
