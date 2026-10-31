# Modelo de datos V2 — Criadero Kikirikis

## Propósito

Este documento registra el modelo de datos de V2 en tres niveles, de mayor a menor autoridad:

1. **Estado real de D1** (migraciones `0001`–`0004`): lo que existe hoy. Si algo no coincide con una decisión posterior, el esquema real y el código prevalecen.
2. **Decisiones y modelos aprobados**: reglas de diseño tomadas de forma incremental.
3. **Modelo futuro de negocio**: borrador **no aprobado** (sección final), que debe validarse contra el código real de V1 antes de crear migraciones.

## Principios generales aprobados (actualizados a online-first)

- **D1 es la fuente de verdad de los datos estructurados** y **R2 la de imágenes y archivos.** La app móvil consume la API; no hay réplica local gobernada por el negocio.
- **SQLite de V1 es legado.** No existe sincronización SQLite ↔ D1, ni cola offline, ni resolución de conflictos (fuera de alcance). Los registros V1 solo se migran una vez, con un proceso específico.
- **Identidad global:** `id TEXT` con UUID v7 en todas las entidades.
- **Multi-criadero:** `users 1 — N criaderos 1 — N entidades de negocio`. Los datos se aíslan por `criadero_id`; la propiedad se resuelve por `entidad.criadero_id -> criaderos.user_id`, sin duplicar `user_id` salvo necesidad técnica documentada.
- **Aves individuales, sin lotes.** El alcance funcional es el de V1.
- **Fotos:** el binario va a R2; D1 guarda la clave del objeto y metadatos.
- **El esquema D1 de negocio aún no existe.** Hoy solo están implementadas las tablas descritas en la sección siguiente; el resto es borrador.

> **Nota sobre la numeración.** Las decisiones #1–#11 se redactaron cuando la arquitectura todavía era offline-first. Se conservan con su numeración porque el código las cita (por ejemplo, `api/src/catalogs/defaultCatalogItems.ts` cita el "Modelo aprobado #11"). Lo que dependía de sincronización fue **reemplazado por online-first** y así se indica en cada caso.

## Estado real de D1 (migraciones 0001–0004)

Migraciones aplicadas, en `api/migrations/`:

| Migración | Contenido |
|---|---|
| `0001_core_schema.sql` | `users`, `criaderos` (con `UNIQUE(user_id)`), `catalogos`, `catalogo_items` |
| `0002_seed_catalogos.sql` | 7 catálogos globales |
| `0003_onboarding_schema.sql` | Elimina `UNIQUE(user_id)` de `criaderos` (1:N), amplía `criaderos`, crea `criadero_configuracion` |
| `0004_seed_onboarding_catalogs.sql` | 3 catálogos globales de onboarding |

Convenciones comunes: `id TEXT PRIMARY KEY`, fechas `TEXT` con `DEFAULT CURRENT_TIMESTAMP`, booleanos `INTEGER` 0/1 con `CHECK`, `version INTEGER NOT NULL DEFAULT 1 CHECK (version >= 1)` y `deleted_at TEXT` (borrado lógico).

### `users`

| Columna | Tipo | Notas |
|---|---|---|
| `id` | TEXT PK | UUID v7 |
| `email` | TEXT NOT NULL UNIQUE | Normalizado (trim y minúsculas) por el servicio |
| `nombre` | TEXT NOT NULL | |
| `password_hash` | TEXT | Nulo si solo usa Google. Formato `pbkdf2_sha256$100000${sal}${hash}` (100000 es el máximo que admite workerd) |
| `google_sub` | TEXT UNIQUE | Preparado para Google Sign-In; hoy sin uso |
| `email_verified_at` | TEXT | Hoy no se escribe |
| `active` | INTEGER NOT NULL **DEFAULT 0** | `CHECK (active IN (0,1))`. El registro actual inserta `active = 1` (ver `arquitectura-v2.md`, riesgos) |
| `created_at`, `updated_at`, `deleted_at`, `version` | | Estándar |

### `criaderos`

| Columna | Tipo | Notas |
|---|---|---|
| `id` | TEXT PK | UUID v7 |
| `user_id` | TEXT NOT NULL | FK → `users(id)` `RESTRICT`. **Sin `UNIQUE`** desde `0003`: un usuario puede tener varios criaderos |
| `nombre` | TEXT NOT NULL | |
| `descripcion`, `pais`, `provincia`, `ciudad`, `direccion`, `telefono`, `correo_contacto` | TEXT | Datos generales (onboarding paso 1) |
| `logo_uri` | TEXT | Reservado; evolucionará a referencia R2 (clave del objeto) |
| `onboarding_completado` | INTEGER NOT NULL DEFAULT 0 | `CHECK (0,1)` |
| `created_at`, `updated_at`, `deleted_at`, `version` | | Estándar |

Índice: `ix_criaderos_user_id_deleted_at (user_id, deleted_at)`.

### `catalogos` (global, sin `criadero_id`)

`id`, `codigo` TEXT NOT NULL **UNIQUE**, `nombre`, `descripcion`, `activo` (0/1, DEFAULT 1), `created_at`, `updated_at`, `deleted_at`, `version`.

Catálogos sembrados (10): `RAZAS`, `SEXOS`, `ENFERMEDADES`, `MEDICAMENTOS`, `ALIMENTOS`, `BEBIDAS`, `CATEGORIAS_FINANCIERAS` (migración `0002`) y `ESPECIES`, `TIPOS_CRIADERO`, `FINALIDADES_CRIADERO` (migración `0004`).

### `catalogo_items` (por criadero)

`id`, `criadero_id` NOT NULL (FK → `criaderos` `RESTRICT`), `catalogo_id` NOT NULL (FK → `catalogos` `RESTRICT`), `codigo` NOT NULL, `nombre` NOT NULL, `descripcion`, `activo` (0/1, DEFAULT 1), `orden` INTEGER, `created_at`, `updated_at`, `deleted_at`, `version`.

Índices:

- `ux_catalogo_items_codigo_activo`: `UNIQUE (criadero_id, catalogo_id, codigo) WHERE deleted_at IS NULL`.
- `ix_catalogo_items_criadero_id (criadero_id)`.
- `ix_catalogo_items_catalogo_id (catalogo_id)`.

### `criadero_configuracion` (1:1 con `criaderos`)

`id`, `criadero_id` NOT NULL **UNIQUE** (FK → `criaderos` `ON DELETE CASCADE`), `especie_principal_item_id`, `raza_principal_item_id`, `tipo_criadero_item_id`, `finalidad_item_id` (cada uno FK → `catalogo_items` `ON DELETE SET NULL`), `created_at`, `updated_at`, `version`. No tiene `deleted_at`. Una tabla aparte evita la dependencia circular entre `criaderos` y `catalogo_items`. Índices por cada columna `*_item_id`.

### Items iniciales de un criadero (38)

No se siembran por migración: la plantilla versionada está en código (`api/src/catalogs/defaultCatalogItems.ts`) y al crear un criadero se generan sus propios items (UUID v7 nuevos, `criadero_id` del criadero) junto con su `criadero_configuracion`, en un solo `batch`.

| Catálogo | Items |
|---|---:|
| `RAZAS` | 9 |
| `SEXOS` | 2 |
| `ENFERMEDADES` | 4 |
| `MEDICAMENTOS` | 4 |
| `ALIMENTOS` | 0 |
| `BEBIDAS` | 0 |
| `CATEGORIAS_FINANCIERAS` | 8 |
| `ESPECIES` | 5 |
| `TIPOS_CRIADERO` | 3 |
| `FINALIDADES_CRIADERO` | 3 |
| **Total** | **38** |

Aunque `ESPECIES` incluye varias opciones por el onboarding, el alcance funcional vigente es el de aves individuales.

---

## Decisión aprobada #1: Catálogos

### Sistema genérico

V2 utilizará un sistema genérico de catálogos compuesto por:

- `catalogos`: define los tipos de catálogos existentes (ej. RAZAS, SEXOS, etc.)
- `catalogo_items`: define los valores específicos de cada catálogo (ej. "Macho", "Hembra" dentro de SEXOS)

### Catálogos configurables

Los siguientes catálogos se implementarán mediante este sistema genérico:

- RAZAS
- SEXOS
- ENFERMEDADES
- MEDICAMENTOS
- ALIMENTOS
- BEBIDAS
- CATEGORIAS_FINANCIERAS

### Tablas históricas NO reproducidas en D1

Las siguientes tablas de V1 **NO** se reproducirán en D1 porque no tienen consumo funcional activo en V1:

- `enfermedades_catalogo`
- `medicamentos_catalogo`

Si en el futuro se requiere historial de cambios en catálogos, se diseñará un mecanismo específico, no se replicará la estructura histórica actual.

### Regla V2 para referencias a catálogos

Las entidades de negocio deberán guardar una referencia estable al `CatalogItem` correspondiente, no utilizar nombre o código como relación principal.

Esto significa que, por ejemplo, una `ave` no guardará "MACHO" como código/texto de relación, sino el identificador global del `CatalogItem` que representa el sexo Macho en el catálogo SEXOS.

### Comportamiento V1 a migrar

En V1, las entidades actualmente guardan valores textuales directamente:

- RAZAS: guarda nombre
- SEXOS: guarda código
- ENFERMEDADES: guarda nombre
- MEDICAMENTOS: guarda nombre
- ALIMENTOS: guarda nombre
- BEBIDAS: guarda nombre
- CATEGORIAS_FINANCIERAS: guarda código

La futura migración de datos de V1 deberá resolver estos valores históricos hacia la identidad global del `CatalogItem` correspondiente. Esto implica:

1. Mapear los valores existentes a los `CatalogItem` creados durante la migración.
2. Actualizar las referencias en las entidades para usar el identificador global en lugar del texto/código.

### Valores de dominio (NO catálogos por ahora)

Los siguientes campos se consideran valores de dominio internos de la aplicación, **NO** catálogos configurables por ahora:

- `aves.estado_salud`
- `sanidad_jaula.tipo`
- `movimientos_financieros.tipo`

Si en el futuro se requiere que estos valores sean configurables, se evaluará si conviene convertirlos en catálogos del sistema genérico.

---

## Decisión aprobada #2: Identidad global y pertenencia a Criadero

### Identidad global

Todas las entidades de negocio de V2 utilizarán identificadores globales estables.

La estrategia aprobada es utilizar UUID (v7, ver decisión #5).

> **Reemplazado por online-first:** el diseño original usaba el mismo UUID en SQLite local y en D1, de modo que un registro creado offline conservara su identidad al sincronizarse (dispositivo → SQLite → sincronización → D1). Ahora los registros se crean mediante la API: el backend genera el UUID y D1 lo conserva. No hay pares de identificadores local/servidor ni sincronización.

Los INTEGER PRIMARY KEY AUTOINCREMENT de V1 se consideran identificadores locales históricos y deberán transformarse durante la futura migración.

### Pertenencia directa a Criadero

Toda entidad de negocio perteneciente a un criadero deberá almacenar criadero_id directamente.

No se dependerá exclusivamente de relaciones indirectas para determinar ownership.

Esto aplica inicialmente a:

- jaulas
- aves
- ave_evolucion
- ave_historial
- jaula_historial
- huevos
- diagnosticos_ave
- tratamientos_ave
- bajas_ave
- movimientos_financieros
- movimientos_financieros_historial
- alimentacion_jaula
- bebida_jaula
- sanidad_jaula

Aunque algunas entidades puedan deducir el criadero mediante su entidad padre, criadero_id se mantendrá explícitamente para facilitar:

- autorización
- aislamiento multi-criadero
- consultas
- índices
- auditoría

(La versión original también citaba la sincronización, la resolución de conflictos y el funcionamiento offline; quedan fuera de alcance con online-first.)

La propiedad se resuelve por `entidad.criadero_id -> criaderos.user_id`; no se agrega `user_id` a las entidades de negocio.

La integridad entre criadero_id y las relaciones padre deberá validarse en la capa de dominio/API.

### Caso específico de aves

aves.criadero_id será obligatorio.

No se utilizará jaula_actual_id como mecanismo para determinar a qué criadero pertenece un ave.

Un ave puede existir sin jaula asignada y puede cambiar de jaula sin que cambie su criadero.

aves.criadero_origen seguirá representando información descriptiva sobre procedencia y NO ownership del sistema.

### Catálogos globales y configuración por criadero

La definición de tipos de catálogo será global mediante catalogos.

Ejemplos:

- RAZAS
- SEXOS
- ENFERMEDADES
- MEDICAMENTOS
- ALIMENTOS
- BEBIDAS
- CATEGORIAS_FINANCIERAS

Los valores concretos serán configurables por criadero mediante catalogo_items.

Cada catalogo_item tendrá identidad global y pertenecerá a un criadero_id.

Esto permite que dos criaderos compartan los mismos tipos de catálogo pero mantengan configuraciones independientes.

Al crear un nuevo criadero podrán generarse items predeterminados a partir de una configuración inicial del sistema.

Los items resultantes pertenecerán al criadero.

### Entidades derivadas de V1

clientes no existe actualmente como tabla persistente independiente en V1; se deriva de información de bajas/ventas.

produccion tampoco existe actualmente como tabla persistente independiente; se deriva principalmente de huevos.

Por ahora V2 NO creará tablas específicas clientes ni produccion.

Estas decisiones se reevaluarán cuando se diseñen esos módulos.

### Consecuencia (reemplazado por online-first)

La unidad principal de aislamiento es el criadero. No hay sincronización: el diseño original dejaba "la estrategia de sincronización por definir" y esa línea de trabajo quedó fuera de alcance.

---

## Decisión aprobada #3: Autenticación y Onboarding Inicial

> **Reemplazado por online-first.** La versión original asumía una relación 1:1 usuario-criadero, verificación de correo, recuperación de contraseña y un contexto SQLite aislado por usuario para operar offline. Lo que sigue refleja la decisión vigente y el estado real. Lo no implementado se marca como pendiente.

### Alcance

V2 usa un modelo de autenticación simple: **solo propietario**. Por ahora NO existen:

- roles;
- permisos;
- membresías (`UserCriadero`) ni usuarios compartiendo un criadero;
- invitaciones.

Cada usuario solo accede a los datos de sus propios criaderos.

### Relación User y Criadero

La relación es **uno-a-muchos** (`users 1 — N criaderos`), no uno-a-uno: la restricción `UNIQUE(user_id)` se eliminó en la migración `0003`. La referencia está en `criaderos.user_id`; `users` no guarda `criadero_id`. Aún no existe el listado ni la selección de criadero activo (pendiente).

La migración futura de datos V1 es un proceso específico y no altera esta regla.

### User

`users` es la identidad autenticable global (columnas reales en "Estado real de D1"). No existe `auth_provider`: los métodos disponibles se deducen de los datos:

- `password_hash` no nulo permite autenticación con correo y contraseña;
- `google_sub` no nulo permite autenticación con Google.

`users` no almacena el criadero actual, roles, permisos, datos de negocio ni configuración del criadero.

### Autenticación con correo y contraseña — implementada

- `POST /api/v1/auth/register`: normaliza el email, exige email, nombre y contraseña (mínimo 8 caracteres), rechaza correos ya registrados (incluso borrados lógicamente) con `EMAIL_ALREADY_REGISTERED` y guarda un hash PBKDF2-SHA-256 (nunca la contraseña).
- `POST /api/v1/auth/login`: `INVALID_CREDENTIALS` (401) sin revelar si el email existe, `USER_INACTIVE` (403) si la cuenta no está activa.
- Emite un **JWT propio** de 1 hora. No hay refresh token (decisión abierta).
- **Pendiente / no implementado:** verificación de correo (el diseño original dejaba la cuenta inactiva hasta verificar; hoy el registro inserta `active = 1`), recuperación de contraseña y `password_reset_tokens`.

### Autenticación con Google — pendiente

La identidad externa estable es `google_sub` (el `sub` de Google); no se depende solo del email. Flujo objetivo:

1. El móvil autentica con Google y envía el ID Token a `POST /api/v1/auth/google`.
2. El backend valida firma, issuer, audience, expiración y email/subject.
3. Busca un `User` por `google_sub`; si existe, inicia sesión.
4. Si no existe, comprueba si el email ya pertenece a otra cuenta; si no, crea el `User`, marca `email_verified_at` y lo activa.
5. Emite su **propio JWT**. Las llamadas posteriores no usan el token de Google.

Regla original conservada (el handoff la lista como política pendiente de confirmar): si ya existe un `User` con el mismo email y `password_hash` pero sin `google_sub`, NO se crea un segundo usuario ni se vincula Google automáticamente; se indica al usuario que inicie sesión con su contraseña. La vinculación explícita queda fuera del alcance actual.

### Onboarding de criadero — implementado

Un criadero no se crea automáticamente al registrarse (el diseño original preveía un criadero "Mi Criadero"). Hoy es explícito y protegido por JWT:

1. `POST /api/v1/criaderos`: crea, en un solo `batch`, el criadero, sus 38 `catalogo_items` iniciales y su `criadero_configuracion`. El `userId` sale del token, nunca del body.
2. `PUT /api/v1/criaderos/:criaderoId/configuracion`: guarda especie, raza, tipo y finalidad principales, validando que los cuatro items existan, estén activos y no borrados, pertenezcan al criadero y al catálogo correcto, con control de concurrencia por `version`.
3. `POST /api/v1/criaderos/:criaderoId/onboarding/complete`: revalida datos generales y configuración; idempotente (`alreadyCompleted`); `UPDATE … WHERE version = ? AND onboarding_completado = 0`.
4. `GET /api/v1/criaderos/:criaderoId/onboarding`: estado `INCOMPLETE_GENERAL` (paso 1), `INCOMPLETE_CONFIGURATION` (paso 2), `READY_TO_COMPLETE` (paso 3) o `COMPLETED`.

Propiedad: se valida con `criaderos.id = ? AND user_id = ? AND deleted_at IS NULL`; si no es propietario, `403 FORBIDDEN`.

### Cierre de sesión

Se realiza en la app: se eliminan las credenciales locales y se vuelve al login. La invalidación en servidor (sesiones, revocación, logout global) depende del refresh token y está pendiente.

### Reemplazado por online-first

**Aislamiento SQLite por usuario/criadero:** ya no aplica. Ese diseño existía porque V2 era offline-first y SQLite podía contener datos sin sincronizar. Ahora D1 es la fuente de verdad y no hay contexto local de negocio por usuario.

### Fuera del alcance actual / pendientes

- refresh tokens, sesiones activas y revocación;
- `password_reset_tokens` y `email_verification_tokens`;
- `oauth_states` y detalles de OAuth;
- política de vinculación entre cuentas;
- expiración distinta de la actual y rate limiting.

---

## Decisión aprobada #4: Estándar mínimo de entidad

> **Reemplazado por online-first.** El nombre original era "estándar mínimo de entidad sincronizable". Se conservan los campos comunes; desaparece todo lo que servía a la sincronización.

### Campos estándar (D1)

Toda entidad de negocio tendrá:

- `id`: UUID v7, estable;
- `criadero_id`: criadero propietario;
- `created_at`: fecha de creación;
- `updated_at`: fecha de última modificación;
- `deleted_at`: borrado lógico, nullable;
- `version`: entero para concurrencia optimista.

Cuando una tabla de historial o de eventos inmutables no necesite `updated_at` o `deleted_at`, es una excepción que debe decidirse y documentarse por tabla (pendiente; ver el borrador del modelo futuro).

### Reemplazado: metadata de sincronización local

Ya no aplican `sync_status` (`SYNCED`, `PENDING`, `ERROR`), `last_synced_version`, `server_updated_at`, `last_synced_at`, `device_id`, hash de contenido ni metadata de conflictos. No hay copia local sincronizada.

### Regla de soft delete

`deleted_at` permite conservar historial y referencias (en V1 las aves se dan de baja, las jaulas se desactivan y los items de catálogo se desactivan). Las restricciones de unicidad de códigos de negocio aplican a registros con `deleted_at IS NULL`. La política exacta de borrado por entidad aún no está aprobada para todas las tablas futuras. No implica que toda tabla técnica futura (sesiones, tokens) use soft delete.

### Regla de versionado

`version` se usa como **control optimista de concurrencia en línea**: la API actualiza con `WHERE id = ? AND version = ?` y, si no hay filas afectadas, devuelve un error de conflicto con código estable (por ejemplo `CONFIGURATION_CONCURRENCY_CONFLICT`, `CRIADERO_CONCURRENCY_CONFLICT`). No existe un protocolo de resolución de conflictos de sincronización.

### Auditoría inicial

`created_at` y `updated_at` son suficientes. Por ahora NO se agregan `created_by` ni `updated_by`, porque cada criadero tiene un único propietario y no hay roles.

---

## Decisión aprobada #5: Identidad UUID y unicidad de negocio

### Identidad técnica

Las entidades que requieran identidad global utilizarán UUID v7.

El UUID será:

- global;
- estable;
- inmutable;
- independiente del código de negocio;
- utilizado en D1 (el backend lo genera con la librería `uuid`, v7).

(La versión original lo usaba además en SQLite local; con online-first no hay copia local de negocio.)

### Generación de UUID

El backend (la API) genera el UUID v7 al crear el registro, y D1 lo conserva. El cliente no genera identificadores de negocio.

> **Reemplazado por online-first:** la versión original permitía que el dispositivo generara el UUID al crear una entidad offline en SQLite.

No existirá un mecanismo de traducción entre local_id y server_id.

### Migración de identificadores V1

Los INTEGER AUTOINCREMENT existentes en V1 se consideran identificadores locales legacy.

Durante la futura migración se generará un UUID v7 una sola vez para cada registro migrado.

La migración deberá mantener un mapa temporal entre el ID legacy y el nuevo UUID para transformar correctamente todas las relaciones y claves foráneas.

El ID legacy no será utilizado como identidad técnica en V2.

La incorporación de legacy_id como campo persistente será opcional y se decidirá únicamente si aparece una necesidad real de trazabilidad.

### ID técnico y código de negocio

El UUID representa la identidad técnica del registro.

Los códigos visibles para el usuario representan identidad o referencia de negocio y son campos independientes.

Un código de negocio podrá cambiar sin cambiar el UUID del registro.

Las relaciones entre entidades utilizarán UUID y nunca dependerán del código visible.

### Reglas iniciales de unicidad

Se aprueban conceptualmente las siguientes reglas:

- User.email: único global;
- User.google_sub: único global cuando exista;
- ~~Criadero.user_id: único global para mantener relación uno-a-uno~~ — **reemplazado:** la migración `0003` eliminó esa restricción; la relación es 1:N (un usuario puede tener varios criaderos);
- catalogos.codigo: único global;
- catalogo_items.codigo: único dentro de la combinación criadero + catálogo;
- jaulas.codigo: único dentro de un criadero;
- aves.codigo: único dentro de un criadero.

La necesidad y unicidad de huevos.codigo queda pendiente hasta diseñar específicamente la entidad huevos.

### Soft delete y reutilización de códigos

Las restricciones de unicidad de códigos de negocio aplicarán conceptualmente a registros activos.

Un código perteneciente únicamente a un registro con deleted_at informado podrá reutilizarse para un nuevo registro.

El UUID permitirá distinguir permanentemente ambos registros aunque hayan utilizado el mismo código de negocio en momentos diferentes.

La implementación física de esta regla mediante índices o constraints se definirá al diseñar el esquema D1.

### Decisiones pospuestas

Todavía no se definirá:

- índices físicos de las tablas de negocio;
- formato de códigos visibles;
- prefijos y secuencias;
- estrategia concreta de generación de códigos (en V1 se generan por reglas propias de cada repositorio);
- uso persistente de legacy_id.

(Ya definido: el backend usa la librería `uuid` para generar UUID v7. La resolución de conflictos de códigos por sincronización quedó fuera de alcance.)

---

## Decisión aprobada #6: Relaciones estructurales e históricos

### Relaciones principales

Criadero será la raíz de las entidades de negocio.

Se mantienen conceptualmente las relaciones:

- Criadero -> Jaulas;
- Criadero -> Aves;
- Ave -> Jaula actual;
- Ave -> Padre;
- Ave -> Madre;
- Ave -> Huevos;
- Ave -> Diagnósticos;
- Diagnóstico -> Tratamientos;
- Ave -> Bajas;
- Ave -> AveEvolucion;
- Ave -> AveHistorial;
- Jaula -> JaulaHistorial;
- Jaula -> Alimentación;
- Jaula -> Bebida;
- Jaula -> Sanidad.

Todas las relaciones utilizarán UUID.

### Jaula actual de un ave

aves.jaula_actual_id será nullable.

Un ave podrá existir sin estar asignada actualmente a una jaula.

El criadero propietario del ave NO se determinará mediante jaula_actual_id, ya que aves.criadero_id es la relación de ownership aprobada.

### Genealogía

aves.padre_id y aves.madre_id serán referencias opcionales a otras aves.

Ambas serán nullable porque puede existir un ave cuya genealogía no esté registrada en el sistema.

Las reglas de dominio relacionadas con genealogía, como validación de sexo, pertenencia al mismo criadero o prevención de ciclos, se definirán posteriormente en la capa de dominio/API.

### Huevos

huevos continuará como entidad independiente.

Todo huevo deberá estar asociado a un ave mediante ave_id.

La relación huevos.ave_id será obligatoria.

huevos.jaula_id será opcional.

La jaula representa contexto adicional del registro pero no sustituye la relación obligatoria con el ave.

### AveEvolucion

ave_evolucion se mantendrá como entidad independiente.

Representa la evolución física e información asociada de un ave y estará relacionada mediante ave_id.

### Diagnósticos y tratamientos

diagnosticos_ave se mantendrá como entidad independiente relacionada con Ave.

tratamientos_ave se mantendrá como entidad independiente.

Cada tratamiento podrá relacionarse explícitamente con su diagnóstico mediante diagnostico_id y con el ave según la estructura definitiva del módulo de salud.

### Bajas de aves

bajas_ave se mantendrá como entidad independiente relacionada mediante ave_id.

Representará los eventos de baja como muerte o venta y conservará la información propia de dichos eventos.

### AveHistorial

ave_historial se mantendrá como entidad independiente.

ave_historial.ave_id será obligatorio.

ave_historial.jaula_id será nullable.

Esto permite registrar eventos que no requieren una jaula asociada, incluyendo actualmente eventos como:

- ALTA de un ave sin jaula;
- SALUD;
- MUERTE;
- VENTA.

### JaulaHistorial

jaula_historial se mantendrá como entidad independiente.

jaula_historial.jaula_id será obligatorio.

jaula_historial.ave_id permanecerá nullable.

Aunque el código V1 analizado utiliza actualmente un ave específica en los eventos encontrados, V1 permite NULL y no existe evidencia suficiente para introducir una restricción obligatoria nueva en V2.

### Historial financiero

movimientos_financieros_historial se mantendrá inicialmente como entidad independiente.

Su estructura física se definirá cuando se diseñe específicamente el módulo financiero.

### Origen de movimientos financieros

V1 utiliza una relación polimórfica mediante:

- origen_tipo;
- origen_id;
- ave_id opcional.

El análisis del código V1 confirma únicamente los siguientes orígenes:

- MANUAL: origen_id es NULL y ave_id es NULL;
- VENTA_AVE: origen_id referencia bajas_ave.id y ave_id referencia el ave vendida.

V2 eliminará la relación polimórfica origen_tipo + origen_id para estos casos actualmente conocidos.

Se utilizará una relación explícita:

- movimientos_financieros.baja_ave_id nullable.

Reglas conceptuales:

- un movimiento manual tendrá baja_ave_id NULL;
- un movimiento originado por una venta tendrá baja_ave_id apuntando al registro correspondiente de bajas_ave.

movimientos_financieros.ave_id tampoco se mantendrá para este caso, porque el ave puede obtenerse mediante:

MovimientoFinanciero
-> BajaAve
-> Ave

Esto evita duplicar relaciones y posibles inconsistencias entre ave_id y baja_ave_id.

Si en el futuro aparecen nuevos tipos reales de origen financiero, se diseñarán explícitamente cuando el módulo correspondiente lo requiera, en lugar de reintroducir anticipadamente una relación polimórfica genérica.

### Entidades independientes que se mantienen

Por ahora se mantienen como entidades separadas:

- ave_evolucion;
- ave_historial;
- jaula_historial;
- huevos;
- diagnosticos_ave;
- tratamientos_ave;
- bajas_ave;
- movimientos_financieros;
- movimientos_financieros_historial;
- alimentacion_jaula;
- bebida_jaula;
- sanidad_jaula.

No se utilizará por ahora un mecanismo genérico único de historial para reemplazar estas entidades.

---

## Modelo aprobado #7: User V2

`users` representa la identidad autenticable global del sistema. Columnas reales en "Estado real de D1".

La relación con `criaderos` es **uno-a-muchos**. La referencia de pertenencia está únicamente en `criaderos.user_id`; `users` no almacena `criadero_id`.

### Campos

| Campo | Tipo | Nullable | Propósito |
|---|---|---|---|
| id | TEXT (UUID v7) | NO | Identidad global |
| email | texto | NO | Correo único normalizado |
| nombre | texto | NO | Nombre del usuario |
| password_hash | texto | Sí | Hash para autenticación correo/contraseña |
| google_sub | texto | Sí | Identidad externa Google (única cuando existe) |
| email_verified_at | timestamp | Sí | Fecha de verificación del correo (hoy no se escribe) |
| active | entero 0/1 | NO | Estado de la cuenta (`DEFAULT 0` en el esquema; el registro actual inserta 1) |
| created_at | timestamp | NO | Fecha de creación |
| updated_at | timestamp | NO | Fecha de actualización |
| deleted_at | timestamp | Sí | Borrado lógico |
| version | entero | NO | Control optimista |

### Reglas de autenticación

- Correo y contraseña (implementado) y Google (pendiente).
- La existencia de `password_hash` determina la autenticación con contraseña; la de `google_sub`, la vinculación con Google. No se usa `auth_provider`.
- `email` único globalmente, incluyendo registros borrados lógicamente (el servicio lo comprueba); `google_sub` único cuando existe.
- El email se normaliza (trim y minúsculas) antes de guardarse y compararse.

### Pendientes

Quedan para fases posteriores: `refresh_tokens`, sesiones, `password_reset_tokens`, `email_verification_tokens`, `oauth_states`, expiración distinta de la actual y rate limiting.

---

## Modelo aprobado #8: Criadero V2

`criaderos` es la unidad principal de pertenencia de los datos de negocio. Un usuario puede tener varios criaderos y cada criadero pertenece a exactamente un usuario (`criaderos.user_id`, sin `UNIQUE`).

### Campos (estado real tras la migración 0003)

| Campo | Tipo | Nullable | Propósito |
|---|---|---|---|
| id | TEXT (UUID v7) | NO | Identidad global |
| user_id | TEXT | NO | Usuario propietario (FK → `users`) |
| nombre | texto | NO | Nombre visible del criadero |
| descripcion | texto | Sí | Descripción |
| pais, provincia, ciudad, direccion | texto | Sí | Ubicación |
| telefono, correo_contacto | texto | Sí | Contacto |
| logo_uri | texto | Sí | Reservado; evolucionará a clave de objeto en R2 |
| onboarding_completado | entero 0/1 | NO | Indica si terminó el onboarding |
| created_at, updated_at | timestamp | NO | Fechas |
| deleted_at | timestamp | Sí | Borrado lógico |
| version | entero | NO | Control optimista |

La configuración principal (especie, raza, tipo y finalidad) vive en la tabla aparte `criadero_configuracion` (1:1).

### Reglas

- `user_id` no es único: relación 1:N.
- No existe `active`; el estado activo se determina mediante `deleted_at`.
- Todo criadero propio se consulta con propiedad validada (`user_id` del token).
- Al crearse, genera sus 38 items de catálogo y su fila de configuración.

### Campos no incluidos

Siguen sin incluirse: código visible de criadero, datos fiscales o comerciales, suscripciones, planes, límites, usuarios secundarios, roles y permisos. Podrán diseñarse como entidades independientes si aparecen necesidades reales.

---

## Modelo aprobado #9: Catalogos V2

Catalogos representa las definiciones globales de tipos de catálogo del sistema.

Los tipos de catálogo son definidos por la plataforma y no pertenecen a un criadero específico.

Ejemplos:

- RAZAS;
- SEXOS;
- ENFERMEDADES;
- MEDICAMENTOS;
- ALIMENTOS;
- BEBIDAS;
- CATEGORIAS_FINANCIERAS.

### Relación

Catalogos será una entidad global.

No tendrá criadero_id.

Los valores configurables por criadero serán almacenados posteriormente en catalogo_items.

### Campos conceptuales

| Campo | Tipo | Nullable | Propósito |
|---|---|---|---|
| id | UUID | NO | Identidad global UUID v7 |
| codigo | texto | NO | Código interno único del catálogo |
| nombre | texto | NO | Nombre descriptivo |
| descripcion | texto | Sí | Descripción opcional |
| activo | boolean | NO | Estado del catálogo |
| created_at | timestamp | NO | Fecha creación |
| updated_at | timestamp | NO | Fecha actualización |
| deleted_at | timestamp | Sí | Borrado lógico |
| version | entero | NO | Control optimista |

### Reglas

- codigo será único globalmente.
- Los tipos de catálogo iniciales serán creados mediante configuración inicial/seeder.
- Los usuarios no crearán nuevos tipos de catálogo en V2 inicial.
- activo permitirá deshabilitar un catálogo sin eliminarlo funcionalmente.
- deleted_at permitirá mantener consistencia histórica.
- Estado real: existen 10 catálogos globales sembrados (los 7 originales más `ESPECIES`, `TIPOS_CRIADERO` y `FINALIDADES_CRIADERO`, migración `0004`).

### Campos no incluidos

No se incluyen:

- criadero_id;
- orden;
- configuración específica;
- valores del catálogo.

Los valores pertenecerán a catalogo_items.

---

## Modelo aprobado #10: CatalogoItems V2

CatalogoItems representa los valores configurables de los catálogos para cada criadero.

Mientras Catalogos define globalmente los tipos existentes, cada CatalogoItem pertenece a un criadero específico.

### Relación

Cada CatalogoItem pertenece a:

- un Criadero mediante criadero_id;
- un Catalogo mediante catalogo_id.

Dos criaderos podrán tener items con el mismo código y nombre, pero serán registros independientes con UUID diferentes.

### Campos conceptuales

| Campo | Tipo | Nullable | Propósito |
|---|---|---|---|
| id | UUID | NO | Identidad global UUID v7 |
| criadero_id | UUID | NO | Criadero propietario |
| catalogo_id | UUID | NO | Tipo de catálogo |
| codigo | texto | NO | Código de negocio del item |
| nombre | texto | NO | Nombre visible |
| descripcion | texto | Sí | Descripción opcional |
| activo | boolean | NO | Estado funcional del item |
| orden | entero | Sí | Orden visual opcional |
| created_at | timestamp | NO | Fecha de creación |
| updated_at | timestamp | NO | Fecha de actualización |
| deleted_at | timestamp | Sí | Borrado lógico |
| version | entero | NO | Control optimista |

### Regla de unicidad

codigo deberá ser único dentro de la combinación:

criadero_id + catalogo_id + codigo

La unicidad funcional aplicará a registros activos.

Un código utilizado únicamente por un registro eliminado lógicamente podrá reutilizarse conforme a la Decisión #5.

### Estado activo y borrado lógico

activo y deleted_at representan conceptos diferentes.

activo = false indica que el item continúa existiendo pero está deshabilitado funcionalmente.

deleted_at informado representa eliminación lógica.

### Items iniciales de un nuevo criadero

Al crear un nuevo criadero se generarán físicamente sus propios CatalogoItems iniciales.

Los valores iniciales podrán basarse en una plantilla o configuración del sistema, pero cada registro creado tendrá:

- su propio UUID;
- el criadero_id del nuevo criadero;
- su propia versión y ciclo de vida.

No existirán CatalogoItems globales compartidos directamente entre criaderos.

Esto permite que cada criadero modifique posteriormente sus valores sin afectar a otros criaderos.

### Pendientes

Quedan para implementación posterior:

- seeder o plantilla concreta de valores iniciales;
- formato de los códigos;
- longitudes físicas de texto;
- índices físicos;
- implementación física de unicidad considerando deleted_at;
- migración de valores V1.

(Ya resuelto: la plantilla inicial vive en `api/src/catalogs/defaultCatalogItems.ts`, ver modelo #11, y la unicidad física es el índice parcial `ux_catalogo_items_codigo_activo`.)

---

## Modelo aprobado #11: Plantilla inicial de CatalogoItems V2

Los CatalogoItems pertenecen exclusivamente a un Criadero.

No existirán CatalogoItems globales compartidos entre criaderos.

Por esta razón, los items iniciales NO serán insertados mediante una migración D1 global.

El backend mantendrá una plantilla inicial versionada y, al crear un nuevo Criadero, generará los CatalogoItems correspondientes utilizando nuevos UUID v7 y el criadero_id recién creado.

### Valores comunes

Los items creados desde la plantilla tendrán inicialmente:

- activo = true;
- deleted_at = null;
- version = 1;
- descripcion = null.

El UUID será generado al momento de crear el item.

### RAZAS

| Orden | Codigo | Nombre |
|---:|---|---|
| 1 | KIKIRIS | Kikiris |
| 2 | KIKIRIKIS_MEJORADOS | Kikirikis mejorados |
| 3 | AZTECAS | Aztecas |
| 4 | SEBRING | Sebring |
| 5 | NAGASAKI | Nagasaki |
| 6 | KIRI | Kiri |
| 7 | FANTASIA | Fantasía |
| 8 | SERAMA | Serama |
| 9 | OTRO | Otro |

### SEXOS

| Orden | Codigo | Nombre |
|---:|---|---|
| 1 | MACHO | Macho |
| 2 | HEMBRA | Hembra |

### ENFERMEDADES

Los valores provienen de la tabla heredada `enfermedades_catalogo` de V1 (`src/database/migrationV2.js:15-49`), que ningún código de `src/` lee. **V1 no siembra estos valores en `catalogo_items`**: `migrationV7.js:7-29` y `seeders.js:68` crean el catálogo `ENFERMEDADES` vacío, y `SaludRepository.js:34` lee `catalogo_items`. En una instalación nueva de V1 el selector sale vacío. Se mantienen en la plantilla V2 por decisión del usuario (2026-10-29).

V1 no tenía un orden explícito para estos valores, por lo que orden será null inicialmente.

| Codigo | Nombre |
|---|---|
| COCCIDIA | Coccidia |
| CORIZA | Coriza |
| GRIPE | Gripe |
| OTRO | Otro |

### MEDICAMENTOS

Los valores provienen de la tabla heredada `medicamentos_catalogo` de V1 (`src/database/migrationV2.js:32-66`), que ningún código de `src/` lee. **V1 no siembra estos valores en `catalogo_items`**: `migrationV7.js:7-29` y `seeders.js:85` crean el catálogo `MEDICAMENTOS` vacío, y `SaludRepository.js:78` lee `catalogo_items`. Se mantienen en la plantilla V2 por decisión del usuario (2026-10-29).

V1 no tenía un orden explícito para estos valores, por lo que orden será null inicialmente.

| Codigo | Nombre |
|---|---|
| VITAMINA | Vitamina |
| ANTIBIOTICO | Antibiótico |
| ANTIPARASITARIO | Antiparasitario |
| OTRO | Otro |

### ALIMENTOS

Estado real hoy (código y migraciones): sin CatalogoItems iniciales. V1 define el catálogo pero no contiene valores sembrados.

Decidido el 2026-10-29, **pendiente de implementar** (la plantilla sigue en 38): `MORICHILLO` (Morichillo) y `BALANCEADO` (Balanceado). Ver `documents/specs/catalogos.md`.

### BEBIDAS

Estado real hoy (código y migraciones): sin CatalogoItems iniciales. V1 define el catálogo pero no contiene valores sembrados.

Decidido el 2026-10-29, **pendiente de implementar** (la plantilla sigue en 38): `AGUA` (Agua) y `AGUA_VITAMINA` (Agua con vitamina). Ver `documents/specs/catalogos.md`.

### CATEGORIAS_FINANCIERAS

| Orden | Codigo | Nombre |
|---:|---|---|
| 1 | VENTA_AVE | Venta de ave |
| 2 | VENTA_HUEVOS | Venta de huevos |
| 3 | ALIMENTO | Alimento |
| 4 | MEDICAMENTO | Medicamento |
| 5 | INFRAESTRUCTURA | Infraestructura |
| 6 | COMPRA_AVE | Compra de ave |
| 7 | OTRO | Otro |
| 8 | ENVIO_AVE | Envío de ave |

ENVIO_AVE se considera parte de la plantilla inicial V2 por decisión del usuario (2026-10-29). En V1 solo lo inserta `migrationV6.js:53-73` mediante un `INSERT … SELECT` sobre el catálogo `CATEGORIAS_FINANCIERAS`, que se crea después (`migrationV7.js`, `seeders.js`): por el orden de ejecución, una instalación nueva de V1 no lo siembra (deducción del código, no probada con una base real). El código de V1 sí lo usa como texto (`BajaAveRepository.js:343`, `FinanzasRepository.js:480`).

### ESPECIES, TIPOS_CRIADERO y FINALIDADES_CRIADERO (onboarding)

Añadidos por el onboarding (migración `0004` crea los catálogos globales; los items salen de la plantilla en código). No provienen de V1.

| Catálogo | Orden | Codigo | Nombre |
|---|---:|---|---|
| ESPECIES | 1 | GALLINA_GALLO | Gallina / Gallo |
| ESPECIES | 2 | PATO | Pato |
| ESPECIES | 3 | PAVO | Pavo |
| ESPECIES | 4 | CODORNIZ | Codorniz |
| ESPECIES | 5 | OTRA | Otra |
| TIPOS_CRIADERO | 1 | CRIANZA | Cría |
| TIPOS_CRIADERO | 2 | REPRODUCCION | Reproducción |
| TIPOS_CRIADERO | 3 | MIXTO | Mixto |
| FINALIDADES_CRIADERO | 1 | VENTA | Venta |
| FINALIDADES_CRIADERO | 2 | CONSUMO | Consumo propio |
| FINALIDADES_CRIADERO | 3 | EXPOSICION | Exhibición |

El alcance funcional sigue siendo el de aves individuales, aunque `ESPECIES` ofrezca más opciones.

### Cantidad inicial

Un nuevo Criadero recibe:

- 9 Razas;
- 2 Sexos;
- 4 Enfermedades;
- 4 Medicamentos;
- 0 Alimentos;
- 0 Bebidas;
- 8 Categorías financieras;
- 5 Especies;
- 3 Tipos de criadero;
- 3 Finalidades.

Total inicial: **38** CatalogoItems (27 del dominio y 11 del onboarding). La versión original de este modelo indicaba 27. De los 27 del dominio, V1 siembra de verdad 18 en una instalación nueva (9 razas, 2 sexos y 7 categorías financieras); los otros 9 son 8 enfermedades y medicamentos de tablas heredadas más `ENVIO_AVE`, que se mantienen por decisión del usuario. Decidido el 2026-10-29, pendiente de implementar: la plantilla pasa a **42** ítems (`MORICHILLO`, `BALANCEADO`, `AGUA`, `AGUA_VITAMINA`).

### Regla de creación

La plantilla contiene solamente las definiciones iniciales.

Al crear un Criadero:

1. se obtiene su criadero_id;
2. se recorren los valores de la plantilla;
3. cada CatalogoItem recibe un UUID v7 nuevo;
4. se asigna el catalogo_id global correspondiente;
5. se asigna el criadero_id recién creado;
6. se insertan los items como registros independientes del nuevo criadero.

No se compartirán UUID de CatalogoItems entre criaderos.

---

## BORRADOR, no aprobado: modelo futuro de negocio

**Estado:** BORRADOR, no aprobado. El DDL de esta sección es una propuesta técnica construida a partir del esquema de V1, las decisiones online-first, UUID v7, aislamiento por `criadero_id` y soft delete/`version`. **No fue aprobado ni ejecutado, y no debe copiarse como migración.** Origen: `documents/traspaso/CIERRE_FINAL_TRASPASO_CRIADERO_KIKIRIKIS_V2.md`, sección 3 (reproducido literalmente más abajo).

**Las specs de cada módulo (`documents/specs/`) se redactan desde el código real de V1, no desde este DDL.** Este borrador solo es un punto de partida para el esquema; cuando contradiga el código de V1 o una decisión aprobada, prevalecen estos últimos.

Cubre: `jaulas`, `aves`, `huevos`, `diagnosticos_ave`, `tratamientos_ave`, `bajas_ave`, `movimientos_financieros`, `movimientos_financieros_historial`, `ave_evolucion`, `ave_historial`, `jaula_historial`, `alimentacion_jaula`, `bebida_jaula` y `sanidad_jaula`. No incluye tablas de clientes ni de producción (se derivan de bajas y huevos).

### Puntos a validar contra el código real de V1 antes de crear migraciones

Los tres primeros son los que ya se identificaron como críticos:

1. **`HEMRA` / `HEMBRA`.** El análisis de V1 muestra el valor `HEMRA` para el sexo del ave; el catálogo y la plantilla usan `HEMBRA`. Verificar en el código de V1 si es un error real y cómo se mapean los datos históricos. El borrador modela el sexo con `sexo_item_id` (referencia a `catalogo_items`).
2. **Dinero: `REAL` o enteros en centavos.** El borrador usa `REAL` (`valor`, `valor_venta`, `valor_envio`, `valor_anterior`, `valor_nuevo`). Decidir el tipo y la moneda/redondeo antes de crear finanzas.
3. **Soft delete de `movimientos_financieros`.** El borrador le da `deleted_at`, pero su historial usa `ON DELETE CASCADE`. Comprobar en V1 cómo se corrigen o anulan los movimientos y decidir la política.

Otros puntos detectados al comparar el borrador con las decisiones aprobadas y con V1:

4. **Origen de los movimientos.** El borrador conserva `origen_tipo`, `origen_id` y `ave_id`; la decisión #6 los reemplaza por `baja_ave_id` (relación explícita con `bajas_ave`). Resolver cuál prevalece y alinear `movimientos_financieros_historial.origen_*`.
5. **Campos estándar incompletos.** La decisión #4 exige `updated_at`, `deleted_at` y `version` en las entidades de negocio; varias tablas del borrador no los tienen (por ejemplo `huevos`, `diagnosticos_ave`, `tratamientos_ave`, `bajas_ave`, `ave_evolucion`, los historiales y los cuidados de jaula). Decidir por tabla cuáles son eventos inmutables.
6. **`ON DELETE CASCADE` frente a soft delete.** V1 no borra físicamente aves ni jaulas (usa bajas y desactivación); revisar cada `CASCADE`/`SET NULL` contra ese comportamiento.
7. **Catálogos: referencia o texto.** El borrador guarda `*_item_id` y un respaldo `*_texto` (enfermedad, medicamento, tipo de alimento y de bebida, categoría). V1 guarda texto; decidir si se conservan ambos y cómo se migran los valores históricos (decisión #1).
8. **Unicidad.** `huevos.codigo` es único sin considerar `deleted_at`; decidir si hay una sola baja por ave; verificar la unicidad de `codigo` de aves y jaulas contra V1 (por criadero, entre activos).
9. **Estados y dominios.** Los `CHECK` de estado (por ejemplo `diagnosticos_ave.estado` solo `ACTIVO`, `huevos.estado` solo `REGISTRADO`, `sanidad_jaula.tipo` libre) deben confirmarse en el código de V1 y en los flujos de `FinalizarTratamiento`.
10. **Tipos y obligatoriedad.** `cantidad TEXT` en alimentación y bebida, `edad_meses_compra`, campos opcionales y obligatorios por pantalla, y la zona horaria de las fechas.
11. **Fotos en R2.** El borrador usa `foto_r2_key`; la convención del proyecto es `r2_object_key`. Definir nombres y el patrón de claves (aislamiento por usuario y criadero) junto con la fase de R2.
12. **Índices y paginación.** Los índices no están acordados (validar con `EXPLAIN QUERY PLAN`); la convención de paginación tampoco.
13. **Clientes y producción.** Se derivan de `bajas_ave` (ventas) y `huevos`; por ahora no tienen tablas propias.

### Decisiones posteriores al borrador (2026-10-29)

> **Regla del proyecto (2026-10-29): replicar V1.** La app V1 conserva su comportamiento y solo cambia dónde guarda los datos; solo se permiten las diferencias que exija el paso a online (UUID v7, `criadero_id`, R2, autenticación, errores de red). Quedan **revocadas** las viñetas marcadas así más abajo (validaciones y reglas más estrictas que V1) y se mantienen las técnicas. Ver el bloque de decisiones revocadas de cada spec en `documents/specs/`.

El DDL literal de abajo no se edita; estas decisiones lo corrigen cuando se creen las migraciones (ver `documents/specs/aves.md`):

- **Orden de migraciones:** Jaulas antes que Aves. `0005` = SOLO `jaulas`; `0006` = `aves`, `ave_evolucion`, `ave_historial` y `jaula_historial` (`jaula_historial` referencia `aves`, por eso va después), con FK real y `ON DELETE RESTRICT` (el borrador usa `SET NULL` en `aves.jaula_actual_id`). Las tablas de cuidados de jaula (`alimentacion_jaula`, `bebida_jaula`, `sanidad_jaula`) irán después de `0006`, en otra spec. Las migraciones aún no se han creado. **Se mantiene (técnico).**
- **[REVOCADA 2026-10-29] Raza (precisión):** la raza se compara sin distinguir mayúsculas contra `RAZAS` del criadero y se guarda el nombre del catálogo (no el texto recibido); el sexo se valida por código `MACHO`/`HEMBRA` contra `SEXOS`. Aprobado por el usuario, 2026-10-29.
- **[REVOCADA 2026-10-29] Marcas de tiempo (propuesta de Claude):** el servicio escribe `created_at`/`updated_at` en ISO 8601 UTC; `DEFAULT CURRENT_TIMESTAMP` queda solo como respaldo (spec aves, R-P3a). Decidida por criterio de paridad con servidor más estricto, 2026-10-29.
- **`diagnosticos_ave.estado` admite `CERRADO`:** el borrador (`CHECK (estado IN ('ACTIVO'))`) debe ampliarse a `('ACTIVO','CERRADO')`. El valor viene del flujo "Finalizar tratamiento" de v1.0.0 (`UPDATE diagnosticos_ave SET estado='CERRADO' WHERE ave_id=? AND estado='ACTIVO'`), que se replica por completo en V2 (**se mantiene**; el rechazo si el ave no está EN_TRATAMIENTO sí queda revocado). Resuelve el punto 9 para este campo.
- **Raza y sexo del ave:** texto como V1 (no `raza_item_id`/`sexo_item_id` como en el borrador): **se mantiene**; la validación contra el catálogo y "raza obligatoria y sexo siempre" en el servidor quedan **[REVOCADAS 2026-10-29]**. Resuelve el punto 7 para el ave.
- **[REVOCADAS 2026-10-29] Una sola baja por ave** (punto 8) y zona horaria fija `America/Guayaquil` con fechas `YYYY-MM-DD` y marcas ISO UTC (punto 10): se replican los formatos de V1.
- **Fotos:** diferidas a la fase de R2; mientras tanto opcionales y sin poder quitarse al editar (punto 11 sigue abierto para el nombre de la clave).

### DDL (literal del cierre de traspaso, sección 3.1)

```sql
-- BORRADOR, NO EJECUTAR DIRECTAMENTE

PRAGMA foreign_keys = ON;

CREATE TABLE jaulas (
    id TEXT PRIMARY KEY NOT NULL,
    criadero_id TEXT NOT NULL,
    codigo TEXT NOT NULL,
    nombre TEXT,
    ubicacion TEXT,
    tipo TEXT,
    estado_sanitario TEXT NOT NULL DEFAULT 'NORMAL'
        CHECK (estado_sanitario IN (
            'NORMAL',
            'LIMPIEZA',
            'FUMIGACION',
            'QUEMADURA',
            'CUARENTENA'
        )),
    activa INTEGER NOT NULL DEFAULT 1 CHECK (activa IN (0, 1)),
    fecha_desactivacion TEXT,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    deleted_at TEXT,
    version INTEGER NOT NULL DEFAULT 1 CHECK (version >= 1),

    FOREIGN KEY (criadero_id)
        REFERENCES criaderos(id)
        ON DELETE RESTRICT
        ON UPDATE RESTRICT
);

CREATE UNIQUE INDEX ux_jaulas_codigo_activo
    ON jaulas(criadero_id, codigo)
    WHERE deleted_at IS NULL;

CREATE INDEX ix_jaulas_criadero_activa
    ON jaulas(criadero_id, activa, deleted_at);

CREATE TABLE aves (
    id TEXT PRIMARY KEY NOT NULL,
    criadero_id TEXT NOT NULL,
    codigo TEXT NOT NULL,
    origen TEXT NOT NULL
        CHECK (origen IN ('NACIDA_CRIADERO', 'COMPRADA')),
    fecha_nacimiento TEXT,
    edad_meses_compra INTEGER,
    fecha_ingreso TEXT,
    criadero_origen TEXT,
    metodo_envio TEXT,

    raza_item_id TEXT,
    sexo_item_id TEXT,

    peso_gramos REAL,
    altura_cm REAL,
    largo_cm REAL,
    caracteristicas TEXT,

    foto_r2_key TEXT,

    padre_id TEXT,
    madre_id TEXT,
    jaula_actual_id TEXT,

    estado TEXT NOT NULL DEFAULT 'ACTIVA'
        CHECK (estado IN ('ACTIVA', 'VENDIDA', 'FALLECIDA')),

    estado_salud TEXT NOT NULL DEFAULT 'SANA'
        CHECK (estado_salud IN ('SANA', 'EN_TRATAMIENTO', 'ENFERMA')),

    fecha_ultimo_control_salud TEXT,

    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    deleted_at TEXT,
    version INTEGER NOT NULL DEFAULT 1 CHECK (version >= 1),

    FOREIGN KEY (criadero_id)
        REFERENCES criaderos(id)
        ON DELETE RESTRICT
        ON UPDATE RESTRICT,

    FOREIGN KEY (raza_item_id)
        REFERENCES catalogo_items(id)
        ON DELETE SET NULL
        ON UPDATE RESTRICT,

    FOREIGN KEY (sexo_item_id)
        REFERENCES catalogo_items(id)
        ON DELETE SET NULL
        ON UPDATE RESTRICT,

    FOREIGN KEY (padre_id)
        REFERENCES aves(id)
        ON DELETE SET NULL
        ON UPDATE RESTRICT,

    FOREIGN KEY (madre_id)
        REFERENCES aves(id)
        ON DELETE SET NULL
        ON UPDATE RESTRICT,

    FOREIGN KEY (jaula_actual_id)
        REFERENCES jaulas(id)
        ON DELETE SET NULL
        ON UPDATE RESTRICT
);

CREATE UNIQUE INDEX ux_aves_codigo_activo
    ON aves(criadero_id, codigo)
    WHERE deleted_at IS NULL;

CREATE INDEX ix_aves_criadero_estado
    ON aves(criadero_id, estado, deleted_at);

CREATE INDEX ix_aves_criadero_jaula
    ON aves(criadero_id, jaula_actual_id, estado, deleted_at);

CREATE INDEX ix_aves_padre
    ON aves(padre_id);

CREATE INDEX ix_aves_madre
    ON aves(madre_id);

CREATE TABLE huevos (
    id TEXT PRIMARY KEY NOT NULL,
    criadero_id TEXT NOT NULL,
    codigo TEXT NOT NULL,
    ave_id TEXT NOT NULL,
    jaula_id TEXT,
    fecha TEXT NOT NULL,
    estado TEXT NOT NULL DEFAULT 'REGISTRADO'
        CHECK (estado IN ('REGISTRADO')),
    observacion TEXT,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    version INTEGER NOT NULL DEFAULT 1 CHECK (version >= 1),

    FOREIGN KEY (criadero_id)
        REFERENCES criaderos(id)
        ON DELETE RESTRICT
        ON UPDATE RESTRICT,

    FOREIGN KEY (ave_id)
        REFERENCES aves(id)
        ON DELETE RESTRICT
        ON UPDATE RESTRICT,

    FOREIGN KEY (jaula_id)
        REFERENCES jaulas(id)
        ON DELETE SET NULL
        ON UPDATE RESTRICT
);

CREATE UNIQUE INDEX ux_huevos_codigo
    ON huevos(criadero_id, codigo);

CREATE INDEX ix_huevos_criadero_fecha
    ON huevos(criadero_id, fecha);

CREATE INDEX ix_huevos_ave_fecha
    ON huevos(ave_id, fecha);

CREATE INDEX ix_huevos_jaula_fecha
    ON huevos(jaula_id, fecha);

CREATE TABLE diagnosticos_ave (
    id TEXT PRIMARY KEY NOT NULL,
    criadero_id TEXT NOT NULL,
    ave_id TEXT NOT NULL,
    fecha TEXT NOT NULL,
    enfermedad_item_id TEXT,
    enfermedad_texto TEXT,
    sintomas TEXT,
    observacion TEXT,
    estado TEXT NOT NULL DEFAULT 'ACTIVO'
        CHECK (estado IN ('ACTIVO')),
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    version INTEGER NOT NULL DEFAULT 1 CHECK (version >= 1),

    FOREIGN KEY (criadero_id)
        REFERENCES criaderos(id)
        ON DELETE RESTRICT
        ON UPDATE RESTRICT,

    FOREIGN KEY (ave_id)
        REFERENCES aves(id)
        ON DELETE CASCADE
        ON UPDATE RESTRICT,

    FOREIGN KEY (enfermedad_item_id)
        REFERENCES catalogo_items(id)
        ON DELETE SET NULL
        ON UPDATE RESTRICT
);

CREATE INDEX ix_diagnosticos_ave_fecha
    ON diagnosticos_ave(ave_id, fecha);

CREATE INDEX ix_diagnosticos_criadero_estado
    ON diagnosticos_ave(criadero_id, estado, fecha);

CREATE TABLE tratamientos_ave (
    id TEXT PRIMARY KEY NOT NULL,
    criadero_id TEXT NOT NULL,
    diagnostico_id TEXT NOT NULL,
    ave_id TEXT NOT NULL,
    fecha TEXT NOT NULL,
    medicamento_item_id TEXT,
    medicamento_texto TEXT,
    dosis TEXT,
    observacion TEXT,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    version INTEGER NOT NULL DEFAULT 1 CHECK (version >= 1),

    FOREIGN KEY (criadero_id)
        REFERENCES criaderos(id)
        ON DELETE RESTRICT
        ON UPDATE RESTRICT,

    FOREIGN KEY (diagnostico_id)
        REFERENCES diagnosticos_ave(id)
        ON DELETE CASCADE
        ON UPDATE RESTRICT,

    FOREIGN KEY (ave_id)
        REFERENCES aves(id)
        ON DELETE CASCADE
        ON UPDATE RESTRICT,

    FOREIGN KEY (medicamento_item_id)
        REFERENCES catalogo_items(id)
        ON DELETE SET NULL
        ON UPDATE RESTRICT
);

CREATE INDEX ix_tratamientos_diagnostico_fecha
    ON tratamientos_ave(diagnostico_id, fecha);

CREATE INDEX ix_tratamientos_ave_fecha
    ON tratamientos_ave(ave_id, fecha);

CREATE TABLE bajas_ave (
    id TEXT PRIMARY KEY NOT NULL,
    criadero_id TEXT NOT NULL,
    ave_id TEXT NOT NULL,
    tipo TEXT NOT NULL CHECK (tipo IN ('MUERTE', 'VENTA')),
    fecha TEXT NOT NULL,
    causa TEXT,
    celular TEXT,
    ciudad_destino TEXT,
    cooperativa_envio TEXT,
    comprador TEXT,
    valor_venta REAL,
    valor_envio REAL,
    detalle TEXT,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    version INTEGER NOT NULL DEFAULT 1 CHECK (version >= 1),

    FOREIGN KEY (criadero_id)
        REFERENCES criaderos(id)
        ON DELETE RESTRICT
        ON UPDATE RESTRICT,

    FOREIGN KEY (ave_id)
        REFERENCES aves(id)
        ON DELETE RESTRICT
        ON UPDATE RESTRICT
);

CREATE INDEX ix_bajas_criadero_fecha
    ON bajas_ave(criadero_id, fecha, tipo);

CREATE INDEX ix_bajas_ave
    ON bajas_ave(ave_id, fecha);

CREATE INDEX ix_bajas_cliente
    ON bajas_ave(criadero_id, celular)
    WHERE tipo = 'VENTA' AND celular IS NOT NULL;

CREATE TABLE movimientos_financieros (
    id TEXT PRIMARY KEY NOT NULL,
    criadero_id TEXT NOT NULL,
    tipo TEXT NOT NULL CHECK (tipo IN ('INGRESO', 'EGRESO')),
    categoria_item_id TEXT,
    categoria_codigo TEXT,
    fecha TEXT NOT NULL,
    valor REAL NOT NULL,
    detalle TEXT,
    ave_id TEXT,
    origen_tipo TEXT NOT NULL DEFAULT 'MANUAL'
        CHECK (origen_tipo IN ('MANUAL', 'VENTA_AVE')),
    origen_id TEXT,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    deleted_at TEXT,
    version INTEGER NOT NULL DEFAULT 1 CHECK (version >= 1),

    FOREIGN KEY (criadero_id)
        REFERENCES criaderos(id)
        ON DELETE RESTRICT
        ON UPDATE RESTRICT,

    FOREIGN KEY (categoria_item_id)
        REFERENCES catalogo_items(id)
        ON DELETE SET NULL
        ON UPDATE RESTRICT,

    FOREIGN KEY (ave_id)
        REFERENCES aves(id)
        ON DELETE SET NULL
        ON UPDATE RESTRICT
);

CREATE INDEX ix_movimientos_criadero_fecha
    ON movimientos_financieros(criadero_id, fecha, tipo, deleted_at);

CREATE INDEX ix_movimientos_categoria_fecha
    ON movimientos_financieros(criadero_id, categoria_codigo, fecha, deleted_at);

CREATE INDEX ix_movimientos_origen
    ON movimientos_financieros(origen_tipo, origen_id);

CREATE TABLE movimientos_financieros_historial (
    id TEXT PRIMARY KEY NOT NULL,
    criadero_id TEXT NOT NULL,
    movimiento_id TEXT NOT NULL,
    fecha TEXT NOT NULL,
    accion TEXT NOT NULL CHECK (accion IN (
        'EDICION_MANUAL',
        'CREACION_POR_CORRECCION',
        'CORRECCION_VENTA',
        'CORRECCION_ENVIO'
    )),
    tipo_anterior TEXT,
    tipo_nuevo TEXT,
    categoria_anterior TEXT,
    categoria_nueva TEXT,
    fecha_movimiento_anterior TEXT,
    fecha_movimiento_nueva TEXT,
    valor_anterior REAL,
    valor_nuevo REAL,
    detalle_anterior TEXT,
    detalle_nuevo TEXT,
    origen_tipo TEXT,
    origen_id TEXT,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (criadero_id)
        REFERENCES criaderos(id)
        ON DELETE RESTRICT
        ON UPDATE RESTRICT,

    FOREIGN KEY (movimiento_id)
        REFERENCES movimientos_financieros(id)
        ON DELETE CASCADE
        ON UPDATE RESTRICT
);

CREATE INDEX ix_movimientos_historial_movimiento
    ON movimientos_financieros_historial(movimiento_id, fecha);

CREATE TABLE ave_evolucion (
    id TEXT PRIMARY KEY NOT NULL,
    criadero_id TEXT NOT NULL,
    ave_id TEXT NOT NULL,
    fecha TEXT NOT NULL,
    foto_r2_key TEXT,
    peso_gramos REAL,
    altura_cm REAL,
    largo_cm REAL,
    caracteristicas TEXT,
    observacion TEXT,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    version INTEGER NOT NULL DEFAULT 1 CHECK (version >= 1),

    FOREIGN KEY (criadero_id)
        REFERENCES criaderos(id)
        ON DELETE RESTRICT
        ON UPDATE RESTRICT,

    FOREIGN KEY (ave_id)
        REFERENCES aves(id)
        ON DELETE CASCADE
        ON UPDATE RESTRICT
);

CREATE INDEX ix_ave_evolucion_ave_fecha
    ON ave_evolucion(ave_id, fecha);

CREATE TABLE ave_historial (
    id TEXT PRIMARY KEY NOT NULL,
    criadero_id TEXT NOT NULL,
    ave_id TEXT NOT NULL,
    jaula_id TEXT,
    tipo_evento TEXT NOT NULL CHECK (tipo_evento IN (
        'ALTA',
        'CAMBIO_JAULA',
        'SALUD',
        'POSTURA_HUEVO',
        'EVOLUCION',
        'VENTA',
        'MUERTE'
    )),
    fecha TEXT NOT NULL,
    detalle TEXT,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (criadero_id)
        REFERENCES criaderos(id)
        ON DELETE RESTRICT
        ON UPDATE RESTRICT,

    FOREIGN KEY (ave_id)
        REFERENCES aves(id)
        ON DELETE CASCADE
        ON UPDATE RESTRICT,

    FOREIGN KEY (jaula_id)
        REFERENCES jaulas(id)
        ON DELETE SET NULL
        ON UPDATE RESTRICT
);

CREATE INDEX ix_ave_historial_ave_fecha
    ON ave_historial(ave_id, fecha);

CREATE TABLE jaula_historial (
    id TEXT PRIMARY KEY NOT NULL,
    criadero_id TEXT NOT NULL,
    jaula_id TEXT NOT NULL,
    ave_id TEXT,
    tipo_evento TEXT NOT NULL CHECK (tipo_evento IN (
        'INGRESO_AVE',
        'SALIDA_AVE',
        'ALIMENTACION',
        'BEBIDA',
        'SANIDAD'
    )),
    fecha TEXT NOT NULL,
    detalle TEXT,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (criadero_id)
        REFERENCES criaderos(id)
        ON DELETE RESTRICT
        ON UPDATE RESTRICT,

    FOREIGN KEY (jaula_id)
        REFERENCES jaulas(id)
        ON DELETE CASCADE
        ON UPDATE RESTRICT,

    FOREIGN KEY (ave_id)
        REFERENCES aves(id)
        ON DELETE SET NULL
        ON UPDATE RESTRICT
);

CREATE INDEX ix_jaula_historial_jaula_fecha
    ON jaula_historial(jaula_id, fecha);

CREATE INDEX ix_jaula_historial_ave_fecha
    ON jaula_historial(ave_id, fecha);

CREATE TABLE alimentacion_jaula (
    id TEXT PRIMARY KEY NOT NULL,
    criadero_id TEXT NOT NULL,
    jaula_id TEXT NOT NULL,
    fecha TEXT NOT NULL,
    tipo_item_id TEXT,
    tipo_texto TEXT,
    cantidad TEXT,
    detalle TEXT,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (criadero_id)
        REFERENCES criaderos(id)
        ON DELETE RESTRICT
        ON UPDATE RESTRICT,

    FOREIGN KEY (jaula_id)
        REFERENCES jaulas(id)
        ON DELETE CASCADE
        ON UPDATE RESTRICT,

    FOREIGN KEY (tipo_item_id)
        REFERENCES catalogo_items(id)
        ON DELETE SET NULL
        ON UPDATE RESTRICT
);

CREATE INDEX ix_alimentacion_jaula_fecha
    ON alimentacion_jaula(jaula_id, fecha);

CREATE TABLE bebida_jaula (
    id TEXT PRIMARY KEY NOT NULL,
    criadero_id TEXT NOT NULL,
    jaula_id TEXT NOT NULL,
    fecha TEXT NOT NULL,
    tipo_item_id TEXT,
    tipo_texto TEXT,
    cantidad TEXT,
    detalle TEXT,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (criadero_id)
        REFERENCES criaderos(id)
        ON DELETE RESTRICT
        ON UPDATE RESTRICT,

    FOREIGN KEY (jaula_id)
        REFERENCES jaulas(id)
        ON DELETE CASCADE
        ON UPDATE RESTRICT,

    FOREIGN KEY (tipo_item_id)
        REFERENCES catalogo_items(id)
        ON DELETE SET NULL
        ON UPDATE RESTRICT
);

CREATE INDEX ix_bebida_jaula_fecha
    ON bebida_jaula(jaula_id, fecha);

CREATE TABLE sanidad_jaula (
    id TEXT PRIMARY KEY NOT NULL,
    criadero_id TEXT NOT NULL,
    jaula_id TEXT NOT NULL,
    fecha TEXT NOT NULL,
    tipo TEXT NOT NULL,
    detalle TEXT,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (criadero_id)
        REFERENCES criaderos(id)
        ON DELETE RESTRICT
        ON UPDATE RESTRICT,

    FOREIGN KEY (jaula_id)
        REFERENCES jaulas(id)
        ON DELETE CASCADE
        ON UPDATE RESTRICT
);

CREATE INDEX ix_sanidad_jaula_fecha
    ON sanidad_jaula(jaula_id, fecha);
```

### Decisiones abiertas del DDL (literal del cierre)

- IDs de catálogo vs snapshots de texto;
- `REAL` para dinero vs enteros en centavos;
- unique de una baja por ave;
- estados adicionales;
- soft delete de movimientos;
- obligatoriedad de fechas/campos;
- timezone;
- nombres de claves R2;
- estrategia de clientes.

### Referencias circulares y orden de creación (suposición, no aprobado)

- `jaulas` se crea antes que `aves` (`aves.jaula_actual_id`); `jaulas` no tiene FK hacia un ave, por lo que no hay círculo físico.
- `padre_id` y `madre_id` son FK autorreferenciadas. Para migrar datos de V1: insertar las aves con `padre_id` y `madre_id` en NULL, construir el mapa ID V1 → UUID y actualizar las referencias en una segunda pasada.
- Si una migración exige reconstruir una tabla, usar el patrón ya empleado en `0003`: tabla nueva, `INSERT … SELECT`, `DROP` de la anterior, `RENAME` y recreación de índices.

### Transacciones (suposición, no aprobado)

Deben ser atómicas con `db.batch()`:

- crear criadero + 38 items + configuración (ya implementado);
- crear ave + evolución inicial + historial + historial de jaula;
- cambiar jaula + actualizar ave + historiales de salida e ingreso;
- huevo + historial del ave;
- diagnóstico + tratamiento opcional + estado del ave + historial;
- muerte + estado del ave + baja + historial;
- venta + baja + estado + uno o dos movimientos financieros + historial;
- evolución + snapshot + actualización de valores actuales + historial;
- desactivar jaula + liberar aves + historiales;
- sanidad + estado de la jaula + historial;
- corrección financiera + historial.

R2 y D1 no comparten transacción. Flujo propuesto, sin acordar: subir el objeto temporal, validar, escribir en D1, eliminar el objeto si D1 falla y registrar un mecanismo para detectar huérfanos si la limpieza falla.

### Migración de IDs numéricos de V1 a UUID v7 (suposición, no aprobado)

No se diseñó una migración real. Propuesta: un mapa temporal (`entidad`, `legacy_id`, `new_id`); exportar V1, generar un UUID por fila, insertar primero las raíces, actualizar relaciones con el mapa, migrar imágenes a R2, validar conteos y claves foráneas, y retirar el mapa cuando se apruebe. No reutilizar el autoincrement como ID global.

### Paginación (suposición, no aprobado)

No se acordó una convención. Recomendación a aprobar antes de implementar: paginación por cursor (`limit`, `cursor`, `order`) en lugar de `offset`, con respuesta `{ "success": true, "data": { "items": [], "nextCursor": null } }`.
