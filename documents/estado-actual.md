# Estado actual (resumen de sesión)

Se carga solo desde `CLAUDE.md` (import). Historial: `documents/bitacora.md`. Actualizar con `/cerrar-dia`. Fecha: 2026-11-07.

## Rama y reglas de trabajo

- Rama única: `trabajo/migracion-nube` (desde `main`). Último push: `eb8a18e`; commit local sin empujar: `ad2a743` (documentación de Inicio). Sin PR; fusión a `main` solo si el usuario lo pide. Cloudflare: solo `--env test` / base de pruebas, con aprobación; nunca `criadero-kikirikis-dev`, `controlgastos-*` ni `delete` sin aprobación.

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
| Inicio (sin migración) | sí (`api/src/inicio/`, `GET /dashboard`, solo lectura, 6 llamadas D1) | `DashboardRepository` | sí (datos 115/115; flujo `94` en ejecución aislada) | no |

Migraciones `0001`–`0011` aplicadas en local, integración y base remota de pruebas (la siguiente es `0012`). Pruebas (2026-11-07): 349 unitarias/HTTP y 196 de integración (antes 167); paridad con V1: Finanzas 235 comparaciones, Clientes 45, Reportes (10 funciones), Alertas 324 e Inicio 140, 0 diferencias; `/probar datos` 115 casos. **`/probar completo`:** el último VÁLIDO sigue siendo el del 2026-11-05 (`2026-11-05-103724-completo`, 19 PASO, 0 regresiones). El del 2026-11-07 (`2026-11-07-165323-completo`) **NO es válido**: ROJO (18 PASO, 1 REGRESION, 1 FALLO DE ENTORNO), por la regresión del flujo `94` (falta un `scrollUntilVisible`, fallo del flujo) y el tope de 60 min (abortado con 20 de 23 flujos; `96` cortado). Los flujos iban ~1,9 veces más lentos, causa no determinada.

## Módulos pendientes (orden)

1. Arreglar el scroll del flujo `94`, decidir el tope de tiempo del `/probar completo` y repetirlo UNA vez; solo si queda sin regresiones, anotar el cierre de la fase 6.
2. Teléfono (Bajas, Finanzas, Clientes, Reportes, Alertas, Inicio: teclado numérico, modo avión, hora local frente a UTC, scroll). Luego R2 (fotos; claves `criaderos/{criaderoId}/aves/{aveId}/{evolucionId}.jpg`) y Google Sign-In (con `/auth/me` y refresh token).

## Incidencias recurrentes

- Cloudflare error 7403 en `wrangler d1 migrations apply ... --remote` (2026-11-01 y 2026-11-04). Reintentar; si persiste, `wrangler logout` y `wrangler login` (el usuario pulsa Allow).
- `/probar completo`: Expo Go "Something went wrong" al abrir (`2026-11-04-150506-completo`) y cortes de red hacia Cloudflare (`2026-11-04-183443-completo`); el ejecutor reintenta al preparar y limpiar y aborta tras dos fallos de red seguidos (`52b9641`). Emulador colgado (2026-11-05: `adb getprop` sin respuesta) o con `pm list packages` en `Broken pipe`. El ejecutor tiene límites de 6 min por flujo y 60 min por ejecución, y una recuperación automática del emulador tras dos FALLO DE ENTORNO seguidos (`3defe9f`). Si no basta: cerrar el ejecutor y los adb, `adb emu kill` y arrancar el AVD con Start-Process desde PowerShell (no con `&` desde bash); ver `pruebas/README.md`. Un flujo puede llevar `# SEGUNDA-CUENTA` para que el ejecutor le pase EMAIL2, PASSWORD2 y CRIADERO2 (cuenta desechable con criadero vacío).

## Limitaciones conocidas

- Con Inicio migrado ya no queda ningún lector de negocio en SQLite en modo API, salvo lo que dependa de fotos (R2) y `obtenerEvolucionAve`. Inicio: `InicioScreen.js:173-180` solo hace `console.error` (un fallo de red lo deja en ceros, como V1; sin excepciones a pantallas); desempates de V1 (mejor ponedora por `codigo` menor, hora pico por hora mayor) dependen del plan de SQLite y podrían variar en otra versión en el teléfono; redondeos no probados en `expo-sqlite` ni en D1 real; CPU en D1 real sin medir.
- Bajas: V1 no libera la jaula al dar de baja (replicado); `DetalleAveScreen` no avisa si falla `obtenerBajaAve`. Finanzas: periodos en UTC como V1 (un movimiento nocturno puede caer en el mes siguiente); sin aviso de red en `FinanzasScreen` ni en `NuevoMovimientoFinancieroScreen` (decisión del usuario); `registrarIngreso`/`registrarEgreso` con `NaN` devuelven 400; `CREACION_POR_CORRECCION` solo cubierto por integración; los flujos no cubren envío por separado, filtro por tipo ni categorías propias.
- Errores de red sin aviso, como V1: `DetalleAveScreen`, `RegistrarHuevoScreen.cargarAve` y `DetalleClienteScreen` (muestra "Cliente no encontrado."). Genealogía muestra un texto en lugar de `Alert`. Clientes: la foto del ave es la ruta local hasta R2. Salud: "Guardar diagnóstico" sin `disabled` (doble toque puede duplicar); finalizar tratamiento en API no escribe `RECUPERACION` (lo hace la pantalla). Huevos: concurrencia real por criadero sin probar. Aves: `obtenerEvolucionAve` sigue en SQLite en modo API; `NuevaAveScreen` usa `Number(item.id)`. Reportes: `OrigenId` del CSV de finanzas sale como UUID; `ReportesScreen` deja los resúmenes en cero sin aviso ante error de red (como V1); desempates de empates `DESC` según SQLite (no comprobado en `expo-sqlite`); exportaciones sin paginación (CPU/tamaño con decenas de miles de filas sin medir en D1 real).
- Alertas: errores de red sin aviso en `AlertasScreen`, `InicioScreen` y `MasMenuScreen` (solo `console.error`, como V1); D-2 (orden `rowid` en `expo-sqlite`) y D-3 (punto flotante en bordes) abiertas; CPU en D1 real sin medir. Fotos: R2 sin hacer; `foto_r2_key` guarda la ruta local del teléfono. Google Sign-In pendiente; token de 60 min sin refresh (al vencer, 401 y vuelta al inicio de sesión). PBKDF2 a 100000 iteraciones: 13–20 ms de CPU (riesgo conocido).

## Excepciones aprobadas a pantallas V1 (seis; Bajas y Finanzas no añaden)

1. `MasMenuScreen`: "Cerrar sesión" (solo modo API). 2. `AlimentacionJaulaScreen` y `BebidaJaulaScreen`: `try/catch` con `Alert`. 3. `SaludAveScreen`: `Alert` en `catch` y guarda `if (!ave)`. 4. `ProduccionHuevosScreen`: `Alert` en el `catch` de carga. 5. `GenealogiaAveScreen`: ids `String` (UUID v7), sin `Alert`. 6. Detalle en cada spec de `documents/specs/`.

## Cómo arrancar (Windows, PowerShell)

- API local (desde `api/`, Node 22): `nvm use 22; npm run dev`; leer el puerto en `Ready on http://127.0.0.1:XXXX`. Expo contra el Worker de pruebas: URL solo en variables de la sesión (nunca en archivos ni commits): `NODE_PATH`, `EXPO_NO_TYPESCRIPT_SETUP=1`, `EXPO_PUBLIC_DATA_SOURCE=api`, `EXPO_PUBLIC_API_URL`; luego `npx expo start --tunnel`.

## Proceso vigente (decisión del usuario, 2026-11-07; anula lo anterior sobre /probar completo)

El usuario valida en su teléfono con Expo Go (túnel por Claude Code). Emulador, `/probar smoke` y `/probar completo` solo a petición o con cambios extremadamente grandes (el pendiente del flujo `94` y del tope de 60 min queda en pausa). Se mantienen typecheck, unitarias y `/probar datos` (solo si se toca la API o el dinero). Flujo ligero; informes de máximo 25 líneas. Orden: (1) pruebas en el teléfono, (2) refinamiento UX con `disenador-ux` (creado, sin ejecutar), (3) fotos en R2, (4) login con Google, (5) ambientes de pruebas y producción. En la fase UX las pantallas V1 sí se pueden modificar; lógica, datos, paridad y mensajes de error no cambian. Cambios de texto o estructura rompen los flujos de `pruebas/movil`.

## Siguiente paso exacto

Pruebas del usuario en el teléfono (Expo Go, modo nube) y su lista de hallazgos; después, la propuesta de dirección visual de `disenador-ux` (con aprobación) y R2.
