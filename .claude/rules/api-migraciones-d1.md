---
paths:
  - "api/migrations/**"
  - "api/wrangler.jsonc"
---

# Migraciones D1

- Nunca editar una migración ya aplicada (`0001`–`0004`). Todo cambio va en un archivo nuevo `NNNN_descripcion.sql` (la siguiente es `0005`). Orden decidido: `0005` = solo jaulas; `0006` = aves, ave_evolucion, ave_historial y jaula_historial.
- Antes de escribir una migración, revisar el esquema actual (`users`, `criaderos`, `catalogos`, `catalogo_items`, `criadero_configuracion`) y la spec del módulo en `documents/specs/` y el modelo en `documents/arquitectura/modelo-datos-v2.md` (su DDL es borrador; prevalecen el código de V1 y la spec). Las tablas replican las de V1.
- Convenciones de tablas: `id TEXT` (UUID v7), `created_at`, `updated_at`; `deleted_at` donde V1 da de baja o desactiva; entidades de negocio con `criadero_id` y FK; sin `user_id` redundante. No añadir CHECK, límites ni columnas que V1 no tenga (las peticiones no exigen `version`).
- Foto/archivos: `r2_object_key` (no URI local ni BLOB).
- Cambios en tablas con FK: considerar referencias circulares; separar en tablas auxiliares si hace falta (como `criadero_configuracion`).
- Índices únicos parciales con `WHERE deleted_at IS NULL` cuando exista soft delete.
- Aplicar solo en local: `npx wrangler d1 migrations apply criadero-kikirikis-dev --local`. Cualquier `--remote` requiere orden expresa.
- No cambiar `database_id`, bindings ni otra configuración de Cloudflare sin que se pida.
- Tras una migración, actualizar el helper `api/test/helpers/migrations.ts` solo si es necesario y correr `npm run test:integration` (con confirmación).
