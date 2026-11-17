# Estado actual (resumen de sesión)

Se carga solo desde `CLAUDE.md` (import). Historial: `documents/bitacora.md`. Actualizar con `/cerrar-dia`. Fecha: 2026-11-17.

## Rama y reglas de trabajo

- Rama `trabajo/migracion-nube`. Push hecho el 2026-11-17: `c9ea633..354e168` (7 commits ya en remoto). Los cambios de hoy están **sin commit** (el orquestador los confirmará aparte). Push solo con aprobación; sin PR ni fusión a `main`. `documents/specs/auth-verificacion-google.md` está sin añadir a Git.
- Cloudflare: solo `--env test` y base de pruebas, con aprobación; nunca la base de desarrollo. Expo por túnel (puerto 8090, URL solo en variables de sesión). Emulador, `/probar smoke` y `/probar completo` solo a petición; typecheck, unitarias y `/probar datos` si se toca API o dinero.

## Paquete del 2026-11-16 (ya empujado)

- `742fcd4` Inicio navegable (flujo `100`). `70e0bcd` y `16ce103` colores por estado en jaulas y aves; Quemadura en naranja por decisión del usuario (flujo `101`).
- `8655cf6` Alertas de Salud solo el día UTC en que se cumplen 7 días desde el último control; texto fijo «lleva 7 días». Excepción aprobada a la paridad, solo en Salud.
- `e475139` Verificación de cuenta por código: migración `0012`; bandera `EMAIL_VERIFICATION_REQUIRED` apagada en todos los entornos; proveedor de correo sin elegir.
- `86677b6` Login con Google: `POST /api/v1/auth/google` y botón. `354e168` documentación y flujos Maestro corregidos.

## Cambios del 2026-11-17 (sin commit)

- Valores por defecto de verificación **aceptados por el usuario**: código 10 min, 5 intentos, reenvío 60 s, 5 envíos/h por correo, 5 registros/h por IP, 80/día global, borrado a 24 h sin Cron, cambio de correo con contraseña, `409` al registrar un correo ya verificado.
- **Hallazgo de Google RESUELTO (decisión A+B).** (A) `POST /auth/google` responde `403 GOOGLE_REQUIRES_EMAIL_VERIFICATION` si `EMAIL_VERIFICATION_REQUIRED` no vale exactamente `"true"`; orden: `idToken` (400) -> `GOOGLE_NOT_CONFIGURED` (503) -> bandera apagada (403) -> validar token. (B) Migración `0013` `users.email_verified_via` (`NULL` = nunca probado, `'CODE'`, `'GOOGLE'`); `linkGoogle` anula `password_hash` si el marcador es `NULL`. Consecuencia: las cuentas previas pierden su contraseña la primera vez que vinculan Google (sin recuperación de contraseña).
- `0013` aplicada en local, integración y base remota de pruebas; Worker de pruebas desplegado (`--env test`). Bandera apagada en todos los entornos; `GOOGLE_CLIENT_IDS` sin configurar en el Worker de pruebas (`/auth/google` responde `503 GOOGLE_NOT_CONFIGURED`). Siguiente migración: `0014`.
- Librería `@react-native-google-signin/google-signin` ^17.0.0 aprobada e instalada (`npx expo install`); plugin en `app.json` sin opciones (no verificado en un prebuild real); solo development build, no Expo Go. `require` en `try` en `src/api/googleAuth.js` (comprobación en Expo Go real pendiente). `package.json`/`app.json` quedan sin commit hasta que el usuario vea el diff.
- Pruebas: typecheck OK; unitarias 419/419; integración 228/228; `git diff --check` limpio; `/probar datos` 122/122 (7 omitidos sin secreto). Flujos `95` y `96` VERDES (Finanzas conserva el scroll y el título «Consolidado por categoría» queda arriba; YAML corregido con scroll condicional). Cableado `--sin-verificar` hecho en `pruebas/movil` (código de salida 4 = OMITIDO); flujo `102` sigue en `esperado-fallar/` (se omite sin `VERIFICATION_BYPASS_SECRET` y necesita la bandera encendida en el Worker). `/probar completo` no se ejecutó: **sigue sin haber completo verde del paquete completo** (último ROJO `2026-11-16-163400-completo`, 27 PASO, 5 REGRESION).
- Base de pruebas tras limpiar: 3 cuentas, 3 criaderos, 4 jaulas, 5 aves, 0 desechables; la jaula y el ave de más (frente al 2026-11-10) son del usuario, de probar colores por estado.

## Módulos hechos

| Módulo | API | Cliente app | Probado (Worker de pruebas) | Teléfono |
|---|---|---|---|---|
| Auth, criaderos, onboarding (+ `0012`, `0013` y `/auth/google`) | sí | sí | sí (datos 122/122) | email y contraseña sí; verificación y Google no |
| Jaulas (`0005`) y catálogos (42 ítems) | sí | `JaulaRepository.api.js`, `ConfiguracionRepository.api.js` | sí | sí (jaulas sin historial) |
| Aves (`0006`), cuidados (`0007`), salud (`0008`), huevos (`0009`) | sí | repositorios y fachadas (sin `actualizarEstadoSaludAve`) | sí | no |
| Genealogía y ciclo de vida (sin migración) | `GET /aves`, `GET .../evolucion` | `GenealogiaRepository`, `CicloVidaRepository` | sí (flujos `80`, `81`) | no |
| Bajas (`0010`) y finanzas (`0011`) | sí | `BajaAveRepository`, `FinanzasRepository` | sí (`90`, `91`, `95`, `96`) | no |
| Clientes, Reportes, Alertas, Inicio (sin migración, solo lectura) | sí | sus repositorios `.api.js` | sí (`98`, `97`, `99`, `94`) | no |

- Migraciones `0001`–`0013` aplicadas en local, integración y base remota de pruebas (siguiente: `0014`). Paridad con V1 sin diferencias, salvo la excepción de alertas de Salud.

## Próximos pasos (en este orden)

1. Prueba del usuario en el teléfono: 22 puntos del paquete, `documents/ux/pendiente-en-telefono.md` y la fase 6 (Bajas, Finanzas, Clientes, Reportes, Alertas, Inicio).
2. El usuario revisa el diff de `package.json`/`app.json`; el orquestador confirma los commits de hoy (migración `0013`, bloqueo de Google, librería, cableado `--sin-verificar`, YAML de `95` y `96`).
3. Decidir proveedor de correo y dominio; ambientes: `vars` de `env.test` en `api/wrangler.jsonc` (`EMAIL_VERIFICATION_REQUIRED`, `EMAIL_FROM`, `GOOGLE_CLIENT_IDS`); secretos por stdin solo con orden expresa; clientes de Google Cloud y development build con EAS (con la bandera encendida Google ya no devuelve 403).
4. Pruebas: `/probar completo` verde del paquete; mover `102-verificar-correo` a `completo/` cuando la bandera esté encendida en el Worker de pruebas. Notas de variables en `api/.dev.vars.example`, `pruebas/.entorno.local.example` y `pruebas/README.md`; textos de `CLAUDE.md` sin aplicar.
5. Luego fotos en R2 (`criaderos/{criaderoId}/aves/{aveId}/{evolucionId}.jpg`), `/auth/me`, refresh token, recuperación de contraseña, ambientes de producción, zona horaria local (alertas y periodos usan UTC) y retiro de SQLite con respaldo.

## Incidencias recurrentes

- Cloudflare error 7403 en `wrangler d1 migrations apply ... --remote`: reintentar; si persiste, `wrangler logout` y `wrangler login`.
- `/probar completo`: Expo Go «Something went wrong», cortes de red, emulador colgado, `adb` en `Broken pipe`. Si no basta: `adb emu kill` y arrancar el AVD en frío (`-no-snapshot -gpu swiftshader_indirect -dns-server 8.8.8.8,1.1.1.1`) con Start-Process desde PowerShell. Ver `pruebas/README.md`.

## Limitaciones conocidas

- Inicio: sin lector de negocio en SQLite en modo API salvo fotos (R2) y `obtenerEvolucionAve`; CPU en D1 real sin medir. Fallo de red: Inicio, Alertas, Finanzas, Reportes, Catálogo, DetalleCliente, DetalleAve y Editar movimiento muestran error con «Reintentar» (cambio visual aprobado). Genealogía muestra texto, no `Alert`.
- Bajas: V1 no libera la jaula al dar de baja (replicado). Finanzas: periodos en UTC como V1; `CREACION_POR_CORRECCION` solo cubierto por integración. Huevos: concurrencia sin probar. Reportes: `OrigenId` del CSV sale como UUID. Alertas: D-2 y D-3 abiertas.
- Salud: «Guardar diagnóstico» sin `disabled`; finalizar tratamiento no escribe `RECUPERACION`. Fotos: R2 sin hacer; `foto_r2_key` guarda la ruta local. Auth: Google sin probar en dispositivo; `/auth/me` pendiente; token de 60 min sin refresh; sin recuperación de contraseña; PBKDF2 a 100000 iteraciones: 13–20 ms de CPU.

## Excepciones aprobadas a pantallas V1 (seis)

1. `MasMenuScreen`: "Cerrar sesión" (solo modo API). 2. `AlimentacionJaulaScreen` y `BebidaJaulaScreen`: `try/catch` con `Alert`. 3. `SaludAveScreen`: `Alert` en `catch` y guarda `if (!ave)`. 4. `ProduccionHuevosScreen`: `Alert` en el `catch` de carga. 5. `GenealogiaAveScreen`: ids `String` (UUID v7), sin `Alert`. 6. Detalle en cada spec de `documents/specs/`. Otras vigentes: categorías propias en Ingreso y Egreso; alertas de Salud solo el día del plazo; pantallas de acceso nuevas (solo modo API).
