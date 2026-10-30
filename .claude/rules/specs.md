---
paths:
  - "documents/specs/**"
---

# Especificaciones por módulo

- Toda spec sigue `documents/specs/plantilla-spec.md` (ligera): Estado, Fuente V1, Contrato del repositorio, Endpoints V2, Tabla D1, Excepciones técnicas por pasar a online y Casos de paridad.
- **Regla del proyecto (2026-10-29):** la app V1 conserva pantallas, lógica y comportamiento; solo cambia dónde guarda los datos (SQLite local → API en la nube con D1 + R2 y login). Cada repositorio V1 se reemplaza por un cliente REST con la misma interfaz (mismos nombres de función, mismo objeto devuelto, mismos errores). Por defecto se replica V1 tal cual.
- Solo se permiten diferencias que exija el paso a online: IDs UUID v7, `criadero_id`, imágenes en R2, autenticación y errores de red. Se anotan en "Excepciones técnicas". No se proponen validaciones, límites ni rechazos nuevos en el servidor: si V1 no lo hacía, V2 tampoco. Se conservan los códigos y mensajes de error de V1.
- Se redacta desde el **código real de V1** (pantallas en `src/screens/`, repositorios en `src/repositories/`, esquema en `src/database/`), citando `archivo:línea`. Los documentos de `documents/traspaso/` (solo local) son contexto, no sustituyen al código.
- Búsquedas de "nunca se escribe/usa" sin límite de resultados; si el código del árbol actual no explica un comportamiento que afirma el usuario, revisar el historial de git (`git log -S`, tag `v1.0.3`) antes de concluir.
- Lo que no se pueda confirmar en el código se anota como duda técnica; nunca se inventa comportamiento, campos ni validaciones.
- El nombre del archivo es el del módulo en minúsculas (`aves.md`, `jaulas.md`).
- Estado inicial siempre `borrador`; pasa a `revisada` solo con aprobación del usuario y a `implementada` cuando se cumplan los casos de paridad.
- Alcance: aves individuales, sin lotes, sin sincronización offline, D1/R2 como fuente de verdad.
- No incluir secretos ni datos reales de clientes.
