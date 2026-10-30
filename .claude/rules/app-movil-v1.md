---
paths:
  - "src/**"
  - "App.js"
  - "index.js"
  - "app.json"
  - "eas.json"
---

# Aplicación móvil V1

La app V1 es la referencia funcional y el contrato de V2: conserva pantallas, lógica y comportamiento; solo cambia dónde guarda los datos. Cada repositorio (`src/repositories/`) se reemplazará, uno por uno, por un cliente REST con la misma interfaz. Solo se modifica `src/` cuando la tarea lo pide expresamente (ver la skill `migrar-repositorio-a-api`).

## Reglas de desarrollo

- No eliminar ni reescribir V1 hasta que los endpoints V2 equivalentes estén construidos y validados. La migración es repositorio por repositorio, no en un solo cambio.
- No eliminar funcionalidades existentes para simplificar una solución; no reemplazar archivos completos con versiones parciales.
- Antes de modificar una funcionalidad, revisar todos los archivos relacionados. Mantener separación screens / repositories / services / database.
- No hay lógica de sincronización en el alcance: no añadirla.
- El código real tiene prioridad sobre la documentación si hay diferencias.

## Áreas críticas

`src/database/sqlite.js`, `src/database/migration*.js`, `src/database/seeders.js`, `src/repositories/BackupRepository.js`, servicios de imágenes, navegación y `app.json`.

## SQLite local (solo la app V1)

- Nunca editar una migración histórica; todo cambio nuevo es una migración nueva (si la versión actual es V7, el siguiente cambio es V8) y debe ser compatible con bases existentes.
- Las instalaciones limpias y las actualizadas deben terminar con el mismo esquema, sin perder datos.
- Estas reglas (V7 → V8) aplican **solo a `src/`**; las migraciones del backend están en `api/migrations/` (ver la regla `api-migraciones-d1`).

## Navegación

Los tabs raíz son cinco (`AppNavigator.js`): Inicio → `InicioScreen`, Jaulas → `ListaJaulas`, Aves → `ListaAves`, Finanzas → pantalla principal de Finanzas y Más → pantalla principal de Más. No romper ese comportamiento.

## Backup e imágenes

- No asumir que una `foto_uri` implica que el archivo exista.
- Preservar la restauración de SQLite ya validada y la compatibilidad con respaldos anteriores cuando sea posible.
- Las imágenes restauradas pasan a ser imágenes normales de la instalación actual; un backup nuevo incluye imágenes nuevas y restauradas.

## Antes y después de programar

- Antes (cambios medianos o grandes): localizar archivos afectados, explicar el funcionamiento actual, identificar tablas, navegación y riesgo sobre datos existentes, proponer el cambio mínimo y programar solo después del análisis.
- Después: revisar el diff, ejecutar las validaciones disponibles (compilar no equivale a funcionar) e indicar qué debe probarse manualmente en Android.
