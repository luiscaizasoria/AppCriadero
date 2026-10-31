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

Estado de los módulos (2026-10-31, rama `trabajo/migracion-nube`):

- **Jaulas**: implementado (API y cliente REST); `0005` solo aplicada en local y pruebas.
- **Catálogos**: **implementado** en la rama `trabajo/migracion-nube`. Seis endpoints bajo `/api/v1/criaderos/:criaderoId/catalogos` (solo los 7 catálogos básicos), plantilla de criadero de 42 ítems, sin migración nueva (siguiente: `0006`) y cliente de la app `ConfiguracionRepository.js` (conmutador) con `.sqlite.js` y `.api.js`. Validado con pruebas unitarias, HTTP e integración y con el Worker local. **Pendiente:** validar en el teléfono y redesplegar en el Worker de pruebas. Detalle en `documents/specs/catalogos.md`.

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
