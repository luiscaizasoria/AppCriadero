# Estado actual (resumen de sesión)

Se carga solo desde `CLAUDE.md` (import). Historial: `documents/bitacora.md`. Actualizar con `/cerrar-dia`. Fecha: 2026-11-10.

## Rama y reglas de trabajo

- Rama única: `trabajo/migracion-nube` (desde `main`). Último push: todos los commits de la fase UX (tras el cierre, HEAD). Sin PR; fusión a `main` solo si el usuario lo pide. Cloudflare: solo `--env test` / base de pruebas, con aprobación; nunca `criadero-kikirikis-dev`, `controlgastos-*` ni `delete` sin aprobación.

## Fase UX: CERRADA, pendiente la prueba final del usuario

- Variante «Pajarera tropical»; Fredoka (títulos, botones, números) y Nunito (cuerpo); mascota SVG (3 saltos, respeta «reducir movimiento»). Dependencias: `expo-font`, `expo-linear-gradient`, `react-native-svg`, `@expo-google-fonts/*`.
- Reglas del tema: tokens en `src/theme/`, componentes en `src/components/`, máximo 2 degradados por pantalla, toques >= 44, contraste AA, sin verde ni amarillo como marca, avisos de éxito no bloqueantes (`Aviso`/`useAvisoExito`; los `Alert` de error y confirmación se mantienen).
- `/probar completo` FINAL del 2026-11-10 (`2026-11-10-163756-completo`, tras todas las correcciones): VERDE, 29 PASO, 0 regresiones, 73,1 min, con el flujo nuevo `87`. Es el último completo válido. Los anteriores del mismo día fueron ROJOS: `105816` (caída del emulador y un aviso efímero, corregido) y `080951` (aviso de `navigate`).
- Correcciones tras la prueba del usuario (8 puntos, dos rondas; commits `80edd19` y `e1e8005`; empujado hasta `d363656`): «Guardando...» y doble envío, iconos (pollito, espiga, jaula SVG, hourglass, brush), Salud vuelve a la ficha con el aviso por el parámetro `avisoSalud`, «Valor» numérico en movimientos (la venta conserva el «Valor inválido» de V1), acento verde/rojo, categorías creadas visibles en Ingreso y Egreso (excepción aprobada a la paridad), validación visual (borde rojo, mensaje, scroll y foco), progreso «Cerrando...»/«Eliminando...», Alert «No fue posible guardar el registro.» y tarjetas de alertas con fuente grande.
- Base de pruebas (recuento final): incluye 3 jaulas, 4 aves y 131 elementos de catálogo creados por el usuario desde el teléfono (no es anomalía); 0 cuentas desechables.
- Sin verificar (ver `documents/ux/pendiente-en-telefono.md`): rendimiento en gama baja, scroll al campo con error, foco bajo el Alert nativo, liberación del botón, aviso de Salud en la ficha y su temporizador de 4 s, tarjetas de alertas con fuente grande.
- Emulador: arrancarlo con `-dns-server 8.8.8.8,1.1.1.1` (sin snapshot perdió el DNS).
- Sin medir: lista de aves con cientos de registros y fotos, coste de degradados, arranque en frío con fuentes. Detalle: `documents/ux/inventario-cambios.md` y `documents/ux/rendimiento.md`.
- Siguiente: prueba final del usuario en el teléfono; luego R2, Google, ambientes y retiro de SQLite con respaldo.

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
| Finanzas (`0011`) | sí (`api/src/finanzas/`) | `FinanzasRepository`, `finanzasApi.js` (sin `obtenerIngresos`/`obtenerEgresos`) | sí (87/87; flujos `95` y `96`) | no |
| Clientes (sin migración) | sí (`api/src/clientes/`, solo lectura) | `ClientesRepository` | sí (datos 96/96; flujo `98`) | no |
| Reportes (sin migración) | sí (`api/src/reportes/`, 10 `GET` de solo lectura) | `ReportesRepository` | sí (datos 104/104; flujo `97`) | no |
| Alertas (sin migración) | sí (`api/src/alertas/`, un `GET /alertas`, solo lectura) | `AlertasRepository` (sin las cuatro parciales) | sí (datos 110/110; flujo `99`) | no |
| Inicio (sin migración) | sí (`api/src/inicio/`, `GET /dashboard`, solo lectura, 6 llamadas D1) | `DashboardRepository` | sí (datos 115/115; flujo `94`) | no |

Migraciones `0001`–`0011` aplicadas en local, integración y base remota de pruebas (la siguiente es `0012`). Pruebas (2026-11-07): 349 unitarias/HTTP y 196 de integración; paridad con V1: Finanzas 235 comparaciones, Clientes 45, Reportes (10 funciones), Alertas 324 e Inicio 140, 0 diferencias; `/probar datos` 115 casos. Base de pruebas tras la fase UX: 0 desechables, 3 cuentas, 3 criaderos, 2 aves.

## Próximos pasos (en este orden)

1. Prueba final del usuario en el teléfono (Expo Go, modo nube): Bajas, Finanzas, Clientes, Reportes, Alertas, Inicio, teclado numérico, modo avión, hora local frente a UTC, scroll y la fase UX.
2. Fotos en R2 (claves `criaderos/{criaderoId}/aves/{aveId}/{evolucionId}.jpg`).
3. Login con Google (con `/auth/me` y refresh token).
4. Ambientes de pruebas y producción con tokens y configuración.
5. Retiro de SQLite con respaldo.

## Incidencias recurrentes

- Cloudflare error 7403 en `wrangler d1 migrations apply ... --remote` (2026-11-01 y 2026-11-04). Reintentar; si persiste, `wrangler logout` y `wrangler login` (el usuario pulsa Allow).
- `/probar completo`: Expo Go "Something went wrong" al abrir, cortes de red hacia Cloudflare, emulador colgado, `adb` en `Broken pipe` y caída del emulador con `device not found` (2026-11-10). El ejecutor reintenta al preparar y limpiar, aborta tras dos fallos de red seguidos y recupera el emulador tras dos FALLO DE ENTORNO seguidos. Si no basta: cerrar el ejecutor y los adb, `adb emu kill` y arrancar el AVD con Start-Process desde PowerShell (no con `&` desde bash) y `-dns-server 8.8.8.8,1.1.1.1`; ver `pruebas/README.md`. Un flujo puede llevar `# SEGUNDA-CUENTA` para que el ejecutor le pase EMAIL2, PASSWORD2 y CRIADERO2.

## Limitaciones conocidas

- Con Inicio migrado ya no queda ningún lector de negocio en SQLite en modo API, salvo lo que dependa de fotos (R2) y `obtenerEvolucionAve`. Desempates de V1 en Inicio (mejor ponedora por `codigo` menor, hora pico por hora mayor) dependen del plan de SQLite y podrían variar en el teléfono; redondeos no probados en `expo-sqlite` ni en D1 real; CPU en D1 real sin medir.
- Cambio visual aprobado en la fase UX: ante un fallo de red, Inicio, Alertas, Finanzas, Reportes, Catálogo, DetalleCliente, DetalleAve y Editar movimiento muestran estado de error con «Reintentar» (V1 dejaba ceros o vacío). Textos nuevos pendientes de decisión: ver el inventario UX.
- Bajas: V1 no libera la jaula al dar de baja (replicado). Finanzas: periodos en UTC como V1; `registrarIngreso`/`registrarEgreso` con `NaN` devuelven 400; `CREACION_POR_CORRECCION` solo cubierto por integración.
- Genealogía muestra un texto en lugar de `Alert`. Clientes: la foto del ave es la ruta local hasta R2. Salud: "Guardar diagnóstico" sin `disabled`; finalizar tratamiento en API no escribe `RECUPERACION` (lo hace la pantalla). Huevos: concurrencia real por criadero sin probar. Aves: `obtenerEvolucionAve` sigue en SQLite en modo API; `NuevaAveScreen` usa `Number(item.id)`. Reportes: `OrigenId` del CSV de finanzas sale como UUID; exportaciones sin paginación. Alertas: D-2 (orden `rowid` en `expo-sqlite`) y D-3 (punto flotante en bordes) abiertas.
- Fotos: R2 sin hacer; `foto_r2_key` guarda la ruta local del teléfono. Google Sign-In pendiente; token de 60 min sin refresh (al vencer, 401 y vuelta al inicio de sesión). PBKDF2 a 100000 iteraciones: 13–20 ms de CPU (riesgo conocido).

## Excepciones aprobadas a pantallas V1 (seis; Bajas y Finanzas no añaden)

1. `MasMenuScreen`: "Cerrar sesión" (solo modo API). 2. `AlimentacionJaulaScreen` y `BebidaJaulaScreen`: `try/catch` con `Alert`. 3. `SaludAveScreen`: `Alert` en `catch` y guarda `if (!ave)`. 4. `ProduccionHuevosScreen`: `Alert` en el `catch` de carga. 5. `GenealogiaAveScreen`: ids `String` (UUID v7), sin `Alert`. 6. Detalle en cada spec de `documents/specs/`.

## Cómo arrancar (Windows, PowerShell)

- API local (desde `api/`, Node 22): `nvm use 22; npm run dev`; leer el puerto en `Ready on http://127.0.0.1:XXXX`. Expo contra el Worker de pruebas: URL solo en variables de la sesión (nunca en archivos ni commits): `NODE_PATH`, `EXPO_NO_TYPESCRIPT_SETUP=1`, `EXPO_PUBLIC_DATA_SOURCE=api`, `EXPO_PUBLIC_API_URL`; luego `npx expo start --tunnel`.

## Proceso vigente (decisión del usuario, 2026-11-07)

El usuario valida en su teléfono con Expo Go (túnel por Claude Code). Emulador, `/probar smoke` y `/probar completo` solo a petición o con cambios extremadamente grandes. Se mantienen typecheck, unitarias y `/probar datos` (solo si se toca la API o el dinero). Flujo ligero; informes de máximo 25 líneas. La fase UX terminó: las pantallas conservan la lógica de negocio, los datos, la paridad y los mensajes de error de V1. Cambios de texto o estructura rompen los flujos de `pruebas/movil`.

## Siguiente paso exacto

Prueba final del usuario en el teléfono (Expo Go, modo nube) y su lista de hallazgos; después, fotos en R2.
