# Estado actual (resumen de sesión)

Se carga solo desde `CLAUDE.md` (import). Historial: `documents/bitacora.md`. Actualizar con `/cerrar-dia`. Fecha: 2026-11-05.

## Rama y reglas de trabajo

- Rama única: `trabajo/migracion-nube` (desde `main`). Último push: `ae81dca` (incluye `52b9641`); sin pendientes de push. Sin confirmar: flujos `90`, `91` y `96`. Sin PR; fusión a `main` solo si el usuario lo pide. Cloudflare: solo `--env test` / base de pruebas, con aprobación; nunca `criadero-kikirikis-dev`, `controlgastos-*` ni `delete` sin aprobación.

## Módulos hechos

| Módulo | API | Cliente app | Probado (Worker de pruebas) | Teléfono |
|---|---|---|---|---|
| Auth, criaderos, onboarding | sí | sí | sí | sí |
| Jaulas (`0005`) | sí | `JaulaRepository.api.js` | sí | sí (sin historial) |
| Catálogos (42 ítems por criadero) | sí | `ConfiguracionRepository.api.js` | sí | sí |
| Aves (`0006`) | sí | `AveRepository.api.js` y fachadas | sí | no |
| Cuidados de jaula (`0007`) | sí | `Alimentacion/Bebida/SanidadJaula/Historial` | sí | no |
| Salud (`0008`) | sí | `SaludRepository` (sin `actualizarEstadoSaludAve`) | sí | no |
| Huevos (`0009`) | sí | `HuevoRepository`, `ProduccionRepository` | sí | no |
| Genealogía (sin migración) | usa `GET /aves` | `GenealogiaRepository` | sí (flujo `80`) | no |
| Ciclo de vida (sin migración) | `GET /aves/:aveId/evolucion` | `CicloVidaRepository` | sí (flujo `81`) | no |
| Bajas (`0010`) | sí (`api/src/aves/`) | `BajaAveRepository` (sin `obtenerBajasAve`) | sí (flujos `90`, `91`) | no |
| Finanzas (`0011`) | sí (`api/src/finanzas/`) | `FinanzasRepository`, `finanzasApi.js` (sin `obtenerIngresos`/`obtenerEgresos`) | sí (87/87; flujo `95`; `96` PASO en dos repeticiones) | no |

Migraciones `0001`–`0011` aplicadas en local, integración y base remota de pruebas (la siguiente es `0012`). Pruebas (2026-11-04): 285 unitarias/HTTP y 119 de integración (Node 22); paridad de Finanzas con V1: 235 comparaciones, 0 diferencias; `/probar datos` 87/87.

## Módulos pendientes (orden)

1. `/probar completo` sin regresiones al empezar el siguiente bloque. No hay ninguno válido desde Finanzas: el de `2026-11-04-190615-completo` tuvo 1 regresión (`96`, sincronía).
2. Teléfono: Bajas y Finanzas (teclado numérico, modo avión, hora local frente a UTC, scroll).
3. Fase 6: Inicio, Reportes, Clientes y Alertas (siguen en SQLite); necesitarán `GET /finanzas/resumen` o `GET /finanzas/movimientos`.
4. R2 (fotos; claves propuestas `criaderos/{criaderoId}/aves/{aveId}/{evolucionId}.jpg`) y Google Sign-In (con `/auth/me` y refresh token).

## Incidencias recurrentes

- Cloudflare error 7403 en `wrangler d1 migrations apply ... --remote` (2026-11-01 y 2026-11-04). Reintentar; si persiste, `wrangler logout` y `wrangler login` (el usuario pulsa Allow).
- `/probar completo`: Expo Go "Something went wrong" al abrir (`2026-11-04-150506-completo`, causa no determinada) y cortes de red hacia Cloudflare (`2026-11-04-183443-completo`). El ejecutor hace comprobación previa, reintenta solo al preparar y limpiar y aborta tras dos fallos de red seguidos (`52b9641`); en `2026-11-04-190615-completo` absorbió 9 reintentos.
- Emulador colgado (2026-11-05: `adb getprop` sin respuesta, ejecutor bloqueado más de 30 min) o con `pm list packages` en `Broken pipe`: cerrar el ejecutor y los adb, `adb emu kill` y arrancar el AVD con Start-Process desde PowerShell (no con `&` desde bash, que muere con la tarea); ver `pruebas/README.md`.

## Limitaciones conocidas

- Inicio, Alertas, Reportes y Clientes leen SQLite: no ven finanzas, ventas, cuidados, huevos ni salud de la nube. Dos cuentas en el mismo teléfono ven los contadores del SQLite compartido.
- Bajas: V1 no libera la jaula al dar de baja (replicado). `DetalleAveScreen` no avisa si falla `obtenerBajaAve` por red.
- Finanzas: periodos en UTC como V1 (un movimiento nocturno puede caer en el mes siguiente); sin aviso de red en `FinanzasScreen` ni en `NuevoMovimientoFinancieroScreen` (decisión del usuario); `registrarIngreso`/`registrarEgreso` con `NaN` devuelven 400; `CREACION_POR_CORRECCION` solo cubierto por integración; el flujo `96` espera por condición desde 2026-11-05, pero sin un `/probar completo` limpio posterior; los flujos no cubren envío por separado, filtro por tipo ni categorías propias.
- Errores de red sin aviso, como V1: `DetalleAveScreen` y `RegistrarHuevoScreen.cargarAve`. Genealogía muestra un texto en lugar de `Alert`.
- Salud: "Guardar diagnóstico" sin `disabled` (doble toque puede duplicar); finalizar tratamiento en API no escribe `RECUPERACION` (lo hace la pantalla).
- Huevos: concurrencia real por criadero sin probar. Aves: `obtenerEvolucionAve` sigue en SQLite en modo API; `NuevaAveScreen` usa `Number(item.id)`.
- Fotos: R2 sin hacer; `foto_r2_key` guarda la ruta local del teléfono. Google Sign-In pendiente; token de 60 min sin refresh (al vencer, 401 y vuelta al inicio de sesión). PBKDF2 a 100000 iteraciones: 13–20 ms de CPU (riesgo conocido).

## Excepciones aprobadas a pantallas V1 (seis; Bajas y Finanzas no añaden)

1. `MasMenuScreen`: "Cerrar sesión" (solo modo API). 2. `AlimentacionJaulaScreen` y `BebidaJaulaScreen`: `try/catch` con `Alert`. 3. `SaludAveScreen`: `Alert` en `catch` y guarda `if (!ave)`. 4. `ProduccionHuevosScreen`: `Alert` en el `catch` de carga. 5. `GenealogiaAveScreen`: ids `String` (UUID v7), sin `Alert`. 6. Detalle en cada spec de `documents/specs/`.

## Cómo arrancar (Windows, PowerShell)

- API local (desde `api/`, Node 22): `nvm use 22; npm run dev`; leer el puerto en `Ready on http://127.0.0.1:XXXX`. Expo contra el Worker de pruebas: URL solo en variables de la sesión (nunca en archivos ni commits): `NODE_PATH`, `EXPO_NO_TYPESCRIPT_SETUP=1`, `EXPO_PUBLIC_DATA_SOURCE=api`, `EXPO_PUBLIC_API_URL`; luego `npx expo start --tunnel`.

## Siguiente paso exacto

Empezar el siguiente bloque con un `/probar completo` (debe quedar sin regresiones) y anotar su resultado en Finanzas. Mientras, esperar indicación para: teléfono (Bajas y Finanzas), decisión sobre el commit de los flujos `90`, `91` y `96`, push de nuevos commits, fase 6, R2 o Google Sign-In.
