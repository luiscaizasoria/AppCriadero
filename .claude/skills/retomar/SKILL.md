---
name: retomar
description: Resume dónde quedó el proyecto (rama, lo último hecho, lo pendiente y el siguiente paso) al empezar una sesión.
disable-model-invocation: true
---

# Retomar

1. Usa el estado (`documents/estado-actual.md`, cargado por el import de `CLAUDE.md`) y las últimas entradas de la bitácora que mostró el hook de inicio.
2. Solo si no aparecen en el contexto: lee `documents/estado-actual.md` y las 3 primeras entradas (`## ...`) de `documents/bitacora.md`. No leas nada más.
3. Comprueba la rama con `git branch --show-current` y `git status --short`.
4. Responde en **máximo 10 líneas**: rama, lo último hecho, lo pendiente y el siguiente paso exacto.
