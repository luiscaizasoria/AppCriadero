# V2_ROADMAP — Criadero Kikirikis

## Estado actual

V2 es **online-first** (D1 y R2 como fuentes de verdad, sin sincronización offline). La API en `api/` ya tiene la plataforma base, autenticación con email y contraseña, criaderos y onboarding. V1.0.3 sigue siendo la referencia funcional y la app móvil continúa usando su SQLite local hasta que cada módulo se reemplace por su cliente REST.

Rama de trabajo conocida: `feature/v2-criadero-onboarding` (base `v2`). Última actualización de este documento: 29 de octubre de 2026.

## Fases

### Fase 1 — Plataforma base: completada

- Proyecto TypeScript con Cloudflare Workers y Hono en `api/`.
- D1 con migraciones `0001`–`0004` y `GET /api/v1/health`.
- Arquitectura `routes -> factory -> service -> repository` y composición de `app.ts` inyectable.
- Pruebas unitarias, HTTP e integración con D1 local.

### Fase 2 — Autenticación y criaderos: en curso

Completado:

- Registro y login con email y contraseña; JWT propio (access token de 1 hora); middleware.
- Creación de criadero con 38 items de catálogo iniciales y configuración.
- Onboarding: configuración principal, finalizar y consultar estado; control de propiedad y de concurrencia.

Pendiente:

- Google Sign-In (`POST /api/v1/auth/google`).
- `GET /api/v1/auth/me`.
- Listado de criaderos del usuario (y detalle, actualización y selección de criadero activo).
- Decidir el refresh token y el registro (`active` y verificación de correo). Ver "Riesgos y decisiones abiertas" en `V2_ARCHITECTURA.md`.

### Fase 3 — R2 e imágenes

- Bucket y binding, política de acceso, validación de MIME y tamaño, claves de objeto no predecibles con aislamiento por usuario y criadero.
- Estrategia de subida, reemplazo y eliminación; referencias en D1 (`r2_object_key`); compensación entre D1 y R2.
- Campos afectados de V1: foto del ave, foto de evolución y logo del criadero.

### Fase 4 — Migración de repositorios de V1

Para cada módulo: leer su pantalla y su repositorio en V1, redactar la spec en `documents/specs/`, definir esquema y contrato de API, implementar permisos y comprobar que los datos pueden conservarse. Orden:

1. `AveRepository`
2. `JaulaRepository`
3. `HuevoRepository`
4. `SaludRepository`
5. `FinanzasRepository`

Ave y Jaula tienen referencias cruzadas: diseñar las claves foráneas con cuidado y validarlas contra el código real de V1.

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

- `documents/V1_BASELINE.md`: comportamiento existente de V1.
- `documents/V2_ARCHITECTURA.md`: decisiones técnicas y riesgos abiertos.
- `documents/V2_MODELO_DATOS.md`: esquema D1 y modelo futuro (borrador).
- `documents/CriaderoKikirikis_V1_Analisis_Movil_y_Mapeo_API.md`: análisis de V1 y mapeo repositorio → endpoint.
- `documents/traspaso/`: decisiones vigentes y su historia.
- `documents/archive/`: detalle histórico para consultas puntuales.
