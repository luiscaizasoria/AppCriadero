---
paths:
  - "api/test/**"
  - "api/vitest.config.ts"
---

# Pruebas del backend

- Tres niveles: unitarias de service con fakes (`test/helpers/fake-*.repository.ts`), HTTP con `app.request()` y routers de prueba con JWT, e integración D1 local (`test/integration/`, `better-sqlite3` mediante `local-d1.adapter.ts`).
- Nombres descriptivos en español con el formato `debe …`.
- Unitarias/HTTP: `npm test -- --run`. Integración: `npm run test:integration`, siempre por separado.
- La integración es **destructiva** para el D1 local de desarrollo (borra `users`, `criaderos`, `catalogo_items`, `criadero_configuracion`) y el archivo `.sqlite` de Wrangler cambia de hash. Nunca apuntarla a una base remota; confirmar antes de ejecutarla.
- No reintroducir `@cloudflare/vitest-plugin` ni `cloudflare:test`.
- Si se añade un fake de repository, mantenerlo alineado con la interfaz real.
- No incluir secretos reales en tests; usar valores de prueba.
- Tras editar: `git diff --check`.
