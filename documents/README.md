# Documentación del proyecto Criadero Kikirikis

## Orden de autoridad

Ante una contradicción prevalece, de mayor a menor:

1. Código real.
2. `CLAUDE.md` (raíz).
3. `documents/traspaso/` (decisiones vigentes online-first).
4. Documentos V2 antiguos (`V2_*.md`) y `archive/`.

`AGENTS.md` pertenece a la V1 móvil y está desfasado en sincronización, SQLite y etapas; no se usa para decidir sobre V2.

## Índice

| Ruta | Contenido |
|---|---|
| `traspaso/CLAUDE_PROJECT_HANDOFF_CRIADERO_KIKIRIKIS.md` | Contexto maestro: decisiones, estado, modelo D1 actual, auth, endpoints, modelo funcional V1 y mapeo V1 → API V2 |
| `traspaso/CIERRE_FINAL_TRASPASO_CRIADERO_KIKIRIKIS_V2.md` | Razones de las decisiones, lógica de negocio de V1, DDL borrador (muy largo) |
| `traspaso/RESPUESTAS_CUESTIONARIO_TRASPASO_CRIADERO_KIKIRIKIS_V2.md` | Estado de repositorio, migraciones, Cloudflare |
| `V1_BASELINE.md` | Funciones y restricciones de V1 |
| `V2_ARCHITECTURA.md` | Decisiones técnicas de V2 (desfasado, ver pendientes) |
| `V2_ROADMAP.md` | Etapas de V2 (desfasado, ver pendientes) |
| `V2_MODELO_DATOS.md` | Modelo de datos propuesto (desfasado, ver pendientes) |
| `specs/` | Especificaciones por módulo, siguiendo `specs/_plantilla.md` |
| `archive/` | Histórico; consultar solo si se pide o falta un detalle |

## Notas

- `documents/arquitectura/` **no existe**: los documentos del handoff que la citan están desactualizados. La ruta real es `documents/`. El archivo `V2_ARQUITECTURA.md` que mencionan se llama en realidad `V2_ARCHITECTURA.md`.
- El archivo `CriaderoKikirikis_V1_Analisis_Movil_y_Mapeo_API.md`, citado por el handoff, **no existe en el repositorio**. Su contenido útil (mapeo repositorio V1 → API) está resumido en la sección 20 del handoff.
- `traspaso/` contiene los documentos de traspaso y aún no está versionado en Git.

## PENDIENTE: actualizar a online-first

Estos documentos siguen describiendo offline-first, SQLite local con sincronización y/o refresh token, y deben actualizarse para declarar: D1 = fuente de verdad, R2 = imágenes, Google + JWT propio, sin sincronización bidireccional, aves individuales, sin lotes.

- [ ] `V2_ARCHITECTURA.md`: menciona offline-first y SQLite en el dispositivo; pide access y refresh token (hoy solo hay access token de 1 h) y OpenAPI/roles/ambientes DEV-QA-PROD sin estado.
- [ ] `V2_ROADMAP.md`: la etapa 0 y "rama `feature/v2-docs`" ya no reflejan el estado real (hay API implementada); la etapa 4 es "sincronización offline", fuera del alcance.
- [ ] `V2_MODELO_DATOS.md`: ~36 menciones de offline/sincronización/lotes/refresh; revisar el modelo contra el esquema D1 real (migraciones `0001`–`0004`).
- [ ] Análisis de V1 (`CriaderoKikirikis_V1_Analisis_Movil_y_Mapeo_API.md`): no está en el repositorio; recuperarlo o regenerarlo y corregir su recomendación de SQLite como caché con sincronización.
- [ ] `V1_BASELINE.md`: revisar la mención de sincronización.
- [ ] `AGENTS.md` (decisión del usuario: queda intacto por ahora): reglas de SQLite/sincronización y etapas desfasadas; omite el tab Inicio.
