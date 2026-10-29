---
paths:
  - "documents/specs/**"
---

# Especificaciones por módulo

- Toda spec sigue `documents/specs/_plantilla.md` (Estado, Fuente V1, Comportamiento en V1, Endpoints V2, Modelo D1, Reglas abiertas, Criterios de terminado).
- Se redacta desde el **código real de V1** (pantallas en `src/screens/`, repositorios en `src/repositories/`, esquema en `src/database/`), citando archivos y funciones. El handoff y el cierre son contexto, no sustituyen al código.
- Lo que no se pueda confirmar en el código se marca como **regla abierta**; nunca se inventa comportamiento, campos ni validaciones.
- El nombre del archivo es el del módulo en minúsculas (`aves.md`, `jaulas.md`).
- Estado inicial siempre `borrador`; pasa a `revisada` solo con aprobación del usuario y a `implementada` cuando se cumplan los criterios de terminado.
- Respetar el alcance: aves individuales, sin lotes, sin sincronización offline, D1/R2 como fuente de verdad.
- No incluir secretos ni datos reales de clientes.
