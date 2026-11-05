# Roadmap V2 — Criadero Kikirikis

## Estado actual

V2 es **online-first** (D1 y R2 como fuentes de verdad, sin sincronización offline). La API en `api/` ya tiene la plataforma base, autenticación con email y contraseña, criaderos y onboarding. V1.0.3 sigue siendo la referencia funcional y la app móvil continúa usando su SQLite local hasta que cada módulo se reemplace por su cliente REST.

Rama de trabajo: `trabajo/migracion-nube` (desde `main`; rama única, sin PR; se fusiona a `main` solo cuando el usuario lo pida). Última actualización de este documento: 4 de noviembre de 2026.

## Fases

### Fase 1 — Plataforma base: completada

- Proyecto TypeScript con Cloudflare Workers y Hono en `api/`.
- D1 con migraciones `0001`–`0004` (hoy el esquema llega a `0011`) y `GET /api/v1/health`.
- Arquitectura `routes -> factory -> service -> repository` y composición de `app.ts` inyectable.
- Pruebas unitarias, HTTP e integración con D1 local.

### Fase 2 — Autenticación y criaderos: en curso

Completado:

- Registro y login con email y contraseña; JWT propio (access token de 1 hora); middleware.
- Creación de criadero con 42 items de catálogo iniciales (ALIMENTOS con `MORICHILLO` y `BALANCEADO`; BEBIDAS con `AGUA` y `AGUA_VITAMINA`) y configuración.
- Onboarding: configuración principal, finalizar y consultar estado; control de propiedad y de concurrencia.

Pendiente:

- Google Sign-In (`POST /api/v1/auth/google`).
- `GET /api/v1/auth/me`.
- Listado de criaderos del usuario (y detalle, actualización y selección de criadero activo).
- Decidir el refresh token y el registro (`active` y verificación de correo). Ver "Riesgos y decisiones abiertas" en `arquitectura-v2.md`.

### Fase 3 — R2 e imágenes

- Bucket y binding, política de acceso, validación de MIME y tamaño, claves de objeto no predecibles con aislamiento por usuario y criadero.
- Estrategia de subida, reemplazo y eliminación; referencias en D1 (`r2_object_key`); compensación entre D1 y R2.
- Campos afectados de V1: foto del ave, foto de evolución y logo del criadero.

### Fase 4 — Migración de repositorios de V1

Para cada módulo: leer su pantalla y su repositorio en V1, redactar la spec en `documents/specs/`, definir esquema y contrato de API, implementar permisos y comprobar que los datos pueden conservarse. Orden:

1. `JaulaRepository`
2. `AveRepository`
3. `HuevoRepository`
4. `SaludRepository`
5. `FinanzasRepository`

Orden decidido el 2026-10-29: Jaulas antes que Aves, con migraciones `0005` (jaulas) y `0006` (aves), FK real y `ON DELETE RESTRICT`. Ave y Jaula tienen referencias cruzadas: validar las claves foráneas contra el código real de V1.

Estado de los módulos (2026-11-04, rama `trabajo/migracion-nube`):

- **Jaulas**: implementado (API y cliente REST); `0005` aplicada en local y pruebas. Ampliado con Aves: `cantidadAves` real, `aves-historicas`, `historial` y baja que libera aves.
- **Aves**: implementado (API en `api/src/aves/`, migración `0006` con `aves`, `ave_evolucion`, `ave_historial`, `jaula_historial` y `diagnosticos_ave`, cliente `AveRepository.api.js` y fachadas de `AveRepository`, `CicloVidaRepository`, `EvolucionAveRepository` y `EstadoSaludRepository`). Probado en local e integración; **pendiente:** Worker de pruebas (`0006` remota y redespliegue) y teléfono. Limitaciones: foto local en `foto_r2_key`, vendidas/fallecidas sin `bajas_ave` (resuelto con Bajas, `0010`), ciclo de vida y evolución en SQLite en modo API. Detalle en `documents/specs/aves.md`.
- **Cuidados de jaula**: implementado (2026-11-02). Migración `0007` (`alimentacion_jaula`, `bebida_jaula`, `sanidad_jaula`), API en `api/src/cuidados/` (`POST` alimentación, bebida y sanidad, `GET` alimentación; `GET /historial` de jaulas ahora con `fechaCreacion`) y clientes `Alimentacion/Bebida/SanidadJaula/Historial *.api.js` con fachadas. Probado en local, integración y Worker de pruebas; **pendiente:** teléfono y las alertas "Sin alimentación/bebida registrada hoy" (fase 6). Detalle en `documents/specs/cuidados-jaula.md`.
- **Salud**: implementado (2026-11-02). Migración `0008` (`tratamientos_ave`), API en `api/src/salud/` (`POST .../aves/:aveId/diagnosticos`, `GET .../aves/:aveId/salud`) y cliente `SaludRepository.{js,sqlite.js,api.js}` (`actualizarEstadoSaludAve` omitida por decisión del usuario). Excepción aprobada: dos `Alert` en `SaludAveScreen`. Probado en local, integración (54), unitarias/HTTP (203), Worker de pruebas y emulador; **pendiente:** teléfono. Detalle en `documents/specs/salud.md`.
- **Huevos**: implementado (2026-11-03). Migración `0009` (`huevos`), API en `api/src/huevos/` (`POST` y `GET .../aves/:aveId/huevos`, `GET .../huevos/siguiente-codigo` y `GET .../huevos/produccion/{resumen,ranking,por-dia,por-dia-historico,por-hora,por-jaula,por-ave,total}`; código `H`+6 dígitos por criadero; periodos en UTC) y clientes `HuevoRepository` y `ProduccionRepository` con fachadas. Excepción aprobada: un `Alert` de carga en `ProduccionHuevosScreen` (quinta; `DetalleAveScreen` y `RegistrarHuevoScreen.cargarAve` no se tocan). Probado en local, integración (72), unitarias/HTTP (222), Worker de pruebas y emulador; **pendiente:** teléfono; Alertas, Inicio y Reportes siguen en SQLite y el ciclo de vida del ave ya muestra los huevos (Ciclo de vida, 2026-11-03). Detalle en `documents/specs/huevos.md`.
- **Genealogía**: implementada (2026-11-03). Sin endpoint ni migración (opción A del usuario): `GenealogiaRepository.api.js` reutiliza el algoritmo de V1 y lee las aves con `GET /aves?estado=ACTIVA|VENDIDA|FALLECIDA`. Sexta excepción aprobada a pantallas V1 (`GenealogiaAveScreen.js`, ids `String`). Probada en el Worker de pruebas y en el emulador; **pendiente:** teléfono, y aves vendidas/fallecidas (ya con Bajas, 2026-11-04). Detalle en `documents/specs/genealogia.md`.
- **Ciclo de vida**: implementado (2026-11-03). Nuevo `GET /aves/:aveId/evolucion` (solo lectura, sin migración); `CicloVidaRepository.api.js` reúne historial, evolución, salud y huevos en el cliente (las bajas se leen con `GET /bajas` desde Bajas, 2026-11-04). Sin excepción de pantalla. **Pendiente:** teléfono. Detalle en `documents/specs/ciclo-vida.md`.
- **Bajas**: implementado (2026-11-04). Migración `0010` (`bajas_ave` y `movimientos_financieros`), API en `api/src/aves/` (`POST .../aves/:aveId/muerte`, `POST .../venta`, `GET .../bajas`; las listas `GET /aves?estado=VENDIDA|FALLECIDA` usan `INNER JOIN bajas_ave`) y cliente `BajaAveRepository.{js,sqlite.js,api.js}` (`obtenerBajasAve` omitida); `obtenerBajaAve` y el ciclo de vida leen `GET /bajas`. Cada venta escribe 2 ingresos (`VENTA_AVE` y `ENVIO_AVE`, este con valor 0 si no hay envío). Sin excepciones nuevas a pantallas V1. Probado en local, integración (84), unitarias/HTTP (248), Worker de pruebas (`/probar datos` 75/75) y emulador (flujos `90` y `91`); **pendiente:** teléfono. Limitación: Finanzas, Inicio, Reportes y Clientes (SQLite) no ven las ventas de la nube hasta migrar Finanzas (hecho el 2026-11-04) y la fase 6. Detalle en `documents/specs/bajas.md`.
- **Finanzas**: implementado (2026-11-04). Migración `0011` (`movimientos_financieros_historial`), API en `api/src/finanzas/` (11 endpoints bajo `/criaderos/:criaderoId/finanzas`: resumen, movimientos, ingresos, egresos, movimiento por id, edición, historial, venta por baja, corrección de venta y consolidados por categoría y mensual) y cliente `FinanzasRepository.{js,sqlite.js,api.js}` más `src/api/finanzasApi.js` (`obtenerIngresos` y `obtenerEgresos` omitidas, sin llamadores). Sin excepciones a pantallas V1 (siguen seis). Paridad con el código real de V1: 235 comparaciones sin diferencias. Probado en local, integración (119), unitarias/HTTP (285), Worker de pruebas (`/probar datos` 87/87), smoke y emulador (flujos `95` y `96`); **pendiente:** teléfono. Limitación: Inicio, Reportes, Clientes y Alertas siguen en SQLite y no ven finanzas ni ventas de la nube hasta la fase 6. Detalle en `documents/specs/finanzas.md`.
- **Clientes**: implementado (2026-11-05), primer módulo de la fase 6. Sin migración. API de solo lectura en `api/src/clientes/` (`GET /clientes`, `/clientes/:celular` y `/clientes/:celular/compras`; 2 llamadas D1 por endpoint) y cliente `ClientesRepository.{js,sqlite.js,api.js}`. Sin excepciones a pantallas V1. Paridad con el código real de V1: 45 comparaciones sin diferencias. Probado en integración (130), unitarias/HTTP (298), `/probar datos` 96/96, smoke y flujo `98`; **pendiente:** teléfono, foto del ave (R2); `obtenerExportacionClientes` ya está en Reportes. Detalle en `documents/specs/clientes.md`.
- **Reportes**: implementado (2026-11-05), segundo módulo de la fase 6. Sin migración. API de solo lectura en `api/src/reportes/` (10 `GET` bajo `/criaderos/:criaderoId/reportes`: aves, salud, produccion, finanzas y `exportaciones/{aves,ventas,clientes,finanzas,huevos,jaulas}`; reloj `ahora` inyectable; 2 o 3 llamadas D1 por endpoint) y cliente `ReportesRepository.{js,sqlite.js,api.js}`. Sin excepciones a pantallas V1. Paridad con el código real de V1 (10 funciones, 0 diferencias; los desempates de enfermedades y de clientes son `DESC`). Probado en integración (145), unitarias/HTTP (317), `/probar datos` 104/104, smoke y flujo `97`; **pendiente:** teléfono; riesgo de CPU/tamaño con decenas de miles de filas sin medir en D1 real. Detalle en `documents/specs/reportes.md`.
- **Huevos, cobertura nueva (2026-11-03):** caso `09b-huevos-formas` y flujo `71-produccion-huevos`.
- **Orden siguiente:** a la espera de indicación del usuario; comprobación en el teléfono y candidatos R2 (módulo aparte; claves propuestas `criaderos/{criaderoId}/aves/{aveId}/{evolucionId}.jpg`), Google Sign-In y el resto de la fase 6 (Alertas e Inicio, en ese orden, módulo por módulo, que necesitarán `GET /finanzas/resumen?periodo=MES|TODO` o `GET /finanzas/movimientos`).
- **Catálogos**: **implementado** en la rama `trabajo/migracion-nube`. Seis endpoints bajo `/api/v1/criaderos/:criaderoId/catalogos` (solo los 7 catálogos básicos), plantilla de criadero de 42 ítems, sin migración nueva y cliente de la app `ConfiguracionRepository.js` (conmutador) con `.sqlite.js` y `.api.js`. Validado con pruebas unitarias, HTTP e integración y con el Worker local. **Pendiente:** validar en el teléfono y redesplegar en el Worker de pruebas. Detalle en `documents/specs/catalogos.md`.

Puerta previa a Aves (actualizada 2026-10-31):

- PBKDF2 pasó a 100000 iteraciones (máximo de workerd). CPU medido: 13-20 ms por hash frente al límite de 10 ms del plan gratuito; el usuario decidió mantenerlo y el plan de su cuenta no se pudo confirmar.
- El PR de agentes ya está fusionado.
- No habrá PR de Jaulas: desde 2026-10-31 se trabaja en una sola rama (`trabajo/migracion-nube`) y se fusiona a `main` solo cuando el usuario lo pida.
- Pendiente de la puerta: validar Catálogos en el teléfono y redesplegar el Worker de pruebas.

### Fase 5 — Funcionalidades derivadas

- Bajas (muerte y venta, con sus movimientos financieros): implementadas (2026-11-04). Finanzas: implementada (2026-11-04).
- Evolución física, genealogía y ciclo de vida.
- Alimentación, bebida y sanidad de jaula.
- Clientes derivados de las ventas.

### Fase 6 — Dashboard, reportes y alertas

- Dashboard, producción de huevos, alertas, reportes y exportación.
- Dependen de los CRUD transaccionales anteriores.
- **Pendientes de migración a la API:** Alertas e Inicio (Clientes y Reportes ya migrados el 2026-11-05) siguen leyendo el SQLite local (`AlertasRepository`, `DashboardRepository`). Mientras tanto no ven los datos de la nube (p. ej. las alertas "Sin alimentación registrada hoy" no ven los cuidados de jaula) y dos cuentas en el mismo teléfono comparten los contadores de Inicio.

### Fase 7 — Reemplazo de los conectores locales del móvil por REST

- Google Sign-In en la app, almacenamiento seguro del JWT y clientes REST.
- Sustituir los repositorios locales uno por uno, conservando pantallas y comportamiento.
- Retirar la dependencia funcional de SQLite módulo a módulo, solo cuando cada uno esté validado.
- Decidir el destino de `BackupRepository`.
- No migrar toda la app en un único cambio.

## Fuera de alcance

Sincronización SQLite ↔ D1, cola offline, resolución de conflictos, motor offline-first, lotes de aves, otras especies y roles o membresías (salvo nuevo requerimiento explícito).

## Regla para avanzar

Trabajar en cambios pequeños desde la rama de trabajo vigente. Antes de iniciar cada fase, confirmar el alcance y las dependencias de la anterior. No dar una fase por completada solo porque la API responda: deben cumplirse los criterios de terminado de su spec (pruebas, propiedad por criadero y equivalencia con V1).

## Referencias

- `documents/referencia-v1/baseline-v1.md`: comportamiento existente de V1.
- `documents/arquitectura/arquitectura-v2.md`: decisiones técnicas y riesgos abiertos.
- `documents/arquitectura/modelo-datos-v2.md`: esquema D1 y modelo futuro (borrador).
- `documents/referencia-v1/analisis-v1-mapeo-api.md`: análisis de V1 y mapeo repositorio → endpoint.
- `documents/traspaso/`: decisiones vigentes y su historia.
- `documents/historico/`: detalle histórico para consultas puntuales.
