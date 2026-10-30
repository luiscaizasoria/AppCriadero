---
paths:
  - "documents/**"
---

# Documentación (`documents/`)

Estructura:

- `README.md`: mapa completo del proyecto y orden de autoridad. **Todo documento nuevo debe quedar en este índice.**
- `arquitectura/`: arquitectura V2 (`arquitectura-v2.md`), modelo de datos (`modelo-datos-v2.md`) y hoja de ruta (`roadmap-v2.md`).
- `referencia-v1/`: resumen de V1 (`baseline-v1.md`) y análisis con mapeo repositorio → endpoint (`analisis-v1-mapeo-api.md`; su Anexo B es literal y no se edita).
- `specs/`: una spec por módulo (`<modulo>.md`) y `plantilla-spec.md`.
- `historico/`: documentos antiguos y copias de archivos retirados; no se edita ni se mueve.
- `traspaso/`: documentos de traspaso, **solo local** (ignorado por Git, respaldado fuera del repositorio); no se edita ni se versiona.

Reglas:

- Nombres de archivo en minúsculas con guiones (`arquitectura-v2.md`). No dejar documentos sueltos en la raíz de `documents/` salvo `README.md`.
- Orden de autoridad ante contradicciones: código real > `CLAUDE.md` > `documents/arquitectura/` > specs > `documents/historico/`.
- Al mover o renombrar un documento, actualizar todas las referencias (`grep` del nombre antiguo) y el índice.
