# Estado actual (resumen de sesión)

Se carga solo desde `CLAUDE.md` (import). Historial: `documents/bitacora.md`. Actualizar con `/cerrar-dia`. Fecha: 2026-11-24.

## Rama y reglas de trabajo

- Rama `trabajo/migracion-nube`. Empujado hasta `467417e` (incluye `84a945d`, parches de Expo SDK 57 a ~57.0.34, y `2a103ff`, icono cuadrado 1024x1024 y `android.navigationBarColor` quitado de `app.json`). Locales sin empujar: `8b0aa69` (`eas.json`) y el commit de esta documentación. Push solo con aprobación; sin PR ni fusión a `main`.
- Cloudflare: solo `--env test` y base de pruebas, con aprobación; nunca la base de desarrollo. Expo por túnel (puerto 8090, URL solo en variables de sesión). Emulador, `/probar smoke` y `/probar completo` solo a petición; typecheck, unitarias y `/probar datos` si se toca API o dinero.

## Paquete del 2026-11-16 (en remoto)

- `742fcd4` Inicio navegable (flujo `100`). `70e0bcd` y `16ce103` colores por estado en jaulas y aves; Quemadura en naranja por decisión del usuario (flujo `101`).
- `8655cf6` Alertas de Salud solo el día UTC en que se cumplen 7 días desde el último control. Excepción aprobada a la paridad, solo en Salud.
- `e475139` Verificación de cuenta por código (`0012`, bandera apagada). `86677b6` Login con Google. `354e168` documentación y flujos corregidos.

## Cambios del 2026-11-17

- `f15a867` Google exige verificación por código (decisión A+B). Migración `0013` (`users.email_verified_via`: `NULL` = nunca probado, `'CODE'`, `'GOOGLE'`). `POST /auth/google` responde `403 GOOGLE_REQUIRES_EMAIL_VERIFICATION` si la bandera no vale `"true"`; orden: `idToken` (400), `GOOGLE_NOT_CONFIGURED` (503), bandera (403), validar token. `linkGoogle` anula `password_hash` si el marcador es `NULL`: las cuentas previas pierden la contraseña al vincular Google; sin recuperación de contraseña. Hallazgo de Google **resuelto**.
- `07f4248` `--sin-verificar` cableado en `pruebas/movil`; flujo `102` omitido sin `VERIFICATION_BYPASS_SECRET` (sigue en `esperado-fallar/`, exige bandera encendida); `95` y `96` con scroll hacia arriba (causa: Finanzas conserva el scroll).
- `f98647c` documentación y CLAUDE.md al 2026-11-17 (migraciones `0001`–`0013`, siguiente `0014`).
- Google Sign-In (ver el bloque del 2026-11-24): la ^17.0.0 y el plugin de este día quedaron reemplazados.
- Valores por defecto de verificación aceptados por el usuario: código 10 min, 5 intentos, reenvío 60 s, 5 envíos/h por correo, 5 registros/h por IP, 80/día global, borrado a 24 h sin Cron, cambio de correo con contraseña, `409` al registrar un correo verificado.
- Cloudflare: `0013` aplicada en local, integración y base remota de pruebas; Worker de pruebas desplegado (`--env test`). Bandera apagada en todos los entornos; `GOOGLE_CLIENT_IDS` sin configurar.
- Pruebas: typecheck OK; unitarias 419/419; integración 228/228; `/probar datos` 122/122 (7 omitidos). Flujos `95` y `96` VERDES. Base de pruebas: 3 cuentas, 3 criaderos, 4 jaulas, 5 aves, 0 desechables. `/probar completo` NO ejecutado: **sin completo verde del paquete** (último ROJO `2026-11-16-163400-completo`).

## Cambios del 2026-11-24 (preparación del development build de Google)

- `1857e6f` plugin de Google **quitado** de `app.json` (sin opciones aplica Firebase y rompe el build de Android sin `google-services.json`; no se añade `googleServicesFile`). La librería se enlaza por autolinking. `f499654` librería fijada en **16.1.5 exacta**; `src/api/googleAuth.js` acepta la respuesta de la 16 y de la 17. `467417e` `expo-dev-client` ~57.0.22; `8b0aa69` `environment: "development"` en `eas.json`.
- Arranque: Expo Go `npx expo start --go --tunnel --port 8090`; dev client `npx expo start --dev-client` (sin `--go`, con `expo-dev-client`, `expo start` pasa a dev client; `pruebas/movil/lib/entorno-movil.mjs` usa `--go`).
- Backend: `GOOGLE_CLIENT_IDS` debe llevar el ID del cliente **Web** (`aud`); `azp` no se valida, el ID Android no hace falta. Probar Google en el Worker de pruebas exige `EMAIL_VERIFICATION_REQUIRED` activa (apagada, `403 GOOGLE_REQUIRES_EMAIL_VERIFICATION` a propósito). `DEVELOPER_ERROR` (10) = SHA-1 o paquete mal registrados; regenerar el keystore exige registrar la SHA-1 otra vez.
- Verificado: `expo-doctor` 21/21; `expo config` prebuild sin errores; bundle Android por túnel HTTP 200; `/probar smoke` VERDE (3,5 min); typecheck OK; unitarias 418/419 (falló por tiempo «80 envíos por día»; pasa suelta en 3,4 s).
- Pasos manuales de Google, en orden: (1) proyecto de Google Cloud y consentimiento (Externo, pruebas, usuario de prueba); (2) cliente OAuth Web; (3) `eas login`; (4) variables públicas en el entorno `development` de EAS (`EXPO_PUBLIC_API_URL`, `EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID`, `EXPO_PUBLIC_DATA_SOURCE=api`; se incrustan al compilar); (5) build de desarrollo con EAS; (6) SHA-1 con `eas credentials` (comprobar contra el APK); (7) cliente OAuth Android (paquete `com.luiscaizasoria.criaderokikirikis` y esa SHA-1); (8) instalar el APK; (9) Metro con `--dev-client` (`--clear` si cambian variables). Detalle: `documents/specs/auth-verificacion-google.md`.
- Pendientes: `shell-quote` crítico (preexistente, solo desarrollo; vía `react-native` → `react-devtools-core`; no aplicar `npm audit fix` por ahora; descartado el arreglo de `minimatch` que baja a Expo 52); prueba «debe limitar a 80 envios por dia en total» con límite justo de 5 s; consentimiento de Google en modo pruebas; medir CPU de Google en Cloudflare; sin verificar: build real con EAS, icono en el launcher y Google en dispositivo.

## Módulos hechos (migraciones `0001`–`0013` aplicadas en local, integración y pruebas; siguiente `0014`; paridad con V1 salvo alertas de Salud)

| Módulo | API | Cliente app | Probado (Worker de pruebas) | Teléfono |
|---|---|---|---|---|
| Auth, criaderos, onboarding (+ `0012`, `0013` y `/auth/google`) | sí | sí | sí (datos 122/122) | email y contraseña sí; verificación y Google no |
| Jaulas (`0005`) y catálogos (42 ítems) | sí | `JaulaRepository.api.js`, `ConfiguracionRepository.api.js` | sí | sí (jaulas sin historial) |
| Aves (`0006`), cuidados (`0007`), salud (`0008`), huevos (`0009`) | sí | repositorios y fachadas (sin `actualizarEstadoSaludAve`) | sí | no |
| Genealogía y ciclo de vida (sin migración) | `GET /aves`, `GET .../evolucion` | `GenealogiaRepository`, `CicloVidaRepository` | sí (flujos `80`, `81`) | no |
| Bajas (`0010`) y finanzas (`0011`) | sí | `BajaAveRepository`, `FinanzasRepository` | sí (`90`, `91`, `95`, `96`) | no |
| Clientes, Reportes, Alertas, Inicio (sin migración, solo lectura) | sí | sus repositorios `.api.js` | sí (`98`, `97`, `99`, `94`) | no |

## Próximos pasos (en este orden)

1. Push de los commits locales (`8b0aa69` y el de documentación), con aprobación.
2. Prueba del usuario en el teléfono: 22 puntos (`documents/ux/pendiente-en-telefono.md`) y fase 6 (Bajas, Finanzas, Clientes, Reportes, Alertas, Inicio).
3. Google: validar en Expo Go (con la bandera apagada debe dar 403) y en development build con EAS siguiendo los pasos manuales del bloque del 2026-11-24 (clientes de Google Cloud por el usuario).
4. Ambientes: proveedor de correo, dominio y `EMAIL_FROM`; `vars` de `env.test` en `api/wrangler.jsonc` (`EMAIL_VERIFICATION_REQUIRED`, `EMAIL_FROM`, `GOOGLE_CLIENT_IDS`); secretos por stdin solo con orden expresa.
5. Pruebas: `/probar completo` verde del paquete; mover `102-verificar-correo` a `completo/` con la bandera encendida en el Worker de pruebas; notas de variables en `api/.dev.vars.example`, `pruebas/.entorno.local.example` y `pruebas/README.md`; `.claude/rules/api-migraciones-d1.md` dice «siguiente 0012» (lo corrige `mantenimiento-claude` a petición).
6. Luego fotos en R2 (`criaderos/{criaderoId}/aves/{aveId}/{evolucionId}.jpg`), `/auth/me`, refresh token, recuperación de contraseña, ambientes de producción, zona horaria local (alertas y periodos usan UTC) y retiro de SQLite con respaldo.

## Incidencias recurrentes

- Cloudflare error 7403 en `wrangler d1 migrations apply ... --remote`: reintentar; si persiste, `wrangler logout` y `wrangler login`.
- `/probar completo`: Expo Go «Something went wrong», cortes de red, emulador colgado, `adb` en `Broken pipe`, driver de Maestro con fallos de entorno. Si no basta: `adb emu kill` y arrancar el AVD en frío (`-no-snapshot -gpu swiftshader_indirect -dns-server 8.8.8.8,1.1.1.1`) con Start-Process desde PowerShell. Ver `pruebas/README.md`.

## Limitaciones conocidas

- Inicio: sin lector de negocio en SQLite en modo API salvo fotos (R2) y `obtenerEvolucionAve`; CPU en D1 real sin medir. Fallo de red: Inicio, Alertas, Finanzas, Reportes, Catálogo, DetalleCliente, DetalleAve y Editar movimiento muestran error con «Reintentar» (cambio visual aprobado). Genealogía muestra texto, no `Alert`.
- Bajas: V1 no libera la jaula al dar de baja (replicado). Finanzas: periodos en UTC como V1; `CREACION_POR_CORRECCION` solo cubierto por integración. Huevos: concurrencia sin probar. Reportes: `OrigenId` del CSV sale como UUID. Alertas: D-2 y D-3 abiertas.
- Salud: «Guardar diagnóstico» sin `disabled`; finalizar tratamiento no escribe `RECUPERACION`. Fotos: R2 sin hacer; `foto_r2_key` guarda la ruta local. Auth: Google sin probar en dispositivo; `/auth/me` pendiente; token de 60 min sin refresh; sin recuperación de contraseña; PBKDF2 a 100000 iteraciones: 13–20 ms de CPU.

## Excepciones aprobadas a pantallas V1 (seis)

1. `MasMenuScreen`: "Cerrar sesión" (solo modo API). 2. `AlimentacionJaulaScreen` y `BebidaJaulaScreen`: `try/catch` con `Alert`. 3. `SaludAveScreen`: `Alert` en `catch` y guarda `if (!ave)`. 4. `ProduccionHuevosScreen`: `Alert` en el `catch` de carga. 5. `GenealogiaAveScreen`: ids `String` (UUID v7), sin `Alert`. 6. Detalle en cada spec de `documents/specs/`. Otras vigentes: categorías propias en Ingreso y Egreso; alertas de Salud solo el día del plazo; pantallas de acceso nuevas (solo modo API).
