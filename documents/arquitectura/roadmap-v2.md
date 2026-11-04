# Roadmap V2 — Criadero Kikirikis

## Estado actual

V2 es **online-first** (D1 y R2 como fuentes de verdad, sin sincronización offline). La API en `api/` ya tiene la plataforma base, autenticación con email y contraseña, criaderos y onboarding. V1.0.3 sigue siendo la referencia funcional y la app móvil continúa usando su SQLite local hasta que cada módulo se reemplace por su cliente REST.

Rama de trabajo: `trabajo/migracion-nube` (desde `main`; rama única, sin PR; se fusiona a `main` solo cuando el usuario lo pida). Última actualización de este documento: 31 de octubre de 2026.

## Fases

### Fase 1 — Plataforma base: completada

- Proyecto TypeScript con Cloudflare Workers y Hono en `api/`.
- D1 con migraciones `0001`–`0004` y `GET /api/v1/health`.
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

Estado de los módulos (2026-11-03, rama `trabajo/migracion-nube`):

- **Jaulas**: implementado (API y cliente REST); `0005` aplicada en local y pruebas. Ampliado con Aves: `cantidadAves` real, `aves-historicas`, `historial` y baja que libera aves.
- **Aves**: implementado (API en `api/src/aves/`, migración `0006` con `aves`, `ave_evolucion`, `ave_historial`, `jaula_historial` y `diagnosticos_ave`, cliente `AveRepository.api.js` y fachadas de `AveRepository`, `CicloVidaRepository`, `EvolucionAveRepository` y `EstadoSaludRepository`). Probado en local e integración; **pendiente:** Worker de pruebas (`0006` remota y redespliegue) y teléfono. Limitaciones: foto local en `foto_r2_key`, vendidas/fallecidas sin `bajas_ave`, ciclo de vida y evolución en SQLite en modo API. Detalle en `documents/specs/aves.md`.
- **Cuidados de jaula**: implementado (2026-11-02). Migración `0007` (`alimentacion_jaula`, `bebida_jaula`, `sanidad_jaula`), API en `api/src/cuidados/` (`POST` alimentación, bebida y sanidad, `GET` alimentación; `GET /historial` de jaulas ahora con `fechaCreacion`) y clientes `Alimentacion/Bebida/SanidadJaula/Historial *.api.js` con fachadas. Probado en local, integración y Worker de pruebas; **pendiente:** teléfono y las alertas "Sin alimentación/bebida registrada hoy" (fase 6). Detalle en `documents/specs/cuidados-jaula.md`.
- **Salud**: implementado (2026-11-02). Migración `0008` (`tratamientos_ave`), API en `api/src/salud/` (`POST .../aves/:aveId/diagnosticos`, `GET .../aves/:aveId/salud`) y cliente `SaludRepository.{js,sqlite.js,api.js}` (`actualizarEstadoSaludAve` omitida por decisión del usuario). Excepción aprobada: dos `Alert` en `SaludAveScreen`. Probado en local, integración (54), unitarias/HTTP (203), Worker de pruebas y emulador; **pendiente:** teléfono. Detalle en `documents/specs/salud.md`.
- **Huevos**: implementado (2026-11-03). Migración `0009` (`huevos`), API en `api/src/huevos/` (`POST` y `GET .../aves/:aveId/huevos`, `GET .../huevos/siguiente-codigo` y `GET .../huevos/produccion/{resumen,ranking,por-dia,por-dia-historico,por-hora,por-jaula,por-ave,total}`; código `H`+6 dígitos por criadero; periodos en UTC) y clientes `HuevoRepository` y `ProduccionRepository` con fachadas. Excepción aprobada: un `Alert` de carga en `ProduccionHuevosScreen` (quinta; `DetalleAveScreen` y `RegistrarHuevoScreen.cargarAve` no se tocan). Probado en local, integración (72), unitarias/HTTP (222), Worker de pruebas y emulador; **pendiente:** teléfono; Alertas, Inicio y Reportes siguen en SQLite y el ciclo de vida del ave no muestra huevos hasta Genealogía. Detalle en `documents/specs/huevos.md`.
- **Orden siguiente:** Bajas, Finanzas, R2 (módulo aparte; claves propuestas `criaderos/{criaderoId}/aves/{aveId}/{evolucionId}.jpg`), Google Sign-In; Genealogía y Ciclo de vida (a la espera de indicación del usuario); después la fase 6 (Alertas, Inicio, Reportes).
- **Catálogos**: **implementado** en la rama `trabajo/migracion-nube`. Seis endpoints bajo `/api/v1/criaderos/:criaderoId/catalogos` (solo los 7 catálogos básicos), plantilla de criadero de 42 ítems, sin migración nueva y cliente de la app `ConfiguracionRepository.js` (conmutador) con `.sqlite.js` y `.api.js`. Validado con pruebas unitarias, HTTP e integración y con el Worker local. **Pendiente:** validar en el teléfono y redesplegar en el Worker de pruebas. Detalle en `documents/specs/catalogos.md`.

Puerta previa a Aves (actualizada 2026-10-31):

- PBKDF2 pasó a 100000 iteraciones (máximo de workerd). CPU medido: 13-20 ms por hash frente al límite de 10 ms del plan gratuito; el usuario decidió mantenerlo y el plan de su cuenta no se pudo confirmar.
- El PR de agentes ya está fusionado.
- No habrá PR de Jaulas: desde 2026-10-31 se trabaja en una sola rama (`trabajo/migracion-nube`) y se fusiona a `main` solo cuando el usuario lo pida.
- Pendiente de la puerta: validar Catálogos en el teléfono y redesplegar el Worker de pruebas.

### Fase 5 — Funcionalidades derivadas

- Bajas (muerte y venta, con sus movimientos financieros).
- Evolución física, genealogía y ciclo de vida.
- Alimentación, bebida y sanidad de jaula.
- Clientes derivados de las ventas.

### Fase 6 — Dashboard, reportes y alertas

- Dashboard, producción de huevos, alertas, reportes y exportación.
- Dependen de los CRUD transaccionales anteriores.
- **Pendientes de migración a la API:** Alertas, Inicio y Reportes siguen leyendo el SQLite local (`AlertasRepository`, `DashboardRepository`, `ReportesRepository`). Mientras tanto no ven los datos de la nube (p. ej. las alertas "Sin alimentación registrada hoy" no ven los cuidados de jaula) y dos cuentas en el mismo teléfono comparten los contadores de Inicio.

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
