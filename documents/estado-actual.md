# Estado actual (resumen de sesión)

Se carga solo desde `CLAUDE.md` (import). Historial: `documents/bitacora.md`. Actualizar con `/cerrar-dia`. Fecha: 2026-11-04.

## Rama y reglas de trabajo

- Rama única: `trabajo/migracion-nube` (desde `main`). Último push: `2b110c5`. Commits locales (los de Bajas y Finanzas aún sin push); push solo con aprobación; sin PR; fusión a `main` solo si el usuario lo pide.
- Cloudflare: solo `--env test` / base de pruebas, con aprobación. Nunca `criadero-kikirikis-dev`, `controlgastos-*` ni `delete` sin aprobación.

## Módulos hechos

| Módulo | API | Cliente app | Probado (Worker de pruebas) | Teléfono |
|---|---|---|---|---|
| Auth, criaderos, onboarding | sí | sí | sí | sí |
| Jaulas (`0005`) | sí | `JaulaRepository.api.js` | sí | sí (sin historial) |
| Catálogos (42 ítems por criadero) | sí | `ConfiguracionRepository.api.js` | sí | sí |
| Aves (`0006`) | sí | `AveRepository.api.js` y fachadas | sí | no |
| Cuidados de jaula (`0007`) | sí | `Alimentacion/Bebida/SanidadJaula/Historial` | sí | no |
| Salud (`0008`) | sí | `SaludRepository` (sin `actualizarEstadoSaludAve` en API) | sí | no |
| Huevos (`0009`) | sí (`api/src/huevos/`) | `HuevoRepository`, `ProduccionRepository` | sí | no |
| Genealogía (sin migración) | usa `GET /aves` | `GenealogiaRepository` | sí (flujo `80`) | no |
| Ciclo de vida (sin migración) | solo `GET /aves/:aveId/evolucion` | `CicloVidaRepository` | sí (flujo `81`) | no |
| Bajas (`0010`) | sí (`api/src/aves/`) | `BajaAveRepository` (sin `obtenerBajasAve`) | sí (`/probar datos`, flujos `90`, `91`) | no |
| Finanzas (`0011`) | sí (`api/src/finanzas/`, 11 endpoints) | `FinanzasRepository`, `finanzasApi.js` (sin `obtenerIngresos`/`obtenerEgresos`) | sí (87/87; flujos `95`, `96`) | no |

Migraciones `0001`–`0011` aplicadas en local, integración y base remota de pruebas (la siguiente es `0012`). Pruebas (2026-11-04): 285 unitarias/HTTP y 119 de integración; paridad de Finanzas con el código real de V1: 235 comparaciones, 0 diferencias; `/probar datos` 87/87 (157 s); smoke verde; flujos `95` y `96` PASO. Resultado de `/probar completo`: pendiente. Commits: ver `git log` y la bitácora.

## Módulos pendientes (orden)

1. Comprobación en el teléfono de Bajas y Finanzas (y de los módulos sin probar allí).
2. Fase 6: Inicio, Reportes, Clientes y Alertas (siguen en SQLite). Necesitarán `GET /finanzas/resumen?periodo=MES|TODO` o `GET /finanzas/movimientos`.
3. R2 (fotos; claves propuestas `criaderos/{criaderoId}/aves/{aveId}/{evolucionId}.jpg`) y Google Sign-In (con `/auth/me` y refresh token).

## Incidencias recurrentes

- **Cloudflare error 7403** («The given account is not valid or is not authorized to access this service») en `wrangler d1 migrations apply ... --remote`: ocurrió dos veces (la primera, anterior, según el usuario; la segunda el 2026-11-04 al aplicar `0011`). `wrangler whoami` mostraba la sesión OAuth con `d1 (write)` y el segundo intento funcionó sin renovar la sesión. Qué hacer: reintentar; si persiste, `wrangler logout` y `wrangler login` (el usuario debe pulsar Allow).
- Emulador con `pm list packages` en `Broken pipe`: `adb emu kill` y arrancar de nuevo (ver `pruebas/README.md`).

## Limitaciones conocidas

- Inicio, Alertas, Reportes y Clientes leen SQLite: no ven finanzas, ventas, cuidados, huevos ni salud de la nube. Dos cuentas en el mismo teléfono ven los contadores del SQLite compartido.
- Bajas: V1 no libera la jaula al dar de baja (replicado). `DetalleAveScreen` no avisa si falla `obtenerBajaAve` por red.
- Finanzas: periodos en UTC como V1 (un movimiento nocturno puede caer en el mes siguiente); sin aviso de red en `FinanzasScreen` y `NuevoMovimientoFinancieroScreen` y `cargarCategorias` sin `try/catch` (decisión del usuario); `registrarIngreso`/`registrarEgreso` con `NaN` devuelven 400 (V1 fallaba al insertar); `CREACION_POR_CORRECCION` solo cubierto por integración; los flujos no cubren el envío por separado, el filtro por tipo ni categorías propias.
- `/probar completo`: solo `PENDIENTE DE MIGRAR: dashboard`.
- Errores de red sin aviso, como V1: `DetalleAveScreen` y `RegistrarHuevoScreen.cargarAve` (decisión del usuario). Genealogía muestra un texto en lugar de `Alert`.
- Salud: el botón "Guardar diagnóstico" no tiene `disabled` (doble toque puede duplicar). Finalizar tratamiento en API no escribe `RECUPERACION` (lo hace la pantalla).
- Huevos: concurrencia real por criadero sin probar. Periodos en UTC.
- Aves: `obtenerEvolucionAve` sigue en SQLite en modo API (sin llamadores). `NuevaAveScreen` usa `Number(item.id)` (`NaN` con UUID; efecto menor).
- Fotos: R2 sin hacer; `foto_r2_key` guarda la ruta local del teléfono.
- Google Sign-In pendiente. Token de 60 min sin refresh; al vencer (401) vuelve al inicio de sesión.
- PBKDF2 a 100000 iteraciones: 13–20 ms de CPU en Workers Free (riesgo conocido).

## Excepciones aprobadas a pantallas V1 (seis; Bajas y Finanzas no añaden)

1. `MasMenuScreen`: "Cerrar sesión" (solo modo API). Motivo: autenticación.
2. `AlimentacionJaulaScreen` y `BebidaJaulaScreen`: `try/catch` con `Alert`. Motivo: errores de red.
3. `SaludAveScreen`: `Alert` en los `catch` de carga y guardado y guarda `if (!ave)`. Motivo: errores de red.
4. `ProduccionHuevosScreen`: `Alert` en el `catch` de carga. Motivo: errores de red.
5. `GenealogiaAveScreen`: `Number` → `String` en ids (UUID v7); sin `Alert`, por decisión del usuario.
6. Detalle en cada spec de `documents/specs/`.

## Cómo arrancar (Windows, PowerShell)

- API local (desde `api/`, Node 22): `nvm use 22; npm run dev`; leer el puerto en `Ready on http://127.0.0.1:XXXX`.
- Expo contra el Worker de pruebas: la URL solo en variables de la sesión (nunca en archivos ni commits): `NODE_PATH`, `EXPO_NO_TYPESCRIPT_SETUP=1`, `EXPO_PUBLIC_DATA_SOURCE=api`, `EXPO_PUBLIC_API_URL`; luego `npx expo start --tunnel`.

## Siguiente paso exacto

Añadir el resultado de `/probar completo` (en curso) y esperar la indicación del usuario: comprobación mínima en el teléfono (Bajas y Finanzas) y elección entre la fase 6 (Inicio, Reportes, Clientes, Alertas), R2 y Google Sign-In. Push de los commits locales solo con aprobación.
