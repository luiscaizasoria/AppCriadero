---
name: migrar-repositorio-a-api
description: Migra un repositorio de la app V1 (SQLite) a la API V2 y a un cliente REST con la misma interfaz, sin cambiar las pantallas. Úsala al pasar un módulo de V1 a la nube.
disable-model-invocation: true
argument-hint: "[módulo]"
---

# Migrar el repositorio V1 a la API: $ARGUMENTS

Objetivo: la app V1 conserva pantallas, lógica y comportamiento; solo cambia dónde guarda los datos (de SQLite local a la API en la nube: D1 + R2, con login). Por defecto se replica V1 tal cual. Solo se permiten las diferencias que exija el paso a online: IDs UUID v7, `criadero_id`, imágenes en R2, autenticación y errores de red. Si V1 no lo hacía, V2 tampoco; se conservan los códigos y mensajes de error de V1.

1. **Spec y repositorio V1.** Lee `documents/specs/$ARGUMENTS.md` y el repositorio V1 (`src/repositories/`) con las pantallas que lo usan. Si no hay spec, pide al agente `analista-codigo-v1` que la redacte con `documents/specs/plantilla-spec.md` y espera la aprobación del usuario.
2. **Endpoints y tabla D1 equivalentes.** Un endpoint por función del repositorio y las tablas de V1 con las columnas técnicas (`id` UUID v7, `criadero_id`, `created_at`, `updated_at`). Migración nueva `api/migrations/NNNN_*.sql` (nunca editar las aplicadas; orden: `0005` jaulas, `0006` aves e historiales). Delega el diseño en `disenador-migraciones-d1` si es complejo.
3. **Implementa en `api/`** siguiendo `routes -> factory -> service -> repository` (patrón de `api/src/criaderos/`) y registra el router en `api/src/app.ts`. Ownership por criadero.
4. **Cliente REST para la app** con la MISMA interfaz que el repositorio V1: mismos nombres de función, mismo objeto devuelto (mismos campos) y mismos errores (mismo texto de `Error`), de modo que las pantallas no cambien. Se sustituye solo la capa de datos del repositorio.
5. **Pruebas:** unitarias de service con fakes, HTTP con `app.request()` e integración D1 local (`api/test/integration/`, con confirmación del usuario porque borra datos locales), más las **pruebas de paridad con V1** de la sección "Casos de paridad" de la spec.
6. **La app sigue funcionando sin cambios en pantallas.** Revisa con `git diff` que no cambió ninguna pantalla y verifica con la skill `verificar-api`. Indica qué debe probarse manualmente en Android.

Límites: aves individuales, sin lotes, sin sincronización offline; D1/R2 como fuente de verdad. Sin commit, push ni deploy sin orden expresa.
