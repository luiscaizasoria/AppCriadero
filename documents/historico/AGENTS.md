# Reglas del proyecto Criadero Kikirikis

> **Fuente principal: `CLAUDE.md`** (raíz del repositorio). Este archivo se conserva de la V1 móvil; sus reglas de SQLite, navegación, backup e imágenes aplican a la app móvil (`src/`). En caso de conflicto con `CLAUDE.md` (arquitectura online-first, backend `api/`), prevalece `CLAUDE.md`.

## Contexto obligatorio

Leer solo el contexto necesario para la tarea:

- `CLAUDE.md` y `documents/README.md` para el estado, las decisiones online-first y el orden de autoridad de la documentación.
- `documents/V1_BASELINE.md` para conocer las funciones y restricciones existentes.
- `documents/V2_ARCHITECTURA.md` para decisiones técnicas de V2.
- `documents/V2_ROADMAP.md` para conocer la etapa y el orden de trabajo.

Consultar `documents/archive/` solo cuando se solicite expresamente o cuando falte un detalle necesario en los documentos activos. Si la tarea afecta un módulo, revisar los archivos relacionados con ese módulo sin analizar todo el repositorio.

El código real tiene prioridad sobre la documentación si existen diferencias.

## Reglas para V2

- Respetar las decisiones fijadas en `documents/V2_ARCHITECTURA.md`; no rediseñar el stack en cada tarea.
- Mantener el funcionamiento local y la compatibilidad de datos de V1 durante la transición: la app móvil conserva su SQLite local hasta que cada módulo se reemplace por su cliente REST (V2 es online-first; D1 y R2 son la fuente de verdad).
- Trabajar por etapas según `documents/V2_ROADMAP.md`.
- No implementar sincronización SQLite ↔ D1, cola offline ni resolución de conflictos: están fuera de alcance (decisión online-first, ver `CLAUDE.md`).
- No incluir secretos en Git.

## Reglas de desarrollo

- No modificar migraciones antiguas ya aplicadas.
- Toda modificación nueva de SQLite (app móvil V1) debe crear una nueva migración. Los cambios de D1 van en `api/migrations/` (ver `CLAUDE.md`).
- Mantener compatibilidad con bases existentes.
- No eliminar funcionalidades existentes para simplificar una solución.
- No reemplazar archivos completos con versiones parciales.
- Antes de modificar una funcionalidad, revisar todos los archivos relacionados.
- Analizar impacto antes de programar.
- Mantener separación entre screens, repositories, services y database.

## Áreas críticas

Tratar con especial cuidado:

- `src/database/sqlite.js`
- `src/database/migration*.js`
- `src/database/seeders.js`
- `src/repositories/BackupRepository.js`
- servicios de imágenes
- navegación
- `app.json`

## SQLite

- Nunca editar una migración histórica para agregar cambios nuevos.
- Si la versión actual es V7, el siguiente cambio debe ser V8. Estas reglas de SQLite (V7 → V8) aplican **solo a la app móvil V1**; el backend usa D1 con migraciones `0001`–`0004` en `api/migrations/` (la siguiente es `0005`).
- Las instalaciones existentes deben poder migrar sin perder datos.
- Las instalaciones limpias y actualizadas deben terminar con el mismo esquema.

## Navegación

Los tabs principales son cinco puntos de entrada raíz (`AppNavigator.js` define Inicio, Jaulas, Aves, Finanzas y Más):

- Inicio → `InicioScreen`
- Jaulas → `ListaJaulas`
- Aves → `ListaAves`
- Finanzas → pantalla principal de Finanzas
- Más → pantalla principal de Más

No romper este comportamiento.

## Backup e imágenes

- Preservar la restauración de SQLite ya validada.
- Mantener compatibilidad con respaldos anteriores cuando sea posible.
- No asumir que una `foto_uri` implica que el archivo físico exista.
- Las imágenes restauradas deben pasar a ser imágenes normales de la instalación actual.
- Un nuevo backup debe incluir tanto imágenes nuevas como restauradas.

## Antes de programar

Para cambios medianos o grandes:

1. localizar los archivos afectados;
2. explicar el funcionamiento actual;
3. identificar tablas involucradas;
4. identificar navegación afectada;
5. identificar riesgo sobre datos existentes;
6. proponer el cambio mínimo;
7. programar solo después del análisis.

## Después de programar

- Revisar diff.
- Ejecutar las validaciones disponibles.
- No asumir que compilar equivale a funcionar.
- Indicar qué debe probarse manualmente en Android.
