---
paths:
  - "src/**"
  - "App.js"
  - "index.js"
  - "app.json"
  - "eas.json"
---

# Aplicación móvil V1 (congelada)

La V1 es la referencia funcional de V2. Solo se modifica si la tarea lo pide expresamente.

- No eliminar ni reescribir V1 hasta que los endpoints V2 equivalentes estén construidos y validados. La migración es repositorio por repositorio, no en un solo cambio.
- Áreas críticas: `src/database/sqlite.js`, `src/database/migration*.js`, `src/database/seeders.js`, `src/repositories/BackupRepository.js`, servicios de imágenes, navegación y `app.json`.
- SQLite local: nunca editar una migración histórica; todo cambio nuevo es una migración nueva y debe ser compatible con bases existentes.
- Navegación: los tabs raíz son Inicio, Jaulas (`ListaJaulas`), Aves (`ListaAves`), Finanzas y Más; no romper ese comportamiento.
- Backup e imágenes: no asumir que una `foto_uri` implica que el archivo exista; las imágenes restauradas pasan a ser imágenes normales; un backup nuevo incluye nuevas y restauradas.
- Mantener separación screens / repositories / services / database.
- No hay lógica de sincronización en el alcance: no añadirla.
- Tras cambios, indicar qué debe probarse manualmente en Android.
- Para diseñar un endpoint V2 a partir de V1, leer la pantalla y el repositorio V1 correspondientes y la spec en `documents/specs/`.
