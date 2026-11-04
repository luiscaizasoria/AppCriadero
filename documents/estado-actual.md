# Estado actual (resumen de sesión)

Se carga solo desde `CLAUDE.md` (import). Historial de sesiones: `documents/bitacora.md`. Actualizar con `/cerrar-dia`. Fecha: 2026-11-03.

## Rama y reglas de trabajo

- Rama única: `trabajo/migracion-nube` (desde `main`). Commits locales; push solo con aprobación; sin PR; fusión a `main` solo cuando el usuario lo pida.
- Cloudflare: solo `--env test` / base `criadero-kikirikis-test`, con aprobación del usuario para esos comandos. Nunca `criadero-kikirikis-dev`, `controlgastos-*` ni `delete` sin aprobación.

## Módulos hechos

| Módulo | API | Cliente app | Probado en Worker de pruebas | Teléfono |
|---|---|---|---|---|
| Auth, criaderos, onboarding | sí | sí | sí | sí |
| Jaulas (migración `0005`) | sí | `JaulaRepository.api.js` | sí | sí (sin historial ni `cantidad_aves` reales) |
| Catálogos (42 ítems por criadero) | sí | `ConfiguracionRepository.api.js` | sí | sí (listas y alta de ítems) |
| Aves (migración `0006`, commits `4fc1831` y `37df1fa`) | sí | `AveRepository.api.js` y fachadas | sí (capa 1 y flujos del emulador) | no (pendiente) |
| Cuidados de jaula (migración `0007`; commits `8ee3c59`, `909ffc0`, `39ff632`, `aa472b6`) | sí | `Alimentacion/Bebida/SanidadJaula/Historial *.api.js` con fachadas | sí (`/probar datos` y flujos del emulador) | pendiente |
| Salud (migración `0008`; commits `7e02ccd`, `e5805e6`, `31b823c`, `b9001bb`, `17ea040`) | sí (`api/src/salud/`) | `SaludRepository.{js,sqlite.js,api.js}` (sin `actualizarEstadoSaludAve` en API) | sí (`/probar datos` 44/44, flujo `60-salud-enfermedad`) | pendiente (modo avión: `Alert` de error) |
| Huevos (migración `0009`; commits `07d203d`, `c338b74`, `469b742`, `3436a62`) | sí (`api/src/huevos/`) | `HuevoRepository` y `ProduccionRepository` (`.js`, `.sqlite.js`, `.api.js`) y `src/api/huevosApi.js` | sí (`/probar datos` 49/49, smoke y flujo `70-huevo`) | pendiente (registrar huevo, Producción, modo avión) |

Migraciones: `0001`–`0009` aplicadas en local y en integración, y también en la base remota de pruebas (`0006` = aves, ave_evolucion, ave_historial, jaula_historial y diagnosticos_ave; `0007` = cuidados de jaula; `0008` = `tratamientos_ave`; `0009` = huevos). Pruebas: 222 unitarias/HTTP y 72 de integración.

## Módulos pendientes (orden)

1. Bajas. 2. Finanzas. 3. R2 (fotos; módulo aparte, claves propuestas `criaderos/{criaderoId}/aves/{aveId}/{evolucionId}.jpg`). 4. Google Sign-In (con `/auth/me` y refresh token).
5. Genealogía y Ciclo de vida (esperan indicación del usuario; el ciclo de vida seguirá sin huevos hasta entonces).
6. **Fase 6 del roadmap:** Alertas, Inicio y Reportes (siguen leyendo el SQLite local; las alertas "Sin alimentación registrada hoy" y "Sin producción registrada" no ven los datos de la nube).

## Limitaciones conocidas

- Finanzas sigue en SQLite local. Salud y Huevos ya están en la nube, pero la ficha de ave sigue sin bajas y su ciclo de vida sin huevos (Genealogía/Ciclo de vida).
- `SaludAveScreen`: el botón "Guardar diagnóstico" sigue sin `disabled` (doble toque puede duplicar). El `TypeError` por `ave` nula quedó resuelto con la cuarta excepción.
- Huevos: la concurrencia real del código por criadero no está probada (UNIQUE como respaldo). Periodos de producción en UTC, como V1. `ProduccionHuevosScreen` no está cubierta por el flujo del emulador. `DetalleAveScreen` (catch de carga) y `RegistrarHuevoScreen.cargarAve` quedan sin aviso de red, como V1 (decisión del usuario).
- `/probar completo` no se ejecutó al cerrar Huevos; se hará una vez al cerrar Genealogía.
- Mientras Inicio no se migre, dos cuentas en el mismo teléfono verán los contadores del SQLite local compartido (Inicio lee `DashboardRepository` sobre un único archivo local).
- Alertas, Inicio y Reportes siguen leyendo SQLite (fase 6): no ven los cuidados de jaula guardados en la nube.
- `/probar completo` dejará como "PENDIENTE DE MIGRAR": genealogía y dashboard.
- Aves: ciclo de vida (`obtenerCicloVidaAve`) y evolución (`obtenerEvolucionAve`) siguen en SQLite en modo API; el ciclo de vida queda vacío hasta huevos, bajas y salud. Vendidas y fallecidas sin `bajas_ave` y `obtenerBajaAve` devuelve `null` (Bajas). `NuevaAveScreen` usa `Number(item.id)` (da `NaN` con UUID; efecto menor en el filtro de padres y la excepción de sexo).
- Finalizar tratamiento: en modo API el endpoint no escribe `RECUPERACION` (lo hace la pantalla con `POST /:aveId/eventos`); en SQLite, `EstadoSaludRepository.sqlite.js` restaura `finalizarTratamiento` de v1.0.0 (ya no falla con `TypeError`).
- Fotos: R2 sin hacer; `foto_r2_key` guarda la ruta local del teléfono (no es clave de objeto).
- Google Sign-In pendiente. El token dura 60 minutos, sin refresh token; al vencer (401) la app vuelve al inicio de sesión. `FORBIDDEN`/`CRIADERO_NOT_FOUND` sobre el criadero guardado devuelve a la selección de criadero.
- PBKDF2 a 100000 iteraciones (máximo de workerd); en Workers Free midió 13–20 ms de CPU, sin cortes en pruebas (riesgo conocido).

## Excepciones aprobadas a la regla de no tocar pantallas V1 (cinco)

1. "Cerrar sesión" en `MasMenuScreen` (solo en modo API). Motivo: autenticación.
2. `AlimentacionJaulaScreen.js` y `BebidaJaulaScreen.js`: `try/catch` con `Alert.alert('Error', 'No fue posible guardar el registro.')` (mismo estilo que `SanidadJaulaScreen`), aprobada por el usuario el 2026-11-02. Motivo: errores de red al pasar a la nube; V1 no manejaba errores en esas pantallas y la promesa rechazada las dejaba sin respuesta. Nada más cambió en ellas. Detalle en `documents/specs/cuidados-jaula.md`.
3. `SaludAveScreen.js`: solo dos `Alert.alert` en los `catch` de `cargarDatos` ('No fue posible cargar los datos de salud.') y `guardar` ('No fue posible guardar el registro.'), aprobada por el usuario el 2026-11-02. Motivo: errores de red. Sin `disabled` en el botón. Detalle en `documents/specs/salud.md`.
4. `SaludAveScreen.js` (commit `17ea040`): guarda `if (!ave) { return null; }` tras el bloque de `loading`, para evitar el `TypeError` del render si falla la carga. Motivo: errores de red.
5. `ProduccionHuevosScreen.js` (commit `469b742`): import de `Alert` y un `Alert.alert('Error', 'No fue posible cargar la producción de huevos.')` en el `catch` de carga. Motivo: errores de red. El usuario decidió no tocar `DetalleAveScreen.js` (catch de carga) ni `RegistrarHuevoScreen.cargarAve`. Detalle en `documents/specs/huevos.md`.

## Cómo arrancar (Windows, PowerShell)

- API local (desde `api/`, Node 22): `nvm use 22; npm run dev`; leer el puerto en `Ready on http://127.0.0.1:XXXX`.
- Expo contra el Worker de pruebas, con la URL **solo en variables de entorno de la sesión** (nunca en archivos ni en commits):

  ```
  $env:NODE_PATH = "$(npm root -g)"
  $env:EXPO_NO_TYPESCRIPT_SETUP = "1"
  $env:EXPO_PUBLIC_DATA_SOURCE = "api"
  $env:EXPO_PUBLIC_API_URL = "<url del Worker de pruebas>"
  npx expo start --tunnel
  ```

  `NODE_PATH` permite resolver `@expo/ngrok` instalado globalmente. Parar con Ctrl+C. Sin `EXPO_PUBLIC_DATA_SOURCE=api` la app usa SQLite como V1.

## Siguiente paso exacto

Esperar indicación del usuario para **Genealogía y Ciclo de vida**. Pendientes previos: comprobar en el teléfono Huevos (registrar huevo, Producción, modo avión), Salud (modo avión: `Alert` de error), Cuidados de jaula y Aves.
