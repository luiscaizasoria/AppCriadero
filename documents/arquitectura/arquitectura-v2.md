# Arquitectura V2 — Criadero Kikirikis

## Objetivo

Evolucionar la aplicación móvil V1 (local, sin usuarios) hacia una aplicación **online-first** y multiusuario: la app móvil consume una API propia y los datos viven en un backend central. Este documento fija las decisiones técnicas vigentes de V2. Las decisiones y sus razones están en `documents/traspaso/`; el estado de lo implementado manda sobre lo planeado (el código real tiene prioridad).

## Decisión central: online-first

```text
App móvil (React Native + Expo)
        |
        |  HTTPS + JWT  (API REST / JSON, /api/v1)
        v
Cloudflare Workers + Hono (TypeScript)
        |                         \
        v                          v
Cloudflare D1                 Cloudflare R2
datos estructurados           imágenes y archivos
```

- Escritura y lectura siguen el mismo camino: app → API → D1/R2 → respuesta → UI.
- **D1 es la fuente de verdad** de los datos estructurados y **R2** la de imágenes y archivos. D1 guarda la clave del objeto (`r2_object_key`) y metadatos, nunca binarios.
- **SQLite de V1 es legado**: no es fuente de verdad en V2. La V1 sigue funcionando localmente hasta que cada módulo se reemplace por su cliente REST, repositorio por repositorio.
- **Fuera de alcance** (descartado por ahora): sincronización SQLite ↔ D1, cola de comandos offline, resolución de conflictos, merge de versiones y motor offline-first. Una caché visual futura no está prohibida, pero no gobernaría el negocio.
- Alcance funcional: el de V1 (aves individuales, sin lotes, sin ampliar a otras especies ni a un producto agropecuario genérico).

## Stack

| Capa | Decisión | Estado |
|---|---|---|
| App móvil | React Native + Expo (JavaScript) | V1 vigente; clientes REST pendientes |
| Backend | TypeScript sobre Cloudflare Workers con Hono | Implementado en `api/` |
| Datos | Cloudflare D1, migraciones versionadas en `api/migrations/` | Migraciones `0001`–`0004` |
| Archivos | Cloudflare R2 (binarios); D1 guarda referencias | Pendiente de diseño e implementación |
| Contrato | API REST JSON sobre HTTPS, versionada bajo `/api/v1` | Implementada parcialmente; contrato OpenAPI previsto, no creado |
| Identidad | Email/contraseña + JWT propio; Google Sign-In → JWT propio | Email/contraseña implementado; Google pendiente |
| Pruebas | Vitest; unitarias, HTTP e integración con D1 local (`better-sqlite3`) | Implementado |
| Repositorio | GitHub; GitHub Actions para validaciones y despliegues | Repositorio sí; CI no existe |
| Ambientes | DEV / QA / PROD con datos y secretos separados | Solo existe un recurso D1 de desarrollo (`criadero-kikirikis-dev`) |
| Costos | Comenzar con el nivel gratuito y revisar límites antes de cada despliegue | Vigente |

No se utiliza .NET ni ASP.NET Core para el backend.

## Arquitectura del backend

```text
routes -> factory -> service -> repository -> D1
```

- `routes`: parámetros, body, middleware de autenticación, ownership y mapeo de errores a HTTP. Sin SQL.
- `factory`: compone repositorio y servicio (D1 en producción, fakes en pruebas).
- `service`: reglas de negocio, idempotencia y concurrencia. No depende de Hono.
- `repository`: SQL con prepared statements y `batch` para operaciones atómicas.
- `types`: contratos y errores.
- `api/src/app.ts` compone la aplicación Hono; `api/src/index.ts` exporta el Worker. Módulos actuales: `auth`, `criaderos` y `catalogs`.
- Respuestas: `{ "success": true, "data": … }` y `{ "success": false, "error": "CODIGO", "message": "…" }` con códigos de error estables.

## Identidad y seguridad

### Estado actual

- Registro y login con email y contraseña (`POST /api/v1/auth/register`, `POST /api/v1/auth/login`).
- Contraseñas con PBKDF2-SHA-256, 210.000 iteraciones, sal de 16 bytes y hash de 32 bytes; nunca en texto plano.
- **JWT propio** firmado con HS256 (`jose`), con `sub`, `email`, `iat` y `exp`. **Solo existe access token, de 1 hora (3600 s). No hay refresh token.**
- El middleware valida el token y expone `{ id, email }`; todas las rutas de criaderos están protegidas. La clave se lee de `JWT_SECRET` (variable local en `api/.dev.vars`, que no se versiona).
- Autorización actual: solo propietario. Cada operación sobre un criadero comprueba que `criaderos.user_id` coincide con el usuario del token (si no, `403 FORBIDDEN`). Validar un JWT por sí solo no basta. No hay roles, membresías ni invitaciones.

### Objetivo: Google Sign-In

```text
Móvil autentica con Google
        |
        v
Google ID Token  --->  POST /api/v1/auth/google
                              |
                              v
              El backend valida: firma, issuer, audience, expiración, sub/email
                              |
                              v
        Busca el usuario por users.google_sub; si no existe, relaciona
        por email solo con reglas seguras o crea el usuario
                              |
                              v
              El backend emite su propio JWT
```

- El token de Google solo identifica al usuario ante el backend. Las llamadas posteriores usan el JWT propio; **no se sustituye el JWT propio por el token de Google**.
- Pendientes de definir: client IDs (Android, iOS, web), política para vincular una cuenta de email/contraseña con Google, `GET /api/v1/auth/me`, gestión de revocación y sesión, y pruebas.

## Datos

- Relación principal: `users 1 — N criaderos 1 — N entidades de negocio`. Los criaderos pertenecen a un usuario por `criaderos.user_id` (la restricción `UNIQUE` se eliminó en la migración `0003`).
- Las entidades de negocio llevan `criadero_id`; la propiedad se resuelve por `entidad.criadero_id -> criaderos.user_id`. No se duplica `user_id` en cada tabla salvo necesidad técnica documentada.
- IDs `TEXT` con UUID v7; `deleted_at` (borrado lógico) y `version` (concurrencia optimista) donde aplique. Las operaciones compuestas se hacen atómicas con `db.batch()`.
- Las fotos se almacenan en R2 con claves que aíslen usuario y criadero; hay que distinguir archivos públicos de privados y no asumir que todo objeto de R2 es público.
- Modelo detallado: `documents/arquitectura/modelo-datos-v2.md`.

## Reglas de diseño

- Mantener separadas la interfaz móvil, la lógica de API y la persistencia.
- No guardar contraseñas en texto plano ni secretos en Git.
- Preservar la app V1 y sus migraciones SQLite; no eliminarla ni reescribirla hasta que los endpoints V2 equivalentes estén construidos y validados.
- Los módulos de V2 se diseñan a partir del código real de V1 (specs en `documents/specs/`), sin inventar funcionalidades.
- Migrar la app móvil repositorio por repositorio, no en un único cambio.
- Mantener una vía de actualización para instalaciones y respaldos V1; el destino de `BackupRepository` en V2 es una decisión abierta.

## Riesgos y decisiones abiertas

| Tema | Situación | Acción pendiente |
|---|---|---|
| Costo de PBKDF2 en Workers | 210.000 iteraciones **sin medir en un Worker real**. El plan gratuito limita la CPU a unos 10 ms por solicitud; el hash podría excederla. Solo se probó en local | Medir registro y login en un Worker desplegado antes de producción; si no cabe, evaluar menos iteraciones, otro mecanismo o un plan de pago |
| Rate limiting | **No hay limitación de intentos en login ni en registro** | Diseñar e implementar antes de exponer la API |
| CORS | **No está configurado** | Definir orígenes permitidos según el cliente móvil (y web, si aplica) |
| Integración continua | **No existe CI** (no hay GitHub Actions) | Crear flujo con `typecheck`, pruebas unitarias/HTTP y pruebas de integración |
| Refresh token | **Sin decidir.** El access token dura 1 hora; la app móvil necesitará refresh o volver a iniciar sesión | Definir rotación, revocación, tabla de sesiones, almacenamiento seguro y logout global |
| Registro sin verificación de correo | El servicio inserta `active = 1` al registrar, aunque el esquema usa `DEFAULT 0`; no hay verificación de email ni recuperación de contraseña | Decidir si se exige verificación, y diseñar tokens de verificación y recuperación si el alcance lo pide |
| Google Sign-In | No implementado | Definir client IDs, vinculación de cuentas y `/auth/me` |
| R2 | Sin bucket, binding ni política de acceso; sin estrategia de subida (móvil → Worker → R2 o URL temporal), MIME, tamaños ni compensación entre D1 y R2 | Diseñar antes de la fase de imágenes |
| Ambientes | Un solo D1 de desarrollo; no hay QA ni PROD | Crear recursos y secretos separados por ambiente |
| Plan gratuito | Límites de filas leídas/escritas en D1 y de CPU en Workers | Índices y paginación; revisar límites antes de cada despliegue |
| OpenAPI | Contrato previsto, no creado | Generarlo conforme se estabilicen los módulos |
| Roles y permisos | Solo propietario; sin roles por ahora | Reevaluar si aparecen ayudantes o miembros |
| `BackupRepository` | Destino en V2 sin decidir | Decidir si se retira, se reemplaza o se mantiene solo en V1 |

## Referencias

- `documents/traspaso/`: decisiones vigentes, razones y estado del traspaso.
- `documents/arquitectura/modelo-datos-v2.md`: esquema D1 real y modelo futuro (borrador).
- `documents/arquitectura/roadmap-v2.md`: fases de trabajo.
- `documents/referencia-v1/analisis-v1-mapeo-api.md`: análisis de V1 y mapeo repositorio → endpoint.
- `documents/historico/Contexto_Arquitectura_V2_Online_Criadero_Kikirikis.md`: propuesta original (histórica, anterior a online-first).
