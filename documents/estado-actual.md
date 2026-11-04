# Estado actual (resumen de sesión)

Se carga solo desde `CLAUDE.md` (import). Historial: `documents/bitacora.md`. Actualizar con `/cerrar-dia`. Fecha: 2026-11-04.

## Rama y reglas de trabajo

- Rama única: `trabajo/migracion-nube` (desde `main`). Último push conocido: `2b110c5`; los commits posteriores (`9ac55e4`, `d75d030`, `8ff491b`, `a97771a`, `6f5c9a8`, `55e5337`) son locales y el push está por verificar (requiere aprobación). Sin PR; fusión a `main` solo si el usuario lo pide.
- Cloudflare: solo `--env test` / base de pruebas, con aprobación. Nunca `criadero-kikirikis-dev`, `controlgastos-*` ni `delete` sin aprobación.
- Spec en borrador sin implementar: `documents/specs/finanzas.md`.
- Node 22: `.nvmrc` en la raíz (sin `engines`).

## Módulos hechos

| Módulo | API | Cliente app | Probado (Worker de pruebas) | Teléfono |
|---|---|---|---|---|
| Auth, criaderos, onboarding | sí | sí | sí | sí |
| Jaulas (`0005`) | sí | `JaulaRepository.api.js` | sí | sí (sin historial) |
| Catálogos (42 ítems por criadero) | sí | `ConfiguracionRepository.api.js` | sí | sí |
| Aves (`0006`) | sí | `AveRepository.api.js` y fachadas | sí | no |
| Cuidados de jaula (`0007`) | sí | `Alimentacion/Bebida/SanidadJaula/Historial` | sí | no |
| Salud (`0008`) | sí | `SaludRepository` (sin `actualizarEstadoSaludAve` en API) | sí (44/44) | no |
| Huevos (`0009`) | sí (`api/src/huevos/`) | `HuevoRepository`, `ProduccionRepository` | sí (49/49) | no |
| Genealogía (sin migración) | usa `GET /aves` | `GenealogiaRepository` | sí (flujo `80`) | no |
| Ciclo de vida (sin migración) | solo `GET /aves/:aveId/evolucion` | `CicloVidaRepository` (lee bajas con `GET /bajas`) | sí (flujo `81`) | no |
| Bajas (`0010`) | sí (`api/src/aves/`: `muerte`, `venta`, `bajas`) | `BajaAveRepository`; `obtenerBajaAve` y ciclo de vida leen `GET /bajas` | sí (datos 75/75 con el caso `12-bajas`; flujos `90` y `91`) | no |

Migraciones `0001`–`0010` aplicadas en local, integración y base remota de pruebas. Pruebas (2026-11-04): 248 unitarias/HTTP y 84 de integración; `/probar datos` 75/75; `/probar smoke` verde; flujos `90` y `91` PASO. Último `/probar completo` entero (2026-11-03): 15 flujos PASO, 0 regresiones (no se repitió en Bajas). Commits: ver `git log` y la bitácora.

## Módulos pendientes (orden)

1. **Finanzas**: migración `0011` = `movimientos_financieros_historial` (la tabla `movimientos_financieros` ya existe desde `0010`). Sigue en SQLite; spec en borrador.
2. R2 (fotos; claves propuestas `criaderos/{criaderoId}/aves/{aveId}/{evolucionId}.jpg`) y Google Sign-In (con `/auth/me` y refresh token).
3. Fase 6: Alertas, Inicio y Reportes (siguen en SQLite).

## Limitaciones conocidas

- Bajas: V1 no libera la jaula al dar de baja y acepta una segunda baja (replicado). `obtenerBajasAve` omitida (sin llamadores). Ciudad destino y Cooperativa de envío de `BajaAveScreen` sin automatizar (sin `testID`). `DetalleAveScreen` no avisa si `obtenerBajaAve` falla por red (como V1).
- Finanzas en SQLite: en modo API las ventas se escriben en `movimientos_financieros` de D1, pero Finanzas, Inicio, Reportes y Clientes leen SQLite y no las ven hasta migrar Finanzas.
- Inicio, Alertas y Reportes leen SQLite: no ven cuidados, huevos ni salud de la nube. Dos cuentas en el mismo teléfono ven los contadores del SQLite compartido.
- `/probar completo`: solo `PENDIENTE DE MIGRAR: dashboard`.
- Errores de red sin aviso, como V1: `DetalleAveScreen` y `RegistrarHuevoScreen.cargarAve` (decisión del usuario). Genealogía muestra un texto en lugar de `Alert`.
- Salud: el botón "Guardar diagnóstico" no tiene `disabled` (doble toque puede duplicar).
- Huevos: concurrencia real por criadero sin probar (UNIQUE como respaldo). Periodos en UTC, como V1.
- Aves: `obtenerEvolucionAve` sigue en SQLite en modo API (sin llamadores). `NuevaAveScreen` usa `Number(item.id)` (`NaN` con UUID; efecto menor).
- Finalizar tratamiento en API no escribe `RECUPERACION` (lo hace la pantalla con `POST /:aveId/eventos`).
- Fotos: R2 sin hacer; `foto_r2_key` guarda la ruta local del teléfono.
- Google Sign-In pendiente. Token de 60 min sin refresh; al vencer (401) vuelve al inicio de sesión.
- PBKDF2 a 100000 iteraciones: 13–20 ms de CPU en Workers Free (riesgo conocido).
- Entorno de pruebas: un emulador con `pm list packages` en `Broken pipe` se resolvió con `adb emu kill` y arrancándolo de nuevo (`adb reboot` no sirvió; ver `pruebas/README.md`).

## Excepciones aprobadas a pantallas V1 (seis; Bajas no añadió ninguna)

1. `MasMenuScreen`: "Cerrar sesión" (solo modo API). Motivo: autenticación.
2. `AlimentacionJaulaScreen` y `BebidaJaulaScreen`: `try/catch` con `Alert` (2026-11-02). Motivo: errores de red.
3. `SaludAveScreen`: `Alert` en los `catch` de carga y guardado (2026-11-02) y guarda `if (!ave)` (`17ea040`). Motivo: errores de red.
4. `ProduccionHuevosScreen`: `Alert` en el `catch` de carga (`469b742`). Motivo: errores de red.
5. `GenealogiaAveScreen` (`906510e`): `Number` → `String` en ids (UUID v7); sin `Alert`, por decisión del usuario.
6. Detalle en cada spec de `documents/specs/`.

## Cómo arrancar (Windows, PowerShell)

- API local (desde `api/`, Node 22, `.nvmrc`): `nvm use 22; npm run dev`; leer el puerto en `Ready on http://127.0.0.1:XXXX`.
- Expo contra el Worker de pruebas: la URL solo en variables de la sesión (nunca en archivos ni commits): `NODE_PATH`, `EXPO_NO_TYPESCRIPT_SETUP=1`, `EXPO_PUBLIC_DATA_SOURCE=api`, `EXPO_PUBLIC_API_URL`; luego `npx expo start --tunnel`.

## Siguiente paso exacto

Esperar la indicación del usuario. Candidatos: comprobar Bajas en el teléfono (venta con coma decimal, muerte, listas Vendidas y Fallecidas, Detalle, Ciclo de vida, modo avión en "Confirmar baja") y planear Finanzas (`0011`); verificar y, si el usuario lo aprueba, hacer el push de los commits locales.
