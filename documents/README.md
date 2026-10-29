# Documentación del proyecto Criadero Kikirikis

## Orden de autoridad

Ante una contradicción prevalece, de mayor a menor:

1. Código real.
2. `CLAUDE.md` (raíz).
3. `documents/traspaso/` (decisiones vigentes online-first).
4. Documentos V2 (`V2_*.md`) y el análisis de V1, que ya reflejan online-first pero resumen lo anterior.
5. `archive/` y `V1_BASELINE.md`: referencia histórica.

`AGENTS.md` pertenece a la V1 móvil: se mantiene para `src/` y remite a `CLAUDE.md` como fuente principal.

## Índice

| Ruta | Contenido |
|---|---|
| `traspaso/CLAUDE_PROJECT_HANDOFF_CRIADERO_KIKIRIKIS.md` | Contexto maestro: decisiones, estado, modelo D1 actual, auth, endpoints, modelo funcional V1 y mapeo V1 → API V2 |
| `traspaso/CIERRE_FINAL_TRASPASO_CRIADERO_KIKIRIKIS_V2.md` | Razones de las decisiones, lógica de negocio de V1, DDL borrador y Anexo B (muy largo) |
| `traspaso/RESPUESTAS_CUESTIONARIO_TRASPASO_CRIADERO_KIKIRIKIS_V2.md` | Estado de repositorio, migraciones y Cloudflare |
| `V2_ARCHITECTURA.md` | Arquitectura online-first, identidad (Google + JWT propio), stack, **riesgos y decisiones abiertas** |
| `V2_ROADMAP.md` | Siete fases de trabajo y estado de cada una |
| `V2_MODELO_DATOS.md` | Estado real de D1 (migraciones `0001`–`0004`), decisiones de modelo y **borrador no aprobado** del modelo futuro |
| `CriaderoKikirikis_V1_Analisis_Movil_y_Mapeo_API.md` | Análisis completo de la app V1 y mapeo repositorio → endpoint (Anexo B del cierre, literal), con la nota de decisión arquitectónica posterior |
| `V1_BASELINE.md` | Funciones y restricciones de V1 (referencia histórica, sin cambios) |
| `specs/` | Especificaciones por módulo, siguiendo `specs/_plantilla.md` |
| `archive/` | Histórico; consultar solo si se pide o falta un detalle |

## Notas

- `documents/arquitectura/` **no existe**: los documentos del handoff que la citan están desactualizados. La ruta real es `documents/`. El archivo `V2_ARQUITECTURA.md` que mencionan se llama en realidad `V2_ARCHITECTURA.md`.
- El archivo `CriaderoKikirikis_V1_Analisis_Movil_y_Mapeo_API.md`, que el handoff citaba como existente, no estaba en el repositorio; se creó a partir del Anexo B del cierre de traspaso.
- `traspaso/` contiene los documentos de traspaso y aún no está versionado en Git.
- Las specs de cada módulo se redactan desde el código real de V1, no desde el DDL borrador de `V2_MODELO_DATOS.md`.

## Resuelto (online-first)

- [x] `V2_ARCHITECTURA.md`: reescrito (online-first, Google → JWT propio, solo access token, sección de riesgos).
- [x] `V2_ROADMAP.md`: reorganizado en siete fases; sin etapa de sincronización.
- [x] `V2_MODELO_DATOS.md`: estado real de D1, decisiones #3 y #4 reemplazadas, plantilla de 38 items, borrador del modelo futuro.
- [x] Análisis de V1: creado desde el Anexo B, con la decisión arquitectónica posterior.
- [x] `AGENTS.md`: edición mínima (remite a `CLAUDE.md`, cinco tabs, SQLite V7 → V8 solo para V1, sin sincronización).

## PENDIENTE

- [ ] `V1_BASELINE.md`: su apartado "Alcance aún no implementado en V1" todavía menciona la sincronización offline como trabajo de V2. Se dejó intacto a propósito (referencia histórica); actualizar solo si se decide.
- [ ] Decidir si `documents/traspaso/` se versiona y si se elimina o archiva su contenido duplicado.
- [ ] Redactar las specs de módulo en `specs/` (Aves, Jaulas, Huevos, Salud, Finanzas…) desde el código de V1.
- [ ] Validar el borrador del modelo futuro contra V1 (`HEMRA`/`HEMBRA`, dinero, soft delete de movimientos, origen de movimientos…) antes de crear migraciones.
- [ ] Decidir el destino de `BackupRepository` en V2.
- [ ] Resolver los riesgos listados en `V2_ARCHITECTURA.md` (PBKDF2 en Worker real, rate limiting, CORS, CI, refresh token, `active` en el registro).
