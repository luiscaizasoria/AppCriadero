# Estado actual (resumen de sesión)

Se carga solo desde `CLAUDE.md` (import). Historial: `documents/bitacora.md`. Actualizar con `/cerrar-dia`. Fecha: 2026-11-26.

## Rama y reglas de trabajo

- Rama `trabajo/migracion-nube`. Empujado, incluidos los 6 commits que estaban locales (`1ded2f4`, `9e94a46`, `45ae343`, `c6016f8`, `59b3886`, `65dda79`). Push solo con aprobación; sin PR ni fusión a `main`.
- Cloudflare: **siempre `--env test`** (el nivel superior de `api/wrangler.jsonc` apunta a desarrollo); solo con aprobación. Expo por túnel (puerto 8090; URL solo en variables de sesión). Emulador, `/probar smoke` y `/probar completo` solo a petición; typecheck, unitarias y `/probar datos` si se toca API o dinero.

## Cambios previos (2026-11-16 y 2026-11-17, en remoto)

- `742fcd4` Inicio navegable; `70e0bcd` y `16ce103` colores por estado (Quemadura en naranja, decisión del usuario); `8655cf6` alertas de Salud solo el día UTC del plazo (excepción aprobada); `e475139` verificación de cuenta por código (`0012`); `86677b6` login con Google; `354e168` y `f98647c` documentación; `07f4248` `--sin-verificar` en `pruebas/movil` y scroll de `95` y `96`.
- `f15a867` Google exige verificación por código (A+B): migración `0013` (`users.email_verified_via`: NULL, `CODE` o `GOOGLE`); `POST /auth/google` responde 403 `GOOGLE_REQUIRES_EMAIL_VERIFICATION` si la bandera no vale `"true"`. Vincular Google a una cuenta con marcador NULL anula su contraseña (sin recuperación de contraseña). Hallazgo resuelto.
- Valores de verificación aceptados por el usuario: código 10 min, 5 intentos, reenvío 60 s, 5/h por correo, 5/h por IP, 80/día, borrado a 24 h sin Cron, cambio de correo con contraseña, `409` si el correo ya está verificado.

## Cambios del 2026-11-24 (Google, correo y renombrado)

- Pushes: `84a945d` (Expo SDK 57), `2a103ff` (icono 1024, sin `navigationBarColor`), `e223480` (correo por Gmail SMTP), `f20641d` y `af4be54` (higiene de secretos), `6ff16a1` (`env.test`), `a5972ac` y docs.
- Google: plugin quitado de `app.json` (`1857e6f`; sin opciones aplicaba Firebase y rompía el build sin `google-services.json`); librería `16.1.5` exacta (`f499654`); `467417e` `expo-dev-client`; `8b0aa69` `environment: development` en `eas.json`. `GOOGLE_CLIENT_IDS` debe llevar el ID **Web**; sin él responde `GOOGLE_NOT_CONFIGURED` (503). `DEVELOPER_ERROR` (10) = SHA-1 o paquete mal registrados.
- Correo: `EMAIL_PROVIDER=gmail-smtp` con cliente SMTP propio en `api/src/auth/correo/`. Secretos `SMTP_USER`, `SMTP_PASSWORD` (contraseña de aplicación), `EMAIL_FROM`, `JWT_SECRET`, `VERIFICATION_BYPASS_SECRET`; `vars` en `env.test` (`EMAIL_FROM_NAME`, `EMAIL_VERIFICATION_REQUIRED=true`). Bandera **encendida solo en el Worker de pruebas**. Comprobado en real: registro 201, código erróneo 400, reenvío 429, código válido 200, reregistro 409. Llega a spam (sin dominio propio ni SPF/DKIM/DMARC).
- Renombrado a MiCriadero (`45ae343`, `c6016f8`, `59b3886`, `65dda79`): nombre visible, paquete de Android y correo. Sin renombrar a propósito: slug y projectId de EAS, owner, Workers, bases D1, carpeta, paquete npm, claves SecureStore, SQLite, respaldos y cuentas de prueba.
- Verificado: `expo-doctor` 21/21; typecheck OK; unitarias 433/433 (una pasada dio 418/419 por el límite de 5 s de «80 envíos por día», pasa suelta); integración 228/228; `/probar datos` 122/122 (0 omitidos); smoke VERDE; `102-verificar-correo` VERDE y en `completo/` (`9e94a46`). Las 3 cuentas de prueba tienen correo verificado (`email_verified_via` NULL).

## Cambios del 2026-11-26 (Google en pruebas y build de desarrollo)

- `GOOGLE_CLIENT_IDS` (ID de cliente Web, público) añadido a `env.test` de `api/wrangler.jsonc` y desplegado con `--env test`. `POST /auth/google` con token inválido responde 401 `INVALID_GOOGLE_TOKEN` (ya no `GOOGLE_NOT_CONFIGURED`). `EMAIL_VERIFICATION_REQUIRED` sigue encendida solo en pruebas.
- Variables públicas en EAS, entorno `development`: `EXPO_PUBLIC_API_URL`, `EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID` y `EXPO_PUBLIC_DATA_SOURCE=api`.
- Build de desarrollo de Android con EAS terminado: keystore nuevo gestionado por EAS, APK 1.0.3, SDK 57, paquete `com.luiscaizasoria.micriadero`, nombre MiCriadero.
- Expo: `npx expo start --dev-client --tunnel --port 8090` (el dev client se abre con la URL del túnel); en Expo Go, con `--go`.
- Pendiente del usuario: crear el cliente Android en Google Cloud con el paquete y la SHA-1 del keystore de desarrollo, instalar el APK y probar el botón de Google (con token real aún no probado).

## Módulos hechos (migraciones `0001`–`0013`; siguiente `0014`; paridad con V1 salvo alertas de Salud)

| Módulo | API | Cliente app | Probado (Worker de pruebas) | Teléfono |
|---|---|---|---|---|
| Auth, criaderos, onboarding (+ `0012`, `0013` y `/auth/google`) | sí | sí | sí (datos 122/122) | email y contraseña sí; verificación y Google no |
| Jaulas (`0005`) y catálogos (42 ítems) | sí | `JaulaRepository.api.js`, `ConfiguracionRepository.api.js` | sí | sí (jaulas sin historial) |
| Aves (`0006`), cuidados (`0007`), salud (`0008`), huevos (`0009`) | sí | repositorios y fachadas (sin `actualizarEstadoSaludAve`) | sí | no |
| Genealogía y ciclo de vida (sin migración) | `GET /aves`, `GET .../evolucion` | `GenealogiaRepository`, `CicloVidaRepository` | sí (flujos `80`, `81`) | no |
| Bajas (`0010`) y finanzas (`0011`) | sí | `BajaAveRepository`, `FinanzasRepository` | sí (`90`, `91`, `95`, `96`) | no |
| Clientes, Reportes, Alertas, Inicio (sin migración, solo lectura) | sí | sus repositorios `.api.js` | sí (`98`, `97`, `99`, `94`) | no |

## Próximos pasos

**Siguiente paso exacto:** crear el cliente Android en Google Cloud (paquete y SHA-1 del keystore de desarrollo), instalar el APK y probar el botón de Google.

1. Google, lo que falta (`documents/specs/auth-verificacion-google.md`): cliente Android del paquete nuevo, instalar el APK y Metro con `--dev-client --tunnel`. Validar también en Expo Go (con la bandera apagada da 403).
2. Ambientes: dominio propio y Resend; medir CPU del SMTP; centinela de `api/wrangler.jsonc`; secretos por stdin solo con orden expresa.
3. Prueba en teléfono: puntos 1-19 de `documents/ux/pendiente-en-telefono.md` y fase 6; `/probar completo` verde del paquete (sin ejecutar).
4. Notas de variables en `api/.dev.vars.example`, `pruebas/.entorno.local.example` y `pruebas/README.md`.
5. Luego fotos en R2, `/auth/me`, refresh token, recuperación de contraseña, producción, zona horaria local y retiro de SQLite con respaldo.

## Incidencias recurrentes

- Cloudflare error 7403 en `wrangler d1 migrations apply ... --remote`: reintentar; si persiste, `wrangler logout` y `wrangler login`.
- `/probar completo`: Expo Go «Something went wrong», cortes de red, emulador colgado, `adb` colgado (parar procesos con permiso), driver de Maestro con fallos de entorno. Si no basta: `adb emu kill` y arrancar el AVD en frío (`-no-snapshot -gpu swiftshader_indirect -dns-server 8.8.8.8,1.1.1.1`). Ver `pruebas/README.md`.

## Limitaciones conocidas

- Inicio: sin lector de negocio en SQLite en modo API salvo fotos (R2) y `obtenerEvolucionAve`; CPU en D1 real sin medir. Fallo de red: Inicio, Alertas, Finanzas, Reportes, Catálogo, DetalleCliente, DetalleAve y Editar movimiento muestran error con «Reintentar». Genealogía muestra texto, no `Alert`.
- Bajas: V1 no libera la jaula al dar de baja (replicado). Finanzas: periodos en UTC como V1; `CREACION_POR_CORRECCION` solo cubierto por integración. Huevos: concurrencia sin probar. Reportes: `OrigenId` del CSV sale como UUID. Alertas: D-2 y D-3 abiertas.
- Salud: «Guardar diagnóstico» sin `disabled`; finalizar tratamiento no escribe `RECUPERACION`. Fotos: R2 sin hacer; `foto_r2_key` guarda la ruta local.
- Auth: correo por Gmail SMTP probado en real en pruebas (llega a spam; CPU sin medir); `wrangler deploy` o `secret put` sin `--env` actúan sobre desarrollo; Google sin probar en dispositivo (con token inválido responde 401 en pruebas; con token real aún no); `/auth/me` pendiente; token de 60 min sin refresh; sin recuperación de contraseña; PBKDF2 a 100000 iteraciones: 13–20 ms de CPU. `shell-quote` crítico preexistente, solo de desarrollo (sin `npm audit fix`).

## Excepciones aprobadas a pantallas V1 (seis)

1. `MasMenuScreen`: "Cerrar sesión" (solo modo API). 2. `AlimentacionJaulaScreen` y `BebidaJaulaScreen`: `try/catch` con `Alert`. 3. `SaludAveScreen`: `Alert` en `catch` y guarda `if (!ave)`. 4. `ProduccionHuevosScreen`: `Alert` en el `catch` de carga. 5. `GenealogiaAveScreen`: ids `String` (UUID v7), sin `Alert`. 6. Detalle en cada spec de `documents/specs/`. Otras vigentes: categorías propias en Ingreso y Egreso; alertas de Salud solo el día del plazo; pantallas de acceso nuevas (solo modo API).
