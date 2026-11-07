# Estado actual (resumen de sesión)

Se carga solo desde `CLAUDE.md` (import). Historial: `documents/bitacora.md`. Actualizar con `/cerrar-dia`. Fecha: 2026-11-07.

## Rama y reglas de trabajo

- Rama única: `trabajo/migracion-nube` (desde `main`). Último push: el de Reportes, `2317c11`. Alertas queda sin push hasta que el orquestador lo empuje. Sin PR; fusión a `main` solo si el usuario lo pide. Cloudflare: solo `--env test` / base de pruebas, con aprobación; nunca `criadero-kikirikis-dev`, `controlgastos-*` ni `delete` sin aprobación.

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
| Finanzas (`0011`) | sí (`api/src/finanzas/`) | `FinanzasRepository`, `finanzasApi.js` (sin `obtenerIngresos`/`obtenerEgresos`) | sí (87/87; flujos `95` y `96` en el completo del 2026-11-05) | no |
| Clientes (sin migración) | sí (`api/src/clientes/`, solo lectura) | `ClientesRepository` | sí (datos 96/96; flujo `98`) | no |
| Reportes (sin migración) | sí (`api/src/reportes/`, 10 `GET` de solo lectura) | `ReportesRepository` | sí (datos 104/104; flujo `97`) | no |
| Alertas (sin migración) | sí (`api/src/alertas/`, un `GET /alertas`, solo lectura) | `AlertasRepository` (sin las cuatro parciales) | sí (datos 110/110; flujo `99`) | no |

Migraciones `0001`–`0011` aplicadas en local, integración y base remota de pruebas (la siguiente es `0012`). Pruebas (2026-11-07): 333 unitarias/HTTP y 167 de integración; paridad con V1: Finanzas 235 comparaciones, Clientes 45, Reportes (10 funciones) y Alertas 324, 0 diferencias; `/probar datos` 110/110 casos. Último `/probar completo` completo: 2026-11-05 (`2026-11-05-103724-completo`, 19 PASO, 0 regresiones, 1 fallo esperado: dashboard); el flujo `99` pasó solo.

## Módulos pendientes (orden)

1. Teléfono (Bajas, Finanzas, Clientes, Reportes, Alertas: teclado numérico, modo avión, hora local frente a UTC, scroll) y fase 6: Inicio (`DashboardRepository`, sigue en SQLite; necesitará `GET /finanzas/resumen` o `GET /finanzas/movimientos`). Sin código hasta "plan aprobado".
2. R2 (fotos; claves propuestas `criaderos/{criaderoId}/aves/{aveId}/{evolucionId}.jpg`) y Google Sign-In (con `/auth/me` y refresh token).

## Incidencias recurrentes

- Cloudflare error 7403 en `wrangler d1 migrations apply ... --remote` (2026-11-01 y 2026-11-04). Reintentar; si persiste, `wrangler logout` y `wrangler login` (el usuario pulsa Allow).
- `/probar completo`: Expo Go "Something went wrong" al abrir (`2026-11-04-150506-completo`, causa no determinada) y cortes de red hacia Cloudflare (`2026-11-04-183443-completo`). El ejecutor hace comprobación previa, reintenta solo al preparar y limpiar y aborta tras dos fallos de red seguidos (`52b9641`).
- Emulador colgado (2026-11-05: `adb getprop` sin respuesta) o con `pm list packages` en `Broken pipe`. El ejecutor tiene límites de 6 min por flujo y 60 min por ejecución, y una recuperación automática del emulador tras dos FALLO DE ENTORNO seguidos (`3defe9f`). Si no basta: cerrar el ejecutor y los adb, `adb emu kill` y arrancar el AVD con Start-Process desde PowerShell (no con `&` desde bash); ver `pruebas/README.md`. Un flujo puede llevar `# SEGUNDA-CUENTA` para que el ejecutor le pase EMAIL2, PASSWORD2 y CRIADERO2 (cuenta desechable con criadero vacío).

## Limitaciones conocidas

- Inicio lee SQLite: no ve finanzas, ventas, cuidados, huevos ni salud de la nube. Dos cuentas en el mismo teléfono ven los contadores del SQLite compartido.
- Bajas: V1 no libera la jaula al dar de baja (replicado). `DetalleAveScreen` no avisa si falla `obtenerBajaAve` por red.
- Finanzas: periodos en UTC como V1 (un movimiento nocturno puede caer en el mes siguiente); sin aviso de red en `FinanzasScreen` ni en `NuevoMovimientoFinancieroScreen` (decisión del usuario); `registrarIngreso`/`registrarEgreso` con `NaN` devuelven 400; `CREACION_POR_CORRECCION` solo cubierto por integración; los flujos no cubren envío por separado, filtro por tipo ni categorías propias.
- Errores de red sin aviso, como V1: `DetalleAveScreen`, `RegistrarHuevoScreen.cargarAve` y `DetalleClienteScreen` (muestra "Cliente no encontrado."). Genealogía muestra un texto en lugar de `Alert`. Clientes: la foto del ave es la ruta local hasta R2.
- Salud: "Guardar diagnóstico" sin `disabled` (doble toque puede duplicar); finalizar tratamiento en API no escribe `RECUPERACION` (lo hace la pantalla). Huevos: concurrencia real por criadero sin probar. Aves: `obtenerEvolucionAve` sigue en SQLite en modo API; `NuevaAveScreen` usa `Number(item.id)`. Reportes: `OrigenId` del CSV de finanzas sale como UUID; `ReportesScreen` deja los resúmenes en cero sin aviso ante error de red (como V1); desempates de empates `DESC` según SQLite (no comprobado en `expo-sqlite`); exportaciones sin paginación (CPU/tamaño con decenas de miles de filas sin medir en D1 real).
- Alertas: errores de red sin aviso en `AlertasScreen`, `InicioScreen` y `MasMenuScreen` (solo `console.error`, como V1); D-2 (orden `rowid` en `expo-sqlite`) y D-3 (punto flotante en bordes) abiertas; CPU en D1 real sin medir. Fotos: R2 sin hacer; `foto_r2_key` guarda la ruta local del teléfono. Google Sign-In pendiente; token de 60 min sin refresh (al vencer, 401 y vuelta al inicio de sesión). PBKDF2 a 100000 iteraciones: 13–20 ms de CPU (riesgo conocido).

## Excepciones aprobadas a pantallas V1 (seis; Bajas y Finanzas no añaden)

1. `MasMenuScreen`: "Cerrar sesión" (solo modo API). 2. `AlimentacionJaulaScreen` y `BebidaJaulaScreen`: `try/catch` con `Alert`. 3. `SaludAveScreen`: `Alert` en `catch` y guarda `if (!ave)`. 4. `ProduccionHuevosScreen`: `Alert` en el `catch` de carga. 5. `GenealogiaAveScreen`: ids `String` (UUID v7), sin `Alert`. 6. Detalle en cada spec de `documents/specs/`.

## Cómo arrancar (Windows, PowerShell)

- API local (desde `api/`, Node 22): `nvm use 22; npm run dev`; leer el puerto en `Ready on http://127.0.0.1:XXXX`. Expo contra el Worker de pruebas: URL solo en variables de la sesión (nunca en archivos ni commits): `NODE_PATH`, `EXPO_NO_TYPESCRIPT_SETUP=1`, `EXPO_PUBLIC_DATA_SOURCE=api`, `EXPO_PUBLIC_API_URL`; luego `npx expo start --tunnel`.

## Siguiente paso exacto

Módulo Inicio (`DashboardRepository`): plan y "plan aprobado" antes de programar; pasar el flujo `inicio.yaml` de esperado-fallar a completo y hacer un `/probar completo` final de la fase. Mientras, esperar indicación para: teléfono (Bajas, Finanzas, Clientes, Reportes y Alertas), push de Alertas, R2 o Google Sign-In.
