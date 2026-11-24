# Spec: auth-verificacion-google (verificación de cuenta por código; Google pendiente)

> **Regla del proyecto (2026-10-29).** La app V1 conserva pantallas, lógica y comportamiento; solo cambia dónde guarda los datos. Se replica V1 tal cual; solo se permiten las diferencias que exija el paso a online (IDs UUID v7, `criadero_id`, imágenes en R2, autenticación y errores de red).
>
> **Naturaleza de esta spec.** La verificación por código **no existe en V1** (V1 no tiene cuentas). Es una funcionalidad de **autenticación** nueva pedida por el usuario para impedir cuentas falsas; entra como excepción técnica de "autenticación". Las reglas nuevas (límites, rechazos) se limitan a los endpoints de acceso y se listan abajo; el resto de la API no cambia. Con la bandera en OFF el comportamiento es idéntico al actual.

## Estado

implementada (2026-11-16, commits `e475139` y `86677b6`, ya en remoto tras el push del 2026-11-17); revisor APROBADO. Los cambios del 2026-11-17 (migración `0013`, bloqueo de Google con bandera apagada, cableado `--sin-verificar`) ya están en commits; la preparación del development build (librería fijada, plugin retirado, `expo-dev-client`, `eas.json`) se hizo hasta el 2026-11-24 (ver «Google (resumen)»). Verificación por código: migraciones `0012` y `0013` aplicadas en local, integración y base remota de pruebas; Worker de pruebas desplegado (`--env test`); bandera `EMAIL_VERIFICATION_REQUIRED` ausente (apagada) en todos los entornos; proveedor de correo sin elegir (la comparación de abajo no está verificada con documentación vigente). Valores por defecto de límites y vigencias **aceptados por el usuario** (2026-11-17): código 10 min, 5 intentos, reenvío 60 s, 5 envíos/h por correo, 5 registros/h por IP, 80 envíos/día global, borrado a las 24 h sin Cron, cambio de correo con contraseña y `409` al registrar un correo ya verificado.

Pruebas del 2026-11-17: typecheck OK; unitarias 419/419; integración 228/228; `git diff --check` limpio; `/probar datos` 122/122 (7 omitidos sin secreto; caso `18-verificacion`). Flujo `102-verificar-correo`: sigue en `esperado-fallar/`; el cableado `--sin-verificar` ya existe en `pruebas/movil` (`preparar.mjs`, `ejecutar.mjs`, `ejecutar-flujo.sh`; código de salida 4 = OMITIDO) y el flujo se omite con mensaje claro si falta `VERIFICATION_BYPASS_SECRET`, pero además necesita la bandera encendida en el Worker (no se enciende), así que no pasa a `completo/` todavía.

Google (resumen, actualizado 2026-11-24): `POST /api/v1/auth/google` y botón «Continuar con Google».
- **Librería fijada en `@react-native-google-signin/google-signin` 16.1.5 exacta** (commit `f499654`; validada con Expo 57 y RN 0.86.3 en otro proyecto). Sustituye a la ^17.0.0 instalada el 2026-11-17. `src/api/googleAuth.js` acepta la respuesta de la 16 y de la 17 (`resultado.type` y `resultado.data.idToken`, o `resultado.idToken`) y no usa nada exclusivo de la 17. Solo development build, no Expo Go.
- **Plugin retirado de `app.json`** (commit `1857e6f`). Sin opciones, el plugin aplica la configuración de Firebase y rompe el build de Android sin `google-services.json` (comprobado por el usuario en otro proyecto con Expo 57). No se añade `googleServicesFile`. La librería se enlaza por autolinking (aparece en `autolinkedModules` de `npx expo config --type prebuild`). Esto sustituye lo dicho antes sobre «plugin sin opciones».
- **Development build**: `expo-dev-client` ~57.0.22 instalado (commit `467417e`). `eas.json` ya tenía el perfil `development` (`developmentClient`, `internal`, `appVersionSource` remote) y se le añadió `environment: "development"` (commit `8b0aa69`). Arranque en Expo Go: `npx expo start --go --tunnel --port 8090`; en dev client: `npx expo start --dev-client`. Sin `--go`, con `expo-dev-client` instalado, `expo start` pasa a dev client; el ejecutor de pruebas (`pruebas/movil/lib/entorno-movil.mjs`) arranca Metro con `--go`.
- El `require` de la librería en `src/api/googleAuth.js` va dentro de un `try`: en Expo Go solo queda el aviso (comprobación en Expo Go real pendiente).
- Backend (`api/src/auth/google-token.ts`, ~líneas 97-102): `jwtVerify` valida `aud` contra la lista `GOOGLE_CLIENT_IDS` e `iss` contra `GOOGLE_ISSUERS`; `azp` no se lee ni se valida. El ID token traerá `aud` = ID de cliente Web y `azp` = ID de cliente Android, así que `GOOGLE_CLIENT_IDS` debe contener el ID del cliente **Web**; el ID Android no hace falta en la lista.
- Para probar Google en el Worker de pruebas hace falta `EMAIL_VERIFICATION_REQUIRED` activa; mientras esté apagada, `/auth/google` responde `403 GOOGLE_REQUIRES_EMAIL_VERIFICATION` a propósito. `GOOGLE_CLIENT_IDS` sigue sin configurar en el Worker de pruebas (`503 GOOGLE_NOT_CONFIGURED`).
- `DEVELOPER_ERROR` (código 10) = SHA-1 o paquete mal registrados; si se regenera el keystore hay que registrar la SHA-1 de nuevo.
- Verificado el 2026-11-24: `expo-doctor` 21/21; `npx expo config --type prebuild` sin errores; bundle Android por el túnel HTTP 200; `/probar smoke` VERDE (3,5 min); typecheck OK; unitarias 418/419 (falló por tiempo la de «80 envíos por día»; pasa suelta en 3,4 s). **Sin verificar**: el build real con EAS, el icono en el launcher y Google en dispositivo.
- Pendientes: prueba `debe limitar a 80 envios por dia en total` con límite justo de 5 s; consentimiento de Google en modo pruebas; medición de CPU de la verificación de Google en Cloudflare.

**Hallazgo del 2026-11-16: RESUELTO (2026-11-17, decisión del usuario, A y B).** El problema era que, con la bandera apagada, `register` marcaba verificadas las cuentas sin probar el correo (pre-registro y toma de cuenta al vincular Google). Resolución:
- (A) `POST /auth/google` responde `403 GOOGLE_REQUIRES_EMAIL_VERIFICATION` («El acceso con Google no está disponible por ahora.») si `EMAIL_VERIFICATION_REQUIRED` no vale exactamente `"true"`. Orden de comprobaciones: `idToken` requerido (`400 VALIDATION_ERROR`) -> `GOOGLE_NOT_CONFIGURED` (`503`) -> bandera apagada (`403`) -> validar el token.
- (B) Migración `0013`: `users.email_verified_via TEXT` (`NULL` = correo nunca probado; `'CODE'` = verificación por código; `'GOOGLE'`). Las filas existentes quedan `NULL`. `linkGoogle` anula `password_hash` si el marcador es `NULL` y escribe `COALESCE(email_verified_via,'GOOGLE')`; `register` con la bandera apagada deja `NULL`.
- Consecuencia aceptada: las cuentas previas con marcador `NULL` pierden su contraseña la primera vez que vinculan Google, y no hay recuperación de contraseña (fuera de alcance).
- Esto sustituye a la parte «Riesgo de vinculación con bandera OFF» y a la regla de vinculación de las secciones de Google de más abajo (diseño original: la vinculación decidía por `email_verified_at`; el código real decide por `email_verified_via`).

Pendientes manuales (orden expresa del usuario): `vars` de `env.test` en `api/wrangler.jsonc` (`EMAIL_VERIFICATION_REQUIRED`, `EMAIL_FROM`, `GOOGLE_CLIENT_IDS`); secretos `RESEND_API_KEY` y `VERIFICATION_BYPASS_SECRET` por stdin; notas de las variables nuevas en `api/.dev.vars.example`, `pruebas/.entorno.local.example` y `pruebas/README.md`; elegir proveedor de correo y dominio; build de desarrollo con EAS y clientes de Google Cloud (orden vigente en la sección 3 de Google). El texto de abajo conserva el diseño original; donde difiera, el código real prevalece.

## Fuente del código actual

(No hay fuente V1: V1 no tiene registro ni login; todo sale del código V2 existente.)

Backend (`api/src/auth/`):
- `auth.service.ts:24-120` `register`: normaliza email, valida campos/formato (regex `:47`) y contraseña >= 8 (`:57`); `emailExists` (`:67`, incluye cuentas con `deleted_at`) y responde `409 EMAIL_ALREADY_REGISTERED` (`:68-74`; también si salta `UNIQUE` `:105-111`); hashea con PBKDF2 (`:77`); `createUser` (`:81`); **emite JWT al instante** (`:89`) y devuelve `{user:{id,email,nombre}, accessToken, expiresIn:3600}` (`:91-102`).
- `auth.service.ts:122-206` `login`: usuario inexistente o con `deleted_at` -> `401 INVALID_CREDENTIALS` "Correo o contraseña incorrectos" (`:148-154`); `active !== 1` -> `403 USER_INACTIVE` **antes** de comprobar la contraseña (`:157-163`); sin `password_hash` -> `INVALID_CREDENTIALS` (`:166-172`); contraseña errónea -> `INVALID_CREDENTIALS` (`:174-181`); éxito: JWT.
- `auth.service.ts:208-221` `generateToken`: `jose` HS256, `sub`=userId, `email`, 3600 s (`:16`).
- `auth.routes.ts:18-62` (register: 400 VALIDATION_ERROR, 409, resto 500; 201 en éxito) y `:65-112` (login: 400, 401 INVALID_CREDENTIALS, 403 USER_INACTIVE; **cualquier otro código -> 500**, `:99`). `JWT_SECRET` ausente -> `500 CONFIGURATION_ERROR` (`:22-31`, `:69-78`). Env local del router: `{DB, JWT_SECRET}` (`:10-13`); tipo global `Env` en `api/src/app.ts:17-20`.
- `auth.repository.ts:8-15` `UserInfo` (sin `email_verified_at`); `:60-73` `createUser` inserta `active = 1`; `:85-188` PBKDF2-SHA256 a 100000 iteraciones (máximo de workerd, `:83-85`), `constantTimeCompare` privada (`:177-188`).
- `auth.middleware.ts:19-91` `jwtMiddleware`: solo verifica la firma y `sub`/`email`; **no consulta D1**. Todo endpoint protegido exige este token.
- `api/src/app.ts:139` monta `/api/v1/auth`; `api/src/index.ts:1-3` exporta solo `app` (no hay `scheduled`).
- `api/wrangler.jsonc:1-26`: binding `DB` (D1); env `test` (`criadero-kikirikis-api-test`, base `criadero-kikirikis-test`); **sin `vars`, sin `triggers`, sin otros bindings**.
- `api/migrations/0001_core_schema.sql:10-22`: `users` ya tiene `email_verified_at TEXT` (nullable, hoy nunca se escribe), `google_sub TEXT UNIQUE`, `active`, `deleted_at`, `version`. Migraciones aplicadas `0001`–`0011`; siguiente `0012`. `criaderos.user_id` UNIQUE con FK `ON DELETE RESTRICT` (`:28-41`).

App (modo API; en modo SQLite estas pantallas no se cargan: `App.js:58-70`, `src/api/useSesion.js:21-53`):
- `src/api/accesoApi.js:15-31` `iniciarSesion` y `:34-51` `registrarUsuario`: ambas hacen `apiFetch(auth:false)` y luego `guardarSesion(data)` (asumen que siempre llega `accessToken`).
- `src/api/apiClient.js:19-39` `ApiError{message,status,code,data}`; `:136-178` lanza con `json.message`, `code=json.error` y `data=json` completo (el JSON de error entero); un 401 con `auth:true` cierra sesión (`:139-143`).
- `src/api/sesion.js:213-238` `guardarSesion({accessToken, expiresIn})`; token en SecureStore (`:10-14`), sin refresh.
- `src/screens/acceso/LoginScreen.js:53-98` (`entrar`; muestra `err.message` en `MensajeError` `:84-90`; botón `login-ingresar` `:136-143`; enlace a `Registro` `:147-152`), `RegistroScreen.js:56-103` (`registrar`; `:89-95`), `componentesAcceso.js:45-` (`PantallaAcceso`, `CampoContrasena`, `MensajeError`).
- `src/navigation/AccesoNavigator.js:26-71`: sin token -> `Login` y `Registro`; con token -> `SeleccionCriadero`. `App.js:296-310`: si falta token o criadero muestra `AccesoNavigator` con `autenticado = Boolean(sesion.token)`.
- Pruebas: `pruebas/datos/lib/http.mjs:24-28` `registrar()` espera 200/201 con `data.accessToken` y `data.user.id`; `pruebas/movil/lib/preparar.mjs:17,44` crea cuentas desechables con él; flujos Maestro (`flujos/lib/entrar.yaml`) entran con esas cuentas.

## Contrato (cliente de la app)

Interfaz actual: `iniciarSesion({email,password})` y `registrarUsuario({nombre,email,password})`, ambas `Promise<void>` que guardan sesión. Cambios con la bandera ON:

- `registrarUsuario(...)`: si la respuesta trae `accessToken` (bandera OFF o bypass de pruebas) -> igual que hoy; si trae `verificationRequired: true` -> **no** llama `guardarSesion` y **devuelve** `data` (`{email, expiresIn, resendAfterSeconds}`) para que `RegistroScreen` navegue a `VerificarCorreo`.
- `iniciarSesion(...)`: sin cambios; con `EMAIL_NOT_VERIFIED` lanza `ApiError` (`code`, `status 403`, `data` = JSON entero; los datos útiles están en `err.data.data = {email, hasActiveCode, resendAfterSeconds}`). `LoginScreen` lo captura y navega.
- Funciones nuevas en `accesoApi.js` (sin sesión previa, `auth:false`): `verificarCorreo({email, code})` (guarda sesión con la respuesta, igual que login), `reenviarCodigo({email})`, `cambiarCorreo({email, password, nuevoEmail})`.

## 1. Código de verificación (reglas)

| Parámetro | Valor propuesto | Notas |
|---|---|---|
| Formato | 6 dígitos (`000000`-`999999`) | `crypto.getRandomValues(Uint32Array)` con rechazo de sesgo (descartar valores >= 4 294 000 000 antes del módulo 1 000 000), relleno con ceros a la izquierda |
| Vigencia | 10 min (`expires_at = ahora + 600 000 ms`) | |
| Intentos | 5 por código; al 5.º fallo el código se invalida (queda `attempts = 5`, hay que reenviar) | Contador sumado de forma **atómica antes de comparar** (`UPDATE … SET attempts = attempts + 1 WHERE user_id = ? AND attempts < 5 AND expires_at > ? RETURNING code_hash, salt, attempts`), así peticiones paralelas no esquivan el límite |
| Espera entre reenvíos | 60 s | Se aplica con `rate_limits` por correo **exista o no** la cuenta (misma respuesta) |
| Códigos activos | uno por cuenta: `UNIQUE(user_id)`; reenviar = `INSERT … ON CONFLICT(user_id) DO UPDATE` (reemplaza hash, sal, vigencia y pone `attempts = 0`); el código anterior deja de valer | |
| Almacenamiento | `code_hash = hex(SHA-256(salt ‖ código))`, `salt` = 16 bytes aleatorios por código (base64). Nunca el código en claro | `crypto.subtle.digest('SHA-256')`: microsegundos, no consume el límite de 10 ms de CPU del plan Free (a diferencia de PBKDF2, que ya usa 13–20 ms según `documents/estado-actual.md`). El endpoint de verificar **no** ejecuta PBKDF2 |
| Comparación | tiempo constante sobre el hex; hay que exportar `constantTimeCompare` a un util compartido (hoy es privada, `auth.repository.ts:177`) | |
| Éxito | `db.batch([UPDATE users SET email_verified_at, updated_at; DELETE código])`; se emite el mismo JWT que el login | |
| Límite teórico | un código de 6 dígitos hasheado se rompe por fuerza bruta offline si se filtra la base; la vigencia de 10 min lo acota. Adivinanza en línea: <= 5 intentos por código y <= 5 envíos/hora/correo => <= 25 intentos/hora (< 0,003 % por hora) | |

### No revelar si un correo existe (estado real y propuesta)

Ya lo revelan hoy (V2 actual):
1. `POST /auth/register` -> `409 EMAIL_ALREADY_REGISTERED` (`auth.service.ts:67-74`, `:105-111`; `auth.routes.ts:46-48`). Incluso con cuentas dadas de baja (`:66`).
2. `POST /auth/login` -> `403 USER_INACTIVE` se devuelve antes de comprobar la contraseña (`auth.service.ts:157-163`), así que confirma una cuenta inactiva a quien no tiene su contraseña.
3. Tiempo de respuesta: un correo inexistente no ejecuta PBKDF2 (`:148-154`) y uno existente sí (`:174`), diferencia medible de ~13–20 ms.

Qué hace esta spec:
- `login`: mensaje genérico ya existente `INVALID_CREDENTIALS` (se conserva). `EMAIL_NOT_VERIFIED` solo se devuelve **después** de comprobar la contraseña correcta (no revela nada a quien no la conoce). Los puntos 2 y 3 no se tocan (replicar tal cual; se anotan como duda).
- `register`: se **conserva** el 409 para cuentas ya verificadas (la pantalla debe decirle al usuario que ya existe; evitarlo exige un correo "ya tienes cuenta" y respuesta uniforme: DUDA). Una cuenta **sin verificar** con el mismo correo no devuelve 409: se trata como reintento (se actualizan `nombre` y `password_hash` —nunca se probó la propiedad del correo, no hay datos que proteger— y se envía un código nuevo).
- `resend`, `verify` y `change-email`: respuestas **idénticas** exista o no el correo, esté verificado o no (ver tabla de endpoints). `verify` unifica "código incorrecto", "vencido", "inexistente" y "cuenta ya verificada" en `INVALID_VERIFICATION_CODE`; el contador de intentos en `rate_limits` por correo se aplica también a correos inexistentes.

## 2. Protección contra abuso

Tabla `rate_limits` (ventana fija). Una sola sentencia atómica por petición:

```sql
INSERT INTO rate_limits (bucket, key, window_start, count) VALUES (?1, ?2, ?3, 1)
ON CONFLICT(bucket, key) DO UPDATE SET
  count = CASE WHEN window_start <= ?4 THEN 1 ELSE count + 1 END,
  window_start = CASE WHEN window_start <= ?4 THEN ?3 ELSE window_start END
RETURNING count, window_start;
```
(`?3` = ahora; `?4` = ahora − duración de la ventana; la sintaxis `RETURNING` en D1 es del conocimiento de SQLite >= 3.35: **confirmar en la prueba de integración con D1 real**.) Si `count > máximo` -> `429 RATE_LIMITED` con `retryAfterSeconds` y cabecera `Retry-After`.

La IP sale de `CF-Connecting-IP` y se guarda como `SHA-256(ip + JWT_SECRET)` (no se guarda la IP en claro). El correo se guarda en minúsculas ya normalizado, como `SHA-256`.

| Bucket | Clave | Ventana | Máximo propuesto | Aplica a |
|---|---|---|---|---|
| `send_email` | correo | 1 h | 5 envíos (register + resend + change-email) | todo envío de código |
| `resend_cooldown` | correo | 60 s | 1 | resend (y reintento de register) |
| `register_ip` | IP | 1 h | 5 cuentas | register |
| `send_ip` | IP | 1 h | 15 envíos | register, resend, change-email |
| `verify_email` | correo | 10 min | 10 intentos | verify (incluye correos inexistentes) |
| `verify_ip` | IP | 1 h | 40 intentos | verify |
| `send_global` | `global` | 24 h | 80 envíos (por debajo de la cuota diaria del proveedor; ver sección 4) | todo envío; evita que un atacante agote la cuota y bloquee a todos |

Los números son una propuesta; no hay base en V1 (DUDA PARA EL USUARIO: confirmar, sobre todo `register_ip` si varias personas comparten red). **No se añade límite al login** (V1/V2 actual no lo tiene; fuerza bruta de contraseña queda fuera de esta spec: DUDA si se quiere).

### Cuentas sin verificar y endpoints bloqueados

- Con la bandera ON, `register` crea el usuario con `email_verified_at = NULL`, `active = 1` y **no emite JWT**. `login` con contraseña correcta y `email_verified_at IS NULL` -> `403 EMAIL_NOT_VERIFIED` sin token.
- Sin token no se puede llamar a **ningún** endpoint protegido (`jwtMiddleware`, `auth.middleware.ts:19-91`): criaderos, aves, finanzas, etc. quedan inalcanzables sin tocar sus routers ni añadir una lectura de D1 por petición. Únicos endpoints sin token: `health`, `register`, `login` y los tres nuevos.
- Tokens ya emitidos antes de activar la bandera siguen válidos (todas las cuentas existentes quedan verificadas por `0012`), por lo que no hay corte de sesiones.
- `routes`: añadir `EMAIL_NOT_VERIFIED` -> 403 en `auth.routes.ts` (hoy un código no mapeado cae a 500, `:99`).

### Borrado de cuentas sin verificar

- Criterio: `email_verified_at IS NULL AND google_sub IS NULL AND created_at < ahora − 24 h` y sin `criaderos` (no pueden tener, no tienen token). **DELETE físico** del usuario (las filas de código caen por `ON DELETE CASCADE`): un soft delete dejaría el correo bloqueado para siempre porque `emailExists` cuenta también las cuentas con `deleted_at` (`auth.service.ts:66`). (DUDA: aceptar hard delete solo para cuentas sin verificar.) Se borran también filas de `rate_limits` vencidas.
- **Cron Trigger**: `"triggers": {"crons": ["0 4 * * *"]}` y un handler `scheduled` en `api/src/index.ts` (hoy exporta solo `app`; pasaría a `{ fetch: app.fetch, scheduled }`). Según mi conocimiento (no verificado con documentación vigente en esta sesión), los Cron Triggers están disponibles en el plan Free de Workers (con tope de unos 5 por cuenta y 10 ms de CPU por invocación); **no verificado, debe confirmarlo el usuario**. Además, `triggers` no se hereda en `env.test` de `wrangler.jsonc`: habría que declararlo allí también (comportamiento de Wrangler según mi conocimiento, sin verificar). Añadir el trigger toca `wrangler.jsonc` y requiere deploy: **orden expresa del usuario**.
- **Alternativa/refuerzo (recomendada además del cron)**: limpieza oportunista dentro de `register` y `resend`: `DELETE FROM users WHERE id IN (SELECT id FROM users WHERE email_verified_at IS NULL AND google_sub IS NULL AND created_at < ? ORDER BY created_at LIMIT 20)` (acotada para no gastar CPU). Si el cron no es posible, esta basta, porque lo que hay que impedir es acumulación, no es crítico el momento.
- Nota de formato: `users.created_at` usa `CURRENT_TIMESTAMP` (`'YYYY-MM-DD HH:MM:SS'`, 0001:18); comparar con el mismo formato (`datetime('now','-24 hours')`), no con ISO con `T`.

## 3. Cuentas existentes y esquema (migración `0012`; sin crear el archivo)

`users.email_verified_at` **ya existe** (`0001_core_schema.sql:16`): no hace falta `ALTER TABLE`. Borrador de `api/migrations/0012_verificacion_cuenta.sql`:

```sql
-- Cuentas existentes: quedan verificadas (incluida la del usuario).
UPDATE users SET email_verified_at = COALESCE(created_at, CURRENT_TIMESTAMP)
 WHERE email_verified_at IS NULL;

CREATE TABLE email_verification_codes (
    id TEXT PRIMARY KEY NOT NULL,              -- UUID v7
    user_id TEXT NOT NULL UNIQUE,              -- un solo código activo por cuenta
    code_hash TEXT NOT NULL,                   -- hex(SHA-256(salt || codigo))
    salt TEXT NOT NULL,                        -- 16 bytes, base64
    expires_at INTEGER NOT NULL,               -- epoch ms
    attempts INTEGER NOT NULL DEFAULT 0,
    sent_at INTEGER NOT NULL,                  -- epoch ms
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE ON UPDATE RESTRICT
);

CREATE TABLE rate_limits (
    bucket TEXT NOT NULL,
    key TEXT NOT NULL,                         -- hash de correo o de IP, o 'global'
    window_start INTEGER NOT NULL,             -- epoch ms
    count INTEGER NOT NULL,
    PRIMARY KEY (bucket, key)
) WITHOUT ROWID;

CREATE INDEX ix_rate_limits_window_start ON rate_limits(window_start);
CREATE INDEX ix_users_sin_verificar ON users(created_at) WHERE email_verified_at IS NULL;
```

Efectos y notas:
- Con la bandera OFF, `register` escribe `email_verified_at = CURRENT_TIMESTAMP` (marca "no exige verificación", así activar la bandera después no bloquea a quien se registró con ella apagada). Con ON y sin bypass escribe `NULL`.
- El `UPDATE` masivo de `0012` es la única escritura sobre datos existentes; es idempotente. Cualquier cuenta Google futura se crea ya verificada (sección Google).
- `api/test/helpers/migrations.ts` y `LocalD1Adapter` deben cargar `0012`. Aplicar solo en local; `--remote` solo con orden expresa (base de pruebas `criadero-kikirikis-test`).
- `deleted_at`: las dos tablas nuevas no lo necesitan (V1 no tiene el concepto; son datos efímeros).

## 4. Servicio de correo

**Aviso.** No tengo acceso a la web en esta sesión. Todo lo que sigue es **según mi conocimiento (no verificado con documentación vigente en esta sesión)**; precios, cuotas y políticas de estos servicios cambian con frecuencia y deben confirmarse en la documentación de cada proveedor antes de decidir.

| | Cloudflare (Email Routing + Email Workers / Email Service) | Resend | Brevo | Amazon SES (cuarta opción) |
|---|---|---|---|---|
| Gratis | Email Routing y Email Workers gratis; el binding `send_email` envía solo a destinatarios **verificados** en Email Routing (no a cualquiera). Hubo un anuncio de un servicio de envío saliente general (Email Service) en beta; **no sé su estado, precio ni si incluye el plan Free** | ~3 000 correos/mes y ~100/día en plan gratuito | ~300 correos/día en plan gratuito (con pie "enviado con Brevo") | Sin plan gratuito permanente; pago por uso (~0,10 USD por 1 000); nivel gratuito inicial limitado a un periodo |
| Dominio propio | Necesita dominio en Cloudflare (Email Routing) | **Sí**, para enviar a terceros: sin dominio verificado solo envía desde `onboarding@resend.dev` a la dirección del dueño de la cuenta | Verificar dominio recomendado; permite verificar una dirección de remitente única sin dominio, pero con Gmail/Yahoo como remitente sufre DMARC y entra a spam o se rechaza (confirmar política actual) | No obligatorio para pruebas (identidad de correo única), pero empieza en **sandbox** (solo a direcciones verificadas) y exige solicitar acceso a producción |
| SPF/DKIM | Gestionados por Cloudflare en su dominio | Registros SPF, DKIM (y DMARC recomendado) en el DNS del dominio | Igual: registros del dominio | Igual (Easy DKIM) |
| Cualquier destinatario | **No** en modo Email Routing | Sí, con dominio verificado | Sí | Sí, tras salir de sandbox |
| Desde Workers (HTTP) | `send_email` binding / Email Worker (no es REST) | `POST https://api.resend.com/emails`, JSON, `Authorization: Bearer` (fetch directo) | `POST https://api.brevo.com/v3/smtp/email`, cabecera `api-key` | API HTTPS con firma AWS SigV4 (Web Crypto, más código y más CPU) |
| Entregabilidad | Buena si hubiera envío general; no aplicable hoy | Buena con SPF+DKIM | Aceptable; el remitente sin dominio la degrada | Buena con dominio y reputación gestionada por uno mismo |
| Pasos manuales | Activar Email Routing y dominio | Cuenta, verificar dominio (DNS), API key | Cuenta (revisión de alta posible), remitente/dominio, API key | Cuenta AWS, identidad, DKIM, solicitud de producción, IAM |

Otras alternativas con HTTP simple (MailerSend, Postmark: requieren remitente/dominio verificado y revisión de la cuenta, planes gratuitos pequeños) se descartan por lo mismo que Resend sin su sencillez.

**Recomendación: Resend**, con un dominio propio verificado. Razones: llamada `fetch` de una sola petición (cabe en el límite de CPU del Worker), cuota gratuita suficiente (por eso `send_global` = 80/día queda bajo ~100/día), entrega a cualquier destinatario con dominio verificado, y encaja con la interfaz `EnvioCorreo` (un adaptador de ~30 líneas).

**Si el usuario NO tiene dominio propio:**
- Resend sin dominio solo sirve para probar (solo envía al correo del dueño de la cuenta): **no sirve** para usuarios reales.
- Opción A (recomendada): comprar un dominio barato (por ejemplo en Cloudflare Registrar, a precio de coste; los precios se confirman en su sitio) y verificarlo en Resend; ~1 USD/mes.
- Opción B: Brevo con un remitente único verificado; funciona pero con riesgo de que los correos vayan a spam si el remitente es de Gmail; usar una dirección que no sea de proveedor gratuito masivo.
- Ninguna opción es 100 % gratuita, estable y de calidad sin dominio.

DUDA PARA EL USUARIO: ¿tiene o comprará un dominio? ¿Qué proveedor elige? ¿Confirma las cuotas vigentes del proveedor elegido?

Interfaz y estructura:
- `EnvioCorreo` (`api/src/auth/correo/envio-correo.ts`): `enviarCodigoVerificacion({to, nombre, codigo, expiraEnMinutos}): Promise<void>`; lanza `EnvioCorreoError` si el proveedor falla.
- Implementaciones: `EnvioCorreoResend` (fetch), `EnvioCorreoSimulado` (guarda en un arreglo en memoria; solo tests unitarios/integración), `EnvioCorreoNulo` (no envía; Worker de pruebas sin clave).
- Selección en `auth.factory.ts`. Variables/secretos nuevos: `RESEND_API_KEY` (secreto, `wrangler secret put` por stdin, solo con orden expresa), `EMAIL_FROM` (var). Si falta la clave con la bandera ON y sin bypass -> `500 CONFIGURATION_ERROR` (igual criterio que `JWT_SECRET`, regla de secretos).
- Contenido: asunto "Tu código de verificación de Criadero Kikirikis", cuerpo en texto y HTML con el código de 6 dígitos y "vence en 10 minutos"; sin enlaces; el nombre se escapa en HTML.

## 5. Endpoints V2

Todos bajo `/api/v1/auth`; sin token. Cuerpos JSON; correo normalizado (`trim().toLowerCase()`, formato igual al de `register`, `auth.service.ts:47`).

| # | Método y ruta | Request | Respuesta de éxito | Errores |
|---|---|---|---|---|
| 1 | `POST /auth/register` (modificado; es la **solicitud** del código) | `{email, nombre, password}` (igual que hoy) | Bandera ON: `201 {success:true, data:{verificationRequired:true, email, expiresIn:600, resendAfterSeconds:60}}` sin `accessToken`. Bandera OFF o bypass: `201` idéntico al actual | `400 VALIDATION_ERROR` (mensajes actuales); `409 EMAIL_ALREADY_REGISTERED` (solo cuenta verificada o dada de baja); `429 RATE_LIMITED`; `502 EMAIL_DELIVERY_FAILED` ("No fue posible enviar el correo. Intenta reenviar el código."; la cuenta queda sin verificar y el usuario sigue por login -> pantalla de código -> reenviar); `500 CONFIGURATION_ERROR`/`INTERNAL_ERROR` |
| 2 | `POST /auth/login` (modificado) | `{email, password}` | Igual que hoy | Los actuales + `403 EMAIL_NOT_VERIFIED` ("Debes verificar tu correo para continuar.") con `data:{email, hasActiveCode, resendAfterSeconds}`. Solo con bandera ON, contraseña correcta y `email_verified_at IS NULL`; **no emite token ni envía correo** |
| 3 | `POST /auth/verification/verify` | `{email, code}` (`code`: exactamente 6 dígitos) | `200` igual que login: `{user, accessToken, expiresIn}`; marca `email_verified_at` | `400 VALIDATION_ERROR` (campos vacíos o `code` no de 6 dígitos); `400 INVALID_VERIFICATION_CODE` ("Código incorrecto o vencido. Revisa el código o solicita uno nuevo."; mismo mensaje para incorrecto, vencido, inexistente, correo desconocido o ya verificado); `429 VERIFICATION_ATTEMPTS_EXCEEDED` (5.º intento fallido de ese código: "Demasiados intentos. Solicita un código nuevo."); `429 RATE_LIMITED` |
| 4 | `POST /auth/verification/resend` | `{email}` | `200 {success:true, data:{resendAfterSeconds:60}}` **siempre** (exista, esté verificado o no); solo envía si la cuenta existe y está sin verificar | `400 VALIDATION_ERROR`; `429 RATE_LIMITED` con `retryAfterSeconds` (cooldown de 60 s y demás buckets, igual para cualquier correo); `502 EMAIL_DELIVERY_FAILED` (solo si realmente se intentó enviar); `500` |
| 5 | `POST /auth/verification/change-email` | `{email, password, nuevoEmail}` | `200 {success:true, data:{verificationRequired:true, email:nuevoEmail, expiresIn:600, resendAfterSeconds:60}}`: actualiza `users.email` de la cuenta sin verificar y envía código nuevo (reemplaza el anterior) | `400 VALIDATION_ERROR` (formato, igual correo, campos); `401 INVALID_CREDENTIALS` (correo/contraseña; mismo mensaje actual) ; `409 EMAIL_ALREADY_REGISTERED` (el nuevo correo ya lo usa otra cuenta verificada; una sin verificar con ese correo se elimina antes); `429 RATE_LIMITED`; `502 EMAIL_DELIVERY_FAILED`. Si la cuenta ya está verificada devuelve `INVALID_CREDENTIALS` (no se puede cambiar el correo por aquí) |

Códigos nuevos: `EMAIL_NOT_VERIFIED`, `INVALID_VERIFICATION_CODE`, `VERIFICATION_ATTEMPTS_EXCEEDED`, `RATE_LIMITED`, `EMAIL_DELIVERY_FAILED`. Se reutilizan `VALIDATION_ERROR`, `EMAIL_ALREADY_REGISTERED`, `INVALID_CREDENTIALS`, `CONFIGURATION_ERROR`, `INTERNAL_ERROR`.

Notas de implementación:
- `change-email` pide la contraseña porque la cuenta sin verificar no tiene token. Usa PBKDF2 una vez (~13–20 ms, igual que login). Alternativa más simple: no crear este endpoint y que `RegistroScreen` vuelva a registrar con otro correo (la cuenta anterior sin verificar se borra sola a las 24 h); se propone el endpoint porque se pidió.
- Un `data` dentro de una respuesta de error es nuevo: hoy los errores solo llevan `error`, `message` y a veces `missingFields`. Alternativa: poner `email` en el nivel superior. DUDA técnica de contrato (no afecta a las pantallas ya existentes).
- Capas: `auth.routes.ts` (parseo y mapeo HTTP), `auth.factory.ts` (inyecta `EnvioCorreo`, reloj y generador de código para tests), `auth.service.ts` (reglas), `auth.repository.ts` (SQL). Los repositorios nuevos (`verification.repository.ts`, `rate-limit.repository.ts`) siguen el patrón actual.
- `Env` (`app.ts:17`) y el `Env` local de `auth.routes.ts:10` ganan: `EMAIL_VERIFICATION_REQUIRED?`, `RESEND_API_KEY?`, `EMAIL_FROM?`, `VERIFICATION_BYPASS_SECRET?`.

## 6. Pantallas (modo API; en modo SQLite nada cambia)

Todas con `PantallaAcceso` (`componentesAcceso.js`), `CampoTexto`, `Boton`, `useGuardaEnvio`, `useValidacion`, `MensajeError`, `Aviso`/`useAvisoExito` y tokens de `src/theme` (un solo degradado, toques >= 44, `testID`).

- **`VerificarCorreoScreen`** (nueva, `src/screens/acceso/`): título "Verifica tu correo"; subtítulo "Enviamos un código de 6 dígitos a `ab***@dominio.com`"; campo de código (`keyboardType` numérico, `maxLength` 6, filtro de dígitos con `filtroNumerico.js`, `testID verificar-codigo`); botón "Verificar" (`verificar-confirmar`, "Verificando..."); botón terciario "Reenviar código" con cuenta regresiva de 60 s deshabilitado hasta cero (`verificar-reenviar`); terciarios "Cambiar correo" (`verificar-cambiar-correo`) y "Volver a iniciar sesión". Éxito de reenvío: `Aviso` no bloqueante "Te enviamos un código nuevo". Si llega con `hasActiveCode:false` (desde login) muestra solo "Enviar código" y el campo queda oculto hasta enviar.
- **`CambiarCorreoScreen`** (nueva): campos contraseña y nuevo correo, botón "Cambiar y reenviar código"; al terminar vuelve a `VerificarCorreo` con el correo nuevo.
- **Estados de error** (mensaje bajo el campo con `MensajeError`; mismas cadenas que la API): `INVALID_VERIFICATION_CODE` (campo en rojo, conserva el foco), `VERIFICATION_ATTEMPTS_EXCEEDED` (deshabilita "Verificar" y resalta "Reenviar"), `RATE_LIMITED` (texto "Espera N segundos" con `retryAfterSeconds`), `EMAIL_DELIVERY_FAILED`, `NETWORK_ERROR` ("No fue posible conectar con el servidor.", ya existente en `apiClient.js:111`).
- **Cambios mínimos en acceso**: `RegistroScreen.registrar` (`:82-86`): si `registrarUsuario` devuelve `verificationRequired`, `navigation.navigate('VerificarCorreo', {email, ...})`. `LoginScreen.entrar` (`:84-90`): en el `catch`, si `err.code === 'EMAIL_NOT_VERIFIED'`, navegar a `VerificarCorreo` con `err.data.data`; el resto igual. `AccesoNavigator.js:48-63`: añadir las dos pantallas a la rama sin token. No hay cambios en `App.js`, `sesion.js` ni `apiClient.js`: tras `verificarCorreo` se llama `guardarSesion` y `App.js:296` pasa solo a `SeleccionCriadero`.
- **Cuenta sin verificar al iniciar sesión**: `login` -> `EMAIL_NOT_VERIFIED` -> `VerificarCorreo` (con "Enviar código" si no hay uno vigente). Si cierra la app, el flujo se reanuda iniciando sesión otra vez; la app no guarda la contraseña ni el estado pendiente.
- Se anotarán en `documents/ux/inventario-cambios.md` las pantallas nuevas y los flujos Maestro afectados (`pruebas/movil/flujos/**` buscan por texto).

## 7. Bandera y pruebas

### Bandera de activación
- `EMAIL_VERIFICATION_REQUIRED` (`"true"` activa). **Por defecto ausente = OFF** (comportamiento actual intacto: `register` emite JWT; `login` nunca devuelve `EMAIL_NOT_VERIFIED`; las rutas nuevas quedan montadas siempre y, sin códigos guardados, `verify` responde `INVALID_VERIFICATION_CODE` y `resend` el `200` uniforme sin enviar nada).
- ON solo en `env.test` de `wrangler.jsonc` (`"vars": {"EMAIL_VERIFICATION_REQUIRED": "true"}`); el nivel raíz (dev/producción) sin la variable. **Producción no se activa en esta tarea**: pasarla a ON es una decisión y un deploy posteriores.
- Modificar `wrangler.jsonc` y desplegar el Worker de pruebas requiere orden expresa del usuario; la migración `0012` en la base remota de pruebas también.

### Mecanismo solo para el Worker de pruebas
- Secreto `VERIFICATION_BYPASS_SECRET`, cargado únicamente en `--env test` con `wrangler secret put --env test` por stdin (con orden expresa). Nunca existe en el nivel raíz/producción.
- Cabecera `X-Verification-Bypass: <secreto>` en `register`: con el secreto correcto se omiten límites y envío de correo y se crea la cuenta **ya verificada** devolviendo `accessToken` como hoy -> `pruebas/datos/lib/http.mjs:24-28 registrar()` y `preparar.mjs` solo añaden la cabecera leyendo el secreto del entorno local (archivo ignorado por Git), y todos los flujos Maestro y `/probar datos` siguen funcionando sin cambios de lógica.
- Cabecera adicional `X-Verification-Test-Code: <secreto>` en `register`/`resend`: crea la cuenta **sin verificar** (flujo real, límites activos salvo el global), no envía correo y devuelve `data.codigoPrueba` en la respuesta. Permite probar la pantalla del código de la app sin leer correos: `preparar.mjs --sin-verificar` registra así, el flujo Maestro inicia sesión en la app -> `EMAIL_NOT_VERIFIED` -> introduce el código recibido como variable `CODIGO`.
- Riesgos: (1) si el secreto se filtra, cualquiera crea cuentas verificadas en la base de pruebas (solo datos de prueba; se rota con `secret put`); (2) **el código debe rechazar el bypass si el binding no está definido o es cadena vacía** (evitar `undefined === undefined`); comparación en tiempo constante; (3) el camino de bypass no debe existir efectivamente en producción: sin secreto, la cabecera se ignora (se trata como petición normal); (4) `codigoPrueba` nunca se devuelve sin secreto; (5) el secreto no viaja en la app móvil, solo en scripts de prueba.
- Alternativa descartada: dejar la bandera OFF también en test (no probaría el flujo real).

### Casos de integración (D1 local con `EnvioCorreoSimulado`; `npm run test:integration`)
`ver-01` registro ON crea usuario sin verificar, una fila de código con hash (no el código en claro) y un correo simulado; sin `accessToken` | `ver-02` registro OFF emite token y `email_verified_at` no nulo | `ver-03` login sin verificar -> 403 `EMAIL_NOT_VERIFIED` solo con contraseña correcta; con incorrecta, 401 `INVALID_CREDENTIALS` | `ver-04` verificar correcto -> token, `email_verified_at` poblado, fila de código borrada, login posterior OK | `ver-05` código incorrecto -> `INVALID_VERIFICATION_CODE`; 5 fallos -> `VERIFICATION_ATTEMPTS_EXCEEDED` y el código correcto ya no sirve | `ver-06` código vencido (reloj inyectado +10 min) | `ver-07` reenvío reemplaza código, el anterior deja de valer, intentos a 0 | `ver-08` cooldown de 60 s y respuesta idéntica para correo inexistente | `ver-09` límites por correo, por IP y global (`RATE_LIMITED` con `retryAfterSeconds`) y reinicio al vencer la ventana | `ver-10` registro repetido con cuenta sin verificar actualiza nombre/contraseña y envía código; con cuenta verificada -> 409 | `ver-11` cambio de correo (contraseña correcta/incorrecta, correo en uso, cuenta verificada) | `ver-12` migración `0012`: usuarios previos con `email_verified_at` poblado | `ver-13` limpieza: cuentas sin verificar > 24 h borradas junto a su código; verificadas y con criadero no | `ver-14` bypass: sin secreto/binding vacío/valor erróneo se ignora; con secreto crea cuenta verificada | `ver-15` fallo del proveedor -> 502 y cuenta intacta sin verificar | `ver-16` token JWT de cuenta sin verificar inexistente: ningún endpoint protegido accesible sin token (401) | `ver-17` comparación de código en tiempo constante (utilidad compartida) | `ver-18` respuesta de `verify`/`resend` indistinguible para correo inexistente.
Unitarias de `AuthService` con fakes (`api/test/helpers/fake-*.repository.ts`, reloj y generador inyectados) para `ver-01`…`ver-11`.

### Cómo se prueba la app sin leer correos reales
`/probar datos` y flujos existentes: sin cambios salvo la cabecera de bypass. Flujo nuevo `pruebas/movil/flujos/completo/NN-verificar-correo.yaml`: cuenta sin verificar por `preparar.mjs --sin-verificar` -> login en la app -> pantalla de código -> código incorrecto (error) -> código correcto -> `SeleccionCriadero`. "Reenviar" y "Cambiar correo" se cubren por `/probar datos` y la comprobación manual. Una prueba manual real con un correo del usuario (envío por el proveedor) la hace el usuario en el teléfono. No se leen buzones ni se usan correos reales en la automatización.

## Tabla D1

Ver sección 3 (`email_verification_codes`, `rate_limits`, `users.email_verified_at` existente, migración `0012`).

## Excepciones técnicas por pasar a online

- Autenticación: el registro deja de emitir sesión inmediata y exige verificar el correo (decisión del usuario; inexistente en V1).
- Límites por IP/correo y cuota global de envíos en los endpoints de acceso: abuso de un servicio abierto en Internet (no existía en V1).
- Códigos de error nuevos en autenticación y cabeceras de pruebas solo en `env.test`.
- Pantallas nuevas de acceso solo en modo API; modo SQLite intacto.

## Casos de paridad

| id | dado | cuando | entonces | evidencia |
|---|---|---|---|---|
| par-01 | Bandera OFF | `register` | Igual que hoy: 201 con `accessToken` | `auth.service.ts:91-102` |
| par-02 | Bandera OFF | `login` de cualquier cuenta | Igual que hoy; nunca `EMAIL_NOT_VERIFIED` | `auth.service.ts:122-206` |
| par-03 | Cuentas previas a `0012` | `login` con bandera ON | Entran sin verificación | migración `0012` |
| par-04 | Cualquier bandera | Login con contraseña errónea | `401 INVALID_CREDENTIALS` y mismo mensaje | `auth.service.ts:174-181` |
| par-05 | Cuenta inactiva | `login` | `403 USER_INACTIVE` antes de comprobar la contraseña (se conserva) | `auth.service.ts:157-163` |
| par-06 | Cuenta verificada | `register` con su correo | `409 EMAIL_ALREADY_REGISTERED` (se conserva) | `auth.service.ts:67-74` |
| par-07 | Modo SQLite | Arrancar la app | No se cargan pantallas de acceso | `App.js:58-70` |

## Archivos a crear o tocar

Crear:
- `api/migrations/0012_verificacion_cuenta.sql`
- `api/src/auth/verification.repository.ts`, `api/src/auth/rate-limit.repository.ts`, `api/src/auth/verification.service.ts` (o ampliar `auth.service.ts`), `api/src/auth/verification.types.ts`
- `api/src/auth/correo/envio-correo.ts`, `envio-correo-resend.ts`, `envio-correo-simulado.ts`, `envio-correo-nulo.ts`
- `api/src/shared/crypto.ts` (`constantTimeCompare`, SHA-256 hex, generador de código)
- Pruebas: `api/test/helpers/fake-verification.repository.ts`, unitarias de service, HTTP, `api/test/integration/auth-verificacion.integration.test.ts`
- App: `src/screens/acceso/VerificarCorreoScreen.js`, `src/screens/acceso/CambiarCorreoScreen.js`
- Pruebas móviles: flujo `pruebas/movil/flujos/completo/NN-verificar-correo.yaml`, opción `--sin-verificar` en `pruebas/movil/lib/preparar.mjs`, caso `pruebas/datos/casos/NN-verificacion.mjs`

Tocar:
- `api/src/auth/auth.routes.ts` (rutas nuevas, `EMAIL_NOT_VERIFIED` -> 403, Env), `auth.service.ts`, `auth.repository.ts` (`UserInfo.email_verified_at`, métodos), `auth.factory.ts`, `auth.types.ts`
- `api/src/app.ts` (tipo `Env`), `api/src/index.ts` (`scheduled`, solo si se aprueba el cron), `api/wrangler.jsonc` (`vars` en `env.test`, `triggers`; requiere orden expresa), `api/.dev.vars.example` (nombres, sin valores)
- `api/test/helpers/migrations.ts`
- App: `src/api/accesoApi.js`, `src/screens/acceso/LoginScreen.js`, `RegistroScreen.js`, `src/navigation/AccesoNavigator.js`
- `pruebas/datos/lib/http.mjs` (cabecera de bypass), `documents/ux/inventario-cambios.md`, `documents/arquitectura/modelo-datos-v2.md` y `CLAUDE.md` (migración `0012`, después de implementar; los edita otro agente)

## Google Sign-In (borrador)

> Nota 2026-11-24: lo que esta sección dice del plugin en `app.json`, de «sin librería de Google» y de `^17` es el diseño original; el estado real (librería 16.1.5 exacta, sin plugin, `expo-dev-client`) está en «Google (resumen)» arriba y prevalece.

Naturaleza: autenticación nueva (excepción técnica de "autenticación"; V1 no tiene cuentas). Con la bandera de verificación en OFF y sin `GOOGLE_CLIENT_IDS` el endpoint responde `503 GOOGLE_NOT_CONFIGURED` y nada cambia. **Aviso general:** sin acceso a la web; todo dato de librerías, Google Cloud y Expo marcado «NV» es *según mi conocimiento (no verificado con documentación vigente en esta sesión)*, y debe confirmarse antes de implementar, sobre todo para Expo SDK 57 (posterior a lo que conozco con seguridad).

### Estado real del código (base del diseño)

- `users` (`api/migrations/0001_core_schema.sql:10-22`): `google_sub TEXT UNIQUE` y `email_verified_at` **ya existen**; `password_hash TEXT` **es anulable**. No hace falta migración para Google (la `0012_verificacion_cuenta.sql` solo añade códigos y límites).
- `auth.service.ts:276-300` `login`: busca por correo, `deleted_at` -> `INVALID_CREDENTIALS`, `active !== 1` -> `USER_INACTIVE`, y **ya** devuelve `INVALID_CREDENTIALS` si `!user.password_hash` (`:294-300`) **sin ejecutar PBKDF2** (retorna antes de `verifyPassword`, `:302`). Es decir, el login por contraseña de una cuenta solo-Google ya responde bien; el cambio en `login` es mínimo (ver abajo) y consiste en documentar/probar ese camino y su diferencia de tiempo (ver riesgo).
- `auth.service.ts:591-604` `generateToken`: JWT propio HS256 3600 s; `sessionFor` (`:337-351`) devuelve `{user, accessToken, expiresIn}`. El endpoint Google reutiliza `sessionFor`.
- `auth.repository.ts:136-154` `purgeStaleUnverified` ya excluye `google_sub IS NOT NULL`. `changeUnverifiedEmail`/`changeEmail` ya rechazan cuentas sin `password_hash` (`auth.service.ts:522-529`).
- `jose` ^6.2.12 ya es dependencia de `api/package.json:14`; `jose` incluye `createRemoteJWKSet` y `jwtVerify` con `createLocalJWKSet` (para el JWKS inyectable).
- App: `src/api/accesoApi.js` (`iniciarSesion`, `registrarUsuario`, `verifyEmail`, `resendCode`, `changeEmail` + `guardarSesion(data)`); `LoginScreen.js:118-173` y `RegistroScreen.js:119-183` con `PantallaAcceso`, `Boton` (variantes `terciario`), `MensajeError`, `useGuardaEnvio`. `app.json` plugins: `expo-sqlite`, `datetimepicker`, `expo-sharing`, `expo-image-picker`; `android.package` = `com.luiscaizasoria.criaderokikirikis`; `extra.eas.projectId` ya presente. `eas.json` ya tiene perfil `development` (`developmentClient: true`, `distribution: internal`), `preview` y `production`. `package.json`: Expo `~57.0.23`, RN `0.86.3`, sin librería de Google. No existe `src/api/googleAuth.js`.

### 1. Librería para Expo SDK 57 (NV todo; NO se instala sin aprobación del usuario)

| | `@react-native-google-signin/google-signin` | `expo-auth-session` + `expo-web-browser` (+ `expo-crypto`) | Alternativa: Credential Manager / "Sign in with Google" nativo de Android (envoltorios de terceros) |
|---|---|---|---|
| Tipo | Módulo nativo (Google Sign-In / Credential Manager en Android, GIDSignIn en iOS) | JS + navegador del sistema; flujo OAuth web (PKCE) | Módulo nativo |
| Expo Go | **No** (código nativo propio) | Teóricamente sí con redirección `https`/proxy, pero Google rechaza esquemas personalizados para clientes web y el proxy `auth.expo.io` está en desuso; en la práctica poco fiable en Expo Go (NV) | No |
| Development build / EAS | **Sí**; trae config plugin (`"@react-native-google-signin/google-signin"` en `plugins`; en iOS requiere el esquema URL inverso, en Android basta el cliente OAuth) | En build propio funciona con cliente Android + esquema inverso; el provider `expo-auth-session/providers/google` figura como desaconsejado en la guía de Expo (NV) | Sí |
| Entrega idToken | Sí: `GoogleSignin.configure({webClientId})` y `signIn()` devuelve `idToken` con `aud` = ID de cliente **web** | Sí (`id_token` con flujo implícito/ código + intercambio en cliente); más piezas y errores de redirección | Sí |
| Peso aprox. | < 1 MB nativo + Play Services ya presentes en el dispositivo (NV) | ~100-200 KB JS entre los tres paquetes (NV) | similar al primero |
| UX | Hoja nativa de cuentas del teléfono (un toque) | Abre navegador/Custom Tab con login web | Hoja nativa |
| Mantenimiento | Muy usada; existe versión gratuita (la que cubre este caso) y otra de pago con más funciones (NV) | Mantenida por Expo | Menos estándar |

Cómo cambia la forma de probar: el usuario hoy prueba con **Expo Go por túnel**. Con la opción nativa, **el botón Google no funciona en Expo Go**: hace falta un *development build* (APK interno con EAS) instalado en el teléfono y abrirlo con `npx expo start --dev-client --tunnel`. Ese APK sirve también para el resto de la app (Expo Go deja de ser imprescindible) pero hay que reconstruirlo (`eas build`) cada vez que cambie algo nativo (nueva librería, plugin, `app.json`), no por cambios JS. Con `expo-auth-session` no se evita el build si se quiere un flujo fiable.

**Recomendación: `@react-native-google-signin/google-signin` en development build con EAS** (ya existe `eas.json` con el perfil `development` y `projectId`). Razones: el idToken sale directo, sin redirecciones; el flujo es el estándar para apps nativas; el backend solo recibe `idToken`. El botón debe degradarse sin romper Expo Go (sección 4). DUDA PARA EL USUARIO: ¿acepta dejar de depender de Expo Go para probar el acceso (APK de development build con EAS, cuenta de Expo, tiempo de cola del plan gratuito)? Hasta que lo apruebe no se toca `package.json` ni `app.json`.

### 2. Endpoint `POST /api/v1/auth/google`

- Sin token (como `login`). Request `{ "idToken": "<jwt de Google>" }`. Respuesta de éxito `200 {success:true, data:{user:{id,email,nombre}, accessToken, expiresIn:3600}}` (idéntica a `login`; `201` si la cuenta se crea, para distinguir; la app solo exige 200/201). El `accessToken` es el **JWT propio** (HS256, `JWT_SECRET`); el token de Google nunca se usa en otras llamadas ni se guarda.
- Capas: `auth.routes.ts` (parseo y mapeo HTTP; añade `GOOGLE_*` a `statusFor`, hoy lo no mapeado cae en 500), `auth.factory.ts` (inyecta el verificador de Google y el JWKS), `auth.service.ts` o `google-auth.service.ts` (reglas), `auth.repository.ts` (`findUserByGoogleSub`, `linkGoogle`, `createGoogleUser`). `Env` gana `GOOGLE_CLIENT_IDS?: string`.
- **Validación del id_token** (módulo `api/src/auth/google-token.ts`, función `verificarIdTokenGoogle(idToken, {clientIds, jwks, now})`), con `jose`:
  1. Formato: cadena con 3 segmentos y longitud razonable (p. ej. <= 4096) antes de verificar; si no, `400 VALIDATION_ERROR` ("idToken es requerido") o `401 INVALID_GOOGLE_TOKEN`.
  2. Firma RS256 con `jwtVerify(idToken, jwks, {algorithms:['RS256'], issuer:['https://accounts.google.com','accounts.google.com'], audience: <lista>})`; `jose` valida `exp`/`nbf` con tolerancia de reloj pequeña (`clockTolerance` 30 s, valor propuesto).
  3. `aud` ∈ `GOOGLE_CLIENT_IDS` (lista separada por comas, recortada, sin vacíos; web/Android/iOS). Con la librería recomendada el `aud` es el ID de cliente web, pero se admiten los tres por si cambia la librería. Si la lista está vacía/ausente -> `503 GOOGLE_NOT_CONFIGURED` (nunca aceptar cualquier `aud`).
  4. `sub` obligatorio (cadena no vacía); `email` obligatorio; `email_verified === true` (también aceptar la cadena `"true"`, que Google ha emitido en algunos casos, NV). Si falta o es false -> `401 GOOGLE_EMAIL_NOT_VERIFIED`.
  5. `nombre` = `name` si existe, si no la parte local del correo (V1/V2 exigen `nombre` no vacío); `email` normalizado `trim().toLowerCase()`. La foto `picture` no se guarda (no hay columna; no se inventa).
- **JWKS**: Google publica las claves en `https://www.googleapis.com/oauth2/v3/certs` (NV). Se usa `createRemoteJWKSet(new URL(...))` de `jose`, que ya cachea en memoria del isolate, respeta `Cache-Control` y vuelve a pedir las claves cuando llega un `kid` desconocido con espera mínima entre recargas (NV: parámetros `cooldownDuration`/`cacheMaxAge`; confirmar nombres y valores por defecto de `jose` 6 en la documentación). El módulo recibe el JWKS por parámetro (`JWTVerifyGetKey`): producción = `createRemoteJWKSet`, tests = `createLocalJWKSet` o función propia. El JWKS se crea una sola vez a nivel de módulo (caché por isolate). Fallo de red al obtener el JWKS o timeout -> `503 GOOGLE_UNAVAILABLE` ("No fue posible validar con Google. Intenta de nuevo."), sin 500 ni 401 (no es culpa del token).
- **CPU**: verificar RS256 con clave pública de 2048 bits es de ~1 ms o menos; cabe en los 10 ms del plan Free (NV). No hay PBKDF2 en este endpoint. La primera petición de un isolate añade un `fetch` al JWKS (E/S, no CPU).
- **Reglas de cuenta** (en este orden; todo con `sub` de Google como identidad estable):
  1. Buscar por `google_sub`. Si existe: si `deleted_at` no nulo -> `401 INVALID_GOOGLE_TOKEN` (mismo mensaje genérico); si `active !== 1` -> `403 USER_INACTIVE` (código y mensaje ya existentes, `auth.service.ts:285-291`); si no, emitir sesión. **El segundo y siguientes logins van por `google_sub`, no por correo**, así un cambio de correo en Google no crea otra cuenta ni la secuestra.
  2. Si no existe por `google_sub`, buscar por correo (`findUserByEmail`, incluye `deleted_at`):
     - Sin cuenta: crear usuario con `id` UUID v7, `password_hash` NULL, `google_sub`, `email_verified_at = CURRENT_TIMESTAMP`, `active = 1`; sin código de verificación (**Google no necesita la bandera**: el correo ya fue verificado por Google; aplica con la bandera en ON u OFF).
     - Cuenta existente con `deleted_at` -> `409 EMAIL_ALREADY_REGISTERED` (igual que register, `auth.service.ts:139-144`; sin dar más datos).
     - Cuenta existente con `active !== 1` -> `403 USER_INACTIVE`.
     - Cuenta existente con `google_sub` distinto del del token (otra cuenta Google con el mismo correo, caso raro) -> `409 GOOGLE_ACCOUNT_CONFLICT` (no se re-vincula).
     - Cuenta existente verificada (`email_verified_at` no nulo), con contraseña y sin `google_sub`: **vinculación**: `UPDATE users SET google_sub = ? ... WHERE id = ? AND google_sub IS NULL` (la condición evita carreras; si 0 filas cambian se vuelve a consultar). Conserva la contraseña. Solo procede porque `email_verified === true` en el token (paso 4 anterior).
     - Cuenta existente **sin verificar** (la creó alguien con contraseña sin probar el correo): el correo verificado por Google prueba la propiedad; se vincula y se marca `email_verified_at`, **y se anula `password_hash` y se borra su fila de `email_verification_codes`** en el mismo `db.batch`. Motivo: si no, quien registró antes el correo con una contraseña propia (ataque de "pre-registro") conservaría acceso a la cuenta del dueño real. El dueño real puede fijar contraseña después solo si en el futuro se crea un flujo de "olvidé mi contraseña" (fuera de alcance; no se inventa aquí).
  3. Respuesta de error unificada para token inválido: `401 INVALID_GOOGLE_TOKEN` ("No fue posible iniciar sesión con Google.") para firma incorrecta, `aud`/`iss` ajenos, `exp` vencido, estructura inválida, `kid` no resuelto tras reintento; no se indica cuál de las causas (sin revelar más de lo necesario). El detalle va a `console.error` sin el token. Distinto: `GOOGLE_EMAIL_NOT_VERIFIED` (401), `GOOGLE_NOT_CONFIGURED` (503), `GOOGLE_UNAVAILABLE` (503), `GOOGLE_ACCOUNT_CONFLICT` (409). Se reutilizan `VALIDATION_ERROR`, `EMAIL_ALREADY_REGISTERED`, `USER_INACTIVE`, `INTERNAL_ERROR`, `CONFIGURATION_ERROR`.
- **Cambios en `login`** (`auth.service.ts:250-335`): (a) el camino `!user.password_hash` (`:294-300`) se conserva y pasa a ser intencional (cuenta solo-Google -> `INVALID_CREDENTIALS` genérico, mismo mensaje, sin revelar que existe cuenta Google). (b) Riesgo ya existente y heredado: ese camino no ejecuta PBKDF2 (`:302`), por lo que una cuenta solo-Google responde ~13-20 ms más rápido que una con contraseña; ya ocurre hoy con correos inexistentes y se anota como duda (no se añade un PBKDF2 "fantasma", pedido del encargo). (c) Con la bandera ON el `EMAIL_NOT_VERIFIED` (`:313`) nunca aplica a cuentas Google (nacen verificadas) ni a cuentas vinculadas.
- **Interacción con `register`**: un correo de cuenta Google ya existe y está verificado -> `register` devuelve `409 EMAIL_ALREADY_REGISTERED` (como hoy); la pantalla puede sugerir "Continuar con Google". Con la bandera OFF, `register` (`auth.service.ts:160-166`) usa `emailExists`, igual.
- **Riesgo de vinculación con bandera OFF (RESUELTO el 2026-11-17 con A y B, ver Estado; texto original del riesgo):** con `EMAIL_VERIFICATION_REQUIRED` apagada, `register` marca `email_verified_at` sin probar el correo (`auth.repository.ts:85-86`, `verified: true`). Una cuenta así figura como "verificada" y la vinculación por correo la tomaría como prueba de propiedad: quien registró un correo ajeno con su propia contraseña conservaría acceso tras la vinculación. Opciones: (A) activar la verificación en el entorno antes de habilitar Google (recomendada); (B) aceptarlo solo en pruebas; (C) no vincular cuentas con contraseña, devolver `409 EMAIL_ALREADY_REGISTERED` y que el usuario use su contraseña. Se necesita decisión.
- Fuera de alcance: botón/endpoint para desvincular, "olvidé mi contraseña", fijar contraseña a una cuenta Google, refresh token, `/auth/me`.

### 3. Pasos manuales del usuario (uno por uno; no los hace el agente)

**Orden vigente (2026-11-24; sustituye al orden de la lista original de más abajo, cuyos detalles de menús siguen sirviendo).** No se escriben valores reales en el repositorio.
1. Proyecto de Google Cloud nuevo y pantalla de consentimiento (Externo, modo pruebas, usuario de prueba).
2. Cliente OAuth **Web**.
3. `eas login`.
4. Variables públicas en el entorno `development` de EAS: `EXPO_PUBLIC_API_URL`, `EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID` y `EXPO_PUBLIC_DATA_SOURCE=api` (se incrustan al compilar).
5. Build de desarrollo con EAS (genera el keystore).
6. SHA-1 con `eas credentials` (comprobar también contra el APK).
7. Cliente OAuth **Android** con el paquete `com.luiscaizasoria.criaderokikirikis` y esa SHA-1.
8. Instalar el APK.
9. Metro con `npx expo start --dev-client` (reiniciar con `--clear` si cambian las variables).

Los nombres de menús de Google Cloud y Expo cambian con frecuencia (NV). Si una pantalla no coincide, guiarse por el término equivalente.
1. **Proyecto**: entrar a console.cloud.google.com con la cuenta de Google del proyecto. Selector de proyectos (arriba) -> "Proyecto nuevo" -> nombre "Criadero Kikirikis" -> Crear. Debe ver el nombre del proyecto en la barra superior ya seleccionado.
2. **Pantalla de consentimiento**: menú "APIs y servicios" -> "Pantalla de consentimiento de OAuth" (o "Google Auth platform"). Elegir tipo de usuario **Externo**. Rellenar nombre de la app, correo de asistencia y correo del desarrollador; guardar. Dejar el estado en **"En pruebas" (Testing)**.
3. **Usuarios de prueba**: en la misma sección, "Usuarios de prueba" -> "Add users" -> agregar los correos Gmail con los que probará (el suyo y los de quien le ayude). Mientras esté en Testing solo esas cuentas pueden entrar y cualquier otra recibe error de acceso bloqueado; para abrirlo a todos hay que "Publicar app" (los ámbitos `openid`, `email` y `profile` no suelen exigir verificación de Google, NV). DUDA PARA EL USUARIO: ¿se publica al lanzar a usuarios reales?
4. **ID de cliente Web** (obligatorio, es el que valida el backend): "Credenciales" -> "Crear credenciales" -> "ID de cliente de OAuth" -> tipo **Aplicación web** -> nombre "Kikirikis Web" -> Crear (sin orígenes ni redirecciones para este flujo). Copiar el **ID de cliente** (termina en `.apps.googleusercontent.com`). El secreto de cliente no se usa y no debe copiarse en ningún sitio.
5. **Cuenta de Expo/EAS**: crear cuenta en expo.dev (si no existe) y entrar con `eas login` en la terminal. El proyecto ya trae `extra.eas.projectId` (`app.json`) y `eas.json` con el perfil `development`.
6. **SHA-1 del build**: no se puede crear el cliente Android sin él, y es **distinto según quién firme el APK**: (a) *development build o preview/production con EAS*: la firma la gestiona EAS; se ve con `eas credentials` (Android -> el perfil -> Keystore) o en expo.dev -> proyecto -> Credentials; (b) *Google Play*: con "Play App Signing" Play re-firma y el SHA-1 que vale es el de la clave de firma de la app en Play Console ("Integridad de la app"), no el de EAS; hay que registrar ambos; (c) debug local de Android Studio: otro más (no aplica si solo se usa EAS). Por eso el orden real es: ejecutar la primera `eas build --profile development --platform android` (el asistente creará el keystore al primer uso), obtener el SHA-1 y entonces crear el cliente Android.
7. **ID de cliente Android**: "Credenciales" -> "Crear credenciales" -> ID de cliente -> **Android** -> nombre de paquete `com.luiscaizasoria.criaderokikirikis` (igual que `app.json`) -> pegar el SHA-1 -> Crear. Un cliente Android por cada SHA-1 (desarrollo/EAS, Play). Su ID **no** se pasa a la librería (usa el web), pero debe existir: sin él aparece el error `DEVELOPER_ERROR` (código 10, NV). Si más adelante se quiere que el backend acepte tokens emitidos con este cliente, se añade su ID a `GOOGLE_CLIENT_IDS`.
8. **iOS**: solo si se publicará en iPhone (exige cuenta de Apple Developer de pago, NV); entonces cliente iOS con el Bundle ID y el esquema URL inverso. **No aplica ahora** (hay `ios` en `app.json` pero se prueba en Android). DUDA PARA EL USUARIO: ¿hay iPhone en el alcance?
9. **Variables**: (a) Worker de pruebas: añadir `GOOGLE_CLIENT_IDS` (ID web, y los demás separados por comas) en `vars` de `env.test` de `api/wrangler.jsonc` -> **requiere orden expresa y deploy del Worker de pruebas** (un ID de cliente no es secreto, por eso `vars` y no `secret`); producción solo con orden expresa. (b) App: `EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID` como variable de entorno de Expo/EAS (`eas env:create` o variable de la sesión local al arrancar Expo), **nunca** en archivos versionados (`app.json`, `.env` ignorado solo si ya lo está); recordar que `EXPO_PUBLIC_*` queda embebido en el APK (es un ID público, no un secreto). Debe ser el mismo ID web que en `GOOGLE_CLIENT_IDS`.
10. **Build**: tras instalar la librería y añadir el plugin (con aprobación), `eas build --profile development --platform android`; instalar el APK en el teléfono (código QR/enlace de EAS) y arrancar con `npx expo start --dev-client --tunnel`.

**No se puede automatizar** (el agente no puede ni debe): crear el proyecto, el consentimiento y los clientes (cuenta personal de Google con 2FA), leer el SHA-1 de una firma gestionada en Expo/Play, iniciar sesión en `eas`, el aviso del consentimiento y su publicación, ni instalar el APK en el teléfono. Tampoco se verifica un login real con Google en pruebas automáticas (necesita el selector de cuentas nativo y credenciales reales): solo manual en el teléfono.

### 4. App: botón «Continuar con Google»

- Ubicación: en `LoginScreen` y `RegistroScreen`, bajo el botón principal y sobre el enlace a la otra pantalla, separado por un texto "o". Variante secundaria de `Boton` con el tema vigente (tokens de `src/theme`, toque >= 44, un solo degradado por pantalla ya usado por la pantalla de acceso; sin verde ni amarillo como marca), `testID` `login-google` y `registro-google`; título "Continuar con Google", `tituloGuardando` "Conectando...". Marca de Google: usar el estilo oficial de botón blanco con la «G» (SVG con `react-native-svg`, ya instalada) por las pautas de marca de Google (NV; confirmar).
- `src/api/googleAuth.js` (nuevo, en `src/api/`): `iniciarSesionConGoogle()` carga la librería **de forma perezosa** (`require` dentro de un `try`; no `import` estático, para que Expo Go no falle al arrancar). Flujo: (1) leer `process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID`; si falta -> `Alert` "Google no está configurado en esta versión de la app."; (2) `require('@react-native-google-signin/google-signin')`; si lanza o el módulo nativo no existe (Expo Go) -> `Alert` "Para entrar con Google necesitas la versión instalada de la app (development build). En Expo Go no está disponible. Usa tu correo y contraseña."; (3) `GoogleSignin.configure({webClientId})`, `hasPlayServices()`, `signIn()`, obtener `idToken`; usuario cancela -> no hacer nada (sin Alert); (4) `apiFetch('/api/v1/auth/google', {method:'POST', auth:false, body:{idToken}})` y `guardarSesion(data)` como `iniciarSesion` (mismo patrón que `accesoApi.js:15-31`); errores de la API -> `ApiError` con `message` de la API mostrado en `MensajeError`; errores de red -> `NETWORK_ERROR` ya existente (`apiClient.js:111`). Tras `guardarSesion`, `App.js` pasa solo a `SeleccionCriadero` (sin cambios en `App.js`, `sesion.js`, `apiClient.js`).
- Modo SQLite: las pantallas de acceso no se cargan; sin cambios. `app.json` solo cambia con aprobación (plugin y, si se usa iOS, esquema).
- Se anota en `documents/ux/inventario-cambios.md` (botón nuevo y los flujos Maestro que buscan texto en Login/Registro; el botón no debe interferir con `login-ingresar` ni `registro-crear`).

### 5. Pruebas

- Unitarias de `verificarIdTokenGoogle` y del servicio con fakes (`api/test/helpers/fake-*.repository.ts`): en el test se genera un par RSA con `jose` (`generateKeyPair('RS256')`, `exportJWK` con `kid`) y se firman los id_token con `SignJWT`; el JWKS se inyecta con `createLocalJWKSet({keys:[jwk]})` (o una función que cuenta llamadas para el caso de `kid`). Reloj inyectado.
- Casos: `goo-01` token válido -> sesión con JWT propio (verificable con `JWT_SECRET`, `sub` = id de usuario, no el de Google) | `goo-02` firma incorrecta (firmado con otra clave) | `goo-03` `aud` ajena | `goo-04` `iss` ajeno (acepta ambos `accounts.google.com` y `https://accounts.google.com`) | `goo-05` `exp` vencido (y dentro de tolerancia) | `goo-06` `email_verified: false` o ausente -> `GOOGLE_EMAIL_NOT_VERIFIED` | `goo-07` correo existente **verificado con contraseña** -> vincula, conserva contraseña y la contraseña sigue funcionando | `goo-08` correo existente **sin verificar** -> vincula, queda verificada, `password_hash` NULL, código borrado, y el login con la contraseña anterior da `INVALID_CREDENTIALS` | `goo-09` usuario nuevo -> creado verificado, sin contraseña, sin código ni correo enviado, `201` | `goo-10` segundo login por `google_sub` aunque el correo del token cambie | `goo-11` `kid` desconocido: el JWKS reintenta una vez y si sigue ausente -> `INVALID_GOOGLE_TOKEN` | `goo-12` JWKS caído (la función lanza) -> `503 GOOGLE_UNAVAILABLE` | `goo-13` `GOOGLE_CLIENT_IDS` ausente o vacío -> `503 GOOGLE_NOT_CONFIGURED` y nunca acepta | `goo-14` login por contraseña de cuenta solo-Google -> `INVALID_CREDENTIALS` sin invocar `verifyPassword` | `goo-15` cuenta inactiva o dada de baja con ese `google_sub` | `goo-16` otra cuenta Google con el mismo correo -> `GOOGLE_ACCOUNT_CONFLICT` | `goo-17` token con `alg` distinto de RS256 (`none`, HS256 firmado con la clave pública como secreto) rechazado | `goo-18` vinculación concurrente: dos peticiones simultáneas no duplican ni pisan `google_sub` | `goo-19` funciona con la bandera de verificación en OFF y en ON | `goo-20` `idToken` ausente o no cadena -> `VALIDATION_ERROR`.
- Integración D1 local (`npm run test:integration`) para `goo-07`, `goo-08`, `goo-09`, `goo-10`, `goo-16` y `goo-18` (comprobar `UNIQUE(google_sub)` y el `UPDATE ... WHERE google_sub IS NULL`).
- Móvil: `googleAuth.js` con y sin librería y sin ID configurado -> `Alert` (se puede comprobar en Expo Go); el login real con Google se prueba **solo a mano** en el development build. `/probar datos` y los flujos Maestro no cambian (no cubren Google).

### Archivos a crear o tocar (Google)

Crear: `api/src/auth/google-token.ts`, `api/test/unit/auth/google-token.test.ts` (y del servicio, con fakes), `src/api/googleAuth.js`. Tocar: `api/src/auth/auth.routes.ts` (ruta, `statusFor`, `Env.GOOGLE_CLIENT_IDS`), `auth.service.ts`, `auth.repository.ts` (3 métodos y `UserInfo.google_sub`), `auth.factory.ts`, `auth.types.ts`, `api/src/app.ts` (`Env`), `api/wrangler.jsonc` (`vars` de `env.test`; orden expresa), `api/.dev.vars.example` (solo nombre), `src/screens/acceso/LoginScreen.js` y `RegistroScreen.js`, `package.json` y `app.json` (solo con aprobación del usuario). Sin migración nueva (columnas ya existentes en `0001`).

### Dudas de Google

DUDA PARA EL USUARIO: (1) aprobar el development build con EAS y dejar Expo Go sin Google; (2) política ante cuentas con contraseña creadas con la bandera OFF (A, B o C arriba); (3) publicar la app en Google (Testing frente a producción); (4) iOS en el alcance; (5) tolerancia de reloj de 30 s, `201` para cuenta nueva y mensajes de error de Google.
Dudas técnicas (no verificadas): compatibilidad de `@react-native-google-signin/google-signin` con Expo SDK 57 y RN 0.86 y su plugin; nombres exactos de `createRemoteJWKSet` en `jose` 6 (`cooldownDuration`, `cacheMaxAge`, `timeoutDuration`) y comportamiento ante `kid` desconocido; si `jwtVerify` acepta un arreglo en `issuer`; si Google emite `email_verified` como cadena; coste de CPU real de RS256 en el Worker; menús vigentes de Google Cloud; estado de `expo-auth-session` en SDK 57.

## Dudas

DUDA PARA EL USUARIO:
1. Proveedor de correo y dominio propio (sección 4); confirmar cuotas y precios vigentes del elegido.
2. Cifras de límites (sección 2): ¿están bien 5 envíos/hora por correo, 5 registros/hora por IP, 80 envíos/día globales?
3. ¿Se conserva `409 EMAIL_ALREADY_REGISTERED` en el registro (revela que el correo existe, como hoy) o se pasa a respuesta uniforme con correo "ya tienes cuenta"?
4. ¿Se acepta el borrado **físico** de cuentas sin verificar a las 24 h?
5. ¿Se quiere endpoint de cambio de correo con contraseña, o basta volver a registrarse?
6. ¿Límite de intentos en el login (fuerza bruta de contraseña)? V1/V2 no lo tienen; no se añade.
7. Cuentas registradas con la bandera OFF: se marcan verificadas en el acto (propuesta) o quedan `NULL` y se les exigirá el código al activar la bandera.

Dudas técnicas (no confirmadas en el código ni en documentación vigente):
- Cron Trigger en plan Free y herencia de `triggers` en `env.test`.
- `RETURNING` y comportamiento de `ON CONFLICT … DO UPDATE` en D1 (probar en integración).
- `CF-Connecting-IP` en el Worker de pruebas y en `wrangler dev` (puede venir vacío en local: usar clave `desconocida`).
- Estado, precio y alcance de un eventual envío general de Cloudflare.
- Forma de `data` en errores (sección 5).
