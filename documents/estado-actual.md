# Estado actual (resumen de sesión)

Se carga solo desde `CLAUDE.md` (import). Historial de sesiones: `documents/bitacora.md`. Actualizar con `/cerrar-dia`. Fecha: 2026-11-02.

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

Migraciones: `0001`–`0007` aplicadas en local y en integración. `0001`–`0007` están en la base remota de pruebas (`0006` = aves, ave_evolucion, ave_historial, jaula_historial y diagnosticos_ave; `0007` aplicada el 2026-11-02 con `--remote --env test`).

## Módulos pendientes (orden)

1. Salud. 2. Bajas. 3. Huevos. 4. Finanzas. 5. R2 (fotos; módulo aparte, claves propuestas `criaderos/{criaderoId}/aves/{aveId}/{evolucionId}.jpg`). 6. Google Sign-In (con `/auth/me` y refresh token).
7. **Fase 6 del roadmap:** Alertas, Inicio y Reportes (siguen leyendo el SQLite local; las alertas "Sin alimentación registrada hoy" no ven los cuidados de la nube) y Genealogía.

## Limitaciones conocidas

- Salud y Finanzas siguen en SQLite local.
- Mientras Inicio no se migre, dos cuentas en el mismo teléfono verán los contadores del SQLite local compartido (Inicio lee `DashboardRepository` sobre un único archivo local).
- Alertas, Inicio y Reportes siguen leyendo SQLite (fase 6): no ven los cuidados de jaula guardados en la nube.
- `/probar completo` deja ahora como "PENDIENTE DE MIGRAR": genealogía, huevos, dashboard y salud.
- Aves: ciclo de vida (`obtenerCicloVidaAve`) y evolución (`obtenerEvolucionAve`) siguen en SQLite en modo API; el ciclo de vida queda vacío hasta huevos, bajas y salud. Vendidas y fallecidas sin `bajas_ave` y `obtenerBajaAve` devuelve `null` (Bajas). `NuevaAveScreen` usa `Number(item.id)` (da `NaN` con UUID; efecto menor en el filtro de padres y la excepción de sexo).
- Finalizar tratamiento: en modo API el endpoint no escribe `RECUPERACION` (lo hace la pantalla con `POST /:aveId/eventos`); en SQLite, `EstadoSaludRepository.sqlite.js` restaura `finalizarTratamiento` de v1.0.0 (ya no falla con `TypeError`).
- Fotos: R2 sin hacer; `foto_r2_key` guarda la ruta local del teléfono (no es clave de objeto).
- Google Sign-In pendiente. El token dura 60 minutos, sin refresh token; al vencer (401) la app vuelve al inicio de sesión. `FORBIDDEN`/`CRIADERO_NOT_FOUND` sobre el criadero guardado devuelve a la selección de criadero.
- PBKDF2 a 100000 iteraciones (máximo de workerd); en Workers Free midió 13–20 ms de CPU, sin cortes en pruebas (riesgo conocido).

## Excepciones aprobadas a la regla de no tocar pantallas V1

1. "Cerrar sesión" en `MasMenuScreen` (solo en modo API). Motivo: autenticación.
2. `AlimentacionJaulaScreen.js` y `BebidaJaulaScreen.js`: `try/catch` con `Alert.alert('Error', 'No fue posible guardar el registro.')` (mismo estilo que `SanidadJaulaScreen`), aprobada por el usuario el 2026-11-02. Motivo: errores de red al pasar a la nube; V1 no manejaba errores en esas pantallas y la promesa rechazada las dejaba sin respuesta. Nada más cambió en ellas. Detalle en `documents/specs/cuidados-jaula.md`.

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

Plan del módulo **Salud** (o el que decida el usuario). Pendientes previos: comprobar Cuidados de jaula en el teléfono y validar Aves en el teléfono y en el Worker de pruebas.
