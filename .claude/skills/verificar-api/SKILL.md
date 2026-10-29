---
name: verificar-api
description: Verifica el backend api/ con typecheck y las pruebas unitarias/HTTP; la integración D1 solo con confirmación. Úsala tras cambiar código de api/.
allowed-tools: Bash(npm run typecheck) Bash(npm test *) Bash(git diff *) Bash(git status *)
---

# Verificar la API

Ejecuta desde `api/` y reporta el resultado real de cada paso (no resumas fallos como éxito):

1. `npm run typecheck`
2. `npm test -- --run` (unitarias y HTTP)
3. `git diff --check` (espacios finales y CRLF)
4. `git status --short`

**Pruebas de integración:** `npm run test:integration` borra datos del D1 local de Wrangler. No lo ejecutes sin que el usuario lo confirme en esta sesión; si no hay confirmación, indícalo como "no ejecutado".

Si algo falla, muestra el error y la causa probable; no modifiques archivos para "hacer pasar" las pruebas sin explicarlo. No hagas commit, push ni deploy.
