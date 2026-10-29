---
paths:
  - "**/.dev.vars*"
  - "**/.env*"
  - "api/wrangler.jsonc"
---

# Secretos

- No leer, imprimir ni copiar `api/.dev.vars` ni archivos `.env*`; solo existen versionados los `*.example`.
- Variable actual: `JWT_SECRET` (mínimo 32 caracteres). Previstas: `GOOGLE_CLIENT_ID(S)` y configuración de R2; los nombres se definen al implementarlas.
- Nunca escribir secretos reales en código, tests, documentación, commits ni mensajes.
- `JWT_SECRET` faltante debe producir `500 CONFIGURATION_ERROR`, no un valor por defecto.
- Los secretos remotos se gestionan con Wrangler (`wrangler secret`), solo con orden expresa.
- Antes de `git add`, comprobar que no entra ningún archivo con credenciales.
