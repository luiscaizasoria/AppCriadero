# Criadero Kikirikis

App móvil (React Native + Expo, V1 local con SQLite) en evolución a V2 **online-first**: backend en `api/` con TypeScript, Cloudflare Workers, Hono y D1. Idioma de trabajo: español.

## Estado actual

- `src/`, `App.js`, `app.json`: app móvil V1 (v1.0.3), funcional y local. Es la **referencia funcional**; no se reescribe ni se elimina hasta que existan y se validen los endpoints V2 equivalentes.
- `api/`: backend V2. Implementado: `GET /api/v1/health`, `POST /api/v1/auth/register`, `POST /api/v1/auth/login`, `POST /api/v1/criaderos`, `PUT /api/v1/criaderos/:criaderoId/configuracion`, `POST /api/v1/criaderos/:criaderoId/onboarding/complete`, `GET /api/v1/criaderos/:criaderoId/onboarding`.
- Pendiente (no asumir que existe): Google Sign-In, `/auth/me`, refresh token, listado/selección de criaderos, R2, y todos los módulos de negocio (aves, jaulas, huevos, salud, finanzas…).
- Migraciones D1 aplicadas: `0001` a `0004` en `api/migrations/`.

## Decisiones vigentes (online-first)

- Escritura y lectura: app → API → D1/R2 → respuesta → UI. **D1 es la fuente de verdad** de datos estructurados y **R2** de imágenes y archivos. D1 guarda `r2_object_key` y metadatos, nunca binarios.
- SQLite de V1 es legado y no gobierna el negocio de V2.
- Identidad: email/contraseña hoy; objetivo Google ID Token → `POST /api/v1/auth/google` → el backend emite **JWT propio** (HS256, `jose`, 3600 s). No usar el token de Google en las demás llamadas.
- Multi-tenancy: `users 1—N criaderos 1—N entidades`. Las entidades llevan `criadero_id`; no duplicar `user_id` (la propiedad se resuelve por `criaderos.user_id`). `userId` nunca viene en el body.
- Solo propietario del criadero; sin roles ni membresías por ahora.
- IDs `TEXT` con UUID v7; soft delete (`deleted_at`) y `version` para concurrencia optimista (`UPDATE … WHERE version = ?`).
- API versionada bajo `/api/v1`, JSON por HTTPS, sin .NET.

## Paridad con V1 (decisión vigente)

- V2 empieza **sin datos de usuario**, solo con catálogos. La V1 está probada y es el **contrato**: V2 reproduce exactamente lo que V1 hace (validaciones y mensajes, efectos en historial y otras tablas, errores).
- Todo lo que V2 haga distinto es una **diferencia deliberada**: se registra en la spec del módulo y la aprueba el usuario. Ya aceptadas: V2 requiere conexión y las pantallas necesitan estados de carga y de error de red.
- No hay importación de datos de V1 ni mapeo de IDs en el alcance actual.

## Fuera de alcance (no implementar sin orden expresa)

- Sincronización SQLite ↔ D1, cola offline, resolución de conflictos, motor offline-first.
- Lotes de aves, otras especies o producto agropecuario genérico: las aves son registros individuales.
- Roles, invitaciones, hard delete de aves (se usa baja), guardar imágenes en D1.
- Reintroducir `@cloudflare/vitest-plugin` / `vitest-pool-workers` (falló con `node:process`/workerd).
- Migrar toda la app móvil de una vez: se reemplaza repositorio por repositorio.

## Arquitectura del backend

```text
routes -> factory -> service -> repository -> D1
```

- **routes** (`*.routes.ts`): parsean parámetros y body, aplican middleware, obtienen el usuario, validan ownership y mapean errores a HTTP. Sin SQL ni lógica de negocio.
- **factory** (`*.factory.ts`): construye repositorio y servicio; permite inyectar fakes en tests.
- **service** (`*.service.ts`): reglas de negocio, idempotencia y concurrencia. No importa Hono.
- **repository** (`*.repository.ts`): SQL con prepared statements y `batch` para operaciones atómicas. Sin lógica HTTP.
- **types** (`*.types.ts`): contratos de request/response y errores.
- `api/src/app.ts` compone Hono y monta routers (inyectables en tests); `api/src/index.ts` exporta el Worker. Módulos existentes: `auth/`, `criaderos/`, `catalogs/`.
- Antes de consultar o modificar un recurso de un criadero, validar ownership (`criaderos.id = ? AND user_id = ? AND deleted_at IS NULL`); si no es propietario, `403 FORBIDDEN`. No filtrar datos de otro criadero.

## Comandos (ejecutar desde `api/`)

| Comando | Qué hace |
|---|---|
| `npm run dev` | `wrangler dev` (local, leer el puerto de `Ready on http://127.0.0.1:XXXX`; no asumir 8787/8788) |
| `npm run typecheck` | `tsc --noEmit` |
| `npm test` | `vitest --exclude test/integration/**` (unitarias y HTTP; usar `npm test -- --run` para una sola pasada) |
| `npm run test:integration` | `vitest --run test/integration` (D1 local con `better-sqlite3`) |
| `npm run deploy` | `wrangler deploy` — **solo con orden explícita** |

Validación antes de proponer un commit: `npm run typecheck`, `npm test -- --run`, `npm run test:integration` y `git diff --check`. Entorno validado: Node 22 (`nvm use 22`).

`test:integration` **borra datos** (`DELETE` en `users`, `criaderos`, `catalogo_items`, `criadero_configuracion`) del SQLite local de Wrangler (`.wrangler/state/v3/d1/…`, el hash cambia). Nunca apuntarlo a una base remota. Pide confirmación antes de ejecutarlo.

Migraciones locales: `npx wrangler d1 migrations apply criadero-kikirikis-dev --local`. Cualquier comando con `--remote` requiere autorización expresa.

## Convenciones de código

- TypeScript explícito; sin `any` salvo en fronteras de test/adaptadores justificadas (`type AppRouter = Hono<any, any, any>` es la excepción conocida).
- Dominio y campos en español; **API en camelCase**, **SQL en snake_case**.
- Respuesta de éxito `{ "success": true, "data": … }`; error `{ "success": false, "error": "CODIGO", "message": "…" }` (opcional `missingFields`). Los códigos de error son estables (p. ej. `VALIDATION_ERROR`, `UNAUTHORIZED`, `INVALID_TOKEN`, `FORBIDDEN`, `CRIADERO_NOT_FOUND`, `*_CONCURRENCY_CONFLICT`); reutilizar los existentes antes de crear otros.
- No sobrediseñar ni eliminar funcionalidades para simplificar. Cambios pequeños y revisables.
- Migraciones D1: nunca editar una aplicada; todo cambio va en `NNNN_descripcion.sql` nueva (siguiente: `0005`). Ver `.claude/rules/api-migraciones-d1.md`.

## Pruebas

- Tres niveles: unitarias de service con fakes (`api/test/helpers/fake-*.repository.ts`), HTTP ligeras con `app.request()` y routers de prueba, e integración D1 local (`api/test/integration/`).
- Nombres de tests descriptivos en español: `debe …` (p. ej. `debe rechazar un token expirado`).
- Los tests unitarios/HTTP no tocan D1; la integración nunca se mezcla con ellos.

## Git

- **Conventional Commits** en español, con scope: `feat(api): …`, `test(api): …`, `refactor(api): …`, `fix(api): …`, `docs: …`, `chore: …`.
- Commits pequeños y funcionales; no mezclar una feature con limpieza grande. Ramas `feature/v2-*` desde `v2`.
- **No hacer commit, push, deploy ni migraciones remotas sin orden explícita.** Revisar `git status` y `git diff --stat` antes de `git add`; nunca `git add .` a ciegas.
- No versionar secretos: `api/.dev.vars`, `.env*` están ignorados. Solo `api/.dev.vars.example` (variable actual: `JWT_SECRET`). No leer ni imprimir `.dev.vars`.
- Barrera **parcial**: `.claude/settings.json` niega `Read` sobre `api/.dev.vars`, `.env`, `.env.local` y `.env.production`, y `Bash` con `cat`, `type`, `Get-Content` y `less` sobre esos archivos. No cubre otras formas de lectura (`more`, `head`, `tail`, `Select-String`, `node`, `python`, redirecciones, copiar el archivo, `.env.*` distintos de esos tres) ni subagentes con otras herramientas; no sustituye al sandbox ni a la disciplina de no abrirlos.
- `documents/traspaso/` está pendiente de decisión de versionado: no incluirlo en un `git add` sin que se pida.

## PowerShell, CRLF y archivos

- Shell principal: PowerShell en Windows. `core.autocrlf=true`; no hay `.gitattributes`.
- Preferir reescribir/editar archivos con las herramientas de edición, no con `Set-Content` ni reemplazos por regex (generaron `^M`, espacios finales y un literal `` `r`n `` dentro de TypeScript).
- Si se usa here-string, que sea `@' … '@` (literal) y con la comilla de cierre en la columna 0. Codificación UTF-8.
- Después de editar: `git diff --check`.

## Aplicación móvil V1 (solo si la tarea la toca)

Reglas de `AGENTS.md` aplicables a `src/`: no modificar migraciones SQLite antiguas, nueva migración para cada cambio de esquema local, no tocar `BackupRepository.js` ni servicios de imágenes sin analizar impacto, no romper tabs raíz (Inicio, Jaulas → `ListaJaulas`, Aves → `ListaAves`, Finanzas, Más). Detalle en `.claude/rules/app-movil-v1.md`.

## Flujo de trabajo

1. `git status --short` y rama actual; no asumir árbol limpio.
2. Para un módulo nuevo: leer su spec en `documents/specs/<modulo>.md`; si no existe, pedir al agente `analista-v1` que la redacte desde el código V1 (skill `nuevo-modulo-api`).
3. Analizar impacto (archivos, tablas, riesgo sobre datos) antes de programar; explicar los archivos que se modificarán.
4. Implementar siguiendo las capas; validar con la skill `verificar-api`.
5. Revisar el diff y reportar qué se validó y qué no.

## Documentación (leer solo lo necesario, por ruta)

Orden de autoridad ante contradicciones: **código real > este `CLAUDE.md` > `documents/traspaso/` > documentos V2 antiguos**. Índice completo en `documents/README.md`.

| Ruta | Contenido |
|---|---|
| `documents/README.md` | Índice, autoridad y pendientes de documentación |
| `documents/traspaso/CLAUDE_PROJECT_HANDOFF_CRIADERO_KIKIRIKIS.md` | Contexto maestro: estado, modelo D1 actual, auth, endpoints, modelo funcional V1, mapeo V1→API V2 |
| `documents/traspaso/CIERRE_FINAL_TRASPASO_CRIADERO_KIKIRIKIS_V2.md` | Razones de las decisiones, lógica de negocio de V1, DDL borrador (muy largo: leer solo la sección necesaria) |
| `documents/traspaso/RESPUESTAS_CUESTIONARIO_TRASPASO_CRIADERO_KIKIRIKIS_V2.md` | Estado de repo, migraciones y Cloudflare |
| `documents/V1_BASELINE.md` | Funciones y restricciones de V1 |
| `documents/V2_ARCHITECTURA.md` | Arquitectura online-first, identidad y sección de riesgos y decisiones abiertas |
| `documents/V2_ROADMAP.md` | Siete fases de trabajo y su estado |
| `documents/V2_MODELO_DATOS.md` | Estado real de D1 (`0001`–`0004`) y modelo futuro en **borrador no aprobado** |
| `documents/CriaderoKikirikis_V1_Analisis_Movil_y_Mapeo_API.md` | Análisis de V1 y mapeo repositorio → endpoint (muy largo: leer solo la sección necesaria) |
| `documents/specs/_plantilla.md` | Plantilla de especificación por módulo |
| `documents/archive/` | Histórico; solo si se pide o falta un detalle |

`AGENTS.md` es de la V1 móvil (sus reglas de SQLite V7 → V8 aplican solo a `src/`) y remite a este archivo como fuente principal; en caso de choque prevalece este.

## Agentes y skills

- Agentes (`.claude/agents/`): `arquitecto-v2`, `analista-v1`, `modelador-d1`, `revisor-codigo`, `probador`, `documentador`.
- Skills (`.claude/skills/`): `nuevo-modulo-api`, `verificar-api`.
- Reglas por ruta en `.claude/rules/`. Preferencias personales en `CLAUDE.local.md` y `.claude/settings.local.json` (ignorados por Git).
