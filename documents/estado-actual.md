# Estado actual (resumen de sesión)

Leer este archivo y `CLAUDE.md` al empezar. Actualizar al cerrar cada módulo. Fecha: 2026-11-01.

## Rama y reglas de trabajo

- Rama única: `trabajo/migracion-nube` (desde `main`). Commits locales; push solo con aprobación; sin PR; fusión a `main` solo cuando el usuario lo pida.
- Cloudflare: solo `--env test` / base `criadero-kikirikis-test`, con aprobación del usuario para esos comandos. Nunca `criadero-kikirikis-dev`, `controlgastos-*` ni `delete` sin aprobación.

## Módulos hechos

| Módulo | API | Cliente app | Probado en Worker de pruebas | Teléfono |
|---|---|---|---|---|
| Auth, criaderos, onboarding | sí | sí | sí | sí |
| Jaulas (migración `0005`) | sí | `JaulaRepository.api.js` | sí | sí (sin historial ni `cantidad_aves` reales) |
| Catálogos (42 ítems por criadero) | sí | `ConfiguracionRepository.api.js` | sí | sí (listas y alta de ítems) |

Migraciones: `0001`–`0005` aplicadas en local, en pruebas y en la base remota de pruebas. Siguiente: `0006` (aves, ave_evolucion, ave_historial, jaula_historial).

## Módulos pendientes (orden propuesto)

1. **Aves** con historiales y "finalizar tratamiento" (incluye `jaula_historial` y `cantidad_aves`).
2. Cuidados de jaula. 3. Salud. 4. Bajas. 5. Huevos. 6. Finanzas.
7. R2 (fotos). 8. Google Sign-In (con `/auth/me` y refresh token).

## Limitaciones conocidas

- Aves, cuidados de jaula, Salud y Finanzas siguen en SQLite local. En modo API, asignar un ave a una jaula falla (`FOREIGN KEY constraint failed`: la jaula está en la nube y el ave en SQLite). Guardar Alimentación, Bebida y Sanidad falla por la misma causa.
- Finalizar tratamiento falla con `TypeError: undefined is not a function` (bug conocido de V1 por la función perdida en v1.0.1).
- Fotos: R2 sin hacer; las imágenes siguen como ruta local del teléfono.
- Google Sign-In pendiente. El token dura 60 minutos, sin refresh token; al vencer (401) la app vuelve al inicio de sesión. `FORBIDDEN`/`CRIADERO_NOT_FOUND` sobre el criadero guardado devuelve a la selección de criadero.
- PBKDF2 a 100000 iteraciones (máximo de workerd); en Workers Free midió 13–20 ms de CPU, sin cortes en pruebas (riesgo conocido).

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

Aprobación del plan del módulo **Aves** (spec `documents/specs/aves.md`); después migración `0006`, API, cliente `AveRepository.api.js` y arreglo del import roto de "finalizar tratamiento" sin tocar pantallas.
