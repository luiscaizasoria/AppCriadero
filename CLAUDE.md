# Criadero Kikirikis

App móvil (React Native + Expo, V1 local con SQLite) en evolución a V2 **online-first**: backend en `api/` con TypeScript, Cloudflare Workers, Hono y D1. Idioma de trabajo: español.

## Estado actual

- `src/`, `App.js`, `app.json`: app móvil V1 (v1.0.3), funcional y local. Es la **referencia funcional y el contrato**; no se reescribe ni se elimina hasta que existan y se validen los endpoints V2 equivalentes.
- `api/`: backend V2. Implementado: `GET /api/v1/health`, `POST /api/v1/auth/register`, `POST /api/v1/auth/login`, `POST /api/v1/criaderos`, `PUT /api/v1/criaderos/:criaderoId/configuracion`, `POST /api/v1/criaderos/:criaderoId/onboarding/complete`, `GET /api/v1/criaderos/:criaderoId/onboarding`.
- Pendiente (no asumir que existe): Google Sign-In, `/auth/me`, refresh token, listado/selección de criaderos, R2, y todos los módulos de negocio (aves, jaulas, huevos, salud, finanzas…).
- Migraciones D1 aplicadas: `0001` a `0004` en `api/migrations/`.

## Decisiones vigentes (online-first)

- Escritura y lectura: app → API → D1/R2 → respuesta → UI. **D1 es la fuente de verdad** de datos estructurados y **R2** de imágenes y archivos. D1 guarda `r2_object_key` y metadatos, nunca binarios.
- SQLite de V1 es legado y no gobierna el negocio de V2.
- Identidad: email/contraseña hoy; objetivo Google ID Token → `POST /api/v1/auth/google` → el backend emite **JWT propio** (HS256, `jose`, 3600 s). No usar el token de Google en las demás llamadas.
- Multi-tenancy: `users 1—N criaderos 1—N entidades`. Las entidades llevan `criadero_id`; no duplicar `user_id` (la propiedad se resuelve por `criaderos.user_id`). `userId` nunca viene en el body.
- Solo propietario del criadero; sin roles ni membresías por ahora.
- IDs `TEXT` con UUID v7; `deleted_at` donde V1 da de baja o desactiva. Las peticiones de los módulos nuevos no exigen `version` (V1 no tiene concurrencia); el módulo `criaderos` ya implementado conserva la suya.
- API versionada bajo `/api/v1`, JSON por HTTPS, sin .NET.

## Objetivo y regla del proyecto (decisión del usuario, 2026-10-29)

- La app móvil V1 **conserva pantallas, lógica y comportamiento** y solo cambia **dónde guarda los datos**: de SQLite local a la API en la nube (D1 + R2, con login). Cada repositorio de V1 (`src/repositories/`) se reemplaza por un **cliente REST con la misma interfaz** (mismos nombres de función, mismo objeto devuelto, mismos errores).
- **Regla por defecto: replicar V1 tal cual.** V2 empieza sin datos de usuario, solo con catálogos. Si V1 no lo hacía, V2 tampoco: no se añaden validaciones, límites, rechazos ni comportamientos más estrictos en el servidor. Se conservan los códigos y mensajes de error de V1 para que las pantallas muestren lo mismo.
- **Solo se permiten diferencias que exija el paso a online:** IDs UUID v7, `criadero_id`, imágenes en R2, autenticación y errores de red (las pantallas necesitan estados de carga y de error de red). Se anotan en la spec del módulo como "excepciones técnicas".
- No hay importación de datos de V1 ni mapeo de IDs en el alcance actual. Procedimiento de migración de un módulo: skill `migrar-repositorio-a-api`.

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
- **Push, deploy y migraciones remotas solo con orden explícita del usuario.** Los commits locales los hace únicamente el `orquestador-proyecto` al cerrar un módulo cuyo plan aprobó el usuario (ningún otro agente hace commit); fuera de ese caso, solo con orden explícita. Revisar `git status` y `git diff --stat` antes de `git add`; nunca `git add .` a ciegas.
- No versionar secretos: `api/.dev.vars`, `.env*` están ignorados. Solo `api/.dev.vars.example` (variable actual: `JWT_SECRET`). No leer ni imprimir `.dev.vars`.
- Barrera **parcial**: `.claude/settings.json` niega `Read` sobre `api/.dev.vars`, `.env`, `.env.local` y `.env.production`, y `Bash` con `cat`, `type`, `Get-Content` y `less` sobre esos archivos. No cubre otras formas de lectura (`more`, `head`, `tail`, `Select-String`, `node`, `python`, redirecciones, copiar el archivo, `.env.*` distintos de esos tres) ni subagentes con otras herramientas; no sustituye al sandbox ni a la disciplina de no abrirlos.
- `documents/traspaso/` es **solo local**: está en `.gitignore` (respaldo en un `.zip` fuera del repositorio); no se versiona ni se modifica.

## PowerShell, CRLF y archivos

- Shell principal: PowerShell en Windows. `core.autocrlf=true`; no hay `.gitattributes`.
- Preferir reescribir/editar archivos con las herramientas de edición, no con `Set-Content` ni reemplazos por regex (generaron `^M`, espacios finales y un literal `` `r`n `` dentro de TypeScript).
- Si se usa here-string, que sea `@' … '@` (literal) y con la comilla de cierre en la columna 0. Codificación UTF-8.
- Después de editar: `git diff --check`.

## Aplicación móvil V1 (solo si la tarea la toca)

Reglas aplicables a `src/` (detalle en `.claude/rules/app-movil-v1.md`): no modificar migraciones SQLite antiguas (V7 → V8 solo para la app), no tocar `BackupRepository.js` ni servicios de imágenes sin analizar impacto, no romper los cinco tabs raíz (Inicio, Jaulas → `ListaJaulas`, Aves → `ListaAves`, Finanzas, Más).

## Flujo de trabajo

1. `git status --short` y rama actual; no asumir árbol limpio.
2. Para migrar un módulo: leer su spec en `documents/specs/<modulo>.md`; si no existe, pedir al agente `analista-codigo-v1` que la redacte desde el código V1 con `documents/specs/plantilla-spec.md`. Procedimiento completo: skill `migrar-repositorio-a-api` (API + cliente REST con la misma interfaz que el repositorio V1).
3. Analizar impacto (archivos, tablas, riesgo sobre datos) antes de programar; explicar los archivos que se modificarán.
4. Implementar siguiendo las capas; validar con la skill `verificar-api`.
5. Revisar el diff y reportar qué se validó y qué no.

## Documentación (leer solo lo necesario, por ruta)

Orden de autoridad ante contradicciones: **código real > este `CLAUDE.md` > `documents/arquitectura/` > specs > `documents/historico/`**. Mapa completo en `documents/README.md`.

| Ruta | Contenido |
|---|---|
| `documents/README.md` | Mapa del proyecto, autoridad y flujo para migrar un módulo |
| `documents/arquitectura/arquitectura-v2.md` | Arquitectura online-first, identidad y riesgos |
| `documents/arquitectura/modelo-datos-v2.md` | Estado real de D1 (`0001`–`0004`) y modelo futuro en **borrador** (DDL literal) |
| `documents/arquitectura/roadmap-v2.md` | Siete fases de trabajo y su estado |
| `documents/referencia-v1/baseline-v1.md` | Funciones y restricciones de V1 |
| `documents/referencia-v1/analisis-v1-mapeo-api.md` | Análisis de V1 y mapeo repositorio → endpoint (muy largo: leer solo la sección necesaria; su Anexo B es literal) |
| `documents/specs/plantilla-spec.md` | Plantilla ligera de especificación por módulo |
| `documents/specs/*.md` | Specs: `aves`, `catalogos`, `jaulas`, `cuidados-jaula` |
| `documents/historico/` | Documentos antiguos y la copia de las reglas antiguas de la app móvil; solo si se pide o falta un detalle |
| `documents/traspaso/` | Traspaso (handoff, cierre, respuestas): **solo local**, ignorado por Git y respaldado fuera del repositorio |

## Equipo de agentes y flujo

- Hilo principal: **`orquestador-proyecto`** (fijado con `"agent"` en `.claude/settings.json`; coordina y no escribe código). Si la sesión no arrancó con él, actúa según `.claude/agents/orquestador-proyecto.md` o inicia con `claude --agent orquestador-proyecto`. **Desactivarlo:** quitar la clave `agent` de `.claude/settings.json` (o arrancar con `claude --agent <otro>`) y reiniciar la sesión; los cambios de agentes y del ajuste se aplican al reiniciar.
- Subagentes (`.claude/agents/`; el orquestador solo puede lanzar estos): `analista-codigo-v1` (specs), `especialista-base-datos-d1` (esquema y migraciones), `implementador-api` (backend), `implementador-cliente-app` (cliente REST de la app), `revisor-arquitectura-v2` (veredicto APROBADO o RECHAZADO), `revisor-de-cambios` (detalle del diff), `ejecutor-de-pruebas` (typecheck y pruebas), `probador-integracion-api` (Worker local con D1 temporal), `probador-movil` (emulador y teléfono) y `redactor-documentacion` (`documents/`).
- Flujo por módulo: spec y V1 → diseño de tabla → **plan aprobado por el usuario** → implementar (API y cliente) → revisar → probar → probar la app → documentar → commit local y resumen corto.
- **Al usuario solo le toca:** aprobar el plan de cada módulo, el push, los despliegues (y todo comando `--remote` o que cree o borre recursos en Cloudflare), las decisiones de producto y la comprobación mínima en el teléfono. Los subagentes no pueden preguntar al usuario: sus dudas las pregunta el orquestador.
- Cumplimiento técnico: `.claude/hooks/guardia.ps1` (hook en el frontmatter de cada agente) limita dónde escribe cada uno y qué comandos Bash admite; `.claude/settings.json` pregunta antes de push, deploy y comandos remotos. Es comparación de texto, no una frontera de seguridad; el resto son reglas de conducta de cada agente. Los hooks de agentes de proyecto exigen aceptar una vez el diálogo de confianza de la carpeta.
- Skills (`.claude/skills/`): `nuevo-modulo-api`, `verificar-api`, `migrar-repositorio-a-api`.
- Reglas por ruta en `.claude/rules/`. Preferencias personales en `CLAUDE.local.md` y `.claude/settings.local.json` (ignorados por Git).
