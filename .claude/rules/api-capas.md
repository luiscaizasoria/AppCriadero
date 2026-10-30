---
paths:
  - "api/src/**/*.ts"
---

# Capas del backend (api/src)

Flujo obligatorio: `routes -> factory -> service -> repository -> D1`.

- `*.routes.ts`: parsea parámetros y body, aplica `auth.middleware`, obtiene `c.get("user")`, valida ownership y mapea errores del dominio a HTTP. Sin SQL y sin lógica de negocio.
- `*.factory.ts`: único lugar que construye repositorio + servicio (D1 en producción, fakes en tests).
- `*.service.ts`: reglas de negocio, idempotencia, concurrencia. No importa Hono ni D1 directamente.
- `*.repository.ts`: SQL con prepared statements (`prepare().bind()`), `db.batch()` cuando la operación deba ser atómica. Sin lógica HTTP.
- `*.types.ts`: contratos de request/response y errores.

Reglas de código:

- Rutas bajo `/api/v1`. `userId` sale del JWT, nunca del body.
- Ownership antes de consultar o modificar: `criaderos.id = ? AND user_id = ? AND deleted_at IS NULL`; si no, `403 FORBIDDEN`.
- Entidades de negocio con `criadero_id`; no agregar `user_id` por costumbre.
- Soft delete (`deleted_at`) donde V1 da de baja o desactiva. Las peticiones de los módulos nuevos no exigen `version` (V1 no tiene concurrencia); los módulos ya implementados (`criaderos`) conservan la suya.
- Replicar V1: mismos códigos y mensajes de error y mismas validaciones que el repositorio V1; no añadir reglas más estrictas.
- En joins usar alias para columnas repetidas (`c.version AS criadero_version`).
- Respuestas: `{ success: true, data }` o `{ success: false, error, message }` con códigos estables; reutilizar los existentes.
- TypeScript explícito; evitar `any`. Nombres de dominio en español; API camelCase, SQL snake_case.
- Un módulo nuevo sigue el patrón de `api/src/criaderos/` y se registra en `api/src/app.ts`.
