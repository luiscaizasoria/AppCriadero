---
paths:
  - "documents/specs/**"
---

# Especificaciones por módulo

- Toda spec sigue `documents/specs/_plantilla.md` (Estado, Fuente V1, Comportamiento en V1, Contrato del repositorio V1, Validaciones en pantalla, Paridad con V1, Diferencias deliberadas, Endpoints V2, Modelo D1, Reglas abiertas, Criterios de terminado).
- **Paridad con V1:** V2 empieza sin datos de usuario, solo con catálogos, y reproduce exactamente lo que hace V1 (probada). Todo lo distinto es una "diferencia deliberada": se registra en la spec y la aprueba el usuario. Ya aceptadas: V2 requiere conexión y las pantallas necesitan estados de carga y de error de red. No inventar mejoras ni "arreglos" sin registrarlos como diferencia propuesta.
- Se redacta desde el **código real de V1** (pantallas en `src/screens/`, repositorios en `src/repositories/`, esquema en `src/database/`), citando `archivo:línea`. El handoff y el cierre son contexto, no sustituyen al código.
- Búsquedas de "nunca se escribe/usa" sin límite de resultados; si el código del árbol actual no explica un comportamiento que el usuario afirma, revisar el historial de git (`git log -S`, tag `v1.0.3`) antes de concluir.
- Lo que no se pueda confirmar en el código se marca como **regla abierta**, separada en "Resolubles leyendo código" y "Decisión de producto"; nunca se inventa comportamiento, campos ni validaciones.
- El nombre del archivo es el del módulo en minúsculas (`aves.md`, `jaulas.md`).
- Estado inicial siempre `borrador`; pasa a `revisada` solo con aprobación del usuario y a `implementada` cuando se cumplan los criterios de terminado.
- Respetar el alcance: aves individuales, sin lotes, sin sincronización offline, D1/R2 como fuente de verdad.
- No incluir secretos ni datos reales de clientes.
