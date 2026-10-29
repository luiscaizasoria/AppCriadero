---
name: nuevo-modulo-api
description: Implementa un módulo nuevo del backend V2 (aves, jaulas, huevos, etc.) siguiendo routes -> factory -> service -> repository. Úsala cuando se pida crear o migrar un módulo de V1 a la API.
disable-model-invocation: true
argument-hint: "[módulo]"
---

# Nuevo módulo de la API: $ARGUMENTS

1. **Spec primero.** Lee `documents/specs/$ARGUMENTS.md`. Si no existe, no empieces a programar: pide al agente `analista-v1` que la redacte desde el código real de V1 con `documents/specs/_plantilla.md`, y espera la aprobación del usuario (estado `revisada`).
2. **Contexto.** `git status --short`; revisa `api/src/criaderos/` como patrón de referencia y la sección correspondiente del handoff (`documents/traspaso/CLAUDE_PROJECT_HANDOFF_CRIADERO_KIKIRIKIS.md`, secciones 16-21).
3. **Análisis de impacto** (explícalo antes de editar): archivos a crear/modificar, tablas D1 nuevas, FK con otros módulos, riesgo sobre datos y endpoints.
4. **Migración.** Si hay tablas nuevas, crea `api/migrations/NNNN_*.sql` (siguiente número libre, nunca editar las aplicadas). Delega el diseño en `modelador-d1` si es complejo.
5. **Implementa** en `api/src/<modulo>/` el patrón:
   - `<modulo>.types.ts`
   - `<modulo>.repository.ts` (SQL, prepared statements, `batch` para atomicidad)
   - `<modulo>.service.ts` (reglas de negocio, sin Hono)
   - `<modulo>.factory.ts`
   - `<modulo>.routes.ts` (JWT, ownership, mapeo de errores)
   y registra el router en `api/src/app.ts`. Rutas bajo `/api/v1/criaderos/:criaderoId/…`.
6. **Pruebas** con el estilo del proyecto (`debe …`): service con fake repository en `api/test/helpers/`, HTTP con `app.request()` e integración D1 local en `api/test/integration/`.
7. **Verifica** con la skill `verificar-api` y reporta qué quedó sin validar.

Límites: aves individuales, sin lotes, sin sincronización offline; D1/R2 como fuente de verdad. Sin commit, push ni deploy.
